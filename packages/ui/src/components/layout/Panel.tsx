import React from 'react';
import { X } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface PanelProps {
  title?: string;
  subtitle?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
  style?: React.CSSProperties;
}

export const Panel: React.FC<PanelProps> = ({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = '320px',
  style,
}) => {
  return (
    <div
      style={{
        width,
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        ...style,
      }}
      className="vms-contextual-panel"
    >
      {(title || onClose) && (
        <div
          style={{
            padding: '12px 14px',
            borderBottom: `1px solid ${colors.slate[200]}`,
            backgroundColor: colors.slate[50],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            {title && (
              <h4 style={{ margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
                {title}
              </h4>
            )}
            {subtitle && (
              <span style={{ fontSize: '11px', color: colors.slate[500] }}>
                {subtitle}
              </span>
            )}
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close panel"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: colors.slate[500],
                padding: '4px',
                display: 'flex',
                borderRadius: radius.sm,
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      )}

      <div style={{ padding: '14px', flex: 1, overflowY: 'auto' }}>
        {children}
      </div>

      {footer && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: `1px solid ${colors.slate[200]}`,
            backgroundColor: colors.slate[50],
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
