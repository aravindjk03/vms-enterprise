import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Clock, User, QrCode } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';
export const VisitorCard = ({ transactionId, visitorName, company, purpose, hostName, scheduledTime, status, gatePassId, onPrintBadge, onClick, }) => {
    return (_jsxs("div", { onClick: onClick, style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            gap: '8px',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'all 100ms ease',
        }, className: "vms-visitor-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }, children: [_jsx("span", { style: { fontSize: typography.fontSize.xs.size, fontFamily: typography.fontFamily.mono, color: colors.slate[500] }, children: transactionId }), _jsx(StatusBadge, { status: status, size: "micro" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("strong", { style: { fontSize: typography.fontSize.base.size, color: colors.slate[900] }, children: visitorName }), company && (_jsx("div", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: company }))] }), onPrintBadge && (_jsx("button", { type: "button", title: "Print Pass / Badge", onClick: (e) => {
                            e.stopPropagation();
                            onPrintBadge();
                        }, style: {
                            padding: '6px',
                            borderRadius: radius.sm,
                            border: `1px solid ${colors.slate[200]}`,
                            backgroundColor: colors.slate[50],
                            cursor: 'pointer',
                            display: 'flex',
                        }, children: _jsx(QrCode, { size: 16, color: colors.primary[600] }) }))] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px',
                    paddingTop: '6px',
                    borderTop: `1px solid ${colors.slate[100]}`,
                    fontSize: '11px',
                    color: colors.slate[600],
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(User, { size: 11, color: colors.slate[400] }), _jsxs("span", { children: ["Host: ", _jsx("strong", { children: hostName })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(Clock, { size: 11, color: colors.slate[400] }), _jsx("span", { children: scheduledTime })] })] })] }));
};
