import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { canAssignRole, canManageUserWithRoles, ROLE_PERMISSIONS, TENANT_WIDE_ROLES } from '@vms/permissions';
import type { EnterpriseRole } from '@vms/types';
import type { RouteContext } from '../app.js';
import { writeAudit } from '../audit.js';
import { authorize, isAdministrator, type AuthenticatedUser } from '../context.js';
import { isUuid, type Tx } from '../db.js';
import { HttpError, notFound } from '../errors.js';
import { generateTemporaryPassword, hashPasswordAsync } from '../security/passwords.js';

/**
 * Access administration: users, their roles, site access and credentials.
 *
 * Guards (all enforced here, whatever the UI shows):
 * - USER_MANAGE is required; tenant isolation comes from row-level security.
 * - Escalation: an administrator grants or removes only roles they may assign (canAssignRole) and
 *   manages only users whose every role they could have granted.
 * - Site scope: site administrators see and manage users of their own sites and grant only those sites.
 * - Self-protection: nobody changes their own roles, status or password through these endpoints.
 * - The tenant always keeps at least one active super administrator.
 * - Temporary passwords are returned once, never stored in plain text or written to the audit log.
 */

const ROLE_CODES = Object.keys(ROLE_PERMISSIONS) as EnterpriseRole[];
const RoleCode = z.enum(ROLE_CODES as [EnterpriseRole, ...EnterpriseRole[]]);
const Uuid = z.string().refine(isUuid, 'Invalid id');
const Reason = z.string().trim().min(3).max(500);
const Status = z.enum(['ACTIVE', 'SUSPENDED', 'INACTIVE']);

const UserCreate = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(64)
    .regex(/^[a-z0-9][a-z0-9._-]*$/, 'letters, digits, ".", "_" or "-"'),
  fullName: z.string().trim().min(2).max(255),
  email: z.string().trim().toLowerCase().email().max(255),
  roles: z.array(RoleCode).min(1).max(10),
  siteIds: z.array(Uuid).max(200).default([]),
  defaultSiteId: Uuid.optional(),
});

const UserUpdate = z
  .object({
    fullName: z.string().trim().min(2).max(255).optional(),
    email: z.string().trim().toLowerCase().email().max(255).optional(),
    status: Status.optional(),
    reason: Reason,
  })
  .refine(v => v.fullName !== undefined || v.email !== undefined || v.status !== undefined, { message: 'Nothing to change' });

const RolesUpdate = z.object({ roles: z.array(RoleCode).min(1).max(10), reason: Reason });
const SitesUpdate = z.object({ siteIds: z.array(Uuid).max(200), defaultSiteId: Uuid.optional(), reason: Reason });
const ReasonOnly = z.object({ reason: Reason });

