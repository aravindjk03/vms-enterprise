import React from 'react';
import { colors, radius, shadows, typography } from '../../tokens.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'sunken' | 'elevated' | 'alert' | 'esg';
  dense?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  footer,
  variant = 'default',
  dense = false,
  children,
  style,
  className = '',
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'sunken':
        return {
          backgroundColor: colors.slate[50],
          border: `1px solid ${colors.slate[200]}`,
        };
      case 'elevated':
        return {
          backgroundColor: '#ffffff',
          border: `1px solid ${colors.slate[200]}`,
          boxShadow: shadows.elevated,
        };
      case 'alert':
        return {
          backgroundColor: '#ffffff',
          border: `1px solid ${colors.status.danger.solid}`,
          borderLeft: `4px solid ${colors.status.danger.solid}`,
        };
      case 'esg':
        return {
          backgroundColor: '#ffffff',
          border: `1px solid ${colors.esg[500]}`,
          borderLeft: `4px solid ${colors.esg[600]}`,
        };
      case 'default':
      default:
        return {
          backgroundColor: '#ffffff',
          border: `1px solid ${colors.slate[200]}`,
          boxShadow: shadows.card,
        };
    }
  };

  const padding = dense ? '10px 12px' : '16px 20px';

  return (
    <div
      style={{
        borderRadius: radius.md,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        ...getVariantStyles(),
        ...style,
      }}
      className={`vms-card vms-card-${variant} ${className}`}
      {...props}
    >
      {(title || headerAction) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding,
            borderBottom: `1px solid ${colors.slate[200]}`,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {title && (
              <h3
                style={{
                  margin: 0,
                  fontSize: typography.fontSize.md.size,
                  fontWeight: typography.fontWeight.semibold,
                  color: colors.slate[900],
                }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                {subtitle}
              </span>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}

      <div style={{ padding, flex: 1 }}>{children}</div>

      {footer && (
        <div
          style={{
            padding: dense ? '8px 12px' : '12px 20px',
            backgroundColor: colors.slate[50],
            borderTop: `1px solid ${colors.slate[200]}`,
          }}
        >
          {footer}
        </div>
      )}
    </div>
  );
};
