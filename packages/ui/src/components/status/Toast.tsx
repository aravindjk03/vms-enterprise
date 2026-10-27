import React, { useEffect, useState } from 'react';
import { colors, radius, shadows, typography } from '../../tokens.js';

export type ToastTone = 'success' | 'info' | 'warning' | 'danger';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const TOAST_EVENT = 'vms:toast';
let nextId = 1;

/**
 * Shows a short, non-blocking confirmation (replaces window.alert, which blocks the page and is
 * suppressed in embedded viewers). Rendered by the single <ToastHost /> mounted in the app shell.
 */
export function showToast(message: string, tone: ToastTone = 'success'): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ToastItem>(TOAST_EVENT, { detail: { id: nextId++, message, tone } }));
}

export const ToastHost: React.FC<{ durationMs?: number }> = ({ durationMs = 4000 }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const item = (e as CustomEvent<ToastItem>).detail;
      setToasts(current => [...current.slice(-2), item]);
      window.setTimeout(() => setToasts(current => current.filter(t => t.id !== item.id)), durationMs);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [durationMs]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        right: 'max(16px, env(safe-area-inset-right, 0px))',
        bottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
        left: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 1000,
        maxWidth: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => {
        const tone = colors.status[t.tone];
        return (
          <div
            key={t.id}
            style={{
              backgroundColor: tone.bg,
              color: tone.fg,
              border: `1px solid ${tone.border}`,
              borderRadius: radius.md,
              boxShadow: shadows.elevated,
              padding: '10px 14px',
              fontSize: typography.fontSize.sm.size,
              fontWeight: 600,
              pointerEvents: 'auto',
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
};
