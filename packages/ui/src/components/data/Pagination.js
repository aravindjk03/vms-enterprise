import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Pagination = ({ currentPage, totalRecords, pageSize, onPageChange, onPageSizeChange, pageSizeOptions = [10, 25, 50, 100], }) => {
    const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
    const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const endRecord = Math.min(totalRecords, currentPage * pageSize);
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#ffffff',
            borderTop: `1px solid ${colors.slate[200]}`,
            fontSize: typography.fontSize.xs.size,
            color: colors.slate[600],
            gap: '16px',
            flexWrap: 'wrap',
        }, className: "vms-pagination", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsxs("span", { children: ["Showing ", _jsx("strong", { style: { color: colors.slate[900] }, children: startRecord }), " to", ' ', _jsx("strong", { style: { color: colors.slate[900] }, children: endRecord }), " of", ' ', _jsx("strong", { style: { color: colors.slate[900] }, children: totalRecords }), " records"] }), onPageSizeChange && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '12px' }, children: [_jsx("span", { children: "Rows:" }), _jsx("select", { "aria-label": "Select rows per page", value: pageSize, onChange: (e) => onPageSizeChange(Number(e.target.value)), style: {
                                    fontSize: typography.fontSize.xs.size,
                                    padding: '2px 6px',
                                    borderRadius: radius.sm,
                                    border: `1px solid ${colors.slate[300]}`,
                                    color: colors.slate[800],
                                    backgroundColor: '#ffffff',
                                    outline: 'none',
                                }, children: pageSizeOptions.map((opt) => (_jsx("option", { value: opt, children: opt }, opt))) })] }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("button", { type: "button", "aria-label": "First page", disabled: currentPage <= 1, onClick: () => onPageChange(1), style: {
                            padding: '4px 6px',
                            borderRadius: radius.sm,
                            border: `1px solid ${colors.slate[200]}`,
                            backgroundColor: '#ffffff',
                            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage <= 1 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                        }, children: _jsx(ChevronsLeft, { size: 14 }) }), _jsx("button", { type: "button", "aria-label": "Previous page", disabled: currentPage <= 1, onClick: () => onPageChange(currentPage - 1), style: {
                            padding: '4px 6px',
                            borderRadius: radius.sm,
                            border: `1px solid ${colors.slate[200]}`,
                            backgroundColor: '#ffffff',
                            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage <= 1 ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                        }, children: _jsx(ChevronLeft, { size: 14 }) }), _jsxs("span", { style: { padding: '0 8px', fontWeight: 600, color: colors.slate[900] }, children: ["Page ", currentPage, " of ", totalPages] }), _jsx("button", { type: "button", "aria-label": "Next page", disabled: currentPage >= totalPages, onClick: () => onPageChange(currentPage + 1), style: {
                            padding: '4px 6px',
                            borderRadius: radius.sm,
                            border: `1px solid ${colors.slate[200]}`,
                            backgroundColor: '#ffffff',
                            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage >= totalPages ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                        }, children: _jsx(ChevronRight, { size: 14 }) }), _jsx("button", { type: "button", "aria-label": "Last page", disabled: currentPage >= totalPages, onClick: () => onPageChange(totalPages), style: {
                            padding: '4px 6px',
                            borderRadius: radius.sm,
                            border: `1px solid ${colors.slate[200]}`,
                            backgroundColor: '#ffffff',
                            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage >= totalPages ? 0.4 : 1,
                            display: 'flex',
                            alignItems: 'center',
                        }, children: _jsx(ChevronsRight, { size: 14 }) })] })] }));
};
