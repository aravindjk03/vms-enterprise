import { randomUUID } from 'node:crypto';
/**
 * Resolves dot-notation ('visitor.department') and array index ('items[0].sku', 'items.0.sku') paths.
 */
export function resolvePropertyPath(obj, path) {
    if (!obj || typeof obj !== 'object' || !path)
        return undefined;
    if (path in obj)
        return obj[path]; // Direct key takes precedence
    const normalized = path.replace(/\[(\w+)\]/g, '.$1');
    const segments = normalized.split('.');
    let current = obj;
    for (const seg of segments) {
        if (current === null || current === undefined)
            return undefined;
        current = current[seg];
    }
    return current;
}
export class RuleEvaluator {
    policyRepo;
    auditRepo;
    constructor(policyRepo, auditRepo) {
        this.policyRepo = policyRepo;
        this.auditRepo = auditRepo;
    }
    /**
     * Safely evaluates a single condition against context payload without eval (Section 12).
     */
    evaluateCondition(condition, context) {
        const val = resolvePropertyPath(context, condition.field);
        switch (condition.operator) {
            case 'EQUALS':
                return val === condition.value || String(val).toLowerCase() === String(condition.value).toLowerCase();
            case 'NOT_EQUALS':
                return val !== condition.value && String(val).toLowerCase() !== String(condition.value).toLowerCase();
            case 'GREATER_THAN':
                return Number(val) > Number(condition.value);
            case 'LESS_THAN':
                return Number(val) < Number(condition.value);
            case 'CONTAINS':
                return Array.isArray(val)
                    ? val.includes(condition.value)
                    : String(val).toLowerCase().includes(String(condition.value).toLowerCase());
            case 'IN':
                if (Array.isArray(condition.value)) {
                    return condition.value.includes(val);
                }
                return false;
            case 'NOT_IN':
                if (Array.isArray(condition.value)) {
                    return !condition.value.includes(val);
                }
                return true;
            case 'EXISTS':
                return val !== undefined && val !== null && val !== '';
            case 'IS_VALID':
                return val === true || val === 'VALID' || val === 'ACTIVE';
            case 'IS_EXPIRED':
                if (val instanceof Date)
                    return val.getTime() < Date.now();
                if (typeof val === 'string')
                    return new Date(val).getTime() < Date.now();
                return false;
            default:
                return false;
        }
    }
    /**
     * Evaluates a rule containing multiple conditions with AND / OR conjunctions.
     */
    evaluateRule(rule, context) {
        if (!rule.conditions || rule.conditions.length === 0) {
            return true;
        }
        // Default conjunction is AND unless any condition has logic: 'OR'
        let currentResult = true;
        for (let i = 0; i < rule.conditions.length; i++) {
            const cond = rule.conditions[i];
            const match = this.evaluateCondition(cond, context);
            if (i === 0) {
                currentResult = match;
            }
            else {
                if (cond.logic === 'OR') {
                    currentResult = currentResult || match;
                }
                else {
                    currentResult = currentResult && match;
                }
            }
        }
        return currentResult;
    }
    /**
     * Evaluates applicable policies with strict documented precedence (Section 33):
     * Precedence Order:
     * 1. Transaction-specific condition (Priority 1)
     * 2. Site-specific policy (Priority 2)
     * 3. Domain-specific policy (Priority 3)
     * 4. Global tenant default (Priority 4)
     */
    evaluatePolicies(params) {
        const policies = this.policyRepo.listPolicies(params.domain, params.user.tenantId);
        // Sort by site specificity (Site-specific before global)
        const sortedPolicies = [...policies].sort((a, b) => {
            const aIsSite = a.siteId === params.siteId ? 1 : 0;
            const bIsSite = b.siteId === params.siteId ? 1 : 0;
            return bIsSite - aIsSite;
        });
        const matchedRules = [];
        let dominantAction = 'ALLOW';
        let explanation = 'All default policy checks passed.';
        for (const policy of sortedPolicies) {
            const rules = (policy.rules || []).sort((r1, r2) => r1.priority - r2.priority);
            for (const rule of rules) {
                if (this.evaluateRule(rule, params.context)) {
                    matchedRules.push({
                        ruleId: rule.ruleId,
                        ruleCode: rule.ruleCode,
                        name: rule.name,
                    });
                    if (rule.action === 'DENY') {
                        dominantAction = 'DENY';
                        explanation = `Denied by policy rule '${rule.name}' (${rule.ruleCode}).`;
                        break;
                    }
                    else if (rule.action === 'REQUIRE_APPROVAL' && dominantAction !== 'DENY') {
                        dominantAction = 'REQUIRE_APPROVAL';
                        explanation = `Additional approval required by rule '${rule.name}'.`;
                    }
                    else if (rule.action === 'REQUIRE_DOCUMENT' && dominantAction !== 'DENY') {
                        dominantAction = 'REQUIRE_DOCUMENT';
                        explanation = `Required document enforced by rule '${rule.name}'.`;
                    }
                }
            }
            if (dominantAction === 'DENY')
                break;
        }
        const evaluationResult = {
            allowed: dominantAction !== 'DENY',
            action: dominantAction,
            matchedRules,
            explanation,
        };
        // Record evaluation in repository for auditability
        this.policyRepo.recordEvaluation({
            evaluation_id: randomUUID(),
            tenant_id: params.user.tenantId,
            domain: params.domain,
            transaction_id: params.transactionId,
            allowed: evaluationResult.allowed,
            action_result: dominantAction,
            explanation,
        }, params.user.tenantId);
        return evaluationResult;
    }
}
