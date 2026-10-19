import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Loader2 } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Button = React.forwardRef(({ children, variant = 'primary', size = 'normal', isLoading = false, leftIcon, rightIcon, shortcut, disabled, style, className = '', ...props }, ref) => {
    const isDisabled = disabled || isLoading;
    // Base sizing
    let height = '38px';
    let padding = '0 16px';
    let fontSize = typography.fontSize.base.size;
    if (size === 'dense') {
        height = '32px';
        padding = '0 12px';
        fontSize = typography.fontSize.sm.size;
    }
    else if (size === 'large') {
        height = '48px';
        padding = '0 24px';
        fontSize = typography.fontSize.lg.size;
    }
    // Variant styling
    const variantStyles = {
        primary: {
            backgroundColor: colors.primary[600],
            color: '#ffffff',
            border: '1px solid transparent',
        },
        secondary: {
            backgroundColor: colors.slate[100],
            color: colors.slate[800],
            border: `1px solid ${colors.slate[300]}`,
        },
        danger: {
            backgroundColor: colors.status.danger.solid,
            color: '#ffffff',
            border: '1px solid transparent',
        },
        esg: {
            backgroundColor: colors.esg[600],
            color: '#ffffff',
            border: '1px solid transparent',
        },
        outline: {
            backgroundColor: 'transparent',
            color: colors.primary[700],
            border: `1px solid ${colors.primary[600]}`,
        },
        ghost: {
            backgroundColor: 'transparent',
            color: colors.slate[700],
            border: '1px solid transparent',
        },
    };
    const currentVariant = variantStyles[variant] || variantStyles.primary;
    const baseStyle = {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        height,
        padding,
        fontSize,
        fontFamily: typography.fontFamily.sans,
        fontWeight: typography.fontWeight.semibold,
        borderRadius: radius.md,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
        transition: 'all 120ms ease-in-out',
        outline: 'none',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        ...currentVariant,
        ...style,
    };
    return (_jsxs("button", { ref: ref, disabled: isDisabled, style: baseStyle, className: `vms-button vms-button-${variant} vms-button-${size} ${className}`, ...props, children: [isLoading ? (_jsx(Loader2, { size: 16, className: "vms-spin", style: { animation: 'spin 1s linear infinite' } })) : (leftIcon), _jsx("span", { children: children }), rightIcon, shortcut && (_jsx("kbd", { style: {
                    marginLeft: '4px',
                    padding: '2px 5px',
                    fontSize: '10px',
                    fontFamily: typography.fontFamily.mono,
                    borderRadius: radius.sm,
                    backgroundColor: 'rgba(0, 0, 0, 0.15)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                }, children: shortcut }))] }));
});
Button.displayName = 'Button';
