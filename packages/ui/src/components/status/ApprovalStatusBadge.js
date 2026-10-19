import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const ApprovalStatusBadge = ({ stageName, approverRole, approverName, status, slaTimeRemaining, }) => {
    const getStyle = () => {
        switch (status) {
            case 'APPROVED':
                return {
                    bg: colors.status.success.bg,
                    border: colors.status.success.border,
                    fg: colors.status.success.fg,
                    icon: _jsx(CheckCircle2, { size: 13 }),
                };
            case 'REJECTED':
                return {
                    bg: colors.status.danger.bg,
                    border: colors.status.danger.border,
                    fg: colors.status.danger.fg,
                    icon: _jsx(XCircle, { size: 13 }),
                };
            case 'ESCALATED':
                return {
                    bg: colors.status.overdue.bg,
                    border: colors.status.overdue.border,
                    fg: colors.status.overdue.fg,
                    icon: _jsx(AlertCircle, { size: 13 }),
                };
            case 'PENDING':
            default:
                return {
                    bg: colors.status.warning.bg,
                    border: colors.status.warning.border,
                    fg: colors.status.warning.fg,
                    icon: _jsx(Clock, { size: 13 }),
                };
        }
    };
    const style = getStyle();
    return (_jsxs("div", { style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 8px',
            borderRadius: radius.md,
            backgroundColor: style.bg,
            border: `1px solid ${style.border}`,
            color: style.fg,
        }, className: `vms-approval-badge vms-approval-${status.toLowerCase()}`, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [style.icon, _jsxs("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 700, textTransform: 'uppercase' }, children: [stageName, ":"] })] }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 500 }, children: approverName || approverRole || status }), slaTimeRemaining && status === 'PENDING' && (_jsxs("span", { style: {
                    fontSize: '10px',
                    backgroundColor: '#ffffff',
                    padding: '1px 4px',
                    borderRadius: radius.sm,
                    fontWeight: 600,
                    border: `1px solid ${style.border}`,
                }, children: [slaTimeRemaining, " SLA"] }))] }));
};
