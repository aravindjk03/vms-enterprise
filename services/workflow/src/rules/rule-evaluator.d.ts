import type { RuleCondition, PolicyRule, PolicyEvaluationResult, WorkflowDomain, UserContext } from '@vms/types';
import { PolicyRepository, AuditRepository } from '@vms/database';
/**
 * Resolves dot-notation ('visitor.department') and array index ('items[0].sku', 'items.0.sku') paths.
 */
export declare function resolvePropertyPath(obj: any, path: string): unknown;
export declare class RuleEvaluator {
    private policyRepo;
    private auditRepo;
    constructor(policyRepo: PolicyRepository, auditRepo: AuditRepository);
    /**
     * Safely evaluates a single condition against context payload without eval (Section 12).
     */
    evaluateCondition(condition: RuleCondition, context: Record<string, unknown>): boolean;
    /**
     * Evaluates a rule containing multiple conditions with AND / OR conjunctions.
     */
    evaluateRule(rule: PolicyRule, context: Record<string, unknown>): boolean;
    /**
     * Evaluates applicable policies with strict documented precedence (Section 33):
     * Precedence Order:
     * 1. Transaction-specific condition (Priority 1)
     * 2. Site-specific policy (Priority 2)
     * 3. Domain-specific policy (Priority 3)
     * 4. Global tenant default (Priority 4)
     */
    evaluatePolicies(params: {
        domain: WorkflowDomain;
        siteId?: string;
        transactionId: string;
        context: Record<string, unknown>;
        user: UserContext;
    }): PolicyEvaluationResult;
}
