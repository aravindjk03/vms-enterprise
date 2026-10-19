import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Plus, ExternalLink, Compass } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { DataTable, FilterBar, Pagination, Drawer, StatusBadge, Button, LoadingStateView, EmptyStateView, NoPermissionStateView, ErrorStateView } from '@vms/ui';
export const GenericDomainListView = ({ domainTitle, domainDescription, data, columns, onNewRecord, onOpenDetail, requiredCapability = 'DOMAIN_READ', }) => {
    // State management
    const [pageState, setPageState] = useState('DEFAULT');
    const [density, setDensity] = useState('dense');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeItem, setActiveItem] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);
    // Filter data
    const filteredData = data.filter((row) => {
        const matchesSearch = !search || Object.values(row).some((val) => String(val).toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = !statusFilter || row.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    const paginatedData = filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    // Status options derived from data
    const uniqueStatuses = Array.from(new Set(data.map((d) => d.status))).filter(Boolean);
    const statusOptions = uniqueStatuses.map((s) => ({ label: String(s), value: String(s) }));
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }, children: domainTitle }), _jsx("p", { style: { margin: '2px 0 0 0', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: domainDescription })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: colors.slate[100], padding: '2px', borderRadius: radius.sm }, children: ['DEFAULT', 'LOADING', 'EMPTY', 'NO_PERMISSION', 'ERROR'].map((st) => (_jsx("button", { type: "button", onClick: () => setPageState(st), style: {
                                        padding: '3px 7px',
                                        borderRadius: radius.sm,
                                        border: 'none',
                                        backgroundColor: pageState === st ? '#ffffff' : 'transparent',
                                        color: pageState === st ? colors.primary[700] : colors.slate[600],
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        boxShadow: pageState === st ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                    }, children: st }, st))) }), onNewRecord && (_jsx(Button, { variant: "primary", size: "dense", leftIcon: _jsx(Plus, { size: 14 }), onClick: onNewRecord, children: "New Transaction" }))] })] }), pageState === 'LOADING' ? (_jsx(LoadingStateView, { message: `Retrieving ${domainTitle} live records from site ledger...` })) : pageState === 'EMPTY' ? (_jsx(EmptyStateView, { title: `No ${domainTitle} Records Found`, description: "There are currently no active records or transactions registered for this site.", actionLabel: onNewRecord ? 'Create First Record' : undefined, onAction: onNewRecord })) : pageState === 'NO_PERMISSION' ? (_jsx(NoPermissionStateView, { requiredRoleOrCapability: requiredCapability, onGoBack: () => setPageState('DEFAULT') })) : pageState === 'ERROR' ? (_jsx(ErrorStateView, { errorTitle: `Failed to Sync ${domainTitle}`, errorMessage: "The connection to the local site gateway timed out.", onRetry: () => setPageState('DEFAULT') })) : (_jsxs("div", { style: { display: 'flex', flexDirection: 'column' }, children: [_jsx(FilterBar, { searchValue: search, onSearchChange: setSearch, statusFilter: statusFilter, onStatusFilterChange: setStatusFilter, statusOptions: statusOptions, density: density, onDensityToggle: () => setDensity(density === 'dense' ? 'normal' : 'dense'), onExport: () => alert(`Exporting ${filteredData.length} records to CSV.`), activeFilterCount: search || statusFilter ? 1 : 0, onClearFilters: () => {
                            setSearch('');
                            setStatusFilter('');
                        } }), _jsx(DataTable, { data: paginatedData, columns: columns, keyExtractor: (item) => item.id || String(Math.random()), density: density, selectedIds: selectedIds, onSelectIds: setSelectedIds, onRowClick: (item) => setActiveItem(item), bulkActions: _jsxs("div", { style: { display: 'flex', gap: '6px' }, children: [_jsx(Button, { variant: "outline", size: "dense", onClick: () => alert(`Bulk approve ${selectedIds.length}`), children: "Approve Selected" }), _jsx(Button, { variant: "secondary", size: "dense", onClick: () => alert(`Bulk print badges for ${selectedIds.length}`), children: "Batch Print Passes" })] }) }), _jsx(Pagination, { currentPage: currentPage, totalRecords: filteredData.length, pageSize: pageSize, onPageChange: setCurrentPage, onPageSizeChange: setPageSize })] })), _jsx(Drawer, { isOpen: Boolean(activeItem), onClose: () => setActiveItem(null), title: activeItem?.name || activeItem?.id || 'Record Details', subtitle: `Transaction Ref: ${activeItem?.id || '—'}`, footer: _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }, children: [_jsxs("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: ["Source: ", domainTitle, " Engine"] }), _jsx(Button, { variant: "primary", size: "dense", rightIcon: _jsx(ExternalLink, { size: 13 }), onClick: () => {
                                if (onOpenDetail && activeItem) {
                                    onOpenDetail(activeItem);
                                    setActiveItem(null);
                                }
                                else {
                                    alert(`Navigating to full profile for ${activeItem?.id}`);
                                }
                            }, children: "Open Full Profile" })] }), children: activeItem && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: colors.slate[50], borderRadius: radius.sm, border: `1px solid ${colors.slate[200]}` }, children: [_jsxs("div", { children: [_jsx("strong", { style: { fontSize: typography.fontSize.md.size, color: colors.slate[900] }, children: activeItem.name || activeItem.company || activeItem.id }), activeItem.company && (_jsx("div", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: activeItem.company }))] }), activeItem.status && _jsx(StatusBadge, { status: activeItem.status, size: "sm" })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: typography.fontSize.xs.size }, children: [activeItem.purpose && (_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Purpose:" }), _jsx("div", { style: { fontWeight: 600, color: colors.slate[900] }, children: activeItem.purpose })] })), activeItem.host && (_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Host Employee:" }), _jsx("div", { style: { fontWeight: 600, color: colors.slate[900] }, children: activeItem.host })] })), activeItem.gate && (_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Assigned Gate:" }), _jsx("div", { style: { fontWeight: 600, color: colors.slate[900] }, children: activeItem.gate })] })), activeItem.time && (_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Scheduled Window:" }), _jsx("div", { style: { fontWeight: 600, color: colors.slate[900] }, children: activeItem.time })] })), activeItem.plate && (_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Vehicle Registration:" }), _jsx("div", { style: { fontWeight: 700, fontFamily: typography.fontFamily.mono, color: colors.slate[900] }, children: activeItem.plate })] })), activeItem.transporter && (_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Transporter:" }), _jsx("div", { style: { fontWeight: 600, color: colors.slate[900] }, children: activeItem.transporter })] }))] }), activeItem.transportMode && (_jsxs("div", { style: {
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                padding: '10px 12px',
                                backgroundColor: colors.esg[50],
                                border: `1px solid ${colors.esg[500]}`,
                                borderRadius: radius.sm,
                                fontSize: typography.fontSize.xs.size,
                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', color: colors.esg[700], fontWeight: 700 }, children: [_jsx(Compass, { size: 14 }), _jsx("span", { children: "Mobility Activity Linked" })] }), _jsx("span", { style: { fontSize: '10px', backgroundColor: '#ffffff', color: colors.esg[700], padding: '1px 5px', borderRadius: radius.sm, fontWeight: 700 }, children: "CAPTURED" })] }), _jsxs("div", { style: { color: colors.slate[700] }, children: ["Mode: ", _jsx("strong", { children: activeItem.transportMode }), " (", activeItem.distanceKm, " km)"] }), _jsxs("div", { style: { fontSize: '10px', color: colors.slate[500] }, children: ["Provenance: ", _jsx("em", { children: activeItem.provenance || 'SYSTEM_ESTIMATED' })] })] }))] })) })] }));
};
