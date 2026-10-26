import type { EnterpriseRole, UserContext } from '@vms/types';
import { evaluateAccess, type PermissionAction, type ResourceContext } from '@vms/permissions';
import type { Tx } from './db.js';
import { HttpError } from './errors.js';

/** Highest-privilege first; the first role a user holds becomes the primary role. */
const ROLE_PRIORITY: EnterpriseRole[] = [
  'SUPER_ADMIN',
  'ORGANIZATION_ADMIN',
  'IT_ADMIN',
  'SITE_ADMIN',
  'SECURITY_MANAGER',
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
    status: string;
    is_active: boolean;
  }>('SELECT user_id, tenant_id, organization_id, username::text, full_name, status, is_active FROM users WHERE user_id = $1', [userId]);
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

export function canAccessSite(user: UserContext, siteId: string): boolean {
  if (user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZATION_ADMIN') return true;
  return (user.assignedSiteIds || []).includes(siteId);
}
