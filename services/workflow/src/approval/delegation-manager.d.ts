import type { ApprovalDelegation, WorkflowDomain, UserContext } from '@vms/types';
import { ApprovalRepository, AuditRepository } from '@vms/database';
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
export declare class DelegationManager {
    private approvalRepo;
    private auditRepo;
    constructor(approvalRepo: ApprovalRepository, auditRepo: AuditRepository);
    /**
     * Creates a new temporary approval delegation (Section 21).
     * Validates that the delegate possesses underlying permissions and that delegation does not exceed delegator rights.
     */
    createDelegation(input: CreateDelegationInput, user: UserContext, delegateUser: UserContext): Promise<ApprovalDelegation>;
    /**
     * Revokes an active delegation early.
     */
    revokeDelegation(delegationId: string, reason: string, user: UserContext): Promise<void>;
    /**
     * Checks if an active delegation path exists between fromUser and toUser (direct or transitive).
     */
    hasActiveDelegationPath(fromUser: string, toUser: string, domain?: WorkflowDomain, tenantId?: string, visited?: Set<string>): boolean;
    /**
     * Finds active delegations for a given delegator or delegate, filtering out expired ones.
     * Supports both direct delegations and transitive delegation chains with cycle guards.
     */
    getActiveDelegationForDelegate(delegateUserId: string, delegatorUserId: string, domain?: WorkflowDomain, tenantId?: string, visited?: Set<string>): ApprovalDelegation | null;
}
