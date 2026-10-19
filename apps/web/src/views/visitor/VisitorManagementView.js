import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Users, UserCheck, UserPlus, Clock, Calendar, ShieldAlert, CheckCircle2, QrCode, Search, TrendingUp, Leaf, Car, AlertTriangle, History, Briefcase, Layers, Printer, ExternalLink } from 'lucide-react';
import { Button, Card, StatusBadge, Modal, Drawer, } from '@vms/ui';
const INITIAL_VISITORS = [
    {
        id: 'tx-vis-101',
        referenceNumber: 'VIS-2026-000182',
        name: 'Aravind Swaminathan',
        phone: '+91-9884011223',
        email: 'aravind@siemens.com',
        company: 'Siemens Industrial Automation',
        designation: 'Senior Field Systems Engineer',
        visitorCategory: 'CONSULTANT',
        purpose: 'SITE_VISIT',
        bookingMode: 'RESERVED',
        host: 'Vikram Mehta (Plant Lead)',
        hostUserId: 'usr-host-1',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T09:30:00Z',
        scheduledEnd: '2026-10-11T16:00:00Z',
        actualArrival: '2026-10-11T09:40:00Z',
        actualEntry: '2026-10-11T09:45:00Z',
        stage: 'CHECK_IN',
        status: 'ON_PREMISES',
        escortRequired: false,
        vipStatus: false,
        transport: {
            mode: 'CAR',
            ownership: 'PERSONAL',
            vehicleClass: 'SEDAN',
            fuelType: 'DIESEL',
            usageType: 'INDIVIDUAL',
            occupancy: 1,
            origin: 'Bengaluru',
            destination: 'Chennai Radial Tyre Plant',
            distanceKm: 348,
            provenance: 'SYSTEM_ESTIMATED',
            transportServiceType: 'SELF_DRIVEN_PERSONAL',
        },
        esgActivity: {
            id: 'GHA-2026-000182',
            activityType: 'BUSINESS_TRAVEL',
            quantity: 348,
            unit: 'KM',
            status: 'CALCULATED',
            kgCO2e: 59.44,
        },
        identityVerified: true,
        verificationMethod: 'GOVT_ID_DOCUMENT',
        documents: [{ type: 'Govt ID (Aadhaar)', status: 'VERIFIED' }, { type: 'Site Safety Induction', status: 'VERIFIED' }],
    },
    {
        id: 'tx-vis-102',
        referenceNumber: 'VIS-2026-000183',
        name: 'Priya Sundaram',
        phone: '+91-9444098765',
        email: 'priya.s@tuvsud.com',
        company: 'TÜV SÜD South Asia',
        designation: 'Lead Environmental Auditor',
        visitorCategory: 'AUDITOR',
        purpose: 'AUDIT',
        bookingMode: 'RESERVED',
        host: 'Kavita Nair (EHS Head)',
        hostUserId: 'usr-host-2',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T10:00:00Z',
        scheduledEnd: '2026-10-11T17:30:00Z',
        actualArrival: '2026-10-11T10:02:00Z',
        stage: 'APPROVAL',
        status: 'APPROVED',
        escortRequired: true,
        vipStatus: false,
        transport: {
            mode: 'FLIGHT',
            ownership: 'PUBLIC',
            vehicleClass: 'OTHER',
            fuelType: 'OTHER',
            usageType: 'PUBLIC_COMMUTE',
            occupancy: 1,
            origin: 'Mumbai Airport',
            destination: 'Chennai Plant',
            distanceKm: 1020,
            provenance: 'USER_PROVIDED',
            transportServiceType: 'AIR_TRAVEL',
        },
        esgActivity: {
            id: 'GHA-2026-000183',
            activityType: 'BUSINESS_TRAVEL',
            quantity: 1020,
            unit: 'KM',
            status: 'CALCULATED',
            kgCO2e: 250.71,
        },
        identityVerified: true,
        verificationMethod: 'OTP',
        documents: [{ type: 'Auditor Credential', status: 'VERIFIED' }, { type: 'Govt ID', status: 'VERIFIED' }],
    },
    {
        id: 'tx-vis-103',
        referenceNumber: 'VIS-2026-000184',
        name: 'Dr. Robert Chen',
        phone: '+1-415-889-1122',
        email: 'rchen@bridgestone-tech.com',
        company: 'Bridgestone Global Engineering',
        designation: 'VP Material Formulations',
        visitorCategory: 'VIP_VISITOR',
        purpose: 'MEETING',
        bookingMode: 'RESERVED',
        host: 'Suresh Babu (VP Operations)',
        hostUserId: 'usr-host-3',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T11:30:00Z',
        scheduledEnd: '2026-10-11T14:00:00Z',
        stage: 'APPROVAL',
        status: 'PENDING',
        escortRequired: true,
        vipStatus: true,
        transport: {
            mode: 'TAXI_CAB',
            ownership: 'HIRED',
            vehicleClass: 'SUV',
            fuelType: 'ELECTRIC',
            usageType: 'INDIVIDUAL',
            occupancy: 1,
            origin: 'ITC Grand Chola',
            destination: 'Chennai Radial Tyre Plant',
            distanceKm: 18,
            provenance: 'SYSTEM_CALCULATED',
            transportServiceType: 'HIRED_TAXI_CAB',
        },
        esgActivity: {
            id: 'GHA-2026-000184',
            activityType: 'BUSINESS_TRAVEL',
            quantity: 18,
            unit: 'KM',
            status: 'PENDING',
        },
        identityVerified: false,
        documents: [{ type: 'Passport / Visa', status: 'PENDING' }, { type: 'NDA Sign-off', status: 'VERIFIED' }],
    },
    {
        id: 'tx-vis-104',
        referenceNumber: 'VIS-2026-000185',
        name: 'Karthik Raja',
        phone: '+91-9840223344',
        company: 'L&T Heavy Civil Infra',
        designation: 'Project Site Supervisor',
        visitorCategory: 'CONSULTANT',
        purpose: 'INSPECTION',
        bookingMode: 'RESERVED',
        host: 'Arun Kumar (Facilities Mgr)',
        hostUserId: 'usr-host-4',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T08:00:00Z',
        scheduledEnd: '2026-10-11T11:00:00Z',
        actualEntry: '2026-10-11T08:15:00Z',
        stage: 'CHECK_IN',
        status: 'ON_PREMISES',
        escortRequired: false,
        vipStatus: false,
        overstayMinutes: 45, // Breached scheduled end!
        transport: {
            mode: 'TWO_WHEELER',
            ownership: 'PERSONAL',
            vehicleClass: 'TWO_WHEELER',
            fuelType: 'PETROL',
            usageType: 'INDIVIDUAL',
            occupancy: 1,
            origin: 'Sriperumbudur',
            destination: 'Chennai Radial Tyre Plant',
            distanceKm: 14,
            provenance: 'USER_PROVIDED',
            transportServiceType: 'SELF_DRIVEN_PERSONAL',
        },
        esgActivity: {
            id: 'GHA-2026-000185',
            activityType: 'COMMUTER_TRAVEL',
            quantity: 14,
            unit: 'KM',
            status: 'CALCULATED',
            kgCO2e: 1.12,
        },
        identityVerified: true,
        verificationMethod: 'MANUAL_VERIFICATION',
        documents: [{ type: 'Govt ID', status: 'VERIFIED' }],
    },
    {
        id: 'tx-vis-105',
        referenceNumber: 'VIS-2026-000186',
        name: 'Sunita Mehra',
        phone: '+91-9774012399',
        company: 'Candidate - Executive R&D',
        designation: 'Materials Chemistry Specialist',
        visitorCategory: 'INTERVIEW_CANDIDATE',
        purpose: 'INTERVIEW',
        bookingMode: 'WALK_IN',
        host: 'Pooja Iyer (HR Talent)',
        hostUserId: 'usr-host-5',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T13:00:00Z',
        scheduledEnd: '2026-10-11T15:30:00Z',
        stage: 'CLOSED',
        status: 'COMPLETED',
        actualArrival: '2026-10-11T12:55:00Z',
        actualEntry: '2026-10-11T13:05:00Z',
        actualExit: '2026-10-11T15:20:00Z',
        escortRequired: true,
        vipStatus: false,
        transport: {
            mode: 'CAR',
            ownership: 'HIRED',
            vehicleClass: 'SEDAN',
            fuelType: 'CNG',
            usageType: 'INDIVIDUAL',
            occupancy: 1,
            origin: 'Guindy Metro Station',
            destination: 'Chennai Plant',
            distanceKm: 22,
            provenance: 'SYSTEM_ESTIMATED',
            transportServiceType: 'HIRED_TAXI_CAB',
        },
        esgActivity: {
            id: 'GHA-2026-000186',
            activityType: 'COMMUTER_TRAVEL',
            quantity: 22,
            unit: 'KM',
            status: 'CALCULATED',
            kgCO2e: 3.48,
        },
        identityVerified: true,
        documents: [{ type: 'Govt ID', status: 'VERIFIED' }],
    },
];
export const VisitorManagementView = ({ initialSubView = 'DASHBOARD', currentRole = 'SUPER_ADMIN', onNavigateSubView, }) => {
    const [subView, setSubView] = useState(initialSubView);
    const [visitors, setVisitors] = useState(INITIAL_VISITORS);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    // Interactive Modals and Drawers
    const [selectedVisitor, setSelectedVisitor] = useState(null);
    const [isEPassModalOpen, setIsEPassModalOpen] = useState(false);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isOverstayModalOpen, setIsOverstayModalOpen] = useState(false);
    const [isTraceabilityDrawerOpen, setIsTraceabilityDrawerOpen] = useState(false);
    const [isNewVisitorSuccessModalOpen, setIsNewVisitorSuccessModalOpen] = useState(false);
    const [createdRefNumber, setCreatedRefNumber] = useState('');
    // Returning Visitor Disambiguation Modal
    const [lookupPhone, setLookupPhone] = useState('');
    const [matchedCandidate, setMatchedCandidate] = useState(null);
    // New Visitor Form State
    const [formName, setFormName] = useState('');
    const [formPhone, setFormPhone] = useState('');
    const [formEmail, setFormEmail] = useState('');
    const [formCompany, setFormCompany] = useState('');
    const [formDesignation, setFormDesignation] = useState('');
    const [formCategory, setFormCategory] = useState('NEW_VISITOR');
    const [formPurpose, setFormPurpose] = useState('MEETING');
    const [formBookingMode, setFormBookingMode] = useState('RESERVED');
    const [formHost, setFormHost] = useState('Vikram Mehta (Plant Lead)');
    const [formDate, setFormDate] = useState('2026-10-12');
    const [formStartTime, setFormStartTime] = useState('10:00');
    const [formEndTime, setFormEndTime] = useState('14:00');
    const [formEscort, setFormEscort] = useState(false);
    const [formGovtId, setFormGovtId] = useState('');
    // Form Transport & ESG fields
    const [formTransportMode, setFormTransportMode] = useState('CAR');
    const [formOwnership, setFormOwnership] = useState('PERSONAL');
    const [formVehicleClass, setFormVehicleClass] = useState('SEDAN');
    const [formFuelType, setFormFuelType] = useState('PETROL');
    const [formOccupancy, setFormOccupancy] = useState(1);
    const [formOrigin, setFormOrigin] = useState('Bengaluru');
    const [formDestination, setFormDestination] = useState('Chennai Radial Tyre Plant');
    const [formDistance, setFormDistance] = useState(348);
    const [formDistanceProvenance, setFormDistanceProvenance] = useState('SYSTEM_ESTIMATED');
    // Change subview
    const handleSelectSubView = (target) => {
        setSubView(target);
        if (onNavigateSubView)
            onNavigateSubView(target);
    };
    // Real KPI calculations from state
    const kpis = useMemo(() => {
        const expected = visitors.filter(v => v.status === 'APPROVED' || v.status === 'PENDING').length;
        const inside = visitors.filter(v => v.status === 'ON_PREMISES').length;
        const pendingApproval = visitors.filter(v => v.status === 'PENDING').length;
        const overstays = visitors.filter(v => (v.overstayMinutes || 0) > 0 && v.status === 'ON_PREMISES').length;
        const completed = visitors.filter(v => v.status === 'COMPLETED').length;
        const verificationPending = visitors.filter(v => !v.identityVerified && v.status !== 'COMPLETED').length;
        // ESG Capture Completeness
        const withTransport = visitors.filter(v => Boolean(v.transport)).length;
        const esgRate = visitors.length > 0 ? Math.round((withTransport / visitors.length) * 100) : 100;
        return {
            expected,
            inside,
            pendingApproval,
            overstays,
            completed,
            verificationPending,
            esgRate,
        };
    }, [visitors]);
    // Filtered visitor list
    const filteredVisitors = useMemo(() => {
        return visitors.filter(v => {
            if (statusFilter !== 'ALL' && v.status !== statusFilter)
                return false;
            if (categoryFilter !== 'ALL' && v.visitorCategory !== categoryFilter)
                return false;
            // Special subview filters
            if (subView === 'EXPECTED' && !(v.status === 'APPROVED' || v.status === 'PENDING'))
                return false;
            if (subView === 'INSIDE' && v.status !== 'ON_PREMISES')
                return false;
            if (subView === 'APPROVALS' && v.status !== 'PENDING')
                return false;
            if (subView === 'OVERSTAYS' && !((v.overstayMinutes || 0) > 0 && v.status === 'ON_PREMISES'))
                return false;
            if (subView === 'COMPLETED' && v.status !== 'COMPLETED')
                return false;
            if (subView === 'VIP' && !v.vipStatus && v.visitorCategory !== 'VIP_VISITOR')
                return false;
            if (subView === 'GROUP' && v.bookingMode !== 'GROUP')
                return false;
            if (subView === 'WALK_IN' && v.bookingMode !== 'WALK_IN')
                return false;
            if (subView === 'VERIFICATION_QUEUE' && v.identityVerified)
                return false;
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const matchesName = v.name.toLowerCase().includes(term);
                const matchesRef = v.referenceNumber.toLowerCase().includes(term);
                const matchesComp = v.company.toLowerCase().includes(term);
                const matchesHost = v.host.toLowerCase().includes(term);
                if (!matchesName && !matchesRef && !matchesComp && !matchesHost)
                    return false;
            }
            return true;
        });
    }, [visitors, statusFilter, categoryFilter, subView, searchTerm]);
    // Actions
    const handleApprove = (txId) => {
        setVisitors(prev => prev.map(v => v.id === txId ? { ...v, status: 'APPROVED', stage: 'SCHEDULED' } : v));
        setIsApproveModalOpen(false);
    };
    const handleCheckIn = (txId) => {
        setVisitors(prev => prev.map(v => v.id === txId ? {
            ...v,
            status: 'ON_PREMISES',
            stage: 'CHECK_IN',
            actualEntry: new Date().toISOString(),
            identityVerified: true,
        } : v));
        setIsCheckInModalOpen(false);
    };
    const handleCheckOut = (txId) => {
        setVisitors(prev => prev.map(v => v.id === txId ? {
            ...v,
            status: 'COMPLETED',
            stage: 'CLOSED',
            actualExit: new Date().toISOString(),
            overstayMinutes: undefined,
        } : v));
        setIsCheckOutModalOpen(false);
    };
    const handleFormSubmit = (e) => {
        e.preventDefault();
        const newRef = `VIS-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
        const newRecord = {
            id: `tx-vis-${Date.now()}`,
            referenceNumber: newRef,
            name: formName || 'New Visitor',
            phone: formPhone || '+91-9884000000',
            email: formEmail,
            company: formCompany || 'External Organization',
            designation: formDesignation,
            visitorCategory: formCategory,
            purpose: formPurpose,
            bookingMode: formBookingMode,
            host: formHost,
            hostUserId: 'usr-host-1',
            siteId: 'SITE-CHN-01',
            siteName: 'Chennai Radial Tyre Plant',
            scheduledStart: `${formDate}T${formStartTime}:00Z`,
            scheduledEnd: `${formDate}T${formEndTime}:00Z`,
            stage: formBookingMode === 'EMERGENCY' ? 'CHECK_IN' : 'APPROVAL',
            status: formBookingMode === 'EMERGENCY' ? 'APPROVED' : 'PENDING',
            escortRequired: formEscort || formCategory === 'VIP_VISITOR',
            vipStatus: formCategory === 'VIP_VISITOR',
            transport: {
                mode: formTransportMode,
                ownership: formOwnership,
                vehicleClass: formVehicleClass,
                fuelType: formFuelType,
                usageType: 'INDIVIDUAL',
                occupancy: formOccupancy,
                origin: formOrigin,
                destination: formDestination,
                distanceKm: formDistance,
                provenance: formDistanceProvenance,
            },
            esgActivity: {
                id: `GHA-2026-${String(Math.floor(100000 + Math.random() * 900000))}`,
                activityType: 'BUSINESS_TRAVEL',
                quantity: formDistance,
                unit: 'KM',
                status: 'CALCULATED',
                kgCO2e: Number((formDistance * 0.1708).toFixed(2)),
            },
            identityVerified: formBookingMode === 'EMERGENCY',
            documents: [{ type: 'Govt ID', status: 'PENDING' }],
        };
        setVisitors(prev => [newRecord, ...prev]);
        setCreatedRefNumber(newRef);
        setIsNewVisitorSuccessModalOpen(true);
    };
    // Fast Phone Lookup
    const handleLookupPhone = () => {
        const clean = lookupPhone.replace(/\D/g, '');
        const found = visitors.find(v => v.phone.replace(/\D/g, '').includes(clean));
        if (found) {
            setMatchedCandidate(found);
            setFormName(found.name);
            setFormPhone(found.phone);
            setFormEmail(found.email || '');
            setFormCompany(found.company);
            setFormCategory('REPEATED_VISITOR');
            if (found.transport) {
                setFormTransportMode(found.transport.mode);
                setFormOwnership(found.transport.ownership);
                setFormOrigin(found.transport.origin);
                setFormDestination(found.transport.destination);
                setFormDistance(found.transport.distanceKm);
            }
        }
        else {
            setMatchedCandidate(null);
        }
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "bg-white border border-slate-200 rounded-md p-1.5 shadow-sm overflow-x-auto flex items-center gap-1", children: [
                    { id: 'DASHBOARD', label: 'Dashboard', icon: _jsx(TrendingUp, { size: 14 }) },
                    { id: 'ALL', label: 'All Visitors', icon: _jsx(Users, { size: 14 }), badge: visitors.length },
                    { id: 'EXPECTED', label: 'Expected Today', icon: _jsx(Calendar, { size: 14 }), badge: kpis.expected },
                    { id: 'INSIDE', label: 'Currently Inside', icon: _jsx(UserCheck, { size: 14 }), badge: kpis.inside, color: 'text-emerald-700 bg-emerald-50' },
                    { id: 'APPROVALS', label: 'Pending Approvals', icon: _jsx(Clock, { size: 14 }), badge: kpis.pendingApproval, color: 'text-amber-700 bg-amber-50' },
                    { id: 'OVERSTAYS', label: 'Overstays', icon: _jsx(AlertTriangle, { size: 14 }), badge: kpis.overstays, color: 'text-rose-700 bg-rose-50' },
                    { id: 'VERIFICATION_QUEUE', label: 'Verification Queue', icon: _jsx(ShieldAlert, { size: 14 }), badge: kpis.verificationPending },
                    { id: 'NEW', label: '+ New Registration', icon: _jsx(UserPlus, { size: 14 }) },
                    { id: 'REPEATED', label: 'Returning Lookup', icon: _jsx(History, { size: 14 }) },
                    { id: 'WALK_IN', label: 'Gate Walk-In (<60s)', icon: _jsx(CheckCircle2, { size: 14 }) },
                    { id: 'GROUP', label: 'Group Delegation', icon: _jsx(Layers, { size: 14 }) },
                    { id: 'VIP', label: 'VIP Protocol', icon: _jsx(Briefcase, { size: 14 }) },
                    { id: 'COMPLETED', label: 'Completed Visits', icon: _jsx(CheckCircle2, { size: 14 }) },
                    { id: 'TRACEABILITY', label: 'ESG Traceability', icon: _jsx(Leaf, { size: 14 }) },
                ].map(tab => {
                    const isActive = subView === tab.id;
                    return (_jsxs("button", { onClick: () => handleSelectSubView(tab.id), className: `flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${isActive
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`, children: [tab.icon, _jsx("span", { children: tab.label }), tab.badge !== undefined && (_jsx("span", { className: `px-1.5 py-0.2 rounded-full text-[10px] font-bold ${isActive ? 'bg-slate-700 text-white' : tab.color || 'bg-slate-200 text-slate-700'}`, children: tab.badge }))] }, tab.id));
                }) }), kpis.overstays > 0 && (_jsxs("div", { className: "bg-rose-50 border border-rose-300 rounded-md p-3 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "p-2 bg-rose-600 text-white rounded", children: _jsx(AlertTriangle, { size: 18 }) }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-bold text-rose-900", children: "Critical Security Alert: Active Overstay Detected" }), _jsxs("p", { className: "text-xs text-rose-700", children: [kpis.overstays, " visitor(s) currently on premises have exceeded their approved time window. Host and Security dispatch alerted."] })] })] }), _jsxs(Button, { variant: "danger", size: "dense", onClick: () => handleSelectSubView('OVERSTAYS'), children: ["Review Overstays (", kpis.overstays, ")"] })] })), subView === 'DASHBOARD' && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-3", children: [_jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Expected Today" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-slate-900", children: kpis.expected }), _jsx("span", { className: "text-[10px] font-bold text-slate-500", children: "Scheduled" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Currently Inside" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-emerald-700", children: kpis.inside }), _jsx("span", { className: "text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded", children: "Active" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Pending Approvals" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-amber-700", children: kpis.pendingApproval }), _jsx("span", { className: "text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded", children: "Host/Sec" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Overstays" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-rose-700", children: kpis.overstays }), _jsx("span", { className: "text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded", children: "Breach" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Verification Due" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-blue-700", children: kpis.verificationPending }), _jsx("span", { className: "text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded", children: "Queue" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "ESG Auto-Capture" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsxs("span", { className: "text-2xl font-bold text-teal-700", children: [kpis.esgRate, "%"] }), _jsx("span", { className: "text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded", children: "Scope 3" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-100", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(UserCheck, { size: 16, className: "text-emerald-600" }), _jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Live On-Premises Visitors" })] }), _jsxs(Button, { size: "dense", variant: "ghost", onClick: () => handleSelectSubView('INSIDE'), children: ["View All (", kpis.inside, ")"] })] }), _jsx("div", { className: "mt-3 divide-y divide-slate-100", children: visitors.filter(v => v.status === 'ON_PREMISES').map(v => (_jsxs("div", { className: "py-2.5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-bold text-slate-900", children: v.name }), v.overstayMinutes && (_jsxs("span", { className: "px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded", children: ["OVERSTAY +", v.overstayMinutes, "m"] }))] }), _jsxs("span", { className: "text-[11px] text-slate-500", children: [v.company, " \u2022 Host: ", v.host] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Button, { size: "dense", variant: "secondary", onClick: () => { setSelectedVisitor(v); setIsCheckOutModalOpen(true); }, children: "Check Out" }), _jsx(Button, { size: "dense", variant: "ghost", onClick: () => { setSelectedVisitor(v); setIsTraceabilityDrawerOpen(true); }, children: "Trace" })] })] }, v.id))) })] }), _jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-100", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { size: 16, className: "text-amber-600" }), _jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Pending Approvals & Verification" })] }), _jsx(Button, { size: "dense", variant: "ghost", onClick: () => handleSelectSubView('APPROVALS'), children: "View Queue" })] }), _jsx("div", { className: "mt-3 divide-y divide-slate-100", children: visitors.filter(v => v.status === 'PENDING').map(v => (_jsxs("div", { className: "py-2.5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-xs font-bold text-slate-900", children: v.name }), _jsxs("div", { className: "text-[11px] text-slate-500", children: [v.company, " \u2022 Purpose: ", v.purpose, " \u2022 Host: ", v.host] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Button, { size: "dense", variant: "primary", onClick: () => { setSelectedVisitor(v); setIsApproveModalOpen(true); }, children: "Approve" }), _jsx(Button, { size: "dense", variant: "secondary", onClick: () => {
                                                                setVisitors(prev => prev.map(item => item.id === v.id ? { ...item, status: 'REJECTED' } : item));
                                                            }, children: "Reject" })] })] }, v.id))) })] })] })] })), (subView === 'ALL' || subView === 'EXPECTED' || subView === 'INSIDE' || subView === 'APPROVALS' || subView === 'OVERSTAYS' || subView === 'COMPLETED' || subView === 'VIP' || subView === 'GROUP' || subView === 'WALK_IN' || subView === 'VERIFICATION_QUEUE') && (_jsxs(Card, { className: "bg-white border border-slate-200", children: [_jsxs("div", { className: "p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-[280px]", children: [_jsxs("div", { className: "relative flex-1", children: [_jsx(Search, { size: 14, className: "absolute left-2.5 top-2.5 text-slate-400" }), _jsx("input", { type: "text", placeholder: "Search visitor by name, reference, company or host...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), className: "w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900" })] }), _jsxs("select", { value: statusFilter, onChange: e => setStatusFilter(e.target.value), className: "text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700", children: [_jsx("option", { value: "ALL", children: "All Statuses" }), _jsx("option", { value: "PENDING", children: "Pending" }), _jsx("option", { value: "APPROVED", children: "Approved" }), _jsx("option", { value: "ON_PREMISES", children: "On Premises" }), _jsx("option", { value: "COMPLETED", children: "Completed" }), _jsx("option", { value: "REJECTED", children: "Rejected" })] }), _jsxs("select", { value: categoryFilter, onChange: e => setCategoryFilter(e.target.value), className: "text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700", children: [_jsx("option", { value: "ALL", children: "All Categories" }), _jsx("option", { value: "NEW_VISITOR", children: "New Visitor" }), _jsx("option", { value: "REPEATED_VISITOR", children: "Repeated Visitor" }), _jsx("option", { value: "VIP_VISITOR", children: "VIP Visitor" }), _jsx("option", { value: "AUDITOR", children: "Auditor" }), _jsx("option", { value: "CONSULTANT", children: "Consultant" }), _jsx("option", { value: "INTERVIEW_CANDIDATE", children: "Candidate" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Button, { size: "dense", variant: "secondary", onClick: () => handleSelectSubView('NEW'), children: [_jsx(UserPlus, { size: 14 }), _jsx("span", { children: "Register Visitor" })] }), _jsx(Button, { size: "dense", variant: "ghost", onClick: () => handleSelectSubView('WALK_IN'), children: _jsx("span", { children: "Fast Walk-In" }) })] })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left border-collapse text-xs", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold", children: [_jsx("th", { className: "py-2.5 px-3", children: "Reference" }), _jsx("th", { className: "py-2.5 px-3", children: "Visitor Name" }), _jsx("th", { className: "py-2.5 px-3", children: "Company / Org" }), _jsx("th", { className: "py-2.5 px-3", children: "Purpose & Category" }), _jsx("th", { className: "py-2.5 px-3", children: "Host Sponsor" }), _jsx("th", { className: "py-2.5 px-3", children: "Schedule" }), _jsx("th", { className: "py-2.5 px-3", children: "Transport Vector" }), _jsx("th", { className: "py-2.5 px-3", children: "Status" }), _jsx("th", { className: "py-2.5 px-3 text-right", children: "Gate Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: filteredVisitors.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "py-8 text-center text-slate-400", children: "No visitor records found matching criteria." }) })) : (filteredVisitors.map(v => (_jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [_jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-slate-800", children: v.referenceNumber }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx("div", { className: "font-bold text-slate-900", children: v.name }), _jsx("div", { className: "text-[11px] text-slate-500", children: v.phone })] }), _jsxs("td", { className: "py-2.5 px-3 text-slate-700", children: [_jsx("div", { children: v.company }), v.designation && _jsx("div", { className: "text-[11px] text-slate-500", children: v.designation })] }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx("div", { className: "font-semibold text-slate-800", children: v.purpose }), _jsx("span", { className: "text-[10px] text-slate-500 uppercase", children: v.visitorCategory })] }), _jsx("td", { className: "py-2.5 px-3 text-slate-700", children: v.host }), _jsxs("td", { className: "py-2.5 px-3 text-slate-600", children: [_jsx("div", { children: new Date(v.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }), _jsx("div", { className: "text-[10px] text-slate-400", children: new Date(v.scheduledStart).toLocaleDateString() })] }), _jsxs("td", { className: "py-2.5 px-3", children: [v.transport ? (_jsxs("div", { className: "flex items-center gap-1.5 text-slate-700", children: [_jsx(Car, { size: 13, className: "text-slate-400" }), _jsxs("span", { children: [v.transport.mode, " (", v.transport.distanceKm, " km)"] })] })) : (_jsx("span", { className: "text-slate-400", children: "Not recorded" })), v.esgActivity && (_jsxs("div", { className: "text-[10px] text-teal-700 font-semibold flex items-center gap-1", children: [_jsx(Leaf, { size: 10 }), _jsx("span", { children: v.esgActivity.kgCO2e ? `${v.esgActivity.kgCO2e} kg CO2e` : 'Pending Calc' })] }))] }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx(StatusBadge, { status: v.status === 'ON_PREMISES' ? 'ON_PREMISES' :
                                                            v.status === 'APPROVED' ? 'approved' :
                                                                v.status === 'PENDING' ? 'pending' :
                                                                    v.status === 'COMPLETED' ? 'COMPLETED' : 'rejected', label: v.status === 'ON_PREMISES' ? 'INSIDE' :
                                                            v.status === 'APPROVED' ? 'APPROVED' :
                                                                v.status === 'PENDING' ? 'PENDING' : v.status }), v.overstayMinutes && (_jsxs("div", { className: "text-[10px] font-bold text-rose-600 mt-0.5", children: ["+", v.overstayMinutes, "m Overstay"] }))] }), _jsx("td", { className: "py-2.5 px-3 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [v.status === 'PENDING' && (_jsx(Button, { size: "dense", variant: "primary", onClick: () => { setSelectedVisitor(v); setIsApproveModalOpen(true); }, children: "Approve" })), v.status === 'APPROVED' && (_jsx(Button, { size: "dense", variant: "primary", onClick: () => { setSelectedVisitor(v); setIsCheckInModalOpen(true); }, children: "Check In" })), v.status === 'ON_PREMISES' && (_jsx(Button, { size: "dense", variant: "secondary", onClick: () => { setSelectedVisitor(v); setIsCheckOutModalOpen(true); }, children: "Check Out" })), (v.status === 'APPROVED' || v.status === 'ON_PREMISES') && (_jsx("button", { onClick: () => { setSelectedVisitor(v); setIsEPassModalOpen(true); }, className: "p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded", title: "View QR e-Pass", children: _jsx(QrCode, { size: 15 }) })), _jsx("button", { onClick: () => { setSelectedVisitor(v); setIsTraceabilityDrawerOpen(true); }, className: "p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded", title: "Audit & Traceability", children: _jsx(ExternalLink, { size: 15 }) })] }) })] }, v.id)))) })] }) })] })), subView === 'NEW' && (_jsxs(Card, { className: "bg-white border border-slate-200 p-6 max-w-4xl mx-auto", children: [_jsxs("div", { className: "border-b border-slate-200 pb-4 mb-6", children: [_jsx("h2", { className: "text-base font-bold text-slate-900", children: "New Visitor Pre-Registration & ESG Activity Capture" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Captures visitor profile, schedule, and operational mobility vectors in-flow without exposing raw Scope 3 formulas." })] }), _jsxs("form", { onSubmit: handleFormSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-3", children: "Section A \u2014 Visitor Identity" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Full Legal Name *" }), _jsx("input", { type: "text", required: true, value: formName, onChange: e => setFormName(e.target.value), placeholder: "e.g. Ramesh Chandran", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Mobile Number *" }), _jsx("input", { type: "tel", required: true, value: formPhone, onChange: e => setFormPhone(e.target.value), placeholder: "+91-9884012345", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Email Address" }), _jsx("input", { type: "email", value: formEmail, onChange: e => setFormEmail(e.target.value), placeholder: "ramesh@company.com", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Company / Organization *" }), _jsx("input", { type: "text", required: true, value: formCompany, onChange: e => setFormCompany(e.target.value), placeholder: "Organization Name", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Designation" }), _jsx("input", { type: "text", value: formDesignation, onChange: e => setFormDesignation(e.target.value), placeholder: "e.g. Quality Auditor", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Visitor Classification" }), _jsxs("select", { value: formCategory, onChange: e => setFormCategory(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1", children: [_jsx("option", { value: "NEW_VISITOR", children: "New General Visitor" }), _jsx("option", { value: "REPEATED_VISITOR", children: "Repeated Visitor" }), _jsx("option", { value: "VIP_VISITOR", children: "VIP Executive" }), _jsx("option", { value: "AUDITOR", children: "Auditor" }), _jsx("option", { value: "CONSULTANT", children: "Consultant" }), _jsx("option", { value: "GOVERNMENT_OFFICIAL", children: "Government / Official" }), _jsx("option", { value: "INTERVIEW_CANDIDATE", children: "Interview Candidate" })] })] })] })] }), _jsxs("div", { className: "border-t border-slate-100 pt-5", children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-3", children: "Section B \u2014 Visit Details & Host" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Visit Purpose" }), _jsxs("select", { value: formPurpose, onChange: e => setFormPurpose(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1", children: [_jsx("option", { value: "MEETING", children: "Business Meeting" }), _jsx("option", { value: "AUDIT", children: "Safety / Environmental Audit" }), _jsx("option", { value: "INSPECTION", children: "Plant Equipment Inspection" }), _jsx("option", { value: "TRAINING", children: "Technical Training" }), _jsx("option", { value: "INTERVIEW", children: "Candidate Interview" }), _jsx("option", { value: "CONSULTATION", children: "Engineering Consultation" }), _jsx("option", { value: "SITE_VISIT", children: "Executive Site Visit" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Designated Plant Host *" }), _jsxs("select", { value: formHost, onChange: e => setFormHost(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1", children: [_jsx("option", { value: "Vikram Mehta (Plant Lead)", children: "Vikram Mehta (Plant Operations)" }), _jsx("option", { value: "Kavita Nair (EHS Head)", children: "Kavita Nair (EHS Head)" }), _jsx("option", { value: "Suresh Babu (VP Operations)", children: "Suresh Babu (VP Operations)" }), _jsx("option", { value: "Arun Kumar (Facilities Mgr)", children: "Arun Kumar (Facilities)" }), _jsx("option", { value: "Pooja Iyer (HR Talent)", children: "Pooja Iyer (HR)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Booking Mode" }), _jsxs("select", { value: formBookingMode, onChange: e => setFormBookingMode(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1", children: [_jsx("option", { value: "RESERVED", children: "Reserved Pre-Booking" }), _jsx("option", { value: "WALK_IN", children: "Walk-In (On-Spot)" }), _jsx("option", { value: "GROUP", children: "Group Delegation" }), _jsx("option", { value: "EMERGENCY", children: "Emergency Entry" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Visit Date" }), _jsx("input", { type: "date", value: formDate, onChange: e => setFormDate(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Scheduled Arrival" }), _jsx("input", { type: "time", value: formStartTime, onChange: e => setFormStartTime(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Scheduled Departure" }), _jsx("input", { type: "time", value: formEndTime, onChange: e => setFormEndTime(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] })] })] }), _jsxs("div", { className: "border-t border-slate-100 pt-5", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Car, { size: 16, className: "text-teal-700" }), _jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider", children: "Section D \u2014 Transport & Mobility Vectors" })] }), _jsx("span", { className: "text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded", children: "Embedded In-Flow" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Transport Mode" }), _jsxs("select", { value: formTransportMode, onChange: e => setFormTransportMode(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1", children: [_jsx("option", { value: "CAR", children: "Car" }), _jsx("option", { value: "TWO_WHEELER", children: "Two-Wheeler" }), _jsx("option", { value: "BUS", children: "Bus / Shuttle" }), _jsx("option", { value: "TRAIN", children: "Rail / Train" }), _jsx("option", { value: "FLIGHT", children: "Flight / Air" }), _jsx("option", { value: "TAXI_CAB", children: "Taxi / Cab" }), _jsx("option", { value: "WALKING", children: "Walking (Zero Emission)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Ownership" }), _jsxs("select", { value: formOwnership, onChange: e => setFormOwnership(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1", children: [_jsx("option", { value: "PERSONAL", children: "Personal" }), _jsx("option", { value: "COMPANY", children: "Company Pool" }), _jsx("option", { value: "HIRED", children: "Hired / Rental" }), _jsx("option", { value: "PUBLIC", children: "Public Transit" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Fuel Type" }), _jsxs("select", { value: formFuelType, onChange: e => setFormFuelType(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1", children: [_jsx("option", { value: "PETROL", children: "Petrol" }), _jsx("option", { value: "DIESEL", children: "Diesel" }), _jsx("option", { value: "ELECTRIC", children: "Electric (EV)" }), _jsx("option", { value: "CNG", children: "CNG" }), _jsx("option", { value: "HYBRID_PETROL", children: "Hybrid" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Vehicle Occupancy" }), _jsx("input", { type: "number", min: 1, max: 50, value: formOccupancy, onChange: e => setFormOccupancy(Number(e.target.value)), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Journey Origin" }), _jsx("input", { type: "text", value: formOrigin, onChange: e => setFormOrigin(e.target.value), placeholder: "e.g. Bengaluru, Airport, Hotel", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Destination" }), _jsx("input", { type: "text", value: formDestination, onChange: e => setFormDestination(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Distance (km)" }), _jsx("input", { type: "number", value: formDistance, onChange: e => {
                                                            setFormDistance(Number(e.target.value));
                                                            setFormDistanceProvenance('USER_PROVIDED');
                                                        }, className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Provenance" }), _jsx("div", { className: "text-xs p-2 bg-slate-50 border border-slate-200 rounded mt-1 text-slate-600 font-mono", children: formDistanceProvenance })] })] })] }), _jsxs("div", { className: "bg-slate-50 border border-slate-200 rounded-md p-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Leaf, { size: 16, className: "text-teal-700" }), _jsx("h4", { className: "text-xs font-bold text-slate-900", children: "Activity & Sustainability Summary" })] }), _jsx("span", { className: "text-[11px] text-teal-800 font-semibold", children: "Automatic Cross-Cutting Capture" })] }), _jsx("p", { className: "text-[11px] text-slate-600 mt-1", children: "Operational mobility data recorded automatically for ESG Scope 3 Category 7 (Employee and Visitor Commuting). Emission factors and verified CO2e accounting are managed centrally by the corporate ESG engine." }), _jsxs("div", { className: "mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs", children: [_jsxs("div", { className: "bg-white p-2 rounded border border-slate-200", children: [_jsx("span", { className: "text-[10px] text-slate-400", children: "Activity Type" }), _jsx("div", { className: "font-semibold text-slate-800", children: "Visitor Transit" })] }), _jsxs("div", { className: "bg-white p-2 rounded border border-slate-200", children: [_jsx("span", { className: "text-[10px] text-slate-400", children: "Recorded Distance" }), _jsxs("div", { className: "font-semibold text-slate-800", children: [formDistance, " km (", formDistanceProvenance, ")"] })] }), _jsxs("div", { className: "bg-white p-2 rounded border border-slate-200", children: [_jsx("span", { className: "text-[10px] text-slate-400", children: "Vehicle Vector" }), _jsxs("div", { className: "font-semibold text-slate-800", children: [formTransportMode, " \u2022 ", formFuelType] })] }), _jsxs("div", { className: "bg-white p-2 rounded border border-slate-200", children: [_jsx("span", { className: "text-[10px] text-slate-400", children: "GHG Status" }), _jsx("div", { className: "font-semibold text-teal-700", children: "Auto-Linked on Submit" })] })] })] }), _jsxs("div", { className: "flex items-center justify-end gap-3 pt-4 border-t border-slate-200", children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => handleSelectSubView('ALL'), children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", children: "Save & Submit for Approval" })] })] })] })), subView === 'REPEATED' && (_jsxs(Card, { className: "bg-white border border-slate-200 p-6 max-w-2xl mx-auto space-y-4", children: [_jsxs("div", { className: "border-b border-slate-200 pb-3", children: [_jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Returning Visitor Fast Lookup" }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: "Instant mobile or government ID profile resolution. Reuses verified history without overwriting previous visit records." })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "text", placeholder: "Enter mobile number or government ID (e.g. 9444098765)...", value: lookupPhone, onChange: e => setLookupPhone(e.target.value), className: "flex-1 text-xs p-2 border border-slate-200 rounded" }), _jsxs(Button, { variant: "primary", onClick: handleLookupPhone, children: [_jsx(Search, { size: 14 }), _jsx("span", { children: "Lookup Profile" })] })] }), matchedCandidate ? (_jsxs("div", { className: "p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded", children: "Verified Profile Match (100%)" }), _jsx("h3", { className: "text-sm font-bold text-slate-900 mt-1", children: matchedCandidate.name }), _jsxs("p", { className: "text-xs text-slate-600", children: [matchedCandidate.company, " \u2022 ", matchedCandidate.phone] })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-xs font-bold text-slate-900", children: "Total Visits: 2" }), _jsxs("div", { className: "text-[11px] text-slate-500", children: ["Last: ", matchedCandidate.scheduledStart.split('T')[0]] })] })] }), _jsxs("div", { className: "border-t border-emerald-200 pt-3 flex items-center justify-between", children: [_jsxs("span", { className: "text-xs text-slate-600", children: ["Previous Transport: ", matchedCandidate.transport?.mode, " (", matchedCandidate.transport?.origin, " - ", matchedCandidate.transport?.destination, ")"] }), _jsxs(Button, { size: "dense", variant: "primary", onClick: () => {
                                            handleSelectSubView('NEW');
                                        }, children: ["Create New Visit for ", matchedCandidate.name.split(' ')[0]] })] })] })) : lookupPhone && (_jsxs("div", { className: "p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500", children: ["No matching returning visitor found for \"", lookupPhone, "\". Click \"Register Visitor\" to create a new profile."] }))] })), subView === 'TRACEABILITY' && (_jsxs(Card, { className: "bg-white border border-slate-200 p-6 space-y-4", children: [_jsxs("div", { className: "border-b border-slate-200 pb-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Leaf, { size: 18, className: "text-teal-700" }), _jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Bidirectional Visitor ESG Activity Traceability Ledger" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-0.5", children: "Full cryptographic and relational provenance chain: Visitor Transaction \u2194 Normalized Transport \u2194 GHG Activity \u2194 Calculation Hash \u2194 Audit Ledger." })] }), _jsx("span", { className: "text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200", children: "ISO 14064 & GHG Protocol Traceable" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-left text-xs border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold", children: [_jsx("th", { className: "p-2.5", children: "Visitor Reference" }), _jsx("th", { className: "p-2.5", children: "Visitor & Company" }), _jsx("th", { className: "p-2.5", children: "Transport Mode & Distance" }), _jsx("th", { className: "p-2.5", children: "GHG Activity ID" }), _jsx("th", { className: "p-2.5", children: "Scope & Category" }), _jsx("th", { className: "p-2.5", children: "Factor Used" }), _jsx("th", { className: "p-2.5", children: "Calculated Emissions" }), _jsx("th", { className: "p-2.5", children: "Audit Hash" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: visitors.filter(v => v.transport).map(v => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "p-2.5 font-mono font-bold text-slate-800", children: v.referenceNumber }), _jsxs("td", { className: "p-2.5", children: [_jsx("div", { className: "font-semibold text-slate-900", children: v.name }), _jsx("div", { className: "text-[11px] text-slate-500", children: v.company })] }), _jsxs("td", { className: "p-2.5", children: [_jsxs("div", { children: [v.transport?.mode, " (", v.transport?.fuelType, ")"] }), _jsxs("div", { className: "text-[11px] text-slate-500", children: [v.transport?.distanceKm, " km \u2022 ", v.transport?.provenance] })] }), _jsx("td", { className: "p-2.5 font-mono text-slate-700", children: v.esgActivity?.id || 'GHA-PENDING' }), _jsx("td", { className: "p-2.5", children: _jsx("span", { className: "px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[10px]", children: "Scope 3 Cat 7" }) }), _jsx("td", { className: "p-2.5 text-slate-600 font-mono text-[11px]", children: "DEFRA-2026.1 (0.1708 kg/km)" }), _jsx("td", { className: "p-2.5 font-bold text-teal-700", children: v.esgActivity?.kgCO2e ? `${v.esgActivity.kgCO2e} kg CO2e` : 'Pending' }), _jsx("td", { className: "p-2.5 font-mono text-[10px] text-slate-400", children: "SHA256:7f9a2b4..." })] }, v.id))) })] }) })] })), isEPassModalOpen && selectedVisitor && (_jsx(Modal, { isOpen: isEPassModalOpen, onClose: () => setIsEPassModalOpen(false), title: "Industrial Plant Visitor Electronic Pass (e-Pass)", children: _jsxs("div", { className: "p-6 bg-slate-50 text-center space-y-4", children: [_jsxs("div", { className: "bg-white border-2 border-slate-800 rounded-lg p-5 shadow-sm inline-block max-w-sm w-full text-left", children: [_jsxs("div", { className: "border-b-2 border-slate-900 pb-3 flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("span", { className: "text-[9px] font-black uppercase tracking-wider text-slate-500", children: "Security Access Badge" }), _jsx("h3", { className: "text-base font-black text-slate-900", children: selectedVisitor.siteName })] }), _jsx("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded", children: "AUTHORIZED" })] }), _jsxs("div", { className: "py-4 flex gap-4 items-center", children: [_jsx("div", { className: "p-2 bg-slate-100 border border-slate-300 rounded inline-block", children: _jsx(QrCode, { size: 96, className: "text-slate-900" }) }), _jsxs("div", { className: "text-xs space-y-1", children: [_jsx("div", { className: "font-mono font-bold text-slate-900", children: selectedVisitor.referenceNumber }), _jsx("div", { className: "text-sm font-bold text-slate-900", children: selectedVisitor.name }), _jsx("div", { className: "text-slate-600", children: selectedVisitor.company }), _jsxs("div", { className: "text-[11px] text-slate-500", children: ["Host: ", selectedVisitor.host] })] })] }), _jsxs("div", { className: "border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex justify-between", children: [_jsxs("span", { children: ["Valid: ", new Date(selectedVisitor.scheduledStart).toLocaleDateString()] }), _jsxs("span", { children: ["Time: ", new Date(selectedVisitor.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), " - ", new Date(selectedVisitor.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] })] })] }), _jsx("p", { className: "text-[11px] text-slate-500", children: "Opaque cryptographic QR token. Raw identity documents and personal PII are strictly excluded from barcode payload." }), _jsxs("div", { className: "flex justify-center gap-2", children: [_jsxs(Button, { size: "dense", variant: "secondary", onClick: () => window.print(), children: [_jsx(Printer, { size: 14 }), _jsx("span", { children: "Print Badge" })] }), _jsx(Button, { size: "dense", variant: "primary", onClick: () => setIsEPassModalOpen(false), children: "Done" })] })] }) })), isCheckInModalOpen && selectedVisitor && (_jsx(Modal, { isOpen: isCheckInModalOpen, onClose: () => setIsCheckInModalOpen(false), title: "Gate Security Check-In Authorization", children: _jsxs("div", { className: "p-5 space-y-4 text-xs", children: [_jsxs("div", { className: "bg-slate-50 p-3 rounded border border-slate-200 space-y-1", children: [_jsxs("div", { className: "font-bold text-slate-900", children: [selectedVisitor.name, " (", selectedVisitor.referenceNumber, ")"] }), _jsxs("div", { className: "text-slate-600", children: [selectedVisitor.company, " \u2022 Host: ", selectedVisitor.host] }), _jsxs("div", { className: "text-slate-500", children: ["Scheduled: ", selectedVisitor.scheduledStart.split('T')[1]?.substring(0, 5), " - ", selectedVisitor.scheduledEnd.split('T')[1]?.substring(0, 5)] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "font-semibold text-slate-700", children: "Pre-Entry Verification Checklist" }), _jsxs("div", { className: "flex items-center gap-2 text-emerald-700", children: [_jsx(CheckCircle2, { size: 16 }), _jsx("span", { children: "Host Approval: Granted" })] }), _jsxs("div", { className: "flex items-center gap-2 text-emerald-700", children: [_jsx(CheckCircle2, { size: 16 }), _jsx("span", { children: "Identity Document: Verified" })] }), _jsxs("div", { className: "flex items-center gap-2 text-emerald-700", children: [_jsx(CheckCircle2, { size: 16 }), _jsxs("span", { children: ["Transport Vector: ", selectedVisitor.transport?.mode || 'Logged'] })] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-3 border-t border-slate-200", children: [_jsx(Button, { variant: "secondary", onClick: () => setIsCheckInModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => handleCheckIn(selectedVisitor.id), children: "Authorize Entry & Check In" })] })] }) })), isCheckOutModalOpen && selectedVisitor && (_jsx(Modal, { isOpen: isCheckOutModalOpen, onClose: () => setIsCheckOutModalOpen(false), title: "Gate Security Check-Out", children: _jsxs("div", { className: "p-5 space-y-4 text-xs", children: [_jsxs("p", { className: "text-slate-600", children: ["Confirm departure for ", _jsx("strong", { children: selectedVisitor.name }), " (", selectedVisitor.referenceNumber, "). This will close the active on-premises session and decrement the live emergency muster count."] }), _jsxs("div", { className: "flex justify-end gap-2 pt-3 border-t border-slate-200", children: [_jsx(Button, { variant: "secondary", onClick: () => setIsCheckOutModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "danger", onClick: () => handleCheckOut(selectedVisitor.id), children: "Confirm Departure & Exit" })] })] }) })), isApproveModalOpen && selectedVisitor && (_jsx(Modal, { isOpen: isApproveModalOpen, onClose: () => setIsApproveModalOpen(false), title: "Host Visit Approval", children: _jsxs("div", { className: "p-5 space-y-4 text-xs", children: [_jsxs("div", { className: "bg-slate-50 p-3 rounded border border-slate-200", children: [_jsx("div", { className: "font-bold text-slate-900", children: selectedVisitor.name }), _jsxs("div", { className: "text-slate-600", children: [selectedVisitor.company, " \u2022 Purpose: ", selectedVisitor.purpose] })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-3 border-t border-slate-200", children: [_jsx(Button, { variant: "secondary", onClick: () => setIsApproveModalOpen(false), children: "Cancel" }), _jsx(Button, { variant: "primary", onClick: () => handleApprove(selectedVisitor.id), children: "Approve Visit" })] })] }) })), isNewVisitorSuccessModalOpen && (_jsx(Modal, { isOpen: isNewVisitorSuccessModalOpen, onClose: () => setIsNewVisitorSuccessModalOpen(false), title: "Visit Transaction Created Successfully", children: _jsxs("div", { className: "p-6 text-center space-y-4", children: [_jsx("div", { className: "w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto", children: _jsx(CheckCircle2, { size: 24 }) }), _jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-bold text-slate-900", children: ["Reference: ", createdRefNumber] }), _jsx("p", { className: "text-xs text-slate-600 mt-1", children: "Visitor profile stored, host notification queued, and normalized transport mobility record linked to the ESG ledger." })] }), _jsx("div", { className: "flex justify-center gap-2", children: _jsx(Button, { variant: "primary", onClick: () => {
                                    setIsNewVisitorSuccessModalOpen(false);
                                    handleSelectSubView('ALL');
                                }, children: "View in All Visitors" }) })] }) })), isTraceabilityDrawerOpen && selectedVisitor && (_jsx(Drawer, { isOpen: isTraceabilityDrawerOpen, onClose: () => setIsTraceabilityDrawerOpen(false), title: `Traceability Chain: ${selectedVisitor.referenceNumber}`, children: _jsxs("div", { className: "p-4 space-y-5 text-xs", children: [_jsxs("div", { className: "bg-slate-50 p-3 rounded border border-slate-200 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-bold text-slate-900", children: "1. Source Operational Transaction" }), _jsx("span", { className: "px-1.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] rounded font-bold", children: "VISITOR" })] }), _jsxs("div", { className: "text-slate-700", children: ["Visitor: ", selectedVisitor.name] }), _jsxs("div", { className: "text-slate-500", children: ["Scheduled: ", selectedVisitor.scheduledStart] }), _jsxs("div", { className: "text-slate-500", children: ["Status: ", selectedVisitor.status] })] }), _jsxs("div", { className: "bg-slate-50 p-3 rounded border border-slate-200 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-bold text-slate-900", children: "2. Normalized Transport Vector" }), _jsx("span", { className: "px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[10px] rounded font-bold", children: "TRANSPORT" })] }), _jsxs("div", { className: "text-slate-700", children: ["Mode: ", selectedVisitor.transport?.mode, " (", selectedVisitor.transport?.fuelType, ")"] }), _jsxs("div", { className: "text-slate-500", children: ["Route: ", selectedVisitor.transport?.origin, " \u2192 ", selectedVisitor.transport?.destination] }), _jsxs("div", { className: "text-slate-500", children: ["Distance: ", selectedVisitor.transport?.distanceKm, " km (Provenance: ", selectedVisitor.transport?.provenance, ")"] })] }), _jsxs("div", { className: "bg-slate-50 p-3 rounded border border-slate-200 space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-bold text-slate-900", children: "3. Source-Linked GHG Activity Record" }), _jsx("span", { className: "px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold", children: "GHG" })] }), _jsx("div", { className: "font-mono text-slate-700", children: selectedVisitor.esgActivity?.id }), _jsxs("div", { className: "text-slate-500", children: ["Type: ", selectedVisitor.esgActivity?.activityType] }), _jsxs("div", { className: "text-slate-500", children: ["Quantity: ", selectedVisitor.esgActivity?.quantity, " ", selectedVisitor.esgActivity?.unit] }), _jsxs("div", { className: "font-bold text-teal-700", children: ["Calculated Emission: ", selectedVisitor.esgActivity?.kgCO2e ? `${selectedVisitor.esgActivity.kgCO2e} kg CO2e` : 'Pending'] })] }), _jsxs("div", { className: "bg-slate-50 p-3 rounded border border-slate-200 space-y-1", children: [_jsx("span", { className: "font-bold text-slate-900", children: "4. Immutable Append-Only Audit Trail" }), _jsxs("div", { className: "mt-2 text-[11px] space-y-1 text-slate-600 font-mono", children: [_jsxs("div", { children: ["[09:30] VISITOR_CREATED by ", selectedVisitor.host] }), _jsxs("div", { children: ["[09:32] TRANSPORT_NORMALIZED distance=", selectedVisitor.transport?.distanceKm, "km"] }), _jsxs("div", { children: ["[09:32] GHG_ACTIVITY_CREATED ", selectedVisitor.esgActivity?.id] }), selectedVisitor.actualEntry && _jsx("div", { children: "[09:45] GATE_ENTRY_RECORDED Gate 1" })] })] })] }) }))] }));
};
