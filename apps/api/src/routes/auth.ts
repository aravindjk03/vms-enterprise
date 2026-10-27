import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ROLE_PERMISSIONS } from '@vms/permissions';
import type { RouteContext } from '../app.js';
import { writeAudit } from '../audit.js';
import { withTenant, type Tx } from '../db.js';
import { isAdministrator, loadUserContext, type AuthenticatedUser } from '../context.js';
import { HttpError } from '../errors.js';
import { hashPasswordAsync, PASSWORD_HISTORY_LIMIT, passwordPolicyErrors, verifyPasswordAsync } from '../security/passwords.js';
import { hashRefreshToken, issueAccessToken, issueMfaChallenge, newRefreshToken, verifyMfaChallenge } from '../security/tokens.js';
import {
  decryptSecret,
  deriveMfaKey,
  encryptSecret,
  generateRecoveryCodes,
  generateTotpSecret,
  matchRecoveryCode,
  otpauthUrl,
  verifyTotp,
} from '../security/totp.js';

const REFRESH_COOKIE = 'vms_rt';
const SESSION_HINT_COOKIE = 'vms_session';
const REFRESH_PATH = '/api/v1/auth';
const INVALID_LOGIN = 'Invalid credentials. Please verify your login details and try again.';

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(256),
  newPassword: z.string().min(1).max(256),
});

const LoginSchema = z.object({
  tenantCode: z.string().trim().min(2).max(32),
  username: z.string().trim().min(2).max(128),
  password: z.string().min(1).max(256),
});

const SecondFactorSchema = z.object({
  challenge: z.string().min(10).max(2048),
  code: z.string().trim().min(6).max(32),
});
const PasswordOnly = z.object({ currentPassword: z.string().min(1).max(256) });
const CodeOnly = z.object({ code: z.string().trim().min(6).max(32) });
const PasswordAndCode = PasswordOnly.extend({ code: z.string().trim().min(6).max(32) });

/** Shown as the account name in authenticator apps. */
const MFA_ISSUER = 'VMS Enterprise';

