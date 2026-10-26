import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  Sliders,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Card, StatusBadge,
  showToast,
} from '@vms/ui';
import type { PolicyDefinition, PolicyRule, RuleCondition, WorkflowDomain } from '@vms/types';

export interface RulesEngineViewProps {
  tenantId?: string;
}

// Canonical policies for demonstration
const INITIAL_POLICIES: PolicyDefinition[] = [
  {
    policyId: 'pol-01',
    tenantId: 'tenant-demo',
    domain: 'VISITOR',
    code: 'POL_VISITOR_ACCESS_RULES',
    name: 'Industrial Visitor Access Security Matrix',
    description: 'Enforces VIP escalation, mandatory NDAs for R&D labs, and blacklisted person denials',
    isActive: true,
    version: 1,
    rules: [
      {
        ruleId: 'r-01',
        policyId: 'pol-01',
        ruleCode: 'RULE_BLOCK_BLACKLIST',
        name: 'Deny Watchlisted & Blacklisted Entities',
        priority: 1,
        conditions: [
          { field: 'is_blacklisted', operator: 'EQUALS', value: true },
        ],
        action: 'DENY',
      },
      {
        ruleId: 'r-02',
        policyId: 'pol-01',
        ruleCode: 'RULE_REQUIRE_VIP_ESCORT',
        name: 'Require Security Escort for VIP Dignitaries',
        priority: 10,
        conditions: [
          { field: 'visitor_type', operator: 'EQUALS', value: 'VIP' },
          { field: 'has_security_escort', operator: 'NOT_EQUALS', value: true, logic: 'AND' },
        ],
        action: 'REQUIRE_APPROVAL',
      },
      {
        ruleId: 'r-03',
        policyId: 'pol-01',
        ruleCode: 'RULE_REQUIRE_NDA_RD',
        name: 'Require Bilateral NDA for R&D Campus Entry',
        priority: 20,
        conditions: [
          { field: 'target_zone', operator: 'EQUALS', value: 'R_AND_D_LAB' },
          { field: 'nda_signed', operator: 'NOT_EQUALS', value: true, logic: 'AND' },
        ],
        action: 'REQUIRE_DOCUMENT',
      },
    ],
  },
  {
    policyId: 'pol-02',
    tenantId: 'tenant-demo',
    domain: 'CONTRACTOR',
    code: 'POL_CONTRACTOR_EHS_RULES',
    name: 'Contractor Workforce Safety Rules',
    description: 'Validates medical fitness, height work certification, and safety permit requirements',
    isActive: true,
    version: 1,
    rules: [
      {
        ruleId: 'r-11',
        policyId: 'pol-02',
        ruleCode: 'RULE_DENY_UNINDUCTED_WORKER',
        name: 'Deny Workers Without Safety Induction',
        priority: 1,
        conditions: [
          { field: 'induction_completed', operator: 'EQUALS', value: false },
        ],
        action: 'DENY',
      },
      {
        ruleId: 'r-12',
        policyId: 'pol-02',
        ruleCode: 'RULE_HOT_WORK_PTW',
        name: 'Require PTW Level 3 for Welding & Sparking',
        priority: 5,
        conditions: [
          { field: 'work_type', operator: 'EQUALS', value: 'HOT_WORK' },
        ],
        action: 'REQUIRE_APPROVAL',
      },
    ],
  },
];

