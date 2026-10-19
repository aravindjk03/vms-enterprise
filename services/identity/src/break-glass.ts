import { randomUUID } from 'node:crypto';
import type { BreakGlassGrant, EnterpriseRole, UserContext } from '@vms/types';

export interface BreakGlassRequest {
  userId: string;
  tenantId: string;
  reason: string;
  requestedRole: EnterpriseRole;
  durationMinutes: number;
}

export class BreakGlassService {
  private static readonly MAX_DURATION_MINUTES = 60;
  private grants: Map<string, BreakGlassGrant> = new Map();

  constructor(
    private auditLogger?: (event: { action: string; grantId: string; userId: string; tenantId: string; details?: Record<string, unknown> }) => void
  ) {}

  /**
   * Evaluates and provisions an emergency break-glass elevation grant.
   * Mandates explicit operational rationale and hard time expiration.
   */
  public requestBreakGlass(request: BreakGlassRequest): BreakGlassGrant {
    if (!request.reason || request.reason.trim().length < 15) {
      throw new Error('Break-glass access requires a documented justification of at least 15 characters.');
    }

    const duration = Math.min(
      Math.max(1, request.durationMinutes),
      BreakGlassService.MAX_DURATION_MINUTES
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration * 60 * 1000);
    const grantId = `bg-${randomUUID()}`;

    const grant: BreakGlassGrant = {
      grantId,
      tenantId: request.tenantId,
      userId: request.userId,
      reason: request.reason.trim(),
      elevatedRole: request.requestedRole,
      requestedAt: now,
      expiresAt,
      auditRecordId: `audit-bg-${randomUUID()}`,
      status: 'ACTIVE',
    };

    this.grants.set(grantId, grant);

    if (this.auditLogger) {
      this.auditLogger({
        action: 'BREAK_GLASS_ELEVATION_GRANTED',
        grantId,
        userId: request.userId,
        tenantId: request.tenantId,
        details: { reason: grant.reason, elevatedRole: grant.elevatedRole, durationMinutes: duration },
      });
    }

    return grant;
  }

  /**
   * Verifies if a break-glass grant is currently active and within its valid time window.
   */
  public validateGrant(grantId: string): { active: boolean; grant?: BreakGlassGrant; reason?: string } {
    const grant = this.grants.get(grantId);
    if (!grant) {
      return { active: false, reason: 'Break-glass grant not found.' };
    }

    if (grant.status !== 'ACTIVE') {
      return { active: false, grant, reason: `Break-glass grant is ${grant.status.toLowerCase()}.` };
    }

    if (Date.now() > grant.expiresAt.getTime()) {
      grant.status = 'EXPIRED';
      return { active: false, grant, reason: 'Break-glass elevation period has expired.' };
    }

    return { active: true, grant };
  }

  /**
   * Revokes an active emergency grant immediately upon incident conclusion.
   */
  public revokeGrant(grantId: string, revokedByUserId?: string): boolean {
    const grant = this.grants.get(grantId);
    if (!grant) return false;

    grant.status = 'REVOKED';
    grant.revokedAt = new Date();
    return true;
  }

  /**
   * Elevates a base user context into an audited temporary break-glass context.
   */
  public applyGrantToUser(baseUser: UserContext, grantId: string): UserContext {
    const check = this.validateGrant(grantId);
    if (!check.active || !check.grant) {
      throw new Error(`Cannot elevate context: ${check.reason || 'Invalid grant'}`);
    }

    if (baseUser.userId !== check.grant.userId || baseUser.tenantId !== check.grant.tenantId) {
      throw new Error('Break-glass grant identity mismatch: user or tenant does not match grant credentials.');
    }

    return {
      ...baseUser,
      role: check.grant.elevatedRole,
      isBreakGlass: true,
    };
  }
}
