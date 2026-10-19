import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Calendar, AlertTriangle, XCircle, CheckCircle2, Clock } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const ExpiryIndicator = ({ documentName, status, expiryDate, daysRemaining, }) => {
    const getVisuals = () => {
        switch (status) {
            case 'VALID':
                return {
                    bg: colors.status.success.bg,
                    border: colors.status.success.border,
                    color: colors.status.success.fg,
                    icon: _jsx(CheckCircle2, { size: 14 }),
                    statusLabel: 'VALID UNTIL',
                };
            case 'EXPIRING_SOON':
                return {
                    bg: colors.status.warning.bg,
                    border: colors.status.warning.border,
                    color: colors.status.warning.fg,
                    icon: _jsx(AlertTriangle, { size: 14 }),
                    statusLabel: 'EXPIRING SOON',
                };
            case 'EXPIRED':
                return {
                    bg: colors.status.danger.bg,
                    border: colors.status.danger.solid,
                    color: colors.status.danger.fg,
                    icon: _jsx(XCircle, { size: 14 }),
                    statusLabel: 'EXPIRED',
                };
            case 'PENDING_VERIFICATION':
                return {
                    bg: colors.status.pending.bg,
                    border: colors.status.pending.border,
                    color: colors.status.pending.fg,
                    icon: _jsx(Clock, { size: 14 }),
                    statusLabel: 'PENDING VERIFICATION',
                };
            case 'REJECTED':
                return {
                    bg: colors.status.danger.bg,
                    border: colors.status.danger.border,
                    color: colors.status.danger.fg,
                    icon: _jsx(XCircle, { size: 14 }),
                    statusLabel: 'REJECTED',
                };
            case 'MISSING':
            default:
                return {
                    bg: colors.status.neutral.bg,
                    border: colors.status.neutral.border,
                    color: colors.status.neutral.fg,
                    icon: _jsx(AlertTriangle, { size: 14 }),
                    statusLabel: 'MISSING MANDATORY DOC',
                };
        }
    };
    const visuals = getVisuals();
    return (_jsxs("div", { style: {
            display: 'inline-flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '6px 10px',
            borderRadius: radius.md,
            backgroundColor: visuals.bg,
            border: `1px solid ${visuals.border}`,
            color: visuals.color,
        }, className: `vms-expiry-indicator vms-expiry-${status.toLowerCase()}`, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }, children: [_jsx("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: typography.fontWeight.semibold, color: colors.slate[800] }, children: documentName }), _jsxs("span", { style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            fontWeight: typography.fontWeight.bold,
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                        }, children: [visuals.icon, visuals.statusLabel] })] }), expiryDate && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: typography.fontFamily.mono }, children: [_jsx(Calendar, { size: 12, opacity: 0.7 }), _jsx("span", { children: expiryDate }), typeof daysRemaining === 'number' && (_jsxs("span", { style: { fontWeight: 600, opacity: 0.85 }, children: ["(", daysRemaining > 0 ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d overdue`, ")"] }))] }))] }));
};
