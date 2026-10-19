import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colors, typography } from '../../tokens.js';
export const RadioGroup = ({ name, label, options, value, onChange, orientation = 'vertical', disabled = false, isRequired = false, error, helperText, style, }) => {
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '6px', ...style }, role: "radiogroup", "aria-labelledby": `${name}-label`, children: [label && (_jsxs("span", { id: `${name}-label`, style: { fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }, children: [label, " ", isRequired && _jsx("span", { style: { color: colors.status.danger.solid }, children: "*" })] })), _jsx("div", { style: {
                    display: 'flex',
                    flexDirection: orientation === 'horizontal' ? 'row' : 'column',
                    gap: orientation === 'horizontal' ? '16px' : '8px',
                    flexWrap: 'wrap',
                }, children: options.map((opt) => {
                    const isSelected = value === opt.value;
                    const isDisabled = disabled || opt.disabled;
                    return (_jsxs("label", { style: {
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            cursor: isDisabled ? 'not-allowed' : 'pointer',
                            opacity: isDisabled ? 0.6 : 1,
                        }, children: [_jsx("input", { type: "radio", name: name, value: opt.value, checked: isSelected, disabled: isDisabled, onChange: () => onChange(opt.value), style: {
                                    margin: '3px 0 0 0',
                                    accentColor: colors.primary[600],
                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                } }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("span", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900], fontWeight: isSelected ? 600 : 400 }, children: opt.label }), opt.description && (_jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: opt.description }))] })] }, opt.value));
                }) }), error && _jsx("span", { style: { fontSize: '11px', color: colors.status.danger.solid }, children: error }), helperText && !error && _jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: helperText })] }));
};
