import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface AlertProps {
  severity?: 'critical' | 'high' | 'warning' | 'info' | 'success';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  severity = 'info',
  title,
  children,
  onClose,
  action,
}) => {
  const getStyles = () => {
    switch (severity) {
      case 'critical':
        return {
          bg: colors.status.danger.bg,
          border: colors.status.danger.solid,
          text: colors.status.danger.fg,
          icon: <AlertCircle size={18} color={colors.status.danger.solid} />,
        };
      case 'high':
      case 'warning':
        return {
          bg: colors.status.warning.bg,
          border: colors.status.warning.border,
          text: colors.status.warning.fg,
          icon: <AlertTriangle size={18} color={colors.status.warning.solid} />,
        };
      case 'success':
        return {
          bg: colors.status.success.bg,
          border: colors.status.success.border,
          text: colors.status.success.fg,
          icon: <CheckCircle2 size={18} color={colors.status.success.solid} />,
        };
      case 'info':
      default:
        return {
          bg: colors.status.info.bg,
          border: colors.status.info.border,
          text: colors.status.info.fg,
          icon: <Info size={18} color={colors.status.info.solid} />,
        };
    }
  };

  const current = getStyles();

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px 14px',
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        borderRadius: radius.md,
        color: current.text,
      }}
      className={`vms-alert vms-alert-${severity}`}
    >
      <div style={{ flexShrink: 0, marginTop: '1px' }}>{current.icon}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {title && (
          <span style={{ fontSize: typography.fontSize.sm.size, fontWeight: typography.fontWeight.bold }}>
            {title}
          </span>
        )}
        <div style={{ fontSize: typography.fontSize.sm.size, lineHeight: '18px' }}>
          {children}
        </div>
        {action && <div style={{ marginTop: '8px' }}>{action}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          aria-label="Dismiss alert"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: current.text,
            padding: '2px',
            opacity: 0.8,
          }}
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};
