import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Select = React.forwardRef(({ label, helperText, error, isRequired, options, dense = false, id, disabled, style, className = '', ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;
    const hasError = Boolean(error);
    const height = dense ? '32px' : '38px';
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }, children: [label && (_jsxs("label", { htmlFor: selectId, style: {
                    fontSize: typography.fontSize.sm.size,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.slate[700],
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                }, children: [label, isRequired && _jsx("span", { style: { color: colors.status.danger.solid }, "aria-hidden": "true", children: "*" })] })), _jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    position: 'relative',
                    backgroundColor: disabled ? colors.slate[100] : '#ffffff',
                    border: `1px solid ${hasError ? colors.status.danger.solid : colors.slate[300]}`,
                    borderRadius: radius.md,
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    height,
                    padding: '0 10px',
                }, children: [_jsx("select", { ref: ref, id: selectId, disabled: disabled, "aria-invalid": hasError, "aria-describedby": hasError ? errorId : helperText ? helperId : undefined, style: {
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            color: colors.slate[900],
                            fontSize: typography.fontSize.base.size,
                            fontFamily: typography.fontFamily.sans,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            appearance: 'none',
                            paddingRight: '20px',
                            ...style,
                        }, className: `vms-select ${className}`, ...props, children: options.map((opt) => (_jsx("option", { value: opt.value, disabled: opt.disabled, children: opt.label }, opt.value))) }), _jsx("span", { style: {
                            position: 'absolute',
                            right: '10px',
                            pointerEvents: 'none',
                            color: colors.slate[500],
                            display: 'flex',
                            alignItems: 'center',
                        }, children: _jsx(ChevronDown, { size: 14 }) })] }), hasError ? (_jsxs("span", { id: errorId, style: {
                    fontSize: typography.fontSize.xs.size,
                    color: colors.status.danger.solid,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '2px',
                }, children: [_jsx(AlertCircle, { size: 12 }), error] })) : helperText ? (_jsx("span", { id: helperId, style: {
                    fontSize: typography.fontSize.xs.size,
                    color: colors.slate[500],
                    marginTop: '2px',
                }, children: helperText })) : null] }));
});
Select.displayName = 'Select';
