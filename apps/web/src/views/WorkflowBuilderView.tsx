import React, { useState } from 'react';
import {
  GitFork,
  Play,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  Trash2,
  ChevronRight,
  Shield,
  Clock,
  ArrowRight,
  Settings,
  Check,
  X,
  FileCheck,
  Send,
  Layers,
  Copy,
  Info
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Card, StatusBadge } from '@vms/ui';
import type {
  WorkflowStage,
  WorkflowTransition,
  WorkflowStageType,
  ApprovalPolicyType,
  ApprovalApproverType,
  EnterpriseRole,
  WorkflowDomain,
  WorkflowValidationResult
} from '@vms/types';
import {
  CANONICAL_WORKFLOW_TEMPLATES,
  type WorkflowTemplateDef
} from '../../../../services/workflow/src/engine/templates.js';
import { WorkflowValidator } from '../../../../services/workflow/src/engine/workflow-validator.js';

export interface WorkflowBuilderViewProps {
  userRole?: EnterpriseRole;
  tenantId?: string;
}

export const WorkflowBuilderView: React.FC<WorkflowBuilderViewProps> = ({
  userRole = 'SUPER_ADMIN',
  tenantId = 'tenant-demo',
}) => {
  // Validator instance
  const validator = new WorkflowValidator();

  // Selected template & current editable workflow state
  const [selectedTemplateIndex, setSelectedTemplateIndex] = useState<number>(0);
  const currentTemplate: WorkflowTemplateDef = CANONICAL_WORKFLOW_TEMPLATES[selectedTemplateIndex];

  // Workflow version lifecycle state
  const [versionNumber, setVersionNumber] = useState<number>(1);
  const [versionStatus, setVersionStatus] = useState<'DRAFT' | 'PUBLISHED' | 'RETIRED'>('PUBLISHED');
  const [isImmutable, setIsImmutable] = useState<boolean>(true);

  // Stages & Transitions
  const [stages, setStages] = useState<WorkflowStage[]>(JSON.parse(JSON.stringify(currentTemplate.stages)));
  const [transitions, setTransitions] = useState<WorkflowTransition[]>(
    JSON.parse(JSON.stringify(currentTemplate.transitions))
  );

  // Selected stage for right-hand inspector panel
  const [selectedStageId, setSelectedStageId] = useState<string>(stages[0]?.stageId || '');
  const selectedStage = stages.find((s) => s.stageId === selectedStageId) || stages[0];

  // Validation diagnostics state
  const [validationResult, setValidationResult] = useState<WorkflowValidationResult | null>(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState<boolean>(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string>('');

  // Switch domain template
  const handleSelectTemplate = (idx: number) => {
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
  const handleAddStage = (type: WorkflowStageType) => {
    if (isImmutable) return;

    const newId = `stg-${Date.now()}`;
    const newStage: WorkflowStage = {
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
  const handleDeleteStage = (stageId: string) => {
    if (isImmutable) return;
    setStages(stages.filter((s) => s.stageId !== stageId));
    setTransitions(transitions.filter((t) => t.fromStageId !== stageId && t.toStageId !== stageId));
    if (selectedStageId === stageId) {
      setSelectedStageId(stages[0]?.stageId || '');
    }
  };

  // Update selected stage in inspector
  const handleUpdateStage = (updates: Partial<WorkflowStage>) => {
    if (isImmutable) return;
    setStages((prev) =>
      prev.map((s) => (s.stageId === selectedStageId ? { ...s, ...updates } : s))
    );
  };

  // Add transition
  const handleAddTransition = () => {
    if (isImmutable || !selectedStage) return;
    const targetStage = stages.find((s) => s.stageId !== selectedStage.stageId);
    if (!targetStage) return;

    const newTransition: WorkflowTransition = {
      transitionId: `tr-${Date.now()}`,
      fromStageId: selectedStage.stageId,
      toStageId: targetStage.stageId,
      trigger: 'NEXT',
    };
    setTransitions([...transitions, newTransition]);
  };

  // Delete transition
  const handleDeleteTransition = (trId: string) => {
    if (isImmutable) return;
    setTransitions(transitions.filter((t) => t.transitionId !== trId));
  };

  // Validate workflow statically
  const handleValidate = () => {
    const dummyVersion: any = {
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
    const dummyVersion: any = {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. Top Header & Template Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitFork size={24} color={colors.primary[600]} />
            <h1 style={{ margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>
              Enterprise Workflow Builder
            </h1>
            <span
              style={{
                padding: '2px 8px',
                borderRadius: radius.sm,
                backgroundColor: isImmutable ? colors.slate[800] : '#fef3c7',
                color: isImmutable ? '#ffffff' : '#92400e',
                fontSize: '11px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              {isImmutable ? <Lock size={11} /> : <Settings size={11} />}
              {versionStatus} (v{versionNumber}) {isImmutable && '— IMMUTABLE'}
            </span>
          </div>
          <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
            Declarative stage modeling, multi-approver quorum policies, SLA escalations, and immutable published versions
          </span>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="secondary" size="normal" leftIcon={<FileCheck size={14} />} onClick={handleValidate}>
            Validate Workflow
          </Button>

          {isImmutable ? (
            <Button variant="primary" size="normal" leftIcon={<Copy size={14} />} onClick={handleCreateNewDraft}>
              Create New Draft
            </Button>
          ) : (
            <>
              <Button variant="secondary" size="normal" onClick={() => setPublishSuccessMsg('Draft auto-saved.')}>
                Save Draft
              </Button>
              <Button variant="primary" size="normal" leftIcon={<Send size={14} />} onClick={handlePublish}>
                Publish Version
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Immutability & Notification Alert */}
      {isImmutable && (
        <div
          style={{
            backgroundColor: colors.slate[100],
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: typography.fontSize.xs.size,
            color: colors.slate[700],
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Lock size={15} color={colors.slate[600]} />
            <span>
              <strong>Published Version Protected:</strong> Published workflows are immutable to preserve transaction integrity. Click <strong>"Create New Draft"</strong> to modify.
            </span>
          </div>
        </div>
      )}

      {publishSuccessMsg && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: radius.md,
            padding: '8px 14px',
            fontSize: typography.fontSize.xs.size,
            color: '#166534',
            fontWeight: 700,
          }}
        >
          {publishSuccessMsg}
        </div>
      )}

      {/* Template Selector Bar */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[500], textTransform: 'uppercase', marginRight: '6px' }}>
            Domain Template:
          </span>
          {CANONICAL_WORKFLOW_TEMPLATES.map((tpl, idx) => (
            <button
              key={tpl.code}
              type="button"
              onClick={() => handleSelectTemplate(idx)}
              style={{
                padding: '6px 12px',
                borderRadius: radius.md,
                border: 'none',
                backgroundColor: selectedTemplateIndex === idx ? colors.primary[700] : colors.slate[100],
                color: selectedTemplateIndex === idx ? '#ffffff' : colors.slate[700],
                fontSize: typography.fontSize.xs.size,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              [{tpl.domain}] {tpl.name}
            </button>
          ))}
        </div>
      </Card>

      {/* 2. Main Builder Workspace: Left Palette + Canvas + Right Inspector */}
      <div className="vms-stack-narrow" style={{ display: 'grid', gridTemplateColumns: '180px 1fr 340px', gap: '16px', minHeight: '620px' }}>
        {/* Left Palette: Addable Stage Types */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: colors.slate[500], textTransform: 'uppercase', marginBottom: '4px' }}>
            Stage Palette
          </div>

          {[
            { type: 'START' as WorkflowStageType, label: 'Start Stage', color: '#16a34a' },
            { type: 'DATA_VALIDATION' as WorkflowStageType, label: 'Data Validation', color: '#0284c7' },
            { type: 'APPROVAL' as WorkflowStageType, label: 'Approval Stage', color: '#7c3aed' },
            { type: 'DOCUMENT_VERIFICATION' as WorkflowStageType, label: 'Document Check', color: '#2563eb' },
            { type: 'SAFETY_CHECK' as WorkflowStageType, label: 'Safety / Induction', color: '#d97706' },
            { type: 'OPERATIONAL_TASK' as WorkflowStageType, label: 'Operational Task', color: '#475569' },
            { type: 'ACCESS_DECISION' as WorkflowStageType, label: 'Access Decision', color: '#059669' },
            { type: 'END' as WorkflowStageType, label: 'End Stage', color: '#dc2626' },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              disabled={isImmutable}
              onClick={() => handleAddStage(item.type)}
              style={{
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
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
              {item.label}
            </button>
          ))}

          <div style={{ marginTop: 'auto', padding: '8px', backgroundColor: colors.slate[50], borderRadius: radius.sm, fontSize: '10px', color: colors.slate[500] }}>
            Click an item to insert it into the active draft workflow.
          </div>
        </div>

        {/* Center: Visual Workflow Canvas */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: colors.slate[700] }}>
              Workflow Canvas — {stages.length} Stages, {transitions.length} Transitions
            </span>
            <span style={{ fontSize: '11px', color: colors.slate[500] }}>
              Select a stage below to inspect its policy & SLA parameters
            </span>
          </div>

          {/* Sequential Stage Cards */}
          {stages.map((stg, idx) => {
            const isSelected = stg.stageId === selectedStageId;
            const outgoing = transitions.filter((t) => t.fromStageId === stg.stageId);

            return (
              <div key={stg.stageId} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div
                  onClick={() => setSelectedStageId(stg.stageId)}
                  style={{
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
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
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
                      }}
                    >
                      {idx + 1}
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                        {stg.stageName}
                      </div>
                      <div style={{ fontSize: '11px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }}>
                        {stg.stageCode} | Type: {stg.stageType}
                      </div>
                    </div>
                  </div>

                  {/* Stage Badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {stg.stageType === 'APPROVAL' && (
                      <span
                        style={{
                          padding: '2px 8px',
                          backgroundColor: '#f3e8ff',
                          color: '#7e22ce',
                          borderRadius: radius.sm,
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        Policy: {stg.approvalPolicy || 'SINGLE'}
                      </span>
                    )}

                    {stg.slaConfig && (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          padding: '2px 6px',
                          backgroundColor: '#fffbeb',
                          color: '#b45309',
                          borderRadius: radius.sm,
                          fontSize: '10px',
                          fontWeight: 600,
                        }}
                      >
                        <Clock size={10} /> {stg.slaConfig.slaMinutes}m SLA
                      </span>
                    )}

                    {!isImmutable && stages.length > 2 && (
                      <button
                        type="button"
                        title="Delete stage"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteStage(stg.stageId);
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: colors.slate[400] }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Transition Connectors to Next Stages */}
                {outgoing.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '32px' }}>
                    {outgoing.map((tr) => {
                      const target = stages.find((s) => s.stageId === tr.toStageId);
                      return (
                        <div
                          key={tr.transitionId}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '11px',
                            color: colors.slate[600],
                          }}
                        >
                          <ArrowRight size={12} color={colors.primary[500]} />
                          <span
                            style={{
                              fontFamily: typography.fontFamily.mono,
                              fontWeight: 700,
                              padding: '1px 6px',
                              backgroundColor: colors.slate[100],
                              borderRadius: radius.sm,
                              fontSize: '10px',
                            }}
                          >
                            TRIGGER: {tr.trigger}
                          </span>
                          <span>→</span>
                          <strong>{target?.stageName || tr.toStageId}</strong>
                          {tr.conditions && tr.conditions.length > 0 && (
                            <span style={{ fontSize: '10px', color: '#b45309', fontStyle: 'italic' }}>
                              ({tr.conditions.length} condition{tr.conditions.length > 1 ? 's' : ''})
                            </span>
                          )}
                          {!isImmutable && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTransition(tr.transitionId)}
                              style={{ background: 'none', border: 'none', color: '#be123c', cursor: 'pointer', fontSize: '10px' }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Inspector Panel */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            padding: '16px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${colors.slate[200]}`, paddingBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: colors.slate[800], textTransform: 'uppercase' }}>
              Stage Inspector
            </span>
            <span style={{ fontSize: '10px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }}>
              {selectedStage?.stageId}
            </span>
          </div>

          {selectedStage ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }}>
                  Stage Name
                </label>
                <input
                  type="text"
                  disabled={isImmutable}
                  value={selectedStage.stageName}
                  onChange={(e) => handleUpdateStage({ stageName: e.target.value })}
                  style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }}>
                  Stage Code
                </label>
                <input
                  type="text"
                  disabled={isImmutable}
                  value={selectedStage.stageCode}
                  onChange={(e) => handleUpdateStage({ stageCode: e.target.value.toUpperCase() })}
                  style={{ width: '100%', height: '32px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size, fontFamily: typography.fontFamily.mono }}
                />
              </div>

              {/* Approval Policy Configuration */}
              {selectedStage.stageType === 'APPROVAL' && (
                <div style={{ backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: radius.md, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#6b21a8', textTransform: 'uppercase' }}>
                    Approval Policy Engine
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.slate[700], marginBottom: '4px' }}>
                      Authorization Policy
                    </label>
                    <select
                      disabled={isImmutable}
                      value={selectedStage.approvalPolicy || 'SINGLE'}
                      onChange={(e) => handleUpdateStage({ approvalPolicy: e.target.value as ApprovalPolicyType })}
                      style={{ width: '100%', height: '30px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }}
                    >
                      <option value="SINGLE">SINGLE Approver</option>
                      <option value="SEQUENTIAL">SEQUENTIAL Multi-Tier Approvers</option>
                      <option value="PARALLEL_ALL_REQUIRED">PARALLEL: All Required (Unanimous)</option>
                      <option value="PARALLEL_ANY_ONE">PARALLEL: Any One Approves</option>
                      <option value="PARALLEL_QUORUM">PARALLEL: Quorum Required</option>
                    </select>
                  </div>

                  {selectedStage.approvalPolicy === 'PARALLEL_QUORUM' && (
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.slate[700], marginBottom: '4px' }}>
                        Quorum Count Required
                      </label>
                      <input
                        type="number"
                        disabled={isImmutable}
                        value={selectedStage.quorumRequired || 2}
                        onChange={(e) => handleUpdateStage({ quorumRequired: parseInt(e.target.value, 10) || 1 })}
                        style={{ width: '100%', height: '30px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }}
                      />
                    </div>
                  )}

                  {/* Approver Target Role */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: colors.slate[700], marginBottom: '4px' }}>
                      Primary Approver Assignment
                    </label>
                    <select
                      disabled={isImmutable}
                      value={selectedStage.assignmentRules?.[0]?.targetRole || 'SITE_ADMIN'}
                      onChange={(e) => {
                        const newRules = [
                          {
                            approverType: 'ROLE' as ApprovalApproverType,
                            targetRole: e.target.value as EnterpriseRole,
                            allowSelfApproval: false,
                            delegationAllowed: true,
                          },
                        ];
                        handleUpdateStage({ assignmentRules: newRules });
                      }}
                      style={{ width: '100%', height: '30px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }}
                    >
                      <option value="SITE_ADMIN">Role: Site Admin</option>
                      <option value="SECURITY_MANAGER">Role: Security Manager</option>
                      <option value="EHS_MANAGER">Role: EHS Safety Manager</option>
                      <option value="ORGANIZATION_ADMIN">Role: Organization Admin</option>
                      <option value="SUPER_ADMIN">Role: Super Admin</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="allowSelf"
                      disabled={isImmutable}
                      checked={selectedStage.assignmentRules?.[0]?.allowSelfApproval === true}
                      onChange={(e) => {
                        const current = selectedStage.assignmentRules?.[0] || { approverType: 'ROLE' };
                        handleUpdateStage({
                          assignmentRules: [{ ...current, allowSelfApproval: e.target.checked }],
                        });
                      }}
                    />
                    <label htmlFor="allowSelf" style={{ fontSize: '11px', color: colors.slate[700] }}>
                      Allow Self-Approval (Disabled by default)
                    </label>
                  </div>
                </div>
              )}

              {/* SLA Engine Configuration */}
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: radius.md, padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400e', textTransform: 'uppercase' }}>
                  SLA & Escalation Engine
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: colors.slate[700], marginBottom: '2px' }}>
                      SLA (Minutes)
                    </label>
                    <input
                      type="number"
                      disabled={isImmutable}
                      value={selectedStage.slaConfig?.slaMinutes || 120}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 60;
                        handleUpdateStage({
                          slaConfig: {
                            slaMinutes: val,
                            warningMinutes: selectedStage.slaConfig?.warningMinutes || Math.floor(val * 0.75),
                            escalateToManager: selectedStage.slaConfig?.escalateToManager ?? true,
                          },
                        });
                      }}
                      style={{ width: '100%', height: '28px', padding: '0 6px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: '11px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: colors.slate[700], marginBottom: '2px' }}>
                      Warning (Min)
                    </label>
                    <input
                      type="number"
                      disabled={isImmutable}
                      value={selectedStage.slaConfig?.warningMinutes || 90}
                      onChange={(e) => {
                        handleUpdateStage({
                          slaConfig: {
                            slaMinutes: selectedStage.slaConfig?.slaMinutes || 120,
                            warningMinutes: parseInt(e.target.value, 10) || 45,
                            escalateToManager: selectedStage.slaConfig?.escalateToManager ?? true,
                          },
                        });
                      }}
                      style={{ width: '100%', height: '28px', padding: '0 6px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: '11px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="escalateMgr"
                    disabled={isImmutable}
                    checked={selectedStage.slaConfig?.escalateToManager !== false}
                    onChange={(e) => {
                      handleUpdateStage({
                        slaConfig: {
                          slaMinutes: selectedStage.slaConfig?.slaMinutes || 120,
                          warningMinutes: selectedStage.slaConfig?.warningMinutes || 90,
                          escalateToManager: e.target.checked,
                        },
                      });
                    }}
                  />
                  <label htmlFor="escalateMgr" style={{ fontSize: '11px', color: colors.slate[700] }}>
                    Auto-Escalate to Manager on Breach
                  </label>
                </div>
              </div>

              {/* Add Outgoing Transition */}
              {!isImmutable && (
                <Button variant="secondary" size="dense" leftIcon={<Plus size={12} />} onClick={handleAddTransition}>
                  Add Outgoing Transition
                </Button>
              )}
            </div>
          ) : (
            <div style={{ color: colors.slate[500], fontSize: '11px', textAlign: 'center', padding: '20px 0' }}>
              Select a stage on the canvas to inspect settings.
            </div>
          )}
        </div>
      </div>

      {/* 3. MODAL: Static Validation Diagnostics */}
      {isValidationModalOpen && validationResult && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div style={{ backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {validationResult.isValid ? (
                  <CheckCircle2 size={22} color="#16a34a" />
                ) : (
                  <AlertTriangle size={22} color="#dc2626" />
                )}
                <h3 style={{ margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }}>
                  Workflow Static Analysis Diagnostics
                </h3>
              </div>
              <button type="button" onClick={() => setIsValidationModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} color={colors.slate[500]} />
              </button>
            </div>

            {validationResult.isValid ? (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: radius.md, padding: '12px 16px', color: '#166534', fontSize: typography.fontSize.xs.size }}>
                <strong>All Static Invariant Checks Passed:</strong> Exactly one START stage, reachable END stage, no broken transitions, and all approval policies configured. Workflow is valid for production publish!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', color: '#b91c1c', fontWeight: 700 }}>
                  Validation Errors Found ({validationResult.diagnostics.length}):
                </div>
                <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {validationResult.diagnostics.map((diag, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: diag.severity === 'ERROR' ? '#fef2f2' : '#fffbeb',
                        border: `1px solid ${diag.severity === 'ERROR' ? '#fecaca' : '#fef08a'}`,
                        borderRadius: radius.sm,
                        fontSize: '11px',
                        color: diag.severity === 'ERROR' ? '#991b1b' : '#854d0e',
                      }}
                    >
                      <strong>[{diag.code}]</strong> {diag.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button variant="secondary" size="normal" onClick={() => setIsValidationModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
