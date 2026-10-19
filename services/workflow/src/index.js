/**
 * VMS Enterprise: Workflow Builder, Approval Engine & Rules Framework (Part 5)
 */
export { CANONICAL_MASTER_CATEGORIES } from './master-data/categories.js';
export { MasterDataService, } from './master-data/master-data.service.js';
export { WorkflowValidator } from './engine/workflow-validator.js';
export { WorkflowEngine, } from './engine/workflow-engine.js';
export { CANONICAL_WORKFLOW_TEMPLATES, VISITOR_WORKFLOW_TEMPLATE, CUSTOMER_WORKFLOW_TEMPLATE, CONTRACTOR_WORKFLOW_TEMPLATE, SERVICE_WORKFLOW_TEMPLATE, MATERIAL_WORKFLOW_TEMPLATE, } from './engine/templates.js';
export { DelegationManager, } from './approval/delegation-manager.js';
export { ApprovalEngine, } from './approval/approval-engine.js';
export { SlaEngine } from './sla/sla-engine.js';
export { RuleEvaluator } from './rules/rule-evaluator.js';
export { TransactionalOutboxService } from './events/outbox-service.js';
export { TaskCenterService, } from './task/task-center.service.js';
