import { randomUUID } from 'node:crypto';
import type { BreakGlassGrant, EnterpriseRole, UserContext } from '@vms/types';

export interface BreakGlassRequest {
  reason: string;
  requestedRole: EnterpriseRole;
  durationMinutes: number;
}

export type BreakGlassAuditLogger = (event: {
  action: string;
  grantId: string;
  userId: string;
  tenantId: string;
  actorUserId: string;
  details?: Record<string, unknown>;
}) => void;

/**
 * Roles that may be temporarily assumed during an operational emergency.
 * Tenant-wide administrative roles are deliberately excluded: break-glass exists to
 * unblock gate/safety operations, not to hand out administration of the platform.
 */
export const BREAK_GLASS_ELIGIBLE_ROLES: readonly EnterpriseRole[] = [
  'SECURITY_MANAGER',
  'EHS_MANAGER',
  'SITE_ADMIN',
  'GATE_OPERATOR',
  'SECURITY_GUARD',
];

/** Roles allowed to approve another user's break-glass request (four-eyes principle). */
export const BREAK_GLASS_APPROVER_ROLES: readonly EnterpriseRole[] = [
  'SUPER_ADMIN',
  'ORGANIZATION_ADMIN',
  'SECURITY_MANAGER',
];

export class BreakGlassService {
  private static readonly MAX_DURATION_MINUTES = 60;
  private static readonly MIN_REASON_LENGTH = 15;
  private grants: Map<string, BreakGlassGrant> = new Map();

  constructor(private readonly auditLogger: BreakGlassAuditLogger) {
    if (typeof auditLogger !== 'function') {
      throw new Error('BreakGlassService requires an audit logger: emergency elevation must always be audited.');
    }
  }

  /**
   * Records an emergency elevation request from an authenticated requester.
   * The grant stays PENDING_APPROVAL until a different authorized user approves it.
   */
  public requestBreakGlass(requester: UserContext, request: BreakGlassRequest): BreakGlassGrant {
    if (!requester?.userId || !requester.tenantId) {
      throw new Error('Break-glass requests require an authenticated requester context.');
    }
    if (requester.isBreakGlass) {
      throw new Error('Break-glass elevation cannot be chained from an already elevated context.');
    }
    if (!request.reason || request.reason.trim().length < BreakGlassService.MIN_REASON_LENGTH) {
      throw new Error('Break-glass access requires a documented justification of at least 15 characters.');
    }
    if (!BREAK_GLASS_ELIGIBLE_ROLES.includes(request.requestedRole)) {
      throw new Error(`Role ${request.requestedRole} cannot be obtained through break-glass elevation.`);
    }
    if (!Number.isFinite(request.durationMinutes)) {
      throw new Error('Break-glass duration must be a finite number of minutes.');
    }

    const duration = Math.min(
      Math.max(1, Math.floor(request.durationMinutes)),
      BreakGlassService.MAX_DURATION_MINUTES
    );

    const now = new Date();
    const grantId = `bg-${randomUUID()}`;

    const grant: BreakGlassGrant = {
      grantId,
      tenantId: requester.tenantId,
      userId: requester.userId,
      reason: request.reason.trim(),
      elevatedRole: request.requestedRole,
      requestedAt: now,
      // Provisional; the clock restarts from approval so the full window is usable.
      expiresAt: new Date(now.getTime() + duration * 60 * 1000),
      auditRecordId: `audit-bg-${randomUUID()}`,
      status: 'PENDING_APPROVAL',
    };

    this.grants.set(grantId, grant);
    this.auditLogger({
      action: 'BREAK_GLASS_ELEVATION_REQUESTED',
      grantId,
      userId: requester.userId,
      tenantId: requester.tenantId,
      actorUserId: requester.userId,
      details: { reason: grant.reason, elevatedRole: grant.elevatedRole, durationMinutes: duration },
    });

    return grant;
  }

