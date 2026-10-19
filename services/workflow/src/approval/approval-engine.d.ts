import type { ApprovalTask, ApprovalActionRecord, ApprovalDecision, WorkflowStage, WorkflowInstance, UserContext } from '@vms/types';
import { WorkflowRepository, ApprovalRepository, AuditRepository } from '@vms/database';
import { DelegationManager } from './delegation-manager.js';
import { WorkflowEngine } from '../engine/workflow-engine.js';
export interface SubmitDecisionInput {
    taskId: string;
    decision: ApprovalDecision;
    remarks?: string;
    changesRequiredDetails?: string;
    delegationId?: string;
    requesterUserId?: string;
}
export declare class ApprovalEngine {
    private workflowRepo;
    private approvalRepo;
    private auditRepo;
    private delegationManager;
    private workflowEngine;
    constructor(workflowRepo: WorkflowRepository, approvalRepo: ApprovalRepository, auditRepo: AuditRepository, delegationManager: DelegationManager, workflowEngine: WorkflowEngine);
    /**
     * Initializes approval tasks for a newly entered APPROVAL stage (Section 15, 16, 18).
     */
    createTasksForStage(params: {
        instance: WorkflowInstance;
        stage: WorkflowStage;
        siteId?: string;
        requesterUserId?: string;
        hostUserId?: string;
        responsibleManagerUserId?: string;
        user: UserContext;
    }): Promise<ApprovalTask[]>;
    /**
     * Submits an approval authorization decision (Section 17, 18, 19, 20).
     * Validates permissions, enforces self-approval restrictions, records audit trail, and advances workflow.
     */
    submitDecision(input: SubmitDecisionInput, actorUser: UserContext): Promise<{
        task: ApprovalTask;
        decisionRecord: ApprovalActionRecord;
        isStageSatisfied: boolean;
    }>;
    getTask(taskId: string): ApprovalTask | null;
    listTasks(filter: Record<string, any>): ApprovalTask[];
}
