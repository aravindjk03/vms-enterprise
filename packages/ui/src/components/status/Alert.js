import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Alert = ({ severity = 'info', title, children, onClose, action, }) => {
    const getStyles = () => {
        switch (severity) {
            case 'critical':
                return {
                    bg: colors.status.danger.bg,
                    border: colors.status.danger.solid,
                    text: colors.status.danger.fg,
                    icon: _jsx(AlertCircle, { size: 18, color: colors.status.danger.solid }),
                };
            case 'high':
            case 'warning':
                return {
                    bg: colors.status.warning.bg,
                    border: colors.status.warning.border,
                    text: colors.status.warning.fg,
                    icon: _jsx(AlertTriangle, { size: 18, color: colors.status.warning.solid }),
                };
            case 'success':
                return {
                    bg: colors.status.success.bg,
                    border: colors.status.success.border,
                    text: colors.status.success.fg,
                    icon: _jsx(CheckCircle2, { size: 18, color: colors.status.success.solid }),
                };
            case 'info':
            default:
                return {
                    bg: colors.status.info.bg,
                    border: colors.status.info.border,
                    text: colors.status.info.fg,
                    icon: _jsx(Info, { size: 18, color: colors.status.info.solid }),
                };
        }
    };
    const current = getStyles();
    return (_jsxs("div", { role: "alert", style: {
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px 14px',
            backgroundColor: current.bg,
            border: `1px solid ${current.border}`,
            borderRadius: radius.md,
            color: current.text,
        }, className: `vms-alert vms-alert-${severity}`, children: [_jsx("div", { style: { flexShrink: 0, marginTop: '1px' }, children: current.icon }), _jsxs("div", { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }, children: [title && (_jsx("span", { style: { fontSize: typography.fontSize.sm.size, fontWeight: typography.fontWeight.bold }, children: title })), _jsx("div", { style: { fontSize: typography.fontSize.sm.size, lineHeight: '18px' }, children: children }), action && _jsx("div", { style: { marginTop: '8px' }, children: action })] }), onClose && (_jsx("button", { type: "button", "aria-label": "Dismiss alert", onClick: onClose, style: {
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: current.text,
                    padding: '2px',
                    opacity: 0.8,
                }, children: _jsx(X, { size: 16 }) }))] }));
};
