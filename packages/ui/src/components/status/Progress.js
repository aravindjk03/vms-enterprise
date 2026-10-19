import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colors, radius, typography } from '../../tokens.js';
export const Progress = ({ value, max = 100, label, showPercent = true, color = colors.primary[600], height = 8, }) => {
    const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }, children: [(label || showPercent) && (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' }, children: [label && (_jsx("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 500, color: colors.slate[700] }, children: label })), showPercent && (_jsxs("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[600] }, children: [percentage, "%"] }))] })), _jsx("div", { role: "progressbar", "aria-valuenow": value, "aria-valuemin": 0, "aria-valuemax": max, "aria-label": label || 'Progress', style: {
                    width: '100%',
                    height: `${height}px`,
                    backgroundColor: colors.slate[200],
                    borderRadius: radius.full,
                    overflow: 'hidden',
                }, children: _jsx("div", { style: {
                        width: `${percentage}%`,
                        height: '100%',
                        backgroundColor: color,
                        borderRadius: radius.full,
                        transition: 'width 250ms ease-in-out',
                    } }) })] }));
};
