import React, { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { colors, radius, shadows } from '@vms/ui/tokens';

export interface SiteOption {
  siteId: string;
  siteName: string;
}

/** Site picker for the top bar. One site shows as a label; several open a list. */
export const SiteSwitcher: React.FC<{ sites: SiteOption[]; currentSiteId: string; onSelect: (siteId: string) => void; compact?: boolean }> = ({
  sites,
  currentSiteId,
  onSelect,
  compact,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  if (!sites.length) return null;
  const current = sites.find(s => s.siteId === currentSiteId) ?? sites[0];
  const many = sites.length > 1;
  return (
    <div ref={ref} style={{ position: 'relative', minWidth: 0 }}>
      <button
        type="button"
        aria-label={`Site: ${current.siteName}${many ? '. Change site' : ''}`}
        aria-haspopup={many ? 'listbox' : undefined}
        aria-expanded={many ? open : undefined}
        disabled={!many}
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '36px',
          maxWidth: compact ? '44px' : '280px',
          padding: compact ? '0 10px' : '0 10px 0 12px',
          border: `1px solid ${colors.slate[200]}`,
          borderRadius: radius.lg,
          backgroundColor: '#ffffff',
          color: colors.slate[800],
          fontSize: '13px',
          fontWeight: 500,
          cursor: many ? 'pointer' : 'default',
          minWidth: 0,
        }}
      >
        <Building2 size={16} color={colors.primary[600]} style={{ flexShrink: 0 }} />
        {!compact && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{current.siteName}</span>}
        {!compact && many && <ChevronDown size={15} color={colors.slate[500]} style={{ flexShrink: 0 }} />}
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label="Sites"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            minWidth: '260px',
            maxWidth: 'min(360px, calc(100vw - 32px))',
            maxHeight: '320px',
            overflowY: 'auto',
            listStyle: 'none',
            margin: 0,
            padding: '6px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.xl,
            boxShadow: shadows.elevated,
            zIndex: 300,
          }}
        >
          {sites.map(s => {
            const selected = s.siteId === current.siteId;
            return (
              <li key={s.siteId} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className="vms-menu-row"
                  onClick={() => {
                    onSelect(s.siteId);
                    setOpen(false);
                  }}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 10px', border: 'none', background: 'none', borderRadius: radius.lg, cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: colors.slate[800], fontWeight: selected ? 600 : 400 }}
                >
                  <Building2 size={15} color={colors.slate[400]} />
                  <span style={{ flex: 1 }}>{s.siteName}</span>
                  {selected && <Check size={15} color={colors.primary[600]} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
