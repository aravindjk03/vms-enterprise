import type { WorkflowVersion, WorkflowValidationResult } from '@vms/types';
export declare class WorkflowValidator {
    /**
     * Performs rigorous static analysis on a WorkflowVersion definition (Section 14).
     */
    validate(version: WorkflowVersion): WorkflowValidationResult;
    /**
     * Cycle analysis to detect infinite loops without exit transitions.
     */
    private detectUnboundedCycles;
}
