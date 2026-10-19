import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { colors, radius, typography } from '../../tokens.js';
export const ActivityFeed = ({ items, title = 'Live Facility Activity Feed', maxItems, onItemClick, style, }) => {
    const displayItems = maxItems ? items.slice(0, maxItems) : items;
    const getSeverityColor = (sev) => {
        switch (sev) {
            case 'CRITICAL':
                return colors.status.danger.solid;
            case 'WARN':
                return colors.status.warning.solid;
            default:
                return colors.slate[400];
        }
    };
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            overflow: 'hidden',
            ...style,
        }, className: "vms-activity-feed", children: [title && (_jsxs("div", { style: {
                    padding: '10px 14px',
                    backgroundColor: colors.slate[50],
                    borderBottom: `1px solid ${colors.slate[200]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsx("strong", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[800], textTransform: 'uppercase', letterSpacing: '0.04em' }, children: title }), _jsxs("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: [items.length, " Events"] })] })), _jsx("div", { style: { display: 'flex', flexDirection: 'column', maxHeight: '420px', overflowY: 'auto' }, children: displayItems.length === 0 ? (_jsx("div", { style: { padding: '24px', textAlign: 'center', color: colors.slate[500], fontSize: typography.fontSize.xs.size }, children: "No recent facility events recorded." })) : (displayItems.map((item, idx) => {
                    const isLast = idx === displayItems.length - 1;
                    return (_jsxs("div", { onClick: () => onItemClick && onItemClick(item), style: {
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            padding: '10px 14px',
                            borderBottom: isLast ? 'none' : `1px solid ${colors.slate[100]}`,
                            cursor: onItemClick ? 'pointer' : 'default',
                            transition: 'background-color 80ms ease',
                        }, children: [_jsx("div", { style: {
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: radius.full,
                                    backgroundColor: getSeverityColor(item.severity),
                                    marginTop: '5px',
                                    flexShrink: 0,
                                } }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx("span", { style: {
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            padding: '1px 5px',
                                                            borderRadius: '2px',
                                                            backgroundColor: colors.slate[100],
                                                            color: colors.slate[700],
                                                        }, children: item.entityType }), _jsx("strong", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[900] }, children: item.action })] }), _jsx("span", { style: { fontSize: '10px', color: colors.slate[400], fontFamily: typography.fontFamily.mono }, children: item.timestamp })] }), item.details && (_jsx("span", { style: { fontSize: '11px', color: colors.slate[600] }, children: item.details })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: colors.slate[500], marginTop: '2px' }, children: [_jsxs("span", { children: ["By: ", _jsx("strong", { children: item.actor })] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { style: { fontFamily: typography.fontFamily.mono }, children: ["Ref: ", item.entityId] })] })] })] }, item.id));
                })) })] }));
};
