import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { LayoutDashboard, Users, Handshake, HardHat, Wrench, Package, Truck, Compass, Shield, KeyRound, FileCheck, Flame, AlertOctagon, Leaf, BarChart3, Sparkles, Settings, Search, Menu, Tablet, CheckCircle2, UserPlus } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Banner, Card, NotificationCenter, CommandPalette, GlobalSearch, ContextSwitcher, SyncStatusIndicator, EntityDetailPage, StatusBadge } from '@vms/ui';
// Internal Views & Mock Data
import { DEMO_SITES, DEMO_NOTIFICATIONS, DEMO_CONTRACTORS, DEMO_MATERIALS, DEMO_VEHICLES, DEMO_SERVICES, DEMO_ACCESS_POINTS, DEMO_DOCUMENTS, DEMO_SAFETY, DEMO_ESG_RECORDS, DEMO_TIMELINE_EVENTS } from './mockData.js';
import { ExecutiveDashboardView } from './views/ExecutiveDashboardView.js';
import { OperationsDashboardView } from './views/OperationsDashboardView.js';
import { SecurityDashboardView } from './views/SecurityDashboardView.js';
import { GateModeView } from './views/GateModeView.js';
import { KioskWelcomeView } from './views/KioskWelcomeView.js';
import { GenericDomainListView } from './views/GenericDomainListView.js';
import { EmergencyModalView } from './views/EmergencyModalView.js';
import { MasterDataView } from './views/MasterDataView.js';
import { WorkflowBuilderView } from './views/WorkflowBuilderView.js';
import { TaskCenterView } from './views/TaskCenterView.js';
import { RulesEngineView } from './views/RulesEngineView.js';
import { VisitorManagementView } from './views/visitor/VisitorManagementView.js';
import { CustomerManagementView } from './views/customer/CustomerManagementView.js';
export const App = ({ initialRoute = '/dashboard', initialRole = 'SUPER_ADMIN' }) => {
    // Navigation & View Routing State
    const [activeRoute, setActiveRoute] = useState(initialRoute);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    // Authenticated Role & Scope State
    const [activeRole, setActiveRole] = useState(initialRole);
    const [activeSiteContext, setActiveSiteContext] = useState(DEMO_SITES[0]);
    // Command Palette & Global Search State
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
    // Detail Page Inspection State (Section 22)
    const [selectedDetailItem, setSelectedDetailItem] = useState(null);
    // Emergency & Offline State (Section 29 & Section 38)
    const [isEmergencyActive, setIsEmergencyActive] = useState(false);
    const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
    const [isSirenActive, setIsSirenActive] = useState(false);
    const [syncState, setSyncState] = useState('ONLINE');
    // Global Keyboard Shortcuts (Ctrl/Cmd + K for Command Palette)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    // Complete 18-Domain Navigation Hierarchy (Sections 5 & 6)
    const navDomains = [
        {
            id: 'dashboard',
            label: 'Dashboard',
            icon: _jsx(LayoutDashboard, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'SECURITY_GUARD', 'RECEPTIONIST', 'HOST', 'EHS_MANAGER', 'ESG_MANAGER', 'AUDITOR', 'MANAGEMENT'],
            items: [
                { route: '/dashboard', label: 'Executive Dashboard' },
                { route: '/dashboard/operations', label: 'Operations Dashboard' },
                { route: '/dashboard/security', label: 'Security Dashboard' },
            ],
        },
        {
            id: 'tasks',
            label: 'Task Center',
            icon: _jsx(CheckCircle2, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER', 'SECURITY_GUARD', 'RECEPTIONIST', 'HOST', 'EHS_MANAGER', 'ESG_MANAGER', 'AUDITOR', 'MANAGEMENT'],
            items: [
                { route: '/tasks', label: 'Pending Approvals' },
                { route: '/tasks/delegated', label: 'Delegated Tasks' },
                { route: '/tasks/overdue', label: 'Overdue & Escalated' },
                { route: '/tasks/history', label: 'Completed History' },
            ],
        },
        {
            id: 'visitors',
            label: 'Visitor',
            icon: _jsx(Users, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'RECEPTIONIST', 'SECURITY_GUARD', 'HOST', 'AUDITOR', 'MANAGEMENT'],
            items: [
                { route: '/visitors', label: 'All Visitors' },
                { route: '/visitors/dashboard', label: 'Visitor Operations KPI' },
                { route: '/visitors/new', label: 'New Pre-Registration' },
                { route: '/visitors/walk-in', label: 'Gate Walk-In (<60s)' },
                { route: '/visitors/repeated', label: 'Frequent Visitors' },
                { route: '/visitors/group', label: 'Group Delegations' },
                { route: '/visitors/vip', label: 'VIP Protocol' },
                { route: '/visitors/expected', label: 'Expected Today' },
                { route: '/visitors/inside', label: 'Currently Inside' },
                { route: '/visitors/approvals', label: 'Host Approvals' },
                { route: '/visitors/overstays', label: 'Overstay Queue' },
                { route: '/visitors/traceability', label: 'ESG Traceability Ledger' },
                { route: '/visitors/history', label: 'Historical Archives' },
            ],
        },
        {
            id: 'customers',
            label: 'Customer',
            icon: _jsx(Handshake, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'RECEPTIONIST', 'HOST', 'AUDITOR', 'MANAGEMENT', 'EHS_MANAGER', 'ESG_MANAGER'],
            items: [
                { route: '/customers', label: 'Customer Dashboard' },
                { route: '/customers/accounts', label: 'Customer Accounts' },
                { route: '/customers/representatives', label: 'Representatives' },
                { route: '/customers/visits', label: 'All Customer Visits' },
                { route: '/customers/new', label: 'New Customer Visit' },
                { route: '/customers/meetings', label: 'Customer Meetings' },
                { route: '/customers/audits', label: 'Customer Audits' },
                { route: '/customers/inspections', label: 'Customer Inspections' },
                { route: '/customers/quality', label: 'Quality Visits' },
                { route: '/customers/technical', label: 'Technical Visits' },
                { route: '/customers/plant', label: 'Plant Visits' },
                { route: '/customers/delegations', label: 'Delegations' },
                { route: '/customers/expected', label: 'Expected Today' },
                { route: '/customers/inside', label: 'Currently Inside' },
                { route: '/customers/approvals', label: 'Pending Approvals' },
                { route: '/customers/nda', label: 'Legal / NDA Requirements' },
                { route: '/customers/exceptions', label: 'Visit Exceptions' },
                { route: '/customers/completed', label: 'Completed Visits' },
                { route: '/customers/cancelled', label: 'Cancelled / No-Show' },
                { route: '/customers/history', label: 'Customer Visit History' },
                { route: '/customers/traceability', label: 'ESG Activity Traceability' },
            ],
        },
        {
            id: 'contractors',
            label: 'Contractor',
            icon: _jsx(HardHat, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'EHS_MANAGER', 'SECURITY_GUARD', 'HR', 'MANAGEMENT'],
            items: [
                { route: '/contractors', label: 'Contractor Companies' },
                { route: '/contractors/workers', label: 'Workers Roster' },
                { route: '/contractors/work-orders', label: 'Work Orders' },
                { route: '/contractors/attendance', label: 'Attendance' },
                { route: '/contractors/training', label: 'Safety Training' },
                { route: '/contractors/permits', label: 'Permits' },
                { route: '/contractors/compliance', label: 'Compliance & Induction' },
            ],
        },
        {
            id: 'services',
            label: 'Service / Work',
            icon: _jsx(Wrench, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'EHS_MANAGER', 'MANAGEMENT'],
            items: [
                { route: '/services', label: 'Service Requests' },
                { route: '/services/technicians', label: 'Technicians' },
                { route: '/services/work-orders', label: 'Hazardous Work Orders' },
                { route: '/services/locations', label: 'Work Locations' },
                { route: '/services/permits', label: 'Permits' },
                { route: '/services/completion', label: 'Completion Sign-offs' },
            ],
        },
        {
            id: 'materials',
            label: 'Material',
            icon: _jsx(Package, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'AUDITOR', 'MANAGEMENT'],
            items: [
                { route: '/materials/inward', label: 'Material Inward' },
                { route: '/materials/outward', label: 'Material Outward' },
                { route: '/materials/returnable', label: 'Returnable Asset Tracker' },
                { route: '/materials/non-returnable', label: 'Non-Returnable Consignments' },
                { route: '/materials/scrap', label: 'Scrap Dispatch' },
                { route: '/materials/samples', label: 'Quality Samples' },
                { route: '/materials/tools', label: 'Tools & Tackle' },
                { route: '/materials/equipment', label: 'Equipment Movement' },
            ],
        },
        {
            id: 'vehicles',
            label: 'Vehicle',
            icon: _jsx(Truck, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'AUDITOR', 'MANAGEMENT'],
            items: [
                { route: '/vehicles', label: 'Commercial Vehicles' },
                { route: '/vehicles/drivers', label: 'Driver Verification' },
                { route: '/vehicles/transporters', label: 'Transporters Registry' },
                { route: '/vehicles/documents', label: 'PUC & Insurance Documents' },
            ],
        },
        {
            id: 'transport',
            label: 'Transport',
            icon: _jsx(Compass, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'ESG_MANAGER', 'MANAGEMENT'],
            items: [
                { route: '/transport/activity', label: 'Mobility Activity' },
                { route: '/transport/journeys', label: 'Multi-Stop Journeys' },
                { route: '/transport/vehicle-activity', label: 'Vehicle Activity' },
                { route: '/transport/history', label: 'Mobility History' },
            ],
        },
        {
            id: 'gate',
            label: 'Gate Console',
            icon: _jsx(Shield, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'SECURITY_MANAGER'],
            items: [
                { route: '/gate', label: 'Live Gate (Gate Mode)' },
                { route: '/gate/entry', label: 'Inbound Lane' },
                { route: '/gate/exit', label: 'Outbound Lane' },
                { route: '/gate/passes', label: 'Gate Passes' },
                { route: '/gate/exceptions', label: 'Exceptions' },
                { route: '/gate/overstay', label: 'Overstay Queue' },
            ],
        },
        {
            id: 'access',
            label: 'Access',
            icon: _jsx(KeyRound, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_MANAGER'],
            items: [
                { route: '/access', label: 'Gate Turnstiles' },
                { route: '/access/zones', label: 'Zone Governance' },
                { route: '/access/policies', label: 'Security Policies' },
                { route: '/access/credentials', label: 'RFID Credentials' },
                { route: '/access/restricted', label: 'Restricted Areas' },
                { route: '/access/history', label: 'Access History' },
            ],
        },
        {
            id: 'documents',
            label: 'Documents',
            icon: _jsx(FileCheck, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'LEGAL', 'HR', 'EHS_MANAGER', 'AUDITOR'],
            items: [
                { route: '/documents', label: 'Document Repository' },
                { route: '/documents/verification', label: 'Verification Queue' },
                { route: '/documents/expiring', label: 'Expiring Ledger' },
                { route: '/documents/expired', label: 'Expired Documents' },
                { route: '/documents/legal', label: 'Legal Master' },
                { route: '/documents/nda', label: 'NDA Vault' },
            ],
        },
        {
            id: 'safety',
            label: 'Safety & EHS',
            icon: _jsx(Flame, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'EHS_MANAGER'],
            items: [
                { route: '/safety', label: 'EHS Induction' },
                { route: '/safety/induction', label: 'Safety Induction' },
                { route: '/safety/training', label: 'Safety Training' },
                { route: '/safety/ppe', label: 'PPE Compliance' },
                { route: '/safety/permits', label: 'Permit To Work (PTW)' },
                { route: '/safety/exceptions', label: 'Safety Exceptions' },
            ],
        },
        {
            id: 'emergency',
            label: 'Emergency',
            icon: _jsx(AlertOctagon, { size: 18, color: colors.status.danger.solid }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'SECURITY_GUARD', 'EHS_MANAGER', 'MANAGEMENT'],
            items: [
                { route: '/emergency', label: 'Live Occupancy' },
                { route: '/emergency/events', label: 'Emergency Events' },
                { route: '/emergency/muster', label: 'Muster Station Headcount' },
                { route: '/emergency/missing', label: 'Missing Persons' },
                { route: '/emergency/reports', label: 'Incident Reports' },
            ],
        },
        {
            id: 'esg',
            label: 'ESG / GHG',
            icon: _jsx(Leaf, { size: 18, color: colors.esg[600] }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'ESG_MANAGER', 'AUDITOR', 'MANAGEMENT'],
            items: [
                { route: '/esg', label: 'Activity Overview' },
                { route: '/esg/activity', label: 'Activity Ledger (Traceable)' },
                { route: '/esg/transport', label: 'Transport Carbon (Scope 3)' },
                { route: '/esg/material-transport', label: 'Material Transport' },
                { route: '/esg/emission-factors', label: 'Emission Factor Master' },
                { route: '/esg/calculations', label: 'Historical GHG Calculations' },
                { route: '/esg/scope-mapping', label: 'Scope Mapping Rules' },
                { route: '/esg/data-quality', label: 'Data Quality & Provenance' },
                { route: '/esg/reports', label: 'ESG Disclosures' },
            ],
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: _jsx(BarChart3, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT', 'AUDITOR'],
            items: [
                { route: '/analytics', label: 'Operations & Throughput' },
                { route: '/analytics/security', label: 'Security BI' },
                { route: '/analytics/visitors', label: 'Visitor Analytics' },
                { route: '/analytics/customers', label: 'Customer Analytics' },
                { route: '/analytics/contractors', label: 'Contractor Analytics' },
                { route: '/analytics/materials', label: 'Material Analytics' },
                { route: '/analytics/vehicles', label: 'Vehicle Analytics' },
                { route: '/analytics/transport', label: 'Transport Analytics' },
                { route: '/analytics/compliance', label: 'Compliance Analytics' },
                { route: '/analytics/esg', label: 'ESG Disclosures BI' },
            ],
        },
        {
            id: 'ai',
            label: 'AI Copilot',
            icon: _jsx(Sparkles, { size: 18, color: "#8b5cf6" }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'MANAGEMENT'],
            items: [
                { route: '/ai', label: 'Natural Language Console' },
            ],
        },
        {
            id: 'admin',
            label: 'Administration',
            icon: _jsx(Settings, { size: 18 }),
            roles: ['SUPER_ADMIN', 'SITE_ADMIN', 'IT_ADMIN'],
            items: [
                { route: '/admin', label: 'Multi-Tenant Setup' },
                { route: '/admin/users', label: 'User Directory' },
                { route: '/admin/roles', label: 'Roles & Privileges' },
                { route: '/admin/permissions', label: 'Permission Matrix' },
                { route: '/admin/sites', label: 'Sites & Facilities' },
                { route: '/admin/gates', label: 'Gates & Lanes' },
                { route: '/admin/zones', label: 'Zones & Turnstiles' },
                { route: '/admin/master-data', label: 'Master Data' },
                { route: '/admin/workflows', label: 'Workflow Builder' },
                { route: '/admin/rules', label: 'Business Rules Engine' },
                { route: '/admin/notifications', label: 'Notification Config' },
                { route: '/admin/integrations', label: 'ERP & ANPR Integrations' },
                { route: '/admin/audit', label: 'Audit Logs' },
                { route: '/admin/privacy', label: 'Privacy & Data Masking' },
                { route: '/admin/retention', label: 'Retention Policies' },
            ],
        },
    ];
    // Role-aware visibility filtering (Section 6)
    const visibleDomains = navDomains.filter((d) => d.roles.includes(activeRole));
    // Breadcrumbs Generator
    const getBreadcrumbs = () => {
        if (selectedDetailItem) {
            return [selectedDetailItem.entityType, selectedDetailItem.item.id || 'Entity Details'];
        }
        for (const d of navDomains) {
            const match = d.items.find((item) => item.route === activeRoute);
            if (match) {
                return [d.label, match.label];
            }
        }
        if (activeRoute === '/kiosk')
            return ['Terminals', 'Self-Service Kiosk'];
        return ['Dashboard', 'Executive Console'];
    };
    const breadcrumbs = getBreadcrumbs();
    // Column definitions for domain views
    const visitorColumns = [
        { key: 'id', header: 'Transaction ID', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'name', header: 'Visitor Name', sortable: true, render: (r) => _jsx("strong", { children: r.name }) },
        { key: 'company', header: 'Company', sortable: true },
        { key: 'purpose', header: 'Purpose of Visit' },
        { key: 'host', header: 'Host' },
        { key: 'time', header: 'Visit Window' },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
        { key: 'transportMode', header: 'Mobility (ESG)', render: (r) => _jsx("span", { style: { fontSize: '11px', color: colors.esg[700], fontWeight: 600 }, children: r.transportMode }) },
    ];
    const customerColumns = [
        { key: 'id', header: 'Customer Ref', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'account', header: 'Customer Account', sortable: true, render: (r) => _jsx("strong", { children: r.account }) },
        { key: 'agenda', header: 'Audit / Visit Agenda' },
        { key: 'lead', header: 'Customer Lead / Delegate' },
        { key: 'host', header: 'Corporate Host' },
        { key: 'ndaStatus', header: 'NDA Status', render: (r) => _jsx(StatusBadge, { status: r.ndaStatus === 'SIGNED' ? 'approved' : 'warning', size: "micro" }) },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
    ];
    const contractorColumns = [
        { key: 'id', header: 'Work Order ID', width: '140px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'company', header: 'Contractor Company', sortable: true, render: (r) => _jsx("strong", { children: r.company }) },
        { key: 'workOrder', header: 'Scope / SOW' },
        { key: 'workersCount', header: 'Workers Authorized', align: 'center' },
        { key: 'activeInside', header: 'Active on Site', align: 'center', render: (r) => _jsx("strong", { children: r.activeInside }) },
        { key: 'inductionStatus', header: 'Induction Status', render: (r) => _jsx(StatusBadge, { status: r.inductionStatus === 'VALID' ? 'approved' : 'danger', size: "micro" }) },
        { key: 'ptwStatus', header: 'Permit To Work (PTW)' },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
    ];
    const serviceColumns = [
        { key: 'id', header: 'Service Ticket', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'serviceType', header: 'Maintenance Scope', render: (r) => _jsx("strong", { children: r.serviceType }) },
        { key: 'equipment', header: 'Plant Asset / Machine' },
        { key: 'vendor', header: 'OEM Vendor' },
        { key: 'technician', header: 'Field Engineer' },
        { key: 'permitRequired', header: 'Required Permit' },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
    ];
    const materialColumns = [
        { key: 'id', header: 'Pass ID', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'challan', header: 'Challan Number', render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono }, children: r.challan }) },
        { key: 'type', header: 'Movement', render: (r) => _jsx("strong", { children: r.type }) },
        { key: 'classification', header: 'Classification' },
        { key: 'supplier', header: 'Supplier / Vendor' },
        { key: 'item', header: 'Material Description' },
        { key: 'grossWeight', header: 'Gross Weight' },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
    ];
    const vehicleColumns = [
        { key: 'id', header: 'Vehicle ID', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'plate', header: 'Registration Plate', render: (r) => _jsx("strong", { style: { fontFamily: typography.fontFamily.mono }, children: r.plate }) },
        { key: 'class', header: 'Vehicle Class' },
        { key: 'driver', header: 'Designated Driver' },
        { key: 'transporter', header: 'Transporter Agency' },
        { key: 'compliance', header: 'PUC / Compliance', render: (r) => _jsx(StatusBadge, { status: r.compliance === 'VALID' ? 'approved' : 'danger', size: "micro" }) },
        { key: 'fuel', header: 'Fuel Type' },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
    ];
    const accessColumns = [
        { key: 'id', header: 'Access ID', width: '120px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'zone', header: 'Security Zone', render: (r) => _jsx("strong", { children: r.zone }) },
        { key: 'gate', header: 'Terminal Hardware / Turnstile' },
        { key: 'type', header: 'Security Level' },
        { key: 'activeCount', header: 'Current Occupancy', align: 'center', render: (r) => _jsx("strong", { children: r.activeCount }) },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
    ];
    const documentColumns = [
        { key: 'id', header: 'Document Ref', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'name', header: 'Document Title', render: (r) => _jsx("strong", { children: r.name }) },
        { key: 'owner', header: 'Associated Entity' },
        { key: 'type', header: 'Classification' },
        { key: 'expiry', header: 'Expiration Date' },
        { key: 'verification', header: 'OCR Verification', render: (r) => _jsx(StatusBadge, { status: r.verification === 'VERIFIED' ? 'approved' : 'warning', size: "micro" }) },
        { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
    ];
    const esgColumns = [
        { key: 'id', header: 'Activity ID', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
        { key: 'domain', header: 'Source Domain', render: (r) => _jsx("strong", { children: r.domain }) },
        { key: 'sourceId', header: 'Transaction Ref', render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono }, children: r.sourceId }) },
        { key: 'mode', header: 'Mobility Mode' },
        { key: 'distance', header: 'Distance' },
        { key: 'occupancy', header: 'Occupancy' },
        { key: 'provenance', header: 'Provenance Tag', render: (r) => _jsx("span", { style: { padding: '1px 5px', backgroundColor: colors.slate[100], borderRadius: '2px', fontSize: '10px', fontWeight: 600 }, children: r.provenance }) },
        { key: 'scope', header: 'Assigned Scope', render: (r) => _jsx("span", { style: { color: colors.esg[700], fontWeight: 600 }, children: r.scope }) },
    ];
    // View Router Dispatcher (Section 41 Page Inventory)
    const renderMainContent = () => {
        // If Detail Page is Active (Section 22)
        if (selectedDetailItem) {
            const it = selectedDetailItem.item;
            return (_jsx(EntityDetailPage, { entityId: it.id || 'TXN-001', title: it.name || it.account || it.company || it.plate || it.item || 'Record Details', subtitle: it.company || it.transporter || it.workOrder || it.purpose || undefined, status: it.status || 'active', entityType: selectedDetailItem.entityType, onBack: () => setSelectedDetailItem(null), overviewFields: [
                    { label: 'Facility Context', value: activeSiteContext.siteName },
                    { label: 'Primary Contact / Host', value: it.host || it.driver || it.technician || 'Vikram Mehta' },
                    { label: 'Gate / Location', value: it.gate || activeSiteContext.gateName || 'Gate 1' },
                    { label: 'Validity Period', value: it.time || it.expiry || 'Current Shift' },
                ], timelineEvents: DEMO_TIMELINE_EVENTS, activityTrace: {
                    activityId: `ACT-${it.id || '9021'}`,
                    sourceTransactionId: it.id || 'TXN-001',
                    activityType: 'TRANSPORT_MOBILITY',
                    status: 'CAPTURED',
                    mode: it.transportMode || it.mode || 'CAR (Diesel Sedan)',
                    distanceKm: it.distanceKm || 42,
                    provenance: it.provenance || 'SYSTEM_ESTIMATED',
                    calculatedEmissions: '48.2 kg CO₂e (Scope 3 Cat 6)',
                }, documents: [
                    { name: 'Government Photo Identification', status: 'approved', expiry: '2028-12-31', type: 'GOVT_KYC' },
                    { name: 'Plant Safety Induction Certificate', status: 'approved', expiry: '2026-11-30', type: 'EHS_SAFETY' },
                ], accessPermissions: [
                    { zone: 'Administrative Lobby & Visitor Center', status: 'approved', gate: 'Turnstile A1', validUntil: '18:00 Today' },
                    { zone: 'Main Production Line 1 & 2', status: 'approved', gate: 'Turnstile C1', validUntil: '18:00 Today' },
                ], auditInfo: {
                    createdBy: 'Receptionist Desk REC-01',
                    createdAt: '2026-10-07 09:41 UTC',
                    lastUpdatedBy: 'Plant Security Gate Guard #04',
                    lastUpdatedAt: '2026-10-07 10:04 UTC',
                    sourceTransaction: it.id || 'TXN-001',
                    policyDecision: 'PERMITTED_BY_ABAC_POLICY',
                } }));
        }
        // 1. Kiosk Terminal
        if (activeRoute === '/kiosk') {
            return _jsx(KioskWelcomeView, { onExitKiosk: () => setActiveRoute('/dashboard') });
        }
        // 2. Gate Lane Consoles
        if (activeRoute === '/gate' || activeRoute === '/gate/entry' || activeRoute === '/gate/exit') {
            return _jsx(GateModeView, {});
        }
        // 3. Dashboards
        if (activeRoute === '/dashboard/operations') {
            return _jsx(OperationsDashboardView, {});
        }
        if (activeRoute === '/dashboard/security') {
            return _jsx(SecurityDashboardView, {});
        }
        if (activeRoute === '/dashboard') {
            return _jsx(ExecutiveDashboardView, {});
        }
        // 4. Visitor Management Domain (Part 6 Complete Module)
        if (activeRoute.startsWith('/visitors')) {
            let subView = 'ALL';
            if (activeRoute === '/visitors/dashboard')
                subView = 'DASHBOARD';
            else if (activeRoute === '/visitors/new')
                subView = 'NEW';
            else if (activeRoute === '/visitors/repeated')
                subView = 'REPEATED';
            else if (activeRoute === '/visitors/walk-in')
                subView = 'WALK_IN';
            else if (activeRoute === '/visitors/group')
                subView = 'GROUP';
            else if (activeRoute === '/visitors/vip')
                subView = 'VIP';
            else if (activeRoute === '/visitors/appointments')
                subView = 'APPOINTMENTS';
            else if (activeRoute === '/visitors/expected')
                subView = 'EXPECTED';
            else if (activeRoute === '/visitors/inside')
                subView = 'INSIDE';
            else if (activeRoute === '/visitors/approvals')
                subView = 'APPROVALS';
            else if (activeRoute === '/visitors/verification-queue')
                subView = 'VERIFICATION_QUEUE';
            else if (activeRoute === '/visitors/overstays')
                subView = 'OVERSTAYS';
            else if (activeRoute === '/visitors/completed')
                subView = 'COMPLETED';
            else if (activeRoute === '/visitors/cancelled')
                subView = 'CANCELLED';
            else if (activeRoute === '/visitors/history')
                subView = 'HISTORY';
            else if (activeRoute === '/visitors/profiles')
                subView = 'PROFILES';
            else if (activeRoute === '/visitors/traceability')
                subView = 'TRACEABILITY';
            else
                subView = 'ALL';
            return (_jsx(VisitorManagementView, { initialSubView: subView, currentRole: activeRole, onNavigateSubView: (nextSub) => {
                    const subToRoute = {
                        DASHBOARD: '/visitors/dashboard',
                        ALL: '/visitors',
                        NEW: '/visitors/new',
                        REPEATED: '/visitors/repeated',
                        WALK_IN: '/visitors/walk-in',
                        GROUP: '/visitors/group',
                        VIP: '/visitors/vip',
                        APPOINTMENTS: '/visitors/appointments',
                        EXPECTED: '/visitors/expected',
                        INSIDE: '/visitors/inside',
                        APPROVALS: '/visitors/approvals',
                        VERIFICATION_QUEUE: '/visitors/verification-queue',
                        OVERSTAYS: '/visitors/overstays',
                        COMPLETED: '/visitors/completed',
                        CANCELLED: '/visitors/cancelled',
                        HISTORY: '/visitors/history',
                        PROFILES: '/visitors/profiles',
                        TRACEABILITY: '/visitors/traceability',
                    };
                    setActiveRoute(subToRoute[nextSub] || '/visitors');
                } }));
        }
        // 6. Customer Management Domain (Part 7 Complete Module)
        if (activeRoute.startsWith('/customers')) {
            let subView = 'DASHBOARD';
            if (activeRoute === '/customers/accounts')
                subView = 'ACCOUNTS';
            else if (activeRoute === '/customers/representatives')
                subView = 'REPRESENTATIVES';
            else if (activeRoute === '/customers/visits')
                subView = 'VISITS';
            else if (activeRoute === '/customers/new')
                subView = 'NEW';
            else if (activeRoute === '/customers/meetings')
                subView = 'MEETINGS';
            else if (activeRoute === '/customers/audits')
                subView = 'AUDITS';
            else if (activeRoute === '/customers/inspections')
                subView = 'INSPECTIONS';
            else if (activeRoute === '/customers/quality')
                subView = 'QUALITY';
            else if (activeRoute === '/customers/technical')
                subView = 'TECHNICAL';
            else if (activeRoute === '/customers/plant')
                subView = 'PLANT';
            else if (activeRoute === '/customers/delegations')
                subView = 'DELEGATIONS';
            else if (activeRoute === '/customers/expected')
                subView = 'EXPECTED';
            else if (activeRoute === '/customers/inside')
                subView = 'INSIDE';
            else if (activeRoute === '/customers/approvals')
                subView = 'APPROVALS';
            else if (activeRoute === '/customers/nda')
                subView = 'NDA';
            else if (activeRoute === '/customers/exceptions')
                subView = 'EXCEPTIONS';
            else if (activeRoute === '/customers/completed')
                subView = 'COMPLETED';
            else if (activeRoute === '/customers/cancelled')
                subView = 'CANCELLED';
            else if (activeRoute === '/customers/history')
                subView = 'HISTORY';
            else if (activeRoute === '/customers/traceability')
                subView = 'TRACEABILITY';
            else
                subView = 'DASHBOARD';
            return (_jsx(CustomerManagementView, { initialSubView: subView, currentRole: activeRole, siteId: activeSiteContext.siteId, onNavigateSubView: (nextSub) => {
                    const subToRoute = {
                        DASHBOARD: '/customers',
                        ACCOUNTS: '/customers/accounts',
                        REPRESENTATIVES: '/customers/representatives',
                        VISITS: '/customers/visits',
                        NEW: '/customers/new',
                        MEETINGS: '/customers/meetings',
                        AUDITS: '/customers/audits',
                        INSPECTIONS: '/customers/inspections',
                        QUALITY: '/customers/quality',
                        TECHNICAL: '/customers/technical',
                        PLANT: '/customers/plant',
                        DELEGATIONS: '/customers/delegations',
                        EXPECTED: '/customers/expected',
                        INSIDE: '/customers/inside',
                        APPROVALS: '/customers/approvals',
                        NDA: '/customers/nda',
                        EXCEPTIONS: '/customers/exceptions',
                        COMPLETED: '/customers/completed',
                        CANCELLED: '/customers/cancelled',
                        HISTORY: '/customers/history',
                        TRACEABILITY: '/customers/traceability',
                    };
                    setActiveRoute(subToRoute[nextSub] || '/customers');
                } }));
        }
        // 7. Contractor Domain Routes (/contractors*)
        if (activeRoute.startsWith('/contractors')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Contractor Management", domainDescription: "Vendor masters, work orders, worker compliance rosters, and EHS safety inductions", data: DEMO_CONTRACTORS, columns: contractorColumns, onNewRecord: () => setActiveRoute('/visitors/new'), onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'CONTRACTOR' }), requiredCapability: "CONTRACTOR_READ" }));
        }
        // 8. Service / Work Routes (/services*)
        if (activeRoute.startsWith('/services')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Service & Maintenance Management", domainDescription: "OEM technician tickets, machine maintenance work orders, and hazardous permits", data: DEMO_SERVICES, columns: serviceColumns, onNewRecord: () => setActiveRoute('/visitors/new'), onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'CONTRACTOR' }), requiredCapability: "SERVICE_READ" }));
        }
        // 9. Material Logistics Routes (/materials*)
        if (activeRoute.startsWith('/materials')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Material Logistics & Weighbridge Passes", domainDescription: "Delivery challans, weighbridge inward/outward passes, scrap dispatch, and returnable escrows", data: DEMO_MATERIALS, columns: materialColumns, onNewRecord: () => setActiveRoute('/visitors/new'), onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'MATERIAL' }), requiredCapability: "MATERIAL_READ" }));
        }
        // 10. Vehicle Domain Routes (/vehicles*)
        if (activeRoute.startsWith('/vehicles')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Commercial Vehicle Hub", domainDescription: "Commercial freight fleet, driver license validation, breathalyzer logs, and transporter registry", data: DEMO_VEHICLES, columns: vehicleColumns, onNewRecord: () => setActiveRoute('/visitors/new'), onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'VEHICLE' }), requiredCapability: "VEHICLE_READ" }));
        }
        // 11. Transport Mobility Routes (/transport*)
        if (activeRoute.startsWith('/transport')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Transport & Mobility Ledger", domainDescription: "Normalized multi-modal commuter journeys, vehicle activities, and source-linked trips", data: DEMO_ESG_RECORDS, columns: esgColumns, onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'VEHICLE' }), requiredCapability: "TRANSPORT_READ" }));
        }
        // 12. Gate Subroutes (/gate/exceptions, /gate/passes, /gate/overstay)
        if (activeRoute.startsWith('/gate/')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Gate Passes & Exception Ledger", domainDescription: "Active gate passes, overstay queues, and denied entry audit trails", data: DEMO_MATERIALS, columns: materialColumns, onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'GATE_PASS' }), requiredCapability: "GATE_READ" }));
        }
        // 13. Access Domain Routes (/access*)
        if (activeRoute.startsWith('/access')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Physical Access Governance", domainDescription: "Turnstiles, UHF RFID readers, zone access matrices, and biometric credentials", data: DEMO_ACCESS_POINTS, columns: accessColumns, onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'GATE_PASS' }), requiredCapability: "ACCESS_READ" }));
        }
        // 14. Document Domain Routes (/documents*)
        if (activeRoute.startsWith('/documents')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Document Verification Vault", domainDescription: "Government KYC, Non-Disclosure Agreements, insurance policies, and expiring licenses", data: DEMO_DOCUMENTS, columns: documentColumns, onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'GATE_PASS' }), requiredCapability: "DOCUMENT_READ" }));
        }
        // 15. Safety Domain Routes (/safety*)
        if (activeRoute.startsWith('/safety')) {
            return (_jsx(GenericDomainListView, { domainTitle: "EHS Safety & Permits (PTW)", domainDescription: "Mandatory safety inductions, hot work permits, height permits, and PPE checklists", data: DEMO_SAFETY, columns: [
                    { key: 'id', header: 'Reference', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
                    { key: 'inductionType', header: 'Induction / Permit Name', render: (r) => _jsx("strong", { children: r.inductionType || r.permitType }) },
                    { key: 'passingScore', header: 'Criteria' },
                    { key: 'validityMonths', header: 'Validity (Months)', align: 'center' },
                    { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
                ], requiredCapability: "SAFETY_READ" }));
        }
        // 16. Emergency Domain Routes (/emergency*)
        if (activeRoute.startsWith('/emergency')) {
            return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: [_jsx(Banner, { type: "emergency", title: "EMERGENCY MUSTER CONSOLE", message: "Live site population and muster station headcounts active.", actionLabel: "Open Full Muster Console", onAction: () => setIsEmergencyModalOpen(true), isPersistent: true }), _jsx(OperationsDashboardView, {})] }));
        }
        // 17. ESG & GHG Domain Routes (/esg*)
        if (activeRoute.startsWith('/esg')) {
            return (_jsx(GenericDomainListView, { domainTitle: "ESG / GHG Activity Ledger", domainDescription: "Source-linked mobility and logistics activity automatically captured from operational transactions", data: DEMO_ESG_RECORDS, columns: esgColumns, onOpenDetail: (item) => setSelectedDetailItem({ item, entityType: 'VISITOR' }), requiredCapability: "ESG_ACTIVITY_READ" }));
        }
        // 18. Analytics BI Routes (/analytics*)
        if (activeRoute.startsWith('/analytics')) {
            return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsx("h2", { style: { margin: 0, fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }, children: "Operational & ESG Analytics" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: "Throughput BI, Turnstile Heatmaps, Contractor Compliance SLA, and Carbon Disclosures" })] }), _jsx(Button, { variant: "secondary", size: "dense", leftIcon: _jsx(BarChart3, { size: 14 }), children: "Export Analytics BI" })] }), _jsx(ExecutiveDashboardView, {})] }));
        }
        // 19. AI Copilot Route (/ai)
        if (activeRoute === '/ai') {
            return (_jsx(Card, { title: "Industrial Operations AI Copilot", subtitle: "Natural language query engine grounded in facility telemetry", children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px 0' }, children: [_jsxs("div", { style: { padding: '12px 16px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: radius.md, display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx(Sparkles, { size: 20, color: "#8b5cf6" }), _jsxs("div", { children: [_jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: '#581c87' }, children: "Operational Copilot Ready" }), _jsx("div", { style: { fontSize: typography.fontSize.xs.size, color: '#7e22ce' }, children: "Ask questions like: \"Which contractors exceeded authorized headcount today?\" or \"Summarize Scope 3 diesel freight emissions this week.\"" })] })] }), _jsxs("div", { style: { display: 'flex', gap: '8px' }, children: [_jsx("input", { type: "text", placeholder: "Ask the AI copilot about plant operations, gate queues, or emissions...", style: {
                                        flex: 1,
                                        height: '38px',
                                        padding: '0 12px',
                                        border: `1px solid ${colors.slate[300]}`,
                                        borderRadius: radius.md,
                                        fontSize: typography.fontSize.sm.size,
                                        outline: 'none',
                                    } }), _jsx(Button, { variant: "primary", size: "normal", rightIcon: _jsx(Sparkles, { size: 14 }), children: "Analyze" })] })] }) }));
        }
        // 20. Task Center (/tasks*)
        if (activeRoute.startsWith('/tasks')) {
            return _jsx(TaskCenterView, { userRole: activeRole });
        }
        // 21. Specific Enterprise Admin Workspaces (Part 5)
        if (activeRoute === '/admin/master-data') {
            return _jsx(MasterDataView, { userRole: activeRole });
        }
        if (activeRoute === '/admin/workflows') {
            return _jsx(WorkflowBuilderView, { userRole: activeRole });
        }
        if (activeRoute === '/admin/rules') {
            return _jsx(RulesEngineView, {});
        }
        // 22. General Administration Routes (/admin*)
        if (activeRoute.startsWith('/admin')) {
            return (_jsx(GenericDomainListView, { domainTitle: "Enterprise Administration", domainDescription: "Multi-tenant master data, facility sites, gates, zones, RBAC policies, and audit ledgers", data: [
                    { id: 'ADM-01', name: 'Chennai Radial Tyre Plant', type: 'MANUFACTURING_PLANT', gatesCount: 3, zonesCount: 8, status: 'active' },
                    { id: 'ADM-02', name: 'Pune Stamping & Assembly Plant', type: 'MANUFACTURING_PLANT', gatesCount: 2, zonesCount: 6, status: 'active' },
                    { id: 'ADM-03', name: 'Jamshedpur Heavy Logistics Complex', type: 'LOGISTICS_HUB', gatesCount: 4, zonesCount: 5, status: 'active' },
                ], columns: [
                    { key: 'id', header: 'Facility Code', width: '130px', sortable: true, render: (r) => _jsx("span", { style: { fontFamily: typography.fontFamily.mono, fontWeight: 600 }, children: r.id }) },
                    { key: 'name', header: 'Site Name', render: (r) => _jsx("strong", { children: r.name }) },
                    { key: 'type', header: 'Facility Classification' },
                    { key: 'gatesCount', header: 'Active Gates', align: 'center' },
                    { key: 'zonesCount', header: 'Security Zones', align: 'center' },
                    { key: 'status', header: 'Status', render: (r) => _jsx(StatusBadge, { status: r.status, size: "sm" }) },
                ], requiredCapability: "SYSTEM_ADMIN_MANAGE" }));
        }
        // Default fallback
        return _jsx(ExecutiveDashboardView, {});
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: colors.slate[50] }, children: [isEmergencyActive && (_jsx(Banner, { type: "emergency", title: "EMERGENCY MUSTER STATE ACTIVE", message: "Plant evacuation siren triggered for Chennai Facility. Turnstiles unlocked for egress.", actionLabel: "Open Muster Station Board", onAction: () => setIsEmergencyModalOpen(true), isPersistent: true })), _jsxs("header", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    height: '48px',
                    padding: '0 16px',
                    backgroundColor: colors.slate[900],
                    color: '#ffffff',
                    borderBottom: `1px solid ${colors.slate[800]}`,
                    zIndex: 100,
                    gap: '12px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("button", { type: "button", "aria-label": "Toggle Navigation Menu", onClick: () => setIsMobileMenuOpen(!isMobileMenuOpen), style: {
                                    background: 'none',
                                    border: 'none',
                                    color: '#ffffff',
                                    cursor: 'pointer',
                                    padding: '4px',
                                    display: 'flex',
                                }, children: _jsx(Menu, { size: 18 }) }), _jsxs("div", { style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    paddingRight: '8px',
                                    borderRight: `1px solid ${colors.slate[700]}`,
                                }, onClick: () => {
                                    setSelectedDetailItem(null);
                                    setActiveRoute('/dashboard');
                                }, children: [_jsx(Shield, { size: 18, color: colors.primary[500] }), _jsx("strong", { style: { fontSize: typography.fontSize.sm.size, letterSpacing: '0.04em', textTransform: 'uppercase' }, children: "VMS Enterprise" })] }), _jsx(ContextSwitcher, { currentContext: activeSiteContext, availableSites: DEMO_SITES, onSelectContext: setActiveSiteContext })] }), _jsx("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flex: 1, maxWidth: '420px', margin: '0 12px' }, children: _jsxs("button", { type: "button", onClick: () => setIsGlobalSearchOpen(true), style: {
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '6px 12px',
                                backgroundColor: colors.slate[800],
                                border: `1px solid ${colors.slate[700]}`,
                                borderRadius: radius.md,
                                color: colors.slate[400],
                                fontSize: typography.fontSize.xs.size,
                                cursor: 'pointer',
                            }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(Search, { size: 14 }), _jsx("span", { children: "Search visitors, vehicles, challans, documents..." })] }), _jsx("kbd", { style: {
                                        backgroundColor: colors.slate[900],
                                        border: `1px solid ${colors.slate[700]}`,
                                        padding: '1px 5px',
                                        borderRadius: radius.sm,
                                        fontSize: '10px',
                                        fontFamily: typography.fontFamily.mono,
                                        color: colors.slate[300],
                                    }, children: "Ctrl+K" })] }) }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsxs("button", { type: "button", title: "Toggle Plant Emergency State", onClick: () => {
                                    setIsEmergencyActive(!isEmergencyActive);
                                    if (!isEmergencyActive)
                                        setIsEmergencyModalOpen(true);
                                }, style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    padding: '4px 8px',
                                    borderRadius: radius.sm,
                                    backgroundColor: isEmergencyActive ? colors.status.danger.solid : 'transparent',
                                    border: `1px solid ${isEmergencyActive ? 'transparent' : colors.slate[700]}`,
                                    color: '#ffffff',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }, children: [_jsx(AlertOctagon, { size: 14, color: isEmergencyActive ? '#ffffff' : colors.status.danger.solid }), _jsx("span", { style: { display: 'none' }, children: "EMERGENCY" })] }), _jsx(Button, { variant: "ghost", size: "dense", style: { color: '#ffffff', border: `1px solid ${colors.slate[700]}` }, leftIcon: _jsx(Shield, { size: 13 }), onClick: () => {
                                    setSelectedDetailItem(null);
                                    setActiveRoute('/gate');
                                }, children: "Gate Mode" }), _jsx(Button, { variant: "ghost", size: "dense", style: { color: '#ffffff', border: `1px solid ${colors.slate[700]}` }, leftIcon: _jsx(Tablet, { size: 13 }), onClick: () => {
                                    setSelectedDetailItem(null);
                                    setActiveRoute('/kiosk');
                                }, children: "Kiosk" }), _jsx(NotificationCenter, { notifications: DEMO_NOTIFICATIONS, onNavigate: (url) => {
                                    setSelectedDetailItem(null);
                                    setActiveRoute(url);
                                } }), _jsx(SyncStatusIndicator, { state: syncState, compact: true, pendingCount: 2, onSyncTrigger: () => {
                                    // Cycle through sync states for verification
                                    const states = ['ONLINE', 'SYNC_PENDING', 'SYNCING', 'SYNCED', 'OFFLINE', 'CONFLICT'];
                                    const nextIdx = (states.indexOf(syncState) + 1) % states.length;
                                    setSyncState(states[nextIdx]);
                                } }), _jsxs("select", { "aria-label": "Switch User Persona Role", value: activeRole, onChange: (e) => setActiveRole(e.target.value), style: {
                                    backgroundColor: colors.slate[800],
                                    color: '#ffffff',
                                    border: `1px solid ${colors.slate[700]}`,
                                    padding: '4px 8px',
                                    borderRadius: radius.sm,
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    outline: 'none',
                                    cursor: 'pointer',
                                }, children: [_jsx("option", { value: "SUPER_ADMIN", children: "Role: Super Admin" }), _jsx("option", { value: "SECURITY_GUARD", children: "Role: Security Guard" }), _jsx("option", { value: "RECEPTIONIST", children: "Role: Receptionist" }), _jsx("option", { value: "EHS_MANAGER", children: "Role: EHS Safety Manager" }), _jsx("option", { value: "ESG_MANAGER", children: "Role: ESG Sustainability Mgr" }), _jsx("option", { value: "HOST", children: "Role: Host Employee" }), _jsx("option", { value: "AUDITOR", children: "Role: Compliance Auditor" }), _jsx("option", { value: "MANAGEMENT", children: "Role: Executive Management" })] })] })] }), _jsxs("div", { style: { display: 'flex', flex: 1, position: 'relative' }, children: [_jsxs("aside", { style: {
                            width: isSidebarCollapsed ? '60px' : '230px',
                            backgroundColor: '#ffffff',
                            borderRight: `1px solid ${colors.slate[200]}`,
                            display: 'flex',
                            flexDirection: 'column',
                            transition: 'width 150ms ease',
                            flexShrink: 0,
                            overflowX: 'hidden',
                        }, className: "vms-left-nav", children: [_jsx("div", { style: { flex: 1, overflowY: 'auto', padding: '8px' }, children: visibleDomains.map((domain) => {
                                    const isDomainActive = domain.items.some((item) => item.route === activeRoute);
                                    return (_jsxs("div", { style: { marginBottom: '4px' }, children: [_jsx("button", { type: "button", onClick: () => {
                                                    setSelectedDetailItem(null);
                                                    setActiveRoute(domain.items[0].route);
                                                }, style: {
                                                    width: '100%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
                                                    padding: '8px 10px',
                                                    borderRadius: radius.md,
                                                    border: 'none',
                                                    backgroundColor: isDomainActive ? colors.primary[50] : 'transparent',
                                                    color: isDomainActive ? colors.primary[700] : colors.slate[700],
                                                    cursor: 'pointer',
                                                    fontSize: typography.fontSize.xs.size,
                                                    fontWeight: isDomainActive ? 700 : 500,
                                                    transition: 'background-color 80ms ease',
                                                }, title: isSidebarCollapsed ? domain.label : undefined, children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("span", { style: { color: isDomainActive ? colors.primary[600] : colors.slate[500] }, children: domain.icon }), !isSidebarCollapsed && _jsx("span", { children: domain.label })] }) }), !isSidebarCollapsed && isDomainActive && (_jsx("div", { style: { display: 'flex', flexDirection: 'column', marginLeft: '28px', marginTop: '2px', paddingLeft: '8px', borderLeft: `1.5px solid ${colors.slate[200]}` }, children: domain.items.map((sub) => {
                                                    const isSubActive = activeRoute === sub.route && !selectedDetailItem;
                                                    return (_jsx("button", { type: "button", onClick: () => {
                                                            setSelectedDetailItem(null);
                                                            setActiveRoute(sub.route);
                                                        }, style: {
                                                            textAlign: 'left',
                                                            padding: '5px 8px',
                                                            borderRadius: radius.sm,
                                                            border: 'none',
                                                            backgroundColor: isSubActive ? colors.primary[100] : 'transparent',
                                                            color: isSubActive ? colors.primary[900] : colors.slate[600],
                                                            fontSize: '11px',
                                                            fontWeight: isSubActive ? 700 : 400,
                                                            cursor: 'pointer',
                                                            marginBottom: '2px',
                                                        }, children: sub.label }, sub.route));
                                                }) }))] }, domain.id));
                                }) }), _jsx("div", { style: { padding: '8px', borderTop: `1px solid ${colors.slate[200]}` }, children: _jsx("button", { type: "button", onClick: () => setIsSidebarCollapsed(!isSidebarCollapsed), style: {
                                        width: '100%',
                                        padding: '6px',
                                        border: 'none',
                                        borderRadius: radius.sm,
                                        backgroundColor: colors.slate[100],
                                        color: colors.slate[600],
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                    }, children: isSidebarCollapsed ? '→' : '← Collapse Rail' }) })] }), _jsxs("main", { style: {
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto',
                            padding: '20px 24px',
                            maxWidth: '100%',
                        }, children: [_jsx("nav", { "aria-label": "Breadcrumb", style: { marginBottom: '12px' }, children: _jsxs("ol", { style: { display: 'flex', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0, gap: '6px', fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: [_jsx("li", { children: _jsx("span", { children: "Facility" }) }), _jsx("li", { children: "/" }), _jsx("li", { children: _jsx("span", { children: breadcrumbs[0] }) }), _jsx("li", { children: "/" }), _jsx("li", { style: { color: colors.slate[900], fontWeight: 600 }, children: breadcrumbs[1] })] }) }), renderMainContent()] })] }), _jsx(CommandPalette, { isOpen: isCommandPaletteOpen, onClose: () => setIsCommandPaletteOpen(false), commands: [
                    {
                        id: 'cmd-create-visitor',
                        category: 'ACTIONS',
                        title: 'New Visitor Pre-Registration',
                        subtitle: 'Schedule appointment with host, transport vectors & ESG capture',
                        icon: _jsx(UserPlus, { size: 16, color: colors.primary[600] }),
                        shortcut: 'V',
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/new');
                        },
                    },
                    {
                        id: 'cmd-walkin-visitor',
                        category: 'ACTIONS',
                        title: 'Gate Walk-In Registration (<60s Flow)',
                        subtitle: 'Rapid security desk check-in with badge printing',
                        icon: _jsx(Users, { size: 16, color: colors.primary[600] }),
                        shortcut: 'W',
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/walk-in');
                        },
                    },
                    {
                        id: 'cmd-expected-visitors',
                        category: 'ACTIONS',
                        title: 'Expected Visitors Today',
                        subtitle: 'View scheduled arrivals and expedited QR check-in roster',
                        icon: _jsx(CheckCircle2, { size: 16, color: colors.primary[600] }),
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/expected');
                        },
                    },
                    {
                        id: 'cmd-inside-visitors',
                        category: 'ACTIONS',
                        title: 'Currently On Premises (Active Visitors)',
                        subtitle: 'Live plant floor occupancy and badge verification',
                        icon: _jsx(Users, { size: 16, color: colors.status.success.solid }),
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/inside');
                        },
                    },
                    {
                        id: 'cmd-group-visitor',
                        category: 'ACTIONS',
                        title: 'Group Delegation Intake',
                        subtitle: 'Bulk roster intake with single transport attribution',
                        icon: _jsx(Users, { size: 16, color: colors.primary[600] }),
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/group');
                        },
                    },
                    {
                        id: 'cmd-vip-visitor',
                        category: 'ACTIONS',
                        title: 'VIP Protocol Visitor Intake',
                        subtitle: 'Executive escort, private zone & priority gate pass',
                        icon: _jsx(CheckCircle2, { size: 16, color: "#d97706" }),
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/vip');
                        },
                    },
                    {
                        id: 'cmd-overstay-queue',
                        category: 'ACTIONS',
                        title: 'View Overstay Exception Queue',
                        subtitle: 'Breached visit windows and active security warnings',
                        icon: _jsx(AlertOctagon, { size: 16, color: colors.status.danger.solid }),
                        shortcut: 'O',
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/overstays');
                        },
                    },
                    {
                        id: 'cmd-esg-traceability',
                        category: 'ACTIONS',
                        title: 'Visitor ESG Traceability Ledger',
                        subtitle: 'Bidirectional audit trail: Transaction → Activity → GHG record',
                        icon: _jsx(Leaf, { size: 16, color: colors.esg[600] }),
                        shortcut: 'E',
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/visitors/traceability');
                        },
                    },
                    {
                        id: 'cmd-open-gate',
                        category: 'NAVIGATION',
                        title: 'Open Industrial Gate Console (Gate Mode)',
                        subtitle: 'Direct high-contrast lane fast scan terminal',
                        icon: _jsx(Shield, { size: 16, color: colors.primary[600] }),
                        shortcut: 'G',
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/gate');
                        },
                    },
                    {
                        id: 'cmd-view-approvals',
                        category: 'NAVIGATION',
                        title: 'View Pending Approvals Queue',
                        subtitle: 'Host, Safety PTW and Gate exemptions',
                        icon: _jsx(CheckCircle2, { size: 16, color: colors.status.warning.solid }),
                        shortcut: 'A',
                        onSelect: () => {
                            setSelectedDetailItem(null);
                            setActiveRoute('/tasks');
                        },
                    },
                    {
                        id: 'cmd-emergency-dashboard',
                        category: 'EMERGENCY',
                        title: 'Trigger Emergency Muster Dashboard',
                        subtitle: 'Live plant headcount and roll-call status',
                        icon: _jsx(Flame, { size: 16, color: colors.status.danger.solid }),
                        shortcut: '!',
                        onSelect: () => {
                            setIsEmergencyModalOpen(true);
                        },
                    },
                ], onNavigate: (path) => {
                    setSelectedDetailItem(null);
                    setActiveRoute(path);
                } }), _jsx(GlobalSearch, { isOpen: isGlobalSearchOpen, onClose: () => setIsGlobalSearchOpen(false), onSelectResult: (res) => {
                    if (res.route) {
                        setSelectedDetailItem(null);
                        setActiveRoute(res.route);
                    }
                } }), _jsx(EmergencyModalView, { isOpen: isEmergencyModalOpen, onClose: () => setIsEmergencyModalOpen(false), isSirenActive: isSirenActive, onToggleSiren: () => setIsSirenActive(!isSirenActive) })] }));
};
