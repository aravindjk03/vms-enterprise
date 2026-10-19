import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colors, radius, typography } from '../../tokens.js';
export const Tabs = ({ tabs, activeTab, onChange, variant = 'underline', }) => {
    return (_jsx("div", { role: "tablist", style: {
            display: 'flex',
            alignItems: 'center',
            gap: variant === 'pills' ? '6px' : '20px',
            borderBottom: variant === 'underline' ? `1px solid ${colors.slate[200]}` : 'none',
            paddingBottom: variant === 'underline' ? 0 : '4px',
            overflowX: 'auto',
        }, className: `vms-tabs vms-tabs-${variant}`, children: tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            if (variant === 'pills') {
                return (_jsxs("button", { role: "tab", "aria-selected": isActive, disabled: tab.disabled, onClick: () => onChange(tab.id), style: {
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        borderRadius: radius.md,
                        border: 'none',
                        backgroundColor: isActive ? colors.primary[600] : colors.slate[100],
                        color: isActive ? '#ffffff' : colors.slate[700],
                        fontSize: typography.fontSize.sm.size,
                        fontWeight: typography.fontWeight.semibold,
                        cursor: tab.disabled ? 'not-allowed' : 'pointer',
                        opacity: tab.disabled ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                        transition: 'all 120ms ease',
                    }, children: [tab.icon, _jsx("span", { children: tab.label }), tab.badge !== undefined && (_jsx("span", { style: {
                                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : colors.slate[300],
                                color: isActive ? '#ffffff' : colors.slate[800],
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: radius.full,
                            }, children: tab.badge }))] }, tab.id));
            }
            return (_jsxs("button", { role: "tab", "aria-selected": isActive, disabled: tab.disabled, onClick: () => onChange(tab.id), style: {
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 4px',
                    border: 'none',
                    borderBottom: `2px solid ${isActive ? colors.primary[600] : 'transparent'}`,
                    backgroundColor: 'transparent',
                    color: isActive ? colors.primary[700] : colors.slate[600],
                    fontSize: typography.fontSize.sm.size,
                    fontWeight: isActive ? typography.fontWeight.bold : typography.fontWeight.medium,
                    cursor: tab.disabled ? 'not-allowed' : 'pointer',
                    opacity: tab.disabled ? 0.5 : 1,
                    whiteSpace: 'nowrap',
                    transition: 'all 120ms ease',
                    marginBottom: '-1px',
                }, children: [tab.icon, _jsx("span", { children: tab.label }), tab.badge !== undefined && (_jsx("span", { style: {
                            backgroundColor: isActive ? colors.primary[100] : colors.slate[100],
                            color: isActive ? colors.primary[700] : colors.slate[600],
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: radius.full,
                        }, children: tab.badge }))] }, tab.id));
        }) }));
};
