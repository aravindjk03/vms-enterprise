import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { colors, overlay, shadows, typography } from '../../tokens.js';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = '440px',
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: overlay.dimmer,
          transition: 'opacity 150ms ease',
        }}
      />

      {/* Slide-over panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={{
          position: 'relative',
          width,
          maxWidth: '100vw',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: shadows.modal,
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          animation: 'slideInRight 150ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${colors.slate[200]}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h2
              id="drawer-title"
              style={{
                margin: 0,
                fontSize: typography.fontSize.lg.size,
                fontWeight: typography.fontWeight.bold,
                color: colors.slate[900],
              }}
            >
              {title}
            </h2>
            {subtitle && (
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                {subtitle}
              </span>
            )}
          </div>
          <button
            type="button"
            aria-label="Close drawer"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              color: colors.slate[500],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: `1px solid ${colors.slate[200]}`,
              backgroundColor: colors.slate[50],
            }}
          >
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
};
