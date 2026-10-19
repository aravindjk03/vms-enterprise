import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X, Search } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Combobox = ({ label, options, value, onChange, placeholder = 'Select an option...', disabled = false, isRequired = false, error, helperText, style, }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const containerRef = useRef(null);
    const inputRef = useRef(null);
    const selectedOption = options.find((o) => o.value === value);
    const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.description && o.description.toLowerCase().includes(searchTerm.toLowerCase())));
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchTerm('');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    const handleKeyDown = (e) => {
        if (disabled)
            return;
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredOptions.length));
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % Math.max(1, filteredOptions.length));
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            const option = filteredOptions[highlightedIndex];
            if (option && !option.disabled) {
                onChange(option.value);
                setIsOpen(false);
                setSearchTerm('');
            }
        }
        else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchTerm('');
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', ...style }, ref: containerRef, children: [label && (_jsxs("label", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }, children: [label, " ", isRequired && _jsx("span", { style: { color: colors.status.danger.solid }, children: "*" })] })), _jsxs("div", { style: { position: 'relative' }, children: [_jsxs("button", { type: "button", disabled: disabled, onClick: () => {
                            if (!disabled) {
                                setIsOpen(!isOpen);
                                setTimeout(() => inputRef.current?.focus(), 50);
                            }
                        }, onKeyDown: handleKeyDown, "aria-haspopup": "listbox", "aria-expanded": isOpen, style: {
                            width: '100%',
                            height: '36px',
                            padding: '0 10px',
                            backgroundColor: disabled ? colors.slate[100] : '#ffffff',
                            border: `1px solid ${error ? colors.status.danger.solid : colors.slate[300]}`,
                            borderRadius: radius.md,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: typography.fontSize.sm.size,
                            color: selectedOption ? colors.slate[900] : colors.slate[400],
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            textAlign: 'left',
                        }, children: [_jsx("span", { style: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: selectedOption ? selectedOption.label : placeholder }), _jsx(ChevronDown, { size: 14, color: colors.slate[500] })] }), isOpen && (_jsxs("div", { style: {
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            marginTop: '4px',
                            backgroundColor: '#ffffff',
                            border: `1px solid ${colors.slate[200]}`,
                            borderRadius: radius.md,
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            zIndex: 1000,
                            maxHeight: '260px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                        }, children: [_jsxs("div", { style: { padding: '6px', borderBottom: `1px solid ${colors.slate[100]}`, display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(Search, { size: 14, color: colors.slate[400] }), _jsx("input", { ref: inputRef, type: "text", value: searchTerm, onChange: (e) => {
                                            setSearchTerm(e.target.value);
                                            setHighlightedIndex(0);
                                        }, onKeyDown: handleKeyDown, placeholder: "Search...", style: {
                                            width: '100%',
                                            border: 'none',
                                            outline: 'none',
                                            fontSize: typography.fontSize.xs.size,
                                            color: colors.slate[900],
                                        } }), searchTerm && (_jsx("button", { type: "button", onClick: () => setSearchTerm(''), style: { background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex' }, children: _jsx(X, { size: 12, color: colors.slate[400] }) }))] }), _jsx("div", { role: "listbox", style: { overflowY: 'auto', padding: '4px' }, children: filteredOptions.length === 0 ? (_jsx("div", { style: { padding: '8px 12px', fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: "No matching options" })) : (filteredOptions.map((opt, idx) => {
                                    const isSelected = opt.value === value;
                                    const isHighlighted = idx === highlightedIndex;
                                    return (_jsxs("div", { role: "option", "aria-selected": isSelected, onClick: () => {
                                            if (!opt.disabled) {
                                                onChange(opt.value);
                                                setIsOpen(false);
                                                setSearchTerm('');
                                            }
                                        }, onMouseEnter: () => setHighlightedIndex(idx), style: {
                                            padding: '6px 10px',
                                            borderRadius: radius.sm,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            backgroundColor: isHighlighted ? colors.primary[50] : 'transparent',
                                            cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                            opacity: opt.disabled ? 0.5 : 1,
                                        }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx("span", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900], fontWeight: isSelected ? 600 : 400 }, children: opt.label }), opt.description && (_jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: opt.description }))] }), isSelected && _jsx(Check, { size: 14, color: colors.primary[600] })] }, opt.value));
                                })) })] }))] }), error && _jsx("span", { style: { fontSize: '11px', color: colors.status.danger.solid }, children: error }), helperText && !error && _jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: helperText })] }));
};
