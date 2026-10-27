import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, KeyRound, LogOut, Menu, MonitorSmartphone, PanelLeftClose, PanelLeftOpen, Search, Shield, ShieldCheck, X } from 'lucide-react';
import { colors, radius, shadows, typography } from '@vms/ui/tokens';

/**
 * Application frame: a navy navigation sidebar (a drawer on small screens), a light top bar with
 * breadcrumb, site and search, and a user card with the account menu. Pages render inside `children`.
 */

export interface ShellNavItem {
  route: string;
  label: string;
  /** Screen still shows sample data (live consoles only). */
  sample?: boolean;
}

export interface ShellNavGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items: ShellNavItem[];
  /** Module that has no live screen yet; listed under "Preview". */
  preview?: boolean;
}

export interface ShellUser {
  name: string;
  roleLabel: string;
  detail?: string;
}

export interface ShellMenuAction {
  label: string;
  icon: React.ReactNode;
  onSelect: () => void;
  tone?: 'danger';
}

export interface AppShellProps {
  groups: ShellNavGroup[];
  activeRoute: string;
  onNavigate: (route: string) => void;
  breadcrumbs: string[];
  organizationName: string;
  user: ShellUser;
  userActions: ShellMenuAction[];
  onSearch: () => void;
  /** Site picker and any extra controls for the top bar. */
  topbarRight?: React.ReactNode;
  /** Shown above everything (e.g. an emergency banner). */
  banner?: React.ReactNode;
  children: React.ReactNode;
}

const NAV = colors.navy;

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}

function readFlag(key: string, fallback: boolean): boolean {
  try {
    const v = window.localStorage.getItem(key);
    return v === null ? fallback : v === '1';
  } catch {
    return fallback;
  }
}

function writeFlag(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    /* storage unavailable: keep the in-memory value */
  }
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0]!.toUpperCase())
    .join('') || '?';

