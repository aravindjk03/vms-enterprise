import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, UserCheck } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export type ApprovalStageStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'SKIPPED';

export interface ApprovalStatusBadgeProps {
  stageName: string;
  approverRole?: string;
  approverName?: string;
  status: ApprovalStageStatus;
  slaTimeRemaining?: string;
}

export const ApprovalStatusBadge: React.FC<ApprovalStatusBadgeProps> = ({
  stageName,
  approverRole,
  approverName,
  status,
  slaTimeRemaining,
}) => {
  const getStyle = () => {
    switch (status) {
      case 'APPROVED':
        return {
          bg: colors.status.success.bg,
          border: colors.status.success.border,
          fg: colors.status.success.fg,
          icon: <CheckCircle2 size={13} />,
        };
      case 'REJECTED':
        return {
          bg: colors.status.danger.bg,
          border: colors.status.danger.border,
          fg: colors.status.danger.fg,
          icon: <XCircle size={13} />,
        };
      case 'ESCALATED':
        return {
          bg: colors.status.overdue.bg,
          border: colors.status.overdue.border,
          fg: colors.status.overdue.fg,
          icon: <AlertCircle size={13} />,
        };
      case 'PENDING':
      default:
        return {
          bg: colors.status.warning.bg,
          border: colors.status.warning.border,
          fg: colors.status.warning.fg,
          icon: <Clock size={13} />,
        };
    }
  };

  const style = getStyle();

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        borderRadius: radius.md,
        backgroundColor: style.bg,
        border: `1px solid ${style.border}`,
        color: style.fg,
      }}
      className={`vms-approval-badge vms-approval-${status.toLowerCase()}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {style.icon}
        <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 700, textTransform: 'uppercase' }}>
          {stageName}:
        </span>
      </div>

      <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 500 }}>
        {approverName || approverRole || status}
      </span>

      {slaTimeRemaining && status === 'PENDING' && (
        <span
          style={{
            fontSize: '10px',
            backgroundColor: '#ffffff',
            padding: '1px 4px',
            borderRadius: radius.sm,
            fontWeight: 600,
            border: `1px solid ${style.border}`,
          }}
        >
          {slaTimeRemaining} SLA
        </span>
      )}
    </div>
  );
};
