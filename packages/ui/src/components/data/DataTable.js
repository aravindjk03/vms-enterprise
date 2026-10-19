import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ArrowUpDown, ArrowUp, ArrowDown, Inbox, AlertTriangle } from 'lucide-react';
import { colors, typography } from '../../tokens.js';
import { Checkbox } from '../foundation/Checkbox.js';
export function DataTable({ data, columns, keyExtractor, isLoading = false, isError = false, errorMessage, onRetry, emptyTitle = 'No records found', emptyDescription = 'There are no items matching the current view criteria.', density = 'normal', sortColumn, sortDirection = 'asc', onSort, selectedIds = [], onSelectIds, onRowClick, bulkActions, }) {
    const isDense = density === 'dense';
    const rowHeight = isDense ? '34px' : '44px';
    const cellPadding = isDense ? '4px 10px' : '8px 14px';
    const fontSize = isDense ? typography.fontSize.xs.size : typography.fontSize.sm.size;
    const allSelected = data.length > 0 && data.every((item) => selectedIds.includes(keyExtractor(item)));
    const someSelected = data.some((item) => selectedIds.includes(keyExtractor(item))) && !allSelected;
    const handleSelectAll = () => {
        if (!onSelectIds)
            return;
        if (allSelected) {
            onSelectIds([]);
        }
        else {
            onSelectIds(data.map(keyExtractor));
        }
    };
    const handleRowSelect = (id, e) => {
        e.stopPropagation();
        if (!onSelectIds)
            return;
        if (selectedIds.includes(id)) {
            onSelectIds(selectedIds.filter((item) => item !== id));
        }
        else {
            onSelectIds([...selectedIds, id]);
        }
    };
    // Render Sort Icon
    const renderSortIcon = (colKey) => {
        if (sortColumn !== colKey) {
            return _jsx(ArrowUpDown, { size: 12, color: colors.slate[400] });
        }
        return sortDirection === 'asc' ? (_jsx(ArrowUp, { size: 12, color: colors.primary[600] })) : (_jsx(ArrowDown, { size: 12, color: colors.primary[600] }));
    };
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: '4px',
            overflow: 'hidden',
        }, className: "vms-data-table-wrapper", children: [selectedIds.length > 0 && bulkActions && (_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    backgroundColor: colors.primary[50],
                    borderBottom: `1px solid ${colors.primary[200]}`,
                    color: colors.primary[900],
                    fontSize: typography.fontSize.xs.size,
                    fontWeight: 600,
                }, children: [_jsxs("span", { children: ["Selected ", selectedIds.length, " records"] }), _jsx("div", { children: bulkActions })] })), _jsx("div", { style: { overflowX: 'auto', width: '100%', position: 'relative' }, children: _jsxs("table", { style: {
                        width: '100%',
                        borderCollapse: 'collapse',
                        textAlign: 'left',
                    }, className: "vms-table", children: [_jsx("thead", { style: {
                                backgroundColor: colors.slate[50],
                                borderBottom: `1px solid ${colors.slate[300]}`,
                                position: 'sticky',
                                top: 0,
                                zIndex: 10,
                            }, children: _jsxs("tr", { children: [onSelectIds && (_jsx("th", { style: { width: '40px', padding: cellPadding, textAlign: 'center' }, children: _jsx(Checkbox, { "aria-label": "Select all rows", checked: allSelected, onChange: handleSelectAll }) })), columns.map((col) => (_jsx("th", { scope: "col", style: {
                                            width: col.width,
                                            padding: cellPadding,
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            letterSpacing: '0.04em',
                                            textTransform: 'uppercase',
                                            color: colors.slate[600],
                                            textAlign: col.align || 'left',
                                            cursor: col.sortable && onSort ? 'pointer' : 'default',
                                            userSelect: 'none',
                                            whiteSpace: 'nowrap',
                                        }, onClick: () => col.sortable && onSort && onSort(col.key), children: _jsxs("div", { style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                                            }, children: [_jsx("span", { children: col.header }), col.sortable && renderSortIcon(col.key)] }) }, col.key)))] }) }), _jsx("tbody", { children: isLoading ? (
                            // Skeleton loading state
                            Array.from({ length: 5 }).map((_, rIdx) => (_jsxs("tr", { style: { height: rowHeight, borderBottom: `1px solid ${colors.slate[100]}` }, children: [onSelectIds && _jsx("td", { style: { padding: cellPadding, textAlign: 'center' }, children: _jsx("div", { style: { width: '16px', height: '16px', backgroundColor: colors.slate[200], borderRadius: '2px' } }) }), columns.map((col) => (_jsx("td", { style: { padding: cellPadding }, children: _jsx("div", { style: {
                                                height: '14px',
                                                width: '75%',
                                                backgroundColor: colors.slate[100],
                                                borderRadius: '2px',
                                                animation: 'pulse 1.5s infinite',
                                            } }) }, `loading-cell-${col.key}`)))] }, `loading-row-${rIdx}`)))) : isError ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length + (onSelectIds ? 1 : 0), style: { padding: '40px 20px', textAlign: 'center' }, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }, children: [_jsx(AlertTriangle, { size: 28, color: colors.status.danger.solid }), _jsx("strong", { style: { fontSize: typography.fontSize.md.size, color: colors.slate[900] }, children: "Failed to load records" }), _jsx("span", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[500] }, children: errorMessage || 'A network or system error occurred while retrieving data.' }), onRetry && (_jsx("button", { type: "button", onClick: onRetry, style: {
                                                    marginTop: '8px',
                                                    padding: '6px 14px',
                                                    backgroundColor: colors.primary[600],
                                                    color: '#ffffff',
                                                    borderRadius: '4px',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    fontWeight: 600,
                                                    fontSize: typography.fontSize.xs.size,
                                                }, children: "Retry Loading" }))] }) }) })) : data.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: columns.length + (onSelectIds ? 1 : 0), style: { padding: '48px 20px', textAlign: 'center' }, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }, children: [_jsx(Inbox, { size: 32, color: colors.slate[400] }), _jsx("strong", { style: { fontSize: typography.fontSize.md.size, color: colors.slate[800] }, children: emptyTitle }), _jsx("span", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[500], maxWidth: '400px' }, children: emptyDescription })] }) }) })) : (
                            // Populated state
                            data.map((item, idx) => {
                                const rowKey = keyExtractor(item);
                                const isSelected = selectedIds.includes(rowKey);
                                return (_jsxs("tr", { onClick: () => onRowClick && onRowClick(item), style: {
                                        height: rowHeight,
                                        borderBottom: `1px solid ${colors.slate[100]}`,
                                        backgroundColor: isSelected
                                            ? colors.primary[50]
                                            : idx % 2 === 1
                                                ? colors.slate[50]
                                                : '#ffffff',
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        transition: 'background-color 80ms ease',
                                    }, className: "vms-table-row", children: [onSelectIds && (_jsx("td", { style: { padding: cellPadding, textAlign: 'center' }, onClick: (e) => handleRowSelect(rowKey, e), children: _jsx(Checkbox, { "aria-label": `Select row ${rowKey}`, checked: isSelected, onChange: () => { } }) })), columns.map((col) => {
                                            const value = item[col.key];
                                            return (_jsx("td", { style: {
                                                    padding: cellPadding,
                                                    fontSize,
                                                    color: colors.slate[800],
                                                    textAlign: col.align || 'left',
                                                    whiteSpace: 'nowrap',
                                                }, children: col.render ? col.render(item, idx) : (value != null ? String(value) : '—') }, col.key));
                                        })] }, rowKey));
                            })) })] }) })] }));
}