function readCookie(request: FastifyRequest, name: string): string | undefined {
  const raw = request.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/**
 * Sets the refresh cookie (HttpOnly, auth path only) plus a readable hint cookie that carries no
 * secret: it only tells the console that a session may exist, so a signed-out page load does not
 * send a refresh request that is bound to fail.
 */
function setRefreshCookie(reply: FastifyReply, token: string, maxAgeSeconds: number, secure: boolean): void {
  const tail = [`Max-Age=${maxAgeSeconds}`, 'SameSite=Strict', ...(secure ? ['Secure'] : [])];
  reply.header('Set-Cookie', [
    [`${REFRESH_COOKIE}=${encodeURIComponent(token)}`, `Path=${REFRESH_PATH}`, 'HttpOnly', ...tail].join('; '),
    [`${SESSION_HINT_COOKIE}=${token ? '1' : ''}`, 'Path=/', ...tail].join('; '),
  ]);
}

function clearRefreshCookie(reply: FastifyReply, secure: boolean): void {
  setRefreshCookie(reply, '', 0, secure);
}

/** Cookie-authenticated endpoints require a custom header, which cross-site forms cannot send. */
function requireCsrfHeader(request: FastifyRequest): void {
  if (request.headers['x-requested-with'] !== 'vms-web') {
    throw new HttpError(403, 'CSRF_REJECTED', 'Missing anti-forgery header.');
  }
}

export function describeUser(user: AuthenticatedUser) {
  const roles = [user.role, ...(user.roles || [])];
  return {
    userId: user.userId,
    tenantId: user.tenantId,
    username: user.username,
    fullName: user.fullName,
    role: user.role,
    roles,
    siteIds: user.assignedSiteIds || [],
    defaultSiteId: user.siteId ?? null,
    permissions: Array.from(new Set(roles.flatMap(r => ROLE_PERMISSIONS[r] || []))),
    email: user.email,
    organizationName: user.organizationName,
    mustChangePassword: user.mustChangePassword,
    mfaEnabled: user.mfaEnabled,
    mfaEnrollmentRequired: user.mfaEnrollmentRequired,
  };
}

export async function registerAuthRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  const { config, db } = ctx;
  const secureCookies = config.secureCookies ?? config.env === 'production';
  const reuseGraceSeconds = config.refreshReuseGraceSeconds ?? 10;

  async function startSession(tx: Tx, user: AuthenticatedUser, request: FastifyRequest, reply: FastifyReply) {
    const refresh = newRefreshToken();
    const expires = new Date(Date.now() + config.refreshTokenTtlSeconds * 1000);
    const { rows } = await tx.query<{ session_id: string }>(
      `INSERT INTO user_sessions (tenant_id, user_id, refresh_token_hash, expires_at, created_ip, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING session_id`,
      [user.tenantId, user.userId, refresh.hash, expires, request.ip, String(request.headers['user-agent'] || '').slice(0, 512)]
    );
    const sessionId = rows[0].session_id;
    const access = issueAccessToken({ userId: user.userId, tenantId: user.tenantId, sessionId }, config.jwtSecret, config.accessTokenTtlSeconds);
    setRefreshCookie(reply, refresh.token, config.refreshTokenTtlSeconds, secureCookies);
    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt.toISOString(),
      user: describeUser({ ...user, sessionId }),
    };
  }

  app.post('/api/v1/auth/login', async (request, reply) => {
    const body = LoginSchema.parse(request.body);
    const ipAllowed = ctx.rateLimiter.checkRateLimit(request.ip, 'LOGIN_IP').allowed;
    const accountAllowed = ctx.rateLimiter.checkRateLimit(`${body.tenantCode}:${body.username.toLowerCase()}`, 'LOGIN').allowed;
    if (!ipAllowed || !accountAllowed) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many sign-in attempts. Please wait a minute and try again.');
    }

    const { rows } = await db.query<{
      user_id: string;
      tenant_id: string;
      user_status: string;
      is_active: boolean;
      password_hash: string | null;
      locked_until: Date | null;
    }>('SELECT * FROM auth_lookup_login($1, $2)', [body.tenantCode, body.username]);
    const account = rows[0];

    // Always run the KDF so response time does not reveal whether the account exists.
    const passwordOk = await verifyPasswordAsync(body.password, account?.password_hash);
    const locked = !!account?.locked_until && account.locked_until.getTime() > Date.now();
    const usable = !!account && account.is_active && account.user_status === 'ACTIVE' && !!account.password_hash;

    if (!account || !usable || locked || !passwordOk) {
      if (account && account.password_hash && !locked) {
        await db.query('SELECT auth_record_login_attempt($1, false, $2, $3)', [account.user_id, config.maxFailedLogins, config.lockoutMinutes]);
      }
      if (account) {
        await withTenant(db, account.tenant_id, tx =>
          writeAudit(tx, {
            tenantId: account.tenant_id,
            actorId: account.user_id,
            actorRole: 'UNAUTHENTICATED',
            action: 'LOGIN_FAILED',
            entityType: 'USER',
            entityId: account.user_id,
            requestId: request.id,
            reason: locked ? 'account locked' : !usable ? 'account disabled or no credential' : 'bad password',
          })
        );
      }
      request.log.warn({ tenant: body.tenantCode }, 'failed login');
      throw new HttpError(401, 'INVALID_CREDENTIALS', INVALID_LOGIN);
    }

    // With two-step verification the password alone opens nothing: the client exchanges a short-lived
    // challenge plus a code for the session. Failed codes count towards the same lockout as passwords.
    const mfa = await withTenant(db, account.tenant_id, tx =>
      tx.query<{ enabled: boolean }>('SELECT enabled_at IS NOT NULL AS enabled FROM user_mfa WHERE user_id = $1', [account.user_id])
    );
    if (mfa.rows[0]?.enabled) {
      const challenge = issueMfaChallenge({ userId: account.user_id, tenantId: account.tenant_id }, config.jwtSecret);
      return { mfaRequired: true, challenge: challenge.token, challengeExpiresAt: challenge.expiresAt.toISOString() };
    }
    return completeLogin(account.user_id, account.tenant_id, request, reply, null);
  });

  async function completeLogin(userId: string, tenantId: string, request: FastifyRequest, reply: FastifyReply, how: string | null) {
    await db.query('SELECT auth_record_login_attempt($1, true, $2, $3)', [userId, config.maxFailedLogins, config.lockoutMinutes]);
    return withTenant(db, tenantId, async tx => {
      const user = await loadUserContext(tx, userId, '');
      if (!user) throw new HttpError(401, 'INVALID_CREDENTIALS', INVALID_LOGIN);
      const result = await startSession(tx, user, request, reply);
      await writeAudit(tx, {
        tenantId: user.tenantId,
        actorId: user.userId,
        actorRole: user.role,
        action: 'LOGIN_SUCCESS',
        entityType: 'USER',
        entityId: user.userId,
        requestId: request.id,
        reason: how ?? undefined,
      });
      return result;
    });
  }

  const mfaKey = deriveMfaKey(config.mfaEncryptionKey ?? config.jwtSecret);

  /** Decrypts a stored secret; a changed key is an operator problem, never counted against the user. */
  function readSecret(stored: string, request: FastifyRequest): string {
    try {
      return decryptSecret(stored, mfaKey);
    } catch {
      request.log.error('two-step secret could not be decrypted (MFA_ENCRYPTION_KEY or JWT_SECRET changed?)');
      throw new HttpError(409, 'MFA_SECRET_UNREADABLE', 'Two-step verification has to be set up again. Ask an administrator to reset it.');
    }
  }

  // Second sign-in step: a code from the authenticator app, or one of the single-use recovery codes.
  app.post('/api/v1/auth/login/verify', async (request, reply) => {
    const body = SecondFactorSchema.parse(request.body);
    const claims = verifyMfaChallenge(body.challenge, config.jwtSecret);
    if (!claims) throw new HttpError(401, 'MFA_CHALLENGE_EXPIRED', 'This sign-in has expired. Please sign in again.');
    if (!ctx.rateLimiter.checkRateLimit(`mfa:${claims.sub}`, 'LOGIN').allowed) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Please wait a minute and try again.');
    }
    const outcome = await withTenant(db, claims.tid, async tx => {
      const { rows } = await tx.query<{
        is_active: boolean;
        status: string;
        locked_until: Date | null;
        secret_encrypted: string;
        enabled_at: Date | null;
        last_used_step: string;
        recovery_code_hashes: string[];
      }>(
        `SELECT u.is_active, u.status, c.locked_until, m.secret_encrypted, m.enabled_at, m.last_used_step, m.recovery_code_hashes
           FROM users u JOIN user_credentials c ON c.user_id = u.user_id JOIN user_mfa m ON m.user_id = u.user_id
          WHERE u.user_id = $1 FOR UPDATE OF m`,
        [claims.sub]
      );
      const r = rows[0];
      const locked = !!r?.locked_until && r.locked_until.getTime() > Date.now();
      let how: string | null = null;
      if (r && r.enabled_at && r.is_active && r.status === 'ACTIVE' && !locked) {
        const step = verifyTotp(readSecret(r.secret_encrypted, request), body.code.replace(/\s/g, ''), Number(r.last_used_step));
        if (step !== null) {
          await tx.query('UPDATE user_mfa SET last_used_step = $2, updated_at = now() WHERE user_id = $1', [claims.sub, step]);
          how = 'two-step verification: authenticator app';
        } else {
          const index = matchRecoveryCode(body.code, r.recovery_code_hashes);
          if (index >= 0) {
            await tx.query('UPDATE user_mfa SET recovery_code_hashes = $2, updated_at = now() WHERE user_id = $1', [
              claims.sub,
              r.recovery_code_hashes.filter((_, i) => i !== index),
            ]);
            await writeAudit(tx, {
              tenantId: claims.tid, actorId: claims.sub, actorRole: 'UNAUTHENTICATED', action: 'MFA_RECOVERY_CODE_USED',
              entityType: 'USER', entityId: claims.sub, requestId: request.id, reason: `${r.recovery_code_hashes.length - 1} recovery codes left`,
            });
            how = 'two-step verification: recovery code';
          }
        }
      }
      if (!how) {
        await writeAudit(tx, {
          tenantId: claims.tid, actorId: claims.sub, actorRole: 'UNAUTHENTICATED', action: 'LOGIN_FAILED',
          entityType: 'USER', entityId: claims.sub, requestId: request.id,
          reason: !r || !r.enabled_at ? 'two-step verification no longer set up' : locked ? 'account locked' : !r.is_active || r.status !== 'ACTIVE' ? 'account disabled' : 'wrong verification code',
        });
      }
      return { how, countAttempt: !!r && !locked };
    });
    if (!outcome.how) {
      if (outcome.countAttempt) {
        await db.query('SELECT auth_record_login_attempt($1, false, $2, $3)', [claims.sub, config.maxFailedLogins, config.lockoutMinutes]);
      }
      throw new HttpError(401, 'INVALID_CODE', 'That code is not correct or has already been used. Try the newest code from your app.');
    }
    return completeLogin(claims.sub, claims.tid, request, reply, outcome.how);
  });

  app.post('/api/v1/auth/refresh', async (request, reply) => {
    requireCsrfHeader(request);
    const token = readCookie(request, REFRESH_COOKIE);
    if (!token) throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');

    const { rows } = await db.query<{ session_id: string; tenant_id: string; user_id: string; expires_at: Date; revoked_at: Date | null }>(
      'SELECT * FROM auth_lookup_session($1)',
      [hashRefreshToken(token)]
    );
    const session = rows[0];
    if (!session) {
      clearRefreshCookie(reply, secureCookies);
      throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
    }

    return withTenant(db, session.tenant_id, async tx => {
      if (session.revoked_at) {
        // Another tab refreshed with the same cookie moments ago: the token was rotated (its successor
        // was created in the same transaction), not stolen. The browser already holds the new cookie,
        // so the client retries; the cookie must not be cleared here or that new cookie would be lost.
        const rotatedJustNow = await tx.query(
          `SELECT 1 FROM user_sessions prior JOIN user_sessions successor
               ON successor.user_id = prior.user_id AND successor.created_at = prior.revoked_at
              AND successor.session_id <> prior.session_id
            WHERE prior.session_id = $1 AND prior.revoked_at > now() - make_interval(secs => $2)
            LIMIT 1`,
          [session.session_id, reuseGraceSeconds]
        );
        if (rotatedJustNow.rowCount) {
          return reply.code(409).send({
            error: { code: 'REFRESH_RACE', message: 'The session was refreshed in another tab. Retry.', requestId: request.id },
          });
        }
        // A rotated-out refresh token was replayed: treat as theft and end every session of the user.
        await tx.query('UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [session.user_id]);
        await writeAudit(tx, {
          tenantId: session.tenant_id,
          actorId: session.user_id,
          actorRole: 'UNAUTHENTICATED',
          action: 'REFRESH_TOKEN_REUSE',
          entityType: 'USER_SESSION',
          entityId: session.session_id,
          requestId: request.id,
          reason: 'revoked refresh token presented; all sessions revoked',
        });
        clearRefreshCookie(reply, secureCookies);
        return reply.code(401).send({ error: { code: 'SESSION_REVOKED', message: 'Session is no longer valid.', requestId: request.id } });
      }
      if (session.expires_at.getTime() <= Date.now()) {
        clearRefreshCookie(reply, secureCookies);
        throw new HttpError(401, 'SESSION_EXPIRED', 'Session expired. Please sign in again.');
      }
      const user = await loadUserContext(tx, session.user_id, session.session_id);
      if (!user) {
        clearRefreshCookie(reply, secureCookies);
        throw new HttpError(401, 'UNAUTHENTICATED', 'Authentication required.');
      }
      await tx.query('UPDATE user_sessions SET revoked_at = now() WHERE session_id = $1', [session.session_id]);
      return startSession(tx, user, request, reply);
    });
  });

  app.post('/api/v1/auth/logout', async (request, reply) => {
    requireCsrfHeader(request);
    const token = readCookie(request, REFRESH_COOKIE);
    if (token) {
      const { rows } = await db.query<{ session_id: string; tenant_id: string; user_id: string }>('SELECT * FROM auth_lookup_session($1)', [
        hashRefreshToken(token),
      ]);
      const session = rows[0];
      if (session) {
        await withTenant(db, session.tenant_id, async tx => {
          await tx.query('UPDATE user_sessions SET revoked_at = now() WHERE session_id = $1 AND revoked_at IS NULL', [session.session_id]);
          await writeAudit(tx, {
            tenantId: session.tenant_id,
            actorId: session.user_id,
            actorRole: 'USER',
            action: 'LOGOUT',
            entityType: 'USER_SESSION',
            entityId: session.session_id,
            requestId: request.id,
          });
        });
      }
    }
    clearRefreshCookie(reply, secureCookies);
    return reply.code(204).send();
  });

  app.get('/api/v1/auth/me', async request => ctx.asUser(request, async (_tx, user) => describeUser(user)));

  // Self-service password change; also how a user leaves a temporary (administrator-issued) password.
  app.post('/api/v1/auth/change-password', async request =>
    ctx.asUser(request, async (tx, user) => {
      const body = ChangePasswordSchema.parse(request.body);
      if (!ctx.rateLimiter.checkRateLimit(`password-change:${user.userId}`, 'LOGIN').allowed) {
        throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Please wait a minute and try again.');
      }
      const { rows } = await tx.query<{ password_hash: string }>('SELECT password_hash FROM user_credentials WHERE user_id = $1 FOR UPDATE', [user.userId]);
      if (!rows[0] || !(await verifyPasswordAsync(body.currentPassword, rows[0].password_hash))) {
        // Rate limited above; the rejected attempt is logged by the request logger, not the (rolled back) audit trail.
        request.log.warn({ userId: user.userId }, 'password change with wrong current password');
        throw new HttpError(400, 'INVALID_CURRENT_PASSWORD', 'The current password is not correct.');
      }
      const problems = passwordPolicyErrors(body.newPassword);
      if (problems.length) throw new HttpError(400, 'PASSWORD_POLICY', problems.join(' '));
      if (body.newPassword.toLowerCase().includes(user.username.toLowerCase())) {
        throw new HttpError(400, 'PASSWORD_POLICY', 'The password must not contain your username.');
      }
      const recent = await tx.query<{ password_hash: string }>(
        'SELECT password_hash FROM user_password_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
        [user.userId, PASSWORD_HISTORY_LIMIT]
      );
      for (const old of [rows[0].password_hash, ...recent.rows.map(r => r.password_hash)]) {
        if (await verifyPasswordAsync(body.newPassword, old)) {
          throw new HttpError(400, 'PASSWORD_REUSED', `Choose a password you have not used for your last ${PASSWORD_HISTORY_LIMIT} changes.`);
        }
      }
      const hash = await hashPasswordAsync(body.newPassword);
      await tx.query(
        `UPDATE user_credentials SET password_hash = $2, must_change_password = FALSE, password_changed_at = now(),
                failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = $1`,
        [user.userId, hash]
      );
      await tx.query(
        `INSERT INTO user_password_history (tenant_id, user_id, password_hash, set_by, reason) VALUES ($1, $2, $3, $2, 'SELF_CHANGE')`,
        [user.tenantId, user.userId, hash]
      );
      // Other devices must sign in again with the new password; this session continues.
      await tx.query('UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND session_id <> $2 AND revoked_at IS NULL', [
        user.userId,
        user.sessionId,
      ]);
      await writeAudit(tx, {
        tenantId: user.tenantId, actorId: user.userId, actorRole: user.role, action: 'PASSWORD_CHANGED',
        entityType: 'USER', entityId: user.userId, requestId: request.id,
      });
      return describeUser({ ...user, mustChangePassword: false });
    })
  );

  // ---------------------------------------------------------------------------
  // Two-step verification, managed by the user. Changes need the current password (and, to turn it
  // off, a current code), so a borrowed unlocked session cannot quietly remove the second factor.
  // ---------------------------------------------------------------------------

  async function requireCurrentPassword(tx: Tx, user: AuthenticatedUser, password: string, request: FastifyRequest) {
    if (!ctx.rateLimiter.checkRateLimit(`mfa-manage:${user.userId}`, 'LOGIN').allowed) {
      throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Please wait a minute and try again.');
    }
    const { rows } = await tx.query<{ password_hash: string }>('SELECT password_hash FROM user_credentials WHERE user_id = $1', [user.userId]);
    if (!rows[0] || !(await verifyPasswordAsync(password, rows[0].password_hash))) {
      request.log.warn({ userId: user.userId }, 'two-step change with wrong current password');
      throw new HttpError(400, 'INVALID_CURRENT_PASSWORD', 'The current password is not correct.');
    }
  }

  async function policyRequiresMfa(tx: Tx, user: AuthenticatedUser): Promise<boolean> {
    const { rows } = await tx.query<{ required: boolean }>('SELECT require_mfa_for_admins AS required FROM tenant_security_settings WHERE tenant_id = $1', [
      user.tenantId,
    ]);
    return rows[0]?.required === true && isAdministrator([user.role, ...(user.roles ?? [])]);
  }

  type MfaRow = { secret_encrypted: string; enabled_at: Date | null; last_used_step: string; recovery_code_hashes: string[] };
  const loadMfa = async (tx: Tx, userId: string) =>
    (await tx.query<MfaRow>('SELECT secret_encrypted, enabled_at, last_used_step, recovery_code_hashes FROM user_mfa WHERE user_id = $1 FOR UPDATE', [userId]))
      .rows[0];

  const audit = (tx: Tx, user: AuthenticatedUser, request: FastifyRequest, action: string) =>
    writeAudit(tx, { tenantId: user.tenantId, actorId: user.userId, actorRole: user.role, action, entityType: 'USER', entityId: user.userId, requestId: request.id });

  app.get('/api/v1/auth/mfa', async request =>
    ctx.asUser(request, async (tx, user) => {
      const { rows } = await tx.query<{ enabled_at: Date | null; codes: number }>(
        'SELECT enabled_at, cardinality(recovery_code_hashes) AS codes FROM user_mfa WHERE user_id = $1',
        [user.userId]
      );
      return {
        enabled: !!rows[0]?.enabled_at,
        enabledAt: rows[0]?.enabled_at ?? null,
        recoveryCodesLeft: rows[0]?.enabled_at ? rows[0].codes : 0,
        requiredByPolicy: await policyRequiresMfa(tx, user),
      };
    })
  );

  app.post('/api/v1/auth/mfa/setup', async request =>
    ctx.asUser(request, async (tx, user) => {
      const body = PasswordOnly.parse(request.body);
      await requireCurrentPassword(tx, user, body.currentPassword, request);
      const existing = await loadMfa(tx, user.userId);
      if (existing?.enabled_at) throw new HttpError(409, 'MFA_ALREADY_ENABLED', 'Two-step verification is already on.');
      const secret = generateTotpSecret();
      await tx.query(
        `INSERT INTO user_mfa (user_id, tenant_id, secret_encrypted) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO UPDATE SET secret_encrypted = EXCLUDED.secret_encrypted, enabled_at = NULL,
                last_used_step = 0, recovery_code_hashes = '{}', updated_at = now()`,
        [user.userId, user.tenantId, encryptSecret(secret, mfaKey)]
      );
      const account = user.organizationName ? `${user.username} (${user.organizationName})` : user.username;
      return { secret, otpauthUrl: otpauthUrl(MFA_ISSUER, account, secret) };
    })
  );

  app.post('/api/v1/auth/mfa/enable', async request =>
    ctx.asUser(request, async (tx, user) => {
      const body = CodeOnly.parse(request.body);
      if (!ctx.rateLimiter.checkRateLimit(`mfa-manage:${user.userId}`, 'LOGIN').allowed) {
        throw new HttpError(429, 'RATE_LIMITED', 'Too many attempts. Please wait a minute and try again.');
      }
      const row = await loadMfa(tx, user.userId);
      if (!row) throw new HttpError(409, 'MFA_SETUP_MISSING', 'Start the setup again.');
      if (row.enabled_at) throw new HttpError(409, 'MFA_ALREADY_ENABLED', 'Two-step verification is already on.');
      const step = verifyTotp(readSecret(row.secret_encrypted, request), body.code.replace(/\s/g, ''), 0);
      if (step === null) throw new HttpError(400, 'INVALID_CODE', 'That code is not correct. Check the time on your phone and try the newest code.');
      const recovery = generateRecoveryCodes();
      await tx.query('UPDATE user_mfa SET enabled_at = now(), last_used_step = $2, recovery_code_hashes = $3, updated_at = now() WHERE user_id = $1', [
        user.userId,
        step,
        recovery.hashes,
      ]);
      await audit(tx, user, request, 'MFA_ENABLED');
      return { recoveryCodes: recovery.codes, user: describeUser({ ...user, mfaEnabled: true, mfaEnrollmentRequired: false }) };
    })
  );

  app.post('/api/v1/auth/mfa/disable', async request =>
    ctx.asUser(request, async (tx, user) => {
      const body = PasswordAndCode.parse(request.body);
      if (await policyRequiresMfa(tx, user)) {
        throw new HttpError(403, 'MFA_REQUIRED_BY_POLICY', 'Your organization requires two-step verification for administrators.');
      }
      await requireCurrentPassword(tx, user, body.currentPassword, request);
      const row = await loadMfa(tx, user.userId);
      if (!row?.enabled_at) throw new HttpError(409, 'MFA_NOT_ENABLED', 'Two-step verification is not on.');
      const ok =
        verifyTotp(readSecret(row.secret_encrypted, request), body.code.replace(/\s/g, ''), Number(row.last_used_step)) !== null ||
        matchRecoveryCode(body.code, row.recovery_code_hashes) >= 0;
      if (!ok) throw new HttpError(400, 'INVALID_CODE', 'That code is not correct or has already been used.');
      await tx.query('DELETE FROM user_mfa WHERE user_id = $1', [user.userId]);
      await audit(tx, user, request, 'MFA_DISABLED');
      return describeUser({ ...user, mfaEnabled: false });
    })
  );

  app.post('/api/v1/auth/mfa/recovery-codes', async request =>
    ctx.asUser(request, async (tx, user) => {
      const body = PasswordOnly.parse(request.body);
      await requireCurrentPassword(tx, user, body.currentPassword, request);
      const row = await loadMfa(tx, user.userId);
      if (!row?.enabled_at) throw new HttpError(409, 'MFA_NOT_ENABLED', 'Two-step verification is not on.');
      const recovery = generateRecoveryCodes();
      await tx.query('UPDATE user_mfa SET recovery_code_hashes = $2, updated_at = now() WHERE user_id = $1', [user.userId, recovery.hashes]);
      await audit(tx, user, request, 'MFA_RECOVERY_CODES_REGENERATED');
      return { recoveryCodes: recovery.codes };
    })
  );

  // ---------------------------------------------------------------------------
  // The user's own signed-in devices. Each refresh rotates the session row, so the newest active row
  // per device shows when it was last used.
  // ---------------------------------------------------------------------------

  app.get('/api/v1/auth/sessions', async request =>
    ctx.asUser(request, async (tx, user) => {
      const { rows } = await tx.query<{ session_id: string; created_at: Date; expires_at: Date; created_ip: string | null; user_agent: string | null }>(
        `SELECT session_id, created_at, expires_at, created_ip, user_agent FROM user_sessions
          WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now() ORDER BY created_at DESC LIMIT 50`,
        [user.userId]
      );
      return {
        items: rows.map(r => ({
          id: r.session_id,
          current: r.session_id === user.sessionId,
          lastActiveAt: r.created_at,
          expiresAt: r.expires_at,
          ipAddress: r.created_ip,
          userAgent: r.user_agent,
        })),
      };
    })
  );

  app.post('/api/v1/auth/sessions/:id/revoke', async request =>
    ctx.asUser(request, async (tx, user) => {
      const { id } = request.params as { id: string };
      if (id === user.sessionId) throw new HttpError(400, 'CURRENT_SESSION', 'Use Sign out to end this session.');
      const { rowCount } = await tx.query(
        `UPDATE user_sessions SET revoked_at = now() WHERE session_id::text = $1 AND user_id = $2 AND revoked_at IS NULL`,
        [id, user.userId]
      );
      if (!rowCount) throw new HttpError(404, 'NOT_FOUND', 'Session not found.');
      await writeAudit(tx, {
        tenantId: user.tenantId, actorId: user.userId, actorRole: user.role, action: 'SESSION_REVOKED',
        entityType: 'USER_SESSION', entityId: id, requestId: request.id,
      });
      return { id };
    })
  );

  app.post('/api/v1/auth/sessions/revoke-others', async request =>
    ctx.asUser(request, async (tx, user) => {
      const { rowCount } = await tx.query(
        'UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND session_id <> $2 AND revoked_at IS NULL',
        [user.userId, user.sessionId]
      );
      await audit(tx, user, request, 'SESSIONS_REVOKED_OTHERS');
      return { revoked: rowCount ?? 0 };
    })
  );
}
