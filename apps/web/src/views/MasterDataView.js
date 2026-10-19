import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Database, Plus, Upload, Download, Search, Archive, History, AlertTriangle, Lock, ShieldCheck, X } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Card, StatusBadge } from '@vms/ui';
import { CANONICAL_MASTER_CATEGORIES } from '../../../../services/workflow/src/master-data/categories.js';
// Initial mock records across categories for interactive UI
const INITIAL_RECORDS = [
    {
        id: 'md-001',
        tenantId: 'tenant-demo',
        category: 'VISITOR_TYPES',
        code: 'VIP_GUEST',
        name: 'VIP Executive Guest',
        description: 'High-level business partners, board members, and dignitaries requiring escort',
        status: 'ACTIVE',
        sortOrder: 1,
        effectiveFrom: new Date('2026-01-01'),
        version: 1,
        isSensitive: false,
        pendingApproval: false,
        createdBy: 'admin-01',
        createdAt: new Date('2026-01-01'),
        updatedBy: 'admin-01',
        updatedAt: new Date('2026-01-01'),
    },
    {
        id: 'md-002',
        tenantId: 'tenant-demo',
        category: 'VISITOR_TYPES',
        code: 'AUDITOR_EXT',
        name: 'External Regulatory Auditor',
        description: 'Statutory compliance and environmental safety auditors',
        status: 'ACTIVE',
        sortOrder: 2,
        effectiveFrom: new Date('2026-01-01'),
        version: 2,
        isSensitive: false,
        pendingApproval: false,
        createdBy: 'admin-01',
        createdAt: new Date('2026-01-01'),
        updatedBy: 'admin-02',
        updatedAt: new Date('2026-02-15'),
    },
    {
        id: 'md-003',
        tenantId: 'tenant-demo',
        category: 'WORK_CATEGORIES',
        code: 'HOT_WORK_CAT',
        name: 'Hot Work & Welding',
        description: 'Welding, gas cutting, grinding, and spark-producing activities requiring Level 3 PTW',
        status: 'ACTIVE',
        sortOrder: 1,
        effectiveFrom: new Date('2026-01-01'),
        version: 1,
        isSensitive: true,
        pendingApproval: false,
        createdBy: 'admin-01',
        createdAt: new Date('2026-01-01'),
        updatedBy: 'admin-01',
        updatedAt: new Date('2026-01-01'),
    },
    {
        id: 'md-004',
        tenantId: 'tenant-demo',
        category: 'WORK_CATEGORIES',
        code: 'CONFINED_SPACE',
        name: 'Confined Space Entry',
        description: 'Tank inspection, underground pit work, boiler entry',
        status: 'DRAFT',
        sortOrder: 2,
        effectiveFrom: new Date('2026-03-01'),
        version: 1,
        isSensitive: true,
        pendingApproval: true,
        createdBy: 'user-02',
        createdAt: new Date('2026-03-01'),
        updatedBy: 'user-02',
        updatedAt: new Date('2026-03-01'),
    },
    {
        id: 'md-005',
        tenantId: 'tenant-demo',
        category: 'TRANSPORT_MODES',
        code: 'EV_COMMUTE',
        name: 'Electric Vehicle (EV)',
        description: 'Zero direct tailpipe emissions battery electric vehicle',
        status: 'ACTIVE',
        sortOrder: 1,
        effectiveFrom: new Date('2026-01-01'),
        version: 1,
        isSensitive: false,
        pendingApproval: false,
        createdBy: 'esg-admin',
        createdAt: new Date('2026-01-01'),
        updatedBy: 'esg-admin',
        updatedAt: new Date('2026-01-01'),
    },
    {
        id: 'md-006',
        tenantId: 'tenant-demo',
        category: 'DOCUMENT_TYPES',
        code: 'GOVT_ID_PASSPORT',
        name: 'Government Passport',
        description: 'Official international government identity document',
        status: 'ACTIVE',
        sortOrder: 1,
        effectiveFrom: new Date('2026-01-01'),
        version: 1,
        isSensitive: true,
        pendingApproval: false,
        createdBy: 'admin-01',
        createdAt: new Date('2026-01-01'),
        updatedBy: 'admin-01',
        updatedAt: new Date('2026-01-01'),
    },
    {
        id: 'md-007',
        tenantId: 'tenant-demo',
        category: 'MATERIAL_TRANSACTION_TYPES',
        code: 'RETURNABLE_PACKAGING',
        name: 'Returnable Pallets & Packaging',
        description: 'Returnable steel stillages, plastic crates, and heavy pallets tracked under return escrow',
        status: 'ACTIVE',
        sortOrder: 1,
        effectiveFrom: new Date('2026-01-01'),
        version: 1,
        isSensitive: true,
        pendingApproval: false,
        createdBy: 'admin-01',
        createdAt: new Date('2026-01-01'),
        updatedBy: 'admin-01',
        updatedAt: new Date('2026-01-01'),
    },
];
export const MasterDataView = ({ userRole = 'SUPER_ADMIN', tenantId = 'tenant-demo', }) => {
    // State
    const [categories] = useState(CANONICAL_MASTER_CATEGORIES);
    const [selectedCategoryCode, setSelectedCategoryCode] = useState('ALL');
    const [selectedDomain, setSelectedDomain] = useState('ALL');
    const [records, setRecords] = useState(INITIAL_RECORDS);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    // Modal States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [activeHistoryRecord, setActiveHistoryRecord] = useState(null);
    // Form State for Add Record
    const [formData, setFormData] = useState({
        category: 'VISITOR_TYPES',
        code: '',
        name: '',
        description: '',
        sortOrder: 10,
        effectiveFrom: '2026-01-01',
        effectiveUntil: '',
    });
    // Import State
    const [importText, setImportText] = useState('');
    const [importPreviewErrors, setImportPreviewErrors] = useState([]);
    const [importSuccessMsg, setImportSuccessMsg] = useState('');
    // Domains list
    const domains = useMemo(() => {
        const set = new Set();
        categories.forEach((c) => set.add(c.domain));
        return Array.from(set).sort();
    }, [categories]);
    // Filtered categories
    const filteredCategories = useMemo(() => {
        if (selectedDomain === 'ALL')
            return categories;
        return categories.filter((c) => c.domain === selectedDomain);
    }, [categories, selectedDomain]);
    // Current category definition
    const currentCategoryDef = useMemo(() => {
        if (selectedCategoryCode === 'ALL')
            return null;
        return categories.find((c) => c.categoryCode === selectedCategoryCode) || null;
    }, [categories, selectedCategoryCode]);
    // Filtered records
    const filteredRecords = useMemo(() => {
        return records.filter((r) => {
            if (selectedCategoryCode !== 'ALL' && r.category !== selectedCategoryCode)
                return false;
            if (statusFilter !== 'ALL' && r.status !== statusFilter)
                return false;
            if (searchQuery.trim().length > 0) {
                const q = searchQuery.toLowerCase();
                const matchCode = r.code.toLowerCase().includes(q);
                const matchName = r.name.toLowerCase().includes(q);
                const matchDesc = (r.description || '').toLowerCase().includes(q);
                if (!matchCode && !matchName && !matchDesc)
                    return false;
            }
            return true;
        });
    }, [records, selectedCategoryCode, statusFilter, searchQuery]);
    // Actions
    const handleCreateRecord = (e) => {
        e.preventDefault();
        if (!formData.code || !formData.name)
            return;
        const catDef = categories.find((c) => c.categoryCode === formData.category);
        let targetStatus = 'ACTIVE';
        let pendingApproval = false;
        if (catDef?.requiresApprovalForActivation && userRole !== 'SUPER_ADMIN') {
            targetStatus = 'DRAFT';
            pendingApproval = true;
        }
        const newRec = {
            id: `md-${Date.now()}`,
            tenantId,
            category: formData.category,
            code: formData.code.trim().toUpperCase(),
            name: formData.name.trim(),
            description: formData.description,
            status: targetStatus,
            sortOrder: Number(formData.sortOrder) || 0,
            effectiveFrom: new Date(formData.effectiveFrom || Date.now()),
            effectiveUntil: formData.effectiveUntil ? new Date(formData.effectiveUntil) : undefined,
            version: 1,
            isSensitive: catDef?.isSensitive ?? false,
            pendingApproval,
            createdBy: 'currentUser',
            createdAt: new Date(),
            updatedBy: 'currentUser',
            updatedAt: new Date(),
        };
        setRecords([newRec, ...records]);
        setIsAddModalOpen(false);
        setFormData({
            category: selectedCategoryCode !== 'ALL' ? selectedCategoryCode : 'VISITOR_TYPES',
            code: '',
            name: '',
            description: '',
            sortOrder: 10,
            effectiveFrom: '2026-01-01',
            effectiveUntil: '',
        });
    };
    const handleToggleStatus = (recordId) => {
        setRecords((prev) => prev.map((r) => {
            if (r.id !== recordId)
                return r;
            const nextStatus = r.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
            return {
                ...r,
                status: nextStatus,
                version: r.version + 1,
                updatedAt: new Date(),
            };
        }));
    };
    const handleArchive = (recordId) => {
        setRecords((prev) => prev.map((r) => {
            if (r.id !== recordId)
                return r;
            return {
                ...r,
                status: 'ARCHIVED',
                version: r.version + 1,
                updatedAt: new Date(),
            };
        }));
    };
    const handleDownloadCsvTemplate = () => {
        const headers = ['Code', 'Name', 'Description', 'SortOrder', 'EffectiveFrom', 'EffectiveUntil'];
        const example = ['EX_CODE_01', 'Example Master Record', 'Detailed description', '10', '2026-01-01', ''];
        const csvContent = `${headers.join(',')}\n${example.join(',')}\n`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `template_${selectedCategoryCode.toLowerCase()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    const handlePreviewImport = () => {
        setImportPreviewErrors([]);
        setImportSuccessMsg('');
        if (!importText.trim()) {
            setImportPreviewErrors(['CSV input is empty.']);
            return;
        }
        const lines = importText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
            setImportPreviewErrors(['CSV must contain a header row and at least one data row.']);
            return;
        }
        const errors = [];
        const newItems = [];
        const seenCodes = new Set();
        for (let i = 1; i < lines.length; i++) {
            const parts = lines[i].split(',').map((p) => p.trim());
            const code = parts[0]?.toUpperCase();
            const name = parts[1];
            const desc = parts[2] || '';
            const sort = parseInt(parts[3] || '0', 10);
            const from = parts[4] || '2026-01-01';
            if (!code) {
                errors.push(`Row ${i + 1}: Code column is required.`);
            }
            else if (seenCodes.has(code) || records.some((r) => r.code === code && r.category === selectedCategoryCode)) {
                errors.push(`Row ${i + 1}: Duplicate code '${code}'.`);
            }
            else {
                seenCodes.add(code);
            }
            if (!name) {
                errors.push(`Row ${i + 1}: Name column is required.`);
            }
            if (code && name && errors.length === 0) {
                newItems.push({
                    id: `md-import-${Date.now()}-${i}`,
                    tenantId,
                    category: selectedCategoryCode !== 'ALL' ? selectedCategoryCode : 'VISITOR_TYPES',
                    code,
                    name,
                    description: desc,
                    status: 'ACTIVE',
                    sortOrder: sort,
                    effectiveFrom: new Date(from),
                    version: 1,
                    isSensitive: currentCategoryDef?.isSensitive ?? false,
                    pendingApproval: false,
                    createdBy: 'csvImport',
                    createdAt: new Date(),
                    updatedBy: 'csvImport',
                    updatedAt: new Date(),
                });
            }
        }
        if (errors.length > 0) {
            setImportPreviewErrors(errors);
        }
        else {
            setRecords([...newItems, ...records]);
            setImportSuccessMsg(`Successfully imported ${newItems.length} master records!`);
            setTimeout(() => {
                setIsImportModalOpen(false);
                setImportText('');
                setImportSuccessMsg('');
            }, 1200);
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Database, { size: 24, color: colors.primary[600] }), _jsx("h1", { style: { margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }, children: "Enterprise Master Data Management" })] }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: "Controlled, versioned business categories with strict tenant isolation and audit governance" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", size: "normal", leftIcon: _jsx(Upload, { size: 14 }), onClick: () => {
                                    setImportPreviewErrors([]);
                                    setImportSuccessMsg('');
                                    setIsImportModalOpen(true);
                                }, children: "Import CSV" }), _jsx(Button, { variant: "primary", size: "normal", leftIcon: _jsx(Plus, { size: 14 }), onClick: () => {
                                    setFormData((prev) => ({
                                        ...prev,
                                        category: selectedCategoryCode !== 'ALL' ? selectedCategoryCode : 'VISITOR_TYPES',
                                    }));
                                    setIsAddModalOpen(true);
                                }, children: "Add Master Record" })] })] }), _jsx(Card, { children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }, children: [_jsx("span", { style: { fontSize: '11px', fontWeight: 700, color: colors.slate[500], marginRight: '4px', textTransform: 'uppercase' }, children: "Domain:" }), _jsx("button", { type: "button", onClick: () => setSelectedDomain('ALL'), style: {
                                        padding: '4px 10px',
                                        borderRadius: radius.sm,
                                        border: 'none',
                                        backgroundColor: selectedDomain === 'ALL' ? colors.primary[700] : colors.slate[100],
                                        color: selectedDomain === 'ALL' ? '#ffffff' : colors.slate[700],
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                    }, children: "All Domains" }), domains.map((d) => (_jsx("button", { type: "button", onClick: () => {
                                        setSelectedDomain(d);
                                        setSelectedCategoryCode('ALL');
                                    }, style: {
                                        padding: '4px 10px',
                                        borderRadius: radius.sm,
                                        border: 'none',
                                        backgroundColor: selectedDomain === d ? colors.primary[700] : colors.slate[100],
                                        color: selectedDomain === d ? '#ffffff' : colors.slate[700],
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                    }, children: d }, d)))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderTop: `1px solid ${colors.slate[100]}`, paddingTop: '10px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("span", { style: { fontSize: '12px', fontWeight: 600, color: colors.slate[700] }, children: "Category:" }), _jsxs("select", { "aria-label": "Filter Master Data Category", value: selectedCategoryCode, onChange: (e) => setSelectedCategoryCode(e.target.value), style: {
                                                padding: '6px 12px',
                                                borderRadius: radius.md,
                                                border: `1px solid ${colors.slate[300]}`,
                                                backgroundColor: '#ffffff',
                                                fontSize: typography.fontSize.xs.size,
                                                fontWeight: 600,
                                                color: colors.slate[800],
                                                outline: 'none',
                                                cursor: 'pointer',
                                            }, children: [_jsxs("option", { value: "ALL", children: ["All Categories (", filteredCategories.length, ")"] }), filteredCategories.map((c) => (_jsxs("option", { value: c.categoryCode, children: ["[", c.domain, "] ", c.name, " (", c.categoryCode, ")"] }, c.categoryCode)))] })] }), currentCategoryDef && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [currentCategoryDef.isSensitive && (_jsxs("span", { style: {
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '2px 8px',
                                                backgroundColor: '#fef2f2',
                                                border: '1px solid #fecaca',
                                                borderRadius: radius.sm,
                                                color: '#b91c1c',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                            }, children: [_jsx(Lock, { size: 11 }), " Sensitive Category"] })), currentCategoryDef.requiresApprovalForActivation && (_jsxs("span", { style: {
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                padding: '2px 8px',
                                                backgroundColor: '#eff6ff',
                                                border: '1px solid #bfdbfe',
                                                borderRadius: radius.sm,
                                                color: '#1d4ed8',
                                                fontSize: '11px',
                                                fontWeight: 700,
                                            }, children: [_jsx(ShieldCheck, { size: 11 }), " Approval Required For Activation"] })), _jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: currentCategoryDef.description })] }))] })] }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }, children: [_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '380px' }, children: _jsxs("div", { style: { position: 'relative', width: '100%' }, children: [_jsx(Search, { size: 14, style: { position: 'absolute', left: '10px', top: '10px', color: colors.slate[400] } }), _jsx("input", { type: "text", placeholder: "Search code, name, or description...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: {
                                        width: '100%',
                                        height: '34px',
                                        paddingLeft: '32px',
                                        paddingRight: '12px',
                                        border: `1px solid ${colors.slate[300]}`,
                                        borderRadius: radius.md,
                                        fontSize: typography.fontSize.xs.size,
                                        outline: 'none',
                                    } })] }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { fontSize: '11px', fontWeight: 600, color: colors.slate[600] }, children: "Status:" }), _jsxs("select", { "aria-label": "Filter by Status", value: statusFilter, onChange: (e) => setStatusFilter(e.target.value), style: {
                                    height: '34px',
                                    padding: '0 8px',
                                    borderRadius: radius.md,
                                    border: `1px solid ${colors.slate[300]}`,
                                    backgroundColor: '#ffffff',
                                    fontSize: typography.fontSize.xs.size,
                                    outline: 'none',
                                }, children: [_jsx("option", { value: "ALL", children: "All Statuses" }), _jsx("option", { value: "ACTIVE", children: "ACTIVE" }), _jsx("option", { value: "DRAFT", children: "DRAFT" }), _jsx("option", { value: "INACTIVE", children: "INACTIVE" }), _jsx("option", { value: "ARCHIVED", children: "ARCHIVED" })] }), _jsxs("span", { style: { fontSize: '11px', fontWeight: 600, color: colors.slate[500], marginLeft: '8px' }, children: ["Showing ", filteredRecords.length, " records"] })] })] }), _jsx("div", { style: { backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, overflow: 'hidden' }, children: _jsxs("table", { style: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: typography.fontSize.xs.size }, children: [_jsx("thead", { children: _jsxs("tr", { style: { backgroundColor: colors.slate[50], borderBottom: `1px solid ${colors.slate[200]}`, color: colors.slate[600] }, children: [_jsx("th", { style: { padding: '10px 14px', fontWeight: 700 }, children: "Code" }), _jsx("th", { style: { padding: '10px 14px', fontWeight: 700 }, children: "Name" }), _jsx("th", { style: { padding: '10px 14px', fontWeight: 700 }, children: "Category" }), _jsx("th", { style: { padding: '10px 14px', fontWeight: 700 }, children: "Status" }), _jsx("th", { style: { padding: '10px 14px', fontWeight: 700 }, children: "Effective Dates" }), _jsx("th", { style: { padding: '10px 14px', fontWeight: 700, textAlign: 'center' }, children: "Version" }), _jsx("th", { style: { padding: '10px 14px', fontWeight: 700, textAlign: 'right' }, children: "Actions" })] }) }), _jsx("tbody", { children: filteredRecords.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 7, style: { padding: '32px', textAlign: 'center', color: colors.slate[500] }, children: "No master records found matching criteria. Click \"Add Master Record\" to create one." }) })) : (filteredRecords.map((rec) => {
                                const isArchived = rec.status === 'ARCHIVED';
                                return (_jsxs("tr", { style: {
                                        borderBottom: `1px solid ${colors.slate[100]}`,
                                        backgroundColor: rec.pendingApproval ? '#fffbeb' : '#ffffff',
                                    }, children: [_jsx("td", { style: { padding: '10px 14px', fontFamily: typography.fontFamily.mono, fontWeight: 700, color: colors.slate[900] }, children: rec.code }), _jsxs("td", { style: { padding: '10px 14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx("span", { style: { fontWeight: 600, color: colors.slate[800] }, children: rec.name }), rec.isSensitive && (_jsxs("span", { style: {
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '2px',
                                                                padding: '1px 5px',
                                                                backgroundColor: '#fef2f2',
                                                                border: '1px solid #fecaca',
                                                                borderRadius: radius.sm,
                                                                color: '#b91c1c',
                                                                fontSize: '9px',
                                                                fontWeight: 700,
                                                            }, children: [_jsx(Lock, { size: 9 }), " Sensitive Category"] }))] }), rec.description && (_jsx("div", { style: { fontSize: '11px', color: colors.slate[500], marginTop: '2px' }, children: rec.description }))] }), _jsx("td", { style: { padding: '10px 14px' }, children: _jsx("span", { style: { padding: '2px 6px', backgroundColor: colors.slate[100], borderRadius: radius.sm, fontSize: '10px', fontWeight: 600, color: colors.slate[700] }, children: rec.category }) }), _jsx("td", { style: { padding: '10px 14px' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(StatusBadge, { status: rec.status === 'ACTIVE'
                                                            ? 'approved'
                                                            : rec.status === 'DRAFT'
                                                                ? 'warning'
                                                                : rec.status === 'ARCHIVED'
                                                                    ? 'neutral'
                                                                    : 'danger', size: "sm" }), rec.pendingApproval && (_jsx("span", { style: { fontSize: '10px', color: '#b45309', fontWeight: 700 }, children: "(Pending Review)" }))] }) }), _jsxs("td", { style: { padding: '10px 14px', fontSize: '11px', color: colors.slate[600] }, children: [_jsxs("div", { children: ["From: ", new Date(rec.effectiveFrom).toLocaleDateString()] }), rec.effectiveUntil && _jsxs("div", { children: ["Until: ", new Date(rec.effectiveUntil).toLocaleDateString()] })] }), _jsxs("td", { style: { padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: colors.primary[700] }, children: ["v", rec.version] }), _jsx("td", { style: { padding: '10px 14px', textAlign: 'right' }, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }, children: [!isArchived && (_jsx("button", { type: "button", title: rec.status === 'ACTIVE' ? 'Deactivate record' : 'Activate record', onClick: () => handleToggleStatus(rec.id), style: {
                                                            padding: '4px 8px',
                                                            borderRadius: radius.sm,
                                                            border: `1px solid ${colors.slate[200]}`,
                                                            backgroundColor: rec.status === 'ACTIVE' ? '#fff1f2' : '#f0fdf4',
                                                            color: rec.status === 'ACTIVE' ? '#be123c' : '#15803d',
                                                            fontSize: '11px',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                        }, children: rec.status === 'ACTIVE' ? 'Deactivate' : 'Activate' })), !isArchived && (_jsx("button", { type: "button", title: "Archive record permanently", onClick: () => handleArchive(rec.id), style: {
                                                            padding: '4px',
                                                            borderRadius: radius.sm,
                                                            border: `1px solid ${colors.slate[200]}`,
                                                            backgroundColor: '#ffffff',
                                                            color: colors.slate[600],
                                                            cursor: 'pointer',
                                                        }, children: _jsx(Archive, { size: 13 }) })), _jsx("button", { type: "button", title: "View version audit history", onClick: () => {
                                                            setActiveHistoryRecord(rec);
                                                            setIsHistoryModalOpen(true);
                                                        }, style: {
                                                            padding: '4px',
                                                            borderRadius: radius.sm,
                                                            border: `1px solid ${colors.slate[200]}`,
                                                            backgroundColor: '#ffffff',
                                                            color: colors.primary[700],
                                                            cursor: 'pointer',
                                                        }, children: _jsx(History, { size: 13 }) })] }) })] }, rec.id));
                            })) })] }) }), isAddModalOpen && (_jsx("div", { style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px',
                }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '520px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Plus, { size: 20, color: colors.primary[600] }), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }, children: "New Master Data Record" })] }), _jsx("button", { type: "button", onClick: () => setIsAddModalOpen(false), style: { background: 'none', border: 'none', cursor: 'pointer' }, children: _jsx(X, { size: 18, color: colors.slate[500] }) })] }), _jsxs("form", { onSubmit: handleCreateRecord, style: { display: 'flex', flexDirection: 'column', gap: '14px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Target Category" }), _jsx("select", { value: formData.category, onChange: (e) => setFormData({ ...formData, category: e.target.value }), style: { width: '100%', height: '36px', padding: '0 10px', borderRadius: radius.md, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }, children: categories.map((c) => (_jsxs("option", { value: c.categoryCode, children: ["[", c.domain, "] ", c.name, " (", c.categoryCode, ")"] }, c.categoryCode))) })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Record Code *" }), _jsx("input", { type: "text", required: true, placeholder: "e.g. VIP_01", value: formData.code, onChange: (e) => setFormData({ ...formData, code: e.target.value.toUpperCase() }), style: { width: '100%', height: '36px', padding: '0 10px', borderRadius: radius.md, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size, fontFamily: typography.fontFamily.mono } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Display Name *" }), _jsx("input", { type: "text", required: true, placeholder: "e.g. VIP Executive Visitor", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), style: { width: '100%', height: '36px', padding: '0 10px', borderRadius: radius.md, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Description / Operational Intent" }), _jsx("textarea", { rows: 2, value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), style: { width: '100%', padding: '8px 10px', borderRadius: radius.md, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }, children: [_jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Sort Order" }), _jsx("input", { type: "number", value: formData.sortOrder, onChange: (e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) || 0 }), style: { width: '100%', height: '36px', padding: '0 10px', borderRadius: radius.md, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Effective From" }), _jsx("input", { type: "date", value: formData.effectiveFrom, onChange: (e) => setFormData({ ...formData, effectiveFrom: e.target.value }), style: { width: '100%', height: '36px', padding: '0 10px', borderRadius: radius.md, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] }), _jsxs("div", { children: [_jsx("label", { style: { display: 'block', fontSize: '11px', fontWeight: 700, color: colors.slate[700], marginBottom: '4px' }, children: "Effective Until" }), _jsx("input", { type: "date", value: formData.effectiveUntil, onChange: (e) => setFormData({ ...formData, effectiveUntil: e.target.value }), style: { width: '100%', height: '36px', padding: '0 10px', borderRadius: radius.md, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] })] }), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }, children: [_jsx(Button, { variant: "secondary", size: "normal", onClick: () => setIsAddModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", size: "normal", type: "submit", children: "Save Master Record" })] })] })] }) })), isImportModalOpen && (_jsx("div", { style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px',
                }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '640px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Upload, { size: 20, color: colors.primary[600] }), _jsxs("h3", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }, children: ["Bulk CSV Import: ", selectedCategoryCode !== 'ALL' ? selectedCategoryCode : 'VISITOR_TYPES'] })] }), _jsx("button", { type: "button", onClick: () => setIsImportModalOpen(false), style: { background: 'none', border: 'none', cursor: 'pointer' }, children: _jsx(X, { size: 18, color: colors.slate[500] }) })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }, children: [_jsxs("span", { style: { fontSize: '12px', color: colors.slate[600] }, children: ["Paste CSV data below with columns: ", _jsx("code", { children: "Code,Name,Description,SortOrder,EffectiveFrom" })] }), _jsx(Button, { variant: "secondary", size: "dense", leftIcon: _jsx(Download, { size: 12 }), onClick: handleDownloadCsvTemplate, children: "Download Template" })] }), _jsx("textarea", { rows: 6, placeholder: "Code,Name,Description,SortOrder,EffectiveFrom\nVIP_BOARD,Board Member,VIP Board Guest,1,2026-01-01", value: importText, onChange: (e) => setImportText(e.target.value), style: {
                                width: '100%',
                                padding: '10px',
                                borderRadius: radius.md,
                                border: `1px solid ${colors.slate[300]}`,
                                fontFamily: typography.fontFamily.mono,
                                fontSize: '11px',
                                marginBottom: '10px',
                            } }), importPreviewErrors.length > 0 && (_jsxs("div", { style: { backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: radius.md, padding: '10px 14px', marginBottom: '10px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', color: '#b91c1c', fontWeight: 700, fontSize: '12px' }, children: [_jsx(AlertTriangle, { size: 14 }), " Validation Errors Found (", importPreviewErrors.length, ")"] }), _jsx("ul", { style: { margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '11px', color: '#991b1b' }, children: importPreviewErrors.map((err, i) => (_jsx("li", { children: err }, i))) })] })), importSuccessMsg && (_jsx("div", { style: { backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: radius.md, padding: '10px 14px', color: '#166534', fontWeight: 700, fontSize: '12px', marginBottom: '10px' }, children: importSuccessMsg })), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", size: "normal", onClick: () => setIsImportModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", size: "normal", onClick: handlePreviewImport, children: "Validate & Import" })] })] }) })), isHistoryModalOpen && activeHistoryRecord && (_jsx("div", { style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px',
                }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '560px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(History, { size: 20, color: colors.primary[600] }), _jsxs("div", { children: [_jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }, children: "Version History" }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[500] }, children: [activeHistoryRecord.code, " \u2014 ", activeHistoryRecord.name] })] })] }), _jsx("button", { type: "button", onClick: () => setIsHistoryModalOpen(false), style: { background: 'none', border: 'none', cursor: 'pointer' }, children: _jsx(X, { size: 18, color: colors.slate[500] }) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }, children: [_jsxs("div", { style: { padding: '10px 12px', backgroundColor: colors.slate[50], border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("span", { style: { fontWeight: 700, color: colors.primary[700] }, children: ["Version ", activeHistoryRecord.version, " (Current)"] }), _jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: new Date(activeHistoryRecord.updatedAt).toLocaleString() })] }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[600], marginTop: '4px' }, children: ["Updated by: ", _jsx("strong", { children: activeHistoryRecord.updatedBy })] }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[500], marginTop: '2px' }, children: ["Status: ", activeHistoryRecord.status, " | Sort: ", activeHistoryRecord.sortOrder] })] }), activeHistoryRecord.version > 1 && (_jsxs("div", { style: { padding: '10px 12px', backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontWeight: 700, color: colors.slate[700] }, children: "Version 1 (Initial Creation)" }), _jsx("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: new Date(activeHistoryRecord.createdAt).toLocaleString() })] }), _jsxs("div", { style: { fontSize: '11px', color: colors.slate[600], marginTop: '4px' }, children: ["Created by: ", _jsx("strong", { children: activeHistoryRecord.createdBy })] })] }))] }), _jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }, children: _jsx(Button, { variant: "secondary", size: "normal", onClick: () => setIsHistoryModalOpen(false), children: "Close" }) })] }) }))] }));
};
