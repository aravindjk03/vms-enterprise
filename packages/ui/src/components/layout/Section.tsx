import React from 'react';
import { colors, typography } from '../../tokens.js';

export interface SectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  divider?: boolean;
}

export const Section: React.FC<SectionProps> = ({
  title,
  description,
  action,
  children,
  divider = true,
}) => {
  return (
    <section
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        paddingBottom: divider ? '20px' : 0,
        marginBottom: divider ? '20px' : 0,
        borderBottom: divider ? `1px solid ${colors.slate[200]}` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: typography.fontSize.lg.size,
              fontWeight: typography.fontWeight.bold,
              color: colors.slate[900],
            }}
          >
            {title}
          </h2>
          {description && (
            <p
              style={{
                margin: 0,
                fontSize: typography.fontSize.sm.size,
                color: colors.slate[600],
              }}
            >
              {description}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div style={{ width: '100%' }}>{children}</div>
    </section>
  );
};
