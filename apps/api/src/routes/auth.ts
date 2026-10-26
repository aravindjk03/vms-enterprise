import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { ROLE_PERMISSIONS } from '@vms/permissions';
import type { RouteContext } from '../app.js';
import { writeAudit } from '../audit.js';
import { withTenant, type Tx } from '../db.js';
import { loadUserContext, type AuthenticatedUser } from '../context.js';
import { HttpError } from '../errors.js';
import { verifyPasswordAsync } from '../security/passwords.js';
import { hashRefreshToken, issueAccessToken, newRefreshToken } from '../security/tokens.js';

const REFRESH_COOKIE = 'vms_rt';
const REFRESH_PATH = '/api/v1/auth';
const INVALID_LOGIN = 'Invalid credentials. Please verify your login details and try again.';

const LoginSchema = z.object({
  tenantCode: z.string().trim().min(2).max(32),
  username: z.string().trim().min(2).max(128),
  password: z.string().min(1).max(256),
});

function readCookie(request: FastifyRequest, name: string): string | undefined {
  const raw = request.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

function setRefreshCookie(reply: FastifyReply, token: string, maxAgeSeconds: number, secure: boolean): void {
  const attrs = [
    `${REFRESH_COOKIE}=${encodeURIComponent(token)}`,
    `Path=${REFRESH_PATH}`,
    `Max-Age=${maxAgeSeconds}`,
    'HttpOnly',
    'SameSite=Strict',
  ];
  if (secure) attrs.push('Secure');
  reply.header('Set-Cookie', attrs.join('; '));
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

    await db.query('SELECT auth_record_login_attempt($1, true, $2, $3)', [account.user_id, config.maxFailedLogins, config.lockoutMinutes]);
    return withTenant(db, account.tenant_id, async tx => {
      const user = await loadUserContext(tx, account.user_id, '');
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
      });
      return result;
    });
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
}
