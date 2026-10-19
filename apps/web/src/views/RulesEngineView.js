import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ShieldAlert, Play, Plus, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Card, StatusBadge } from '@vms/ui';
// Canonical policies for demonstration
const INITIAL_POLICIES = [
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
export const RulesEngineView = ({ tenantId = 'tenant-demo', }) => {
    const [policies, setPolicies] = useState(INITIAL_POLICIES);
    const [selectedPolicyId, setSelectedPolicyId] = useState(INITIAL_POLICIES[0].policyId);
    const currentPolicy = policies.find((p) => p.policyId === selectedPolicyId) || policies[0];
    // Simulation test state
    const [simContext, setSimContext] = useState(JSON.stringify({
        visitor_type: 'VIP',
        has_security_escort: false,
        target_zone: 'R_AND_D_LAB',
        nda_signed: false,
        is_blacklisted: false,
    }, null, 2));
    const [simResult, setSimResult] = useState(null);
    // Evaluate simulation locally using RuleEvaluator principles
    const handleRunSimulation = () => {
        try {
            const context = JSON.parse(simContext);
            const matchedRules = [];
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
                    }
                    else if (cond.operator === 'NOT_EQUALS') {
                        condPass = val !== cond.value;
                    }
                    else if (cond.operator === 'GREATER_THAN') {
                        condPass = Number(val) > Number(cond.value);
                    }
                    else if (cond.operator === 'CONTAINS') {
                        condPass = String(val).includes(String(cond.value));
                    }
                    if (i === 0) {
                        match = condPass;
                    }
                    else {
                        match = cond.logic === 'OR' ? match || condPass : match && condPass;
                    }
                }
                if (match) {
                    matchedRules.push({ ruleCode: rule.ruleCode, name: rule.name });
                    if (rule.action === 'DENY') {
                        finalAction = 'DENY';
                        explanation = `Denied by rule '${rule.name}' (${rule.ruleCode}). Precedence priority 1.`;
                        break;
                    }
                    else if (rule.action === 'REQUIRE_APPROVAL' && finalAction !== 'DENY') {
                        finalAction = 'REQUIRE_APPROVAL';
                        explanation = `Approval required by rule '${rule.name}'.`;
                    }
                    else if (rule.action === 'REQUIRE_DOCUMENT' && finalAction !== 'DENY') {
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
        }
        catch (e) {
            alert(`Invalid JSON context: ${e.message}`);
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(ShieldAlert, { size: 24, color: colors.primary[600] }), _jsx("h1", { style: { margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }, children: "Declarative Business Rules & Policy Engine" })] }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: "Configure priority-ordered rules, dynamic conditions, and site-level overrides without code changes" })] }), _jsx(Button, { variant: "secondary", size: "normal", leftIcon: _jsx(Plus, { size: 14 }), children: "New Policy Definition" })] }), _jsx(Card, { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }, children: [_jsx("span", { style: { fontSize: '11px', fontWeight: 700, color: colors.slate[500], textTransform: 'uppercase', marginRight: '6px' }, children: "Active Policies:" }), policies.map((pol) => (_jsxs("button", { type: "button", onClick: () => {
                                setSelectedPolicyId(pol.policyId);
                                setSimResult(null);
                            }, style: {
                                padding: '6px 12px',
                                borderRadius: radius.md,
                                border: 'none',
                                backgroundColor: selectedPolicyId === pol.policyId ? colors.primary[700] : colors.slate[100],
                                color: selectedPolicyId === pol.policyId ? '#ffffff' : colors.slate[700],
                                fontSize: typography.fontSize.xs.size,
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }, children: ["[", pol.domain, "] ", pol.name] }, pol.policyId)))] }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '16px' }, children: [_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '14px' }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }, children: [_jsxs("div", { children: [_jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: currentPolicy.name }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }, children: ["Code: ", currentPolicy.code, " | Domain: ", currentPolicy.domain] })] }), _jsx(StatusBadge, { status: "approved", size: "sm", label: "ACTIVE POLICY" })] }), _jsx("div", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600], marginBottom: '16px' }, children: currentPolicy.description }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px' }, children: [_jsx("span", { style: { fontSize: '11px', fontWeight: 800, color: colors.slate[500], textTransform: 'uppercase' }, children: "Rules Hierarchy (Evaluated by Priority Order)" }), currentPolicy.rules.map((rule) => {
                                            return (_jsxs("div", { style: {
                                                    padding: '12px',
                                                    border: `1px solid ${colors.slate[200]}`,
                                                    borderRadius: radius.md,
                                                    backgroundColor: colors.slate[50],
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px',
                                                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: {
                                                                            padding: '2px 6px',
                                                                            backgroundColor: colors.primary[100],
                                                                            color: colors.primary[800],
                                                                            borderRadius: radius.sm,
                                                                            fontSize: '10px',
                                                                            fontWeight: 700,
                                                                        }, children: `PRIORITY ${rule.priority}` }), _jsx("strong", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[900] }, children: rule.name })] }), _jsx("span", { style: {
                                                                    padding: '2px 8px',
                                                                    borderRadius: radius.sm,
                                                                    fontSize: '10px',
                                                                    fontWeight: 700,
                                                                    backgroundColor: rule.action === 'DENY'
                                                                        ? '#fef2f2'
                                                                        : rule.action === 'REQUIRE_APPROVAL'
                                                                            ? '#f3e8ff'
                                                                            : '#eff6ff',
                                                                    color: rule.action === 'DENY'
                                                                        ? '#be123c'
                                                                        : rule.action === 'REQUIRE_APPROVAL'
                                                                            ? '#7e22ce'
                                                                            : '#1d4ed8',
                                                                }, children: `ACTION: ${rule.action}` })] }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[600] }, children: ["Conditions:", ' ', rule.conditions.map((c, ci) => (_jsxs("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: [ci > 0 ? ` ${c.logic || 'AND'} ` : '', c.field, " ", c.operator, " ", JSON.stringify(c.value)] }, ci)))] })] }, rule.ruleId));
                                        })] })] }) }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '14px' }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }, children: [_jsx(Zap, { size: 18, color: "#d97706" }), _jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: "Interactive Policy Simulator" })] }), _jsxs("span", { style: { fontSize: '11px', color: colors.slate[600], display: 'block', marginBottom: '10px' }, children: ["Enter mock transaction payload context below and click ", _jsx("strong", { children: "Evaluate Policy" }), " to test declarative condition matching and priority precedence resolution."] }), _jsx("textarea", { rows: 8, value: simContext, onChange: (e) => setSimContext(e.target.value), style: {
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: radius.md,
                                        border: `1px solid ${colors.slate[300]}`,
                                        fontFamily: typography.fontFamily.mono,
                                        fontSize: '11px',
                                        marginBottom: '10px',
                                    } }), _jsx(Button, { variant: "primary", size: "normal", leftIcon: _jsx(Play, { size: 14 }), onClick: handleRunSimulation, children: "Evaluate Policy Decision" }), simResult && (_jsxs("div", { style: {
                                        marginTop: '16px',
                                        padding: '12px 14px',
                                        borderRadius: radius.md,
                                        backgroundColor: simResult.allowed ? '#f0fdf4' : '#fef2f2',
                                        border: `1px solid ${simResult.allowed ? '#bbf7d0' : '#fecaca'}`,
                                    }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [simResult.allowed ? (_jsx(CheckCircle2, { size: 16, color: "#16a34a" })) : (_jsx(XCircle, { size: 16, color: "#dc2626" })), _jsxs("strong", { style: { fontSize: '12px', color: simResult.allowed ? '#166534' : '#991b1b' }, children: ["DECISION: ", simResult.action] })] }), _jsxs("span", { style: { fontSize: '10px', fontWeight: 700, color: colors.slate[600] }, children: [simResult.matchedRules.length, " Rule(s) Matched"] })] }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[700], marginTop: '4px' }, children: [_jsx("strong", { children: "Explanation:" }), " ", simResult.explanation] }), simResult.matchedRules.length > 0 && (_jsxs("div", { style: { marginTop: '8px', borderTop: `1px solid ${colors.slate[200]}`, paddingTop: '6px' }, children: [_jsx("span", { style: { fontSize: '10px', fontWeight: 700, color: colors.slate[500] }, children: "MATCHED RULES:" }), _jsx("ul", { style: { margin: '4px 0 0 0', paddingLeft: '16px', fontSize: '11px', color: colors.slate[700] }, children: simResult.matchedRules.map((mr, i) => (_jsxs("li", { children: [_jsx("code", { children: mr.ruleCode }), " \u2014 ", mr.name] }, i))) })] }))] }))] }) })] })] }));
};
