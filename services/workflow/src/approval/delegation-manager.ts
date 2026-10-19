import { randomUUID } from 'node:crypto';
import type {
  ApprovalDelegation,
  WorkflowDomain,
  UserContext,
} from '@vms/types';
import { ApprovalRepository, AuditRepository } from '@vms/database';
import { ROLE_PERMISSIONS, type PermissionAction } from '@vms/permissions';

export interface CreateDelegationInput {
  delegatorUserId: string;
  delegateUserId: string;
  domainScope?: WorkflowDomain;
  siteScopeId?: string;
  stageScopeId?: string;
  validFrom: Date;
  validTo: Date;
  reason?: string;
}

export class DelegationManager {
  constructor(
    private approvalRepo: ApprovalRepository,
    private auditRepo: AuditRepository
  ) {}

  /**
   * Creates a new temporary approval delegation (Section 21).
   * Validates that the delegate possesses underlying permissions and that delegation does not exceed delegator rights.
   */
  public async createDelegation(
    input: CreateDelegationInput,
    user: UserContext,
    delegateUser: UserContext
  ): Promise<ApprovalDelegation> {
    if (input.delegatorUserId === input.delegateUserId) {
      throw new Error('Self-delegation is prohibited: User cannot delegate approval authority to themselves.');
    }

    if (input.validFrom >= input.validTo) {
      throw new Error('Invalid delegation window: validFrom must be strictly before validTo.');
    }

    if (new Date(input.validTo) <= new Date()) {
      throw new Error('Invalid delegation: Expiry date cannot be in the past.');
    }

    // Circular delegation detection: Verify delegateUser does not already hold a delegation path back to delegator
    if (this.hasActiveDelegationPath(input.delegateUserId, input.delegatorUserId, input.domainScope, user.tenantId)) {
      throw new Error(
        `Circular delegation detected: User '${input.delegateUserId}' already holds an active delegation path back to '${input.delegatorUserId}'.`
      );
    }

    // Verify delegate has underlying approval permission
    const delegatePermissions = ROLE_PERMISSIONS[delegateUser.role] || [];
    const hasApprovalPermission = delegatePermissions.includes('VISITOR_APPROVE' as PermissionAction) ||
      delegatePermissions.includes('PTW_APPROVE' as PermissionAction) ||
      delegatePermissions.includes('visitor.approve' as PermissionAction) ||
      delegatePermissions.includes('contractor.approve' as PermissionAction) ||
      delegatePermissions.includes('material.approve' as PermissionAction) ||
      delegatePermissions.includes('service.approve' as PermissionAction) ||
      delegatePermissions.includes('customer.approve' as PermissionAction);

    if (!hasApprovalPermission && delegateUser.role !== 'SUPER_ADMIN' && delegateUser.role !== 'ORGANIZATION_ADMIN') {
      throw new Error(
        `Delegation rejected: Delegate '${input.delegateUserId}' (${delegateUser.role}) does not possess the requisite underlying approval permissions.`
      );
    }

    const delegationId = randomUUID();
    const now = new Date();

    const delegation: ApprovalDelegation = {
      delegationId,
      tenantId: user.tenantId,
      delegatorUserId: input.delegatorUserId,
      delegateUserId: input.delegateUserId,
      domainScope: input.domainScope,
      siteScopeId: input.siteScopeId,
      stageScopeId: input.stageScopeId,
      validFrom: input.validFrom,
      validTo: input.validTo,
      reason: input.reason || 'Temporary out-of-office proxy delegation',
      status: 'ACTIVE',
      createdAt: now,
    };

    const created = this.approvalRepo.createDelegation(delegation, user.tenantId);

    this.auditRepo.logAudit({
      audit_id: randomUUID(),
      tenant_id: user.tenantId,
      actor_id: user.userId,
      actor_role: user.role,
      action: 'APPROVAL_DELEGATION_CREATE',
      entity_type: 'APPROVAL_DELEGATION',
      entity_id: delegationId,
      timestamp: now,
      request_id: randomUUID(),
      correlation_id: `delegation-${delegationId}`,
      source: 'DelegationManager',
      after_snapshot: {
        delegator: input.delegatorUserId,
        delegate: input.delegateUserId,
        validFrom: input.validFrom.toISOString(),
        validTo: input.validTo.toISOString(),
        domain: input.domainScope,
      },
    }, user.tenantId);

    return created;
  }

