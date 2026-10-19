import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowDownRight, ArrowUpRight, Scale } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';
export const MaterialCard = ({ challanNumber, movementType, classification, transporter, grossWeightKg, tareWeightKg, netWeightKg, status, poReference, }) => {
    const isInward = movementType === 'INWARD';
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            gap: '8px',
        }, className: "vms-material-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [isInward ? (_jsx(ArrowDownRight, { size: 16, color: colors.status.success.solid })) : (_jsx(ArrowUpRight, { size: 16, color: colors.primary[600] })), _jsxs("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 700, color: isInward ? colors.status.success.solid : colors.primary[700] }, children: [movementType, " \u2022 ", classification] })] }), _jsx(StatusBadge, { status: status, size: "micro" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("strong", { style: { fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: challanNumber }), poReference && (_jsxs("div", { style: { fontSize: '11px', color: colors.slate[500] }, children: ["PO: ", poReference] }))] }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: transporter })] }), (grossWeightKg !== undefined || netWeightKg !== undefined) && (_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    paddingTop: '6px',
                    borderTop: `1px solid ${colors.slate[100]}`,
                    fontSize: '11px',
                    color: colors.slate[600],
                }, children: [_jsx(Scale, { size: 12, color: colors.slate[400] }), netWeightKg !== undefined ? (_jsxs("span", { children: ["Net: ", _jsxs("strong", { children: [netWeightKg.toLocaleString(), " kg"] })] })) : null, grossWeightKg !== undefined ? (_jsxs("span", { children: ["Gross: ", grossWeightKg.toLocaleString(), " kg"] })) : null] }))] }));
};
