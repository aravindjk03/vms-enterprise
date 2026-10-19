import { describe, it } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { RelationalDatabase, PolicyRepository, AuditRepository } from '@vms/database';
import type { UserContext, PolicyDefinition, PolicyRule, RuleCondition } from '@vms/types';
import { RuleEvaluator } from '../services/workflow/src/rules/rule-evaluator.js';

describe('Part 5: RuleEvaluator & Precedence Engine (Sections 12, 33)', () => {
  const db = new RelationalDatabase();
  const policyRepo = new PolicyRepository(db);
  const auditRepo = new AuditRepository(db);
  const evaluator = new RuleEvaluator(policyRepo, auditRepo);

  const tenantId = 'tenant-rules-test';
  const testUser: UserContext = {
    userId: 'user-rules-01',
    tenantId,
    organizationId: 'org-01',
    role: 'SECURITY_MANAGER',
  };

  it('1. Safely evaluates declarative operators without eval()', () => {
    // EQUALS & NOT_EQUALS
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'type', operator: 'EQUALS', value: 'VIP' }, { type: 'VIP' }),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'type', operator: 'NOT_EQUALS', value: 'VIP' }, { type: 'CONTRACTOR' }),
      true
    );

    // GREATER_THAN & LESS_THAN
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'grossWeight', operator: 'GREATER_THAN', value: 10000 }, { grossWeight: 15000 }),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'grossWeight', operator: 'LESS_THAN', value: 10000 }, { grossWeight: 5000 }),
      true
    );

    // CONTAINS (string & array)
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'zones', operator: 'CONTAINS', value: 'ZONE_C' }, { zones: ['ZONE_A', 'ZONE_C'] }),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'notes', operator: 'CONTAINS', value: 'hazardous' }, { notes: 'Contains hazardous cargo' }),
      true
    );

    // IN & NOT_IN
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'status', operator: 'IN', value: ['ACTIVE', 'VALID'] }, { status: 'ACTIVE' }),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'status', operator: 'NOT_IN', value: ['REVOKED', 'EXPIRED'] }, { status: 'ACTIVE' }),
      true
    );

    // EXISTS
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'ndaId', operator: 'EXISTS', value: true }, { ndaId: 'NDA-001' }),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'missingField', operator: 'EXISTS', value: true }, {}),
      false
    );

    // IS_VALID
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'induction', operator: 'IS_VALID', value: true }, { induction: 'VALID' }),
      true
    );

    // IS_EXPIRED
    const pastDate = new Date(Date.now() - 100000);
    const futureDate = new Date(Date.now() + 100000);
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'expiry', operator: 'IS_EXPIRED', value: true }, { expiry: pastDate }),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition({ field: 'expiry', operator: 'IS_EXPIRED', value: true }, { expiry: futureDate }),
      false
    );
  });

  it('2. Evaluates compound rules with AND / OR conjunctions', () => {
    const andRule: PolicyRule = {
      ruleId: 'r-and',
      policyId: 'p-1',
      ruleCode: 'RULE_AND',
      name: 'All Must Match',
      priority: 1,
      conditions: [
        { field: 'isVip', operator: 'EQUALS', value: true },
        { field: 'escortAssigned', operator: 'EQUALS', value: true, logic: 'AND' },
      ],
      action: 'ALLOW',
    };

    assert.strictEqual(evaluator.evaluateRule(andRule, { isVip: true, escortAssigned: true }), true);
    assert.strictEqual(evaluator.evaluateRule(andRule, { isVip: true, escortAssigned: false }), false);

    const orRule: PolicyRule = {
      ruleId: 'r-or',
      policyId: 'p-1',
      ruleCode: 'RULE_OR',
      name: 'Either May Match',
      priority: 1,
      conditions: [
        { field: 'hasPassport', operator: 'EQUALS', value: true },
        { field: 'hasNationalId', operator: 'EQUALS', value: true, logic: 'OR' },
      ],
      action: 'ALLOW',
    };

    assert.strictEqual(evaluator.evaluateRule(orRule, { hasPassport: false, hasNationalId: true }), true);
    assert.strictEqual(evaluator.evaluateRule(orRule, { hasPassport: false, hasNationalId: false }), false);
  });

  it('3. Precedence: DENY rule priority dominates over ALLOW', () => {
    const policy: PolicyDefinition = {
      policyId: 'pol-prec-01',
      tenantId,
      domain: 'VISITOR',
      code: 'POL_PRECEDENCE_TEST',
      name: 'Precedence Test Policy',
      isActive: true,
      version: 1,
      rules: [
        {
          ruleId: 'r-high-deny',
          policyId: 'pol-prec-01',
          ruleCode: 'DENY_BLACKLIST',
          name: 'Watchlist Deny',
          priority: 1, // Higher priority
          conditions: [{ field: 'isBlacklisted', operator: 'EQUALS', value: true }],
          action: 'DENY',
        },
        {
          ruleId: 'r-low-allow',
          policyId: 'pol-prec-01',
          ruleCode: 'ALLOW_VIP',
          name: 'VIP Allow',
          priority: 10, // Lower priority
          conditions: [{ field: 'isVip', operator: 'EQUALS', value: true }],
          action: 'ALLOW',
        },
      ],
    };

    policyRepo.createPolicy(policy, tenantId);

    // Entity is both VIP AND Blacklisted!
    const result = evaluator.evaluatePolicies({
      domain: 'VISITOR',
      transactionId: 'TXN-PREC-01',
      context: { isVip: true, isBlacklisted: true },
      user: testUser,
    });

    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.action, 'DENY');
    assert.ok(result.explanation.includes('Watchlist Deny'));
  });

  it('4. Precedence: Site-specific policy overrides global tenant policy', () => {
    const globalPolicy: PolicyDefinition = {
      policyId: 'pol-global',
      tenantId,
      domain: 'MATERIAL',
      code: 'POL_MATERIAL_GLOBAL',
      name: 'Global Material Policy',
      isActive: true,
      version: 1,
      // No siteId -> global default
      rules: [
        {
          ruleId: 'r-glob',
          policyId: 'pol-global',
          ruleCode: 'GLOBAL_ALLOW',
          name: 'Global Inward Allow',
          priority: 10,
          conditions: [{ field: 'inward', operator: 'EQUALS', value: true }],
          action: 'ALLOW',
        },
      ],
    };

    const sitePolicy: PolicyDefinition = {
      policyId: 'pol-site',
      tenantId,
      siteId: 'site-chennai',
      domain: 'MATERIAL',
      code: 'POL_MATERIAL_CHENNAI',
      name: 'Chennai Restricted Site Policy',
      isActive: true,
      version: 1,
      rules: [
        {
          ruleId: 'r-site-deny',
          policyId: 'pol-site',
          ruleCode: 'SITE_DENY_CHEMICAL',
          name: 'Chennai Chemical Ban',
          priority: 5,
          conditions: [{ field: 'isHazardousChemical', operator: 'EQUALS', value: true }],
          action: 'DENY',
        },
      ],
    };

    policyRepo.createPolicy(globalPolicy, tenantId);
    policyRepo.createPolicy(sitePolicy, tenantId);

    // Evaluate for Chennai site with hazardous cargo
    const result = evaluator.evaluatePolicies({
      domain: 'MATERIAL',
      siteId: 'site-chennai',
      transactionId: 'TXN-SITE-01',
      context: { inward: true, isHazardousChemical: true },
      user: testUser,
    });

    assert.strictEqual(result.allowed, false);
    assert.strictEqual(result.action, 'DENY');
    assert.ok(result.explanation.includes('Chennai Chemical Ban'));
  });

  it('5. Enforces REQUIRE_APPROVAL and records evaluation ledger for compliance', () => {
    const policy: PolicyDefinition = {
      policyId: 'pol-appr-req',
      tenantId,
      domain: 'CONTRACTOR',
      code: 'POL_CONT_REQ',
      name: 'Contractor Requirement Policy',
      isActive: true,
      version: 1,
      rules: [
        {
          ruleId: 'r-hot-work',
          policyId: 'pol-appr-req',
          ruleCode: 'HOT_WORK_APPR',
          name: 'Hot Work Level 3 Approval',
          priority: 5,
          conditions: [{ field: 'hotWork', operator: 'EQUALS', value: true }],
          action: 'REQUIRE_APPROVAL',
        },
      ],
    };

    policyRepo.createPolicy(policy, tenantId);

    const result = evaluator.evaluatePolicies({
      domain: 'CONTRACTOR',
      transactionId: 'TXN-HW-01',
      context: { hotWork: true },
      user: testUser,
    });

    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.action, 'REQUIRE_APPROVAL');

    // Evaluation record in database
    const evals = (policyRepo as any).db.findMany('policy_evaluation_records', {
      transaction_id: 'TXN-HW-01',
    });
    assert.strictEqual(evals.length, 1);
    assert.strictEqual(evals[0].action_result, 'REQUIRE_APPROVAL');
  });

  it('7. Resolves nested dot-notation paths and array index paths reliably', () => {
    const complexContext = {
      visitor: {
        department: 'SECURITY_OPS',
        credentials: {
          verified: true,
          badgeLevel: 4,
        },
      },
      items: [
        { code: 'CHEM_01', hazmat: true, quantity: 15 },
        { code: 'TOOL_02', hazmat: false, quantity: 2 },
      ],
      tags: ['SENSITIVE', 'BIOMETRIC_ENROLLED'],
    };

    // Dot notation tests
    assert.strictEqual(
      evaluator.evaluateCondition(
        { field: 'visitor.department', operator: 'EQUALS', value: 'SECURITY_OPS' },
        complexContext
      ),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition(
        { field: 'visitor.credentials.badgeLevel', operator: 'GREATER_THAN', value: 3 },
        complexContext
      ),
      true
    );

    // Array index notation (bracket and dot)
    assert.strictEqual(
      evaluator.evaluateCondition(
        { field: 'items[0].code', operator: 'EQUALS', value: 'CHEM_01' },
        complexContext
      ),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition(
        { field: 'items.0.hazmat', operator: 'EQUALS', value: true },
        complexContext
      ),
      true
    );
    assert.strictEqual(
      evaluator.evaluateCondition(
        { field: 'items[1].quantity', operator: 'LESS_THAN', value: 5 },
        complexContext
      ),
      true
    );

    // Non-existent path returns undefined safely without crash
    assert.strictEqual(
      evaluator.evaluateCondition(
        { field: 'visitor.nonExistent.field', operator: 'EXISTS', value: true },
        complexContext
      ),
      false
    );
  });
});