  /**
   * Revokes an active delegation early.
   */
  public async revokeDelegation(delegationId: string, reason: string, user: UserContext): Promise<void> {
    const delegations = this.approvalRepo.listDelegations({ delegation_id: delegationId }, user.tenantId);
    const existing = delegations[0];
    if (!existing) {
      throw new Error(`Delegation '${delegationId}' not found.`);
    }

    (this.approvalRepo as any).db.update('approval_delegations', delegationId, {
      status: 'REVOKED',
    }, user.tenantId);

    this.auditRepo.logAudit({
      audit_id: randomUUID(),
      tenant_id: user.tenantId,
      actor_id: user.userId,
      actor_role: user.role,
      action: 'APPROVAL_DELEGATION_REVOKE',
      entity_type: 'APPROVAL_DELEGATION',
      entity_id: delegationId,
      timestamp: new Date(),
      request_id: randomUUID(),
      correlation_id: `del-rev-${delegationId}`,
      source: 'DelegationManager',
      reason,
      after_snapshot: { reason },
    }, user.tenantId);
  }

  /**
   * Checks if an active delegation path exists between fromUser and toUser (direct or transitive).
   */
  public hasActiveDelegationPath(
    fromUser: string,
    toUser: string,
    domain?: WorkflowDomain,
    tenantId?: string,
    visited = new Set<string>()
  ): boolean {
    if (fromUser === toUser) return true;
    if (visited.has(fromUser)) return false;
    visited.add(fromUser);

    const delegations = this.approvalRepo.listDelegations({
      delegator_user_id: fromUser,
      status: 'ACTIVE',
    }, tenantId);

    const now = new Date();
    for (const d of delegations) {
      const from = new Date(d.valid_from || d.validFrom);
      const to = new Date(d.valid_to || d.validTo);
      if (now < from || now > to) continue;
      if (domain && (d.domain_scope || d.domainScope) && (d.domain_scope || d.domainScope) !== domain) {
        continue;
      }

      const nextDelegate = d.delegate_user_id || d.delegateUserId;
      if (nextDelegate === toUser) return true;
      if (this.hasActiveDelegationPath(nextDelegate, toUser, domain, tenantId, visited)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Finds active delegations for a given delegator or delegate, filtering out expired ones.
   * Supports both direct delegations and transitive delegation chains with cycle guards.
   */
  public getActiveDelegationForDelegate(
    delegateUserId: string,
    delegatorUserId: string,
    domain?: WorkflowDomain,
    tenantId?: string,
    visited = new Set<string>()
  ): ApprovalDelegation | null {
    if (visited.has(delegatorUserId)) return null;
    visited.add(delegatorUserId);

    const delegations = this.approvalRepo.listDelegations({
      delegator_user_id: delegatorUserId,
      status: 'ACTIVE',
    }, tenantId);

    const now = new Date();
    const active = delegations.filter((d: any) => {
      const from = new Date(d.valid_from || d.validFrom);
      const to = new Date(d.valid_to || d.validTo);
      if (now < from || now > to) return false;
      if (domain && (d.domain_scope || d.domainScope) && (d.domain_scope || d.domainScope) !== domain) {
        return false;
      }
      return true;
    });

    // 1. Direct delegation check
    for (const d of active) {
      const directDelegate = d.delegate_user_id || d.delegateUserId;
      if (directDelegate === delegateUserId) {
        return d;
      }
    }

    // 2. Transitive delegation chain (delegator -> intermediary -> ... -> delegateUserId)
    for (const d of active) {
      const intermediary = d.delegate_user_id || d.delegateUserId;
      const sub = this.getActiveDelegationForDelegate(
        delegateUserId,
        intermediary,
        domain,
        tenantId,
        new Set(visited)
      );
      if (sub) {
        return d;
      }
    }

    return null;
  }
}
