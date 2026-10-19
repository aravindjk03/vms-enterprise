import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId } from 'react';
import { Check } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Checkbox = React.forwardRef(({ label, helperText, id, checked, disabled, onChange, className = '', ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    return (_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', gap: '8px' }, children: [_jsxs("div", { style: { position: 'relative', display: 'flex', alignItems: 'center', marginTop: '2px' }, children: [_jsx("input", { ref: ref, type: "checkbox", id: checkboxId, checked: checked, disabled: disabled, onChange: onChange, style: {
                            appearance: 'none',
                            width: '16px',
                            height: '16px',
                            borderRadius: radius.sm,
                            border: `1.5px solid ${checked ? colors.primary[600] : colors.slate[400]}`,
                            backgroundColor: checked ? colors.primary[600] : '#ffffff',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            margin: 0,
                            outline: 'none',
                            transition: 'all 120ms ease',
                        }, className: `vms-checkbox ${className}`, ...props }), checked && (_jsx(Check, { size: 12, color: "#ffffff", style: {
                            position: 'absolute',
                            top: '2px',
                            left: '2px',
                            pointerEvents: 'none',
                        } }))] }), (label || helperText) && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [label && (_jsx("label", { htmlFor: checkboxId, style: {
                            fontSize: typography.fontSize.sm.size,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.slate[800],
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            userSelect: 'none',
                        }, children: label })), helperText && (_jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: helperText }))] }))] }));
});
Checkbox.displayName = 'Checkbox';
