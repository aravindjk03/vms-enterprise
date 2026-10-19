/**
 * VMS Enterprise: Workflow Builder, Approval Engine & Rules Framework (Part 5)
 */
export { CANONICAL_MASTER_CATEGORIES } from './master-data/categories.js';
export { MasterDataService, type CreateMasterRecordInput, type UpdateMasterRecordInput, } from './master-data/master-data.service.js';
export { WorkflowValidator } from './engine/workflow-validator.js';
export { WorkflowEngine, type CreateDefinitionInput, } from './engine/workflow-engine.js';
export { CANONICAL_WORKFLOW_TEMPLATES, VISITOR_WORKFLOW_TEMPLATE, CUSTOMER_WORKFLOW_TEMPLATE, CONTRACTOR_WORKFLOW_TEMPLATE, SERVICE_WORKFLOW_TEMPLATE, MATERIAL_WORKFLOW_TEMPLATE, type WorkflowTemplateDef, } from './engine/templates.js';
export { DelegationManager, type CreateDelegationInput, } from './approval/delegation-manager.js';
export { ApprovalEngine, type SubmitDecisionInput, } from './approval/approval-engine.js';
export { SlaEngine } from './sla/sla-engine.js';
export { RuleEvaluator } from './rules/rule-evaluator.js';
export { TransactionalOutboxService } from './events/outbox-service.js';
export { TaskCenterService, type TaskCenterQuery, type TaskItemView, } from './task/task-center.service.js';
