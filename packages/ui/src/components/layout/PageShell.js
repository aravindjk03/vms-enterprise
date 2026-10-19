import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { colors, radius, typography } from '../../tokens.js';
export const PageShell = ({ breadcrumbs = [], title, description, badge, actions, filters, children, rightPanel, isRightPanelOpen = false, style, }) => {
    return (_jsxs("div", { style: { display: 'flex', width: '100%', gap: '16px', position: 'relative', ...style }, className: "vms-page-shell", children: [_jsxs("div", { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '16px' }, children: [breadcrumbs.length > 0 && (_jsx("nav", { "aria-label": "Breadcrumb", style: { marginBottom: '-6px' }, children: _jsx("ol", { style: { display: 'flex', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0, gap: '6px', fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: breadcrumbs.map((crumb, idx) => {
                                const isLast = idx === breadcrumbs.length - 1;
                                const label = typeof crumb === 'string' ? crumb : crumb.label;
                                const onClick = typeof crumb === 'object' ? crumb.onClick : undefined;
                                return (_jsxs(React.Fragment, { children: [idx > 0 && _jsx("li", { style: { color: colors.slate[400] }, children: "/" }), _jsx("li", { style: { color: isLast ? colors.slate[900] : colors.slate[500], fontWeight: isLast ? 600 : 400 }, children: onClick ? (_jsx("button", { type: "button", onClick: onClick, style: { background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }, children: label })) : (_jsx("span", { children: label })) })] }, idx));
                            }) }) })), _jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("h1", { style: { margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900], letterSpacing: '-0.01em' }, children: title }), badge] }), description && (_jsx("p", { style: { margin: 0, fontSize: typography.fontSize.xs.size, color: colors.slate[600], maxWidth: '680px' }, children: description }))] }), actions && (_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: actions }))] }), filters && (_jsx("div", { style: { width: '100%' }, children: filters })), _jsx("div", { style: { width: '100%' }, children: children })] }), rightPanel && isRightPanelOpen && (_jsx("aside", { style: {
                    width: '320px',
                    flexShrink: 0,
                    backgroundColor: '#ffffff',
                    borderLeft: `1px solid ${colors.slate[200]}`,
                    borderRadius: radius.md,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }, className: "vms-page-right-panel", children: rightPanel }))] }));
};
