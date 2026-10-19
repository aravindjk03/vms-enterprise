import React from 'react';
import { Calendar, AlertTriangle, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export type DocumentLifecycleStatus = 
  | 'VALID' 
  | 'EXPIRING_SOON' 
  | 'EXPIRED' 
  | 'PENDING_VERIFICATION' 
  | 'REJECTED' 
  | 'MISSING';

export interface ExpiryIndicatorProps {
  documentName: string;
  status: DocumentLifecycleStatus;
  expiryDate?: string;
  daysRemaining?: number;
}

export const ExpiryIndicator: React.FC<ExpiryIndicatorProps> = ({
  documentName,
  status,
  expiryDate,
  daysRemaining,
}) => {
  const getVisuals = () => {
    switch (status) {
      case 'VALID':
        return {
          bg: colors.status.success.bg,
          border: colors.status.success.border,
          color: colors.status.success.fg,
          icon: <CheckCircle2 size={14} />,
          statusLabel: 'VALID UNTIL',
        };
      case 'EXPIRING_SOON':
        return {
          bg: colors.status.warning.bg,
          border: colors.status.warning.border,
          color: colors.status.warning.fg,
          icon: <AlertTriangle size={14} />,
          statusLabel: 'EXPIRING SOON',
        };
      case 'EXPIRED':
        return {
          bg: colors.status.danger.bg,
          border: colors.status.danger.solid,
          color: colors.status.danger.fg,
          icon: <XCircle size={14} />,
          statusLabel: 'EXPIRED',
        };
      case 'PENDING_VERIFICATION':
        return {
          bg: colors.status.pending.bg,
          border: colors.status.pending.border,
          color: colors.status.pending.fg,
          icon: <Clock size={14} />,
          statusLabel: 'PENDING VERIFICATION',
        };
      case 'REJECTED':
        return {
          bg: colors.status.danger.bg,
          border: colors.status.danger.border,
          color: colors.status.danger.fg,
          icon: <XCircle size={14} />,
          statusLabel: 'REJECTED',
        };
      case 'MISSING':
      default:
        return {
          bg: colors.status.neutral.bg,
          border: colors.status.neutral.border,
          color: colors.status.neutral.fg,
          icon: <AlertTriangle size={14} />,
          statusLabel: 'MISSING MANDATORY DOC',
        };
    }
  };

  const visuals = getVisuals();

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        gap: '2px',
        padding: '6px 10px',
        borderRadius: radius.md,
        backgroundColor: visuals.bg,
        border: `1px solid ${visuals.border}`,
        color: visuals.color,
      }}
      className={`vms-expiry-indicator vms-expiry-${status.toLowerCase()}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: typography.fontWeight.semibold, color: colors.slate[800] }}>
          {documentName}
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            fontWeight: typography.fontWeight.bold,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {visuals.icon}
          {visuals.statusLabel}
        </span>
      </div>

      {expiryDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: typography.fontFamily.mono }}>
          <Calendar size={12} opacity={0.7} />
          <span>{expiryDate}</span>
          {typeof daysRemaining === 'number' && (
            <span style={{ fontWeight: 600, opacity: 0.85 }}>
              ({daysRemaining > 0 ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d overdue`})
            </span>
          )}
        </div>
      )}
    </div>
  );
};