export const AppShell: React.FC<AppShellProps> = ({
  groups,
  activeRoute,
  onNavigate,
  breadcrumbs,
  organizationName,
  user,
  userActions,
  onSearch,
  topbarRight,
  banner,
  children,
}) => {
  const compact = useMediaQuery('(max-width: 960px)');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rail, setRail] = useState(() => readFlag('vms.nav.rail', false));
  const [previewOpen, setPreviewOpen] = useState(() => readFlag('vms.nav.preview', false));
  const activeGroup = groups.find(g => g.items.some(i => i.route === activeRoute))?.id ?? null;
  const [expanded, setExpanded] = useState<string | null>(activeGroup);

  useEffect(() => {
    if (activeGroup) setExpanded(activeGroup);
    if (activeGroup && groups.find(g => g.id === activeGroup)?.preview) setPreviewOpen(true);
  }, [activeGroup, groups]);
  useEffect(() => {
    if (!compact) setDrawerOpen(false);
  }, [compact]);

  const collapsed = rail && !compact;
  const go = (route: string) => {
    onNavigate(route);
    if (compact) setDrawerOpen(false);
  };
  const live = groups.filter(g => !g.preview);
  const preview = groups.filter(g => g.preview);

  const sidebar = (
    <nav
      aria-label="Main navigation"
      style={{
        width: compact ? 'min(300px, 86vw)' : collapsed ? '72px' : '256px',
        flexShrink: 0,
        backgroundColor: NAV[900],
        color: NAV[400],
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: compact ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        zIndex: compact ? 120 : 'auto',
        boxShadow: compact ? shadows.modal : 'none',
        transition: 'width 160ms ease',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: collapsed ? '18px 0' : '18px 18px 14px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
        <span
          aria-hidden="true"
          style={{ width: '34px', height: '34px', borderRadius: radius.lg, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[700]})`, flexShrink: 0 }}
        >
          <Shield size={18} color="#ffffff" />
        </span>
        {!collapsed && (
          <span style={{ display: 'grid', minWidth: 0 }}>
            <strong style={{ color: '#ffffff', fontSize: '15px', letterSpacing: '0.01em' }}>VMS Enterprise</strong>
            <span style={{ fontSize: '12px', color: NAV[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{organizationName}</span>
          </span>
        )}
        {compact && (
          <button type="button" aria-label="Close navigation menu" onClick={() => setDrawerOpen(false)} style={iconButton(NAV[400], { marginLeft: 'auto' })}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Groups (scrolls inside the fixed-height frame) */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: collapsed ? '6px 10px' : '6px 12px 12px' }}>
        {live.map(g => (
          <NavGroup key={g.id} group={g} activeRoute={activeRoute} expanded={expanded === g.id} collapsed={collapsed} onToggle={() => setExpanded(expanded === g.id ? null : g.id)} onNavigate={go} />
        ))}
        {preview.length > 0 && (
          <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: `1px solid ${NAV[800]}` }}>
            {!collapsed && (
              <button
                type="button"
                aria-expanded={previewOpen}
                onClick={() => {
                  setPreviewOpen(!previewOpen);
                  writeFlag('vms.nav.preview', !previewOpen);
                }}
                className="vms-nav-row"
                title="Modules that show sample data until they are connected"
                style={{ ...rowButton, color: NAV[500], fontSize: '12px', fontWeight: 600, padding: '6px 10px', whiteSpace: 'nowrap' }}
              >
                {previewOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span style={{ flex: 1 }}>Preview modules</span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: NAV[500], border: `1px solid ${NAV[700]}`, borderRadius: radius.full, padding: '0 7px' }}>sample</span>
              </button>
            )}
            {(previewOpen || collapsed) &&
              preview.map(g => (
                <NavGroup key={g.id} group={g} activeRoute={activeRoute} expanded={expanded === g.id} collapsed={collapsed} onToggle={() => setExpanded(expanded === g.id ? null : g.id)} onNavigate={go} />
              ))}
          </div>
        )}
      </div>

      {/* Account */}
      <div style={{ borderTop: `1px solid ${NAV[800]}`, padding: collapsed ? '10px 8px' : '10px 12px', display: 'grid', gap: '6px' }}>
        <UserCard user={user} actions={userActions} collapsed={collapsed} />
        {!compact && (
          <button
            type="button"
            onClick={() => {
              setRail(!rail);
              writeFlag('vms.nav.rail', !rail);
            }}
            aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            style={{ ...rowButton, color: NAV[500], fontSize: '12px', justifyContent: collapsed ? 'center' : 'flex-start', padding: '6px 10px' }}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Collapse menu</span>}
          </button>
        )}
      </div>
    </nav>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: colors.slate[50] }}>
      {(!compact || drawerOpen) && sidebar}
      {compact && drawerOpen && (
        <div aria-hidden="true" onClick={() => setDrawerOpen(false)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(7, 16, 28, 0.5)', zIndex: 110 }} />
      )}

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {banner}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: compact ? '0 12px' : '0 28px',
            backgroundColor: 'rgba(255, 255, 255, 0.92)',
            backdropFilter: 'saturate(180%) blur(8px)',
            borderBottom: `1px solid ${colors.slate[200]}`,
            minWidth: 0,
          }}
        >
          {compact && (
            <button type="button" aria-label="Open navigation menu" onClick={() => setDrawerOpen(true)} style={iconButton(colors.slate[700])}>
              <Menu size={20} />
            </button>
          )}
          <nav aria-label="Breadcrumb" style={{ minWidth: 0, flex: 1 }}>
            <ol style={{ display: 'flex', alignItems: 'center', gap: '6px', listStyle: 'none', margin: 0, padding: 0, fontSize: '13px', color: colors.slate[500], minWidth: 0 }}>
              {breadcrumbs.map((b, i) => {
                const last = i === breadcrumbs.length - 1;
                return (
                  <li key={`${b}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, ...(compact && !last ? { display: 'none' } : {}) }}>
                    <span
                      aria-current={last ? 'page' : undefined}
                      style={{ color: last ? colors.slate[900] : colors.slate[500], fontWeight: last ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {b}
                    </span>
                    {!last && <ChevronRight size={14} color={colors.slate[400]} />}
                  </li>
                );
              })}
            </ol>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            {topbarRight}
            <button
              type="button"
              onClick={onSearch}
              aria-label="Search"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                height: '36px',
                padding: compact ? '0 9px' : '0 10px 0 12px',
                border: `1px solid ${colors.slate[200]}`,
                borderRadius: radius.lg,
                backgroundColor: '#ffffff',
                color: colors.slate[500],
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              <Search size={16} />
              {!compact && (
                <>
                  <span style={{ marginRight: '18px' }}>Search</span>
                  <kbd style={{ fontFamily: typography.fontFamily.mono, fontSize: '11px', color: colors.slate[500], border: `1px solid ${colors.slate[200]}`, borderRadius: radius.sm, padding: '1px 5px', backgroundColor: colors.slate[50] }}>
                    Ctrl K
                  </kbd>
                </>
              )}
            </button>
          </div>
        </header>

        <main style={{ flex: 1, minWidth: 0, width: '100%', maxWidth: '1520px', margin: '0 auto', padding: compact ? '18px 16px 40px' : '28px 32px 48px', boxSizing: 'border-box' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

const rowButton: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  borderRadius: radius.lg,
  textAlign: 'left',
};

function iconButton(color: string, extra: React.CSSProperties = {}): React.CSSProperties {
  return { display: 'grid', placeItems: 'center', width: '36px', height: '36px', border: 'none', background: 'none', color, cursor: 'pointer', borderRadius: radius.lg, ...extra };
}

const NavGroup: React.FC<{
  group: ShellNavGroup;
  activeRoute: string;
  expanded: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: (route: string) => void;
}> = ({ group, activeRoute, expanded, collapsed, onToggle, onNavigate }) => {
  const active = group.items.some(i => i.route === activeRoute);
  const single = group.items.length === 1;
  const open = expanded && !single && !collapsed;
  return (
    <div style={{ marginBottom: '2px' }}>
      <button
        type="button"
        aria-expanded={single ? undefined : open}
        aria-current={single && active ? 'page' : undefined}
        title={collapsed ? group.label : undefined}
        onClick={() => (single || collapsed ? onNavigate(group.items[0].route) : onToggle())}
        style={{
          ...rowButton,
          height: '38px',
          padding: collapsed ? '0' : '0 10px',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: active ? '#ffffff' : NAV[400],
          backgroundColor: active && (single || collapsed) ? NAV[700] : 'transparent',
          fontSize: '14px',
          fontWeight: active ? 600 : 500,
        }}
        className="vms-nav-row"
      >
        <span style={{ display: 'grid', placeItems: 'center', color: active ? colors.primary[300] : NAV[500], flexShrink: 0 }}>{group.icon}</span>
        {!collapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.label}</span>}
        {!collapsed && !single && (open ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}
      </button>
      {open && (
        <div style={{ display: 'grid', gap: '1px', margin: '2px 0 6px', paddingLeft: '20px' }}>
          {group.items.map(item => {
            const current = item.route === activeRoute;
            return (
              <button
                key={item.route}
                type="button"
                aria-current={current ? 'page' : undefined}
                onClick={() => onNavigate(item.route)}
                style={{
                  ...rowButton,
                  minHeight: '34px',
                  padding: '6px 10px 6px 16px',
                  fontSize: '13px',
                  color: current ? '#ffffff' : NAV[400],
                  fontWeight: current ? 600 : 400,
                  backgroundColor: current ? NAV[700] : 'transparent',
                  boxShadow: current ? `inset 3px 0 0 ${colors.primary[500]}` : 'none',
                }}
                className="vms-nav-row"
              >
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.sample && (
                  <span title="Sample data, not connected yet" style={{ fontSize: '10px', color: NAV[500], border: `1px solid ${NAV[700]}`, borderRadius: radius.full, padding: '0 6px' }}>
                    sample
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const UserCard: React.FC<{ user: ShellUser; actions: ShellMenuAction[]; collapsed: boolean }> = ({ user, actions, collapsed }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        onClick={() => setOpen(!open)}
        style={{ ...rowButton, padding: collapsed ? '6px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', backgroundColor: open ? NAV[800] : 'transparent' }}
        className="vms-nav-row"
      >
        <span aria-hidden="true" style={{ width: '34px', height: '34px', borderRadius: radius.full, display: 'grid', placeItems: 'center', backgroundColor: colors.primary[600], color: '#ffffff', fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
          {initials(user.name)}
        </span>
        {!collapsed && (
          <span style={{ display: 'grid', minWidth: 0, flex: 1 }}>
            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</span>
            <span style={{ color: NAV[500], fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.roleLabel}</span>
          </span>
        )}
        {!collapsed && <ChevronDown size={15} color={NAV[500]} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 120ms' }} />}
      </button>
      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            width: '248px',
            backgroundColor: '#ffffff',
            borderRadius: radius.xl,
            boxShadow: shadows.modal,
            border: `1px solid ${colors.slate[200]}`,
            padding: '6px',
            zIndex: 200,
          }}
        >
          <div style={{ padding: '10px 10px 8px', borderBottom: `1px solid ${colors.slate[100]}`, marginBottom: '4px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: colors.slate[900] }}>{user.name}</div>
            <div style={{ fontSize: '12px', color: colors.slate[500] }}>{user.detail ?? user.roleLabel}</div>
          </div>
          {actions.map(a => (
            <button
              key={a.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                a.onSelect();
              }}
              style={{ ...rowButton, padding: '9px 10px', fontSize: '13px', color: a.tone === 'danger' ? colors.status.danger.fg : colors.slate[700] }}
              className="vms-menu-row"
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const menuIcons = {
  password: <KeyRound size={16} />,
  twoStep: <ShieldCheck size={16} />,
  devices: <MonitorSmartphone size={16} />,
  signOut: <LogOut size={16} />,
  check: <Check size={16} />,
};
