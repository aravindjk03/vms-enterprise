import type { SlaEvaluationResult } from '@vms/types';
import { WorkflowRepository, AuditRepository } from '@vms/database';
export declare class SlaEngine {
    private workflowRepo;
    private auditRepo;
    constructor(workflowRepo: WorkflowRepository, auditRepo: AuditRepository);
    /**
     * Evaluates all pending tasks against their SLA thresholds (Section 22).
     * Emits warnings, breaches, and auto-escalations without duplicate alert flooding.
     */
    evaluatePendingTasks(tenantId: string, asOfDate?: Date): Promise<SlaEvaluationResult[]>;
}