const ListQuery = z.object({
  search: z.string().trim().max(100).optional(),
  role: RoleCode.optional(),
  status: Status.optional(),
  siteId: Uuid.optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

interface TargetUser {
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  status: string;
  is_active: boolean;
  roles: EnterpriseRole[];
  site_ids: string[];
}

const actorRoles = (user: AuthenticatedUser): EnterpriseRole[] => [user.role, ...(user.roles ?? [])];
const isTenantWide = (user: AuthenticatedUser) => actorRoles(user).some(r => TENANT_WIDE_ROLES.includes(r));
/** Users without any role act with the HOST baseline (see loadUserContext). */
const effectiveRoles = (roles: EnterpriseRole[]): EnterpriseRole[] => (roles.length ? roles : ['HOST']);

async function loadTarget(tx: Tx, id: string, lock = false): Promise<TargetUser> {
  if (!isUuid(id)) throw notFound('User');
  if (lock) await tx.query('SELECT 1 FROM users WHERE user_id = $1 FOR UPDATE', [id]);
  const { rows } = await tx.query<TargetUser>(
    `SELECT u.user_id, u.username::text, u.full_name, u.email::text, u.status, u.is_active,
            coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
            coalesce(array_agg(DISTINCT s.site_id) FILTER (WHERE s.site_id IS NOT NULL), '{}') AS site_ids
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.user_id
       LEFT JOIN roles r ON r.role_id = ur.role_id
       LEFT JOIN user_site_access s ON s.user_id = u.user_id
      WHERE u.user_id = $1
      GROUP BY u.user_id`,
    [id]
  );
  if (!rows[0]) throw notFound('User');
  return rows[0];
}

/** Site administrators only see users who have access to at least one of their sites. */
function visibleTo(actor: AuthenticatedUser, target: TargetUser): boolean {
  if (isTenantWide(actor)) return true;
  const scope = actor.assignedSiteIds ?? [];
  return target.site_ids.some(s => scope.includes(s));
}

function canManage(actor: AuthenticatedUser, target: TargetUser): boolean {
  if (target.user_id === actor.userId) return false;
  if (!canManageUserWithRoles(actorRoles(actor), effectiveRoles(target.roles))) return false;
  if (isTenantWide(actor)) return true;
  const scope = actor.assignedSiteIds ?? [];
  // A site administrator manages a user only when all of that user's sites are theirs.
  return target.site_ids.length > 0 && target.site_ids.every(s => scope.includes(s));
}

function requireManage(actor: AuthenticatedUser, target: TargetUser): void {
  if (!visibleTo(actor, target)) throw notFound('User');
  if (target.user_id === actor.userId) {
    throw new HttpError(403, 'FORBIDDEN', 'You cannot change your own access. Ask another administrator.');
  }
  if (!canManage(actor, target)) {
    throw new HttpError(403, 'FORBIDDEN', 'This user has access you are not allowed to administer.');
  }
}

async function assertAnotherSuperAdmin(tx: Tx, excludingUserId: string): Promise<void> {
  const { rows } = await tx.query<{ n: number }>(
    `SELECT count(DISTINCT u.user_id)::int AS n
       FROM users u JOIN user_roles ur ON ur.user_id = u.user_id JOIN roles r ON r.role_id = ur.role_id
      WHERE r.code = 'SUPER_ADMIN' AND u.is_active AND u.status = 'ACTIVE' AND u.user_id <> $1`,
    [excludingUserId]
  );
  if (rows[0].n === 0) {
    throw new HttpError(409, 'LAST_SUPER_ADMIN', 'The organization must keep at least one active super administrator.');
  }
}

async function roleIds(tx: Tx, codes: EnterpriseRole[]): Promise<Map<string, string>> {
  const { rows } = await tx.query<{ role_id: string; code: string }>(
    `SELECT role_id, code FROM roles WHERE code = ANY($1) AND status = 'ACTIVE'`,
    [codes]
  );
  const map = new Map(rows.map(r => [r.code, r.role_id]));
  const missing = codes.filter(c => !map.has(c));
  if (missing.length) throw new HttpError(400, 'VALIDATION_ERROR', `Role not available in this organization: ${missing.join(', ')}.`);
  return map;
}

async function assertSites(tx: Tx, actor: AuthenticatedUser, siteIds: string[]): Promise<void> {
  if (!siteIds.length) return;
  const { rows } = await tx.query<{ site_id: string }>('SELECT site_id FROM sites WHERE site_id = ANY($1)', [siteIds]);
  if (rows.length !== new Set(siteIds).size) throw new HttpError(400, 'VALIDATION_ERROR', 'Unknown site.');
  if (!isTenantWide(actor)) {
    const scope = actor.assignedSiteIds ?? [];
    if (siteIds.some(s => !scope.includes(s))) throw new HttpError(403, 'FORBIDDEN', 'You can only grant access to your own sites.');
  }
}

async function setPassword(tx: Tx, actor: AuthenticatedUser, userId: string, reason: 'INITIAL' | 'ADMIN_RESET'): Promise<string> {
  const temporary = generateTemporaryPassword();
  const hash = await hashPasswordAsync(temporary);
  await tx.query(
    `INSERT INTO user_credentials (user_id, tenant_id, password_hash, must_change_password)
     VALUES ($1, $2, $3, TRUE)
     ON CONFLICT (user_id) DO UPDATE
        SET password_hash = EXCLUDED.password_hash, must_change_password = TRUE, password_changed_at = now(),
            failed_attempts = 0, locked_until = NULL, updated_at = now()`,
    [userId, actor.tenantId, hash]
  );
  await tx.query(
    'INSERT INTO user_password_history (tenant_id, user_id, password_hash, set_by, reason) VALUES ($1, $2, $3, $4, $5)',
    [actor.tenantId, userId, hash, actor.userId, reason]
  );
  return temporary;
}

async function revokeSessions(tx: Tx, userId: string): Promise<void> {
  await tx.query('UPDATE user_sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL', [userId]);
}

export async function registerAdminRoutes(app: FastifyInstance, ctx: RouteContext): Promise<void> {
  const audit = (tx: Tx, user: AuthenticatedUser, requestId: string, action: string, entityId: string, extra: Partial<Parameters<typeof writeAudit>[1]> = {}) =>
    writeAudit(tx, { tenantId: user.tenantId, actorId: user.userId, actorRole: user.role, action, entityType: 'USER', entityId, requestId, ...extra });

  // Role catalog with each role's permissions and whether the caller may grant it.
  app.get('/api/v1/admin/roles', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const { rows } = await tx.query<{ code: EnterpriseRole; name: string; description: string | null; users: number }>(
        `SELECT r.code, r.name, r.description,
                (SELECT count(*) FROM user_roles ur JOIN users u ON u.user_id = ur.user_id WHERE ur.role_id = r.role_id AND u.is_active)::int AS users
           FROM roles r WHERE r.status = 'ACTIVE' ORDER BY r.name`
      );
      return {
        items: rows
          .filter(r => ROLE_CODES.includes(r.code))
          .map(r => ({ ...r, permissions: ROLE_PERMISSIONS[r.code] ?? [], assignable: canAssignRole(actorRoles(user), r.code) })),
      };
    })
  );

  app.get('/api/v1/admin/users', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const q = ListQuery.parse(request.query);
      const scope = isTenantWide(user) ? null : user.assignedSiteIds ?? [];
      const { rows } = await tx.query<
        TargetUser & { last_login_at: Date | null; locked_until: Date | null; must_change_password: boolean | null; mfa_enabled: boolean; total: number }
      >(
        `WITH base AS (
           SELECT u.user_id, u.username::text, u.full_name, u.email::text, u.status, u.is_active,
                  coalesce(array_agg(DISTINCT r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles,
                  coalesce(array_agg(DISTINCT s.site_id) FILTER (WHERE s.site_id IS NOT NULL), '{}') AS site_ids,
                  c.last_login_at, c.locked_until, c.must_change_password, (m.enabled_at IS NOT NULL) AS mfa_enabled
             FROM users u
             LEFT JOIN user_roles ur ON ur.user_id = u.user_id
             LEFT JOIN roles r ON r.role_id = ur.role_id
             LEFT JOIN user_site_access s ON s.user_id = u.user_id
             LEFT JOIN user_credentials c ON c.user_id = u.user_id
             LEFT JOIN user_mfa m ON m.user_id = u.user_id
            GROUP BY u.user_id, c.last_login_at, c.locked_until, c.must_change_password, m.enabled_at
         )
         SELECT *, count(*) OVER()::int AS total FROM base
          WHERE ($1::text IS NULL OR username ILIKE '%' || $1 || '%' OR full_name ILIKE '%' || $1 || '%' OR email ILIKE '%' || $1 || '%')
            AND ($2::text IS NULL OR $2 = ANY(roles))
            AND ($3::text IS NULL OR status = $3)
            AND ($4::uuid IS NULL OR $4 = ANY(site_ids))
            AND ($5::uuid[] IS NULL OR site_ids && $5)
          ORDER BY full_name
          LIMIT $6 OFFSET $7`,
        [q.search?.replace(/[%_\\]/g, m => `\\${m}`) ?? null, q.role ?? null, q.status ?? null, q.siteId ?? null, scope, q.limit, q.offset]
      );
      return {
        items: rows.map(r => ({
          id: r.user_id,
          username: r.username,
          fullName: r.full_name,
          email: r.email,
          status: r.status,
          roles: r.roles,
          siteIds: r.site_ids,
          lastLoginAt: r.last_login_at,
          locked: !!r.locked_until && r.locked_until.getTime() > Date.now(),
          mustChangePassword: r.must_change_password === true,
          mfaEnabled: r.mfa_enabled,
          hasPassword: r.must_change_password !== null,
          canManage: canManage(user, r),
          isSelf: r.user_id === user.userId,
        })),
        total: rows[0]?.total ?? 0,
        limit: q.limit,
        offset: q.offset,
      };
    })
  );

  app.get('/api/v1/admin/users/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const target = await loadTarget(tx, (request.params as { id: string }).id);
      if (!visibleTo(user, target) && target.user_id !== user.userId) throw notFound('User');
      const cred = await tx.query<{ last_login_at: Date | null; locked_until: Date | null; failed_attempts: number; must_change_password: boolean; password_changed_at: Date }>(
        'SELECT last_login_at, locked_until, failed_attempts, must_change_password, password_changed_at FROM user_credentials WHERE user_id = $1',
        [target.user_id]
      );
      const sessions = await tx.query<{ n: number }>(
        'SELECT count(*)::int AS n FROM user_sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()',
        [target.user_id]
      );
      const defaults = await tx.query<{ site_id: string }>('SELECT site_id FROM user_site_access WHERE user_id = $1 AND is_default', [target.user_id]);
      // Changes to the account; sign-ins are summarized under "Sign-in and security" instead.
      const history = await tx.query(
        `SELECT "timestamp", action, actor_role AS "actorRole", reason FROM audit_logs
          WHERE entity_type = 'USER' AND entity_id = $1 AND action NOT IN ('LOGIN_SUCCESS', 'LOGIN_FAILED')
          ORDER BY "timestamp" DESC LIMIT 20`,
        [target.user_id]
      );
      const mfa = await tx.query<{ enabled_at: Date | null; codes: number }>(
        'SELECT enabled_at, cardinality(recovery_code_hashes) AS codes FROM user_mfa WHERE user_id = $1',
        [target.user_id]
      );
      const policy = await tx.query<{ required: boolean }>('SELECT require_mfa_for_admins AS required FROM tenant_security_settings WHERE tenant_id = $1', [
        user.tenantId,
      ]);
      const c = cred.rows[0];
      return {
        id: target.user_id,
        username: target.username,
        fullName: target.full_name,
        email: target.email,
        status: target.status,
        roles: target.roles,
        siteIds: target.site_ids,
        defaultSiteId: defaults.rows[0]?.site_id ?? null,
        lastLoginAt: c?.last_login_at ?? null,
        passwordChangedAt: c?.password_changed_at ?? null,
        failedAttempts: c?.failed_attempts ?? 0,
        locked: !!c?.locked_until && c.locked_until.getTime() > Date.now(),
        mustChangePassword: c?.must_change_password === true,
        hasPassword: !!c,
        activeSessions: sessions.rows[0].n,
        mfaEnabled: !!mfa.rows[0]?.enabled_at,
        mfaEnabledAt: mfa.rows[0]?.enabled_at ?? null,
        recoveryCodesLeft: mfa.rows[0]?.enabled_at ? mfa.rows[0].codes : 0,
        mfaRequiredByPolicy: policy.rows[0]?.required === true && isAdministrator(effectiveRoles(target.roles)),
        canManage: canManage(user, target),
        isSelf: target.user_id === user.userId,
        assignableRoles: ROLE_CODES.filter(r => canAssignRole(actorRoles(user), r)),
        history: history.rows,
      };
    })
  );

  app.post('/api/v1/admin/users', async (request, reply) =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const body = UserCreate.parse(request.body);
      const roles = Array.from(new Set(body.roles));
      const denied = roles.filter(r => !canAssignRole(actorRoles(user), r));
      if (denied.length) throw new HttpError(403, 'FORBIDDEN', `You are not allowed to grant: ${denied.join(', ')}.`);
      const siteIds = Array.from(new Set(body.siteIds));
      if (!isTenantWide(user) && siteIds.length === 0) throw new HttpError(400, 'VALIDATION_ERROR', 'Choose at least one of your sites.');
      if (body.defaultSiteId && !siteIds.includes(body.defaultSiteId)) throw new HttpError(400, 'VALIDATION_ERROR', 'The default site must be one of the selected sites.');
      await assertSites(tx, user, siteIds);
      const ids = await roleIds(tx, roles);

      let userId: string;
      try {
        const { rows } = await tx.query<{ user_id: string }>(
          `INSERT INTO users (tenant_id, organization_id, username, email, full_name, created_by, updated_by)
           VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING user_id`,
          [user.tenantId, user.organizationId, body.username, body.email, body.fullName, user.userId]
        );
        userId = rows[0].user_id;
      } catch (err) {
        if ((err as { code?: string; constraint?: string }).code === '23505') {
          const field = (err as { constraint?: string }).constraint?.includes('email') ? 'email address' : 'username';
          throw new HttpError(409, 'ALREADY_EXISTS', `That ${field} is already in use.`);
        }
        throw err;
      }
      for (const r of roles) {
        await tx.query('INSERT INTO user_roles (user_id, role_id, tenant_id) VALUES ($1, $2, $3)', [userId, ids.get(r), user.tenantId]);
      }
      const defaultSite = body.defaultSiteId ?? siteIds[0];
      for (const s of siteIds) {
        await tx.query('INSERT INTO user_site_access (user_id, site_id, tenant_id, is_default) VALUES ($1, $2, $3, $4)', [userId, s, user.tenantId, s === defaultSite]);
      }
      const temporaryPassword = await setPassword(tx, user, userId, 'INITIAL');
      await audit(tx, user, request.id, 'USER_CREATED', userId, {
        after: { username: body.username, fullName: body.fullName, email: body.email, roles, siteIds },
      });
      reply.code(201);
      return { id: userId, temporaryPassword };
    })
  );

  app.patch('/api/v1/admin/users/:id', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const body = UserUpdate.parse(request.body);
      const target = await loadTarget(tx, (request.params as { id: string }).id, true);
      requireManage(user, target);
      if (body.status && body.status !== 'ACTIVE' && target.roles.includes('SUPER_ADMIN')) await assertAnotherSuperAdmin(tx, target.user_id);
      try {
        await tx.query(
          `UPDATE users SET full_name = coalesce($2, full_name), email = coalesce($3, email),
                  status = coalesce($4, status), is_active = coalesce($4 = 'ACTIVE', is_active),
                  updated_by = $5, updated_at = now()
            WHERE user_id = $1`,
          [target.user_id, body.fullName ?? null, body.email ?? null, body.status ?? null, user.userId]
        );
      } catch (err) {
        if ((err as { code?: string }).code === '23505') throw new HttpError(409, 'ALREADY_EXISTS', 'That email address is already in use.');
        throw err;
      }
      // Suspending or deactivating ends every session at once.
      if (body.status && body.status !== 'ACTIVE') await revokeSessions(tx, target.user_id);
      await audit(tx, user, request.id, body.status && body.status !== target.status ? `USER_${body.status}` : 'USER_UPDATED', target.user_id, {
        before: { fullName: target.full_name, email: target.email, status: target.status },
        after: { fullName: body.fullName, email: body.email, status: body.status },
        reason: body.reason,
      });
      return { id: target.user_id };
    })
  );

  app.put('/api/v1/admin/users/:id/roles', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const body = RolesUpdate.parse(request.body);
      const target = await loadTarget(tx, (request.params as { id: string }).id, true);
      requireManage(user, target);
      const next = Array.from(new Set(body.roles));
      const added = next.filter(r => !target.roles.includes(r));
      const removed = target.roles.filter(r => !next.includes(r));
      const denied = [...added, ...removed].filter(r => !canAssignRole(actorRoles(user), r));
      if (denied.length) throw new HttpError(403, 'FORBIDDEN', `You are not allowed to change: ${denied.join(', ')}.`);
      if (removed.includes('SUPER_ADMIN')) await assertAnotherSuperAdmin(tx, target.user_id);
      const ids = await roleIds(tx, next);
      await tx.query('DELETE FROM user_roles WHERE user_id = $1 AND role_id NOT IN (SELECT unnest($2::uuid[]))', [target.user_id, [...ids.values()]]);
      for (const r of added) {
        await tx.query('INSERT INTO user_roles (user_id, role_id, tenant_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [target.user_id, ids.get(r), user.tenantId]);
      }
      await audit(tx, user, request.id, 'USER_ROLES_CHANGED', target.user_id, {
        before: { roles: target.roles },
        after: { roles: next },
        reason: body.reason,
      });
      return { id: target.user_id, roles: next };
    })
  );

  app.put('/api/v1/admin/users/:id/sites', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const body = SitesUpdate.parse(request.body);
      const target = await loadTarget(tx, (request.params as { id: string }).id, true);
      requireManage(user, target);
      const next = Array.from(new Set(body.siteIds));
      await assertSites(tx, user, next.filter(s => !target.site_ids.includes(s)));
      if (!isTenantWide(user)) {
        const scope = user.assignedSiteIds ?? [];
        const removedOutside = target.site_ids.filter(s => !next.includes(s) && !scope.includes(s));
        if (removedOutside.length) throw new HttpError(403, 'FORBIDDEN', 'You can only remove access to your own sites.');
        if (next.length === 0) throw new HttpError(400, 'VALIDATION_ERROR', 'Keep at least one site; deactivate the user to remove all access.');
      }
      if (body.defaultSiteId && !next.includes(body.defaultSiteId)) throw new HttpError(400, 'VALIDATION_ERROR', 'The default site must be one of the selected sites.');
      await tx.query('DELETE FROM user_site_access WHERE user_id = $1 AND NOT (site_id = ANY($2::uuid[]))', [target.user_id, next]);
      for (const s of next) {
        await tx.query(
          'INSERT INTO user_site_access (user_id, site_id, tenant_id, is_default) VALUES ($1, $2, $3, false) ON CONFLICT (user_id, site_id) DO NOTHING',
          [target.user_id, s, user.tenantId]
        );
      }
      const defaultSite = body.defaultSiteId ?? next[0];
      if (defaultSite) await tx.query('UPDATE user_site_access SET is_default = (site_id = $2) WHERE user_id = $1', [target.user_id, defaultSite]);
      await audit(tx, user, request.id, 'USER_SITES_CHANGED', target.user_id, {
        before: { siteIds: target.site_ids },
        after: { siteIds: next, defaultSiteId: defaultSite ?? null },
        reason: body.reason,
      });
      return { id: target.user_id, siteIds: next };
    })
  );

  app.post('/api/v1/admin/users/:id/reset-password', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const { reason } = ReasonOnly.parse(request.body ?? {});
      const target = await loadTarget(tx, (request.params as { id: string }).id, true);
      requireManage(user, target);
      const temporaryPassword = await setPassword(tx, user, target.user_id, 'ADMIN_RESET');
      await revokeSessions(tx, target.user_id);
      await audit(tx, user, request.id, 'USER_PASSWORD_RESET', target.user_id, { reason });
      return { id: target.user_id, temporaryPassword };
    })
  );

  app.post('/api/v1/admin/users/:id/unlock', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const { reason } = ReasonOnly.parse(request.body ?? {});
      const target = await loadTarget(tx, (request.params as { id: string }).id, true);
      requireManage(user, target);
      await tx.query('UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = $1', [target.user_id]);
      await audit(tx, user, request.id, 'USER_UNLOCKED', target.user_id, { reason });
      return { id: target.user_id };
    })
  );

  app.post('/api/v1/admin/users/:id/revoke-sessions', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const { reason } = ReasonOnly.parse(request.body ?? {});
      const target = await loadTarget(tx, (request.params as { id: string }).id, true);
      requireManage(user, target);
      await revokeSessions(tx, target.user_id);
      await audit(tx, user, request.id, 'USER_SESSIONS_REVOKED', target.user_id, { reason });
      return { id: target.user_id };
    })
  );

  // Removes a user's authenticator (lost phone): they sign in with their password alone, or set it up
  // again at the next sign-in when the organization requires it. All sessions end.
  app.post('/api/v1/admin/users/:id/reset-mfa', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const { reason } = ReasonOnly.parse(request.body ?? {});
      const target = await loadTarget(tx, (request.params as { id: string }).id, true);
      requireManage(user, target);
      const removed = await tx.query('DELETE FROM user_mfa WHERE user_id = $1', [target.user_id]);
      if (!removed.rowCount) throw new HttpError(409, 'MFA_NOT_ENABLED', 'This user has not set up two-step verification.');
      await revokeSessions(tx, target.user_id);
      await audit(tx, user, request.id, 'USER_MFA_RESET', target.user_id, { reason });
      return { id: target.user_id };
    })
  );

  // Organization sign-in policy. Everyone with USER_MANAGE can read it; tenant-wide administrators change it.
  app.get('/api/v1/admin/security-settings', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const settings = await tx.query<{ require_mfa_for_admins: boolean; updated_at: Date }>(
        'SELECT require_mfa_for_admins, updated_at FROM tenant_security_settings WHERE tenant_id = $1',
        [user.tenantId]
      );
      const people = await tx.query<{ roles: EnterpriseRole[]; mfa: boolean }>(
        `SELECT coalesce(array_agg(r.code) FILTER (WHERE r.code IS NOT NULL), '{}') AS roles, bool_or(m.enabled_at IS NOT NULL) AS mfa
           FROM users u LEFT JOIN user_roles ur ON ur.user_id = u.user_id LEFT JOIN roles r ON r.role_id = ur.role_id
           LEFT JOIN user_mfa m ON m.user_id = u.user_id
          WHERE u.is_active AND u.status = 'ACTIVE'
          GROUP BY u.user_id`
      );
      const admins = people.rows.filter(p => isAdministrator(effectiveRoles(p.roles)));
      // Organization-wide figures only for organization-wide administrators (site admins see their sites only elsewhere).
      const wide = isTenantWide(user);
      return {
        requireMfaForAdmins: settings.rows[0]?.require_mfa_for_admins === true,
        updatedAt: settings.rows[0]?.updated_at ?? null,
        activeUsers: wide ? people.rows.length : null,
        usersWithMfa: wide ? people.rows.filter(p => p.mfa).length : null,
        administrators: wide ? admins.length : null,
        administratorsWithMfa: wide ? admins.filter(p => p.mfa).length : null,
        canEdit: isTenantWide(user),
        youHaveMfa: user.mfaEnabled,
      };
    })
  );

  app.put('/api/v1/admin/security-settings', async request =>
    ctx.asUser(request, async (tx, user) => {
      authorize(user, 'USER_MANAGE');
      const body = z.object({ requireMfaForAdmins: z.boolean(), reason: Reason }).parse(request.body);
      if (!isTenantWide(user)) throw new HttpError(403, 'FORBIDDEN', 'Only organization-wide administrators change the sign-in policy.');
      if (body.requireMfaForAdmins && !user.mfaEnabled) {
        throw new HttpError(409, 'MFA_SELF_FIRST', 'Turn on two-step verification for your own account first.');
      }
      const before = await tx.query<{ require_mfa_for_admins: boolean }>('SELECT require_mfa_for_admins FROM tenant_security_settings WHERE tenant_id = $1', [
        user.tenantId,
      ]);
      await tx.query(
        `INSERT INTO tenant_security_settings (tenant_id, require_mfa_for_admins, updated_at, updated_by) VALUES ($1, $2, now(), $3)
         ON CONFLICT (tenant_id) DO UPDATE SET require_mfa_for_admins = EXCLUDED.require_mfa_for_admins, updated_at = now(), updated_by = EXCLUDED.updated_by`,
        [user.tenantId, body.requireMfaForAdmins, user.userId]
      );
      await writeAudit(tx, {
        tenantId: user.tenantId, actorId: user.userId, actorRole: user.role, action: 'SECURITY_SETTINGS_CHANGED',
        entityType: 'TENANT', entityId: user.tenantId, requestId: request.id, reason: body.reason,
        before: { requireMfaForAdmins: before.rows[0]?.require_mfa_for_admins === true },
        after: { requireMfaForAdmins: body.requireMfaForAdmins },
      });
      return { requireMfaForAdmins: body.requireMfaForAdmins };
    })
  );
}
