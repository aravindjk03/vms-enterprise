import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Search, UserPlus, Truck, Package, HardHat, ShieldAlert, DoorOpen, CheckCircle2, Building, Compass } from 'lucide-react';
import { colors, overlay, radius, shadows, typography } from '../../tokens.js';
export const CommandPalette = ({ isOpen, onClose, commands, onNavigate, }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    // Default global command presets matching Section 9
    const defaultCommands = [
        {
            id: 'cmd-create-visitor',
            category: 'ACTIONS',
            title: 'Create Visitor Pre-Registration',
            subtitle: 'Schedule a new visitor or candidate appointment',
            icon: _jsx(UserPlus, { size: 16, color: colors.primary[600] }),
            shortcut: 'V',
            onSelect: () => onNavigate && onNavigate('/visitors/new'),
        },
        {
            id: 'cmd-create-customer',
            category: 'ACTIONS',
            title: 'Create Customer Visit / Delegation',
            subtitle: 'Onboard VIP customer account and delegation',
            icon: _jsx(Building, { size: 16, color: colors.primary[600] }),
            shortcut: 'C',
            onSelect: () => onNavigate && onNavigate('/customers/visits'),
        },
        {
            id: 'cmd-register-contractor',
            category: 'ACTIONS',
            title: 'Register Contractor / Work Order',
            subtitle: 'New vendor roster with safety induction compliance',
            icon: _jsx(HardHat, { size: 16, color: colors.primary[600] }),
            shortcut: 'W',
            onSelect: () => onNavigate && onNavigate('/contractors/work-orders'),
        },
        {
            id: 'cmd-material-inward',
            category: 'ACTIONS',
            title: 'Create Material Inward Consignment',
            subtitle: 'Record delivery challan and weighbridge gross pass',
            icon: _jsx(Package, { size: 16, color: colors.primary[600] }),
            shortcut: 'M',
            onSelect: () => onNavigate && onNavigate('/materials/inward'),
        },
        {
            id: 'cmd-register-vehicle',
            category: 'ACTIONS',
            title: 'Register Commercial Vehicle / Driver',
            subtitle: 'PUC, insurance verification and driver check',
            icon: _jsx(Truck, { size: 16, color: colors.primary[600] }),
            shortcut: 'T',
            onSelect: () => onNavigate && onNavigate('/vehicles'),
        },
        {
            id: 'cmd-open-gate',
            category: 'NAVIGATION',
            title: 'Open Industrial Gate Console (Gate Mode)',
            subtitle: 'Direct high-contrast lane fast scan terminal',
            icon: _jsx(DoorOpen, { size: 16, color: colors.primary[600] }),
            shortcut: 'G',
            onSelect: () => onNavigate && onNavigate('/gate'),
        },
        {
            id: 'cmd-view-approvals',
            category: 'NAVIGATION',
            title: 'View Pending Approvals Queue',
            subtitle: 'Host, Safety PTW and Gate exemptions',
            icon: _jsx(CheckCircle2, { size: 16, color: colors.status.warning.solid }),
            shortcut: 'A',
            onSelect: () => onNavigate && onNavigate('/dashboard'),
        },
        {
            id: 'cmd-view-esg',
            category: 'NAVIGATION',
            title: 'Open ESG / GHG Activity Ledger',
            subtitle: 'Traceable commuter and freight carbon metrics',
            icon: _jsx(Compass, { size: 16, color: colors.esg[600] }),
            shortcut: 'E',
            onSelect: () => onNavigate && onNavigate('/esg/activity'),
        },
        {
            id: 'cmd-emergency-dashboard',
            category: 'EMERGENCY',
            title: 'Trigger Emergency Muster Dashboard',
            subtitle: 'Live plant headcount and roll-call status',
            icon: _jsx(ShieldAlert, { size: 16, color: colors.status.danger.solid }),
            shortcut: '!',
            onSelect: () => onNavigate && onNavigate('/emergency'),
        },
    ];
    const activeCommands = commands || defaultCommands;
    const filtered = activeCommands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase()) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(query.toLowerCase())) ||
        c.category.toLowerCase().includes(query.toLowerCase()));
    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen)
                return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (filtered[selectedIndex]) {
                    filtered[selectedIndex].onSelect();
                    onClose();
                }
            }
            else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, filtered, selectedIndex, onClose]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '10vh',
        }, children: [_jsx("div", { "aria-hidden": "true", onClick: onClose, style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: overlay.modalBackdrop,
                } }), _jsxs("div", { role: "dialog", "aria-label": "Command Palette", style: {
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
                }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: `1px solid ${colors.slate[200]}`,
                            gap: '10px',
                        }, children: [_jsx(Search, { size: 18, color: colors.slate[400] }), _jsx("input", { type: "text", autoFocus: true, placeholder: "Type a command or search (e.g. Visitor, Material, Emergency)...", value: query, onChange: (e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }, style: {
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: typography.fontSize.md.size,
                                    color: colors.slate[900],
                                    fontFamily: typography.fontFamily.sans,
                                } }), _jsx("kbd", { style: {
                                    fontSize: '11px',
                                    backgroundColor: colors.slate[100],
                                    border: `1px solid ${colors.slate[300]}`,
                                    padding: '2px 6px',
                                    borderRadius: radius.sm,
                                    color: colors.slate[600],
                                }, children: "ESC" })] }), _jsx("div", { style: { maxHeight: '380px', overflowY: 'auto', padding: '8px' }, children: filtered.length === 0 ? (_jsxs("div", { style: { padding: '32px', textAlign: 'center', color: colors.slate[500], fontSize: typography.fontSize.sm.size }, children: ["No commands matching \"", query, "\""] })) : (filtered.map((cmd, idx) => {
                            const isSelected = idx === selectedIndex;
                            return (_jsxs("div", { onClick: () => {
                                    cmd.onSelect();
                                    onClose();
                                }, onMouseEnter: () => setSelectedIndex(idx), style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    borderRadius: radius.md,
                                    backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background-color 80ms ease',
                                    gap: '12px',
                                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }, children: [_jsx("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'center' }, children: cmd.icon }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: isSelected ? colors.primary[900] : colors.slate[900] }, children: cmd.title }), cmd.subtitle && (_jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: cmd.subtitle }))] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: {
                                                    fontSize: '10px',
                                                    fontWeight: 700,
                                                    textTransform: 'uppercase',
                                                    padding: '1px 5px',
                                                    borderRadius: radius.sm,
                                                    backgroundColor: colors.slate[100],
                                                    color: colors.slate[600],
                                                }, children: cmd.category }), cmd.shortcut && (_jsx("kbd", { style: {
                                                    fontSize: '11px',
                                                    backgroundColor: colors.slate[100],
                                                    border: `1px solid ${colors.slate[300]}`,
                                                    padding: '1px 5px',
                                                    borderRadius: radius.sm,
                                                    color: colors.slate[700],
                                                    fontFamily: typography.fontFamily.mono,
                                                }, children: cmd.shortcut }))] })] }, cmd.id));
                        })) }), _jsxs("div", { style: {
                            padding: '8px 16px',
                            borderTop: `1px solid ${colors.slate[200]}`,
                            backgroundColor: colors.slate[50],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: colors.slate[500],
                        }, children: [_jsxs("span", { children: ["Use ", _jsx("kbd", { children: "\u2191" }), " ", _jsx("kbd", { children: "\u2193" }), " to navigate, ", _jsx("kbd", { children: "Enter" }), " to execute"] }), _jsxs("span", { children: ["Press ", _jsx("kbd", { children: "Ctrl+K" }), " anywhere"] })] })] })] }));
};
