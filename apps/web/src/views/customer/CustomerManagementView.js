import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useMemo } from 'react';
import { Building2, Handshake, Users, Calendar, Clock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Leaf, Car, FileCheck, QrCode, Search, Eye, Check, Printer, Plus, Layers, UserPlus, Award, ClipboardCheck, MapPin, History, UserCheck, BarChart3 } from 'lucide-react';
import { Button, Input, Card, Alert, Modal, Drawer, Timeline, } from '@vms/ui';
// Canonical Pre-seeded Customer Accounts
const INITIAL_ACCOUNTS = [
    {
        id: 'acc-cust-001',
        accountCode: 'CUS-ACC-TSLA',
        legalName: 'Tesla Motors Global Powertrain Inc.',
        tradeName: 'Tesla Inc.',
        classification: 'OEM_CUSTOMER',
        accountTier: 'GLOBAL_ENTERPRISE',
        status: 'ACTIVE',
        assignedAccountManager: 'Vikram Mehta (VP OEM Accounts)',
        ndaStatus: 'ACTIVE',
        ndaAgreementNumber: 'NDA-2025-TSLA-0881',
        ndaExpiryDate: '2027-12-31',
        photographyPolicy: 'PROHIBITED',
        activeVisitsCount: 2,
        totalVisitsCount: 18,
        contactPerson: 'David Vance',
        contactEmail: 'dvance@tesla.com',
        contactPhone: '+1-512-555-0199',
    },
    {
        id: 'acc-cust-002',
        accountCode: 'CUS-ACC-TYTA',
        legalName: 'Toyota Motor Manufacturing Asia Pte Ltd',
        tradeName: 'Toyota Asia',
        classification: 'OEM_CUSTOMER',
        accountTier: 'GLOBAL_ENTERPRISE',
        status: 'ACTIVE',
        assignedAccountManager: 'Suresh Babu (VP Operations)',
        ndaStatus: 'ACTIVE',
        ndaAgreementNumber: 'NDA-2024-TYTA-0019',
        ndaExpiryDate: '2026-11-30',
        photographyPolicy: 'RESTRICTED',
        activeVisitsCount: 1,
        totalVisitsCount: 24,
        contactPerson: 'Kenji Takahashi',
        contactEmail: 'kenji.takahashi@toyota-asia.com',
        contactPhone: '+65-6888-9120',
    },
    {
        id: 'acc-cust-003',
        accountCode: 'CUS-ACC-BMW',
        legalName: 'Bayerische Motoren Werke AG (BMW)',
        tradeName: 'BMW Group',
        classification: 'STRATEGIC_CUSTOMER',
        accountTier: 'TIER_1_STRATEGIC',
        status: 'ACTIVE',
        assignedAccountManager: 'Ananya Sharma (Senior Director Key Accounts)',
        ndaStatus: 'ACTIVE',
        ndaAgreementNumber: 'NDA-2025-BMW-4192',
        ndaExpiryDate: '2028-06-30',
        photographyPolicy: 'PROHIBITED',
        activeVisitsCount: 1,
        totalVisitsCount: 12,
        contactPerson: 'Marcus Weber',
        contactEmail: 'marcus.weber@bmwgroup.com',
        contactPhone: '+49-89-382-019',
    },
    {
        id: 'acc-cust-004',
        accountCode: 'CUS-ACC-BOSCH',
        legalName: 'Robert Bosch Engineering and Mobility GmbH',
        tradeName: 'Bosch Mobility',
        classification: 'QUALITY_CUSTOMER',
        accountTier: 'KEY_ACCOUNT',
        status: 'ACTIVE',
        assignedAccountManager: 'Karthik Raja (Account Lead)',
        ndaStatus: 'EXPIRING_SOON',
        ndaAgreementNumber: 'NDA-2023-BSCH-7782',
        ndaExpiryDate: '2026-10-31',
        photographyPolicy: 'RESTRICTED',
        activeVisitsCount: 1,
        totalVisitsCount: 31,
        contactPerson: 'Elena Rostova',
        contactEmail: 'elena.rostova@bosch.de',
        contactPhone: '+49-711-811-0',
    },
    {
        id: 'acc-cust-005',
        accountCode: 'CUS-ACC-CUMN',
        legalName: 'Cummins India Heavy Power Technologies Ltd',
        tradeName: 'Cummins India',
        classification: 'EXISTING_CUSTOMER',
        accountTier: 'STANDARD',
        status: 'ACTIVE',
        assignedAccountManager: 'Rajesh Varma (Commercial Manager)',
        ndaStatus: 'ACTIVE',
        ndaAgreementNumber: 'NDA-2024-CUMN-1102',
        ndaExpiryDate: '2027-04-15',
        photographyPolicy: 'RESTRICTED',
        activeVisitsCount: 0,
        totalVisitsCount: 9,
        contactPerson: 'Arun Deshmukh',
        contactEmail: 'arun.deshmukh@cummins.com',
        contactPhone: '+91-20-6706-0000',
    },
];
// Initial Representatives
const INITIAL_REPRESENTATIVES = [
    {
        id: 'rep-001',
        accountId: 'acc-cust-001',
        accountName: 'Tesla Motors Global Powertrain Inc.',
        canonicalPersonId: 'prs-tesla-01',
        fullName: 'David Vance',
        phone: '+1-512-555-0199',
        email: 'dvance@tesla.com',
        designation: 'Director of Global Supplier Quality',
        department: 'Supply Chain Operations',
        isVip: true,
        ndaSigned: true,
        safetyInductionValid: true,
    },
    {
        id: 'rep-002',
        accountId: 'acc-cust-001',
        accountName: 'Tesla Motors Global Powertrain Inc.',
        canonicalPersonId: 'prs-tesla-02',
        fullName: 'Sophia Lin',
        phone: '+1-512-555-0244',
        email: 'slin@tesla.com',
        designation: 'Senior Powertrain Battery Engineer',
        department: 'Engineering Quality',
        isVip: false,
        ndaSigned: true,
        safetyInductionValid: true,
    },
    {
        id: 'rep-003',
        accountId: 'acc-cust-002',
        accountName: 'Toyota Motor Manufacturing Asia Pte Ltd',
        canonicalPersonId: 'prs-tyta-01',
        fullName: 'Kenji Takahashi',
        phone: '+65-6888-9120',
        email: 'kenji.takahashi@toyota-asia.com',
        designation: 'Chief Engineer — TPS Audit Division',
        department: 'Quality Assurance',
        isVip: true,
        ndaSigned: true,
        safetyInductionValid: true,
    },
    {
        id: 'rep-004',
        accountId: 'acc-cust-003',
        accountName: 'Bayerische Motoren Werke AG (BMW)',
        canonicalPersonId: 'prs-bmw-01',
        fullName: 'Marcus Weber',
        phone: '+49-89-382-019',
        email: 'marcus.weber@bmwgroup.com',
        designation: 'Head of Chassis Procurement',
        department: 'Strategic Sourcing',
        isVip: true,
        ndaSigned: true,
        safetyInductionValid: true,
    },
    {
        id: 'rep-005',
        accountId: 'acc-cust-004',
        accountName: 'Robert Bosch Engineering and Mobility GmbH',
        canonicalPersonId: 'prs-bsch-01',
        fullName: 'Elena Rostova',
        phone: '+49-711-811-0',
        email: 'elena.rostova@bosch.de',
        designation: 'Lead Auditor — VDA 6.3 Process Audit',
        department: 'Quality Compliance',
        isVip: false,
        ndaSigned: true,
        safetyInductionValid: true,
    },
];
// Initial Customer Visit Transactions
const INITIAL_VISITS = [
    {
        id: 'tx-cus-101',
        referenceNumber: 'CUS-2026-000101',
        accountId: 'acc-cust-001',
        accountName: 'Tesla Motors Global Powertrain Inc.',
        classification: 'OEM_CUSTOMER',
        visitTypeCode: 'CUSTOMER_AUDIT',
        bookingMode: 'RESERVED',
        leadParticipantName: 'David Vance',
        participants: [
            { id: 'p-1', name: 'David Vance', email: 'dvance@tesla.com', phone: '+1-512-555-0199', designation: 'Director Global Quality', isLead: true, status: 'INSIDE', gatePassNumber: 'GP-CUS-101-01', checkInTime: '2026-10-11T09:15:00Z' },
            { id: 'p-2', name: 'Sophia Lin', email: 'slin@tesla.com', phone: '+1-512-555-0244', designation: 'Sr Battery Engineer', isLead: false, status: 'INSIDE', gatePassNumber: 'GP-CUS-101-02', checkInTime: '2026-10-11T09:15:00Z' },
        ],
        hostUserId: 'usr-host-1',
        hostName: 'Vikram Mehta (VP OEM Accounts)',
        hostDepartment: 'OEM Engineering & Business',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T09:00:00Z',
        scheduledEnd: '2026-10-11T17:00:00Z',
        actualArrival: '2026-10-11T09:10:00Z',
        actualEntry: '2026-10-11T09:15:00Z',
        stage: 'IN_PROGRESS',
        presenceStatus: 'INSIDE',
        authorizedZones: ['Administrative Boardroom', 'Battery Assembly Line A', 'R&D Reliability Lab'],
        ndaVerified: true,
        ndaAgreementNumber: 'NDA-2025-TSLA-0881',
        escortRequired: true,
        photographyPolicy: 'PROHIBITED',
        agenda: 'Annual Q4 IATF 16949 / Tesla Specific Supplier Quality Audit for Model Y high-voltage harnesses',
        auditDetails: {
            auditType: 'IATF_16949_CUSTOMER_SPECIFIC',
            auditScope: 'Automated crimping line, ultrasonic welding cells, and traceability barcode laser stations',
            leadAuditor: 'David Vance (Tesla)',
            findingsCount: 0,
            closureStatus: 'AUDIT_IN_PROGRESS',
        },
        transport: {
            mode: 'CAR',
            vehicleClass: 'SEDAN',
            fuelType: 'ELECTRIC',
            distanceKm: 42,
            occupancy: 2,
            isSharedDelegationVehicle: true,
            vehiclePlate: 'TN-09-EV-2026',
            origin: 'ITC Grand Chola, Guindy',
            provenance: 'USER_PROVIDED',
        },
        esgActivity: {
            activityId: 'GHA-CUS-000101',
            sourceDomain: 'CUSTOMER',
            activityQuantity: 42,
            activityUnit: 'KM',
            scope: 'SCOPE_3_CAT_6',
            emissionsKgCO2e: 2.14,
            calculationStatus: 'CALCULATED',
            emissionFactorUsed: '0.051 kg CO2e/km (Grid Electric Vehicle)',
        },
    },
    {
        id: 'tx-cus-102',
        referenceNumber: 'CUS-2026-000102',
        accountId: 'acc-cust-002',
        accountName: 'Toyota Motor Manufacturing Asia Pte Ltd',
        classification: 'OEM_CUSTOMER',
        visitTypeCode: 'DELEGATION_VISIT',
        bookingMode: 'DELEGATION',
        leadParticipantName: 'Kenji Takahashi',
        participants: [
            { id: 'p-3', name: 'Kenji Takahashi', email: 'kenji.takahashi@toyota-asia.com', phone: '+65-6888-9120', designation: 'Chief Engineer', isLead: true, status: 'INSIDE', gatePassNumber: 'GP-CUS-102-01', checkInTime: '2026-10-11T10:05:00Z' },
            { id: 'p-4', name: 'Hiroshi Sato', email: 'hsato@toyota-asia.com', phone: '+65-6888-9121', designation: 'TPS Specialist', isLead: false, status: 'INSIDE', gatePassNumber: 'GP-CUS-102-02', checkInTime: '2026-10-11T10:05:00Z' },
            { id: 'p-5', name: 'Naveen Ramaswamy', email: 'naveen.r@toyota-india.com', phone: '+91-9840112999', designation: 'Regional Procurement Head', isLead: false, status: 'ARRIVED', gatePassNumber: 'GP-CUS-102-03' },
        ],
        hostUserId: 'usr-host-2',
        hostName: 'Suresh Babu (VP Operations)',
        hostDepartment: 'Manufacturing Plant Operations',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T10:00:00Z',
        scheduledEnd: '2026-10-11T16:30:00Z',
        actualArrival: '2026-10-11T10:00:00Z',
        actualEntry: '2026-10-11T10:05:00Z',
        stage: 'IN_PROGRESS',
        presenceStatus: 'PARTIAL_INSIDE',
        authorizedZones: ['Main Assembly Shop Floor', 'TPS Kaizen Dojo', 'Executive Conference Room 1'],
        ndaVerified: true,
        ndaAgreementNumber: 'NDA-2024-TYTA-0019',
        escortRequired: true,
        photographyPolicy: 'RESTRICTED',
        agenda: 'Toyota Production System (TPS) benchmarking delegation and line qualification review for new SUV platform components',
        transport: {
            mode: 'BUS',
            vehicleClass: 'MINIBUS',
            fuelType: 'CNG',
            distanceKm: 58,
            occupancy: 3,
            isSharedDelegationVehicle: true,
            vehiclePlate: 'TN-07-CNG-8812',
            origin: 'Chennai International Airport (MAA)',
            provenance: 'USER_PROVIDED',
        },
        esgActivity: {
            activityId: 'GHA-CUS-000102',
            sourceDomain: 'CUSTOMER',
            activityQuantity: 58,
            activityUnit: 'KM',
            scope: 'SCOPE_3_CAT_6',
            emissionsKgCO2e: 14.21,
            calculationStatus: 'CALCULATED',
            emissionFactorUsed: '0.245 kg CO2e/km (Dedicated CNG Minibus)',
        },
    },
    {
        id: 'tx-cus-103',
        referenceNumber: 'CUS-2026-000103',
        accountId: 'acc-cust-004',
        accountName: 'Robert Bosch Engineering and Mobility GmbH',
        classification: 'QUALITY_CUSTOMER',
        visitTypeCode: 'CUSTOMER_INSPECTION',
        bookingMode: 'RESERVED',
        leadParticipantName: 'Elena Rostova',
        participants: [
            { id: 'p-6', name: 'Elena Rostova', email: 'elena.rostova@bosch.de', phone: '+49-711-811-0', designation: 'Lead Auditor', isLead: true, status: 'SCHEDULED' },
        ],
        hostUserId: 'usr-host-3',
        hostName: 'Karthik Raja (Account Lead)',
        hostDepartment: 'Quality Assurance',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T14:00:00Z',
        scheduledEnd: '2026-10-11T18:00:00Z',
        stage: 'SCHEDULED',
        presenceStatus: 'EXPECTED_TODAY',
        authorizedZones: ['Metrology Lab', 'Cleanroom Inspection Cell'],
        ndaVerified: true,
        ndaAgreementNumber: 'NDA-2023-BSCH-7782',
        escortRequired: false,
        photographyPolicy: 'RESTRICTED',
        agenda: 'VDA 6.3 Process Inspection on rubber vulcanization and micro-porosity measurement instrumentation',
        inspectionDetails: {
            category: 'TOOLING_AND_PROCESS',
            inspectionScope: 'Precision extruders 4 & 5, laser profile meters, calibration records',
            leadInspector: 'Elena Rostova',
        },
        transport: {
            mode: 'CAR',
            vehicleClass: 'SEDAN',
            fuelType: 'DIESEL',
            distanceKm: 34,
            occupancy: 1,
            isSharedDelegationVehicle: false,
            origin: 'Taj Coromandel, Nungambakkam',
            provenance: 'SYSTEM_ESTIMATED',
        },
        esgActivity: {
            activityId: 'GHA-CUS-000103',
            sourceDomain: 'CUSTOMER',
            activityQuantity: 34,
            activityUnit: 'KM',
            scope: 'SCOPE_3_CAT_6',
            emissionsKgCO2e: 5.81,
            calculationStatus: 'PENDING',
            emissionFactorUsed: '0.171 kg CO2e/km (Diesel Passenger Car)',
        },
    },
    {
        id: 'tx-cus-104',
        referenceNumber: 'CUS-2026-000104',
        accountId: 'acc-cust-003',
        accountName: 'Bayerische Motoren Werke AG (BMW)',
        classification: 'STRATEGIC_CUSTOMER',
        visitTypeCode: 'QUALITY_VISIT',
        bookingMode: 'RESERVED',
        leadParticipantName: 'Marcus Weber',
        participants: [
            { id: 'p-7', name: 'Marcus Weber', email: 'marcus.weber@bmwgroup.com', phone: '+49-89-382-019', designation: 'Head of Chassis Procurement', isLead: true, status: 'SCHEDULED' },
        ],
        hostUserId: 'usr-host-4',
        hostName: 'Ananya Sharma (Senior Director Key Accounts)',
        hostDepartment: 'Strategic Customer Relations',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-12T10:00:00Z',
        scheduledEnd: '2026-10-12T15:00:00Z',
        stage: 'SUBMITTED',
        presenceStatus: 'SCHEDULED',
        authorizedZones: ['Executive Briefing Center', 'Chassis Prototype Bay'],
        ndaVerified: true,
        ndaAgreementNumber: 'NDA-2025-BMW-4192',
        escortRequired: true,
        photographyPolicy: 'PROHIBITED',
        agenda: 'PPAP Level 4 signoff review for lightweight radial alloy rims and carbon-neutral production verification',
        transport: {
            mode: 'FLIGHT',
            vehicleClass: 'AIR_COMMERCIAL',
            fuelType: 'AVIATION_FUEL',
            distanceKm: 1250,
            occupancy: 1,
            isSharedDelegationVehicle: false,
            origin: 'Munich (MUC) via Frankfurt',
            provenance: 'USER_PROVIDED',
        },
        esgActivity: {
            activityId: 'GHA-CUS-000104',
            sourceDomain: 'CUSTOMER',
            activityQuantity: 1250,
            activityUnit: 'KM',
            scope: 'SCOPE_3_CAT_6',
            emissionsKgCO2e: 307.25,
            calculationStatus: 'CALCULATED',
            emissionFactorUsed: '0.2458 kg CO2e/pkm (Long Haul Aviation Economy)',
        },
    },
    {
        id: 'tx-cus-105',
        referenceNumber: 'CUS-2026-000105',
        accountId: 'acc-cust-001',
        accountName: 'Tesla Motors Global Powertrain Inc.',
        classification: 'OEM_CUSTOMER',
        visitTypeCode: 'TECHNICAL_VISIT',
        bookingMode: 'RESERVED',
        leadParticipantName: 'Liam O’Connor',
        participants: [
            { id: 'p-8', name: 'Liam O’Connor', email: 'loconnor@tesla.com', phone: '+1-512-555-0988', designation: 'Robotics Integration Specialist', isLead: true, status: 'CHECKED_OUT', gatePassNumber: 'GP-CUS-105-01', checkInTime: '2026-10-10T08:30:00Z', checkOutTime: '2026-10-10T16:45:00Z' },
        ],
        hostUserId: 'usr-host-1',
        hostName: 'Vikram Mehta (VP OEM Accounts)',
        hostDepartment: 'OEM Engineering & Business',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-10T08:30:00Z',
        scheduledEnd: '2026-10-10T16:30:00Z',
        actualArrival: '2026-10-10T08:25:00Z',
        actualEntry: '2026-10-10T08:30:00Z',
        actualExit: '2026-10-10T16:45:00Z',
        stage: 'CLOSED',
        presenceStatus: 'CHECKED_OUT',
        authorizedZones: ['Robotics Cell 3', 'PLC Integration Bay'],
        ndaVerified: true,
        ndaAgreementNumber: 'NDA-2025-TSLA-0881',
        escortRequired: true,
        photographyPolicy: 'PROHIBITED',
        agenda: 'Technical diagnostic on high-speed robotic tire balancers and firmware synchronization',
        transport: {
            mode: 'CAR',
            vehicleClass: 'SEDAN',
            fuelType: 'PETROL',
            distanceKm: 26,
            occupancy: 1,
            isSharedDelegationVehicle: false,
            origin: 'Leela Palace, MRC Nagar',
            provenance: 'USER_PROVIDED',
        },
        esgActivity: {
            activityId: 'GHA-CUS-000105',
            sourceDomain: 'CUSTOMER',
            activityQuantity: 26,
            activityUnit: 'KM',
            scope: 'SCOPE_3_CAT_6',
            emissionsKgCO2e: 4.99,
            calculationStatus: 'CALCULATED',
            emissionFactorUsed: '0.192 kg CO2e/km (Petrol Car)',
        },
        closureReport: {
            closedAt: '2026-10-10T17:00:00Z',
            closedBy: 'Vikram Mehta',
            executiveSummary: 'Firmware upgrade 4.2.1 successful across all 4 Fanuc robotic cells. Cycle times reduced by 3.8%. Signoff complete.',
            followUpRequired: false,
        },
    },
    {
        id: 'tx-cus-106',
        referenceNumber: 'CUS-2026-000106',
        accountId: 'acc-cust-005',
        accountName: 'Cummins India Heavy Power Technologies Ltd',
        classification: 'EXISTING_CUSTOMER',
        visitTypeCode: 'CUSTOMER_MEETING',
        bookingMode: 'RESERVED',
        leadParticipantName: 'Arun Deshmukh',
        participants: [
            { id: 'p-9', name: 'Arun Deshmukh', email: 'arun.deshmukh@cummins.com', phone: '+91-20-6706-0000', designation: 'Senior Supply Manager', isLead: true, status: 'SCHEDULED' },
        ],
        hostUserId: 'usr-host-5',
        hostName: 'Rajesh Varma (Commercial Manager)',
        hostDepartment: 'Commercial Operations',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-11T09:00:00Z',
        scheduledEnd: '2026-10-11T12:00:00Z',
        actualArrival: '2026-10-11T09:05:00Z',
        actualEntry: '2026-10-11T09:10:00Z',
        stage: 'IN_PROGRESS',
        presenceStatus: 'OVERSTAY',
        overstayMinutes: 115, // Breached scheduled end 12:00 PM!
        authorizedZones: ['Commercial Meeting Room 2'],
        ndaVerified: true,
        ndaAgreementNumber: 'NDA-2024-CUMN-1102',
        escortRequired: false,
        photographyPolicy: 'RESTRICTED',
        agenda: 'Quarterly price review and long-term supply volume commitment discussions for heavy diesel generator mounts',
        transport: {
            mode: 'CAR',
            vehicleClass: 'SUV',
            fuelType: 'DIESEL',
            distanceKm: 28,
            occupancy: 1,
            isSharedDelegationVehicle: false,
            origin: 'Adayar',
            provenance: 'USER_PROVIDED',
        },
        esgActivity: {
            activityId: 'GHA-CUS-000106',
            sourceDomain: 'CUSTOMER',
            activityQuantity: 28,
            activityUnit: 'KM',
            scope: 'SCOPE_3_CAT_6',
            emissionsKgCO2e: 5.88,
            calculationStatus: 'CALCULATED',
            emissionFactorUsed: '0.210 kg CO2e/km (Diesel SUV)',
        },
    },
    {
        id: 'tx-cus-107',
        referenceNumber: 'CUS-2026-000107',
        accountId: 'acc-cust-002',
        accountName: 'Toyota Motor Manufacturing Asia Pte Ltd',
        classification: 'OEM_CUSTOMER',
        visitTypeCode: 'PLANT_VISIT',
        bookingMode: 'RESERVED',
        leadParticipantName: 'Yuki Matsui',
        participants: [
            { id: 'p-10', name: 'Yuki Matsui', email: 'ymatsui@toyota-asia.com', phone: '+65-6888-9188', designation: 'Plant Safety Director', isLead: true, status: 'SCHEDULED' },
        ],
        hostUserId: 'usr-host-2',
        hostName: 'Suresh Babu (VP Operations)',
        hostDepartment: 'Manufacturing Plant Operations',
        siteId: 'SITE-CHN-01',
        siteName: 'Chennai Radial Tyre Plant',
        scheduledStart: '2026-10-09T10:00:00Z',
        scheduledEnd: '2026-10-09T14:00:00Z',
        stage: 'CANCELLED',
        presenceStatus: 'NO_SHOW',
        authorizedZones: ['Plant Wide Walkway'],
        ndaVerified: true,
        ndaAgreementNumber: 'NDA-2024-TYTA-0019',
        escortRequired: true,
        photographyPolicy: 'RESTRICTED',
        agenda: 'Executive safety walkthrough for zero-harm benchmark certification',
        transport: {
            mode: 'CAR',
            vehicleClass: 'SEDAN',
            fuelType: 'HYBRID',
            distanceKm: 30,
            occupancy: 1,
            isSharedDelegationVehicle: false,
            origin: 'Chennai',
            provenance: 'USER_PROVIDED',
        },
    },
];
export const CustomerManagementView = ({ initialSubView = 'DASHBOARD', currentRole = 'SUPER_ADMIN', onNavigateSubView, siteId = 'SITE-CHN-01', }) => {
    const [subView, setSubView] = useState(initialSubView);
    const [accounts, setAccounts] = useState(INITIAL_ACCOUNTS);
    const [representatives, setRepresentatives] = useState(INITIAL_REPRESENTATIVES);
    const [visits, setVisits] = useState(INITIAL_VISITS);
    // Filters & Search
    const [searchTerm, setSearchTerm] = useState('');
    const [accountFilter, setAccountFilter] = useState('ALL');
    const [visitTypeFilter, setVisitTypeFilter] = useState('ALL');
    const [stageFilter, setStageFilter] = useState('ALL');
    const [presenceFilter, setPresenceFilter] = useState('ALL');
    // Selected Entities & Modals
    const [selectedVisit, setSelectedVisit] = useState(null);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [isVisitDrawerOpen, setIsVisitDrawerOpen] = useState(false);
    const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState(false);
    const [isEPassModalOpen, setIsEPassModalOpen] = useState(false);
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
    const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
    const [isNewRepModalOpen, setIsNewRepModalOpen] = useState(false);
    const [isTraceabilityDrawerOpen, setIsTraceabilityDrawerOpen] = useState(false);
    // Approval / Action form state
    const [approvalComment, setApprovalComment] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [closureSummary, setClosureSummary] = useState('');
    const [closureFindingsCount, setClosureFindingsCount] = useState(0);
    const [closureFollowUp, setClosureFollowUp] = useState(false);
    // New Visit Form State (Sections A - I)
    const [newAccountId, setNewAccountId] = useState(INITIAL_ACCOUNTS[0].id);
    const [newVisitType, setNewVisitType] = useState('CUSTOMER_AUDIT');
    const [newBookingMode, setNewBookingMode] = useState('RESERVED');
    const [newAgenda, setNewAgenda] = useState('');
    const [newLeadRepId, setNewLeadRepId] = useState(INITIAL_REPRESENTATIVES[0].id);
    const [newAdditionalParticipants, setNewAdditionalParticipants] = useState('');
    const [newScheduledStart, setNewScheduledStart] = useState('2026-10-15T09:00');
    const [newScheduledEnd, setNewScheduledEnd] = useState('2026-10-15T17:00');
    const [newAuthorizedZones, setNewAuthorizedZones] = useState('Administrative Boardroom, Production Line 1');
    const [newNdaNumber, setNewNdaNumber] = useState('NDA-2025-TSLA-0881');
    const [newHostName, setNewHostName] = useState('Vikram Mehta (VP OEM Accounts)');
    const [newEscortRequired, setNewEscortRequired] = useState(true);
    const [newPhotographyPolicy, setNewPhotographyPolicy] = useState('PROHIBITED');
    const [newTransportMode, setNewTransportMode] = useState('CAR');
    const [newVehicleClass, setNewVehicleClass] = useState('SEDAN');
    const [newFuelType, setNewFuelType] = useState('ELECTRIC');
    const [newDistanceKm, setNewDistanceKm] = useState(45);
    const [newOccupancy, setNewOccupancy] = useState(2);
    const [newIsSharedVehicle, setNewIsSharedVehicle] = useState(true);
    const [newVehiclePlate, setNewVehiclePlate] = useState('TN-09-EV-8822');
    const [newOrigin, setNewOrigin] = useState('Chennai City Center');
    const [formSubmittedSuccess, setFormSubmittedSuccess] = useState(false);
    // New Account Modal State
    const [accountLegalName, setAccountLegalName] = useState('');
    const [accountTradeName, setAccountTradeName] = useState('');
    const [accountCode, setAccountCode] = useState('');
    const [accountClassification, setAccountClassification] = useState('OEM_CUSTOMER');
    const [accountTier, setAccountTier] = useState('GLOBAL_ENTERPRISE');
    const [accountManager, setAccountManager] = useState('Vikram Mehta');
    const [accountContact, setAccountContact] = useState('');
    const [accountEmail, setAccountEmail] = useState('');
    const [accountPhone, setAccountPhone] = useState('');
    const [accountNdaNumber, setAccountNdaNumber] = useState('');
    const [accountNdaExpiry, setAccountNdaExpiry] = useState('2027-12-31');
    // New Rep Modal State
    const [repFullName, setRepFullName] = useState('');
    const [repEmail, setRepEmail] = useState('');
    const [repPhone, setRepPhone] = useState('');
    const [repDesignation, setRepDesignation] = useState('');
    const [repDepartment, setRepDepartment] = useState('');
    const [repAccountId, setRepAccountId] = useState(INITIAL_ACCOUNTS[0].id);
    const [repIsVip, setRepIsVip] = useState(false);
    // Sync subview from prop changes
    React.useEffect(() => {
        if (initialSubView) {
            setSubView(initialSubView);
        }
    }, [initialSubView]);
    const handleSelectSubView = (target) => {
        setSubView(target);
        if (onNavigateSubView) {
            onNavigateSubView(target);
        }
    };
    // KPIs derived from live state
    const kpis = useMemo(() => {
        const activeAccounts = accounts.filter(a => a.status === 'ACTIVE').length;
        const plannedVisits = visits.filter(v => v.presenceStatus === 'SCHEDULED' || v.presenceStatus === 'EXPECTED_TODAY').length;
        const insideVisits = visits.filter(v => v.presenceStatus === 'INSIDE' || v.presenceStatus === 'PARTIAL_INSIDE').length;
        const pendingApprovals = visits.filter(v => v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW').length;
        const delegations = visits.filter(v => v.bookingMode === 'DELEGATION' || v.visitTypeCode === 'DELEGATION_VISIT').length;
        const activeNdas = accounts.filter(a => a.ndaStatus === 'ACTIVE').length;
        const expiringNdas = accounts.filter(a => a.ndaStatus === 'EXPIRING_SOON').length;
        const overstays = visits.filter(v => v.presenceStatus === 'OVERSTAY').length;
        // Sum real calculated Scope 3 Category 6 emissions
        const totalEmissionsKgCO2e = visits.reduce((acc, v) => {
            return acc + (v.esgActivity?.emissionsKgCO2e || 0);
        }, 0);
        return {
            activeAccounts,
            plannedVisits,
            insideVisits,
            pendingApprovals,
            delegations,
            activeNdas,
            expiringNdas,
            overstays,
            totalEmissionsKgCO2e: Number(totalEmissionsKgCO2e.toFixed(2)),
        };
    }, [accounts, visits]);
    // Filtered Visits
    const filteredVisits = useMemo(() => {
        return visits.filter(v => {
            // Subview specific filters
            if (subView === 'MEETINGS' && v.visitTypeCode !== 'CUSTOMER_MEETING')
                return false;
            if (subView === 'AUDITS' && v.visitTypeCode !== 'CUSTOMER_AUDIT')
                return false;
            if (subView === 'INSPECTIONS' && v.visitTypeCode !== 'CUSTOMER_INSPECTION')
                return false;
            if (subView === 'QUALITY' && !(v.visitTypeCode === 'QUALITY_VISIT' || v.visitTypeCode === 'PRODUCT_REVIEW' || v.visitTypeCode === 'PROCESS_REVIEW'))
                return false;
            if (subView === 'TECHNICAL' && v.visitTypeCode !== 'TECHNICAL_VISIT')
                return false;
            if (subView === 'PLANT' && !(v.visitTypeCode === 'PLANT_VISIT' || v.visitTypeCode === 'MANAGEMENT_VISIT'))
                return false;
            if (subView === 'DELEGATIONS' && !(v.bookingMode === 'DELEGATION' || v.visitTypeCode === 'DELEGATION_VISIT' || v.participants.length > 1))
                return false;
            if (subView === 'EXPECTED' && !(v.presenceStatus === 'EXPECTED_TODAY' || v.presenceStatus === 'SCHEDULED'))
                return false;
            if (subView === 'INSIDE' && !(v.presenceStatus === 'INSIDE' || v.presenceStatus === 'PARTIAL_INSIDE'))
                return false;
            if (subView === 'APPROVALS' && !(v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW'))
                return false;
            if (subView === 'EXCEPTIONS' && !(v.presenceStatus === 'OVERSTAY' || (v.overstayMinutes && v.overstayMinutes > 0)))
                return false;
            if (subView === 'COMPLETED' && !(v.stage === 'CLOSED' || v.presenceStatus === 'CHECKED_OUT'))
                return false;
            if (subView === 'CANCELLED' && !(v.stage === 'CANCELLED' || v.stage === 'REJECTED' || v.presenceStatus === 'NO_SHOW'))
                return false;
            // Dropdown filters
            if (accountFilter !== 'ALL' && v.accountId !== accountFilter)
                return false;
            if (visitTypeFilter !== 'ALL' && v.visitTypeCode !== visitTypeFilter)
                return false;
            if (stageFilter !== 'ALL' && v.stage !== stageFilter)
                return false;
            if (presenceFilter !== 'ALL' && v.presenceStatus !== presenceFilter)
                return false;
            // Text search
            if (searchTerm) {
                const q = searchTerm.toLowerCase();
                const matchesRef = v.referenceNumber.toLowerCase().includes(q);
                const matchesAccount = v.accountName.toLowerCase().includes(q);
                const matchesLead = v.leadParticipantName.toLowerCase().includes(q);
                const matchesHost = v.hostName.toLowerCase().includes(q);
                const matchesAgenda = v.agenda.toLowerCase().includes(q);
                if (!matchesRef && !matchesAccount && !matchesLead && !matchesHost && !matchesAgenda)
                    return false;
            }
            return true;
        });
    }, [visits, subView, accountFilter, visitTypeFilter, stageFilter, presenceFilter, searchTerm]);
    // Handlers
    const handleApproveVisit = (txId) => {
        setVisits(prev => prev.map(v => v.id === txId ? { ...v, stage: 'APPROVED', presenceStatus: 'EXPECTED_TODAY' } : v));
        setIsApproveModalOpen(false);
    };
    const handleRejectVisit = (txId) => {
        setVisits(prev => prev.map(v => v.id === txId ? { ...v, stage: 'REJECTED' } : v));
        setIsApproveModalOpen(false);
    };
    const handleCheckInVisit = (txId) => {
        setVisits(prev => prev.map(v => {
            if (v.id !== txId)
                return v;
            return {
                ...v,
                stage: 'IN_PROGRESS',
                presenceStatus: 'INSIDE',
                actualArrival: new Date().toISOString(),
                actualEntry: new Date().toISOString(),
                participants: v.participants.map(p => ({
                    ...p,
                    status: 'INSIDE',
                    checkInTime: new Date().toISOString(),
                    gatePassNumber: p.gatePassNumber || `GP-${v.referenceNumber}-${p.id}`,
                })),
            };
        }));
        setIsCheckInModalOpen(false);
    };
    const handleCheckOutVisit = (txId) => {
        setVisits(prev => prev.map(v => {
            if (v.id !== txId)
                return v;
            return {
                ...v,
                stage: 'CHECKED_OUT',
                presenceStatus: 'CHECKED_OUT',
                actualExit: new Date().toISOString(),
                participants: v.participants.map(p => ({
                    ...p,
                    status: 'CHECKED_OUT',
                    checkOutTime: new Date().toISOString(),
                })),
            };
        }));
        setIsCheckOutModalOpen(false);
    };
    const handleCloseVisitWithReport = (txId) => {
        setVisits(prev => prev.map(v => {
            if (v.id !== txId)
                return v;
            return {
                ...v,
                stage: 'CLOSED',
                presenceStatus: 'CHECKED_OUT',
                closureReport: {
                    closedAt: new Date().toISOString(),
                    closedBy: 'Authorized Host Signoff',
                    executiveSummary: closureSummary || 'Customer visit concluded. Technical agenda items completed satisfactorily.',
                    followUpRequired: closureFollowUp,
                },
                auditDetails: v.auditDetails ? {
                    ...v.auditDetails,
                    findingsCount: closureFindingsCount,
                    closureStatus: 'FORMALLY_CLOSED',
                } : undefined,
            };
        }));
        setIsClosureModalOpen(false);
    };
    const handleCreateAccountSubmit = (e) => {
        e.preventDefault();
        const newAcc = {
            id: `acc-cust-${Date.now()}`,
            accountCode: accountCode.toUpperCase() || `CUS-ACC-${Date.now().toString().slice(-4)}`,
            legalName: accountLegalName,
            tradeName: accountTradeName || accountLegalName,
            classification: accountClassification,
            accountTier: accountTier,
            status: 'ACTIVE',
            assignedAccountManager: accountManager,
            ndaStatus: 'ACTIVE',
            ndaAgreementNumber: accountNdaNumber || `NDA-2026-${Date.now().toString().slice(-4)}`,
            ndaExpiryDate: accountNdaExpiry,
            photographyPolicy: 'PROHIBITED',
            activeVisitsCount: 0,
            totalVisitsCount: 0,
            contactPerson: accountContact,
            contactEmail: accountEmail,
            contactPhone: accountPhone,
        };
        setAccounts(prev => [newAcc, ...prev]);
        setIsNewAccountModalOpen(false);
    };
    const handleCreateRepSubmit = (e) => {
        e.preventDefault();
        const selectedAcc = accounts.find(a => a.id === repAccountId);
        const newRep = {
            id: `rep-${Date.now()}`,
            accountId: repAccountId,
            accountName: selectedAcc?.legalName || 'Customer Account',
            canonicalPersonId: `prs-${Date.now().toString().slice(-4)}`,
            fullName: repFullName,
            email: repEmail,
            phone: repPhone,
            designation: repDesignation,
            department: repDepartment,
            isVip: repIsVip,
            ndaSigned: true,
            safetyInductionValid: true,
        };
        setRepresentatives(prev => [newRep, ...prev]);
        setIsNewRepModalOpen(false);
    };
    const handleNewVisitSubmit = (e) => {
        e.preventDefault();
        const acc = accounts.find(a => a.id === newAccountId);
        const rep = representatives.find(r => r.id === newLeadRepId);
        // Parse additional participants
        const partsList = [
            {
                id: `p-${Date.now()}-lead`,
                name: rep?.fullName || 'Lead Representative',
                email: rep?.email || 'lead@customer.com',
                phone: rep?.phone || '+91-0000000000',
                designation: rep?.designation || 'Lead',
                isLead: true,
                status: 'SCHEDULED',
            }
        ];
        if (newAdditionalParticipants) {
            const extraNames = newAdditionalParticipants.split(',').map(s => s.trim()).filter(Boolean);
            extraNames.forEach((name, idx) => {
                partsList.push({
                    id: `p-${Date.now()}-${idx}`,
                    name,
                    email: `${name.toLowerCase().replace(/\s+/g, '.')}@customer.com`,
                    phone: '+91-9000000000',
                    designation: 'Delegate',
                    isLead: false,
                    status: 'SCHEDULED',
                });
            });
        }
        // Auto-calculate realistic GHG emissions for embedded preview
        const factorPerKm = newTransportMode === 'CAR' ? (newFuelType === 'ELECTRIC' ? 0.051 : 0.171) :
            newTransportMode === 'FLIGHT' ? 0.2458 :
                newTransportMode === 'BUS' ? 0.082 : 0.041;
        const emissions = Number((newDistanceKm * factorPerKm).toFixed(2));
        const refNum = `CUS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
        const newTx = {
            id: `tx-cus-${Date.now()}`,
            referenceNumber: refNum,
            accountId: newAccountId,
            accountName: acc?.legalName || 'Selected Customer Account',
            classification: acc?.classification || 'OEM_CUSTOMER',
            visitTypeCode: newVisitType,
            bookingMode: newBookingMode,
            leadParticipantName: rep?.fullName || 'Lead Representative',
            participants: partsList,
            hostUserId: 'usr-host-current',
            hostName: newHostName,
            hostDepartment: 'Industrial Operations & Key Accounts',
            siteId,
            siteName: 'Chennai Radial Tyre Plant',
            scheduledStart: newScheduledStart,
            scheduledEnd: newScheduledEnd,
            stage: 'SUBMITTED',
            presenceStatus: 'SCHEDULED',
            authorizedZones: newAuthorizedZones.split(',').map(z => z.trim()),
            ndaVerified: Boolean(acc?.ndaStatus === 'ACTIVE'),
            ndaAgreementNumber: newNdaNumber,
            escortRequired: newEscortRequired,
            photographyPolicy: newPhotographyPolicy,
            agenda: newAgenda || 'Executive Customer Engagement & Operational Collaboration',
            transport: {
                mode: newTransportMode,
                vehicleClass: newVehicleClass,
                fuelType: newFuelType,
                distanceKm: newDistanceKm,
                occupancy: newOccupancy,
                isSharedDelegationVehicle: newIsSharedVehicle,
                vehiclePlate: newVehiclePlate,
                origin: newOrigin,
                provenance: 'USER_PROVIDED',
            },
            esgActivity: {
                activityId: `GHA-${refNum}`,
                sourceDomain: 'CUSTOMER',
                activityQuantity: newDistanceKm,
                activityUnit: 'KM',
                scope: 'SCOPE_3_CAT_6',
                emissionsKgCO2e: emissions,
                calculationStatus: 'CALCULATED',
                emissionFactorUsed: `${factorPerKm} kg CO2e/km (${newTransportMode} ${newFuelType})`,
            },
        };
        setVisits(prev => [newTx, ...prev]);
        setFormSubmittedSuccess(true);
        setTimeout(() => {
            setFormSubmittedSuccess(false);
            handleSelectSubView('VISITS');
        }, 1500);
    };
    return (_jsxs("div", { className: "flex flex-col gap-5 max-w-full", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Handshake, { size: 24, className: "text-blue-600" }), _jsx("h1", { className: "text-xl font-black text-slate-900 tracking-tight", children: "Customer Management & Delegations" }), _jsx("span", { className: "px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded uppercase tracking-wider", children: "Part 7 Independent Domain" })] }), _jsx("p", { className: "text-xs text-slate-600 mt-1", children: "OEM customer audits, executive delegations, technical reviews, bilateral NDAs, and source-linked Scope 3 GHG travel capture." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "dense", variant: "secondary", leftIcon: _jsx(Building2, { size: 14 }), onClick: () => setIsNewAccountModalOpen(true), children: "Add Account" }), _jsx(Button, { size: "dense", variant: "secondary", leftIcon: _jsx(UserPlus, { size: 14 }), onClick: () => setIsNewRepModalOpen(true), children: "Add Representative" }), _jsx(Button, { size: "dense", variant: "primary", leftIcon: _jsx(Plus, { size: 14 }), onClick: () => handleSelectSubView('NEW'), children: "New Customer Visit" })] })] }), _jsx("div", { className: "flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-200", children: [
                    { id: 'DASHBOARD', label: 'Executive Dashboard', icon: _jsx(BarChart3, { size: 13 }) },
                    { id: 'ACCOUNTS', label: 'Customer Accounts', icon: _jsx(Building2, { size: 13 }) },
                    { id: 'REPRESENTATIVES', label: 'Representatives', icon: _jsx(Users, { size: 13 }) },
                    { id: 'VISITS', label: 'All Customer Visits', icon: _jsx(Handshake, { size: 13 }) },
                    { id: 'NEW', label: '+ New Visit Form', icon: _jsx(Plus, { size: 13 }) },
                    { id: 'MEETINGS', label: 'Meetings', icon: _jsx(Calendar, { size: 13 }) },
                    { id: 'AUDITS', label: 'Audits', icon: _jsx(ClipboardCheck, { size: 13 }) },
                    { id: 'INSPECTIONS', label: 'Inspections', icon: _jsx(CheckCircle2, { size: 13 }) },
                    { id: 'QUALITY', label: 'Quality Visits', icon: _jsx(Award, { size: 13 }) },
                    { id: 'TECHNICAL', label: 'Technical Visits', icon: _jsx(Layers, { size: 13 }) },
                    { id: 'PLANT', label: 'Plant Visits', icon: _jsx(MapPin, { size: 13 }) },
                    { id: 'DELEGATIONS', label: 'Delegations', icon: _jsx(Users, { size: 13 }) },
                    { id: 'EXPECTED', label: 'Expected Today', icon: _jsx(Clock, { size: 13 }) },
                    { id: 'INSIDE', label: 'Currently Inside', icon: _jsx(UserCheck, { size: 13 }) },
                    { id: 'APPROVALS', label: 'Pending Approvals', icon: _jsx(ShieldCheck, { size: 13 }) },
                    { id: 'NDA', label: 'Legal / NDA Requirements', icon: _jsx(FileCheck, { size: 13 }) },
                    { id: 'EXCEPTIONS', label: 'Visit Exceptions', icon: _jsx(AlertTriangle, { size: 13 }) },
                    { id: 'COMPLETED', label: 'Completed Visits', icon: _jsx(Check, { size: 13 }) },
                    { id: 'CANCELLED', label: 'Cancelled / No-Show', icon: _jsx(XCircle, { size: 13 }) },
                    { id: 'HISTORY', label: 'Visit History', icon: _jsx(History, { size: 13 }) },
                    { id: 'TRACEABILITY', label: 'ESG Activity Traceability', icon: _jsx(Leaf, { size: 13 }) },
                ].map((item) => {
                    const isActive = subView === item.id;
                    return (_jsxs("button", { type: "button", onClick: () => handleSelectSubView(item.id), className: `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${isActive
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'}`, children: [item.icon, _jsx("span", { children: item.label }), item.id === 'APPROVALS' && kpis.pendingApprovals > 0 && (_jsx("span", { className: "ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-bold", children: kpis.pendingApprovals })), item.id === 'EXCEPTIONS' && kpis.overstays > 0 && (_jsx("span", { className: "ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold", children: kpis.overstays }))] }, item.id));
                }) }), subView === 'DASHBOARD' && (_jsxs("div", { className: "flex flex-col gap-5", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3", children: [_jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Active OEM Accounts" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-slate-900", children: kpis.activeAccounts }), _jsx("span", { className: "text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded", children: "Tier 1" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Planned Visits" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-blue-700", children: kpis.plannedVisits }), _jsx("span", { className: "text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded", children: "Scheduled" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Currently Inside" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-emerald-700", children: kpis.insideVisits }), _jsx("span", { className: "text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded", children: "On Site" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Pending Approvals" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-amber-700", children: kpis.pendingApprovals }), _jsx("span", { className: "text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded", children: "Review" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Delegations" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-indigo-700", children: kpis.delegations }), _jsx("span", { className: "text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded", children: "Group" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Bilateral NDAs" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-teal-700", children: kpis.activeNdas }), _jsx("span", { className: "text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded", children: "Active" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Scope 3 Cat 6" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-emerald-700", children: kpis.totalEmissionsKgCO2e }), _jsx("span", { className: "text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded", children: "kg CO2e" })] })] }), _jsxs(Card, { className: "p-3 bg-white border border-slate-200", children: [_jsx("span", { className: "text-[11px] font-semibold text-slate-500 uppercase tracking-wider", children: "Overstay / Breach" }), _jsxs("div", { className: "flex items-baseline justify-between mt-1", children: [_jsx("span", { className: "text-2xl font-bold text-rose-700", children: kpis.overstays }), _jsx("span", { className: "text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded", children: "Breach" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-100", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(UserCheck, { size: 16, className: "text-emerald-600" }), _jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Live Customer Delegations On Site" })] }), _jsxs(Button, { size: "dense", variant: "ghost", onClick: () => handleSelectSubView('INSIDE'), children: ["View Inside (", kpis.insideVisits, ")"] })] }), _jsx("div", { className: "mt-3 divide-y divide-slate-100", children: visits.filter(v => v.presenceStatus === 'INSIDE' || v.presenceStatus === 'PARTIAL_INSIDE' || v.presenceStatus === 'OVERSTAY').map(v => (_jsxs("div", { className: "py-2.5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-bold text-slate-900", children: v.accountName }), _jsx("span", { className: "px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded", children: v.visitTypeCode }), v.presenceStatus === 'OVERSTAY' && (_jsxs("span", { className: "px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded", children: ["OVERSTAY +", v.overstayMinutes, "m"] }))] }), _jsxs("div", { className: "text-[11px] text-slate-500 mt-0.5", children: ["Lead: ", _jsx("strong", { children: v.leadParticipantName }), " (", v.participants.length, " delegates) \u2022 Host: ", v.hostName] }), _jsxs("div", { className: "text-[10px] text-slate-400 mt-0.5", children: ["Zones: ", v.authorizedZones.join(', ')] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Button, { size: "dense", variant: "secondary", onClick: () => { setSelectedVisit(v); setIsCheckOutModalOpen(true); }, children: "Check Out" }), _jsx(Button, { size: "dense", variant: "ghost", onClick: () => { setSelectedVisit(v); setIsTraceabilityDrawerOpen(true); }, children: "Trace ESG" })] })] }, v.id))) })] }), _jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-slate-100", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ShieldCheck, { size: 16, className: "text-amber-600" }), _jsx("h3", { className: "text-sm font-bold text-slate-900", children: "Urgent Approvals & Compliance Action" })] }), _jsx(Button, { size: "dense", variant: "ghost", onClick: () => handleSelectSubView('APPROVALS'), children: "Review All" })] }), _jsxs("div", { className: "mt-3 divide-y divide-slate-100", children: [visits.filter(v => v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW').length === 0 ? (_jsx("div", { className: "py-4 text-center text-xs text-slate-400", children: "No pending customer visit approvals in queue." })) : (visits.filter(v => v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW').map(v => (_jsxs("div", { className: "py-2.5 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-bold text-slate-900", children: v.referenceNumber }), _jsx("span", { className: "text-xs font-semibold text-slate-700", children: v.accountName })] }), _jsxs("div", { className: "text-[11px] text-slate-500 mt-0.5", children: ["Type: ", v.visitTypeCode, " \u2022 Lead: ", v.leadParticipantName, " \u2022 Host: ", v.hostName] }), _jsxs("div", { className: "text-[10px] text-slate-400 mt-0.5", children: ["Schedule: ", new Date(v.scheduledStart).toLocaleDateString(), " ", new Date(v.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })] })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Button, { size: "dense", variant: "primary", onClick: () => { setSelectedVisit(v); setIsApproveModalOpen(true); }, children: "Approve" }), _jsx(Button, { size: "dense", variant: "ghost", onClick: () => { setSelectedVisit(v); setIsVisitDrawerOpen(true); }, children: "Details" })] })] }, v.id)))), accounts.filter(a => a.ndaStatus === 'EXPIRING_SOON').map(acc => (_jsxs("div", { className: "py-2.5 flex items-center justify-between bg-amber-50/50 px-2 rounded", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5 text-amber-800 font-bold text-xs", children: [_jsx(AlertTriangle, { size: 13 }), _jsxs("span", { children: ["Bilateral NDA Expiring Soon: ", acc.legalName] })] }), _jsxs("div", { className: "text-[11px] text-amber-700", children: ["Agreement: ", acc.ndaAgreementNumber, " \u2022 Expires on ", acc.ndaExpiryDate] })] }), _jsx(Button, { size: "dense", variant: "secondary", onClick: () => handleSelectSubView('NDA'), children: "Renew NDA" })] }, acc.id)))] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-3", children: "Customer Visit Types" }), _jsx("div", { className: "space-y-2", children: [
                                            { label: 'Customer Audits (IATF/VDA)', count: visits.filter(v => v.visitTypeCode === 'CUSTOMER_AUDIT').length, color: 'bg-blue-600' },
                                            { label: 'Delegations & Group Reviews', count: visits.filter(v => v.visitTypeCode === 'DELEGATION_VISIT' || v.bookingMode === 'DELEGATION').length, color: 'bg-indigo-600' },
                                            { label: 'Customer Inspections (PPAP)', count: visits.filter(v => v.visitTypeCode === 'CUSTOMER_INSPECTION').length, color: 'bg-amber-600' },
                                            { label: 'Quality Reviews', count: visits.filter(v => v.visitTypeCode === 'QUALITY_VISIT').length, color: 'bg-teal-600' },
                                            { label: 'Technical & Engineering', count: visits.filter(v => v.visitTypeCode === 'TECHNICAL_VISIT').length, color: 'bg-purple-600' },
                                            { label: 'Plant & Executive Tours', count: visits.filter(v => v.visitTypeCode === 'PLANT_VISIT' || v.visitTypeCode === 'MANAGEMENT_VISIT').length, color: 'bg-emerald-600' },
                                        ].map((item, idx) => (_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-slate-600", children: item.label }), _jsx("span", { className: "font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded", children: item.count })] }, idx))) })] }), _jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-3", children: "Group Journey Deduplication" }), _jsxs("div", { className: "text-xs text-slate-600 space-y-2", children: [_jsxs("div", { className: "p-2.5 bg-blue-50 border border-blue-100 rounded text-blue-900", children: [_jsx("strong", { className: "block text-[11px] uppercase tracking-wider text-blue-700", children: "Multi-Participant Rule" }), "Delegations sharing a single vehicle record ", _jsx("strong", { children: "1 physical movement" }), " with total occupancy. Duplication of vehicle emissions is strictly suppressed."] }), _jsxs("div", { className: "flex items-center justify-between pt-1", children: [_jsx("span", { children: "Shared Vehicles on Site:" }), _jsxs("strong", { className: "text-slate-900 font-mono", children: [visits.filter(v => v.transport?.isSharedDelegationVehicle).length, " Active"] })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { children: "Delegates Transported:" }), _jsxs("strong", { className: "text-slate-900 font-mono", children: [visits.filter(v => v.transport?.isSharedDelegationVehicle).reduce((acc, v) => acc + (v.transport?.occupancy || 1), 0), " Persons"] })] })] })] }), _jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-3", children: "Precedence Hierarchy Rules" }), _jsxs("div", { className: "text-xs text-slate-600 space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded-full text-[10px] font-bold", children: "1" }), _jsx("span", { className: "font-bold text-slate-900", children: "Mandatory Site Security Rules" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-5 h-5 flex items-center justify-center bg-slate-700 text-white rounded-full text-[10px] font-bold", children: "2" }), _jsx("span", { children: "Global Facility Defaults" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-5 h-5 flex items-center justify-center bg-slate-500 text-white rounded-full text-[10px] font-bold", children: "3" }), _jsx("span", { children: "Customer Account Rules" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-5 h-5 flex items-center justify-center bg-slate-400 text-white rounded-full text-[10px] font-bold", children: "4" }), _jsx("span", { children: "Visit Type Requirements" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-5 h-5 flex items-center justify-center bg-slate-300 text-slate-800 rounded-full text-[10px] font-bold", children: "5" }), _jsx("span", { children: "Visit Specific Exceptions" })] }), _jsx("p", { className: "text-[10px] text-slate-400 italic pt-1", children: "* Customer preferences can never override mandatory plant safety or security rules." })] })] })] })] })), subView === 'ACCOUNTS' && (_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Enterprise Customer Accounts" }), _jsx("p", { className: "text-xs text-slate-500", children: "Master repository of verified OEM and strategic tier customer organizations." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { placeholder: "Search accounts, code, contact...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), leftIcon: _jsx(Search, { size: 14 }), className: "w-64" }), _jsx(Button, { size: "dense", variant: "primary", leftIcon: _jsx(Plus, { size: 13 }), onClick: () => setIsNewAccountModalOpen(true), children: "New Account" })] })] }), _jsx("div", { className: "overflow-x-auto mt-3", children: _jsxs("table", { className: "w-full text-xs text-left", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600 font-semibold border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2.5 px-3", children: "Account Code" }), _jsx("th", { className: "py-2.5 px-3", children: "Legal Entity Name" }), _jsx("th", { className: "py-2.5 px-3", children: "Tier" }), _jsx("th", { className: "py-2.5 px-3", children: "Classification" }), _jsx("th", { className: "py-2.5 px-3", children: "Bilateral NDA" }), _jsx("th", { className: "py-2.5 px-3", children: "Account Manager" }), _jsx("th", { className: "py-2.5 px-3", children: "Primary Contact" }), _jsx("th", { className: "py-2.5 px-3 text-center", children: "Visits" }), _jsx("th", { className: "py-2.5 px-3 text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: accounts.map(acc => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-blue-700", children: acc.accountCode }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx("div", { className: "font-bold text-slate-900", children: acc.legalName }), acc.tradeName && _jsx("div", { className: "text-[10px] text-slate-400", children: acc.tradeName })] }), _jsx("td", { className: "py-2.5 px-3", children: _jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold ${acc.accountTier === 'GLOBAL_ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                                                        acc.accountTier === 'TIER_1_STRATEGIC' ? 'bg-blue-100 text-blue-800' :
                                                            acc.accountTier === 'KEY_ACCOUNT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`, children: acc.accountTier }) }), _jsx("td", { className: "py-2.5 px-3 text-slate-700 font-semibold", children: acc.classification }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold ${acc.ndaStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                                            acc.ndaStatus === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`, children: acc.ndaStatus }), _jsx("div", { className: "text-[10px] text-slate-400 font-mono mt-0.5", children: acc.ndaAgreementNumber })] }), _jsx("td", { className: "py-2.5 px-3 text-slate-700", children: acc.assignedAccountManager }), _jsxs("td", { className: "py-2.5 px-3 text-slate-700", children: [_jsx("div", { children: acc.contactPerson }), _jsx("div", { className: "text-[10px] text-slate-400", children: acc.contactEmail })] }), _jsxs("td", { className: "py-2.5 px-3 text-center", children: [_jsx("span", { className: "font-bold text-blue-700", children: acc.activeVisitsCount }), _jsxs("span", { className: "text-slate-400", children: [" / ", acc.totalVisitsCount] })] }), _jsx("td", { className: "py-2.5 px-3 text-right", children: _jsx(Button, { size: "dense", variant: "ghost", onClick: () => { setSelectedAccount(acc); setIsAccountDrawerOpen(true); }, children: "Profile" }) })] }, acc.id))) })] }) })] })), subView === 'REPRESENTATIVES' && (_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Customer Representatives Directory" }), _jsx("p", { className: "text-xs text-slate-500", children: "Verified delegates, auditors, and engineering representatives linked to canonical person profiles." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { placeholder: "Search representatives by name, email, phone...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), leftIcon: _jsx(Search, { size: 14 }), className: "w-72" }), _jsx(Button, { size: "dense", variant: "primary", leftIcon: _jsx(UserPlus, { size: 13 }), onClick: () => setIsNewRepModalOpen(true), children: "Add Representative" })] })] }), _jsx("div", { className: "overflow-x-auto mt-3", children: _jsxs("table", { className: "w-full text-xs text-left", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600 font-semibold border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2.5 px-3", children: "Representative Name" }), _jsx("th", { className: "py-2.5 px-3", children: "Customer Account" }), _jsx("th", { className: "py-2.5 px-3", children: "Designation & Department" }), _jsx("th", { className: "py-2.5 px-3", children: "Contact" }), _jsx("th", { className: "py-2.5 px-3", children: "VIP Protocol" }), _jsx("th", { className: "py-2.5 px-3", children: "Bilateral NDA" }), _jsx("th", { className: "py-2.5 px-3", children: "Safety Induction" }), _jsx("th", { className: "py-2.5 px-3 text-right", children: "Canonical Person" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: representatives.map(rep => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsxs("td", { className: "py-2.5 px-3", children: [_jsx("div", { className: "font-bold text-slate-900", children: rep.fullName }), _jsx("div", { className: "text-[10px] text-slate-400", children: rep.email })] }), _jsx("td", { className: "py-2.5 px-3 font-semibold text-slate-700", children: rep.accountName }), _jsxs("td", { className: "py-2.5 px-3 text-slate-700", children: [_jsx("div", { children: rep.designation }), rep.department && _jsx("div", { className: "text-[10px] text-slate-400", children: rep.department })] }), _jsx("td", { className: "py-2.5 px-3 font-mono text-slate-700", children: rep.phone }), _jsx("td", { className: "py-2.5 px-3", children: rep.isVip ? (_jsx("span", { className: "px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold", children: "VIP LEVEL 1" })) : (_jsx("span", { className: "text-slate-400 text-[10px]", children: "STANDARD" })) }), _jsx("td", { className: "py-2.5 px-3", children: _jsx("span", { className: "px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold", children: "VERIFIED" }) }), _jsx("td", { className: "py-2.5 px-3", children: _jsx("span", { className: "px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold", children: "VALID" }) }), _jsx("td", { className: "py-2.5 px-3 text-right font-mono text-slate-400", children: rep.canonicalPersonId })] }, rep.id))) })] }) })] })), (subView === 'VISITS' ||
                subView === 'MEETINGS' ||
                subView === 'AUDITS' ||
                subView === 'INSPECTIONS' ||
                subView === 'QUALITY' ||
                subView === 'TECHNICAL' ||
                subView === 'PLANT' ||
                subView === 'DELEGATIONS' ||
                subView === 'EXPECTED' ||
                subView === 'INSIDE' ||
                subView === 'APPROVALS' ||
                subView === 'EXCEPTIONS' ||
                subView === 'COMPLETED' ||
                subView === 'CANCELLED') && (_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("h2", { className: "text-sm font-bold text-slate-900", children: [subView === 'VISITS' && 'All Customer Visit Transactions', subView === 'MEETINGS' && 'Customer Meetings & Boardroom Engagements', subView === 'AUDITS' && 'Customer Audits (IATF / VDA 6.3 / ISO)', subView === 'INSPECTIONS' && 'Customer Tooling & PPAP Inspections', subView === 'QUALITY' && 'Quality & Process Benchmark Reviews', subView === 'TECHNICAL' && 'Technical & Engineering Joint Trials', subView === 'PLANT' && 'Plant Walkthroughs & VIP Tours', subView === 'DELEGATIONS' && 'Customer Delegations & Group Transport', subView === 'EXPECTED' && "Today's Expected Customer Visits", subView === 'INSIDE' && 'Live On-Premises Customer Roster', subView === 'APPROVALS' && 'Pending Customer Visit Approvals Queue', subView === 'EXCEPTIONS' && 'Visit Exceptions & Overstay Queue', subView === 'COMPLETED' && 'Completed Customer Visits Archive', subView === 'CANCELLED' && 'Cancelled & No-Show Customer Visits'] }), _jsxs("span", { className: "px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700", children: [filteredVisits.length, " Records"] })] }), _jsx("p", { className: "text-xs text-slate-500", children: "Filtered view with strict customer domain boundaries and embedded Scope 3 mobility capture." })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx(Input, { placeholder: "Search reference, account, lead...", value: searchTerm, onChange: e => setSearchTerm(e.target.value), leftIcon: _jsx(Search, { size: 14 }), className: "w-56" }), _jsxs("select", { "aria-label": "Filter by Customer Account", value: accountFilter, onChange: e => setAccountFilter(e.target.value), className: "text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-medium outline-none", children: [_jsx("option", { value: "ALL", children: "All Accounts" }), accounts.map(a => (_jsx("option", { value: a.id, children: a.legalName }, a.id)))] }), _jsxs("select", { "aria-label": "Filter by Visit Type", value: visitTypeFilter, onChange: e => setVisitTypeFilter(e.target.value), className: "text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-medium outline-none", children: [_jsx("option", { value: "ALL", children: "All Visit Types" }), _jsx("option", { value: "CUSTOMER_AUDIT", children: "Customer Audit" }), _jsx("option", { value: "CUSTOMER_INSPECTION", children: "Customer Inspection" }), _jsx("option", { value: "DELEGATION_VISIT", children: "Delegation Visit" }), _jsx("option", { value: "CUSTOMER_MEETING", children: "Customer Meeting" }), _jsx("option", { value: "QUALITY_VISIT", children: "Quality Visit" }), _jsx("option", { value: "TECHNICAL_VISIT", children: "Technical Visit" }), _jsx("option", { value: "PLANT_VISIT", children: "Plant Visit" })] }), _jsxs("select", { "aria-label": "Filter by Presence Status", value: presenceFilter, onChange: e => setPresenceFilter(e.target.value), className: "text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-medium outline-none", children: [_jsx("option", { value: "ALL", children: "All Statuses" }), _jsx("option", { value: "SCHEDULED", children: "Scheduled" }), _jsx("option", { value: "EXPECTED_TODAY", children: "Expected Today" }), _jsx("option", { value: "INSIDE", children: "Inside" }), _jsx("option", { value: "PARTIAL_INSIDE", children: "Partial Inside" }), _jsx("option", { value: "CHECKED_OUT", children: "Checked Out" }), _jsx("option", { value: "OVERSTAY", children: "Overstay" })] })] })] }), _jsx("div", { className: "overflow-x-auto mt-3", children: _jsxs("table", { className: "w-full text-xs text-left", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600 font-semibold border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2.5 px-3", children: "Reference" }), _jsx("th", { className: "py-2.5 px-3", children: "Customer Account" }), _jsx("th", { className: "py-2.5 px-3", children: "Visit Type" }), _jsx("th", { className: "py-2.5 px-3", children: "Lead & Participants" }), _jsx("th", { className: "py-2.5 px-3", children: "Internal Host" }), _jsx("th", { className: "py-2.5 px-3", children: "Schedule" }), _jsx("th", { className: "py-2.5 px-3", children: "Transport & Mobility" }), _jsx("th", { className: "py-2.5 px-3", children: "Stage / Presence" }), _jsx("th", { className: "py-2.5 px-3 text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: filteredVisits.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 9, className: "py-8 text-center text-slate-400", children: "No customer visit records match the selected filter criteria." }) })) : (filteredVisits.map(v => (_jsxs("tr", { className: "hover:bg-slate-50 transition-colors", children: [_jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-blue-700", children: v.referenceNumber }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx("div", { className: "font-bold text-slate-900", children: v.accountName }), _jsx("div", { className: "text-[10px] text-slate-400", children: v.classification })] }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800", children: v.visitTypeCode }), v.bookingMode === 'DELEGATION' && (_jsx("div", { className: "text-[10px] font-bold text-indigo-700 mt-0.5", children: "GROUP DELEGATION" }))] }), _jsxs("td", { className: "py-2.5 px-3", children: [_jsx("div", { className: "font-semibold text-slate-900", children: v.leadParticipantName }), _jsxs("div", { className: "text-[10px] text-slate-500", children: [v.participants.length, " participant", v.participants.length > 1 ? 's' : ''] })] }), _jsxs("td", { className: "py-2.5 px-3 text-slate-700", children: [_jsx("div", { children: v.hostName }), _jsx("div", { className: "text-[10px] text-slate-400", children: v.hostDepartment })] }), _jsxs("td", { className: "py-2.5 px-3 text-slate-600", children: [_jsx("div", { children: new Date(v.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }), _jsx("div", { className: "text-[10px] text-slate-400", children: new Date(v.scheduledStart).toLocaleDateString() })] }), _jsx("td", { className: "py-2.5 px-3", children: v.transport ? (_jsxs("div", { className: "text-slate-700", children: [_jsxs("div", { className: "flex items-center gap-1 font-semibold", children: [_jsx(Car, { size: 12, className: "text-slate-400" }), _jsx("span", { children: `${v.transport.mode} (${v.transport.distanceKm} km)` })] }), v.transport.isSharedDelegationVehicle && (_jsxs("div", { className: "text-[10px] text-indigo-700 font-bold", children: ["Shared Vehicle (Occ: ", v.transport.occupancy, ")"] })), v.esgActivity && (_jsxs("div", { className: "text-[10px] text-teal-700 font-bold flex items-center gap-0.5 mt-0.5", children: [_jsx(Leaf, { size: 10 }), _jsxs("span", { children: [v.esgActivity.emissionsKgCO2e, " kg CO2e"] })] }))] })) : (_jsx("span", { className: "text-slate-400 text-[11px]", children: "No transport data" })) }), _jsx("td", { className: "py-2.5 px-3", children: _jsxs("div", { className: "flex flex-col gap-0.5", children: [_jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold w-fit ${v.presenceStatus === 'INSIDE' ? 'bg-emerald-100 text-emerald-800' :
                                                                v.presenceStatus === 'PARTIAL_INSIDE' ? 'bg-teal-100 text-teal-800' :
                                                                    v.presenceStatus === 'OVERSTAY' ? 'bg-rose-100 text-rose-800' :
                                                                        v.presenceStatus === 'EXPECTED_TODAY' ? 'bg-blue-100 text-blue-800' :
                                                                            v.presenceStatus === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-600'}`, children: v.presenceStatus }), v.overstayMinutes && (_jsxs("span", { className: "text-[10px] font-bold text-rose-600", children: ["+", v.overstayMinutes, "m breach"] }))] }) }), _jsx("td", { className: "py-2.5 px-3 text-right", children: _jsxs("div", { className: "flex items-center justify-end gap-1", children: [(v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW') && (_jsx(Button, { size: "dense", variant: "primary", onClick: () => { setSelectedVisit(v); setIsApproveModalOpen(true); }, children: "Approve" })), (v.stage === 'APPROVED' || v.presenceStatus === 'EXPECTED_TODAY') && (_jsx(Button, { size: "dense", variant: "primary", onClick: () => { setSelectedVisit(v); setIsCheckInModalOpen(true); }, children: "Check In" })), (v.presenceStatus === 'INSIDE' || v.presenceStatus === 'PARTIAL_INSIDE' || v.presenceStatus === 'OVERSTAY') && (_jsx(Button, { size: "dense", variant: "secondary", onClick: () => { setSelectedVisit(v); setIsCheckOutModalOpen(true); }, children: "Check Out" })), v.presenceStatus === 'CHECKED_OUT' && v.stage !== 'CLOSED' && (_jsx(Button, { size: "dense", variant: "secondary", onClick: () => { setSelectedVisit(v); setIsClosureModalOpen(true); }, children: "Close Signoff" })), _jsx("button", { type: "button", onClick: () => { setSelectedVisit(v); setIsEPassModalOpen(true); }, className: "p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded", title: "View E-Pass QR", children: _jsx(QrCode, { size: 15 }) }), _jsx("button", { type: "button", onClick: () => { setSelectedVisit(v); setIsVisitDrawerOpen(true); }, className: "p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded", title: "View Full Details", children: _jsx(Eye, { size: 15 }) }), _jsx("button", { type: "button", onClick: () => { setSelectedVisit(v); setIsTraceabilityDrawerOpen(true); }, className: "p-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded", title: "Trace ESG Provenance", children: _jsx(Leaf, { size: 15 }) })] }) })] }, v.id)))) })] }) })] })), subView === 'NEW' && (_jsxs(Card, { className: "bg-white border border-slate-200 p-6 max-w-4xl mx-auto shadow-sm", children: [_jsxs("div", { className: "border-b border-slate-200 pb-4 mb-6", children: [_jsx("h2", { className: "text-base font-bold text-slate-900", children: "New Customer Visit Pre-Registration & Operational Mobility Capture" }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: "Captures customer account, delegation roster, bilateral NDA verification, and mobility vectors in-flow without leaking raw emissions equations." })] }), formSubmittedSuccess && (_jsx("div", { className: "mb-4", children: _jsx(Alert, { severity: "success", title: "Customer Visit Transaction Created Successfully!", children: "Visit registered with reference CUS-2026. Bilateral NDA verified and embedded GHG activity staged." }) })), _jsxs("form", { onSubmit: handleNewVisitSubmit, className: "space-y-6", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section A \u2014 Customer Account Selection" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Customer Account *" }), _jsx("select", { required: true, value: newAccountId, onChange: e => {
                                                            setNewAccountId(e.target.value);
                                                            const acc = accounts.find(a => a.id === e.target.value);
                                                            if (acc?.ndaAgreementNumber)
                                                                setNewNdaNumber(acc.ndaAgreementNumber);
                                                        }, className: "w-full text-xs p-2 border border-slate-300 rounded mt-1 bg-white font-medium", children: accounts.map(a => (_jsxs("option", { value: a.id, children: [a.legalName, " (", a.classification, " \u2022 ", a.accountTier, ")"] }, a.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Account Classification & NDA Status" }), _jsxs("div", { className: "mt-2 text-xs text-slate-700 flex items-center gap-2", children: [_jsx("span", { className: "font-bold", children: accounts.find(a => a.id === newAccountId)?.classification }), _jsx("span", { children: "\u2022" }), _jsxs("span", { className: "px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded", children: ["NDA: ", accounts.find(a => a.id === newAccountId)?.ndaStatus] })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section B \u2014 Visit Type, Purpose & Agenda" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Visit Type Code *" }), _jsxs("select", { value: newVisitType, onChange: e => setNewVisitType(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "CUSTOMER_AUDIT", children: "CUSTOMER_AUDIT (IATF / VDA 6.3 / ISO)" }), _jsx("option", { value: "CUSTOMER_INSPECTION", children: "CUSTOMER_INSPECTION (PPAP / Tooling)" }), _jsx("option", { value: "DELEGATION_VISIT", children: "DELEGATION_VISIT (Executive Group)" }), _jsx("option", { value: "CUSTOMER_MEETING", children: "CUSTOMER_MEETING (Commercial / Contract)" }), _jsx("option", { value: "QUALITY_VISIT", children: "QUALITY_VISIT (Quality Review)" }), _jsx("option", { value: "TECHNICAL_VISIT", children: "TECHNICAL_VISIT (Engineering Joint Trial)" }), _jsx("option", { value: "PLANT_VISIT", children: "PLANT_VISIT (Facility Tour)" }), _jsx("option", { value: "MANAGEMENT_VISIT", children: "MANAGEMENT_VISIT (C-Suite Briefing)" }), _jsx("option", { value: "PRODUCT_REVIEW", children: "PRODUCT_REVIEW" }), _jsx("option", { value: "PROCESS_REVIEW", children: "PROCESS_REVIEW" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Booking Mode *" }), _jsxs("select", { value: newBookingMode, onChange: e => setNewBookingMode(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "RESERVED", children: "RESERVED (Scheduled Ahead)" }), _jsx("option", { value: "DELEGATION", children: "DELEGATION (Multi-Participant Delegation)" }), _jsx("option", { value: "WALK_IN", children: "WALK_IN (Express Gate Arrival)" }), _jsx("option", { value: "RECURRING", children: "RECURRING (Multi-Day Series)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Confidentiality Policy" }), _jsxs("select", { value: newPhotographyPolicy, onChange: e => setNewPhotographyPolicy(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "STRICTLY_PROHIBITED", children: "STRICTLY_PROHIBITED (Camera Stickers Mandatory)" }), _jsx("option", { value: "ESCORTED_ONLY", children: "ESCORTED_ONLY (With Host)" }), _jsx("option", { value: "PERMITTED_COMMON_AREAS", children: "PERMITTED_COMMON_AREAS" })] })] }), _jsxs("div", { className: "md:col-span-3", children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Technical Agenda & SOW *" }), _jsx("textarea", { required: true, rows: 2, value: newAgenda, onChange: e => setNewAgenda(e.target.value), placeholder: "e.g. Annual Q4 IATF 16949 supplier audit covering high-voltage harness assembly, automated crimping cells, and barcode traceability verification.", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section C \u2014 Delegation & Participants" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Lead Customer Representative *" }), _jsxs("select", { value: newLeadRepId, onChange: e => setNewLeadRepId(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [representatives.filter(r => r.accountId === newAccountId).map(r => (_jsxs("option", { value: r.id, children: [r.fullName, " (", r.designation, ")"] }, r.id))), representatives.filter(r => r.accountId === newAccountId).length === 0 && (_jsx("option", { value: "", children: "No existing representatives for account \u2014 will create on fly" }))] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Additional Delegation Participants (Comma-separated)" }), _jsx("input", { type: "text", value: newAdditionalParticipants, onChange: e => setNewAdditionalParticipants(e.target.value), placeholder: "e.g. Dr. Kenji Sato, Hiroshi Tanaka, Yuki Nomura", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" }), _jsx("span", { className: "text-[10px] text-slate-400", children: "Creates individual participant items with synchronized delegation pass links." })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section D \u2014 Schedule & Plant Locations" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Scheduled Start *" }), _jsx("input", { type: "datetime-local", required: true, value: newScheduledStart, onChange: e => setNewScheduledStart(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Scheduled End *" }), _jsx("input", { type: "datetime-local", required: true, value: newScheduledEnd, onChange: e => setNewScheduledEnd(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Authorized Plant Zones *" }), _jsx("input", { type: "text", required: true, value: newAuthorizedZones, onChange: e => setNewAuthorizedZones(e.target.value), placeholder: "e.g. Administrative Boardroom, Main Assembly Line", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section E \u2014 Legal & Bilateral NDA Verification" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded border border-emerald-200", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-emerald-950", children: "Bilateral NDA Agreement Ref *" }), _jsx("input", { type: "text", required: true, value: newNdaNumber, onChange: e => setNewNdaNumber(e.target.value), className: "w-full text-xs p-2 border border-emerald-300 rounded mt-1 bg-white font-mono" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-emerald-950", children: "Pre-Check Enforcement" }), _jsxs("div", { className: "mt-2 text-xs text-emerald-800 flex items-center gap-1.5", children: [_jsx(ShieldCheck, { size: 14, className: "text-emerald-600" }), _jsx("span", { children: "Verified bilateral NDA required for gate entry access." })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section F \u2014 Internal Host & Department Sponsor" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Internal Host Employee *" }), _jsx("input", { type: "text", required: true, value: newHostName, onChange: e => setNewHostName(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-6", children: [_jsx("input", { type: "checkbox", id: "escortCheck", checked: newEscortRequired, onChange: e => setNewEscortRequired(e.target.checked), className: "h-4 w-4 text-blue-600 rounded border-slate-300" }), _jsx("label", { htmlFor: "escortCheck", className: "text-xs font-semibold text-slate-700", children: "Mandatory Internal Escort Required (Customer cannot walk plant unescorted)" })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section G \u2014 Transport Vectors & Mobility Facts" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200", children: [_jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Transport Mode *" }), _jsxs("select", { value: newTransportMode, onChange: e => setNewTransportMode(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "CAR", children: "CAR (Private / Hired)" }), _jsx("option", { value: "FLIGHT", children: "FLIGHT (Commercial Aviation)" }), _jsx("option", { value: "BUS", children: "BUS (Charter / Minibus)" }), _jsx("option", { value: "TRAIN", children: "TRAIN (Rail Transit)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Vehicle Class" }), _jsxs("select", { value: newVehicleClass, onChange: e => setNewVehicleClass(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "SEDAN", children: "SEDAN" }), _jsx("option", { value: "SUV", children: "SUV" }), _jsx("option", { value: "MINIBUS", children: "MINIBUS" }), _jsx("option", { value: "AIR_COMMERCIAL", children: "COMMERCIAL AIRCRAFT" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Fuel / Powertrain" }), _jsxs("select", { value: newFuelType, onChange: e => setNewFuelType(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "ELECTRIC", children: "ELECTRIC (BEV)" }), _jsx("option", { value: "DIESEL", children: "DIESEL" }), _jsx("option", { value: "PETROL", children: "PETROL" }), _jsx("option", { value: "CNG", children: "CNG" }), _jsx("option", { value: "AVIATION_FUEL", children: "AVIATION FUEL" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "One-way Distance (km) *" }), _jsx("input", { type: "number", required: true, min: 1, value: newDistanceKm, onChange: e => setNewDistanceKm(Number(e.target.value)), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Vehicle Registration Plate (Optional)" }), _jsx("input", { type: "text", value: newVehiclePlate, onChange: e => setNewVehiclePlate(e.target.value), placeholder: "e.g. TN-09-EV-8822", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 font-mono uppercase" })] }), _jsxs("div", { className: "md:col-span-2", children: [_jsx("label", { className: "text-[11px] font-semibold text-slate-700", children: "Journey Origin" }), _jsx("input", { type: "text", value: newOrigin, onChange: e => setNewOrigin(e.target.value), placeholder: "e.g. Hotel Leela Palace, Chennai", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { className: "md:col-span-4 flex items-center justify-between pt-2 border-t border-slate-200", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "sharedVehCheck", checked: newIsSharedVehicle, onChange: e => setNewIsSharedVehicle(e.target.checked), className: "h-4 w-4 text-indigo-600 rounded border-slate-300" }), _jsx("label", { htmlFor: "sharedVehCheck", className: "text-xs font-semibold text-indigo-900", children: "Shared Delegation Vehicle (1 Physical Movement Deduplicated)" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-semibold text-slate-700", children: "Total Vehicle Occupants:" }), _jsx("input", { type: "number", min: 1, max: 50, value: newOccupancy, onChange: e => setNewOccupancy(Number(e.target.value)), className: "w-16 text-xs p-1 border border-slate-300 rounded font-bold text-center" })] })] })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-2", children: "Section H \u2014 Embedded GHG Activity Preview (Scope 3 Category 6)" }), _jsxs("div", { className: "p-3 bg-teal-50 border border-teal-200 rounded flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5 text-teal-900 font-bold text-xs", children: [_jsx(Leaf, { size: 14, className: "text-teal-600" }), _jsx("span", { children: "Source Domain: CUSTOMER \u2022 Emission Category: Scope 3 Cat 6 Business Travel" })] }), _jsxs("div", { className: "text-[11px] text-teal-700 mt-0.5", children: ["Operational distance: ", newDistanceKm, " km \u2022 Asynchronous GHG engine will calculate verified emissions upon trip completion."] })] }), _jsxs("div", { className: "text-right", children: [_jsx("span", { className: "text-xs font-bold text-teal-900", children: "Est. Emissions" }), _jsxs("div", { className: "text-lg font-black text-teal-700", children: [(newDistanceKm * (newTransportMode === 'CAR' ? (newFuelType === 'ELECTRIC' ? 0.051 : 0.171) : 0.2458)).toFixed(2), " kg CO2e"] })] })] })] }), _jsxs("div", { className: "border-t border-slate-200 pt-4", children: [_jsx("h3", { className: "text-xs font-bold text-slate-900 uppercase tracking-wider mb-3", children: "Section I \u2014 Review & Submission" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Button, { type: "button", variant: "ghost", onClick: () => handleSelectSubView('VISITS'), children: "Cancel" }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Button, { type: "submit", variant: "primary", leftIcon: _jsx(CheckCircle2, { size: 15 }), children: "Submit Customer Visit" }) })] })] })] })] })), subView === 'NDA' && (_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Bilateral Non-Disclosure Agreements (NDA) Vault" }), _jsx("p", { className: "text-xs text-slate-500", children: "Mandatory bilateral legal agreements required for customer engineering, plant access, and audit reviews." })] }), _jsx(Button, { size: "dense", variant: "primary", leftIcon: _jsx(Plus, { size: 13 }), onClick: () => setIsNewAccountModalOpen(true), children: "Register Bilateral NDA" })] }), _jsx("div", { className: "overflow-x-auto mt-3", children: _jsxs("table", { className: "w-full text-xs text-left", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600 font-semibold border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2.5 px-3", children: "Customer Entity" }), _jsx("th", { className: "py-2.5 px-3", children: "Agreement Number" }), _jsx("th", { className: "py-2.5 px-3", children: "Status" }), _jsx("th", { className: "py-2.5 px-3", children: "Expiry Date" }), _jsx("th", { className: "py-2.5 px-3", children: "Photography Restriction" }), _jsx("th", { className: "py-2.5 px-3", children: "Account Manager" }), _jsx("th", { className: "py-2.5 px-3 text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: accounts.map(acc => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsxs("td", { className: "py-2.5 px-3", children: [_jsx("div", { className: "font-bold text-slate-900", children: acc.legalName }), _jsx("div", { className: "text-[10px] text-slate-400", children: acc.classification })] }), _jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-blue-700", children: acc.ndaAgreementNumber }), _jsx("td", { className: "py-2.5 px-3", children: _jsx("span", { className: `px-2 py-0.5 rounded text-[10px] font-bold ${acc.ndaStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                                                        acc.ndaStatus === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`, children: acc.ndaStatus }) }), _jsx("td", { className: "py-2.5 px-3 text-slate-700 font-mono", children: acc.ndaExpiryDate }), _jsx("td", { className: "py-2.5 px-3 text-slate-700", children: _jsx("span", { className: "font-semibold", children: acc.photographyPolicy }) }), _jsx("td", { className: "py-2.5 px-3 text-slate-700", children: acc.assignedAccountManager }), _jsx("td", { className: "py-2.5 px-3 text-right", children: _jsx(Button, { size: "dense", variant: "secondary", onClick: () => { setSelectedAccount(acc); setIsAccountDrawerOpen(true); }, children: "Inspect Vault" }) })] }, acc.id))) })] }) })] })), subView === 'HISTORY' && (_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "pb-3 border-b border-slate-200 mb-4", children: [_jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Customer Domain Audit & Historical Lifecycle Ledger" }), _jsx("p", { className: "text-xs text-slate-500", children: "Immutable trace of customer account setups, gate arrivals, escort handoffs, and closure signoffs." })] }), _jsx(Timeline, { events: [
                            {
                                id: 'evt-1',
                                time: '10:05 UTC',
                                date: '2026-10-11',
                                title: 'Partial Delegation Arrival Check-in',
                                description: '2 of 3 delegates from Toyota Asia arrived via Minibus TN-07-CNG-8812. Gate passes issued.',
                                actor: 'Gate Guard #02',
                                status: 'COMPLETED',
                                iconType: 'GATE_ENTRY',
                            },
                            {
                                id: 'evt-2',
                                time: '09:15 UTC',
                                date: '2026-10-11',
                                title: 'Tesla IATF Audit Team Checked In',
                                description: 'David Vance & Sophia Lin cleared Gate 1. Bilateral NDA verified against master vault.',
                                actor: 'Receptionist REC-01',
                                status: 'COMPLETED',
                                iconType: 'SECURITY',
                            },
                            {
                                id: 'evt-3',
                                time: '16:45 UTC',
                                date: '2026-10-10',
                                title: 'Technical Visit Closed With Engineering Signoff',
                                description: 'Liam O’Connor (Tesla) departure logged. Robot balancer firmware calibration report filed.',
                                actor: 'Vikram Mehta (VP Accounts)',
                                status: 'COMPLETED',
                                iconType: 'DOCUMENT',
                            },
                            {
                                id: 'evt-4',
                                time: '14:00 UTC',
                                date: '2026-10-09',
                                title: 'Customer Plant Walkthrough Cancelled',
                                description: 'Toyota safety director travel delayed due to typhoon warning. Visit marked NO_SHOW.',
                                actor: 'Host Automation',
                                status: 'ALERT',
                                iconType: 'ALERT',
                            },
                        ] })] })), subView === 'TRACEABILITY' && (_jsxs(Card, { className: "p-4 bg-white border border-slate-200", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Leaf, { size: 16, className: "text-teal-600" }), _jsx("h2", { className: "text-sm font-bold text-slate-900", children: "Customer ESG / GHG Scope 3 Category 6 Traceability Ledger" })] }), _jsx("p", { className: "text-xs text-slate-500", children: "Full end-to-end provenance: Customer Visit \u2192 Shared Transport Movement \u2192 GHG Activity \u2192 Scope 3 Cat 6 Calculation." })] }), _jsxs("div", { className: "p-2 bg-teal-50 border border-teal-200 rounded text-right", children: [_jsx("span", { className: "text-[10px] font-bold text-teal-800 uppercase tracking-wider block", children: "Total Customer Footprint" }), _jsxs("span", { className: "text-base font-black text-teal-700", children: [kpis.totalEmissionsKgCO2e, " kg CO2e"] })] })] }), _jsx("div", { className: "overflow-x-auto mt-3", children: _jsxs("table", { className: "w-full text-xs text-left", children: [_jsx("thead", { className: "bg-slate-50 text-slate-600 font-semibold border-b border-slate-200", children: _jsxs("tr", { children: [_jsx("th", { className: "py-2.5 px-3", children: "GHG Activity ID" }), _jsx("th", { className: "py-2.5 px-3", children: "Customer Visit Ref" }), _jsx("th", { className: "py-2.5 px-3", children: "Customer Account" }), _jsx("th", { className: "py-2.5 px-3", children: "Mobility Mode" }), _jsx("th", { className: "py-2.5 px-3", children: "Distance & Occupancy" }), _jsx("th", { className: "py-2.5 px-3", children: "Emission Factor Applied" }), _jsx("th", { className: "py-2.5 px-3", children: "GHG Scope & Cat" }), _jsx("th", { className: "py-2.5 px-3", children: "Calculated CO2e" }), _jsx("th", { className: "py-2.5 px-3 text-right", children: "Provenance" })] }) }), _jsx("tbody", { className: "divide-y divide-slate-100", children: visits.filter(v => v.esgActivity).map(v => (_jsxs("tr", { className: "hover:bg-slate-50", children: [_jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-teal-700", children: v.esgActivity?.activityId }), _jsx("td", { className: "py-2.5 px-3 font-mono font-bold text-blue-700", children: v.referenceNumber }), _jsx("td", { className: "py-2.5 px-3 font-semibold text-slate-900", children: v.accountName }), _jsxs("td", { className: "py-2.5 px-3 text-slate-700", children: [v.transport?.mode, " (", v.transport?.fuelType, ")"] }), _jsxs("td", { className: "py-2.5 px-3 text-slate-700", children: [_jsxs("div", { children: [v.transport?.distanceKm, " km"] }), _jsxs("div", { className: "text-[10px] text-slate-400", children: ["Occ: ", v.transport?.occupancy, " pax"] })] }), _jsx("td", { className: "py-2.5 px-3 text-slate-600 font-mono text-[10px]", children: v.esgActivity?.emissionFactorUsed }), _jsx("td", { className: "py-2.5 px-3", children: _jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800", children: "SCOPE 3 CAT 6" }) }), _jsxs("td", { className: "py-2.5 px-3 font-mono font-bold text-teal-800 text-sm", children: [v.esgActivity?.emissionsKgCO2e, " kg"] }), _jsx("td", { className: "py-2.5 px-3 text-right", children: _jsx("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700", children: v.transport?.provenance }) })] }, v.id))) })] }) })] })), isEPassModalOpen && selectedVisit && (_jsx(Modal, { isOpen: isEPassModalOpen, onClose: () => setIsEPassModalOpen(false), title: "Customer Representative E-Pass & Gate Badge", children: _jsxs("div", { className: "flex flex-col items-center p-4 text-center", children: [_jsxs("div", { className: "p-4 bg-white border-2 border-slate-900 rounded-lg shadow-sm w-full max-w-xs", children: [_jsxs("div", { className: "flex items-center justify-between pb-2 border-b border-slate-200", children: [_jsx("span", { className: "text-[10px] font-bold text-slate-500 uppercase", children: "VMS ENTERPRISE" }), _jsx("span", { className: "text-[10px] font-bold text-blue-700 bg-blue-50 px-1 rounded", children: "CUSTOMER PASS" })] }), _jsxs("div", { className: "py-4", children: [_jsx("div", { className: "w-32 h-32 bg-slate-900 mx-auto flex items-center justify-center rounded", children: _jsx(QrCode, { size: 100, className: "text-white" }) }), _jsx("div", { className: "font-mono font-bold text-xs text-slate-900 mt-2", children: selectedVisit.referenceNumber })] }), _jsxs("div", { className: "text-left text-xs border-t border-slate-200 pt-2 space-y-1", children: [_jsxs("div", { children: [_jsx("strong", { children: "Account:" }), " ", selectedVisit.accountName] }), _jsxs("div", { children: [_jsx("strong", { children: "Lead:" }), " ", selectedVisit.leadParticipantName] }), _jsxs("div", { children: [_jsx("strong", { children: "Type:" }), " ", selectedVisit.visitTypeCode] }), _jsxs("div", { children: [_jsx("strong", { children: "Host:" }), " ", selectedVisit.hostName] }), _jsxs("div", { children: [_jsx("strong", { children: "Valid:" }), " ", new Date(selectedVisit.scheduledStart).toLocaleDateString()] }), _jsxs("div", { children: [_jsx("strong", { children: "NDA:" }), " ", selectedVisit.ndaAgreementNumber, " (Verified)"] })] })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx(Button, { size: "dense", variant: "secondary", leftIcon: _jsx(Printer, { size: 14 }), onClick: () => alert('Printing pass...'), children: "Print Badge" }), _jsx(Button, { size: "dense", variant: "primary", onClick: () => setIsEPassModalOpen(false), children: "Close" })] })] }) })), isCheckInModalOpen && selectedVisit && (_jsx(Modal, { isOpen: isCheckInModalOpen, onClose: () => setIsCheckInModalOpen(false), title: `Gate Check-In — ${selectedVisit.referenceNumber}`, children: _jsxs("div", { className: "space-y-4 p-2 text-xs", children: [_jsxs("div", { className: "p-3 bg-blue-50 border border-blue-200 rounded text-blue-900", children: [_jsxs("div", { className: "font-bold", children: ["Customer Account: ", selectedVisit.accountName] }), _jsxs("div", { children: ["Lead: ", selectedVisit.leadParticipantName, " \u2022 Participants: ", selectedVisit.participants.length] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { size: 16, className: "text-emerald-600" }), _jsxs("span", { children: ["Bilateral NDA Verified (", selectedVisit.ndaAgreementNumber, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { size: 16, className: "text-emerald-600" }), _jsxs("span", { children: ["Camera Restriction Sticker Applied (", selectedVisit.photographyPolicy, ")"] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(CheckCircle2, { size: 16, className: "text-emerald-600" }), _jsxs("span", { children: ["Internal Escort Assigned (", selectedVisit.hostName, ")"] })] })] }), _jsxs("div", { className: "border-t border-slate-200 pt-3 flex justify-end gap-2", children: [_jsx(Button, { size: "dense", variant: "ghost", onClick: () => setIsCheckInModalOpen(false), children: "Cancel" }), _jsx(Button, { size: "dense", variant: "primary", onClick: () => handleCheckInVisit(selectedVisit.id), children: "Confirm Gate Check-In" })] })] }) })), isCheckOutModalOpen && selectedVisit && (_jsx(Modal, { isOpen: isCheckOutModalOpen, onClose: () => setIsCheckOutModalOpen(false), title: `Gate Check-Out — ${selectedVisit.referenceNumber}`, children: _jsxs("div", { className: "space-y-4 p-2 text-xs", children: [_jsxs("div", { className: "p-3 bg-slate-50 border border-slate-200 rounded", children: [_jsx("div", { className: "font-bold text-slate-900", children: selectedVisit.accountName }), _jsxs("div", { className: "text-slate-600", children: ["Lead: ", selectedVisit.leadParticipantName] }), selectedVisit.overstayMinutes && (_jsxs("div", { className: "text-rose-600 font-bold mt-1", children: ["Overstay duration: +", selectedVisit.overstayMinutes, " minutes recorded."] }))] }), _jsx("p", { className: "text-slate-600", children: "Confirming gate departure will log exit gate event and finalize asynchronous GHG mobility calculation for Scope 3 disclosures." }), _jsxs("div", { className: "border-t border-slate-200 pt-3 flex justify-end gap-2", children: [_jsx(Button, { size: "dense", variant: "ghost", onClick: () => setIsCheckOutModalOpen(false), children: "Cancel" }), _jsx(Button, { size: "dense", variant: "primary", onClick: () => handleCheckOutVisit(selectedVisit.id), children: "Confirm Gate Departure" })] })] }) })), isApproveModalOpen && selectedVisit && (_jsx(Modal, { isOpen: isApproveModalOpen, onClose: () => setIsApproveModalOpen(false), title: `Review Customer Visit — ${selectedVisit.referenceNumber}`, children: _jsxs("div", { className: "space-y-4 p-2 text-xs", children: [_jsxs("div", { className: "p-3 bg-slate-50 border border-slate-200 rounded space-y-1", children: [_jsxs("div", { children: [_jsx("strong", { children: "Account:" }), " ", selectedVisit.accountName, " (", selectedVisit.classification, ")"] }), _jsxs("div", { children: [_jsx("strong", { children: "Visit Type:" }), " ", selectedVisit.visitTypeCode] }), _jsxs("div", { children: [_jsx("strong", { children: "Lead Delegate:" }), " ", selectedVisit.leadParticipantName] }), _jsxs("div", { children: [_jsx("strong", { children: "Host:" }), " ", selectedVisit.hostName] }), _jsxs("div", { children: [_jsx("strong", { children: "Schedule:" }), " ", new Date(selectedVisit.scheduledStart).toLocaleString()] }), _jsxs("div", { children: [_jsx("strong", { children: "Agenda:" }), " ", selectedVisit.agenda] })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700 block mb-1", children: "Approval Comments / Audit Notes" }), _jsx("textarea", { rows: 2, value: approvalComment, onChange: e => setApprovalComment(e.target.value), placeholder: "Optional host or security manager approval note...", className: "w-full text-xs p-2 border border-slate-200 rounded" })] }), _jsxs("div", { className: "border-t border-slate-200 pt-3 flex items-center justify-between", children: [_jsx(Button, { size: "dense", variant: "danger", onClick: () => handleRejectVisit(selectedVisit.id), children: "Reject Visit" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "dense", variant: "ghost", onClick: () => setIsApproveModalOpen(false), children: "Cancel" }), _jsx(Button, { size: "dense", variant: "primary", onClick: () => handleApproveVisit(selectedVisit.id), children: "Approve Visit" })] })] })] }) })), isClosureModalOpen && selectedVisit && (_jsx(Modal, { isOpen: isClosureModalOpen, onClose: () => setIsClosureModalOpen(false), title: `Customer Visit Closure Signoff — ${selectedVisit.referenceNumber}`, children: _jsxs("div", { className: "space-y-4 p-2 text-xs", children: [_jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700 block mb-1", children: "Executive Closure Summary *" }), _jsx("textarea", { required: true, rows: 3, value: closureSummary, onChange: e => setClosureSummary(e.target.value), placeholder: "Summarize visit outcome, audit findings, technical deliverables, or next steps...", className: "w-full text-xs p-2 border border-slate-200 rounded" })] }), selectedVisit.visitTypeCode === 'CUSTOMER_AUDIT' && (_jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700 block mb-1", children: "Audit Findings / Observations Count" }), _jsx("input", { type: "number", min: 0, value: closureFindingsCount, onChange: e => setClosureFindingsCount(Number(e.target.value)), className: "w-24 text-xs p-1.5 border border-slate-200 rounded font-bold" })] })), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "checkbox", id: "followUpCheck", checked: closureFollowUp, onChange: e => setClosureFollowUp(e.target.checked), className: "h-4 w-4 text-blue-600 rounded border-slate-300" }), _jsx("label", { htmlFor: "followUpCheck", className: "font-semibold text-slate-700", children: "Corrective Action Request (CAR) or Follow-Up Required" })] }), _jsxs("div", { className: "border-t border-slate-200 pt-3 flex justify-end gap-2", children: [_jsx(Button, { size: "dense", variant: "ghost", onClick: () => setIsClosureModalOpen(false), children: "Cancel" }), _jsx(Button, { size: "dense", variant: "primary", onClick: () => handleCloseVisitWithReport(selectedVisit.id), children: "Sign Off & Close" })] })] }) })), isNewAccountModalOpen && (_jsx(Modal, { isOpen: isNewAccountModalOpen, onClose: () => setIsNewAccountModalOpen(false), title: "Register New Customer Account", children: _jsxs("form", { onSubmit: handleCreateAccountSubmit, className: "space-y-4 p-2 text-xs", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Legal Entity Name *" }), _jsx("input", { type: "text", required: true, value: accountLegalName, onChange: e => setAccountLegalName(e.target.value), placeholder: "e.g. Ford Motor Company", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Trade / Brand Name" }), _jsx("input", { type: "text", value: accountTradeName, onChange: e => setAccountTradeName(e.target.value), placeholder: "e.g. Ford", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Account Code *" }), _jsx("input", { type: "text", required: true, value: accountCode, onChange: e => setAccountCode(e.target.value), placeholder: "CUS-ACC-FORD", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 font-mono uppercase" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Classification *" }), _jsxs("select", { value: accountClassification, onChange: e => setAccountClassification(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "TIER_1_OEM", children: "TIER_1_OEM" }), _jsx("option", { value: "TIER_2_SUPPLIER", children: "TIER_2_SUPPLIER" }), _jsx("option", { value: "STRATEGIC_ACCOUNT", children: "STRATEGIC_ACCOUNT" }), _jsx("option", { value: "KEY_ACCOUNT", children: "KEY_ACCOUNT" }), _jsx("option", { value: "STANDARD", children: "STANDARD" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Account Tier" }), _jsxs("select", { value: accountTier, onChange: e => setAccountTier(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white", children: [_jsx("option", { value: "PLATINUM", children: "PLATINUM" }), _jsx("option", { value: "GOLD", children: "GOLD" }), _jsx("option", { value: "SILVER", children: "SILVER" }), _jsx("option", { value: "BRONZE", children: "BRONZE" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Assigned Account Manager" }), _jsx("input", { type: "text", value: accountManager, onChange: e => setAccountManager(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Primary Contact Person" }), _jsx("input", { type: "text", value: accountContact, onChange: e => setAccountContact(e.target.value), placeholder: "e.g. Sarah Jenkins", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Contact Email" }), _jsx("input", { type: "email", value: accountEmail, onChange: e => setAccountEmail(e.target.value), placeholder: "sjenkins@ford.com", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Bilateral NDA Number *" }), _jsx("input", { type: "text", required: true, value: accountNdaNumber, onChange: e => setAccountNdaNumber(e.target.value), placeholder: "NDA-2026-FORD-01", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 font-mono uppercase" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "NDA Expiration Date" }), _jsx("input", { type: "date", value: accountNdaExpiry, onChange: e => setAccountNdaExpiry(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] })] }), _jsxs("div", { className: "border-t border-slate-200 pt-3 flex justify-end gap-2", children: [_jsx(Button, { size: "dense", variant: "ghost", onClick: () => setIsNewAccountModalOpen(false), children: "Cancel" }), _jsx(Button, { size: "dense", variant: "primary", type: "submit", children: "Create Account" })] })] }) })), isNewRepModalOpen && (_jsx(Modal, { isOpen: isNewRepModalOpen, onClose: () => setIsNewRepModalOpen(false), title: "Add Customer Representative", children: _jsxs("form", { onSubmit: handleCreateRepSubmit, className: "space-y-4 p-2 text-xs", children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "col-span-2", children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Customer Account *" }), _jsx("select", { value: repAccountId, onChange: e => setRepAccountId(e.target.value), className: "w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white font-medium", children: accounts.map(a => (_jsx("option", { value: a.id, children: a.legalName }, a.id))) })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Full Legal Name *" }), _jsx("input", { type: "text", required: true, value: repFullName, onChange: e => setRepFullName(e.target.value), placeholder: "e.g. Ramesh Chandran", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Official Email *" }), _jsx("input", { type: "email", required: true, value: repEmail, onChange: e => setRepEmail(e.target.value), placeholder: "rchandran@customer.com", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Mobile Phone *" }), _jsx("input", { type: "tel", required: true, value: repPhone, onChange: e => setRepPhone(e.target.value), placeholder: "+91-9884011223", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Designation *" }), _jsx("input", { type: "text", required: true, value: repDesignation, onChange: e => setRepDesignation(e.target.value), placeholder: "e.g. Senior Quality Auditor", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "font-semibold text-slate-700", children: "Department" }), _jsx("input", { type: "text", value: repDepartment, onChange: e => setRepDepartment(e.target.value), placeholder: "e.g. Global Powertrain Sourcing", className: "w-full text-xs p-2 border border-slate-200 rounded mt-1" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-6", children: [_jsx("input", { type: "checkbox", id: "repVipCheck", checked: repIsVip, onChange: e => setRepIsVip(e.target.checked), className: "h-4 w-4 text-amber-600 rounded border-slate-300" }), _jsx("label", { htmlFor: "repVipCheck", className: "font-semibold text-slate-700", children: "VIP Protocol Required (Executive Escort)" })] })] }), _jsxs("div", { className: "border-t border-slate-200 pt-3 flex justify-end gap-2", children: [_jsx(Button, { size: "dense", variant: "ghost", onClick: () => setIsNewRepModalOpen(false), children: "Cancel" }), _jsx(Button, { size: "dense", variant: "primary", type: "submit", children: "Register Representative" })] })] }) })), isVisitDrawerOpen && selectedVisit && (_jsx(Drawer, { isOpen: isVisitDrawerOpen, onClose: () => setIsVisitDrawerOpen(false), title: `Visit Inspection — ${selectedVisit.referenceNumber}`, children: _jsxs("div", { className: "p-4 space-y-5 text-xs", children: [_jsxs("div", { className: "p-3 bg-slate-50 border border-slate-200 rounded space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-mono font-bold text-blue-700 text-sm", children: selectedVisit.referenceNumber }), _jsx("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800", children: selectedVisit.presenceStatus })] }), _jsx("div", { className: "font-bold text-slate-900 text-sm", children: selectedVisit.accountName }), _jsxs("div", { className: "text-slate-500", children: ["Tier: ", selectedVisit.classification, " \u2022 Mode: ", selectedVisit.bookingMode] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]", children: "Delegation Roster" }), _jsx("div", { className: "divide-y divide-slate-100 border border-slate-200 rounded", children: selectedVisit.participants.map(p => (_jsxs("div", { className: "p-2 flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "font-bold text-slate-900", children: [p.name, " ", p.isLead && _jsx("span", { className: "text-[10px] text-blue-600", children: "(Lead)" })] }), _jsxs("div", { className: "text-[10px] text-slate-400", children: [p.designation, " \u2022 ", p.email] })] }), _jsx("span", { className: "px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700", children: p.status })] }, p.id))) })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]", children: "Bilateral Legal Compliance" }), _jsxs("div", { className: "space-y-1 bg-emerald-50 p-2.5 rounded border border-emerald-200 text-emerald-900", children: [_jsxs("div", { children: [_jsx("strong", { children: "NDA Agreement:" }), " ", selectedVisit.ndaAgreementNumber] }), _jsxs("div", { children: [_jsx("strong", { children: "NDA Status:" }), " ", selectedVisit.ndaVerified ? 'VERIFIED' : 'UNVERIFIED'] }), _jsxs("div", { children: [_jsx("strong", { children: "Photography Policy:" }), " ", selectedVisit.photographyPolicy] })] })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]", children: "Transport & Scope 3 Footprint" }), selectedVisit.transport && (_jsxs("div", { className: "space-y-1 bg-teal-50 p-2.5 rounded border border-teal-200 text-teal-900", children: [_jsxs("div", { children: [_jsx("strong", { children: "Mode:" }), " ", selectedVisit.transport.mode, " (", selectedVisit.transport.fuelType, ")"] }), _jsxs("div", { children: [_jsx("strong", { children: "Distance:" }), " ", selectedVisit.transport.distanceKm, " km"] }), _jsxs("div", { children: [_jsx("strong", { children: "Occupancy:" }), " ", selectedVisit.transport.occupancy, " occupants"] }), _jsxs("div", { children: [_jsx("strong", { children: "Shared Delegation Vehicle:" }), " ", selectedVisit.transport.isSharedDelegationVehicle ? 'YES (Deduplicated)' : 'NO'] }), selectedVisit.esgActivity && (_jsxs("div", { className: "pt-1 mt-1 border-t border-teal-200", children: [_jsx("strong", { children: "Scope 3 Cat 6 Carbon:" }), " ", selectedVisit.esgActivity.emissionsKgCO2e, " kg CO2e (", selectedVisit.esgActivity.calculationStatus, ")"] }))] }))] }), selectedVisit.closureReport && (_jsxs("div", { children: [_jsx("h4", { className: "font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]", children: "Formal Closure Report" }), _jsxs("div", { className: "p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1 text-slate-800", children: [_jsxs("div", { children: [_jsx("strong", { children: "Closed At:" }), " ", new Date(selectedVisit.closureReport.closedAt).toLocaleString()] }), _jsxs("div", { children: [_jsx("strong", { children: "Signoff By:" }), " ", selectedVisit.closureReport.closedBy] }), _jsx("p", { className: "mt-1 text-slate-600", children: selectedVisit.closureReport.executiveSummary })] })] }))] }) })), isAccountDrawerOpen && selectedAccount && (_jsx(Drawer, { isOpen: isAccountDrawerOpen, onClose: () => setIsAccountDrawerOpen(false), title: `Customer Master — ${selectedAccount.legalName}`, children: _jsxs("div", { className: "p-4 space-y-5 text-xs", children: [_jsxs("div", { className: "p-3 bg-blue-50 border border-blue-200 rounded space-y-1", children: [_jsx("span", { className: "font-mono font-bold text-blue-700", children: selectedAccount.accountCode }), _jsx("div", { className: "font-bold text-slate-900 text-sm", children: selectedAccount.legalName }), _jsxs("div", { className: "text-slate-600", children: ["Tier: ", selectedAccount.accountTier, " \u2022 ", selectedAccount.classification] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("strong", { children: "Assigned Account Manager:" }), " ", selectedAccount.assignedAccountManager] }), _jsxs("div", { children: [_jsx("strong", { children: "Primary Contact:" }), " ", selectedAccount.contactPerson, " (", selectedAccount.contactEmail, ")"] }), _jsxs("div", { children: [_jsx("strong", { children: "Phone:" }), " ", selectedAccount.contactPhone] }), _jsxs("div", { children: [_jsx("strong", { children: "Active Visits on Site:" }), " ", selectedAccount.activeVisitsCount] }), _jsxs("div", { children: [_jsx("strong", { children: "Lifetime Completed Visits:" }), " ", selectedAccount.totalVisitsCount] })] }), _jsxs("div", { className: "p-3 bg-emerald-50 border border-emerald-200 rounded space-y-1", children: [_jsx("div", { className: "font-bold text-emerald-900", children: "Bilateral NDA Vault Record" }), _jsxs("div", { children: ["Agreement ID: ", _jsx("span", { className: "font-mono", children: selectedAccount.ndaAgreementNumber })] }), _jsxs("div", { children: ["Expiry: ", selectedAccount.ndaExpiryDate] }), _jsxs("div", { children: ["Status: ", _jsx("strong", { children: selectedAccount.ndaStatus })] }), _jsxs("div", { children: ["Photography Policy: ", _jsx("strong", { children: selectedAccount.photographyPolicy })] })] })] }) })), isTraceabilityDrawerOpen && selectedVisit && (_jsx(Drawer, { isOpen: isTraceabilityDrawerOpen, onClose: () => setIsTraceabilityDrawerOpen(false), title: `ESG Provenance Chain — ${selectedVisit.referenceNumber}`, children: _jsxs("div", { className: "p-4 space-y-4 text-xs", children: [_jsxs("div", { className: "p-3 bg-teal-50 border border-teal-200 rounded", children: [_jsx("div", { className: "text-[11px] font-bold text-teal-800 uppercase tracking-wider", children: "Provenance Verification Chain" }), _jsx("div", { className: "text-xs text-teal-900 mt-1 font-semibold", children: "Source Domain: CUSTOMER \u2022 Target Disclosure: GHG Protocol Scope 3 Cat 6" })] }), _jsxs("div", { className: "space-y-3 relative pl-6 border-l-2 border-teal-500", children: [_jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" }), _jsx("strong", { className: "block text-slate-900", children: "1. Customer Operational Visit" }), _jsx("span", { className: "text-slate-500 font-mono", children: selectedVisit.referenceNumber }), " (", selectedVisit.accountName, ")"] }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" }), _jsx("strong", { className: "block text-slate-900", children: "2. Shared Transport Activity Record" }), _jsxs("span", { className: "text-slate-600", children: ["Mode: ", selectedVisit.transport?.mode, " \u2022 Class: ", selectedVisit.transport?.vehicleClass, " \u2022 Fuel: ", selectedVisit.transport?.fuelType] }), _jsx("div", { className: "text-[10px] text-slate-400", children: selectedVisit.transport?.isSharedDelegationVehicle ? 'Group journey deduplication applied: 1 vehicle movement' : 'Individual journey' })] }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" }), _jsx("strong", { className: "block text-slate-900", children: "3. Embedded GHG Activity Record" }), _jsx("span", { className: "text-slate-700 font-mono", children: selectedVisit.esgActivity?.activityId }), _jsxs("div", { className: "text-[10px] text-slate-500", children: ["Quantity: ", selectedVisit.esgActivity?.activityQuantity, " ", selectedVisit.esgActivity?.activityUnit] })] }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" }), _jsx("strong", { className: "block text-slate-900", children: "4. Emission Factor Grounding" }), _jsx("span", { className: "text-slate-700 font-mono text-[10px]", children: selectedVisit.esgActivity?.emissionFactorUsed })] }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" }), _jsx("strong", { className: "block text-slate-900", children: "5. Calculated Carbon Disclosures" }), _jsxs("div", { className: "text-base font-bold text-teal-800", children: [selectedVisit.esgActivity?.emissionsKgCO2e, " kg CO2e"] }), _jsxs("span", { className: "text-[10px] text-slate-400", children: ["Provenance: ", selectedVisit.transport?.provenance] })] })] })] }) }))] }));
};