  /**
   * Approves a pending grant. The approver must be a different, non-elevated user in the
   * same tenant holding an approver role.
   */
  public approveGrant(grantId: string, approver: UserContext): BreakGlassGrant {
    const grant = this.grants.get(grantId);
    if (!grant) {
      throw new Error('Break-glass grant not found.');
    }
    if (grant.status !== 'PENDING_APPROVAL') {
      throw new Error(`Break-glass grant is ${grant.status.toLowerCase()} and cannot be approved.`);
    }
    if (approver.tenantId !== grant.tenantId) {
      throw new Error('Break-glass approver must belong to the same tenant.');
    }
    if (approver.userId === grant.userId) {
      throw new Error('Segregation of duties: a break-glass request cannot be self-approved.');
    }
    if (approver.isBreakGlass || !BREAK_GLASS_APPROVER_ROLES.includes(approver.role)) {
      throw new Error(`Role ${approver.role} is not authorized to approve break-glass elevation.`);
    }

    const durationMs = grant.expiresAt.getTime() - grant.requestedAt.getTime();
    const now = new Date();
    grant.status = 'ACTIVE';
    grant.approvedBy = approver.userId;
    grant.approvedAt = now;
    grant.expiresAt = new Date(now.getTime() + durationMs);

    this.auditLogger({
      action: 'BREAK_GLASS_ELEVATION_GRANTED',
      grantId,
      userId: grant.userId,
      tenantId: grant.tenantId,
      actorUserId: approver.userId,
      details: { elevatedRole: grant.elevatedRole, expiresAt: grant.expiresAt.toISOString() },
    });

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

    if (Date.now() >= grant.expiresAt.getTime()) {
      grant.status = 'EXPIRED';
      return { active: false, grant, reason: 'Break-glass elevation period has expired.' };
    }

    return { active: true, grant };
  }

  /**
   * Revokes a grant immediately upon incident conclusion.
   */
  public revokeGrant(grantId: string, revokedBy: UserContext): boolean {
    const grant = this.grants.get(grantId);
    if (!grant) return false;
    if (revokedBy.tenantId !== grant.tenantId) {
      throw new Error('Break-glass grant can only be revoked from within its tenant.');
    }
    const isOwner = revokedBy.userId === grant.userId;
    if (!isOwner && !BREAK_GLASS_APPROVER_ROLES.includes(revokedBy.role)) {
      throw new Error(`Role ${revokedBy.role} is not authorized to revoke break-glass elevation.`);
    }

    grant.status = 'REVOKED';
    grant.revokedAt = new Date();
    grant.revokedBy = revokedBy.userId;

    this.auditLogger({
      action: 'BREAK_GLASS_ELEVATION_REVOKED',
      grantId,
      userId: grant.userId,
      tenantId: grant.tenantId,
      actorUserId: revokedBy.userId,
    });
    return true;
  }

  /**
   * Elevates a base user context into an audited temporary break-glass context.
   * Contexts must be re-derived per request so revocation takes effect immediately;
   * the returned context also carries the grant expiry, which evaluateAccess enforces.
   */
  public applyGrantToUser(baseUser: UserContext, grantId: string): UserContext {
    const check = this.validateGrant(grantId);
    if (!check.active || !check.grant) {
      throw new Error(`Cannot elevate context: ${check.reason || 'Invalid grant'}`);
    }

    if (baseUser.userId !== check.grant.userId || baseUser.tenantId !== check.grant.tenantId) {
      throw new Error('Break-glass grant identity mismatch: user or tenant does not match grant credentials.');
    }

    this.auditLogger({
      action: 'BREAK_GLASS_ELEVATION_USED',
      grantId,
      userId: baseUser.userId,
      tenantId: baseUser.tenantId,
      actorUserId: baseUser.userId,
      details: { elevatedRole: check.grant.elevatedRole },
    });

    return {
      ...baseUser,
      role: check.grant.elevatedRole,
      roles: [],
      isBreakGlass: true,
      breakGlassExpiresAt: new Date(check.grant.expiresAt.getTime()),
    };
  }
}
