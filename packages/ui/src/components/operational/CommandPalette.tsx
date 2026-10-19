import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  Truck, 
  Package, 
  HardHat, 
  ShieldAlert, 
  DoorOpen, 
  Bell, 
  CheckCircle2, 
  ArrowRight,
  X,
  Building,
  Compass
} from 'lucide-react';
import { colors, overlay, radius, shadows, typography } from '../../tokens.js';

export interface CommandItem {
  id: string;
  category: 'ACTIONS' | 'NAVIGATION' | 'EMERGENCY' | 'SEARCH';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  onSelect: () => void;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: CommandItem[];
  onNavigate?: (path: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Default global command presets matching Section 9
  const defaultCommands: CommandItem[] = [
    {
      id: 'cmd-create-visitor',
      category: 'ACTIONS',
      title: 'Create Visitor Pre-Registration',
      subtitle: 'Schedule a new visitor or candidate appointment',
      icon: <UserPlus size={16} color={colors.primary[600]} />,
      shortcut: 'V',
      onSelect: () => onNavigate && onNavigate('/visitors/new'),
    },
    {
      id: 'cmd-create-customer',
      category: 'ACTIONS',
      title: 'Create Customer Visit / Delegation',
      subtitle: 'Onboard VIP customer account and delegation',
      icon: <Building size={16} color={colors.primary[600]} />,
      shortcut: 'C',
      onSelect: () => onNavigate && onNavigate('/customers/visits'),
    },
    {
      id: 'cmd-register-contractor',
      category: 'ACTIONS',
      title: 'Register Contractor / Work Order',
      subtitle: 'New vendor roster with safety induction compliance',
      icon: <HardHat size={16} color={colors.primary[600]} />,
      shortcut: 'W',
      onSelect: () => onNavigate && onNavigate('/contractors/work-orders'),
    },
    {
      id: 'cmd-material-inward',
      category: 'ACTIONS',
      title: 'Create Material Inward Consignment',
      subtitle: 'Record delivery challan and weighbridge gross pass',
      icon: <Package size={16} color={colors.primary[600]} />,
      shortcut: 'M',
      onSelect: () => onNavigate && onNavigate('/materials/inward'),
    },
    {
      id: 'cmd-register-vehicle',
      category: 'ACTIONS',
      title: 'Register Commercial Vehicle / Driver',
      subtitle: 'PUC, insurance verification and driver check',
      icon: <Truck size={16} color={colors.primary[600]} />,
      shortcut: 'T',
      onSelect: () => onNavigate && onNavigate('/vehicles'),
    },
    {
      id: 'cmd-open-gate',
      category: 'NAVIGATION',
      title: 'Open Industrial Gate Console (Gate Mode)',
      subtitle: 'Direct high-contrast lane fast scan terminal',
      icon: <DoorOpen size={16} color={colors.primary[600]} />,
      shortcut: 'G',
      onSelect: () => onNavigate && onNavigate('/gate'),
    },
    {
      id: 'cmd-view-approvals',
      category: 'NAVIGATION',
      title: 'View Pending Approvals Queue',
      subtitle: 'Host, Safety PTW and Gate exemptions',
      icon: <CheckCircle2 size={16} color={colors.status.warning.solid} />,
      shortcut: 'A',
      onSelect: () => onNavigate && onNavigate('/dashboard'),
    },
    {
      id: 'cmd-view-esg',
      category: 'NAVIGATION',
      title: 'Open ESG / GHG Activity Ledger',
      subtitle: 'Traceable commuter and freight carbon metrics',
      icon: <Compass size={16} color={colors.esg[600]} />,
      shortcut: 'E',
      onSelect: () => onNavigate && onNavigate('/esg/activity'),
    },
    {
      id: 'cmd-emergency-dashboard',
      category: 'EMERGENCY',
      title: 'Trigger Emergency Muster Dashboard',
      subtitle: 'Live plant headcount and roll-call status',
      icon: <ShieldAlert size={16} color={colors.status.danger.solid} />,
      shortcut: '!',
      onSelect: () => onNavigate && onNavigate('/emergency'),
    },
  ];

  const activeCommands = commands || defaultCommands;

  const filtered = activeCommands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    (c.subtitle && c.subtitle.toLowerCase().includes(query.toLowerCase())) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].onSelect();
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: overlay.modalBackdrop,
        }}
      />

      <div
        role="dialog"
        aria-label="Command Palette"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#ffffff',
          borderRadius: radius.lg,
          boxShadow: shadows.modal,
          overflow: 'hidden',
          zIndex: 1201,
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${colors.slate[200]}`,
        }}
      >
        {/* Search header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${colors.slate[200]}`,
            gap: '10px',
          }}
        >
          <Search size={18} color={colors.slate[400]} />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search (e.g. Visitor, Material, Emergency)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            style={{
              width: '100%',
              border: 'none',
              outline: 'none',
              fontSize: typography.fontSize.md.size,
              color: colors.slate[900],
              fontFamily: typography.fontFamily.sans,
            }}
          />
          <kbd
            style={{
              fontSize: '11px',
              backgroundColor: colors.slate[100],
              border: `1px solid ${colors.slate[300]}`,
              padding: '2px 6px',
              borderRadius: radius.sm,
              color: colors.slate[600],
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', padding: '8px' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: colors.slate[500], fontSize: typography.fontSize.sm.size }}>
              No commands matching "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  onClick={() => {
                    cmd.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    borderRadius: radius.md,
                    backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 80ms ease',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cmd.icon}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <strong style={{ fontSize: typography.fontSize.sm.size, color: isSelected ? colors.primary[900] : colors.slate[900] }}>
                        {cmd.title}
                      </strong>
                      {cmd.subtitle && (
                        <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                          {cmd.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        padding: '1px 5px',
                        borderRadius: radius.sm,
                        backgroundColor: colors.slate[100],
                        color: colors.slate[600],
                      }}
                    >
                      {cmd.category}
                    </span>
                    {cmd.shortcut && (
                      <kbd
                        style={{
                          fontSize: '11px',
                          backgroundColor: colors.slate[100],
                          border: `1px solid ${colors.slate[300]}`,
                          padding: '1px 5px',
                          borderRadius: radius.sm,
                          color: colors.slate[700],
                          fontFamily: typography.fontFamily.mono,
                        }}
                      >
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 16px',
            borderTop: `1px solid ${colors.slate[200]}`,
            backgroundColor: colors.slate[50],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: colors.slate[500],
          }}
        >
          <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to execute</span>
          <span>Press <kbd>Ctrl+K</kbd> anywhere</span>
        </div>
      </div>
    </div>
  );
};
