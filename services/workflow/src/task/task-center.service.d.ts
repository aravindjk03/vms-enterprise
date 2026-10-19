import type { ApprovalTask, UserContext, WorkflowDomain } from '@vms/types';
import { WorkflowRepository, ApprovalRepository } from '@vms/database';
import { DelegationManager } from '../approval/delegation-manager.js';
export interface TaskCenterQuery {
    view: 'MY_PENDING' | 'ASSIGNED_TO_ME' | 'DELEGATED' | 'WAITING_OTHERS' | 'OVERDUE' | 'ESCALATED' | 'COMPLETED';
    domain?: WorkflowDomain;
    siteId?: string;
    limit?: number;
    offset?: number;
}
export interface TaskItemView {
    taskId: string;
    instanceId: string;
    sourceDomain: WorkflowDomain;
    sourceTransactionId: string;
    siteId?: string;
    requesterName?: string;
    stageName: string;
    assignedApprover: string;
    submittedAt: Date;
    slaDueAt?: Date;
    slaStatus: 'ON_TIME' | 'WARNING' | 'OVERDUE';
    status: ApprovalTask['status'];
    availableActions: string[];
    sanitizedDetails: Record<string, unknown>;
}
export declare class TaskCenterService {
    private workflowRepo;
    private approvalRepo;
    private delegationManager;
    constructor(workflowRepo: WorkflowRepository, approvalRepo: ApprovalRepository, delegationManager: DelegationManager);
    /**
     * Retrieves task views according to persona and authorization boundaries (Section 23).
     */
    getTasks(query: TaskCenterQuery, user: UserContext): TaskItemView[];
    private mapToTaskItemView;
}
