import React from 'react';
import { colors, radius, typography } from '../../tokens.js';

export interface PageShellBreadcrumb {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageShellProps {
  breadcrumbs?: (string | PageShellBreadcrumb)[];
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children?: React.ReactNode;
  rightPanel?: React.ReactNode;
  isRightPanelOpen?: boolean;
  style?: React.CSSProperties;
}

export const PageShell: React.FC<PageShellProps> = ({
  breadcrumbs = [],
  title,
  description,
  badge,
  actions,
  filters,
  children,
  rightPanel,
  isRightPanelOpen = false,
  style,
}) => {
  return (
    <div style={{ display: 'flex', width: '100%', gap: '16px', position: 'relative', ...style }} className="vms-page-shell">
      {/* Main Content Column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Breadcrumb Trail */}
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" style={{ marginBottom: '-6px' }}>
            <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0, gap: '6px', fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                const label = typeof crumb === 'string' ? crumb : crumb.label;
                const onClick = typeof crumb === 'object' ? crumb.onClick : undefined;

                return (
                  <React.Fragment key={idx}>
                    {idx > 0 && <li style={{ color: colors.slate[400] }}>/</li>}
                    <li style={{ color: isLast ? colors.slate[900] : colors.slate[500], fontWeight: isLast ? 600 : 400 }}>
                      {onClick ? (
                        <button
                          type="button"
                          onClick={onClick}
                          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}
                        >
                          {label}
                        </button>
                      ) : (
                        <span>{label}</span>
                      )}
                    </li>
                  </React.Fragment>
                );
              })}
            </ol>
          </nav>
        )}

        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900], letterSpacing: '-0.01em' }}>
                {title}
              </h1>
              {badge}
            </div>
            {description && (
              <p style={{ margin: 0, fontSize: typography.fontSize.xs.size, color: colors.slate[600], maxWidth: '680px' }}>
                {description}
              </p>
            )}
          </div>

          {actions && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {actions}
            </div>
          )}
        </div>

        {/* Context Filters Area */}
        {filters && (
          <div style={{ width: '100%' }}>
            {filters}
          </div>
        )}

        {/* Content Body */}
        <div style={{ width: '100%' }}>
          {children}
        </div>
      </div>

      {/* Right-Side Contextual Panel */}
      {rightPanel && isRightPanelOpen && (
        <aside
          style={{
            width: '320px',
            flexShrink: 0,
            backgroundColor: '#ffffff',
            borderLeft: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
          className="vms-page-right-panel"
        >
          {rightPanel}
        </aside>
      )}
    </div>
  );
};
