import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AlertOctagon, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Banner = ({ type = 'system', title, message, actionLabel, onAction, onDismiss, isPersistent = false, }) => {
    const isEmergency = type === 'emergency';
    return (_jsxs("aside", { "aria-label": isEmergency ? 'Emergency Alert Banner' : 'System Banner', style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isEmergency ? '10px 18px' : '8px 16px',
            backgroundColor: isEmergency ? colors.status.danger.solid : colors.slate[900],
            color: '#ffffff',
            borderBottom: isEmergency ? '2px solid #7f1d1d' : `1px solid ${colors.slate[800]}`,
            position: 'relative',
            zIndex: 50,
        }, className: `vms-banner vms-banner-${type}`, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [isEmergency ? (_jsx("span", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#ffffff',
                            color: colors.status.danger.solid,
                            padding: '4px',
                            borderRadius: radius.sm,
                        }, children: _jsx(AlertOctagon, { size: 18 }) })) : (_jsx(ShieldAlert, { size: 18, color: colors.primary[500] })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }, children: [_jsxs("strong", { style: { fontSize: typography.fontSize.sm.size, letterSpacing: '0.02em', textTransform: 'uppercase' }, children: [title, ":"] }), _jsx("span", { style: { fontSize: typography.fontSize.sm.size, opacity: 0.95 }, children: message })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [actionLabel && (_jsxs("button", { type: "button", onClick: onAction, style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '4px 10px',
                            backgroundColor: isEmergency ? '#ffffff' : colors.primary[600],
                            color: isEmergency ? colors.status.danger.solid : '#ffffff',
                            fontSize: typography.fontSize.xs.size,
                            fontWeight: typography.fontWeight.bold,
                            borderRadius: radius.sm,
                            border: 'none',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                        }, children: [_jsx("span", { children: actionLabel }), _jsx(ArrowRight, { size: 12 })] })), !isPersistent && onDismiss && (_jsx("button", { type: "button", "aria-label": "Dismiss banner", onClick: onDismiss, style: {
                            background: 'none',
                            border: 'none',
                            color: '#ffffff',
                            cursor: 'pointer',
                            padding: '4px',
                            opacity: 0.8,
                        }, children: _jsx(X, { size: 16 }) }))] })] }));
};
