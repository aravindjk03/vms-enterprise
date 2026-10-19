import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, AlertTriangle, XCircle, Info, Clock, Ban, MinusCircle, ShieldCheck, Timer } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const StatusBadge = ({ status, label, size = 'sm', icon = true, }) => {
    // Normalize domain statuses to semantic color tokens
    const normalizeStatus = (s) => {
        switch (s) {
            case 'ON_PREMISES':
            case 'approved':
            case 'COMPLETED':
                return 'success';
            case 'warning':
            case 'IN_PROGRESS':
                return 'warning';
            case 'danger':
            case 'rejected':
            case 'CANCELLED':
                return 'danger';
            case 'info':
            case 'CONFIRMED':
                return 'info';
            case 'pending':
                return 'pending';
            case 'blocked':
                return 'blocked';
            case 'expired':
                return 'expired';
            case 'draft':
            case 'CHECKED_OUT':
                return 'draft';
            case 'active':
                return 'active';
            case 'inactive':
            case 'NO_SHOW':
                return 'inactive';
            case 'overdue':
                return 'overdue';
            case 'neutral':
            default:
                return 'neutral';
        }
    };
    const semanticKey = normalizeStatus(status);
    const token = colors.status[semanticKey] || colors.status.neutral;
    // Icon mapping
    const renderIcon = () => {
        const iconSize = size === 'micro' ? 10 : size === 'sm' ? 12 : 14;
        switch (semanticKey) {
            case 'success':
            case 'approved':
                return _jsx(CheckCircle2, { size: iconSize });
            case 'warning':
            case 'pending':
                return _jsx(AlertTriangle, { size: iconSize });
            case 'danger':
            case 'rejected':
                return _jsx(XCircle, { size: iconSize });
            case 'blocked':
                return _jsx(Ban, { size: iconSize });
            case 'expired':
                return _jsx(Clock, { size: iconSize });
            case 'overdue':
                return _jsx(Timer, { size: iconSize });
            case 'active':
                return _jsx(ShieldCheck, { size: iconSize });
            case 'info':
                return _jsx(Info, { size: iconSize });
            case 'draft':
            case 'inactive':
            case 'neutral':
            default:
                return _jsx(MinusCircle, { size: iconSize });
        }
    };
    const displayText = label || status.replace(/_/g, ' ').toUpperCase();
    const sizeStyles = {
        micro: {
            padding: '1px 5px',
            fontSize: typography.fontSize.micro.size,
            height: '18px',
        },
        sm: {
            padding: '2px 7px',
            fontSize: '11px',
            height: '22px',
        },
        md: {
            padding: '3px 10px',
            fontSize: typography.fontSize.xs.size,
            height: '26px',
        },
    };
    return (_jsxs("span", { role: "status", "aria-label": `Status: ${displayText}`, style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            borderRadius: radius.sm,
            fontWeight: typography.fontWeight.semibold,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            backgroundColor: token.bg,
            color: token.fg,
            border: `1px solid ${token.border}`,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            ...sizeStyles[size],
        }, className: `vms-status-badge vms-status-${semanticKey}`, children: [icon && renderIcon(), _jsx("span", { children: displayText })] }));
};
