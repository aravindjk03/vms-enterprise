import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { CheckSquare, Clock, AlertTriangle, UserCheck, CheckCircle2, XCircle, UserPlus, Search, Eye, X } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, StatusBadge } from '@vms/ui';
// Initial mock task items for interactive Task Center
const INITIAL_TASKS = [
    {
        taskId: 'tsk-001',
        instanceId: 'inst-101',
        sourceDomain: 'VISITOR',
        sourceTransactionId: 'VIS-9401',
        siteId: 'site-chennai-01',
        requesterName: 'Dr. Evelyn Reed (Siemens Healthineers)',
        stageName: 'Designated Host Approval',
        assignedApprover: 'Vikram Mehta (Plant Operations Lead)',
        submittedAt: new Date(Date.now() - 35 * 60 * 1000), // 35 min ago
        slaDueAt: new Date(Date.now() + 85 * 60 * 1000), // due in 85 min
        slaStatus: 'ON_TIME',
        status: 'PENDING',
        availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'DELEGATE'],
        sanitizedDetails: {
            visitorType: 'VIP_GUEST',
            purpose: 'Technical OEM Plant Acceptance Audit',
            scheduledDate: '2026-10-12',
            escortRequired: true,
            mobilityMode: 'CAR (Electric SUV)',
        },
    },
    {
        taskId: 'tsk-002',
        instanceId: 'inst-102',
        sourceDomain: 'CONTRACTOR',
        sourceTransactionId: 'CONT-8812',
        siteId: 'site-chennai-01',
        requesterName: 'Larsen & Toubro Heavy Civil',
        stageName: 'EHS Safety Officer Sign-Off',
        assignedApprover: 'EHS_MANAGER',
        submittedAt: new Date(Date.now() - 110 * 60 * 1000), // 110 min ago
        slaDueAt: new Date(Date.now() - 10 * 60 * 1000), // Breached 10 min ago
        slaStatus: 'OVERDUE',
        status: 'ESCALATED',
        availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED'],
        sanitizedDetails: {
            workOrder: 'WO-2026-LNT-041 (Structural Foundation Retrofit)',
            workersCount: 14,
            safetyInductionComplete: true,
            ptwType: 'PTW_HOT_WORK_LEVEL_3',
        },
    },
    {
        taskId: 'tsk-003',
        instanceId: 'inst-103',
        sourceDomain: 'MATERIAL',
        sourceTransactionId: 'MAT-7731',
        siteId: 'site-chennai-01',
        requesterName: 'Tata Steel Logistics',
        stageName: 'Material Store Manager Clearance',
        assignedApprover: 'Storekeeper / Org Admin',
        submittedAt: new Date(Date.now() - 45 * 60 * 1000),
        slaDueAt: new Date(Date.now() + 15 * 60 * 1000), // Warning zone
        slaStatus: 'WARNING',
        status: 'PENDING',
        availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'DELEGATE'],
        sanitizedDetails: {
            challanNumber: 'DC-99201-TATA',
            movement: 'INWARD',
            classification: 'RETURNABLE_CONTAINERS',
            grossWeightKg: 18500,
        },
    },
    {
        taskId: 'tsk-004',
        instanceId: 'inst-104',
        sourceDomain: 'CUSTOMER',
        sourceTransactionId: 'CUST-3310',
        siteId: 'site-pune-01',
        requesterName: 'Daimler Truck Global Delegation',
        stageName: 'Plant Director / Security Clearance',
        assignedApprover: 'SITE_ADMIN',
        submittedAt: new Date(Date.now() - 15 * 60 * 1000),
        slaDueAt: new Date(Date.now() + 165 * 60 * 1000),
        slaStatus: 'ON_TIME',
        status: 'PENDING',
        availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'DELEGATE'],
        sanitizedDetails: {
            account: 'Daimler India Commercial Vehicles',
            delegationSize: 5,
            ndaSigned: true,
            visitWindow: '2026-10-15 to 2026-10-16',
        },
    },
    {
        taskId: 'tsk-005',
        instanceId: 'inst-105',
        sourceDomain: 'SERVICE',
        sourceTransactionId: 'SRV-5521',
        siteId: 'site-chennai-01',
        requesterName: 'Atlas Copco Air Power',
        stageName: 'Maintenance Lead & Site Manager Approval',
        assignedApprover: 'Delegated to Proxy (EHS Manager)',
        submittedAt: new Date(Date.now() - 60 * 60 * 1000),
        slaDueAt: new Date(Date.now() + 60 * 60 * 1000),
        slaStatus: 'ON_TIME',
        status: 'PENDING',
        availableActions: ['APPROVE', 'REJECT', 'CHANGES_REQUESTED'],
        sanitizedDetails: {
            equipmentTag: 'COMPRESSOR-MAIN-02',
            serviceType: 'OEM_BREAKDOWN_PREVENTIVE',
            technician: 'Ramesh Sundaram (OEM Certified)',
            lotoPermitAttached: true,
        },
    },
];
export const TaskCenterView = ({ userRole = 'SUPER_ADMIN', userId = 'user-01', }) => {
    // Navigation tab state
    const [activeTab, setActiveTab] = useState('MY_PENDING');
    const [domainFilter, setDomainFilter] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    // Modals state
    const [activeActionModal, setActiveActionModal] = useState(null);
    const [remarksInput, setRemarksInput] = useState('');
    const [delegateTargetInput, setDelegateTargetInput] = useState('user-proxy-02');
    const [selectedTaskDetail, setSelectedTaskDetail] = useState(null);
    // Tab counts
    const counts = useMemo(() => {
        return {
            pending: tasks.filter((t) => t.status === 'PENDING' || t.status === 'ESCALATED').length,
            overdue: tasks.filter((t) => t.slaStatus === 'OVERDUE' || t.status === 'ESCALATED').length,
            delegated: tasks.filter((t) => t.assignedApprover.includes('Delegated')).length,
            escalated: tasks.filter((t) => t.status === 'ESCALATED').length,
            completed: tasks.filter((t) => t.status === 'APPROVED' || t.status === 'REJECTED').length,
        };
    }, [tasks]);
    // Filtered task items
    const filteredTasks = useMemo(() => {
        return tasks.filter((task) => {
            // Tab filter
            if (activeTab === 'MY_PENDING' || activeTab === 'ASSIGNED_TO_ME') {
                if (task.status !== 'PENDING' && task.status !== 'ESCALATED')
                    return false;
            }
            else if (activeTab === 'DELEGATED') {
                if (!task.assignedApprover.includes('Delegated'))
                    return false;
            }
            else if (activeTab === 'OVERDUE') {
                if (task.slaStatus !== 'OVERDUE' && task.status !== 'ESCALATED')
                    return false;
            }
            else if (activeTab === 'ESCALATED') {
                if (task.status !== 'ESCALATED')
                    return false;
            }
            else if (activeTab === 'COMPLETED') {
                if (task.status !== 'APPROVED' && task.status !== 'REJECTED')
                    return false;
            }
            // Domain filter
            if (domainFilter !== 'ALL' && task.sourceDomain !== domainFilter)
                return false;
            // Search query
            if (searchQuery.trim().length > 0) {
                const q = searchQuery.toLowerCase();
                const matchRef = task.sourceTransactionId.toLowerCase().includes(q);
                const matchReq = (task.requesterName || '').toLowerCase().includes(q);
                const matchStage = task.stageName.toLowerCase().includes(q);
                if (!matchRef && !matchReq && !matchStage)
                    return false;
            }
            return true;
        });
    }, [tasks, activeTab, domainFilter, searchQuery]);
    // Execute decision
    const handleConfirmDecision = () => {
        if (!activeActionModal)
            return;
        const { task, action } = activeActionModal;
        if (action === 'REJECT' && !remarksInput.trim()) {
            alert('Mandatory Rejection Rule: Rejection remarks must be provided.');
            return;
        }
        setTasks((prev) => prev.map((t) => {
            if (t.taskId !== task.taskId)
                return t;
            if (action === 'APPROVE') {
                return { ...t, status: 'APPROVED' };
            }
            if (action === 'REJECT') {
                return { ...t, status: 'REJECTED' };
            }
            if (action === 'CHANGES_REQUESTED') {
                return { ...t, status: 'CHANGES_REQUESTED' };
            }
            if (action === 'DELEGATE') {
                return { ...t, assignedApprover: `Delegated to ${delegateTargetInput}` };
            }
            return t;
        }));
        setActiveActionModal(null);
        setRemarksInput('');
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }, children: [_jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(CheckSquare, { size: 24, color: colors.primary[600] }), _jsx("h1", { style: { margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }, children: "Enterprise Task Center" })] }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: "Unified authorization queue across Visitor, Contractor, Customer, Service, and Material workflows" })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md }, children: [_jsx(Clock, { size: 16, color: colors.primary[600] }), _jsx("span", { style: { fontSize: '11px', fontWeight: 600, color: colors.slate[600] }, children: "Pending:" }), _jsx("strong", { style: { fontSize: '12px', color: colors.slate[900] }, children: counts.pending })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#fff1f2', border: '1px solid #fecdd3', borderRadius: radius.md }, children: [_jsx(AlertTriangle, { size: 16, color: "#be123c" }), _jsx("span", { style: { fontSize: '11px', fontWeight: 600, color: '#9f1239' }, children: "Overdue:" }), _jsx("strong", { style: { fontSize: '12px', color: '#be123c' }, children: counts.overdue })] })] })] }), _jsx("div", { style: { display: 'flex', borderBottom: `1px solid ${colors.slate[200]}`, gap: '4px', overflowX: 'auto' }, children: [
                    { id: 'MY_PENDING', label: 'Pending Approvals', count: counts.pending, icon: _jsx(Clock, { size: 14 }) },
                    { id: 'DELEGATED', label: 'Delegated Tasks', count: counts.delegated, icon: _jsx(UserCheck, { size: 14 }) },
                    { id: 'OVERDUE', label: 'Overdue / Escalated', count: counts.overdue, icon: _jsx(AlertTriangle, { size: 14 }), isAlert: counts.overdue > 0 },
                    { id: 'COMPLETED', label: 'History / Completed', count: counts.completed, icon: _jsx(CheckCircle2, { size: 14 }) },
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (_jsxs("button", { type: "button", onClick: () => setActiveTab(tab.id), style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 16px',
                            border: 'none',
                            borderBottom: `2.5px solid ${isActive ? colors.primary[700] : 'transparent'}`,
                            backgroundColor: 'transparent',
                            color: isActive ? colors.primary[800] : colors.slate[600],
                            fontSize: typography.fontSize.xs.size,
                            fontWeight: isActive ? 700 : 500,
                            cursor: 'pointer',
                            transition: 'all 100ms ease',
                            whiteSpace: 'nowrap',
                        }, children: [tab.icon, _jsx("span", { children: tab.label }), _jsx("span", { style: {
                                    padding: '1px 6px',
                                    borderRadius: '10px',
                                    backgroundColor: tab.isAlert ? '#be123c' : isActive ? colors.primary[100] : colors.slate[100],
                                    color: tab.isAlert ? '#ffffff' : isActive ? colors.primary[900] : colors.slate[700],
                                    fontSize: '10px',
                                    fontWeight: 700,
                                }, children: tab.count })] }, tab.id));
                }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }, children: [_jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '400px' }, children: _jsxs("div", { style: { position: 'relative', width: '100%' }, children: [_jsx(Search, { size: 14, style: { position: 'absolute', left: '10px', top: '10px', color: colors.slate[400] } }), _jsx("input", { type: "text", placeholder: "Search reference, requester, or stage...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), style: {
                                        width: '100%',
                                        height: '34px',
                                        paddingLeft: '32px',
                                        paddingRight: '12px',
                                        border: `1px solid ${colors.slate[300]}`,
                                        borderRadius: radius.md,
                                        fontSize: typography.fontSize.xs.size,
                                        outline: 'none',
                                    } })] }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("span", { style: { fontSize: '11px', fontWeight: 600, color: colors.slate[600] }, children: "Domain:" }), _jsxs("select", { value: domainFilter, onChange: (e) => setDomainFilter(e.target.value), style: {
                                    height: '34px',
                                    padding: '0 8px',
                                    borderRadius: radius.md,
                                    border: `1px solid ${colors.slate[300]}`,
                                    backgroundColor: '#ffffff',
                                    fontSize: typography.fontSize.xs.size,
                                    outline: 'none',
                                }, children: [_jsx("option", { value: "ALL", children: "All Domains" }), _jsx("option", { value: "VISITOR", children: "Visitor Management" }), _jsx("option", { value: "CUSTOMER", children: "Customer Audits" }), _jsx("option", { value: "CONTRACTOR", children: "Contractor Safety" }), _jsx("option", { value: "SERVICE", children: "Service & Maintenance" }), _jsx("option", { value: "MATERIAL", children: "Material Logistics" })] }), _jsxs("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: [filteredTasks.length, " task", filteredTasks.length === 1 ? '' : 's', " displayed"] })] })] }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: filteredTasks.length === 0 ? (_jsxs("div", { style: { backgroundColor: '#ffffff', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '40px', textAlign: 'center', color: colors.slate[500] }, children: [_jsx(CheckCircle2, { size: 32, color: "#16a34a", style: { margin: '0 auto 12px auto' } }), _jsx("strong", { style: { display: 'block', fontSize: typography.fontSize.sm.size, color: colors.slate[800] }, children: "All Caught Up!" }), _jsx("span", { style: { fontSize: '12px' }, children: "No pending approval tasks in this view matching criteria." })] })) : (filteredTasks.map((task) => {
                    const isOverdue = task.slaStatus === 'OVERDUE';
                    const isWarning = task.slaStatus === 'WARNING';
                    const isResolved = task.status === 'APPROVED' || task.status === 'REJECTED';
                    return (_jsxs("div", { style: {
                            backgroundColor: '#ffffff',
                            border: `1px solid ${isOverdue ? '#fca5a5' : isWarning ? '#fde047' : colors.slate[200]}`,
                            borderRadius: radius.md,
                            padding: '16px 20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("span", { style: {
                                                    padding: '2px 8px',
                                                    backgroundColor: colors.primary[50],
                                                    color: colors.primary[700],
                                                    borderRadius: radius.sm,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                }, children: task.sourceDomain }), _jsx("strong", { style: { fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: task.sourceTransactionId }), _jsx("span", { style: { color: colors.slate[400] }, children: "\u2022" }), _jsx("span", { style: { fontSize: '12px', fontWeight: 600, color: colors.slate[700] }, children: task.stageName })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsxs("span", { style: {
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    padding: '3px 8px',
                                                    borderRadius: radius.sm,
                                                    fontSize: '11px',
                                                    fontWeight: 700,
                                                    backgroundColor: isOverdue ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4',
                                                    color: isOverdue ? '#be123c' : isWarning ? '#b45309' : '#15803d',
                                                    border: `1px solid ${isOverdue ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0'}`,
                                                }, children: [_jsx(Clock, { size: 11 }), isOverdue ? 'SLA BREACHED (Escalated)' : isWarning ? 'SLA Warning (< 30m)' : 'On Schedule'] }), _jsx(StatusBadge, { status: task.status === 'APPROVED' ? 'approved' : task.status === 'REJECTED' ? 'danger' : 'warning', size: "sm" })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr', gap: '12px', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500], display: 'block' }, children: "Subject / Requester:" }), _jsx("strong", { style: { color: colors.slate[800] }, children: task.requesterName })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500], display: 'block' }, children: "Assigned Approver:" }), _jsx("span", { style: { fontWeight: 600, color: colors.slate[800] }, children: task.assignedApprover })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500], display: 'block' }, children: "Submitted:" }), _jsx("span", { children: new Date(task.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })] })] }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', backgroundColor: colors.slate[50], padding: '8px 12px', borderRadius: radius.sm, fontSize: '11px' }, children: Object.entries(task.sanitizedDetails).map(([k, v]) => (_jsxs("span", { style: { marginRight: '12px' }, children: [_jsxs("span", { style: { color: colors.slate[500] }, children: [k, ":"] }), " ", _jsx("strong", { children: String(v) })] }, k))) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${colors.slate[100]}`, paddingTop: '10px' }, children: [_jsxs("button", { type: "button", onClick: () => setSelectedTaskDetail(task), style: {
                                            background: 'none',
                                            border: 'none',
                                            color: colors.primary[700],
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                        }, children: [_jsx(Eye, { size: 12 }), " Inspect Full Record"] }), !isResolved ? (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Button, { variant: "ghost", size: "dense", leftIcon: _jsx(UserPlus, { size: 12 }), onClick: () => setActiveActionModal({ task, action: 'DELEGATE' }), children: "Delegate" }), _jsx(Button, { variant: "secondary", size: "dense", onClick: () => setActiveActionModal({ task, action: 'CHANGES_REQUESTED' }), children: "Request Changes" }), _jsx(Button, { variant: "danger", size: "dense", leftIcon: _jsx(XCircle, { size: 12 }), onClick: () => setActiveActionModal({ task, action: 'REJECT' }), children: "Reject" }), _jsx(Button, { variant: "primary", size: "dense", leftIcon: _jsx(CheckCircle2, { size: 12 }), onClick: () => setActiveActionModal({ task, action: 'APPROVE' }), children: "Approve" })] })) : (_jsxs("span", { style: { fontSize: '11px', color: colors.slate[500], fontWeight: 600 }, children: ["Resolved: ", task.status] }))] })] }, task.taskId));
                })) }), activeActionModal && (_jsx("div", { style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px',
                }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '500px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(CheckSquare, { size: 20, color: colors.primary[600] }), _jsxs("h3", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }, children: [activeActionModal.action === 'APPROVE' && 'Confirm Approval Decision', activeActionModal.action === 'REJECT' && 'Confirm Rejection (Mandatory Remarks)', activeActionModal.action === 'CHANGES_REQUESTED' && 'Request Changes from Requester', activeActionModal.action === 'DELEGATE' && 'Delegate Task to Proxy Approver'] })] }), _jsx("button", { type: "button", onClick: () => setActiveActionModal(null), style: { background: 'none', border: 'none', cursor: 'pointer' }, children: _jsx(X, { size: 18, color: colors.slate[500] }) })] }), _jsxs("div", { style: { marginBottom: '12px', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: ["Transaction: ", _jsx("strong", { children: activeActionModal.task.sourceTransactionId }), " (", activeActionModal.task.sourceDomain, ")"] }), activeActionModal.action === 'DELEGATE' ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }, children: [_jsx("label", { style: { fontSize: '11px', fontWeight: 700, color: colors.slate[700] }, children: "Select Qualified Proxy Approver:" }), _jsxs("select", { value: delegateTargetInput, onChange: (e) => setDelegateTargetInput(e.target.value), style: { height: '34px', padding: '0 8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size }, children: [_jsx("option", { value: "user-proxy-02", children: "Rohan Sharma (Site Safety Lead)" }), _jsx("option", { value: "user-proxy-03", children: "Ananya Sen (Assistant Plant Manager)" }), _jsx("option", { value: "user-proxy-04", children: "Vikram Mehta (Shift Incharge)" })] }), _jsx("span", { style: { fontSize: '10px', color: colors.slate[500] }, children: "Underlying permissions will be validated before delegation authorization is sealed." })] })) : (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }, children: [_jsx("label", { style: { fontSize: '11px', fontWeight: 700, color: colors.slate[700] }, children: activeActionModal.action === 'REJECT' ? 'Documented Reason for Rejection *' : 'Remarks / Comments (Optional)' }), _jsx("textarea", { rows: 3, required: activeActionModal.action === 'REJECT', placeholder: activeActionModal.action === 'REJECT'
                                        ? 'State the non-compliance or business justification for denying access...'
                                        : 'Add any optional verification notes...', value: remarksInput, onChange: (e) => setRemarksInput(e.target.value), style: { padding: '8px', borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}`, fontSize: typography.fontSize.xs.size } })] })), _jsxs("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '8px' }, children: [_jsx(Button, { variant: "secondary", size: "normal", onClick: () => setActiveActionModal(null), children: "Cancel" }), _jsxs(Button, { variant: activeActionModal.action === 'REJECT' ? 'danger' : 'primary', size: "normal", onClick: handleConfirmDecision, children: ["Confirm ", activeActionModal.action] })] })] }) })), selectedTaskDetail && (_jsx("div", { style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '16px',
                }, children: _jsxs("div", { style: { backgroundColor: '#ffffff', borderRadius: radius.lg, width: '100%', maxWidth: '540px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }, children: [_jsxs("div", { children: [_jsxs("h3", { style: { margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700 }, children: ["Transaction Overview: ", selectedTaskDetail.sourceTransactionId] }), _jsxs("span", { style: { fontSize: '11px', color: colors.slate[500] }, children: ["Domain: ", selectedTaskDetail.sourceDomain, " | Site: ", selectedTaskDetail.siteId] })] }), _jsx("button", { type: "button", onClick: () => setSelectedTaskDetail(null), style: { background: 'none', border: 'none', cursor: 'pointer' }, children: _jsx(X, { size: 18, color: colors.slate[500] }) })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px', fontSize: typography.fontSize.xs.size }, children: [_jsxs("div", { style: { padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }, children: [_jsx("strong", { children: "Requester / Subject:" }), " ", selectedTaskDetail.requesterName] }), _jsxs("div", { style: { padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }, children: [_jsx("strong", { children: "Current Workflow Stage:" }), " ", selectedTaskDetail.stageName] }), _jsxs("div", { style: { padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }, children: [_jsx("strong", { children: "SLA Due Date:" }), " ", selectedTaskDetail.slaDueAt ? new Date(selectedTaskDetail.slaDueAt).toLocaleString() : 'N/A'] }), _jsxs("div", { style: { padding: '10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }, children: [_jsx("strong", { children: "Context Details:" }), _jsx("pre", { style: { margin: '6px 0 0 0', fontFamily: typography.fontFamily.mono, fontSize: '10px' }, children: JSON.stringify(selectedTaskDetail.sanitizedDetails, null, 2) })] })] }), _jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }, children: _jsx(Button, { variant: "secondary", size: "normal", onClick: () => setSelectedTaskDetail(null), children: "Close" }) })] }) }))] }));
};
