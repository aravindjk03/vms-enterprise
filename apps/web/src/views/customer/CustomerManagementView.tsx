import React, { useState, useMemo } from 'react';
import {
  Building2,
  Handshake,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  ShieldCheck,
  Leaf,
  Car,
  FileCheck,
  FileText,
  QrCode,
  Search,
  Filter,
  Download,
  ArrowRight,
  Eye,
  Check,
  X,
  RefreshCw,
  Printer,
  AlertOctagon,
  Briefcase,
  Plus,
  ChevronRight,
  Layers,
  Sparkles,
  UserPlus,
  Award,
  ClipboardCheck,
  Scale,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  HelpCircle,
  History,
  UserX,
  UserCheck,
  BarChart3
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import {
  Button,
  Input,
  Select,
  Card,
  Section,
  StatusBadge,
  Banner,
  Alert,
  DataTable,
  Modal,
  Drawer,
  Timeline,
  type ColumnDef,
} from '@vms/ui';
import type {
  EnterpriseRole,
  CustomerClassification,
  CustomerAccountTier,
  CustomerAccountStatus,
  CustomerVisitTypeCode,
  CustomerBookingMode,
  CustomerPhotographyPolicy,
} from '@vms/types';

export type CustomerSubView =
  | 'DASHBOARD'
  | 'ACCOUNTS'
  | 'REPRESENTATIVES'
  | 'VISITS'
  | 'NEW'
  | 'MEETINGS'
  | 'AUDITS'
  | 'INSPECTIONS'
  | 'QUALITY'
  | 'TECHNICAL'
  | 'PLANT'
  | 'DELEGATIONS'
  | 'EXPECTED'
  | 'INSIDE'
  | 'APPROVALS'
  | 'NDA'
  | 'EXCEPTIONS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HISTORY'
  | 'TRACEABILITY';

export interface CustomerAccountItem {
  id: string;
  accountCode: string;
  legalName: string;
  tradeName?: string;
  classification: CustomerClassification;
  accountTier: CustomerAccountTier;
  status: CustomerAccountStatus;
  assignedAccountManager: string;
  ndaStatus: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'MISSING';
  ndaAgreementNumber?: string;
  ndaExpiryDate?: string;
  photographyPolicy: CustomerPhotographyPolicy;
  activeVisitsCount: number;
  totalVisitsCount: number;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export interface CustomerRepresentativeItem {
  id: string;
  accountId: string;
  accountName: string;
  canonicalPersonId: string;
  fullName: string;
  phone: string;
  email: string;
  designation: string;
  department?: string;
  isVip: boolean;
  ndaSigned: boolean;
  safetyInductionValid: boolean;
}

export interface CustomerParticipantItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  isLead: boolean;
  status: 'SCHEDULED' | 'ARRIVED' | 'INSIDE' | 'CHECKED_OUT' | 'NO_SHOW';
  gatePassNumber?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export interface CustomerVisitItem {
  id: string;
  referenceNumber: string;
  accountId: string;
  accountName: string;
  classification: CustomerClassification;
  visitTypeCode: CustomerVisitTypeCode;
  bookingMode: CustomerBookingMode;
  leadParticipantName: string;
  participants: CustomerParticipantItem[];
  hostUserId: string;
  hostName: string;
  hostDepartment: string;
  siteId: string;
  siteName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualArrival?: string;
  actualEntry?: string;
  actualExit?: string;
  stage: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'SCHEDULED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'CHECKED_OUT' | 'CLOSED' | 'REJECTED' | 'CANCELLED';
  presenceStatus: 'SCHEDULED' | 'EXPECTED_TODAY' | 'ARRIVED' | 'INSIDE' | 'PARTIAL_INSIDE' | 'CHECKED_OUT' | 'NO_SHOW' | 'OVERSTAY';
  overstayMinutes?: number;
  authorizedZones: string[];
  ndaVerified: boolean;
  ndaAgreementNumber: string;
  escortRequired: boolean;
  photographyPolicy: CustomerPhotographyPolicy;
  agenda: string;
  auditDetails?: {
    auditType: string;
    auditScope: string;
    leadAuditor: string;
    findingsCount?: number;
    closureStatus?: string;
  };
  inspectionDetails?: {
    category: string;
    inspectionScope: string;
    leadInspector: string;
  };
  transport?: {
    mode: string;
    vehicleClass: string;
    fuelType: string;
    distanceKm: number;
    occupancy: number;
    isSharedDelegationVehicle: boolean;
    vehiclePlate?: string;
    origin: string;
    provenance: string;
  };
  esgActivity?: {
    activityId: string;
    sourceDomain: 'CUSTOMER';
    activityQuantity: number;
    activityUnit: string;
    scope: 'SCOPE_3_CAT_6';
    emissionsKgCO2e: number;
    calculationStatus: 'CALCULATED' | 'PENDING' | 'RECALCULATED';
    emissionFactorUsed: string;
  };
  closureReport?: {
    closedAt: string;
    closedBy: string;
    executiveSummary: string;
    followUpRequired: boolean;
  };
}

export interface CustomerManagementViewProps {
  initialSubView?: CustomerSubView;
  currentRole?: EnterpriseRole;
  onNavigateSubView?: (view: CustomerSubView) => void;
  siteId?: string;
}

// Canonical Pre-seeded Customer Accounts
const INITIAL_ACCOUNTS: CustomerAccountItem[] = [
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
const INITIAL_REPRESENTATIVES: CustomerRepresentativeItem[] = [
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
const INITIAL_VISITS: CustomerVisitItem[] = [
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

export const CustomerManagementView: React.FC<CustomerManagementViewProps> = ({
  initialSubView = 'DASHBOARD',
  currentRole = 'SUPER_ADMIN',
  onNavigateSubView,
  siteId = 'SITE-CHN-01',
}) => {
  const [subView, setSubView] = useState<CustomerSubView>(initialSubView);
  const [accounts, setAccounts] = useState<CustomerAccountItem[]>(INITIAL_ACCOUNTS);
  const [representatives, setRepresentatives] = useState<CustomerRepresentativeItem[]>(INITIAL_REPRESENTATIVES);
  const [visits, setVisits] = useState<CustomerVisitItem[]>(INITIAL_VISITS);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accountFilter, setAccountFilter] = useState<string>('ALL');
  const [visitTypeFilter, setVisitTypeFilter] = useState<string>('ALL');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [presenceFilter, setPresenceFilter] = useState<string>('ALL');

  // Selected Entities & Modals
  const [selectedVisit, setSelectedVisit] = useState<CustomerVisitItem | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<CustomerAccountItem | null>(null);
  const [isVisitDrawerOpen, setIsVisitDrawerOpen] = useState<boolean>(false);
  const [isAccountDrawerOpen, setIsAccountDrawerOpen] = useState<boolean>(false);
  const [isEPassModalOpen, setIsEPassModalOpen] = useState<boolean>(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState<boolean>(false);
  const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState<boolean>(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState<boolean>(false);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState<boolean>(false);
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState<boolean>(false);
  const [isNewRepModalOpen, setIsNewRepModalOpen] = useState<boolean>(false);
  const [isTraceabilityDrawerOpen, setIsTraceabilityDrawerOpen] = useState<boolean>(false);

  // Approval / Action form state
  const [approvalComment, setApprovalComment] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [closureSummary, setClosureSummary] = useState<string>('');
  const [closureFindingsCount, setClosureFindingsCount] = useState<number>(0);
  const [closureFollowUp, setClosureFollowUp] = useState<boolean>(false);

  // New Visit Form State (Sections A - I)
  const [newAccountId, setNewAccountId] = useState<string>(INITIAL_ACCOUNTS[0].id);
  const [newVisitType, setNewVisitType] = useState<CustomerVisitTypeCode>('CUSTOMER_AUDIT');
  const [newBookingMode, setNewBookingMode] = useState<CustomerBookingMode>('RESERVED');
  const [newAgenda, setNewAgenda] = useState<string>('');
  const [newLeadRepId, setNewLeadRepId] = useState<string>(INITIAL_REPRESENTATIVES[0].id);
  const [newAdditionalParticipants, setNewAdditionalParticipants] = useState<string>('');
  const [newScheduledStart, setNewScheduledStart] = useState<string>('2026-10-15T09:00');
  const [newScheduledEnd, setNewScheduledEnd] = useState<string>('2026-10-15T17:00');
  const [newAuthorizedZones, setNewAuthorizedZones] = useState<string>('Administrative Boardroom, Production Line 1');
  const [newNdaNumber, setNewNdaNumber] = useState<string>('NDA-2025-TSLA-0881');
  const [newHostName, setNewHostName] = useState<string>('Vikram Mehta (VP OEM Accounts)');
  const [newEscortRequired, setNewEscortRequired] = useState<boolean>(true);
  const [newPhotographyPolicy, setNewPhotographyPolicy] = useState<CustomerPhotographyPolicy>('PROHIBITED');
  const [newTransportMode, setNewTransportMode] = useState<string>('CAR');
  const [newVehicleClass, setNewVehicleClass] = useState<string>('SEDAN');
  const [newFuelType, setNewFuelType] = useState<string>('ELECTRIC');
  const [newDistanceKm, setNewDistanceKm] = useState<number>(45);
  const [newOccupancy, setNewOccupancy] = useState<number>(2);
  const [newIsSharedVehicle, setNewIsSharedVehicle] = useState<boolean>(true);
  const [newVehiclePlate, setNewVehiclePlate] = useState<string>('TN-09-EV-8822');
  const [newOrigin, setNewOrigin] = useState<string>('Chennai City Center');
  const [formSubmittedSuccess, setFormSubmittedSuccess] = useState<boolean>(false);

  // New Account Modal State
  const [accountLegalName, setAccountLegalName] = useState<string>('');
  const [accountTradeName, setAccountTradeName] = useState<string>('');
  const [accountCode, setAccountCode] = useState<string>('');
  const [accountClassification, setAccountClassification] = useState<CustomerClassification>('OEM_CUSTOMER');
  const [accountTier, setAccountTier] = useState<CustomerAccountTier>('GLOBAL_ENTERPRISE');
  const [accountManager, setAccountManager] = useState<string>('Vikram Mehta');
  const [accountContact, setAccountContact] = useState<string>('');
  const [accountEmail, setAccountEmail] = useState<string>('');
  const [accountPhone, setAccountPhone] = useState<string>('');
  const [accountNdaNumber, setAccountNdaNumber] = useState<string>('');
  const [accountNdaExpiry, setAccountNdaExpiry] = useState<string>('2027-12-31');

  // New Rep Modal State
  const [repFullName, setRepFullName] = useState<string>('');
  const [repEmail, setRepEmail] = useState<string>('');
  const [repPhone, setRepPhone] = useState<string>('');
  const [repDesignation, setRepDesignation] = useState<string>('');
  const [repDepartment, setRepDepartment] = useState<string>('');
  const [repAccountId, setRepAccountId] = useState<string>(INITIAL_ACCOUNTS[0].id);
  const [repIsVip, setRepIsVip] = useState<boolean>(false);

  // Sync subview from prop changes
  React.useEffect(() => {
    if (initialSubView) {
      setSubView(initialSubView);
    }
  }, [initialSubView]);

  const handleSelectSubView = (target: CustomerSubView) => {
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
      if (subView === 'MEETINGS' && v.visitTypeCode !== 'CUSTOMER_MEETING') return false;
      if (subView === 'AUDITS' && v.visitTypeCode !== 'CUSTOMER_AUDIT') return false;
      if (subView === 'INSPECTIONS' && v.visitTypeCode !== 'CUSTOMER_INSPECTION') return false;
      if (subView === 'QUALITY' && !(v.visitTypeCode === 'QUALITY_VISIT' || v.visitTypeCode === 'PRODUCT_REVIEW' || v.visitTypeCode === 'PROCESS_REVIEW')) return false;
      if (subView === 'TECHNICAL' && v.visitTypeCode !== 'TECHNICAL_VISIT') return false;
      if (subView === 'PLANT' && !(v.visitTypeCode === 'PLANT_VISIT' || v.visitTypeCode === 'MANAGEMENT_VISIT')) return false;
      if (subView === 'DELEGATIONS' && !(v.bookingMode === 'DELEGATION' || v.visitTypeCode === 'DELEGATION_VISIT' || v.participants.length > 1)) return false;
      if (subView === 'EXPECTED' && !(v.presenceStatus === 'EXPECTED_TODAY' || v.presenceStatus === 'SCHEDULED')) return false;
      if (subView === 'INSIDE' && !(v.presenceStatus === 'INSIDE' || v.presenceStatus === 'PARTIAL_INSIDE')) return false;
      if (subView === 'APPROVALS' && !(v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW')) return false;
      if (subView === 'EXCEPTIONS' && !(v.presenceStatus === 'OVERSTAY' || (v.overstayMinutes && v.overstayMinutes > 0))) return false;
      if (subView === 'COMPLETED' && !(v.stage === 'CLOSED' || v.presenceStatus === 'CHECKED_OUT')) return false;
      if (subView === 'CANCELLED' && !(v.stage === 'CANCELLED' || v.stage === 'REJECTED' || v.presenceStatus === 'NO_SHOW')) return false;

      // Dropdown filters
      if (accountFilter !== 'ALL' && v.accountId !== accountFilter) return false;
      if (visitTypeFilter !== 'ALL' && v.visitTypeCode !== visitTypeFilter) return false;
      if (stageFilter !== 'ALL' && v.stage !== stageFilter) return false;
      if (presenceFilter !== 'ALL' && v.presenceStatus !== presenceFilter) return false;

      // Text search
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesRef = v.referenceNumber.toLowerCase().includes(q);
        const matchesAccount = v.accountName.toLowerCase().includes(q);
        const matchesLead = v.leadParticipantName.toLowerCase().includes(q);
        const matchesHost = v.hostName.toLowerCase().includes(q);
        const matchesAgenda = v.agenda.toLowerCase().includes(q);
        if (!matchesRef && !matchesAccount && !matchesLead && !matchesHost && !matchesAgenda) return false;
      }

      return true;
    });
  }, [visits, subView, accountFilter, visitTypeFilter, stageFilter, presenceFilter, searchTerm]);

  // Handlers
  const handleApproveVisit = (txId: string) => {
    setVisits(prev => prev.map(v => v.id === txId ? { ...v, stage: 'APPROVED', presenceStatus: 'EXPECTED_TODAY' } : v));
    setIsApproveModalOpen(false);
  };

  const handleRejectVisit = (txId: string) => {
    setVisits(prev => prev.map(v => v.id === txId ? { ...v, stage: 'REJECTED' } : v));
    setIsApproveModalOpen(false);
  };

  const handleCheckInVisit = (txId: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== txId) return v;
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

  const handleCheckOutVisit = (txId: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== txId) return v;
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

  const handleCloseVisitWithReport = (txId: string) => {
    setVisits(prev => prev.map(v => {
      if (v.id !== txId) return v;
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

  const handleCreateAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc: CustomerAccountItem = {
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

  const handleCreateRepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedAcc = accounts.find(a => a.id === repAccountId);
    const newRep: CustomerRepresentativeItem = {
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

  const handleNewVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const acc = accounts.find(a => a.id === newAccountId);
    const rep = representatives.find(r => r.id === newLeadRepId);
    
    // Parse additional participants
    const partsList: CustomerParticipantItem[] = [
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

    const newTx: CustomerVisitItem = {
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

  return (
    <div className="flex flex-col gap-5 max-w-full">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Handshake size={24} className="text-blue-600" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Customer Management & Delegations
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800 rounded uppercase tracking-wider">
              Part 7 Independent Domain
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            OEM customer audits, executive delegations, technical reviews, bilateral NDAs, and source-linked Scope 3 GHG travel capture.
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center gap-2">
          <Button
            size="dense"
            variant="secondary"
            leftIcon={<Building2 size={14} />}
            onClick={() => setIsNewAccountModalOpen(true)}
          >
            Add Account
          </Button>
          <Button
            size="dense"
            variant="secondary"
            leftIcon={<UserPlus size={14} />}
            onClick={() => setIsNewRepModalOpen(true)}
          >
            Add Representative
          </Button>
          <Button
            size="dense"
            variant="primary"
            leftIcon={<Plus size={14} />}
            onClick={() => handleSelectSubView('NEW')}
          >
            New Customer Visit
          </Button>
        </div>
      </div>

      {/* 2. SUB-VIEW NAVIGATION RAIL (21 Sub-Views) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin border-b border-slate-200">
        {[
          { id: 'DASHBOARD', label: 'Executive Dashboard', icon: <BarChart3 size={13} /> },
          { id: 'ACCOUNTS', label: 'Customer Accounts', icon: <Building2 size={13} /> },
          { id: 'REPRESENTATIVES', label: 'Representatives', icon: <Users size={13} /> },
          { id: 'VISITS', label: 'All Customer Visits', icon: <Handshake size={13} /> },
          { id: 'NEW', label: '+ New Visit Form', icon: <Plus size={13} /> },
          { id: 'MEETINGS', label: 'Meetings', icon: <Calendar size={13} /> },
          { id: 'AUDITS', label: 'Audits', icon: <ClipboardCheck size={13} /> },
          { id: 'INSPECTIONS', label: 'Inspections', icon: <CheckCircle2 size={13} /> },
          { id: 'QUALITY', label: 'Quality Visits', icon: <Award size={13} /> },
          { id: 'TECHNICAL', label: 'Technical Visits', icon: <Layers size={13} /> },
          { id: 'PLANT', label: 'Plant Visits', icon: <MapPin size={13} /> },
          { id: 'DELEGATIONS', label: 'Delegations', icon: <Users size={13} /> },
          { id: 'EXPECTED', label: 'Expected Today', icon: <Clock size={13} /> },
          { id: 'INSIDE', label: 'Currently Inside', icon: <UserCheck size={13} /> },
          { id: 'APPROVALS', label: 'Pending Approvals', icon: <ShieldCheck size={13} /> },
          { id: 'NDA', label: 'Legal / NDA Requirements', icon: <FileCheck size={13} /> },
          { id: 'EXCEPTIONS', label: 'Visit Exceptions', icon: <AlertTriangle size={13} /> },
          { id: 'COMPLETED', label: 'Completed Visits', icon: <Check size={13} /> },
          { id: 'CANCELLED', label: 'Cancelled / No-Show', icon: <XCircle size={13} /> },
          { id: 'HISTORY', label: 'Visit History', icon: <History size={13} /> },
          { id: 'TRACEABILITY', label: 'ESG Activity Traceability', icon: <Leaf size={13} /> },
        ].map((item) => {
          const isActive = subView === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectSubView(item.id as CustomerSubView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'APPROVALS' && kpis.pendingApprovals > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-white text-[10px] rounded-full font-bold">
                  {kpis.pendingApprovals}
                </span>
              )}
              {item.id === 'EXCEPTIONS' && kpis.overstays > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-bold">
                  {kpis.overstays}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. SUBVIEW 1: EXECUTIVE DASHBOARD */}
      {subView === 'DASHBOARD' && (
        <div className="flex flex-col gap-5">
          {/* KPI CARDS */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Active OEM Accounts</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900">{kpis.activeAccounts}</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Tier 1</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Planned Visits</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-blue-700">{kpis.plannedVisits}</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Scheduled</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Currently Inside</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-700">{kpis.insideVisits}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">On Site</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-amber-700">{kpis.pendingApprovals}</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Review</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Delegations</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-indigo-700">{kpis.delegations}</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">Group</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Bilateral NDAs</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-teal-700">{kpis.activeNdas}</span>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">Active</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Scope 3 Cat 6</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-700">{kpis.totalEmissionsKgCO2e}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">kg CO2e</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overstay / Breach</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-700">{kpis.overstays}</span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Breach</span>
              </div>
            </Card>
          </div>

          {/* TWO-COLUMN OPERATIONAL SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live Customer Delegations on Site */}
            <Card className="p-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Live Customer Delegations On Site</h3>
                </div>
                <Button size="dense" variant="ghost" onClick={() => handleSelectSubView('INSIDE')}>
                  View Inside ({kpis.insideVisits})
                </Button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {visits.filter(v => v.presenceStatus === 'INSIDE' || v.presenceStatus === 'PARTIAL_INSIDE' || v.presenceStatus === 'OVERSTAY').map(v => (
                  <div key={v.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{v.accountName}</span>
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded">
                          {v.visitTypeCode}
                        </span>
                        {v.presenceStatus === 'OVERSTAY' && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                            OVERSTAY +{v.overstayMinutes}m
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Lead: <strong>{v.leadParticipantName}</strong> ({v.participants.length} delegates) • Host: {v.hostName}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Zones: {v.authorizedZones.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="dense"
                        variant="secondary"
                        onClick={() => { setSelectedVisit(v); setIsCheckOutModalOpen(true); }}
                      >
                        Check Out
                      </Button>
                      <Button
                        size="dense"
                        variant="ghost"
                        onClick={() => { setSelectedVisit(v); setIsTraceabilityDrawerOpen(true); }}
                      >
                        Trace ESG
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Urgent Actions & Approvals Queue */}
            <Card className="p-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">Urgent Approvals & Compliance Action</h3>
                </div>
                <Button size="dense" variant="ghost" onClick={() => handleSelectSubView('APPROVALS')}>
                  Review All
                </Button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {visits.filter(v => v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW').length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    No pending customer visit approvals in queue.
                  </div>
                ) : (
                  visits.filter(v => v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW').map(v => (
                    <div key={v.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{v.referenceNumber}</span>
                          <span className="text-xs font-semibold text-slate-700">{v.accountName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Type: {v.visitTypeCode} • Lead: {v.leadParticipantName} • Host: {v.hostName}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Schedule: {new Date(v.scheduledStart).toLocaleDateString()} {new Date(v.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="dense"
                          variant="primary"
                          onClick={() => { setSelectedVisit(v); setIsApproveModalOpen(true); }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="dense"
                          variant="ghost"
                          onClick={() => { setSelectedVisit(v); setIsVisitDrawerOpen(true); }}
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                {/* NDA Expiring Soon Warning */}
                {accounts.filter(a => a.ndaStatus === 'EXPIRING_SOON').map(acc => (
                  <div key={acc.id} className="py-2.5 flex items-center justify-between bg-amber-50/50 px-2 rounded">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
                        <AlertTriangle size={13} />
                        <span>Bilateral NDA Expiring Soon: {acc.legalName}</span>
                      </div>
                      <div className="text-[11px] text-amber-700">
                        Agreement: {acc.ndaAgreementNumber} • Expires on {acc.ndaExpiryDate}
                      </div>
                    </div>
                    <Button
                      size="dense"
                      variant="secondary"
                      onClick={() => handleSelectSubView('NDA')}
                    >
                      Renew NDA
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* VISIT TYPE DISTRIBUTION & MOBILITY ESG SUMMARY */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-4 bg-white border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Customer Visit Types</h3>
              <div className="space-y-2">
                {[
                  { label: 'Customer Audits (IATF/VDA)', count: visits.filter(v => v.visitTypeCode === 'CUSTOMER_AUDIT').length, color: 'bg-blue-600' },
                  { label: 'Delegations & Group Reviews', count: visits.filter(v => v.visitTypeCode === 'DELEGATION_VISIT' || v.bookingMode === 'DELEGATION').length, color: 'bg-indigo-600' },
                  { label: 'Customer Inspections (PPAP)', count: visits.filter(v => v.visitTypeCode === 'CUSTOMER_INSPECTION').length, color: 'bg-amber-600' },
                  { label: 'Quality Reviews', count: visits.filter(v => v.visitTypeCode === 'QUALITY_VISIT').length, color: 'bg-teal-600' },
                  { label: 'Technical & Engineering', count: visits.filter(v => v.visitTypeCode === 'TECHNICAL_VISIT').length, color: 'bg-purple-600' },
                  { label: 'Plant & Executive Tours', count: visits.filter(v => v.visitTypeCode === 'PLANT_VISIT' || v.visitTypeCode === 'MANAGEMENT_VISIT').length, color: 'bg-emerald-600' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">{item.label}</span>
                    <span className="font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">{item.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Group Journey Deduplication</h3>
              <div className="text-xs text-slate-600 space-y-2">
                <div className="p-2.5 bg-blue-50 border border-blue-100 rounded text-blue-900">
                  <strong className="block text-[11px] uppercase tracking-wider text-blue-700">Multi-Participant Rule</strong>
                  Delegations sharing a single vehicle record <strong>1 physical movement</strong> with total occupancy. Duplication of vehicle emissions is strictly suppressed.
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Shared Vehicles on Site:</span>
                  <strong className="text-slate-900 font-mono">
                    {visits.filter(v => v.transport?.isSharedDelegationVehicle).length} Active
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Delegates Transported:</span>
                  <strong className="text-slate-900 font-mono">
                    {visits.filter(v => v.transport?.isSharedDelegationVehicle).reduce((acc, v) => acc + (v.transport?.occupancy || 1), 0)} Persons
                  </strong>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-white border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Precedence Hierarchy Rules</h3>
              <div className="text-xs text-slate-600 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-slate-900 text-white rounded-full text-[10px] font-bold">1</span>
                  <span className="font-bold text-slate-900">Mandatory Site Security Rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-slate-700 text-white rounded-full text-[10px] font-bold">2</span>
                  <span>Global Facility Defaults</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-slate-500 text-white rounded-full text-[10px] font-bold">3</span>
                  <span>Customer Account Rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-slate-400 text-white rounded-full text-[10px] font-bold">4</span>
                  <span>Visit Type Requirements</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 flex items-center justify-center bg-slate-300 text-slate-800 rounded-full text-[10px] font-bold">5</span>
                  <span>Visit Specific Exceptions</span>
                </div>
                <p className="text-[10px] text-slate-400 italic pt-1">
                  * Customer preferences can never override mandatory plant safety or security rules.
                </p>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 4. SUBVIEW 2: CUSTOMER ACCOUNTS */}
      {subView === 'ACCOUNTS' && (
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Enterprise Customer Accounts</h2>
              <p className="text-xs text-slate-500">Master repository of verified OEM and strategic tier customer organizations.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search accounts, code, contact..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                leftIcon={<Search size={14} />}
                className="w-64"
              />
              <Button size="dense" variant="primary" leftIcon={<Plus size={13} />} onClick={() => setIsNewAccountModalOpen(true)}>
                New Account
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Account Code</th>
                  <th className="py-2.5 px-3">Legal Entity Name</th>
                  <th className="py-2.5 px-3">Tier</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Bilateral NDA</th>
                  <th className="py-2.5 px-3">Account Manager</th>
                  <th className="py-2.5 px-3">Primary Contact</th>
                  <th className="py-2.5 px-3 text-center">Visits</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{acc.accountCode}</td>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{acc.legalName}</div>
                      {acc.tradeName && <div className="text-[10px] text-slate-400">{acc.tradeName}</div>}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.accountTier === 'GLOBAL_ENTERPRISE' ? 'bg-purple-100 text-purple-800' :
                        acc.accountTier === 'TIER_1_STRATEGIC' ? 'bg-blue-100 text-blue-800' :
                        acc.accountTier === 'KEY_ACCOUNT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {acc.accountTier}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-semibold">{acc.classification}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.ndaStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        acc.ndaStatus === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {acc.ndaStatus}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{acc.ndaAgreementNumber}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{acc.assignedAccountManager}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{acc.contactPerson}</div>
                      <div className="text-[10px] text-slate-400">{acc.contactEmail}</div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-bold text-blue-700">{acc.activeVisitsCount}</span>
                      <span className="text-slate-400"> / {acc.totalVisitsCount}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="dense"
                        variant="ghost"
                        onClick={() => { setSelectedAccount(acc); setIsAccountDrawerOpen(true); }}
                      >
                        Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 5. SUBVIEW 3: CUSTOMER REPRESENTATIVES */}
      {subView === 'REPRESENTATIVES' && (
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Customer Representatives Directory</h2>
              <p className="text-xs text-slate-500">Verified delegates, auditors, and engineering representatives linked to canonical person profiles.</p>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search representatives by name, email, phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                leftIcon={<Search size={14} />}
                className="w-72"
              />
              <Button size="dense" variant="primary" leftIcon={<UserPlus size={13} />} onClick={() => setIsNewRepModalOpen(true)}>
                Add Representative
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Representative Name</th>
                  <th className="py-2.5 px-3">Customer Account</th>
                  <th className="py-2.5 px-3">Designation & Department</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">VIP Protocol</th>
                  <th className="py-2.5 px-3">Bilateral NDA</th>
                  <th className="py-2.5 px-3">Safety Induction</th>
                  <th className="py-2.5 px-3 text-right">Canonical Person</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {representatives.map(rep => (
                  <tr key={rep.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{rep.fullName}</div>
                      <div className="text-[10px] text-slate-400">{rep.email}</div>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">{rep.accountName}</td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{rep.designation}</div>
                      {rep.department && <div className="text-[10px] text-slate-400">{rep.department}</div>}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{rep.phone}</td>
                    <td className="py-2.5 px-3">
                      {rep.isVip ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-bold">
                          VIP LEVEL 1
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">STANDARD</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                        VERIFIED
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                        VALID
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      {rep.canonicalPersonId}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 6. SUBVIEW 4: MASTER VISITS TABLE (Used for VISITS, MEETINGS, AUDITS, INSPECTIONS, QUALITY, TECHNICAL, PLANT, DELEGATIONS, EXPECTED, INSIDE, APPROVALS, EXCEPTIONS, COMPLETED, CANCELLED) */}
      {(subView === 'VISITS' ||
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
        subView === 'CANCELLED') && (
        <Card className="p-4 bg-white border border-slate-200">
          {/* Header & Filter Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900">
                  {subView === 'VISITS' && 'All Customer Visit Transactions'}
                  {subView === 'MEETINGS' && 'Customer Meetings & Boardroom Engagements'}
                  {subView === 'AUDITS' && 'Customer Audits (IATF / VDA 6.3 / ISO)'}
                  {subView === 'INSPECTIONS' && 'Customer Tooling & PPAP Inspections'}
                  {subView === 'QUALITY' && 'Quality & Process Benchmark Reviews'}
                  {subView === 'TECHNICAL' && 'Technical & Engineering Joint Trials'}
                  {subView === 'PLANT' && 'Plant Walkthroughs & VIP Tours'}
                  {subView === 'DELEGATIONS' && 'Customer Delegations & Group Transport'}
                  {subView === 'EXPECTED' && "Today's Expected Customer Visits"}
                  {subView === 'INSIDE' && 'Live On-Premises Customer Roster'}
                  {subView === 'APPROVALS' && 'Pending Customer Visit Approvals Queue'}
                  {subView === 'EXCEPTIONS' && 'Visit Exceptions & Overstay Queue'}
                  {subView === 'COMPLETED' && 'Completed Customer Visits Archive'}
                  {subView === 'CANCELLED' && 'Cancelled & No-Show Customer Visits'}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {filteredVisits.length} Records
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Filtered view with strict customer domain boundaries and embedded Scope 3 mobility capture.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Input
                placeholder="Search reference, account, lead..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                leftIcon={<Search size={14} />}
                className="w-56"
              />

              <select
                aria-label="Filter by Customer Account"
                value={accountFilter}
                onChange={e => setAccountFilter(e.target.value)}
                className="text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-medium outline-none"
              >
                <option value="ALL">All Accounts</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.legalName}</option>
                ))}
              </select>

              <select
                aria-label="Filter by Visit Type"
                value={visitTypeFilter}
                onChange={e => setVisitTypeFilter(e.target.value)}
                className="text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-medium outline-none"
              >
                <option value="ALL">All Visit Types</option>
                <option value="CUSTOMER_AUDIT">Customer Audit</option>
                <option value="CUSTOMER_INSPECTION">Customer Inspection</option>
                <option value="DELEGATION_VISIT">Delegation Visit</option>
                <option value="CUSTOMER_MEETING">Customer Meeting</option>
                <option value="QUALITY_VISIT">Quality Visit</option>
                <option value="TECHNICAL_VISIT">Technical Visit</option>
                <option value="PLANT_VISIT">Plant Visit</option>
              </select>

              <select
                aria-label="Filter by Presence Status"
                value={presenceFilter}
                onChange={e => setPresenceFilter(e.target.value)}
                className="text-xs p-1.5 border border-slate-200 rounded bg-white text-slate-700 font-medium outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="EXPECTED_TODAY">Expected Today</option>
                <option value="INSIDE">Inside</option>
                <option value="PARTIAL_INSIDE">Partial Inside</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="OVERSTAY">Overstay</option>
              </select>
            </div>
          </div>

          {/* Visits Table */}
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Customer Account</th>
                  <th className="py-2.5 px-3">Visit Type</th>
                  <th className="py-2.5 px-3">Lead & Participants</th>
                  <th className="py-2.5 px-3">Internal Host</th>
                  <th className="py-2.5 px-3">Schedule</th>
                  <th className="py-2.5 px-3">Transport & Mobility</th>
                  <th className="py-2.5 px-3">Stage / Presence</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisits.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No customer visit records match the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVisits.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                        {v.referenceNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{v.accountName}</div>
                        <div className="text-[10px] text-slate-400">{v.classification}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                          {v.visitTypeCode}
                        </span>
                        {v.bookingMode === 'DELEGATION' && (
                          <div className="text-[10px] font-bold text-indigo-700 mt-0.5">GROUP DELEGATION</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900">{v.leadParticipantName}</div>
                        <div className="text-[10px] text-slate-500">
                          {v.participants.length} participant{v.participants.length > 1 ? 's' : ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div>{v.hostName}</div>
                        <div className="text-[10px] text-slate-400">{v.hostDepartment}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{new Date(v.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-400">{new Date(v.scheduledStart).toLocaleDateString()}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {v.transport ? (
                          <div className="text-slate-700">
                            <div className="flex items-center gap-1 font-semibold">
                              <Car size={12} className="text-slate-400" />
                              <span>{`${v.transport.mode} (${v.transport.distanceKm} km)`}</span>
                            </div>
                            {v.transport.isSharedDelegationVehicle && (
                              <div className="text-[10px] text-indigo-700 font-bold">
                                Shared Vehicle (Occ: {v.transport.occupancy})
                              </div>
                            )}
                            {v.esgActivity && (
                              <div className="text-[10px] text-teal-700 font-bold flex items-center gap-0.5 mt-0.5">
                                <Leaf size={10} />
                                <span>{v.esgActivity.emissionsKgCO2e} kg CO2e</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">No transport data</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold w-fit ${
                            v.presenceStatus === 'INSIDE' ? 'bg-emerald-100 text-emerald-800' :
                            v.presenceStatus === 'PARTIAL_INSIDE' ? 'bg-teal-100 text-teal-800' :
                            v.presenceStatus === 'OVERSTAY' ? 'bg-rose-100 text-rose-800' :
                            v.presenceStatus === 'EXPECTED_TODAY' ? 'bg-blue-100 text-blue-800' :
                            v.presenceStatus === 'CHECKED_OUT' ? 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {v.presenceStatus}
                          </span>
                          {v.overstayMinutes && (
                            <span className="text-[10px] font-bold text-rose-600">
                              +{v.overstayMinutes}m breach
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Approval button if submitted */}
                          {(v.stage === 'SUBMITTED' || v.stage === 'UNDER_REVIEW') && (
                            <Button
                              size="dense"
                              variant="primary"
                              onClick={() => { setSelectedVisit(v); setIsApproveModalOpen(true); }}
                            >
                              Approve
                            </Button>
                          )}

                          {/* Check In button if scheduled/approved */}
                          {(v.stage === 'APPROVED' || v.presenceStatus === 'EXPECTED_TODAY') && (
                            <Button
                              size="dense"
                              variant="primary"
                              onClick={() => { setSelectedVisit(v); setIsCheckInModalOpen(true); }}
                            >
                              Check In
                            </Button>
                          )}

                          {/* Check Out button if inside */}
                          {(v.presenceStatus === 'INSIDE' || v.presenceStatus === 'PARTIAL_INSIDE' || v.presenceStatus === 'OVERSTAY') && (
                            <Button
                              size="dense"
                              variant="secondary"
                              onClick={() => { setSelectedVisit(v); setIsCheckOutModalOpen(true); }}
                            >
                              Check Out
                            </Button>
                          )}

                          {/* Formal Closure button if checked out and not closed */}
                          {v.presenceStatus === 'CHECKED_OUT' && v.stage !== 'CLOSED' && (
                            <Button
                              size="dense"
                              variant="secondary"
                              onClick={() => { setSelectedVisit(v); setIsClosureModalOpen(true); }}
                            >
                              Close Signoff
                            </Button>
                          )}

                          {/* QR e-Pass */}
                          <button
                            type="button"
                            onClick={() => { setSelectedVisit(v); setIsEPassModalOpen(true); }}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="View E-Pass QR"
                          >
                            <QrCode size={15} />
                          </button>

                          {/* Details Drawer */}
                          <button
                            type="button"
                            onClick={() => { setSelectedVisit(v); setIsVisitDrawerOpen(true); }}
                            className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="View Full Details"
                          >
                            <Eye size={15} />
                          </button>

                          {/* ESG Traceability */}
                          <button
                            type="button"
                            onClick={() => { setSelectedVisit(v); setIsTraceabilityDrawerOpen(true); }}
                            className="p-1 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded"
                            title="Trace ESG Provenance"
                          >
                            <Leaf size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 7. SUBVIEW 5: NEW CUSTOMER VISIT FORM (Progressive Disclosure Sections A - I) */}
      {subView === 'NEW' && (
        <Card className="bg-white border border-slate-200 p-6 max-w-4xl mx-auto shadow-sm">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-base font-bold text-slate-900">
              New Customer Visit Pre-Registration & Operational Mobility Capture
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Captures customer account, delegation roster, bilateral NDA verification, and mobility vectors in-flow without leaking raw emissions equations.
            </p>
          </div>

          {formSubmittedSuccess && (
            <div className="mb-4">
              <Alert
                severity="success"
                title="Customer Visit Transaction Created Successfully!"
              >
                Visit registered with reference CUS-2026. Bilateral NDA verified and embedded GHG activity staged.
              </Alert>
            </div>
          )}

          <form onSubmit={handleNewVisitSubmit} className="space-y-6">
            {/* SECTION A: CUSTOMER ACCOUNT SELECTION */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section A — Customer Account Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Customer Account *</label>
                  <select
                    required
                    value={newAccountId}
                    onChange={e => {
                      setNewAccountId(e.target.value);
                      const acc = accounts.find(a => a.id === e.target.value);
                      if (acc?.ndaAgreementNumber) setNewNdaNumber(acc.ndaAgreementNumber);
                    }}
                    className="w-full text-xs p-2 border border-slate-300 rounded mt-1 bg-white font-medium"
                  >
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.legalName} ({a.classification} • {a.accountTier})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Account Classification & NDA Status</label>
                  <div className="mt-2 text-xs text-slate-700 flex items-center gap-2">
                    <span className="font-bold">{accounts.find(a => a.id === newAccountId)?.classification}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                      NDA: {accounts.find(a => a.id === newAccountId)?.ndaStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION B: VISIT TYPE & PURPOSE */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section B — Visit Type, Purpose & Agenda
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Visit Type Code *</label>
                  <select
                    value={newVisitType}
                    onChange={e => setNewVisitType(e.target.value as CustomerVisitTypeCode)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                  >
                    <option value="CUSTOMER_AUDIT">CUSTOMER_AUDIT (IATF / VDA 6.3 / ISO)</option>
                    <option value="CUSTOMER_INSPECTION">CUSTOMER_INSPECTION (PPAP / Tooling)</option>
                    <option value="DELEGATION_VISIT">DELEGATION_VISIT (Executive Group)</option>
                    <option value="CUSTOMER_MEETING">CUSTOMER_MEETING (Commercial / Contract)</option>
                    <option value="QUALITY_VISIT">QUALITY_VISIT (Quality Review)</option>
                    <option value="TECHNICAL_VISIT">TECHNICAL_VISIT (Engineering Joint Trial)</option>
                    <option value="PLANT_VISIT">PLANT_VISIT (Facility Tour)</option>
                    <option value="MANAGEMENT_VISIT">MANAGEMENT_VISIT (C-Suite Briefing)</option>
                    <option value="PRODUCT_REVIEW">PRODUCT_REVIEW</option>
                    <option value="PROCESS_REVIEW">PROCESS_REVIEW</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Booking Mode *</label>
                  <select
                    value={newBookingMode}
                    onChange={e => setNewBookingMode(e.target.value as CustomerBookingMode)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                  >
                    <option value="RESERVED">RESERVED (Scheduled Ahead)</option>
                    <option value="DELEGATION">DELEGATION (Multi-Participant Delegation)</option>
                    <option value="WALK_IN">WALK_IN (Express Gate Arrival)</option>
                    <option value="RECURRING">RECURRING (Multi-Day Series)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Confidentiality Policy</label>
                  <select
                    value={newPhotographyPolicy}
                    onChange={e => setNewPhotographyPolicy(e.target.value as CustomerPhotographyPolicy)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                  >
                    <option value="STRICTLY_PROHIBITED">STRICTLY_PROHIBITED (Camera Stickers Mandatory)</option>
                    <option value="ESCORTED_ONLY">ESCORTED_ONLY (With Host)</option>
                    <option value="PERMITTED_COMMON_AREAS">PERMITTED_COMMON_AREAS</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="text-[11px] font-semibold text-slate-700">Technical Agenda & SOW *</label>
                  <textarea
                    required
                    rows={2}
                    value={newAgenda}
                    onChange={e => setNewAgenda(e.target.value)}
                    placeholder="e.g. Annual Q4 IATF 16949 supplier audit covering high-voltage harness assembly, automated crimping cells, and barcode traceability verification."
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SECTION C: DELEGATION & PARTICIPANTS */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section C — Delegation & Participants
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Lead Customer Representative *</label>
                  <select
                    value={newLeadRepId}
                    onChange={e => setNewLeadRepId(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                  >
                    {representatives.filter(r => r.accountId === newAccountId).map(r => (
                      <option key={r.id} value={r.id}>{r.fullName} ({r.designation})</option>
                    ))}
                    {representatives.filter(r => r.accountId === newAccountId).length === 0 && (
                      <option value="">No existing representatives for account — will create on fly</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Additional Delegation Participants (Comma-separated)</label>
                  <input
                    type="text"
                    value={newAdditionalParticipants}
                    onChange={e => setNewAdditionalParticipants(e.target.value)}
                    placeholder="e.g. Dr. Kenji Sato, Hiroshi Tanaka, Yuki Nomura"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                  <span className="text-[10px] text-slate-400">Creates individual participant items with synchronized delegation pass links.</span>
                </div>
              </div>
            </div>

            {/* SECTION D: SCHEDULE & LOCATIONS */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section D — Schedule & Plant Locations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Scheduled Start *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newScheduledStart}
                    onChange={e => setNewScheduledStart(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Scheduled End *</label>
                  <input
                    type="datetime-local"
                    required
                    value={newScheduledEnd}
                    onChange={e => setNewScheduledEnd(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Authorized Plant Zones *</label>
                  <input
                    type="text"
                    required
                    value={newAuthorizedZones}
                    onChange={e => setNewAuthorizedZones(e.target.value)}
                    placeholder="e.g. Administrative Boardroom, Main Assembly Line"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SECTION E: LEGAL & BILATERAL NDA */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section E — Legal & Bilateral NDA Verification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded border border-emerald-200">
                <div>
                  <label className="text-[11px] font-semibold text-emerald-950">Bilateral NDA Agreement Ref *</label>
                  <input
                    type="text"
                    required
                    value={newNdaNumber}
                    onChange={e => setNewNdaNumber(e.target.value)}
                    className="w-full text-xs p-2 border border-emerald-300 rounded mt-1 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-emerald-950">Pre-Check Enforcement</label>
                  <div className="mt-2 text-xs text-emerald-800 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-600" />
                    <span>Verified bilateral NDA required for gate entry access.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION F: HOST & INTERNAL SPONSOR */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section F — Internal Host & Department Sponsor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Internal Host Employee *</label>
                  <input
                    type="text"
                    required
                    value={newHostName}
                    onChange={e => setNewHostName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="escortCheck"
                    checked={newEscortRequired}
                    onChange={e => setNewEscortRequired(e.target.checked)}
                    className="h-4 w-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="escortCheck" className="text-xs font-semibold text-slate-700">
                    Mandatory Internal Escort Required (Customer cannot walk plant unescorted)
                  </label>
                </div>
              </div>
            </div>

            {/* SECTION G: TRANSPORT & MOBILITY */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section G — Transport Vectors & Mobility Facts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Transport Mode *</label>
                  <select
                    value={newTransportMode}
                    onChange={e => setNewTransportMode(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                  >
                    <option value="CAR">CAR (Private / Hired)</option>
                    <option value="FLIGHT">FLIGHT (Commercial Aviation)</option>
                    <option value="BUS">BUS (Charter / Minibus)</option>
                    <option value="TRAIN">TRAIN (Rail Transit)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Vehicle Class</label>
                  <select
                    value={newVehicleClass}
                    onChange={e => setNewVehicleClass(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                  >
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="MINIBUS">MINIBUS</option>
                    <option value="AIR_COMMERCIAL">COMMERCIAL AIRCRAFT</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Fuel / Powertrain</label>
                  <select
                    value={newFuelType}
                    onChange={e => setNewFuelType(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                  >
                    <option value="ELECTRIC">ELECTRIC (BEV)</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="PETROL">PETROL</option>
                    <option value="CNG">CNG</option>
                    <option value="AVIATION_FUEL">AVIATION FUEL</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">One-way Distance (km) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={newDistanceKm}
                    onChange={e => setNewDistanceKm(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">Vehicle Registration Plate (Optional)</label>
                  <input
                    type="text"
                    value={newVehiclePlate}
                    onChange={e => setNewVehiclePlate(e.target.value)}
                    placeholder="e.g. TN-09-EV-8822"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 font-mono uppercase"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-700">Journey Origin</label>
                  <input
                    type="text"
                    value={newOrigin}
                    onChange={e => setNewOrigin(e.target.value)}
                    placeholder="e.g. Hotel Leela Palace, Chennai"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>

                <div className="md:col-span-4 flex items-center justify-between pt-2 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sharedVehCheck"
                      checked={newIsSharedVehicle}
                      onChange={e => setNewIsSharedVehicle(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 rounded border-slate-300"
                    />
                    <label htmlFor="sharedVehCheck" className="text-xs font-semibold text-indigo-900">
                      Shared Delegation Vehicle (1 Physical Movement Deduplicated)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Total Vehicle Occupants:</span>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={newOccupancy}
                      onChange={e => setNewOccupancy(Number(e.target.value))}
                      className="w-16 text-xs p-1 border border-slate-300 rounded font-bold text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION H: EMBEDDED ESG ACTIVITY PREVIEW */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Section H — Embedded GHG Activity Preview (Scope 3 Category 6)
              </h3>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-teal-900 font-bold text-xs">
                    <Leaf size={14} className="text-teal-600" />
                    <span>Source Domain: CUSTOMER • Emission Category: Scope 3 Cat 6 Business Travel</span>
                  </div>
                  <div className="text-[11px] text-teal-700 mt-0.5">
                    Operational distance: {newDistanceKm} km • Asynchronous GHG engine will calculate verified emissions upon trip completion.
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-teal-900">Est. Emissions</span>
                  <div className="text-lg font-black text-teal-700">
                    {(newDistanceKm * (newTransportMode === 'CAR' ? (newFuelType === 'ELECTRIC' ? 0.051 : 0.171) : 0.2458)).toFixed(2)} kg CO2e
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION I: REVIEW & SUBMISSION */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                Section I — Review &amp; Submission
              </h3>
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => handleSelectSubView('VISITS')}
                >
                  Cancel
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    variant="primary"
                    leftIcon={<CheckCircle2 size={15} />}
                  >
                    Submit Customer Visit
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* 8. SUBVIEW 16: LEGAL & BILATERAL NDA CONSOLE */}
      {subView === 'NDA' && (
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Bilateral Non-Disclosure Agreements (NDA) Vault</h2>
              <p className="text-xs text-slate-500">
                Mandatory bilateral legal agreements required for customer engineering, plant access, and audit reviews.
              </p>
            </div>
            <Button size="dense" variant="primary" leftIcon={<Plus size={13} />} onClick={() => setIsNewAccountModalOpen(true)}>
              Register Bilateral NDA
            </Button>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Customer Entity</th>
                  <th className="py-2.5 px-3">Agreement Number</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Photography Restriction</th>
                  <th className="py-2.5 px-3">Account Manager</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accounts.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{acc.legalName}</div>
                      <div className="text-[10px] text-slate-400">{acc.classification}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {acc.ndaAgreementNumber}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        acc.ndaStatus === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                        acc.ndaStatus === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {acc.ndaStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-mono">
                      {acc.ndaExpiryDate}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="font-semibold">{acc.photographyPolicy}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {acc.assignedAccountManager}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        size="dense"
                        variant="secondary"
                        onClick={() => { setSelectedAccount(acc); setIsAccountDrawerOpen(true); }}
                      >
                        Inspect Vault
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 9. SUBVIEW 20: VISIT HISTORY TIMELINE */}
      {subView === 'HISTORY' && (
        <Card className="p-4 bg-white border border-slate-200">
          <div className="pb-3 border-b border-slate-200 mb-4">
            <h2 className="text-sm font-bold text-slate-900">Customer Domain Audit & Historical Lifecycle Ledger</h2>
            <p className="text-xs text-slate-500">Immutable trace of customer account setups, gate arrivals, escort handoffs, and closure signoffs.</p>
          </div>

          <Timeline
            events={[
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
            ]}
          />
        </Card>
      )}

      {/* 10. SUBVIEW 21: ESG ACTIVITY TRACEABILITY LEDGER */}
      {subView === 'TRACEABILITY' && (
        <Card className="p-4 bg-white border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <Leaf size={16} className="text-teal-600" />
                <h2 className="text-sm font-bold text-slate-900">Customer ESG / GHG Scope 3 Category 6 Traceability Ledger</h2>
              </div>
              <p className="text-xs text-slate-500">
                Full end-to-end provenance: Customer Visit &rarr; Shared Transport Movement &rarr; GHG Activity &rarr; Scope 3 Cat 6 Calculation.
              </p>
            </div>
            <div className="p-2 bg-teal-50 border border-teal-200 rounded text-right">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">Total Customer Footprint</span>
              <span className="text-base font-black text-teal-700">{kpis.totalEmissionsKgCO2e} kg CO2e</span>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">GHG Activity ID</th>
                  <th className="py-2.5 px-3">Customer Visit Ref</th>
                  <th className="py-2.5 px-3">Customer Account</th>
                  <th className="py-2.5 px-3">Mobility Mode</th>
                  <th className="py-2.5 px-3">Distance & Occupancy</th>
                  <th className="py-2.5 px-3">Emission Factor Applied</th>
                  <th className="py-2.5 px-3">GHG Scope & Cat</th>
                  <th className="py-2.5 px-3">Calculated CO2e</th>
                  <th className="py-2.5 px-3 text-right">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.filter(v => v.esgActivity).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-700">
                      {v.esgActivity?.activityId}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {v.referenceNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {v.accountName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {v.transport?.mode} ({v.transport?.fuelType})
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{v.transport?.distanceKm} km</div>
                      <div className="text-[10px] text-slate-400">Occ: {v.transport?.occupancy} pax</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[10px]">
                      {v.esgActivity?.emissionFactorUsed}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                        SCOPE 3 CAT 6
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-800 text-sm">
                      {v.esgActivity?.emissionsKgCO2e} kg
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {v.transport?.provenance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL: VIEW QR E-PASS BADGE */}
      {isEPassModalOpen && selectedVisit && (
        <Modal
          isOpen={isEPassModalOpen}
          onClose={() => setIsEPassModalOpen(false)}
          title="Customer Representative E-Pass & Gate Badge"
        >
          <div className="flex flex-col items-center p-4 text-center">
            <div className="p-4 bg-white border-2 border-slate-900 rounded-lg shadow-sm w-full max-w-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase">VMS ENTERPRISE</span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1 rounded">CUSTOMER PASS</span>
              </div>
              <div className="py-4">
                <div className="w-32 h-32 bg-slate-900 mx-auto flex items-center justify-center rounded">
                  <QrCode size={100} className="text-white" />
                </div>
                <div className="font-mono font-bold text-xs text-slate-900 mt-2">{selectedVisit.referenceNumber}</div>
              </div>
              <div className="text-left text-xs border-t border-slate-200 pt-2 space-y-1">
                <div><strong>Account:</strong> {selectedVisit.accountName}</div>
                <div><strong>Lead:</strong> {selectedVisit.leadParticipantName}</div>
                <div><strong>Type:</strong> {selectedVisit.visitTypeCode}</div>
                <div><strong>Host:</strong> {selectedVisit.hostName}</div>
                <div><strong>Valid:</strong> {new Date(selectedVisit.scheduledStart).toLocaleDateString()}</div>
                <div><strong>NDA:</strong> {selectedVisit.ndaAgreementNumber} (Verified)</div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="dense" variant="secondary" leftIcon={<Printer size={14} />} onClick={() => alert('Printing pass...')}>
                Print Badge
              </Button>
              <Button size="dense" variant="primary" onClick={() => setIsEPassModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CHECK-IN */}
      {isCheckInModalOpen && selectedVisit && (
        <Modal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          title={`Gate Check-In — ${selectedVisit.referenceNumber}`}
        >
          <div className="space-y-4 p-2 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
              <div className="font-bold">Customer Account: {selectedVisit.accountName}</div>
              <div>Lead: {selectedVisit.leadParticipantName} • Participants: {selectedVisit.participants.length}</div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Bilateral NDA Verified ({selectedVisit.ndaAgreementNumber})</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Camera Restriction Sticker Applied ({selectedVisit.photographyPolicy})</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Internal Escort Assigned ({selectedVisit.hostName})</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <Button size="dense" variant="ghost" onClick={() => setIsCheckInModalOpen(false)}>
                Cancel
              </Button>
              <Button size="dense" variant="primary" onClick={() => handleCheckInVisit(selectedVisit.id)}>
                Confirm Gate Check-In
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: CHECK-OUT */}
      {isCheckOutModalOpen && selectedVisit && (
        <Modal
          isOpen={isCheckOutModalOpen}
          onClose={() => setIsCheckOutModalOpen(false)}
          title={`Gate Check-Out — ${selectedVisit.referenceNumber}`}
        >
          <div className="space-y-4 p-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <div className="font-bold text-slate-900">{selectedVisit.accountName}</div>
              <div className="text-slate-600">Lead: {selectedVisit.leadParticipantName}</div>
              {selectedVisit.overstayMinutes && (
                <div className="text-rose-600 font-bold mt-1">
                  Overstay duration: +{selectedVisit.overstayMinutes} minutes recorded.
                </div>
              )}
            </div>

            <p className="text-slate-600">
              Confirming gate departure will log exit gate event and finalize asynchronous GHG mobility calculation for Scope 3 disclosures.
            </p>

            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <Button size="dense" variant="ghost" onClick={() => setIsCheckOutModalOpen(false)}>
                Cancel
              </Button>
              <Button size="dense" variant="primary" onClick={() => handleCheckOutVisit(selectedVisit.id)}>
                Confirm Gate Departure
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: APPROVE / REJECT */}
      {isApproveModalOpen && selectedVisit && (
        <Modal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          title={`Review Customer Visit — ${selectedVisit.referenceNumber}`}
        >
          <div className="space-y-4 p-2 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div><strong>Account:</strong> {selectedVisit.accountName} ({selectedVisit.classification})</div>
              <div><strong>Visit Type:</strong> {selectedVisit.visitTypeCode}</div>
              <div><strong>Lead Delegate:</strong> {selectedVisit.leadParticipantName}</div>
              <div><strong>Host:</strong> {selectedVisit.hostName}</div>
              <div><strong>Schedule:</strong> {new Date(selectedVisit.scheduledStart).toLocaleString()}</div>
              <div><strong>Agenda:</strong> {selectedVisit.agenda}</div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Approval Comments / Audit Notes</label>
              <textarea
                rows={2}
                value={approvalComment}
                onChange={e => setApprovalComment(e.target.value)}
                placeholder="Optional host or security manager approval note..."
                className="w-full text-xs p-2 border border-slate-200 rounded"
              />
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
              <Button
                size="dense"
                variant="danger"
                onClick={() => handleRejectVisit(selectedVisit.id)}
              >
                Reject Visit
              </Button>
              <div className="flex gap-2">
                <Button size="dense" variant="ghost" onClick={() => setIsApproveModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  size="dense"
                  variant="primary"
                  onClick={() => handleApproveVisit(selectedVisit.id)}
                >
                  Approve Visit
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: FORMAL CLOSURE SIGNOFF */}
      {isClosureModalOpen && selectedVisit && (
        <Modal
          isOpen={isClosureModalOpen}
          onClose={() => setIsClosureModalOpen(false)}
          title={`Customer Visit Closure Signoff — ${selectedVisit.referenceNumber}`}
        >
          <div className="space-y-4 p-2 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Executive Closure Summary *</label>
              <textarea
                required
                rows={3}
                value={closureSummary}
                onChange={e => setClosureSummary(e.target.value)}
                placeholder="Summarize visit outcome, audit findings, technical deliverables, or next steps..."
                className="w-full text-xs p-2 border border-slate-200 rounded"
              />
            </div>

            {selectedVisit.visitTypeCode === 'CUSTOMER_AUDIT' && (
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Audit Findings / Observations Count</label>
                <input
                  type="number"
                  min={0}
                  value={closureFindingsCount}
                  onChange={e => setClosureFindingsCount(Number(e.target.value))}
                  className="w-24 text-xs p-1.5 border border-slate-200 rounded font-bold"
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="followUpCheck"
                checked={closureFollowUp}
                onChange={e => setClosureFollowUp(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-slate-300"
              />
              <label htmlFor="followUpCheck" className="font-semibold text-slate-700">
                Corrective Action Request (CAR) or Follow-Up Required
              </label>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <Button size="dense" variant="ghost" onClick={() => setIsClosureModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="dense"
                variant="primary"
                onClick={() => handleCloseVisitWithReport(selectedVisit.id)}
              >
                Sign Off & Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: NEW CUSTOMER ACCOUNT */}
      {isNewAccountModalOpen && (
        <Modal
          isOpen={isNewAccountModalOpen}
          onClose={() => setIsNewAccountModalOpen(false)}
          title="Register New Customer Account"
        >
          <form onSubmit={handleCreateAccountSubmit} className="space-y-4 p-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700">Legal Entity Name *</label>
                <input
                  type="text"
                  required
                  value={accountLegalName}
                  onChange={e => setAccountLegalName(e.target.value)}
                  placeholder="e.g. Ford Motor Company"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Trade / Brand Name</label>
                <input
                  type="text"
                  value={accountTradeName}
                  onChange={e => setAccountTradeName(e.target.value)}
                  placeholder="e.g. Ford"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Account Code *</label>
                <input
                  type="text"
                  required
                  value={accountCode}
                  onChange={e => setAccountCode(e.target.value)}
                  placeholder="CUS-ACC-FORD"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Classification *</label>
                <select
                  value={accountClassification}
                  onChange={e => setAccountClassification(e.target.value as CustomerClassification)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                >
                  <option value="TIER_1_OEM">TIER_1_OEM</option>
                  <option value="TIER_2_SUPPLIER">TIER_2_SUPPLIER</option>
                  <option value="STRATEGIC_ACCOUNT">STRATEGIC_ACCOUNT</option>
                  <option value="KEY_ACCOUNT">KEY_ACCOUNT</option>
                  <option value="STANDARD">STANDARD</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Account Tier</label>
                <select
                  value={accountTier}
                  onChange={e => setAccountTier(e.target.value as CustomerAccountTier)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                >
                  <option value="PLATINUM">PLATINUM</option>
                  <option value="GOLD">GOLD</option>
                  <option value="SILVER">SILVER</option>
                  <option value="BRONZE">BRONZE</option>
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Assigned Account Manager</label>
                <input
                  type="text"
                  value={accountManager}
                  onChange={e => setAccountManager(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Primary Contact Person</label>
                <input
                  type="text"
                  value={accountContact}
                  onChange={e => setAccountContact(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Contact Email</label>
                <input
                  type="email"
                  value={accountEmail}
                  onChange={e => setAccountEmail(e.target.value)}
                  placeholder="sjenkins@ford.com"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Bilateral NDA Number *</label>
                <input
                  type="text"
                  required
                  value={accountNdaNumber}
                  onChange={e => setAccountNdaNumber(e.target.value)}
                  placeholder="NDA-2026-FORD-01"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 font-mono uppercase"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">NDA Expiration Date</label>
                <input
                  type="date"
                  value={accountNdaExpiry}
                  onChange={e => setAccountNdaExpiry(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <Button size="dense" variant="ghost" onClick={() => setIsNewAccountModalOpen(false)}>
                Cancel
              </Button>
              <Button size="dense" variant="primary" type="submit">
                Create Account
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: NEW REPRESENTATIVE */}
      {isNewRepModalOpen && (
        <Modal
          isOpen={isNewRepModalOpen}
          onClose={() => setIsNewRepModalOpen(false)}
          title="Add Customer Representative"
        >
          <form onSubmit={handleCreateRepSubmit} className="space-y-4 p-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="font-semibold text-slate-700">Customer Account *</label>
                <select
                  value={repAccountId}
                  onChange={e => setRepAccountId(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white font-medium"
                >
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>{a.legalName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-semibold text-slate-700">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={repFullName}
                  onChange={e => setRepFullName(e.target.value)}
                  placeholder="e.g. Ramesh Chandran"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Official Email *</label>
                <input
                  type="email"
                  required
                  value={repEmail}
                  onChange={e => setRepEmail(e.target.value)}
                  placeholder="rchandran@customer.com"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Mobile Phone *</label>
                <input
                  type="tel"
                  required
                  value={repPhone}
                  onChange={e => setRepPhone(e.target.value)}
                  placeholder="+91-9884011223"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Designation *</label>
                <input
                  type="text"
                  required
                  value={repDesignation}
                  onChange={e => setRepDesignation(e.target.value)}
                  placeholder="e.g. Senior Quality Auditor"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700">Department</label>
                <input
                  type="text"
                  value={repDepartment}
                  onChange={e => setRepDepartment(e.target.value)}
                  placeholder="e.g. Global Powertrain Sourcing"
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="repVipCheck"
                  checked={repIsVip}
                  onChange={e => setRepIsVip(e.target.checked)}
                  className="h-4 w-4 text-amber-600 rounded border-slate-300"
                />
                <label htmlFor="repVipCheck" className="font-semibold text-slate-700">
                  VIP Protocol Required (Executive Escort)
                </label>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end gap-2">
              <Button size="dense" variant="ghost" onClick={() => setIsNewRepModalOpen(false)}>
                Cancel
              </Button>
              <Button size="dense" variant="primary" type="submit">
                Register Representative
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* DRAWER: CUSTOMER VISIT FULL DETAILS */}
      {isVisitDrawerOpen && selectedVisit && (
        <Drawer
          isOpen={isVisitDrawerOpen}
          onClose={() => setIsVisitDrawerOpen(false)}
          title={`Visit Inspection — ${selectedVisit.referenceNumber}`}
        >
          <div className="p-4 space-y-5 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-blue-700 text-sm">{selectedVisit.referenceNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  {selectedVisit.presenceStatus}
                </span>
              </div>
              <div className="font-bold text-slate-900 text-sm">{selectedVisit.accountName}</div>
              <div className="text-slate-500">Tier: {selectedVisit.classification} • Mode: {selectedVisit.bookingMode}</div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">Delegation Roster</h4>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded">
                {selectedVisit.participants.map(p => (
                  <div key={p.id} className="p-2 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{p.name} {p.isLead && <span className="text-[10px] text-blue-600">(Lead)</span>}</div>
                      <div className="text-[10px] text-slate-400">{p.designation} • {p.email}</div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">Bilateral Legal Compliance</h4>
              <div className="space-y-1 bg-emerald-50 p-2.5 rounded border border-emerald-200 text-emerald-900">
                <div><strong>NDA Agreement:</strong> {selectedVisit.ndaAgreementNumber}</div>
                <div><strong>NDA Status:</strong> {selectedVisit.ndaVerified ? 'VERIFIED' : 'UNVERIFIED'}</div>
                <div><strong>Photography Policy:</strong> {selectedVisit.photographyPolicy}</div>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">Transport & Scope 3 Footprint</h4>
              {selectedVisit.transport && (
                <div className="space-y-1 bg-teal-50 p-2.5 rounded border border-teal-200 text-teal-900">
                  <div><strong>Mode:</strong> {selectedVisit.transport.mode} ({selectedVisit.transport.fuelType})</div>
                  <div><strong>Distance:</strong> {selectedVisit.transport.distanceKm} km</div>
                  <div><strong>Occupancy:</strong> {selectedVisit.transport.occupancy} occupants</div>
                  <div><strong>Shared Delegation Vehicle:</strong> {selectedVisit.transport.isSharedDelegationVehicle ? 'YES (Deduplicated)' : 'NO'}</div>
                  {selectedVisit.esgActivity && (
                    <div className="pt-1 mt-1 border-t border-teal-200">
                      <strong>Scope 3 Cat 6 Carbon:</strong> {selectedVisit.esgActivity.emissionsKgCO2e} kg CO2e ({selectedVisit.esgActivity.calculationStatus})
                    </div>
                  )}
                </div>
              )}
            </div>

            {selectedVisit.closureReport && (
              <div>
                <h4 className="font-bold text-slate-900 uppercase tracking-wider mb-2 text-[11px]">Formal Closure Report</h4>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded space-y-1 text-slate-800">
                  <div><strong>Closed At:</strong> {new Date(selectedVisit.closureReport.closedAt).toLocaleString()}</div>
                  <div><strong>Signoff By:</strong> {selectedVisit.closureReport.closedBy}</div>
                  <p className="mt-1 text-slate-600">{selectedVisit.closureReport.executiveSummary}</p>
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {/* DRAWER: ACCOUNT PROFILE */}
      {isAccountDrawerOpen && selectedAccount && (
        <Drawer
          isOpen={isAccountDrawerOpen}
          onClose={() => setIsAccountDrawerOpen(false)}
          title={`Customer Master — ${selectedAccount.legalName}`}
        >
          <div className="p-4 space-y-5 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-1">
              <span className="font-mono font-bold text-blue-700">{selectedAccount.accountCode}</span>
              <div className="font-bold text-slate-900 text-sm">{selectedAccount.legalName}</div>
              <div className="text-slate-600">Tier: {selectedAccount.accountTier} • {selectedAccount.classification}</div>
            </div>

            <div className="space-y-2">
              <div><strong>Assigned Account Manager:</strong> {selectedAccount.assignedAccountManager}</div>
              <div><strong>Primary Contact:</strong> {selectedAccount.contactPerson} ({selectedAccount.contactEmail})</div>
              <div><strong>Phone:</strong> {selectedAccount.contactPhone}</div>
              <div><strong>Active Visits on Site:</strong> {selectedAccount.activeVisitsCount}</div>
              <div><strong>Lifetime Completed Visits:</strong> {selectedAccount.totalVisitsCount}</div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded space-y-1">
              <div className="font-bold text-emerald-900">Bilateral NDA Vault Record</div>
              <div>Agreement ID: <span className="font-mono">{selectedAccount.ndaAgreementNumber}</span></div>
              <div>Expiry: {selectedAccount.ndaExpiryDate}</div>
              <div>Status: <strong>{selectedAccount.ndaStatus}</strong></div>
              <div>Photography Policy: <strong>{selectedAccount.photographyPolicy}</strong></div>
            </div>
          </div>
        </Drawer>
      )}

      {/* DRAWER: ESG PROVENANCE TRACE */}
      {isTraceabilityDrawerOpen && selectedVisit && (
        <Drawer
          isOpen={isTraceabilityDrawerOpen}
          onClose={() => setIsTraceabilityDrawerOpen(false)}
          title={`ESG Provenance Chain — ${selectedVisit.referenceNumber}`}
        >
          <div className="p-4 space-y-4 text-xs">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded">
              <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">Provenance Verification Chain</div>
              <div className="text-xs text-teal-900 mt-1 font-semibold">
                Source Domain: CUSTOMER • Target Disclosure: GHG Protocol Scope 3 Cat 6
              </div>
            </div>

            <div className="space-y-3 relative pl-6 border-l-2 border-teal-500">
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" />
                <strong className="block text-slate-900">1. Customer Operational Visit</strong>
                <span className="text-slate-500 font-mono">{selectedVisit.referenceNumber}</span> ({selectedVisit.accountName})
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" />
                <strong className="block text-slate-900">2. Shared Transport Activity Record</strong>
                <span className="text-slate-600">
                  Mode: {selectedVisit.transport?.mode} • Class: {selectedVisit.transport?.vehicleClass} • Fuel: {selectedVisit.transport?.fuelType}
                </span>
                <div className="text-[10px] text-slate-400">
                  {selectedVisit.transport?.isSharedDelegationVehicle ? 'Group journey deduplication applied: 1 vehicle movement' : 'Individual journey'}
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" />
                <strong className="block text-slate-900">3. Embedded GHG Activity Record</strong>
                <span className="text-slate-700 font-mono">{selectedVisit.esgActivity?.activityId}</span>
                <div className="text-[10px] text-slate-500">
                  Quantity: {selectedVisit.esgActivity?.activityQuantity} {selectedVisit.esgActivity?.activityUnit}
                </div>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" />
                <strong className="block text-slate-900">4. Emission Factor Grounding</strong>
                <span className="text-slate-700 font-mono text-[10px]">{selectedVisit.esgActivity?.emissionFactorUsed}</span>
              </div>

              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-3 h-3 rounded-full bg-teal-600" />
                <strong className="block text-slate-900">5. Calculated Carbon Disclosures</strong>
                <div className="text-base font-bold text-teal-800">
                  {selectedVisit.esgActivity?.emissionsKgCO2e} kg CO2e
                </div>
                <span className="text-[10px] text-slate-400">Provenance: {selectedVisit.transport?.provenance}</span>
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
