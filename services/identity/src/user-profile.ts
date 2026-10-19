import type { UserContext, UserSecurityProfile, EnterpriseRole, SecurityAlert } from '@vms/types';
import { ROLE_PERMISSIONS } from '@vms/permissions';
import type { SessionSecurityService } from './session.js';
import type { AuthUserRecord } from './auth.js';

export class UserSecurityProfileService {
  constructor(
    private sessionService: SessionSecurityService,
    private getUserRecord: (userId: string) => AuthUserRecord | undefined,
    private getSecurityAlertsForUser?: (userId: string) => SecurityAlert[]
  ) {}

  /**
   * Builds and returns a comprehensive User Security Profile with strict authorization enforcement.
   * Only the user themselves or an administrator with admin.users capability may view the security profile.
   */
  public getProfile(viewer: UserContext, targetUserId: string): UserSecurityProfile {
    // 1. Authorization Check: Viewer must be target user or have admin permissions
    const isSelf = viewer.userId === targetUserId;
    const isAdmin =
      viewer.role === 'SUPER_ADMIN' ||
      viewer.role === 'ORGANIZATION_ADMIN' ||
      viewer.role === 'IT_ADMIN' ||
      (viewer.permissions || []).includes('admin.users');

    if (!isSelf && !isAdmin) {
      throw new Error('Access denied: insufficient authorization to view user security profile.');
    }

    // 2. Fetch User Record
    const user = this.getUserRecord(targetUserId);
    if (!user) {
      throw new Error(`User not found: ${targetUserId}`);
    }

    // 3. Tenant Boundary Enforcement
    if (viewer.role !== 'SUPER_ADMIN' && viewer.tenantId !== user.tenantId) {
      throw new Error('Cross-tenant user security profile access prohibited.');
    }

    // 4. Resolve Roles and Unified Permissions
    const userRoles: EnterpriseRole[] = [user.role];
    const permissions = Array.from(new Set(userRoles.flatMap(r => ROLE_PERMISSIONS[r] || []))) as string[];

    // 5. Query Active Sessions
    const activeSessions = this.sessionService.getUserSessions(targetUserId).filter(s => !s.isRevoked);

    // 6. Account Status Derivation
    let accountStatus: UserSecurityProfile['accountStatus'] = 'ACTIVE';
    if (!user.isActive) {
      accountStatus = 'DEACTIVATED';
    } else if (user.lockedUntil && Date.now() < user.lockedUntil.getTime()) {
      accountStatus = 'LOCKED';
    }

    // 7. Recent Security Alerts
    const userAlerts = this.getSecurityAlertsForUser ? this.getSecurityAlertsForUser(targetUserId) : [];

    return {
      userId: user.userId,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      username: user.username,
      email: user.email,
      accountStatus,
      roles: userRoles,
      permissions,
      assignedSites: user.assignedSiteIds || (user.siteId ? [user.siteId] : []),
      assignedGates: user.assignedGateIds || [],
      assignedZones: user.assignedZoneIds || [],
      mfaEnabled: user.mfaEnforced ?? (user.role === 'SUPER_ADMIN'),
      activeSessionsCount: activeSessions.length,
      securityEventsCount: userAlerts.length,
      recentSecurityAlerts: userAlerts,
    };
  }
}
