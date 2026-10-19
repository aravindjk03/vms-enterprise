import type { WorkflowStage, WorkflowTransition, WorkflowDomain } from '@vms/types';
export interface WorkflowTemplateDef {
    domain: WorkflowDomain;
    code: string;
    name: string;
    description: string;
    stages: WorkflowStage[];
    transitions: WorkflowTransition[];
}
/**
 * Section 25: Domain-Specific Workflow Templates (Demonstration of Engine)
 * Domain pipelines remain isolated and are NOT merged into one universal workflow.
 */
export declare const VISITOR_WORKFLOW_TEMPLATE: WorkflowTemplateDef;
export declare const CUSTOMER_WORKFLOW_TEMPLATE: WorkflowTemplateDef;
export declare const CONTRACTOR_WORKFLOW_TEMPLATE: WorkflowTemplateDef;
export declare const SERVICE_WORKFLOW_TEMPLATE: WorkflowTemplateDef;
export declare const MATERIAL_WORKFLOW_TEMPLATE: WorkflowTemplateDef;
export declare const CANONICAL_WORKFLOW_TEMPLATES: WorkflowTemplateDef[];