export const RulesEngineView: React.FC<RulesEngineViewProps> = ({
  tenantId = 'tenant-demo',
}) => {
  const [policies, setPolicies] = useState<PolicyDefinition[]>(INITIAL_POLICIES);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(INITIAL_POLICIES[0].policyId);

  const currentPolicy = policies.find((p) => p.policyId === selectedPolicyId) || policies[0];

  // Simulation test state
  const [simContext, setSimContext] = useState<string>(
    JSON.stringify(
      {
        visitor_type: 'VIP',
        has_security_escort: false,
        target_zone: 'R_AND_D_LAB',
        nda_signed: false,
        is_blacklisted: false,
      },
      null,
      2
    )
  );

  const [simResult, setSimResult] = useState<{
    allowed: boolean;
    action: string;
    matchedRules: Array<{ ruleCode: string; name: string }>;
    explanation: string;
  } | null>(null);

  // Evaluate simulation locally using RuleEvaluator principles
  const handleRunSimulation = () => {
    try {
      const context = JSON.parse(simContext);
      const matchedRules: Array<{ ruleCode: string; name: string }> = [];
      let finalAction = 'ALLOW';
      let explanation = 'All default policy checks passed.';

      const sortedRules = [...currentPolicy.rules].sort((a, b) => a.priority - b.priority);

      for (const rule of sortedRules) {
        // Evaluate conditions
        let match = true;
        for (let i = 0; i < rule.conditions.length; i++) {
          const cond = rule.conditions[i];
          const val = context[cond.field];

          let condPass = false;
          if (cond.operator === 'EQUALS') {
            condPass = val === cond.value;
          } else if (cond.operator === 'NOT_EQUALS') {
            condPass = val !== cond.value;
          } else if (cond.operator === 'GREATER_THAN') {
            condPass = Number(val) > Number(cond.value);
          } else if (cond.operator === 'CONTAINS') {
            condPass = String(val).includes(String(cond.value));
          }

          if (i === 0) {
            match = condPass;
          } else {
            match = cond.logic === 'OR' ? match || condPass : match && condPass;
          }
        }

        if (match) {
          matchedRules.push({ ruleCode: rule.ruleCode, name: rule.name });
          if (rule.action === 'DENY') {
            finalAction = 'DENY';
            explanation = `Denied by rule '${rule.name}' (${rule.ruleCode}). Precedence priority 1.`;
            break;
          } else if (rule.action === 'REQUIRE_APPROVAL' && finalAction !== 'DENY') {
            finalAction = 'REQUIRE_APPROVAL';
            explanation = `Approval required by rule '${rule.name}'.`;
          } else if (rule.action === 'REQUIRE_DOCUMENT' && finalAction !== 'DENY') {
            finalAction = 'REQUIRE_DOCUMENT';
            explanation = `Document required by rule '${rule.name}'.`;
          }
        }
      }

      setSimResult({
        allowed: finalAction !== 'DENY',
        action: finalAction,
        matchedRules,
        explanation,
      });
    } catch (e: any) {
      showToast(`Invalid JSON context: ${e.message}`, 'danger');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={24} color={colors.primary[600]} />
            <h1 style={{ margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>
              Declarative Business Rules & Policy Engine
            </h1>
          </div>
          <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
            Configure priority-ordered rules, dynamic conditions, and site-level overrides without code changes
          </span>
        </div>

        <Button variant="secondary" size="normal" leftIcon={<Plus size={14} />}>
          New Policy Definition
        </Button>
      </div>

      {/* 2. Policy Selection Ribbon */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[500], textTransform: 'uppercase', marginRight: '6px' }}>
            Active Policies:
          </span>
          {policies.map((pol) => (
            <button
              key={pol.policyId}
              type="button"
              onClick={() => {
                setSelectedPolicyId(pol.policyId);
                setSimResult(null);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: radius.md,
                border: 'none',
                backgroundColor: selectedPolicyId === pol.policyId ? colors.primary[700] : colors.slate[100],
                color: selectedPolicyId === pol.policyId ? '#ffffff' : colors.slate[700],
                fontSize: typography.fontSize.xs.size,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              [{pol.domain}] {pol.name}
            </button>
          ))}
        </div>
      </Card>

      {/* 3. Main Workspace: Rules Matrix + Live Policy Simulator */}
      <div className="vms-stack-narrow" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }}>
        {/* Left: Rules Matrix */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                  {currentPolicy.name}
                </strong>
                <div style={{ fontSize: '11px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }}>
                  Code: {currentPolicy.code} | Domain: {currentPolicy.domain}
                </div>
              </div>
              <StatusBadge status="approved" size="sm" label="ACTIVE POLICY" />
            </div>

            <div style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600], marginBottom: '16px' }}>
              {currentPolicy.description}
            </div>

            {/* Rules Ordered by Priority */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: colors.slate[500], textTransform: 'uppercase' }}>
                Rules Hierarchy (Evaluated by Priority Order)
              </span>

              {currentPolicy.rules.map((rule) => {
                return (
                  <div
                    key={rule.ruleId}
                    style={{
                      padding: '12px',
                      border: `1px solid ${colors.slate[200]}`,
                      borderRadius: radius.md,
                      backgroundColor: colors.slate[50],
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            backgroundColor: colors.primary[100],
                            color: colors.primary[800],
                            borderRadius: radius.sm,
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          {`PRIORITY ${rule.priority}`}
                        </span>
                        <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[900] }}>
                          {rule.name}
                        </strong>
                      </div>

                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: radius.sm,
                          fontSize: '10px',
                          fontWeight: 700,
                          backgroundColor:
                            rule.action === 'DENY'
                              ? '#fef2f2'
                              : rule.action === 'REQUIRE_APPROVAL'
                              ? '#f3e8ff'
                              : '#eff6ff',
                          color:
                            rule.action === 'DENY'
                              ? '#be123c'
                              : rule.action === 'REQUIRE_APPROVAL'
                              ? '#7e22ce'
                              : '#1d4ed8',
                        }}
                      >
                        {`ACTION: ${rule.action}`}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: colors.slate[600] }}>
                      Conditions:{' '}
                      {rule.conditions.map((c, ci) => (
                        <span key={ci} style={{ fontFamily: typography.fontFamily.mono, fontWeight: 600 }}>
                          {ci > 0 ? ` ${c.logic || 'AND'} ` : ''}
                          {c.field} {c.operator} {JSON.stringify(c.value)}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Interactive Policy Simulator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Zap size={18} color="#d97706" />
              <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                Interactive Policy Simulator
              </strong>
            </div>

            <span style={{ fontSize: '11px', color: colors.slate[600], display: 'block', marginBottom: '10px' }}>
              Enter mock transaction payload context below and click <strong>Evaluate Policy</strong> to test declarative condition matching and priority precedence resolution.
            </span>

            <textarea
              rows={8}
              value={simContext}
              onChange={(e) => setSimContext(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: radius.md,
                border: `1px solid ${colors.slate[300]}`,
                fontFamily: typography.fontFamily.mono,
                fontSize: '11px',
                marginBottom: '10px',
              }}
            />

            <Button variant="primary" size="normal" leftIcon={<Play size={14} />} onClick={handleRunSimulation}>
              Evaluate Policy Decision
            </Button>

            {simResult && (
              <div
                style={{
                  marginTop: '16px',
                  padding: '12px 14px',
                  borderRadius: radius.md,
                  backgroundColor: simResult.allowed ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${simResult.allowed ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {simResult.allowed ? (
                      <CheckCircle2 size={16} color="#16a34a" />
                    ) : (
                      <XCircle size={16} color="#dc2626" />
                    )}
                    <strong style={{ fontSize: '12px', color: simResult.allowed ? '#166534' : '#991b1b' }}>
                      DECISION: {simResult.action}
                    </strong>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: colors.slate[600] }}>
                    {simResult.matchedRules.length} Rule(s) Matched
                  </span>
                </div>

                <div style={{ fontSize: '11px', color: colors.slate[700], marginTop: '4px' }}>
                  <strong>Explanation:</strong> {simResult.explanation}
                </div>

                {simResult.matchedRules.length > 0 && (
                  <div style={{ marginTop: '8px', borderTop: `1px solid ${colors.slate[200]}`, paddingTop: '6px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: colors.slate[500] }}>MATCHED RULES:</span>
                    <ul style={{ margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: colors.slate[700] }}>
                      {simResult.matchedRules.map((mr, i) => (
                        <li key={i}>
                          <code>{mr.ruleCode}</code> — {mr.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
