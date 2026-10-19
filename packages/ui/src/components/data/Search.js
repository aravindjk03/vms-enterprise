import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Search as SearchIcon, X, Loader2 } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Search = ({ value = '', onChange, placeholder = 'Search by name, ID, vehicle plate, challan...', debounceMs = 0, isLoading = false, onClear, width = '100%', autoFocus = false, style, }) => {
    const [internalValue, setInternalValue] = useState(value);
    useEffect(() => {
        setInternalValue(value);
    }, [value]);
    useEffect(() => {
        if (debounceMs <= 0)
            return;
        const handler = setTimeout(() => {
            if (internalValue !== value) {
                onChange(internalValue);
            }
        }, debounceMs);
        return () => clearTimeout(handler);
    }, [internalValue, debounceMs, onChange, value]);
    const handleChange = (e) => {
        const val = e.target.value;
        setInternalValue(val);
        if (debounceMs <= 0) {
            onChange(val);
        }
    };
    const handleClear = () => {
        setInternalValue('');
        onChange('');
        if (onClear)
            onClear();
    };
    return (_jsxs("div", { style: {
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            width,
            ...style,
        }, className: "vms-search-input", children: [_jsx("div", { style: {
                    position: 'absolute',
                    left: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                    color: colors.slate[400],
                }, children: isLoading ? (_jsx(Loader2, { size: 14, style: { animation: 'spin 1s linear infinite' } })) : (_jsx(SearchIcon, { size: 14 })) }), _jsx("input", { type: "text", value: internalValue, onChange: handleChange, placeholder: placeholder, autoFocus: autoFocus, style: {
                    width: '100%',
                    height: '34px',
                    padding: '0 32px',
                    backgroundColor: '#ffffff',
                    border: `1px solid ${colors.slate[300]}`,
                    borderRadius: radius.md,
                    fontSize: typography.fontSize.xs.size,
                    color: colors.slate[900],
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: typography.fontFamily.sans,
                } }), internalValue && (_jsx("button", { type: "button", onClick: handleClear, "aria-label": "Clear search", style: {
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    padding: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    color: colors.slate[400],
                }, children: _jsx(X, { size: 13 }) }))] }));
};
