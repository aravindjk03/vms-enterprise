import type { EnterpriseRole, UserContext } from '@vms/types';
import { evaluateAccess, hasPermissionMatch, ROLE_PERMISSIONS, type PermissionAction, type ResourceContext } from '@vms/permissions';
import type { Tx } from './db.js';
import { HttpError } from './errors.js';

/** Highest-privilege first; the first role a user holds becomes the primary role. */
const ROLE_PRIORITY: EnterpriseRole[] = [
  'SUPER_ADMIN',
  'ORGANIZATION_ADMIN',
  'IT_ADMIN',
  'SITE_ADMIN',
  'SECURITY_MANAGER',
  'SERVICE_MANAGER',
  'EHS_MANAGER',
  'ESG_METHODOLOGY_ADMIN',
  'ESG_MANAGER',
  'HR_MANAGER',
  'HR',
  'LEGAL',
  'LEGAL_USER',
  'AUDITOR',
  'MANAGEMENT',
  'GATE_OPERATOR',
  'SECURITY_GUARD',
  'RECEPTIONIST',
  'HOST',
];

export interface AuthenticatedUser extends UserContext {
  username: string;
  fullName: string;
  email: string;
  /** Set after an administrator issues a temporary password; only the auth endpoints work until changed. */
  mustChangePassword: boolean;
}

/**
 * Builds the authorization context for a user from the database, inside the tenant's
 * RLS transaction. Roles and site assignments are always read fresh, so revocations
 * take effect on the next request rather than when a token expires.
 */
export async function loadUserContext(tx: Tx, userId: string, sessionId: string): Promise<AuthenticatedUser | null> {
  const userRes = await tx.query<{
    user_id: string;
    tenant_id: string;
    organization_id: string;
    username: string;
    full_name: string;
    email: string;
    status: string;
    is_active: boolean;
    must_change_password: boolean | null;
  }>(
    `SELECT u.user_id, u.tenant_id, u.organization_id, u.username::text, u.full_name, u.email::text, u.status, u.is_active,
            c.must_change_password
       FROM users u LEFT JOIN user_credentials c ON c.user_id = u.user_id
      WHERE u.user_id = $1`,
    [userId]
  );
  const user = userRes.rows[0];
  if (!user || !user.is_active || user.status !== 'ACTIVE') return null;

  const rolesRes = await tx.query<{ code: string }>(
    'SELECT r.code FROM user_roles ur JOIN roles r ON r.role_id = ur.role_id WHERE ur.user_id = $1 AND r.status = $2',
    [userId, 'ACTIVE']
  );
  const held = new Set(rolesRes.rows.map(r => r.code));
  const roles = ROLE_PRIORITY.filter(r => held.has(r));

  const sitesRes = await tx.query<{ site_id: string; is_default: boolean }>(
    `SELECT site_id, is_default FROM user_site_access
      WHERE user_id = $1 AND (valid_from IS NULL OR valid_from <= now()) AND (valid_to IS NULL OR valid_to > now())
      ORDER BY is_default DESC`,
    [userId]
  );
  const assignedSiteIds = sitesRes.rows.map(r => r.site_id);

  return {
    userId: user.user_id,
    tenantId: user.tenant_id,
    organizationId: user.organization_id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    mustChangePassword: user.must_change_password === true,
    // Users without any role get the least-privileged baseline.
    role: roles[0] ?? 'HOST',
    roles: roles.slice(1),
    siteId: assignedSiteIds[0],
    assignedSiteIds,
    sessionId,
    mfaVerified: false,
  };
}

/** Enforces RBAC/ABAC through the shared policy engine; throws 403 with a generic message. */
export function authorize(user: UserContext, permission: PermissionAction, resource: Partial<ResourceContext> = {}): void {
  const decision = evaluateAccess(user, permission, { tenantId: user.tenantId, ...resource });
  if (!decision.allowed) {
    throw new HttpError(403, 'FORBIDDEN', 'You do not have permission to perform this action.');
  }
}

/**
 * True when `role` is the only one of the user's roles that grants `permission`, whichever role
 * is primary. Used for rules that narrow what a role may do (a HOST decides only on visits they host).
 */
export function permissionOnlyFrom(user: UserContext, permission: PermissionAction, role: EnterpriseRole): boolean {
  const held = [user.role, ...(user.roles ?? [])];
  if (!held.includes(role)) return false;
  const explicit = (user.permissions ?? []) as PermissionAction[];
  if (hasPermissionMatch(explicit, permission)) return false;
  return !held.some(r => r !== role && hasPermissionMatch(ROLE_PERMISSIONS[r] ?? [], permission));
}

export function canAccessSite(user: UserContext, siteId: string): boolean {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZATION_ADMIN') return true;
  return (user.assignedSiteIds || []).includes(siteId);
}
