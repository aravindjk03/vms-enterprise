import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from 'react';
import { Search, Users, Handshake, HardHat, UserCheck, Truck, FileCheck, Package, Calendar, ShieldCheck, Hash, ArrowRight } from 'lucide-react';
import { colors, overlay, radius, shadows, typography } from '../../tokens.js';
export const GlobalSearch = ({ isOpen, onClose, onSelectResult, dataset, }) => {
    const [query, setQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        }
        else {
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);
    // Default sample dataset covering all 11 required domain categories
    const defaultDataset = [
        {
            id: 'VIS-2026-00182',
            category: 'VISITOR',
            title: 'Aravind Swaminathan',
            subtitle: 'Siemens Industrial Automation • Host: Vikram Mehta',
            details: 'Meeting: SCADA Upgrade • Valid Today',
            status: 'APPROVED',
            route: '/visitors',
        },
        {
            id: 'VIS-2026-00188',
            category: 'VISITOR',
            title: 'Priya Sundaram',
            subtitle: 'Bosch Engineering • Host: Deepa S',
            details: 'Plant Tour & Quality Review',
            status: 'PENDING',
            route: '/visitors',
        },
        {
            id: 'CUST-2026-042',
            category: 'CUSTOMER',
            title: 'Toyota Kirloskar Delegation',
            subtitle: 'Supplier Quality Audit Team • 4 Delegates',
            details: 'Lobby A & Plant Bay 3',
            status: 'ACTIVE',
            route: '/customers/audits',
        },
        {
            id: 'CONT-CO-88',
            category: 'CONTRACTOR',
            title: 'Apex Electricals & Automation',
            subtitle: 'Vendor #V-9021 • 18 Workers on site',
            details: 'Substation Transformer Overhaul',
            status: 'ACTIVE',
            route: '/contractors',
        },
        {
            id: 'WRK-2026-5541',
            category: 'WORKER',
            title: 'Ramesh Kumar',
            subtitle: 'Apex Electricals • High Voltage Certified',
            details: 'Safety Induction Valid until Dec 2026',
            status: 'APPROVED',
            route: '/contractors/workers',
        },
        {
            id: 'VEH-TN-04-AB-1234',
            category: 'VEHICLE',
            title: 'TN 04 AB 1234',
            subtitle: 'Heavy Commercial Multi-Axle Truck • Ashok Leyland',
            details: 'PUC Valid • Gate 2 Weighbridge',
            status: 'INSIDE',
            route: '/vehicles',
        },
        {
            id: 'DRV-90123',
            category: 'DRIVER',
            title: 'Murugan Palani',
            subtitle: 'All-India Transporters • DL #TN-04-2018-9921',
            details: 'Breathalyzer 0.00% • In Transit',
            status: 'APPROVED',
            route: '/vehicles/drivers',
        },
        {
            id: 'MAT-IN-2026-0982',
            category: 'MATERIAL',
            title: 'PO-123456 (Natural Rubber Consignment)',
            subtitle: 'Supplier: Kottayam Plantations Ltd • 22.4 MT',
            details: 'Delivery Challan #CH-88219 • Weighbridge Inward',
            status: 'PENDING_INSPECTION',
            route: '/materials/inward',
        },
        {
            id: 'APT-2026-9021',
            category: 'APPOINTMENT',
            title: 'Scheduled Vendor QBR',
            subtitle: 'Conference Room 3B • Host: Finance GM',
            details: 'Today 14:00 - 15:30',
            status: 'SCHEDULED',
            route: '/visitors/appointments',
        },
        {
            id: 'GP-2026-0881',
            category: 'GATE_PASS',
            title: 'Pass #GP-2026-0881',
            subtitle: 'Material Inward & Returnable Pallets Escrow',
            details: 'North Gate 1 • Authorized by Stores Manager',
            status: 'ACTIVE',
            route: '/gate',
        },
        {
            id: 'DOC-NDA-000123',
            category: 'DOCUMENT',
            title: 'NDA-000123 (Signed Plant Non-Disclosure)',
            subtitle: 'Siemens Industrial Automation • 3-Year Confidentiality',
            details: 'Stored in Document Vault • Valid until 2029',
            status: 'VERIFIED',
            route: '/documents',
        },
        {
            id: 'TXN-VIS-2026-00182',
            category: 'TRANSACTION_ID',
            title: 'VIS-2026-00182',
            subtitle: 'Visitor Master Transaction • Chennai Plant',
            details: 'Source: Pre-Registration Portal',
            status: 'CAPTURED',
            route: '/visitors',
        },
    ];
    const pool = dataset || defaultDataset;
    const filtered = pool.filter((item) => {
        const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
        const matchesQuery = !query ||
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
            item.id.toLowerCase().includes(query.toLowerCase()) ||
            (item.details && item.details.toLowerCase().includes(query.toLowerCase()));
        return matchesCategory && matchesQuery;
    });
    // Group filtered results by category for visual separation
    const categoryOrder = [
        'VISITOR',
        'CUSTOMER',
        'CONTRACTOR',
        'WORKER',
        'VEHICLE',
        'DRIVER',
        'MATERIAL',
        'APPOINTMENT',
        'GATE_PASS',
        'DOCUMENT',
        'TRANSACTION_ID',
    ];
    const grouped = categoryOrder.reduce((acc, cat) => {
        const items = filtered.filter((i) => i.category === cat);
        if (items.length > 0) {
            acc[cat] = items;
        }
        return acc;
    }, {});
    // Keyboard navigation
    const flatList = Object.values(grouped).flat();
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isOpen)
                return;
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatList.length));
            }
            else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => (prev - 1 + flatList.length) % Math.max(1, flatList.length));
            }
            else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatList[selectedIndex]) {
                    onSelectResult(flatList[selectedIndex]);
                    onClose();
                }
            }
            else if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatList, selectedIndex, onClose, onSelectResult]);
    if (!isOpen)
        return null;
    const getCategoryIcon = (cat) => {
        switch (cat) {
            case 'VISITOR': return _jsx(Users, { size: 14, color: colors.primary[600] });
            case 'CUSTOMER': return _jsx(Handshake, { size: 14, color: colors.primary[600] });
            case 'CONTRACTOR': return _jsx(HardHat, { size: 14, color: colors.primary[600] });
            case 'WORKER': return _jsx(UserCheck, { size: 14, color: colors.primary[600] });
            case 'VEHICLE': return _jsx(Truck, { size: 14, color: colors.primary[600] });
            case 'DRIVER': return _jsx(Users, { size: 14, color: colors.primary[600] });
            case 'MATERIAL': return _jsx(Package, { size: 14, color: colors.primary[600] });
            case 'APPOINTMENT': return _jsx(Calendar, { size: 14, color: colors.primary[600] });
            case 'GATE_PASS': return _jsx(ShieldCheck, { size: 14, color: colors.primary[600] });
            case 'DOCUMENT': return _jsx(FileCheck, { size: 14, color: colors.primary[600] });
            case 'TRANSACTION_ID': return _jsx(Hash, { size: 14, color: colors.primary[600] });
        }
    };
    return (_jsxs("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 1200,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '8vh',
        }, className: "vms-global-search-modal", children: [_jsx("div", { "aria-hidden": "true", onClick: onClose, style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: overlay.modalBackdrop,
                } }), _jsxs("div", { role: "dialog", "aria-label": "Global Enterprise Search", style: {
                    position: 'relative',
                    width: '100%',
                    maxWidth: '680px',
                    backgroundColor: '#ffffff',
                    borderRadius: radius.lg,
                    boxShadow: shadows.modal,
                    overflow: 'hidden',
                    zIndex: 1201,
                    display: 'flex',
                    flexDirection: 'column',
                    border: `1px solid ${colors.slate[200]}`,
                }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderBottom: `1px solid ${colors.slate[200]}`,
                            gap: '10px',
                        }, children: [_jsx(Search, { size: 18, color: colors.slate[400] }), _jsx("input", { ref: inputRef, type: "text", placeholder: "Search visitors, vehicles, PO numbers, challans, NDA documents...", value: query, onChange: (e) => {
                                    setQuery(e.target.value);
                                    setSelectedIndex(0);
                                }, style: {
                                    width: '100%',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: typography.fontSize.md.size,
                                    color: colors.slate[900],
                                    fontFamily: typography.fontFamily.sans,
                                } }), _jsx("kbd", { style: {
                                    fontSize: '11px',
                                    backgroundColor: colors.slate[100],
                                    border: `1px solid ${colors.slate[300]}`,
                                    padding: '2px 6px',
                                    borderRadius: radius.sm,
                                    color: colors.slate[600],
                                }, children: "ESC" })] }), _jsx("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 16px',
                            borderBottom: `1px solid ${colors.slate[100]}`,
                            backgroundColor: colors.slate[50],
                            overflowX: 'auto',
                        }, children: ['ALL', 'VISITOR', 'VEHICLE', 'MATERIAL', 'CONTRACTOR', 'DOCUMENT'].map((cat) => (_jsx("button", { type: "button", onClick: () => {
                                setSelectedCategory(cat);
                                setSelectedIndex(0);
                            }, style: {
                                padding: '3px 8px',
                                borderRadius: radius.sm,
                                border: `1px solid ${selectedCategory === cat ? colors.primary[600] : colors.slate[200]}`,
                                backgroundColor: selectedCategory === cat ? colors.primary[50] : '#ffffff',
                                color: selectedCategory === cat ? colors.primary[800] : colors.slate[600],
                                fontSize: '11px',
                                fontWeight: selectedCategory === cat ? 700 : 500,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                            }, children: cat }, cat))) }), _jsx("div", { style: { maxHeight: '420px', overflowY: 'auto', padding: '10px 14px' }, children: flatList.length === 0 ? (_jsxs("div", { style: { padding: '36px', textAlign: 'center', color: colors.slate[500], fontSize: typography.fontSize.sm.size }, children: ["No enterprise records found for \"", query, "\""] })) : (Object.entries(grouped).map(([category, items]) => (_jsxs("div", { style: { marginBottom: '14px' }, children: [_jsxs("div", { style: {
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '4px 8px',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        letterSpacing: '0.05em',
                                        textTransform: 'uppercase',
                                        color: colors.slate[500],
                                        backgroundColor: colors.slate[100],
                                        borderRadius: radius.sm,
                                        marginBottom: '6px',
                                    }, children: [getCategoryIcon(category), _jsx("span", { children: `${category.replace('_', ' ')}S` })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: items.map((item) => {
                                        const globalIdx = flatList.findIndex((x) => x.id === item.id);
                                        const isSelected = globalIdx === selectedIndex;
                                        return (_jsxs("div", { onClick: () => {
                                                onSelectResult(item);
                                                onClose();
                                            }, onMouseEnter: () => setSelectedIndex(globalIdx), style: {
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 10px',
                                                borderRadius: radius.sm,
                                                backgroundColor: isSelected ? colors.primary[50] : 'transparent',
                                                cursor: 'pointer',
                                                gap: '12px',
                                            }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', minWidth: 0 }, children: [_jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: isSelected ? colors.primary[900] : colors.slate[900] }, children: item.title }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: item.subtitle }), item.details && (_jsx("span", { style: { fontSize: '11px', color: colors.slate[400] }, children: item.details }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }, children: [item.status && (_jsx("span", { style: {
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                                padding: '1px 5px',
                                                                borderRadius: '2px',
                                                                backgroundColor: colors.slate[100],
                                                                color: colors.slate[700],
                                                            }, children: item.status })), _jsx(ArrowRight, { size: 13, color: isSelected ? colors.primary[600] : colors.slate[300] })] })] }, item.id));
                                    }) })] }, category)))) }), _jsxs("div", { style: {
                            padding: '8px 16px',
                            borderTop: `1px solid ${colors.slate[200]}`,
                            backgroundColor: colors.slate[50],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '11px',
                            color: colors.slate[500],
                        }, children: [_jsxs("span", { children: ["Use ", _jsx("kbd", { children: "\u2191" }), " ", _jsx("kbd", { children: "\u2193" }), " to select, ", _jsx("kbd", { children: "Enter" }), " to jump"] }), _jsxs("span", { children: ["Showing ", flatList.length, " matches across all domains"] })] })] })] }));
};
