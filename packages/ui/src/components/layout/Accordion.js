import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Accordion = ({ items, allowMultiple = false, style, }) => {
    const [expandedIds, setExpandedIds] = useState(() => items.filter((item) => item.defaultExpanded).map((item) => item.id));
    const toggleItem = (id) => {
        if (allowMultiple) {
            setExpandedIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]);
        }
        else {
            setExpandedIds((prev) => (prev.includes(id) ? [] : [id]));
        }
    };
    return (_jsx("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            ...style,
        }, className: "vms-accordion", children: items.map((item, idx) => {
            const isExpanded = expandedIds.includes(item.id);
            const isNotLast = idx < items.length - 1;
            return (_jsxs("div", { style: {
                    borderBottom: isNotLast ? `1px solid ${colors.slate[200]}` : 'none',
                }, children: [_jsxs("button", { type: "button", onClick: () => toggleItem(item.id), "aria-expanded": isExpanded, style: {
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            backgroundColor: isExpanded ? colors.slate[50] : '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'background-color 80ms ease',
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { color: colors.slate[500], display: 'flex' }, children: isExpanded ? _jsx(ChevronDown, { size: 16 }) : _jsx(ChevronRight, { size: 16 }) }), _jsxs("div", { children: [_jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: item.title }), item.subtitle && (_jsx("span", { style: { display: 'block', fontSize: '11px', color: colors.slate[500] }, children: item.subtitle }))] })] }), item.badge && _jsx("div", { children: item.badge })] }), isExpanded && (_jsx("div", { style: {
                            padding: '14px',
                            backgroundColor: '#ffffff',
                            borderTop: `1px solid ${colors.slate[100]}`,
                        }, children: item.content }))] }, item.id));
        }) }));
};
