import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useId } from 'react';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const DatePicker = React.forwardRef(({ label, helperText, error, isRequired, withTime = false, id, disabled, style, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const helperId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }, children: [label && (_jsxs("label", { htmlFor: inputId, style: {
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
                    height: '38px',
                    padding: '0 10px',
                    gap: '8px',
                }, children: [_jsx("span", { style: { color: colors.slate[400], display: 'flex', alignItems: 'center' }, children: _jsx(CalendarIcon, { size: 16 }) }), _jsx("input", { ref: ref, type: withTime ? 'datetime-local' : 'date', id: inputId, disabled: disabled, "aria-invalid": hasError, "aria-describedby": hasError ? errorId : helperText ? helperId : undefined, style: {
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            outline: 'none',
                            backgroundColor: 'transparent',
                            color: colors.slate[900],
                            fontSize: typography.fontSize.base.size,
                            fontFamily: typography.fontFamily.sans,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            ...style,
                        }, className: `vms-datepicker ${className}`, ...props })] }), hasError ? (_jsxs("span", { id: errorId, style: {
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
DatePicker.displayName = 'DatePicker';
