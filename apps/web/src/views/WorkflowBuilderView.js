import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { GitFork, CheckCircle2, AlertTriangle, Lock, Plus, Trash2, Clock, ArrowRight, Settings, X, FileCheck, Send, Copy } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Card } from '@vms/ui';
import { CANONICAL_WORKFLOW_TEMPLATES } from '../../../../services/workflow/src/engine/templates.js';
import { WorkflowValidator } from '../../../../services/workflow/src/engine/workflow-validator.js';
export const WorkflowBuilderView = ({ userRole = 'SUPER_ADMIN', tenantId = 'tenant-demo', }) => {
    // Validator instance
    const validator = new WorkflowValidator();
    // Selected template & current editable workflow state
    const [selectedTemplateIndex, setSelectedTemplateIndex] = useState(0);
    const currentTemplate = CANONICAL_WORKFLOW_TEMPLATES[selectedTemplateIndex];
    // Workflow version lifecycle state
    const [versionNumber, setVersionNumber] = useState(1);
    const [versionStatus, setVersionStatus] = useState('PUBLISHED');
    const [isImmutable, setIsImmutable] = useState(true);
    // Stages & Transitions
    const [stages, setStages] = useState(JSON.parse(JSON.stringify(currentTemplate.stages)));
    const [transitions, setTransitions] = useState(JSON.parse(JSON.stringify(currentTemplate.transitions)));
    // Selected stage for right-hand inspector panel
    const [selectedStageId, setSelectedStageId] = useState(stages[0]?.stageId || '');
    const selectedStage = stages.find((s) => s.stageId === selectedStageId) || stages[0];
    // Validation diagnostics state
    const [validationResult, setValidationResult] = useState(null);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [publishSuccessMsg, setPublishSuccessMsg] = useState('');
    // Switch domain template
    const handleSelectTemplate = (idx) => {
        setSelectedTemplateIndex(idx);
        const tpl = CANONICAL_WORKFLOW_TEMPLATES[idx];
        setStages(JSON.parse(JSON.stringify(tpl.stages)));
        setTransitions(JSON.parse(JSON.stringify(tpl.transitions)));
        setSelectedStageId(tpl.stages[0]?.stageId || '');
        setVersionNumber(1);
        setVersionStatus('PUBLISHED');
        setIsImmutable(true);
        setValidationResult(null);
    };
    // Add stage from palette
    const handleAddStage = (type) => {
        if (isImmutable)
            return;
        const newId = `stg-${Date.now()}`;
        const newStage = {
            stageId: newId,
            stageCode: `${type}_${stages.length}`,
            stageName: `New ${type.replace(/_/g, ' ')}`,
            stageType: type,
            orderIndex: stages.length,
            isMandatory: false,
        };
        if (type === 'APPROVAL') {
            newStage.approvalPolicy = 'SINGLE';
            newStage.assignmentRules = [{ approverType: 'ROLE', targetRole: 'SITE_ADMIN', allowSelfApproval: false }];
            newStage.slaConfig = { slaMinutes: 120, warningMinutes: 90 };
        }
        setStages([...stages, newStage]);
        setSelectedStageId(newId);
    };
    // Delete stage
    const handleDeleteStage = (stageId) => {
        if (isImmutable)
            return;
        setStages(stages.filter((s) => s.stageId !== stageId));
        setTransitions(transitions.filter((t) => t.fromStageId !== stageId && t.toStageId !== stageId));
        if (selectedStageId === stageId) {
            setSelectedStageId(stages[0]?.stageId || '');
        }
    };
    // Update selected stage in inspector
    const handleUpdateStage = (updates) => {
        if (isImmutable)
            return;
        setStages((prev) => prev.map((s) => (s.stageId === selectedStageId ? { ...s, ...updates } : s)));
    };
    // Add transition
    const handleAddTransition = () => {
        if (isImmutable || !selectedStage)
            return;
        const targetStage = stages.find((s) => s.stageId !== selectedStage.stageId);
        if (!targetStage)
            return;
        const newTransition = {
            transitionId: `tr-${Date.now()}`,
            fromStageId: selectedStage.stageId,
            toStageId: targetStage.stageId,
            trigger: 'NEXT',
        };
        setTransitions([...transitions, newTransition]);
    };
    // Delete transition
    const handleDeleteTransition = (trId) => {
        if (isImmutable)
            return;
        setTransitions(transitions.filter((t) => t.transitionId !== trId));
    };
    // Validate workflow statically
    const handleValidate = () => {
        const dummyVersion = {
            versionId: 'temp',
            definitionId: 'temp-def',
            versionNumber,
            status: versionStatus,
            stages,
            transitions,
            immutable: isImmutable,
        };
        const res = validator.validate(dummyVersion);
        setValidationResult(res);
        setIsValidationModalOpen(true);
    };
    // Create new editable draft
    const handleCreateNewDraft = () => {
        setVersionNumber(versionNumber + 1);
        setVersionStatus('DRAFT');
        setIsImmutable(false);
        setValidationResult(null);
        setPublishSuccessMsg('');
    };
    // Publish workflow version
    const handlePublish = () => {
        const dummyVersion = {
            versionId: 'temp',
            definitionId: 'temp-def',
            versionNumber,
            status: versionStatus,
            stages,
            transitions,
            immutable: isImmutable,
        };
        const res = validator.validate(dummyVersion);
        if (!res.isValid) {
            setValidationResult(res);
            setIsValidationModalOpen(true);
            return;
        }
        setVersionStatus('PUBLISHED');
        setIsImmutable(true);
        setPublishSuccessMsg(`Workflow Version v${versionNumber} successfully published and sealed as immutable!`);
        setTimeout(() => setPublishSuccessMsg(''), 4000);
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(GitFork, { size: 24, color: colors.primary[600] }), _jsx("h1", { style: { margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }, children: "Enterprise Workflow Builder" }), _jsxs("span", { style: {
                                            padding: '2px 8px',
                                            borderRadius: radius.sm,
                                            backgroundColor: isImmutable ? colors.slate[800] : '#fef3c7',
                                            color: isImmutable ? '#ffffff' : '#92400e',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }, children: [isImmutable ? _jsx(Lock, { size: 11 }) : _jsx(Settings, { size: 11 }), versionStatus, " (v", versionNumber, ") ", isImmutable && '— IMMUTABLE'] })] }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: "Declarative stage modeling, multi-approver quorum policies, SLA escalations, and immutable published versions" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", size: "normal", leftIcon: _jsx(FileCheck, { size: 14 }), onClick: handleValidate, children: "Validate Workflow" }), isImmutable ? (_jsx(Button, { variant: "primary", size: "normal", leftIcon: _jsx(Copy, { size: 14 }), onClick: handleCreateNewDraft, children: "Create New Draft" })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "secondary", size: "normal", onClick: () => setPublishSuccessMsg('Draft auto-saved.'), children: "Save Draft" }), _jsx(Button, { variant: "primary", size: "normal", leftIcon: _jsx(Send, { size: 14 }), onClick: handlePublish, children: "Publish Version" })] }))] })] }), isImmutable && (_jsx("div", { style: {
                    backgroundColor: colors.slate[100],
                    border: `1px solid ${colors.slate[200]}`,
                    borderRadius: radius.md,
                    padding: '8px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: typography.fontSize.xs.size,
                    color: colors.slate[700],
                }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Lock, { size: 15, color: colors.slate[600] }), _jsxs("span", { children: [_jsx("strong", { children: "Published Version Protected:" }), " Published workflows are immutable to preserve transaction integrity. Click ", _jsx("strong", { children: "\"Create New Draft\"" }), " to modify."] })] }) })), publishSuccessMsg && (_jsx("div", { style: {
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: radius.md,
                    padding: '8px 14px',
                    fontSize: typography.fontSize.xs.size,
                    color: '#166534',
                    fontWeight: 700,
                }, children: publishSuccessMsg })), _jsx(Card, { children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }, children: [_jsx("span", { style: { fontSize: '11px', fontWeight: 700, color: colors.slate[500], textTransform: 'uppercase', marginRight: '6px' }, children: "Domain Template:" }), CANONICAL_WORKFLOW_TEMPLATES.map((tpl, idx) => (_jsxs("button", { type: "button", onClick: () => handleSelectTemplate(idx), style: {
                                padding: '6px 12px',
                                borderRadius: radius.md,
                                border: 'none',
                                backgroundColor: selectedTemplateIndex === idx ? colors.primary[700] : colors.slate[100],
                                color: selectedTemplateIndex === idx ? '#ffffff' : colors.slate[700],
                                fontSize: typography.fontSize.xs.size,
                                fontWeight: 600,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }, children: ["[", tpl.domain, "] ", tpl.name] }, tpl.code)))] }) }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '180px 1fr 340px', gap: '16px', minHeight: '620px' }, children: [_jsxs("div", { style: {
                            backgroundColor: '#ffffff',
                            border: `1px solid ${colors.slate[200]}`,
                            borderRadius: radius.md,
                            padding: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                        }, children: [_jsx("div", { style: { fontSize: '11px', fontWeight: 800, color: colors.slate[500], textTransform: 'uppercase', marginBottom: '4px' }, children: "Stage Palette" }), [
                                { type: 'START', label: 'Start Stage', color: '#16a34a' },
                                { type: 'DATA_VALIDATION', label: 'Data Validation', color: '#0284c7' },
                                { type: 'APPROVAL', label: 'Approval Stage', color: '#7c3aed' },
                                { type: 'DOCUMENT_VERIFICATION', label: 'Document Check', color: '#2563eb' },
                                { type: 'SAFETY_CHECK', label: 'Safety / Induction', color: '#d97706' },
                                { type: 'OPERATIONAL_TASK', label: 'Operational Task', color: '#475569' },
                                { type: 'ACCESS_DECISION', label: 'Access Decision', color: '#059669' },
                                { type: 'END', label: 'End Stage', color: '#dc2626' },
                            ].map((item) => (_jsxs("button", { type: "button", disabled: isImmutable, onClick: () => handleAddStage(item.type), style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '8px 10px',
                                    borderRadius: radius.sm,
                                    border: `1px solid ${colors.slate[200]}`,
                                    backgroundColor: isImmutable ? colors.slate[50] : '#ffffff',
                                    color: isImmutable ? colors.slate[400] : colors.slate[800],
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    cursor: isImmutable ? 'not-allowed' : 'pointer',
                                    textAlign: 'left',
                                }, children: [_jsx("span", { style: { width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color } }), item.label] }, item.type))), _jsx("div", { style: { marginTop: 'auto', padding: '8px', backgroundColor: colors.slate[50], borderRadius: radius.sm, fontSize: '10px', color: colors.slate[500] }, children: "Click an item to insert it into the active draft workflow." })] }), _jsxs("div", { style: {
                            backgroundColor: '#ffffff',
                            border: `1px solid ${colors.slate[200]}`,
                            borderRadius: radius.md,
                            padding: '16px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }, children: [_jsxs("span", { style: { fontSize: '12px', fontWeight: 700, color: colors.slate[700] }, children: ["Workflow Canvas \u2014 ", stages.length, " Stages, ", transitions.length, " Transitions"] }), _jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: "Select a stage below to inspect its policy & SLA parameters" })] }), stages.map((stg, idx) => {
                                const isSelected = stg.stageId === selectedStageId;
                                const outgoing = transitions.filter((t) => t.fromStageId === stg.stageId);
                                return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsxs("div", { onClick: () => setSelectedStageId(stg.stageId), style: {
                                                padding: '12px 16px',
                                                borderRadius: radius.md,
                                                border: `2px solid ${isSelected ? colors.primary[600] : colors.slate[200]}`,
                                                backgroundColor: isSelected ? colors.primary[50] : '#ffffff',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                boxShadow: isSelected ? '0 4px 6px -1px rgba(0, 0, 0, 0.05)' : 'none',
                                                transition: 'all 120ms ease',
                                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("div", { style: {
                                                                width: '26px',
                                                                height: '26px',
                                                                borderRadius: '50%',
                                                                backgroundColor: isSelected ? colors.primary[600] : colors.slate[100],
                                                                color: isSelected ? '#ffffff' : colors.slate[700],
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontWeight: 700,
                                                                fontSize: '11px',
                                                            }, children: idx + 1 }), _jsxs("div", { children: [_jsx("div", { style: { fontWeight: 700, fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: stg.stageName }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }, children: [stg.stageCode, " | Type: ", stg.stageType] })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [stg.stageType === 'APPROVAL' && (_jsxs("span", { style: {
                                                                padding: '2px 8px',
                                                                backgroundColor: '#f3e8ff',
                                                                color: '#7e22ce',
                                                                borderRadius: radius.sm,
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                            }, children: ["Policy: ", stg.approvalPolicy || 'SINGLE'] })), stg.slaConfig && (_jsxs("span", { style: {
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px',
                                                                padding: '2px 6px',
                                                                backgroundColor: '#fffbeb',
                                                                color: '#b45309',
                                                                borderRadius: radius.sm,
                                                                fontSize: '10px',
                                                                fontWeight: 600,
                                                            }, children: [_jsx(Clock, { size: 10 }), " ", stg.slaConfig.slaMinutes, "m SLA"] })), !isImmutable && stages.length > 2 && (_jsx("button", { type: "button", title: "Delete stage", onClick: (e) => {
                                                                e.stopPropagation();
                                                                handleDeleteStage(stg.stageId);
                                                            }, style: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: colors.slate[400] }, children: _jsx(Trash2, { size: 13 }) }))] })] }), outgoing.length > 0 && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '32px' }, children: outgoing.map((tr) => {
                                                const target = stages.find((s) => s.stageId === tr.toStageId);
                                                return (_jsxs("div", { style: {
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        fontSize: '11px',
                                                        color: colors.slate[600],
                                                    }, children: [_jsx(ArrowRight, { size: 12, color: colors.primary[500] }), _jsxs("span", { style: {
                                                                fontFamily: typography.fontFamily.mono,
                                                                fontWeight: 700,
                                                                padding: '1px 6px',
                                                                backgroundColor: colors.slate[100],
                                                                borderRadius: radius.sm,
                                                                fontSize: '10px',
                                                            }, children: ["TRIGGER: ", tr.trigger] }), _jsx("span", { children: "\u2192" }), _jsx("strong", { children: target?.stageName || tr.toStageId }), tr.conditions && tr.conditions.length > 0 && (_jsxs("span", { style: { fontSize: '10px', color: '#b45309', fontStyle: 'italic' }, children: ["(", tr.conditions.length, " condition", tr.conditions.length > 1 ? 's' : '', ")"] })), !isImmutable && (_jsx("button", { type: "button", onClick: () => handleDeleteTransition(tr.transitionId), style: { background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', fontSize: '10px' }, children: "\u2715" }))] }, tr.transitionId));
                                            }) }))] }, stg.stageId));
                            })] }), _jsxs("div", { style: {
                            backgroundColor: '#ffffff',
                            border: `1px solid ${colors.slate[200]}`,
                            borderRadius: radius.md,
                            padding: '16px',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '14px',
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.slate[200]}`, paddingBottom: '8px' }, children: [_jsx("span", { style: { fontSize: '12px', fontWeight: 800, color: colors.slate[800], textTransform: 'uppercase' }, children: "Stage Inspector" }), _jsx("span", { style: { fontSize: '10px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }, children: selectedStage?.stageId })] }), selectedStage ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Stage Name" }), _jsx("input", { type: "text", disabled: isImmutable, value: selectedStage.stageName, onChange: (e) => handleUpdateStage({ stageName: e.target.value }), style: { width: '100%', height: '32px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Stage Code" }), _jsx("input", { type: "text", disabled: isImmutable, value: selectedStage.stageCode, onChange: (e) => handleUpdateStage({ stageCode: e.target.value.toUpperCase() }), style: { width: '100%', height: '32px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size, fontFamily: typography.fontFamily.mono } })] }), selectedStage.stageType === 'APPROVAL' && (_jsxs("div", { style: { backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: radius.md, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }, children: [_jsx("div", { style: { fontSize: '11px', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }, children: "Approval Policy Engine" }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 600, color: colors.slate[700], marginBottom: '4px' }, children: "Authorization Policy" }), _jsxs("select", { disabled: isImmutable, value: selectedStage.approvalPolicy || 'SINGLE', onChange: (e) => handleUpdateStage({ approvalPolicy: e.target.value }), style: { width: '100%', height: '30px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }, children: [_jsx("option", { value: "SINGLE", children: "SINGLE Approver" }), _jsx("option", { value: "SEQUENTIAL", children: "SEQUENTIAL Multi-Tier Approvers" }), _jsx("option", { value: "PARALLEL_ALL_REQUIRED", children: "PARALLEL: All Required (Unanimous)" }), _jsx("option", { value: "PARALLEL_ANY_ONE", children: "PARALLEL: Any One Approves" }), _jsx("option", { value: "PARALLEL_QUORUM", children: "PARALLEL: Quorum Required" })] })] }), selectedStage.approvalPolicy === 'PARALLEL_QUORUM' && (_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 600, color: colors.slate[700], marginBottom: '4px' }, children: "Quorum Count Required" }), _jsx("input", { type: "number", disabled: isImmutable, value: selectedStage.quorumRequired || 2, onChange: (e) => handleUpdateStage({ quorumRequired: parseInt(e.target.value, 10) || 1 }), style: { width: '100%', height: '30px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] })), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 600, color: colors.slate[700], marginBottom: '4px' }, children: "Primary Approver Assignment" }), _jsxs("select", { disabled: isImmutable, value: selectedStage.assignmentRules?.[0]?.targetRole || 'SITE_ADMIN', onChange: (e) => {
                                                            const newRules = [
                                                                {
                                                                    approverType: 'ROLE',
                                                                    targetRole: e.target.value,
                                                                    allowSelfApproval: false,
                                                                    delegationAllowed: true,
                                                                },
                                                            ];
                                                            handleUpdateStage({ assignmentRules: newRules });
                                                        }, style: { width: '100%', height: '30px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }, children: [_jsx("option", { value: "SITE_ADMIN", children: "Role: Site Admin" }), _jsx("option", { value: "SECURITY_MANAGER", children: "Role: Security Manager" }), _jsx("option", { value: "EHS_MANAGER", children: "Role: EHS Safety Manager" }), _jsx("option", { value: "ORGANIZATION_ADMIN", children: "Role: Organization Admin" }), _jsx("option", { value: "SUPER_ADMIN", children: "Role: Super Admin" })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("input", { type: "checkbox", id: "allowSelf", disabled: isImmutable, checked: selectedStage.assignmentRules?.[0]?.allowSelfApproval === true, onChange: (e) => {
                                                            const current = selectedStage.assignmentRules?.[0] || { approverType: 'ROLE' };
                                                            handleUpdateStage({
                                                                assignmentRules: [{ ...current, allowSelfApproval: e.target.checked }],
                                                            });
                                                        } }), _jsx("label", { htmlFor: "allowSelf", style: { fontSize: '11px', color: colors.slate[700] }, children: "Allow Self-Approval (Disabled by default)" })] })] })), _jsxs("div", { style: { backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: radius.md, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }, children: [_jsx("div", { style: { fontSize: '11px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }, children: "SLA & Escalation Engine" }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '10px', fontWeight: 600, color: colors.slate[700], marginBottom: '2px' }, children: "SLA (Minutes)" }), _jsx("input", { type: "number", disabled: isImmutable, value: selectedStage.slaConfig?.slaMinutes || 120, onChange: (e) => {
                                                                    const val = parseInt(e.target.value, 10) || 60;
                                                                    handleUpdateStage({
                                                                        slaConfig: {
                                                                            slaMinutes: val,
                                                                            warningMinutes: selectedStage.slaConfig?.warningMinutes || Math.floor(val * 0.75),
                                                                            escalateToManager: selectedStage.slaConfig?.escalateToManager ?? true,
                                                                        },
                                                                    });
                                                                }, style: { width: '100%', height: '28px', padding: '0 6px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: '11px' } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '10px', fontWeight: 600, color: colors.slate[700], marginBottom: '2px' }, children: "Warning (Min)" }), _jsx("input", { type: "number", disabled: isImmutable, value: selectedStage.slaConfig?.warningMinutes || 90, onChange: (e) => {
                                                                    handleUpdateStage({
                                                                        slaConfig: {
                                                                            slaMinutes: selectedStage.slaConfig?.slaMinutes || 120,
                                                                            warningMinutes: parseInt(e.target.value, 10) || 45,
                                                                            escalateToManager: selectedStage.slaConfig?.escalateToManager ?? true,
                                                                        },
                                                                    });
                                                                }, style: { width: '100%', height: '28px', padding: '0 6px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: '11px' } })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("input", { type: "checkbox", id: "escalateMgr", disabled: isImmutable, checked: selectedStage.slaConfig?.escalateToManager !== false, onChange: (e) => {
                                                            handleUpdateStage({
                                                                slaConfig: {
                                                                    slaMinutes: selectedStage.slaConfig?.slaMinutes || 120,
                                                                    warningMinutes: selectedStage.slaConfig?.warningMinutes || 90,
                                                                    escalateToManager: e.target.checked,
                                                                },
                                                            });
                                                        } }), _jsx("label", { htmlFor: "escalateMgr", style: { fontSize: '11px', color: colors.slate[700] }, children: "Auto-Escalate to Manager on Breach" })] })] }), !isImmutable && (_jsx(Button, { variant: "secondary", size: "dense", leftIcon: _jsx(Plus, { size: 12 }), onClick: handleAddTransition, children: "Add Outgoing Transition" }))] })) : (_jsx("div", { style: { color: colors.slate[500], fontSize: '11px', textAlign: 'center', padding: '20px 0' }, children: "Select a stage on the canvas to inspect settings." }))] })] }), isValidationModalOpen && validationResult && (_jsx("div", { style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px',
                }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [validationResult.isValid ? (_jsx(CheckCircle2, { size: 22, color: "#16a34a" })) : (_jsx(AlertTriangle, { size: 22, color: "#dc2626" })), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }, children: "Workflow Static Analysis Diagnostics" })] }), _jsx("button", { type: "button", onClick: () => setIsValidationModalOpen(false), style: { background: 'none', border: 'none', cursor: 'pointer' }, children: _jsx(X, { size: 18, color: colors.slate[500] }) })] }), validationResult.isValid ? (_jsxs("div", { style: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: radius.md, padding: '12px 16px', color: '#166534', fontSize: typography.fontSize.xs.size }, children: [_jsx("strong", { children: "All Static Invariant Checks Passed:" }), " Exactly one START stage, reachable END stage, no broken transitions, and all approval policies configured. Workflow is valid for production publish!"] })) : (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }, children: [_jsxs("div", { style: { fontSize: '12px', color: '#b91c1c', fontWeight: 700 }, children: ["Validation Errors Found (", validationResult.diagnostics.length, "):"] }), _jsx("div", { style: { maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }, children: validationResult.diagnostics.map((diag, i) => (_jsxs("div", { style: {
                                            padding: '8px 12px',
                                            backgroundColor: diag.severity === 'ERROR' ? '#fef2f2' : '#fffbeb',
                                            border: `1px solid ${diag.severity === 'ERROR' ? '#fecaca' : '#fef08a'}`,
                                            borderRadius: radius.sm,
                                            fontSize: '11px',
                                            color: diag.severity === 'ERROR' ? '#991b1b' : '#854d0e',
                                        }, children: [_jsxs("strong", { children: ["[", diag.code, "]"] }), " ", diag.message] }, i))) })] })), _jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }, children: _jsx(Button, { variant: "secondary", size: "normal", onClick: () => setIsValidationModalOpen(false), children: "Close" }) })] }) }))] }));
};
