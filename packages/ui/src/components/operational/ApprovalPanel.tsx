import React, { useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw, UserPlus, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';
import { Textarea } from '../foundation/Textarea.js';

export interface ApprovalStage {
  stageId: string;
  stageName: string;
  approverName: string;
  approverRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
  timestamp?: string;
  comment?: string;
  slaTimeRemaining?: string;
}

export interface ApprovalPanelProps {
  stages: ApprovalStage[];
  currentStageId?: string;
  canApprove?: boolean;
  canDelegate?: boolean;
  onApprove?: (stageId: string, comment: string) => void;
  onReject?: (stageId: string, comment: string) => void;
  onRequestChanges?: (stageId: string, comment: string) => void;
  onDelegate?: (stageId: string, delegateTo: string) => void;
}

export const ApprovalPanel: React.FC<ApprovalPanelProps> = ({
  stages,
  currentStageId,
  canApprove = true,
  canDelegate = false,
  onApprove,
  onReject,
  onRequestChanges,
  onDelegate,
}) => {
  const [comment, setComment] = useState('');

  const activeStage = stages.find((s) => s.stageId === currentStageId) || stages.find((s) => s.status === 'PENDING') || stages[0];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
      }}
      className="vms-approval-panel"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h4 style={{ margin: 0, fontSize: typography.fontSize.md.size, fontWeight: typography.fontWeight.bold, color: colors.slate[900] }}>
          Multi-Stage Approval Workflow
        </h4>
        <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
          Sequential SLA Governance
        </span>
      </div>

      {/* Visual Workflow Stages Chain */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
        }}
      >
        {stages.map((stage, sIdx) => {
          const isApproved = stage.status === 'APPROVED';
          const isPending = stage.status === 'PENDING';
          const isRejected = stage.status === 'REJECTED';

          const stageBg = isApproved
            ? colors.status.success.bg
            : isRejected
            ? colors.status.danger.bg
            : isPending
            ? colors.status.warning.bg
            : colors.slate[100];

          const stageBorder = isApproved
            ? colors.status.success.border
            : isRejected
            ? colors.status.danger.border
            : isPending
            ? colors.status.warning.border
            : colors.slate[200];

          const stageColor = isApproved
            ? colors.status.success.fg
            : isRejected
            ? colors.status.danger.fg
            : isPending
            ? colors.status.warning.fg
            : colors.slate[600];

          return (
            <React.Fragment key={stage.stageId}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  borderRadius: radius.md,
                  backgroundColor: stageBg,
                  border: `1px solid ${stageBorder}`,
                  color: stageColor,
                  flexShrink: 0,
                }}
              >
                {isApproved ? (
                  <CheckCircle2 size={16} color={colors.status.success.solid} />
                ) : isRejected ? (
                  <XCircle size={16} color={colors.status.danger.solid} />
                ) : (
                  <Clock size={16} color={colors.status.warning.solid} />
                )}

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>
                    {stage.stageName}
                  </span>
                  <span style={{ fontSize: '10px', color: colors.slate[600] }}>
                    {stage.approverName} ({stage.approverRole})
                  </span>
                  {stage.slaTimeRemaining && isPending && (
                    <span style={{ fontSize: '9px', fontWeight: 600, color: colors.status.warning.solid }}>
                      SLA: {stage.slaTimeRemaining} left
                    </span>
                  )}
                </div>
              </div>

              {sIdx < stages.length - 1 && (
                <span style={{ color: colors.slate[300], fontSize: '14px', flexShrink: 0 }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Action Decision Form if stage is active and user is authorized */}
      {canApprove && activeStage && activeStage.status === 'PENDING' && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingTop: '12px',
            borderTop: `1px solid ${colors.slate[200]}`,
          }}
        >
          <Textarea
            label="Approver Decision Comments"
            placeholder="Provide mandatory review observations or reason for rejection/amendment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                variant="primary"
                size="dense"
                leftIcon={<CheckCircle2 size={14} />}
                onClick={() => onApprove && onApprove(activeStage.stageId, comment)}
              >
                Approve Stage
              </Button>

              <Button
                variant="danger"
                size="dense"
                leftIcon={<XCircle size={14} />}
                onClick={() => onReject && onReject(activeStage.stageId, comment)}
              >
                Reject
              </Button>

              <Button
                variant="secondary"
                size="dense"
                leftIcon={<RotateCcw size={14} />}
                onClick={() => onRequestChanges && onRequestChanges(activeStage.stageId, comment)}
              >
                Request Changes
              </Button>
            </div>

            {canDelegate && onDelegate && (
              <Button
                variant="outline"
                size="dense"
                leftIcon={<UserPlus size={14} />}
                onClick={() => onDelegate(activeStage.stageId, 'DELEGATE_USER')}
              >
                Delegate
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
