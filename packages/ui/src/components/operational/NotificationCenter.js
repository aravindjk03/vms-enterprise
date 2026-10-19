import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Bell, CheckCircle2, ShieldAlert, FileText, Flame, Leaf, DoorOpen } from 'lucide-react';
import { colors, radius, shadows, typography } from '../../tokens.js';
export const NotificationCenter = ({ notifications, onMarkAsRead, onMarkAllAsRead, onNavigate, }) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const getCategoryIcon = (cat, sev) => {
        const isCritical = sev === 'CRITICAL';
        const color = isCritical ? colors.status.danger.solid : colors.primary[600];
        switch (cat) {
            case 'SECURITY':
            case 'EMERGENCY':
                return _jsx(ShieldAlert, { size: 16, color: colors.status.danger.solid });
            case 'SAFETY':
                return _jsx(Flame, { size: 16, color: colors.status.warning.solid });
            case 'GATE':
                return _jsx(DoorOpen, { size: 16, color: color });
            case 'DOCUMENT':
                return _jsx(FileText, { size: 16, color: colors.slate[600] });
            case 'ESG':
                return _jsx(Leaf, { size: 16, color: colors.esg[600] });
            case 'APPROVAL':
            default:
                return _jsx(CheckCircle2, { size: 16, color: colors.status.warning.solid });
        }
    };
    return (_jsxs("div", { style: { position: 'relative' }, className: "vms-notification-center", children: [_jsxs("button", { type: "button", "aria-label": `Notifications (${unreadCount} unread)`, onClick: () => setIsOpen(!isOpen), style: {
                    position: 'relative',
                    padding: '8px',
                    borderRadius: radius.md,
                    border: 'none',
                    backgroundColor: isOpen ? colors.slate[100] : 'transparent',
                    cursor: 'pointer',
                    color: colors.slate[700],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }, children: [_jsx(Bell, { size: 18 }), unreadCount > 0 && (_jsx("span", { style: {
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: '16px',
                            height: '16px',
                            borderRadius: radius.full,
                            backgroundColor: colors.status.danger.solid,
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 0 2px #ffffff',
                        }, children: unreadCount > 9 ? '9+' : unreadCount }))] }), isOpen && (_jsxs(_Fragment, { children: [_jsx("div", { "aria-hidden": "true", onClick: () => setIsOpen(false), style: { position: 'fixed', inset: 0, zIndex: 900 } }), _jsxs("div", { style: {
                            position: 'absolute',
                            right: 0,
                            top: '100%',
                            marginTop: '6px',
                            width: '380px',
                            maxWidth: '90vw',
                            backgroundColor: '#ffffff',
                            borderRadius: radius.md,
                            boxShadow: shadows.modal,
                            border: `1px solid ${colors.slate[200]}`,
                            zIndex: 901,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }, children: [_jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderBottom: `1px solid ${colors.slate[200]}`,
                                    backgroundColor: colors.slate[50],
                                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: "Operational Notifications" }), unreadCount > 0 && (_jsxs("span", { style: {
                                                    padding: '1px 6px',
                                                    borderRadius: radius.sm,
                                                    backgroundColor: colors.primary[100],
                                                    color: colors.primary[700],
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                }, children: [unreadCount, " New"] }))] }), onMarkAllAsRead && unreadCount > 0 && (_jsx("button", { type: "button", onClick: onMarkAllAsRead, style: {
                                            border: 'none',
                                            background: 'none',
                                            fontSize: '11px',
                                            color: colors.primary[600],
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }, children: "Mark all read" }))] }), _jsx("div", { style: { maxHeight: '380px', overflowY: 'auto' }, children: notifications.length === 0 ? (_jsx("div", { style: { padding: '32px 16px', textAlign: 'center', color: colors.slate[500], fontSize: typography.fontSize.xs.size }, children: "No active notifications" })) : (notifications.map((item) => {
                                    const isCritical = item.severity === 'CRITICAL';
                                    return (_jsxs("div", { onClick: () => {
                                            if (!item.isRead && onMarkAsRead)
                                                onMarkAsRead(item.id);
                                            if (item.actionUrl && onNavigate) {
                                                onNavigate(item.actionUrl);
                                                setIsOpen(false);
                                            }
                                        }, style: {
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderBottom: `1px solid ${colors.slate[100]}`,
                                            backgroundColor: !item.isRead
                                                ? isCritical
                                                    ? colors.status.danger.bg
                                                    : colors.primary[50]
                                                : '#ffffff',
                                            cursor: item.actionUrl ? 'pointer' : 'default',
                                            transition: 'background-color 80ms ease',
                                        }, children: [_jsx("div", { style: { flexShrink: 0, marginTop: '2px' }, children: getCategoryIcon(item.category, item.severity) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }, children: [_jsx("span", { style: {
                                                                    fontSize: typography.fontSize.xs.size,
                                                                    fontWeight: 700,
                                                                    color: isCritical ? colors.status.danger.fg : colors.slate[900],
                                                                }, children: item.title }), _jsx("span", { style: { fontSize: '10px', color: colors.slate[400], flexShrink: 0 }, children: item.timestamp })] }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600], lineHeight: '16px' }, children: item.message }), item.sourceTransactionId && (_jsxs("span", { style: { fontSize: '10px', fontFamily: typography.fontFamily.mono, color: colors.slate[400] }, children: ["Ref: ", item.sourceTransactionId] }))] })] }, item.id));
                                })) })] })] }))] }));
};
