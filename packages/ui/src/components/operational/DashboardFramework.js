import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { RefreshCw, Download, Filter } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';
export const DashboardFilterBar = ({ dateRange = 'TODAY', onDateRangeChange, selectedDomain = 'ALL', onDomainChange, selectedGate = 'ALL', onGateChange, onRefresh, onExport, isRefreshing = false, style, }) => {
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            flexWrap: 'wrap',
            gap: '10px',
            ...style,
        }, className: "vms-dashboard-filter-bar", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: colors.slate[500], fontWeight: 600 }, children: [_jsx(Filter, { size: 13 }), _jsx("span", { children: "FILTERS:" })] }), _jsxs("select", { value: dateRange, onChange: (e) => onDateRangeChange && onDateRangeChange(e.target.value), "aria-label": "Filter by Date Range", style: {
                            height: '32px',
                            padding: '0 8px',
                            fontSize: typography.fontSize.xs.size,
                            border: `1px solid ${colors.slate[300]}`,
                            borderRadius: radius.sm,
                            backgroundColor: '#ffffff',
                            color: colors.slate[800],
                            cursor: 'pointer',
                        }, children: [_jsx("option", { value: "TODAY", children: "Today (Current Shift)" }), _jsx("option", { value: "YESTERDAY", children: "Yesterday" }), _jsx("option", { value: "LAST_7_DAYS", children: "Last 7 Days" }), _jsx("option", { value: "MONTH_TO_DATE", children: "Month to Date (MTD)" }), _jsx("option", { value: "QUARTER", children: "This Quarter (Q3 2026)" })] }), _jsxs("select", { value: selectedDomain, onChange: (e) => onDomainChange && onDomainChange(e.target.value), "aria-label": "Filter by Operational Domain", style: {
                            height: '32px',
                            padding: '0 8px',
                            fontSize: typography.fontSize.xs.size,
                            border: `1px solid ${colors.slate[300]}`,
                            borderRadius: radius.sm,
                            backgroundColor: '#ffffff',
                            color: colors.slate[800],
                            cursor: 'pointer',
                        }, children: [_jsx("option", { value: "ALL", children: "All Domains (Roll-up)" }), _jsx("option", { value: "VISITORS", children: "Visitors & Guests" }), _jsx("option", { value: "CONTRACTORS", children: "Contractor Work Orders" }), _jsx("option", { value: "MATERIALS", children: "Material Logistics" }), _jsx("option", { value: "VEHICLES", children: "Commercial Fleet" }), _jsx("option", { value: "ESG", children: "ESG Mobility & Carbon" })] }), _jsxs("select", { value: selectedGate, onChange: (e) => onGateChange && onGateChange(e.target.value), "aria-label": "Filter by Gate Location", style: {
                            height: '32px',
                            padding: '0 8px',
                            fontSize: typography.fontSize.xs.size,
                            border: `1px solid ${colors.slate[300]}`,
                            borderRadius: radius.sm,
                            backgroundColor: '#ffffff',
                            color: colors.slate[800],
                            cursor: 'pointer',
                        }, children: [_jsx("option", { value: "ALL", children: "All Plant Gates" }), _jsx("option", { value: "GATE_1", children: "Gate 1 (North Main Passenger)" }), _jsx("option", { value: "GATE_2", children: "Gate 2 (Commercial Freight & Weighbridge)" }), _jsx("option", { value: "GATE_3", children: "Gate 3 (Contractor & Turnstiles)" })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [onRefresh && (_jsx(Button, { variant: "outline", size: "dense", leftIcon: _jsx(RefreshCw, { size: 12, style: { animation: isRefreshing ? 'spin 1s linear infinite' : 'none' } }), onClick: onRefresh, children: isRefreshing ? 'Refreshing...' : 'Refresh' })), onExport && (_jsx(Button, { variant: "secondary", size: "dense", leftIcon: _jsx(Download, { size: 12 }), onClick: onExport, children: "Export BI" }))] })] }));
};
export const DashboardWidget = ({ title, type, subtitle, badge, headerAction, children, spanCols = 1, style, }) => {
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            overflow: 'hidden',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            gridColumn: `span ${spanCols}`,
            ...style,
        }, className: `vms-dashboard-widget vms-widget-${type.toLowerCase()}`, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderBottom: `1px solid ${colors.slate[100]}`,
                    backgroundColor: '#ffffff',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: {
                                    fontSize: '9px',
                                    fontWeight: 800,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    padding: '1px 5px',
                                    borderRadius: '2px',
                                    backgroundColor: colors.slate[100],
                                    color: colors.slate[600],
                                }, children: type }), _jsxs("div", { children: [_jsx("h4", { style: { margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: title }), subtitle && (_jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: subtitle }))] }), badge] }), headerAction && _jsx("div", { children: headerAction })] }), _jsx("div", { style: { padding: '14px', flex: 1 }, children: children })] }));
};
export const DashboardGrid = ({ columns = 3, gap = '16px', children, style }) => {
    return (_jsx("div", { style: {
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fit, minmax(280px, 1fr))`,
            gap,
            width: '100%',
            ...style,
        }, className: "vms-dashboard-grid", children: children }));
};
