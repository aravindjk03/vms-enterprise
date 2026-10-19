import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useId } from 'react';
import { colors, radius, typography } from '../../tokens.js';
export const Switch = ({ id, checked, onChange, label, description, disabled = false, }) => {
    const generatedId = useId();
    const switchId = id || generatedId;
    return (_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }, children: [(label || description) && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [label && (_jsx("label", { htmlFor: switchId, style: {
                            fontSize: typography.fontSize.sm.size,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.slate[800],
                            cursor: disabled ? 'not-allowed' : 'pointer',
                        }, children: label })), description && (_jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: description }))] })), _jsx("button", { type: "button", role: "switch", id: switchId, "aria-checked": checked, disabled: disabled, onClick: () => !disabled && onChange(!checked), style: {
                    width: '36px',
                    height: '20px',
                    borderRadius: radius.full,
                    backgroundColor: checked ? colors.primary[600] : colors.slate[300],
                    border: 'none',
                    padding: '2px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    position: 'relative',
                    transition: 'background-color 150ms ease',
                    outline: 'none',
                    flexShrink: 0,
                }, children: _jsx("span", { style: {
                        display: 'block',
                        width: '16px',
                        height: '16px',
                        borderRadius: radius.full,
                        backgroundColor: '#ffffff',
                        transform: checked ? 'translateX(16px)' : 'translateX(0)',
                        transition: 'transform 150ms ease',
                        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
                    } }) })] }));
};
