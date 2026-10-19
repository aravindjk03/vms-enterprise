import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Panel = ({ title, subtitle, onClose, children, footer, width = '320px', style, }) => {
    return (_jsxs("div", { style: {
            width,
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            ...style,
        }, className: "vms-contextual-panel", children: [(title || onClose) && (_jsxs("div", { style: {
                    padding: '12px 14px',
                    borderBottom: `1px solid ${colors.slate[200]}`,
                    backgroundColor: colors.slate[50],
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsxs("div", { children: [title && (_jsx("h4", { style: { margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: title })), subtitle && (_jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: subtitle }))] }), onClose && (_jsx("button", { type: "button", onClick: onClose, "aria-label": "Close panel", style: {
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: colors.slate[500],
                            padding: '4px',
                            display: 'flex',
                            borderRadius: radius.sm,
                        }, children: _jsx(X, { size: 14 }) }))] })), _jsx("div", { style: { padding: '14px', flex: 1, overflowY: 'auto' }, children: children }), footer && (_jsx("div", { style: {
                    padding: '10px 14px',
                    borderTop: `1px solid ${colors.slate[200]}`,
                    backgroundColor: colors.slate[50],
                }, children: footer }))] }));
};
