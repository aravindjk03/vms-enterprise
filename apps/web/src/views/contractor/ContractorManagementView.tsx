import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  HardHat,
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
  Search,
  Filter,
  Download,
  ArrowRight,
  Eye,
  Check,
  X,
  RefreshCw,
  AlertOctagon,
  Briefcase,
  Plus,
  ChevronRight,
  Sparkles,
  UserPlus,
  Award,
  ClipboardCheck,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  History,
  UserX,
  UserCheck,
  BarChart3,
  Flame,
  FileSignature,
  Activity,
  Layers,
  Wrench,
  Bus,
  BadgeAlert,
  GraduationCap,
  HeartPulse,
  Stamp
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
  showToast,
} from '@vms/ui';
const fs = {
  micro: typography.fontSize.micro.size,
  xs: typography.fontSize.xs.size,
  sm: typography.fontSize.sm.size,
  base: typography.fontSize.base.size,
  md: typography.fontSize.md.size,
  lg: typography.fontSize.lg.size,
  xl: typography.fontSize.xl.size,
  '2xl': typography.fontSize['2xl'].size,
  '3xl': typography.fontSize['3xl'].size,
};

import type {
  EnterpriseRole,
  ContractorCompanyStatus,
  ContractorSafetyRating,
  ContractorClassification,
  ContractType,
  ContractStatus,
  WorkOrderCategory,
  WorkOrderStatus,
  ContractorWorkerCategory,
  ContractorWorkerStatus,
  ContractorAssignmentStatus,
  WorkerEligibilityStatus,
  ContractorPresenceStatus,
  ComplianceRequirementType,
  ComplianceStatus,
} from '@vms/types';

export type ContractorSubView =
  | 'DASHBOARD'
  | 'COMPANIES'
  | 'COMPANY_REGISTRATION'
  | 'COMPANY_PROFILE'
  | 'CONTRACTS'
  | 'WORK_ORDERS'
  | 'WORKER_DIRECTORY'
  | 'NEW_WORKER'
  | 'RETURNING_WORKERS'
  | 'WORKER_PROFILE'
  | 'ASSIGNMENTS'
  | 'COMPLIANCE'
  | 'DOCUMENT_VERIFICATION'
  | 'TRAINING_RECORDS'
  | 'SAFETY_INDUCTION'
  | 'QUALIFICATIONS'
  | 'FITNESS_MEDICAL'
  | 'PERMITS'
  | 'ATTENDANCE'
  | 'DAILY_ATTENDANCE'
  | 'CURRENTLY_ON_SITE'
  | 'EXPECTED_WORKFORCE'
  | 'PENDING_APPROVALS'
  | 'EXPIRING_DOCUMENTS'
  | 'RESTRICTED_WORKERS'
  | 'CONTRACTOR_TRANSPORT'
  | 'ESG_TRACEABILITY'
  | 'CONTRACTOR_HISTORY'
  | 'EXCEPTIONS'
  | 'REPORTS'
  | 'CONTRACTOR_ATTENDANCE'
  | 'WORKER_ASSIGNMENTS';

export interface ContractorManagementViewProps {
  initialSubView?: ContractorSubView;
  currentRole?: EnterpriseRole;
  siteId?: string;
  onNavigateSubView?: (subView: ContractorSubView) => void;
}

// Initial Mock Seed Data for UI Demonstration
const INITIAL_COMPANIES = [
  {
    companyId: 'comp-101',
    vendorCode: 'VEND-INFRA-01',
    tradeName: 'Apex Industrial Infrastructure Ltd',
    companyName: 'Apex Industrial Infrastructure Ltd',
    contractorClassification: 'GENERAL_CONTRACTOR' as ContractorClassification,
    safetyRating: 'GRADE_A' as ContractorSafetyRating,
    status: 'ACTIVE' as ContractorCompanyStatus,
    primaryContactName: 'Rajesh Sharma',
    primaryContactPhone: '+91 98765 43210',
    primaryContactEmail: 'rajesh.sharma@apexinfra.example',
    siteContactName: 'Suresh Patil',
    activeContractsCount: 3,
    activeWorkOrdersCount: 5,
    assignedWorkersCount: 42,
    compliancePassRate: 98.2,
    insurancePolicyNumber: 'POL-ICICI-2026-9988',
    insuranceExpiryDate: '2026-12-31',
  },
  {
    companyId: 'comp-102',
    vendorCode: 'VEND-ELEC-02',
    tradeName: 'VoltTech Power & Automation',
    companyName: 'VoltTech Power & Automation',
    contractorClassification: 'ELECTRICAL' as ContractorClassification,
    safetyRating: 'GRADE_A' as ContractorSafetyRating,
    status: 'ACTIVE' as ContractorCompanyStatus,
    primaryContactName: 'Anita Roy',
    primaryContactPhone: '+91 98220 11223',
    primaryContactEmail: 'anita.roy@volttech.example',
    siteContactName: 'Kunal Verma',
    activeContractsCount: 1,
    activeWorkOrdersCount: 2,
    assignedWorkersCount: 18,
    compliancePassRate: 94.5,
    insurancePolicyNumber: 'POL-BAJAJ-2026-4433',
    insuranceExpiryDate: '2026-10-15',
  },
  {
    companyId: 'comp-103',
    vendorCode: 'VEND-CIVIL-03',
    tradeName: 'SolidGround Civil Works & Masonry',
    companyName: 'SolidGround Civil Works & Masonry',
    contractorClassification: 'CIVIL' as ContractorClassification,
    safetyRating: 'GRADE_B' as ContractorSafetyRating,
    status: 'ACTIVE' as ContractorCompanyStatus,
    primaryContactName: 'Dharmesh Gupta',
    primaryContactPhone: '+91 97110 55667',
    primaryContactEmail: 'd.gupta@solidground.example',
    siteContactName: 'Mahesh Nair',
    activeContractsCount: 2,
    activeWorkOrdersCount: 3,
    assignedWorkersCount: 25,
    compliancePassRate: 91.0,
    insurancePolicyNumber: 'POL-HDFC-2026-7711',
    insuranceExpiryDate: '2026-11-20',
  },
];

const INITIAL_CONTRACTS = [
  {
    contractId: 'con-201',
    contractNumber: 'CON-2026-0041',
    companyId: 'comp-101',
    companyName: 'Apex Industrial Infrastructure Ltd',
    title: 'Plant Structural Retrofitting & Heavy Rigging MSA',
    contractType: 'MASTER_SERVICES_AGREEMENT' as ContractType,
    status: 'ACTIVE' as ContractStatus,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    scopeOfWork: 'Comprehensive structural reinforcement of main bays 1 through 4',
    approvalState: 'APPROVED',
  },
  {
    contractId: 'con-202',
    contractNumber: 'CON-2026-0042',
    companyId: 'comp-102',
    companyName: 'VoltTech Power & Automation',
    title: 'HT Transformer & Substation Annual Maintenance',
    contractType: 'ANNUAL_MAINTENANCE' as ContractType,
    status: 'EXPIRING' as ContractStatus,
    startDate: '2025-11-01',
    endDate: '2026-10-31',
    scopeOfWork: 'Bi-monthly testing of SF6 breakers and oil filtration',
    approvalState: 'APPROVED',
  },
  {
    contractId: 'con-203',
    contractNumber: 'CON-2026-0043',
    companyId: 'comp-103',
    companyName: 'SolidGround Civil Works & Masonry',
    title: 'Water Retention Tank & Effluent Sump Construction',
    contractType: 'PROJECT_BASED' as ContractType,
    status: 'ACTIVE' as ContractStatus,
    startDate: '2026-03-01',
    endDate: '2027-02-28',
    scopeOfWork: 'Excavation, shuttering, RCC pouring and hydro-testing',
    approvalState: 'APPROVED',
  },
];

const INITIAL_WORK_ORDERS = [
  {
    workOrderId: 'wo-301',
    referenceNumber: 'CTR-2026-001001',
    workOrderNumber: 'WO-INFRA-8801',
    companyId: 'comp-101',
    companyName: 'Apex Industrial Infrastructure Ltd',
    title: 'Bay 2 Overhead Crane Track Alignment',
    workCategory: 'MECHANICAL' as WorkOrderCategory,
    workLocation: 'Heavy Machining Bay 2',
    authorizedWorkerCount: 15,
    safetyPermitRequired: true,
    startDate: '2026-10-01',
    endDate: '2026-10-25',
    status: 'ACTIVE' as WorkOrderStatus,
    approvalState: 'APPROVED',
  },
  {
    workOrderId: 'wo-302',
    referenceNumber: 'CTR-2026-001002',
    workOrderNumber: 'WO-ELEC-8802',
    companyId: 'comp-102',
    companyName: 'VoltTech Power & Automation',
    title: 'Switchyard 33kV Busbar Relaying Calibration',
    workCategory: 'ELECTRICAL' as WorkOrderCategory,
    workLocation: 'High Voltage Switchyard',
    authorizedWorkerCount: 8,
    safetyPermitRequired: true,
    startDate: '2026-10-10',
    endDate: '2026-10-14',
    status: 'ACTIVE' as WorkOrderStatus,
    approvalState: 'APPROVED',
  },
  {
    workOrderId: 'wo-303',
    referenceNumber: 'CTR-2026-001003',
    workOrderNumber: 'WO-CIVIL-8803',
    companyId: 'comp-103',
    companyName: 'SolidGround Civil Works & Masonry',
    title: 'Perimeter Wall Foundation Trenching & Shoring',
    workCategory: 'CIVIL' as WorkOrderCategory,
    workLocation: 'North Perimeter Sector 4',
    authorizedWorkerCount: 20,
    safetyPermitRequired: false,
    startDate: '2026-10-05',
    endDate: '2026-11-15',
    status: 'ACTIVE' as WorkOrderStatus,
    approvalState: 'APPROVED',
  },
];

const INITIAL_WORKERS = [
  {
    contractorWorkerId: 'cw-401',
    companyId: 'comp-101',
    companyName: 'Apex Industrial Infrastructure Ltd',
    badgeNumber: 'CW-4001',
    fullName: 'Ramesh K. Yadav',
    tradeSkill: 'Certified Heavy Crane Rigger',
    workerCategory: 'SKILLED' as ContractorWorkerCategory,
    designation: 'Senior Rigger Lead',
    phone: '+91 99887 76655',
    medicalFitnessValid: true,
    medicalFitnessExpiry: '2027-04-15',
    status: 'ACTIVE' as ContractorWorkerStatus,
    isReturning: true,
    totalShiftsCompleted: 142,
  },
  {
    contractorWorkerId: 'cw-402',
    companyId: 'comp-102',
    companyName: 'VoltTech Power & Automation',
    badgeNumber: 'CW-4002',
    fullName: 'Mohammad Farooq',
    tradeSkill: 'High Voltage Cable Jointer',
    workerCategory: 'SKILLED' as ContractorWorkerCategory,
    designation: 'Substation Technician',
    phone: '+91 98334 22110',
    medicalFitnessValid: true,
    medicalFitnessExpiry: '2027-01-20',
    status: 'ACTIVE' as ContractorWorkerStatus,
    isReturning: false,
    totalShiftsCompleted: 38,
  },
  {
    contractorWorkerId: 'cw-403',
    companyId: 'comp-103',
    companyName: 'SolidGround Civil Works & Masonry',
    badgeNumber: 'CW-4003',
    fullName: 'Gopal Chandra Das',
    tradeSkill: 'Excavation & Shoring Operator',
    workerCategory: 'SEMI_SKILLED' as ContractorWorkerCategory,
    designation: 'Plant Machine Operator',
    phone: '+91 97441 88990',
    medicalFitnessValid: true,
    medicalFitnessExpiry: '2026-11-05',
    status: 'ACTIVE' as ContractorWorkerStatus,
    isReturning: true,
    totalShiftsCompleted: 89,
  },
  {
    contractorWorkerId: 'cw-404',
    companyId: 'comp-101',
    companyName: 'Apex Industrial Infrastructure Ltd',
    badgeNumber: 'CW-4004',
    fullName: 'Virendra Singh Rawat',
    tradeSkill: 'Scaffolder & Working-at-Height',
    workerCategory: 'SKILLED' as ContractorWorkerCategory,
    designation: 'Height Safety Lead',
    phone: '+91 96550 44332',
    medicalFitnessValid: false, // Flagged for medical renewal
    medicalFitnessExpiry: '2026-09-30',
    status: 'RESTRICTED' as ContractorWorkerStatus,
    isReturning: true,
    totalShiftsCompleted: 110,
  },
];

export interface AttendanceRecordItem {
  [key: string]: unknown;
  attendanceId: string;
  badgeNumber: string;
  workerName: string;
  companyName: string;
  workOrderNumber: string;
  workLocation: string;
  shiftDate: string;
  entryTime: string;
  exitTime: string | null;
  hoursWorked: number | null;
  presenceStatus: ContractorPresenceStatus;
  gateName: string;
  transportMode: string;
  isSharedVehicle: boolean;
  occupancy: number;
  distanceKm: number;
  emissionsKgCO2e: number;
  isManualCorrection?: boolean;
  correctionReason?: string;
}

const INITIAL_ATTENDANCE: AttendanceRecordItem[] = [
  {
    attendanceId: 'att-501',
    badgeNumber: 'CW-4001',
    workerName: 'Ramesh K. Yadav',
    companyName: 'Apex Industrial Infrastructure Ltd',
    workOrderNumber: 'WO-INFRA-8801',
    workLocation: 'Heavy Machining Bay 2',
    shiftDate: '2026-10-11',
    entryTime: '07:45 AM',
    exitTime: null,
    hoursWorked: null,
    presenceStatus: 'CHECKED_IN' as ContractorPresenceStatus,
    gateName: 'Gate 2 - Contractor Turnstile A',
    transportMode: 'BUS (Contractor Shuttle)',
    isSharedVehicle: true,
    occupancy: 24,
    distanceKm: 28.5,
    emissionsKgCO2e: 2.14,
  },
  {
    attendanceId: 'att-502',
    badgeNumber: 'CW-4002',
    workerName: 'Mohammad Farooq',
    companyName: 'VoltTech Power & Automation',
    workOrderNumber: 'WO-ELEC-8802',
    workLocation: 'High Voltage Switchyard',
    shiftDate: '2026-10-11',
    entryTime: '08:10 AM',
    exitTime: null,
    hoursWorked: null,
    presenceStatus: 'CHECKED_IN' as ContractorPresenceStatus,
    gateName: 'Gate 2 - Contractor Turnstile B',
    transportMode: 'TWO_WHEELER (Electric Scooter)',
    isSharedVehicle: false,
    occupancy: 1,
    distanceKm: 14.0,
    emissionsKgCO2e: 0.28,
  },
  {
    attendanceId: 'att-503',
    badgeNumber: 'CW-4003',
    workerName: 'Gopal Chandra Das',
    companyName: 'SolidGround Civil Works & Masonry',
    workOrderNumber: 'WO-CIVIL-8803',
    workLocation: 'North Perimeter Sector 4',
    shiftDate: '2026-10-11',
    entryTime: '06:50 AM',
    exitTime: '03:20 PM',
    hoursWorked: 8.5,
    presenceStatus: 'CHECKED_OUT' as ContractorPresenceStatus,
    gateName: 'Gate 3 - Heavy Civil Access',
    transportMode: 'BUS (Contractor Shuttle)',
    isSharedVehicle: true,
    occupancy: 24,
    distanceKm: 32.0,
    emissionsKgCO2e: 2.41,
  },
];

const INITIAL_COMPLIANCE_RECORDS = [
  {
    recordId: 'comp-rec-601',
    badgeNumber: 'CW-4001',
    workerName: 'Ramesh K. Yadav',
    companyName: 'Apex Industrial Infrastructure Ltd',
    requirementType: 'SAFETY_INDUCTION' as ComplianceRequirementType,
    name: 'Industrial Plant General EHS Induction (Annual)',
    status: 'VALID' as ComplianceStatus,
    documentRef: 'DOC-IND-2026-901',
    validFrom: '2026-01-10',
    validTo: '2027-01-09',
    verifiedBy: 'EHS Officer Patil',
  },
  {
    recordId: 'comp-rec-602',
    badgeNumber: 'CW-4001',
    workerName: 'Ramesh K. Yadav',
    companyName: 'Apex Industrial Infrastructure Ltd',
    requirementType: 'QUALIFICATION_CERTIFICATE' as ComplianceRequirementType,
    name: 'Certified Heavy Crane Rigger & Slinger (Level 3)',
    status: 'VALID' as ComplianceStatus,
    documentRef: 'DOC-QUAL-2024-441',
    validFrom: '2024-05-15',
    validTo: '2027-05-14',
    verifiedBy: 'Plant Safety Manager',
  },
  {
    recordId: 'comp-rec-603',
    badgeNumber: 'CW-4002',
    workerName: 'Mohammad Farooq',
    companyName: 'VoltTech Power & Automation',
    requirementType: 'TRADE_LICENSE' as ComplianceRequirementType,
    name: 'Central Electricity Authority High Voltage Wireman License',
    status: 'VALID' as ComplianceStatus,
    documentRef: 'DOC-LIC-CEA-8812',
    validFrom: '2025-03-01',
    validTo: '2028-02-28',
    verifiedBy: 'Electrical Inspector',
  },
  {
    recordId: 'comp-rec-604',
    badgeNumber: 'CW-4002',
    workerName: 'Mohammad Farooq',
    companyName: 'VoltTech Power & Automation',
    requirementType: 'PERMIT_PREREQUISITE' as ComplianceRequirementType,
    name: 'Switchyard High-Voltage Lockout/Tagout (LOTO) Authorization',
    status: 'VALID' as ComplianceStatus,
    documentRef: 'DOC-LOTO-2026-004',
    validFrom: '2026-10-01',
    validTo: '2026-11-01',
    verifiedBy: 'Electrical Lead Engineer',
  },
  {
    recordId: 'comp-rec-605',
    badgeNumber: 'CW-4003',
    workerName: 'Gopal Chandra Das',
    companyName: 'SolidGround Civil Works & Masonry',
    requirementType: 'MEDICAL_FITNESS' as ComplianceRequirementType,
    name: 'Plant Pre-Deployment Medical Fitness & Audiometry',
    status: 'EXPIRING_SOON' as ComplianceStatus,
    documentRef: 'DOC-MED-2025-339',
    validFrom: '2025-11-05',
    validTo: '2026-11-05',
    verifiedBy: 'Occupational Health Physician',
  },
  {
    recordId: 'comp-rec-606',
    badgeNumber: 'CW-4004',
    workerName: 'Virendra Singh Rawat',
    companyName: 'Apex Industrial Infrastructure Ltd',
    requirementType: 'MEDICAL_FITNESS' as ComplianceRequirementType,
    name: 'Working at Height Medical Certificate (Vertigo / Vision Screen)',
    status: 'EXPIRED' as ComplianceStatus,
    documentRef: 'DOC-MED-2025-102',
    validFrom: '2025-09-30',
    validTo: '2026-09-30',
    verifiedBy: 'Occupational Health Physician',
  },
  {
    recordId: 'comp-rec-607',
    badgeNumber: 'CW-4004',
    workerName: 'Virendra Singh Rawat',
    companyName: 'Apex Industrial Infrastructure Ltd',
    requirementType: 'EHS_TRAINING' as ComplianceRequirementType,
    name: 'Fall Protection & Scaffolding Erection Protocol',
    status: 'VALID' as ComplianceStatus,
    documentRef: 'DOC-TRN-FALL-991',
    validFrom: '2026-02-15',
    validTo: '2027-02-14',
    verifiedBy: 'Safety Officer Joshi',
  },
];

const INITIAL_EXPECTED_WORKFORCE = [
  {
    scheduleId: 'sch-701',
    badgeNumber: 'CW-4001',
    workerName: 'Ramesh K. Yadav',
    companyName: 'Apex Industrial Infrastructure Ltd',
    workOrderNumber: 'WO-INFRA-8801',
    workLocation: 'Heavy Machining Bay 2',
    shiftPattern: 'DAY_SHIFT (08:00 - 17:00)',
    status: 'CHECKED_IN',
    eligibility: 'ELIGIBLE',
    transportMode: 'BUS (Contractor Shuttle)',
  },
  {
    scheduleId: 'sch-702',
    badgeNumber: 'CW-4002',
    workerName: 'Mohammad Farooq',
    companyName: 'VoltTech Power & Automation',
    workOrderNumber: 'WO-ELEC-8802',
    workLocation: 'High Voltage Switchyard',
    shiftPattern: 'DAY_SHIFT (08:00 - 17:00)',
    status: 'CHECKED_IN',
    eligibility: 'ELIGIBLE',
    transportMode: 'TWO_WHEELER',
  },
  {
    scheduleId: 'sch-703',
    badgeNumber: 'CW-4003',
    workerName: 'Gopal Chandra Das',
    companyName: 'SolidGround Civil Works & Masonry',
    workOrderNumber: 'WO-CIVIL-8803',
    workLocation: 'North Perimeter Sector 4',
    shiftPattern: 'EARLY_SHIFT (07:00 - 15:30)',
    status: 'CHECKED_OUT',
    eligibility: 'ELIGIBLE',
    transportMode: 'BUS (Contractor Shuttle)',
  },
  {
    scheduleId: 'sch-704',
    badgeNumber: 'CW-4004',
    workerName: 'Virendra Singh Rawat',
    companyName: 'Apex Industrial Infrastructure Ltd',
    workOrderNumber: 'WO-INFRA-8801',
    workLocation: 'Heavy Machining Bay 2',
    shiftPattern: 'DAY_SHIFT (08:00 - 17:00)',
    status: 'ABSENT',
    eligibility: 'INELIGIBLE',
    transportMode: 'UNKNOWN',
  },
];

export const ContractorManagementView: React.FC<ContractorManagementViewProps> = ({
  initialSubView = 'DASHBOARD',
  currentRole = 'SUPER_ADMIN',
  siteId = 'SITE-PUNE-01',
  onNavigateSubView,
}) => {
  const [activeSubView, setActiveSubView] = useState<ContractorSubView>(initialSubView);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
      if (initialSubView === 'COMPANY_REGISTRATION') {
        setIsNewCompanyModalOpen(true);
      } else if (initialSubView === 'NEW_WORKER') {
        setIsRegisterWorkerModalOpen(true);
      }
    }
  }, [initialSubView]);

  // Interactive In-Memory Collections
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [contracts, setContracts] = useState(INITIAL_CONTRACTS);
  const [workOrders, setWorkOrders] = useState(INITIAL_WORK_ORDERS);
  const [workers, setWorkers] = useState(INITIAL_WORKERS);
  const [attendanceRecords, setAttendanceRecords] = useState(INITIAL_ATTENDANCE);
  const [complianceRecords, setComplianceRecords] = useState(INITIAL_COMPLIANCE_RECORDS);
  const [expectedWorkforce, setExpectedWorkforce] = useState(INITIAL_EXPECTED_WORKFORCE);

  // Modals & Drawers State
  const [isNewCompanyModalOpen, setIsNewCompanyModalOpen] = useState(false);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  const [isNewWorkOrderModalOpen, setIsNewWorkOrderModalOpen] = useState(false);
  const [isRegisterWorkerModalOpen, setIsRegisterWorkerModalOpen] = useState(false);
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  const [isCorrectionModalOpen, setIsCorrectionModalOpen] = useState(false);
  const [selectedRecordForCorrection, setSelectedRecordForCorrection] = useState<any>(null);
  const [selectedEntityDrawer, setSelectedEntityDrawer] = useState<{ entityType: string; data: any } | null>(null);

  // Form States
  const [newCompanyForm, setNewCompanyForm] = useState({
    tradeName: '',
    vendorCode: '',
    contractorClassification: 'GENERAL_CONTRACTOR',
    safetyRating: 'GRADE_A',
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactEmail: '',
    insurancePolicyNumber: '',
    insuranceExpiryDate: '2026-12-31',
  });

  const [newContractForm, setNewContractForm] = useState({
    companyId: INITIAL_COMPANIES[0].companyId,
    contractNumber: '',
    title: '',
    contractType: 'MASTER_SERVICES_AGREEMENT',
    startDate: '2026-10-15',
    endDate: '2027-10-14',
    scopeOfWork: '',
  });

  const [newWorkOrderForm, setNewWorkOrderForm] = useState({
    contractId: INITIAL_CONTRACTS[0].contractId,
    companyId: INITIAL_COMPANIES[0].companyId,
    workOrderNumber: '',
    title: '',
    workCategory: 'GENERAL',
    workLocation: 'Plant Main Section',
    authorizedWorkerCount: 10,
    safetyPermitRequired: true,
    startDate: '2026-10-15',
    endDate: '2026-11-15',
  });

  const [newWorkerForm, setNewWorkerForm] = useState({
    companyId: INITIAL_COMPANIES[0].companyId,
    fullName: '',
    badgeNumber: '',
    tradeSkill: '',
    workerCategory: 'SKILLED',
    designation: '',
    phone: '',
    medicalFitnessValid: true,
  });

  const [checkInForm, setCheckInForm] = useState({
    workerId: INITIAL_WORKERS[0].contractorWorkerId,
    workOrderId: INITIAL_WORK_ORDERS[0].workOrderId,
    gateName: 'Gate 2 - Turnstile A',
    transportMode: 'BUS',
    isSharedVehicle: true,
    vehiclePlate: 'MH-12-CT-9988',
    originLocation: 'City Central Worker Hub',
    distanceKm: 25.0,
  });

  const [correctionForm, setCorrectionForm] = useState({
    correctedEntryTime: '',
    correctedExitTime: '',
    correctedPresenceStatus: 'CHECKED_OUT' as ContractorPresenceStatus,
    correctionReason: '',
  });

  const handleNavigate = (sub: ContractorSubView) => {
    setActiveSubView(sub);
    if (onNavigateSubView) onNavigateSubView(sub);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter((c) => c.status === 'ACTIVE').length;
    const activeContractsCount = contracts.filter((c) => c.status === 'ACTIVE').length;
    const activeWOs = workOrders.filter((w) => w.status === 'ACTIVE').length;
    const currentlyInside = attendanceRecords.filter((a) => a.presenceStatus === 'CHECKED_IN').length;
    const restrictedWorkers = workers.filter((w) => w.status === 'RESTRICTED' || !w.medicalFitnessValid).length;
    const todayCheckInsCount = attendanceRecords.length;

    const totalEmissionsKg = attendanceRecords.reduce((acc, cur) => acc + (cur.emissionsKgCO2e || 0), 0);
    const totalCommuterKm = attendanceRecords.reduce((acc, cur) => acc + (cur.distanceKm || 0), 0);

    return {
      totalCompanies,
      activeCompanies,
      activeContractsCount,
      activeWOs,
      currentlyInside,
      restrictedWorkers,
      todayCheckInsCount,
      totalEmissionsKg: Number(totalEmissionsKg.toFixed(2)),
      totalCommuterKm: Number(totalCommuterKm.toFixed(1)),
      complianceRate: 96.8,
    };
  }, [companies, contracts, workOrders, workers, attendanceRecords]);

  // Form Handlers
  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.tradeName) return;
    const newComp = {
      companyId: `comp-${Date.now()}`,
      vendorCode: newCompanyForm.vendorCode || `VEND-${newCompanyForm.tradeName.slice(0, 4).toUpperCase()}-${String(Date.now()).slice(-4)}`,
      tradeName: newCompanyForm.tradeName,
      companyName: newCompanyForm.tradeName,
      contractorClassification: newCompanyForm.contractorClassification as ContractorClassification,
      safetyRating: newCompanyForm.safetyRating as ContractorSafetyRating,
      status: 'ACTIVE' as ContractorCompanyStatus,
      primaryContactName: newCompanyForm.primaryContactName || 'Authorized Rep',
      primaryContactPhone: newCompanyForm.primaryContactPhone || '+91 90000 00000',
      primaryContactEmail: newCompanyForm.primaryContactEmail || 'admin@contractor.example',
      siteContactName: 'Site Supervisor',
      activeContractsCount: 0,
      activeWorkOrdersCount: 0,
      assignedWorkersCount: 0,
      compliancePassRate: 100.0,
      insurancePolicyNumber: newCompanyForm.insurancePolicyNumber || 'POL-PENDING',
      insuranceExpiryDate: newCompanyForm.insuranceExpiryDate,
    };
    setCompanies([newComp, ...companies]);
    setIsNewCompanyModalOpen(false);
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContractForm.title) return;
    const comp = companies.find((c) => c.companyId === newContractForm.companyId);
    const newCon = {
      contractId: `con-${Date.now()}`,
      contractNumber: newContractForm.contractNumber || `CON-2026-${String(Date.now()).slice(-4)}`,
      companyId: newContractForm.companyId,
      companyName: comp?.tradeName || 'Contractor Org',
      title: newContractForm.title,
      contractType: newContractForm.contractType as ContractType,
      status: 'ACTIVE' as ContractStatus,
      startDate: newContractForm.startDate,
      endDate: newContractForm.endDate,
      scopeOfWork: newContractForm.scopeOfWork || 'General plant scope',
      approvalState: 'APPROVED',
    };
    setContracts([newCon, ...contracts]);
    setIsNewContractModalOpen(false);
  };

  const handleCreateWorkOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkOrderForm.title) return;
    const comp = companies.find((c) => c.companyId === newWorkOrderForm.companyId);
    const newWO = {
      workOrderId: `wo-${Date.now()}`,
      referenceNumber: `CTR-2026-${String(Date.now()).slice(-6)}`,
      workOrderNumber: newWorkOrderForm.workOrderNumber || `WO-${String(Date.now()).slice(-4)}`,
      companyId: newWorkOrderForm.companyId,
      companyName: comp?.tradeName || 'Contractor Org',
      title: newWorkOrderForm.title,
      workCategory: newWorkOrderForm.workCategory as WorkOrderCategory,
      workLocation: newWorkOrderForm.workLocation,
      authorizedWorkerCount: Number(newWorkOrderForm.authorizedWorkerCount || 10),
      safetyPermitRequired: Boolean(newWorkOrderForm.safetyPermitRequired),
      startDate: newWorkOrderForm.startDate,
      endDate: newWorkOrderForm.endDate,
      status: 'ACTIVE' as WorkOrderStatus,
      approvalState: 'APPROVED',
    };
    setWorkOrders([newWO, ...workOrders]);
    setIsNewWorkOrderModalOpen(false);
  };

  const handleRegisterWorker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkerForm.fullName) return;
    const comp = companies.find((c) => c.companyId === newWorkerForm.companyId);
    const newW = {
      contractorWorkerId: `cw-${Date.now()}`,
      companyId: newWorkerForm.companyId,
      companyName: comp?.tradeName || 'Contractor Org',
      badgeNumber: newWorkerForm.badgeNumber || `CW-${String(Date.now()).slice(-4)}`,
      fullName: newWorkerForm.fullName,
      tradeSkill: newWorkerForm.tradeSkill || 'General Technician',
      workerCategory: newWorkerForm.workerCategory as ContractorWorkerCategory,
      designation: newWorkerForm.designation || 'Technician',
      phone: newWorkerForm.phone || '+91 98000 00000',
      medicalFitnessValid: Boolean(newWorkerForm.medicalFitnessValid),
      medicalFitnessExpiry: '2027-10-15',
      status: 'ACTIVE' as ContractorWorkerStatus,
      isReturning: false,
      totalShiftsCompleted: 0,
    };
    setWorkers([newW, ...workers]);
    setIsRegisterWorkerModalOpen(false);
  };

  const handleCheckInWorker = (e: React.FormEvent) => {
    e.preventDefault();
    const w = workers.find((wk) => wk.contractorWorkerId === checkInForm.workerId);
    const wo = workOrders.find((wko) => wko.workOrderId === checkInForm.workOrderId);
    if (!w || !wo) return;

    if (!w.medicalFitnessValid || w.status === 'RESTRICTED') {
      showToast(`Gate access denied: ${w.fullName} is restricted or has lapsed medical fitness.`, 'danger');
      return;
    }

    // Zero-Blocker Invariant: compute emissions smoothly
    const distance = Number(checkInForm.distanceKm || 20);
    const occupancy = checkInForm.isSharedVehicle ? 20 : 1;
    const effectiveKm = distance / occupancy;
    const calculatedEmissions = Number((effectiveKm * 0.171).toFixed(2));

    const newAttendance = {
      attendanceId: `att-${Date.now()}`,
      badgeNumber: w.badgeNumber,
      workerName: w.fullName,
      companyName: w.companyName,
      workOrderNumber: wo.workOrderNumber,
      workLocation: wo.workLocation,
      shiftDate: new Date().toISOString().slice(0, 10),
      entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      exitTime: null,
      hoursWorked: null,
      presenceStatus: 'CHECKED_IN' as ContractorPresenceStatus,
      gateName: checkInForm.gateName,
      transportMode: `${checkInForm.transportMode} (${checkInForm.isSharedVehicle ? 'Shared Vehicle' : 'Solo'})`,
      isSharedVehicle: checkInForm.isSharedVehicle,
      occupancy,
      distanceKm: distance,
      emissionsKgCO2e: calculatedEmissions,
    };

    setAttendanceRecords([newAttendance, ...attendanceRecords]);
    setIsCheckInModalOpen(false);
  };

  const handleCheckOutWorker = (attendanceId: string) => {
    setAttendanceRecords(
      attendanceRecords.map((a) => {
        if (a.attendanceId === attendanceId) {
          return {
            ...a,
            exitTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hoursWorked: 8.5,
            presenceStatus: 'CHECKED_OUT' as ContractorPresenceStatus,
          };
        }
        return a;
      })
    );
  };

  const handleApplyCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordForCorrection || !correctionForm.correctionReason) return;
    setAttendanceRecords(
      attendanceRecords.map((a) => {
        if (a.attendanceId === selectedRecordForCorrection.attendanceId) {
          return {
            ...a,
            entryTime: correctionForm.correctedEntryTime || a.entryTime,
            exitTime: correctionForm.correctedExitTime || a.exitTime,
            presenceStatus: correctionForm.correctedPresenceStatus,
            isManualCorrection: true,
            correctionReason: correctionForm.correctionReason,
          };
        }
        return a;
      })
    );
    setIsCorrectionModalOpen(false);
    setSelectedRecordForCorrection(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px' }}>
      {/* 1. Header & Navigation Ribbon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          borderBottom: `1px solid ${colors.slate[200]}`,
          paddingBottom: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: radius.md,
                backgroundColor: colors.primary[50],
                color: colors.primary[600],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HardHat size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: fs['2xl'], fontWeight: typography.fontWeight.bold, margin: 0, color: colors.slate[900] }}>
                Contractor Management & Workforce Compliance
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.sm, color: colors.slate[500] }}>
                Multi-Site Contractor Governance, Work Orders, Safety Induction Prerequisites & Embedded ESG Commuting Capture
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Group */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button variant="secondary" size="dense" onClick={() => setIsNewCompanyModalOpen(true)}>
            <Plus size={16} /> Register Company
          </Button>
          <Button variant="secondary" size="dense" onClick={() => setIsNewContractModalOpen(true)}>
            <FileSignature size={16} /> New Contract
          </Button>
          <Button variant="secondary" size="dense" onClick={() => setIsNewWorkOrderModalOpen(true)}>
            <Briefcase size={16} /> Work Order
          </Button>
          <Button variant="secondary" size="dense" onClick={() => setIsRegisterWorkerModalOpen(true)}>
            <UserPlus size={16} /> Add Worker
          </Button>
          <Button variant="primary" size="dense" onClick={() => setIsCheckInModalOpen(true)}>
            <Stamp size={16} /> Gate Check-In
          </Button>
        </div>
      </div>

      {/* 2. Top Navigation Subview Pills */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          borderBottom: `1px solid ${colors.slate[100]}`,
        }}
      >
        {[
          { key: 'DASHBOARD', label: '1. Dashboard', icon: <BarChart3 size={15} /> },
          { key: 'COMPANIES', label: '2. Companies', icon: <Building2 size={15} /> },
          { key: 'CONTRACTS', label: '3. Contracts', icon: <FileSignature size={15} /> },
          { key: 'WORK_ORDERS', label: '4. Work Orders', icon: <Briefcase size={15} /> },
          { key: 'WORKER_DIRECTORY', label: '5. Worker Directory', icon: <Users size={15} /> },
          { key: 'RETURNING_WORKERS', label: '6. Returning Workers', icon: <UserCheck size={15} /> },
          { key: 'ASSIGNMENTS', label: '7. Assignments', icon: <Layers size={15} /> },
          { key: 'COMPLIANCE', label: '8. Compliance', icon: <ShieldCheck size={15} /> },
          { key: 'DOCUMENT_VERIFICATION', label: '9. Documents', icon: <FileCheck size={15} /> },
          { key: 'TRAINING_RECORDS', label: '10. Training', icon: <GraduationCap size={15} /> },
          { key: 'SAFETY_INDUCTION', label: '11. Inductions', icon: <Shield size={15} /> },
          { key: 'QUALIFICATIONS', label: '12. Qualifications', icon: <Award size={15} /> },
          { key: 'FITNESS_MEDICAL', label: '13. Medical Fitness', icon: <HeartPulse size={15} /> },
          { key: 'PERMITS', label: '14. Permits', icon: <Flame size={15} /> },
          { key: 'CURRENTLY_ON_SITE', label: '15. Currently On Site', icon: <Activity size={15} /> },
          { key: 'DAILY_ATTENDANCE', label: '16. Attendance Ledger', icon: <Clock size={15} /> },
          { key: 'EXPECTED_WORKFORCE', label: '17. Expected Workforce', icon: <Calendar size={15} /> },
          { key: 'EXPIRING_DOCUMENTS', label: '18. Expiring Alerts', icon: <AlertTriangle size={15} /> },
          { key: 'RESTRICTED_WORKERS', label: '19. Restricted Workers', icon: <BadgeAlert size={15} /> },
          { key: 'CONTRACTOR_TRANSPORT', label: '20. Transport & Mobility', icon: <Bus size={15} /> },
          { key: 'ESG_TRACEABILITY', label: '21. ESG Traceability', icon: <Leaf size={15} /> },
          { key: 'REPORTS', label: '22. Analytics & Reports', icon: <BarChart3 size={15} /> },
        ].map((tab) => {
          const isActive = activeSubView === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleNavigate(tab.key as ContractorSubView)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: radius.md,
                fontSize: fs.xs,
                fontWeight: isActive ? typography.fontWeight.semibold : typography.fontWeight.medium,
                backgroundColor: isActive ? colors.primary[600] : '#ffffff',
                color: isActive ? '#ffffff' : colors.slate[700],
                border: `1px solid ${isActive ? colors.primary[600] : colors.slate[200]}`,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. Executive KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <Card style={{ padding: '16px', borderLeft: `4px solid ${colors.primary[500]}` }}>
          <div style={{ fontSize: fs.xs, color: colors.slate[500], fontWeight: typography.fontWeight.medium }}>
            Active Companies
          </div>
          <div style={{ fontSize: fs['2xl'], fontWeight: typography.fontWeight.bold, color: colors.slate[900], marginTop: '4px' }}>
            {metrics.activeCompanies} <span style={{ fontSize: fs.xs, color: colors.slate[400] }}>/ {metrics.totalCompanies} Total</span>
          </div>
          <div style={{ fontSize: fs.xs, color: colors.primary[600], marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Building2 size={12} /> {metrics.activeContractsCount} Active MSAs / Contracts
          </div>
        </Card>

        <Card style={{ padding: '16px', borderLeft: `4px solid ${colors.primary[500]}` }}>
          <div style={{ fontSize: fs.xs, color: colors.slate[500], fontWeight: typography.fontWeight.medium }}>
            Active Work Orders
          </div>
          <div style={{ fontSize: fs['2xl'], fontWeight: typography.fontWeight.bold, color: colors.slate[900], marginTop: '4px' }}>
            {metrics.activeWOs}
          </div>
          <div style={{ fontSize: fs.xs, color: colors.primary[600], marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Briefcase size={12} /> Enforcing Headcount Quotas
          </div>
        </Card>

        <Card style={{ padding: '16px', borderLeft: `4px solid ${colors.esg[500]}` }}>
          <div style={{ fontSize: fs.xs, color: colors.slate[500], fontWeight: typography.fontWeight.medium }}>
            Currently On Site (Occupancy)
          </div>
          <div style={{ fontSize: fs['2xl'], fontWeight: typography.fontWeight.bold, color: colors.esg[700], marginTop: '4px' }}>
            {metrics.currentlyInside}
          </div>
          <div style={{ fontSize: fs.xs, color: colors.esg[600], marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle2 size={12} /> Zero Overstays Detected
          </div>
        </Card>

        <Card style={{ padding: '16px', borderLeft: `4px solid ${colors.status.warning.solid}` }}>
          <div style={{ fontSize: fs.xs, color: colors.slate[500], fontWeight: typography.fontWeight.medium }}>
            Compliance Pass Rate
          </div>
          <div style={{ fontSize: fs['2xl'], fontWeight: typography.fontWeight.bold, color: colors.status.warning.fg, marginTop: '4px' }}>
            {metrics.complianceRate}%
          </div>
          <div style={{ fontSize: fs.xs, color: colors.status.warning.fg, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={12} /> {metrics.restrictedWorkers} Restricted / Lapsed
          </div>
        </Card>

        <Card style={{ padding: '16px', borderLeft: `4px solid ${colors.esg[500]}` }}>
          <div style={{ fontSize: fs.xs, color: colors.slate[500], fontWeight: typography.fontWeight.medium }}>
            Scope 3 Cat 7 Commute (Today)
          </div>
          <div style={{ fontSize: fs['2xl'], fontWeight: typography.fontWeight.bold, color: colors.esg[700], marginTop: '4px' }}>
            {metrics.totalEmissionsKg} <span style={{ fontSize: fs.xs, color: colors.slate[500] }}>kg CO₂e</span>
          </div>
          <div style={{ fontSize: fs.xs, color: colors.esg[600], marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Leaf size={12} /> {metrics.totalCommuterKm} km | Deduplicated
          </div>
        </Card>
      </div>

      {/* 4. Subview Content Rendering */}
      {activeSubView === 'DASHBOARD' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Banner
            title="Industrial Contractor Operations Active"
            message="Facility operating under full automated access control. Workers with expired safety inductions or lapsed fitness certifications are blocked at turnstiles."
            type="system"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            <Card style={{ padding: '20px' }}>
              <h3 style={{ fontSize: fs.md, fontWeight: typography.fontWeight.bold, margin: '0 0 12px 0' }}>
                Active Contractor Work Orders
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {workOrders.map((wo) => (
                  <div
                    key={wo.workOrderId}
                    style={{
                      padding: '12px',
                      borderRadius: radius.md,
                      backgroundColor: colors.slate[50],
                      border: `1px solid ${colors.slate[200]}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: typography.fontWeight.semibold, fontSize: fs.sm }}>
                        {wo.title}
                      </div>
                      <div style={{ fontSize: fs.xs, color: colors.slate[500], marginTop: '2px' }}>
                        {wo.workOrderNumber} • {wo.companyName} • {wo.workLocation}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StatusBadge status={wo.status === 'ACTIVE' ? 'active' : 'pending'} size="sm" />
                      <div style={{ fontSize: fs.xs, color: colors.slate[400], marginTop: '4px' }}>
                        Max: {wo.authorizedWorkerCount} workers
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: '20px' }}>
              <h3 style={{ fontSize: fs.md, fontWeight: typography.fontWeight.bold, margin: '0 0 12px 0' }}>
                Live Site Attendance & Turnstiles
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {attendanceRecords.slice(0, 4).map((att) => (
                  <div
                    key={att.attendanceId}
                    style={{
                      padding: '12px',
                      borderRadius: radius.md,
                      backgroundColor: colors.slate[50],
                      border: `1px solid ${colors.slate[200]}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: typography.fontWeight.semibold, fontSize: fs.sm }}>
                        {att.workerName} ({att.badgeNumber})
                      </div>
                      <div style={{ fontSize: fs.xs, color: colors.slate[500], marginTop: '2px' }}>
                        {att.companyName} • In: {att.entryTime} via {att.gateName}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <StatusBadge status={att.presenceStatus === 'CHECKED_IN' ? 'active' : 'COMPLETED'} size="sm" />
                      {att.presenceStatus === 'CHECKED_IN' && (
                        <Button size="dense" variant="secondary" onClick={() => handleCheckOutWorker(att.attendanceId)}>
                          Check Out
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* 5. Contractor Companies View */}
      {activeSubView === 'COMPANIES' && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Registered Contractor Organizations
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Master external organization records with vendor codes and verified insurance policies
              </p>
            </div>
            <Button size="dense" variant="primary" onClick={() => setIsNewCompanyModalOpen(true)}>
              <Plus size={16} /> Add Company
            </Button>
          </div>

          <DataTable
            columns={[
              { key: 'vendorCode', header: 'Vendor Code', width: '130px', render: (r) => <strong>{r.vendorCode}</strong> },
              { key: 'tradeName', header: 'Contractor Company Name', render: (r) => r.tradeName },
              { key: 'contractorClassification', header: 'Classification', render: (r) => <span style={{ fontSize: '11px', color: colors.slate[600] }}>{r.contractorClassification}</span> },
              { key: 'safetyRating', header: 'Safety Rating', render: (r) => <StatusBadge status={r.safetyRating === 'GRADE_A' ? 'approved' : 'warning'} size="sm" /> },
              { key: 'primaryContact', header: 'Primary Contact', render: (r) => <span>{r.primaryContactName} ({r.primaryContactPhone})</span> },
              { key: 'activeWorkOrdersCount', header: 'Active WOs', align: 'center', render: (r) => <strong>{r.activeWorkOrdersCount}</strong> },
              { key: 'compliancePassRate', header: 'Compliance', align: 'center', render: (r) => <span style={{ color: colors.esg[600], fontWeight: 600 }}>{r.compliancePassRate}%</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'ACTIVE' ? 'active' : 'inactive'} size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <Button size="dense" variant="secondary" onClick={() => setSelectedEntityDrawer({ entityType: 'COMPANY', data: r })}>
                    Inspect
                  </Button>
                ),
              },
            ]}
            data={companies}
          />
        </Card>
      )}

      {/* 6. Contracts View */}
      {activeSubView === 'CONTRACTS' && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Commercial Contracts & Master Service Agreements
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Governing engagements authorizing scope of work, safety prerequisites, and validity periods
              </p>
            </div>
            <Button size="dense" variant="primary" onClick={() => setIsNewContractModalOpen(true)}>
              <Plus size={16} /> New Contract
            </Button>
          </div>

          <DataTable
            columns={[
              { key: 'contractNumber', header: 'Contract Ref', width: '140px', render: (r) => <strong>{r.contractNumber}</strong> },
              { key: 'title', header: 'Contract Title', render: (r) => <strong>{r.title}</strong> },
              { key: 'companyName', header: 'Contractor Organization', render: (r) => r.companyName },
              { key: 'contractType', header: 'Contract Type', render: (r) => <span style={{ fontSize: '11px' }}>{r.contractType}</span> },
              { key: 'validity', header: 'Validity Period', render: (r) => `${r.startDate} to ${r.endDate}` },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'ACTIVE' ? 'active' : r.status === 'EXPIRING' ? 'warning' : 'rejected'} size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <Button size="dense" variant="secondary" onClick={() => setSelectedEntityDrawer({ entityType: 'CONTRACT', data: r })}>
                    View Terms
                  </Button>
                ),
              },
            ]}
            data={contracts}
          />
        </Card>
      )}

      {/* 7. Work Orders View */}
      {activeSubView === 'WORK_ORDERS' && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Authorized Work Orders
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Specific scopes of work with headcount caps, safety permits, and zone authorizations
              </p>
            </div>
            <Button size="dense" variant="primary" onClick={() => setIsNewWorkOrderModalOpen(true)}>
              <Plus size={16} /> Create Work Order
            </Button>
          </div>

          <DataTable
            columns={[
              { key: 'workOrderNumber', header: 'WO Number', width: '140px', render: (r) => <strong>{r.workOrderNumber}</strong> },
              { key: 'title', header: 'Scope / Work Order Title', render: (r) => <strong>{r.title}</strong> },
              { key: 'companyName', header: 'Contractor', render: (r) => r.companyName },
              { key: 'workCategory', header: 'Category', render: (r) => <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: colors.slate[100], borderRadius: '4px' }}>{r.workCategory}</span> },
              { key: 'workLocation', header: 'Assigned Plant Location', render: (r) => r.workLocation },
              { key: 'authorizedWorkerCount', header: 'Headcount Cap', align: 'center', render: (r) => <strong>{r.authorizedWorkerCount}</strong> },
              { key: 'safetyPermitRequired', header: 'Safety Permit', align: 'center', render: (r) => r.safetyPermitRequired ? <StatusBadge status="warning" size="micro" /> : <span style={{ fontSize: '11px', color: colors.slate[400] }}>Not Required</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'ACTIVE' ? 'active' : 'pending'} size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <Button size="dense" variant="secondary" onClick={() => setSelectedEntityDrawer({ entityType: 'WORK_ORDER', data: r })}>
                    Manage
                  </Button>
                ),
              },
            ]}
            data={workOrders}
          />
        </Card>
      )}

      {/* 8. Worker Directory & Returning Workers */}
      {(activeSubView === 'WORKER_DIRECTORY' || activeSubView === 'RETURNING_WORKERS' || activeSubView === 'RESTRICTED_WORKERS') && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                {activeSubView === 'RETURNING_WORKERS'
                  ? 'Returning Contractor Workers Roster'
                  : activeSubView === 'RESTRICTED_WORKERS'
                  ? 'Restricted & Non-Compliant Workers'
                  : 'Contractor Workforce Directory'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Canonical person profiles with trade credentials, medical fitness status, and shift attendance history
              </p>
            </div>
            <Button size="dense" variant="primary" onClick={() => setIsRegisterWorkerModalOpen(true)}>
              <UserPlus size={16} /> Register Worker
            </Button>
          </div>

          <DataTable
            columns={[
              { key: 'badgeNumber', header: 'Badge #', width: '110px', render: (r) => <strong>{r.badgeNumber}</strong> },
              { key: 'fullName', header: 'Worker Name', render: (r) => (
                <div>
                  <strong>{r.fullName}</strong>
                  {r.isReturning && <span style={{ marginLeft: '6px', fontSize: '10px', backgroundColor: colors.primary[50], color: colors.primary[700], padding: '1px 5px', borderRadius: '3px' }}>Returning</span>}
                </div>
              ) },
              { key: 'companyName', header: 'Employer Company', render: (r) => r.companyName },
              { key: 'tradeSkill', header: 'Trade Skill / Specialization', render: (r) => r.tradeSkill },
              { key: 'medicalFitnessValid', header: 'Medical Fitness', render: (r) => r.medicalFitnessValid ? <StatusBadge status="approved" size="micro" /> : <StatusBadge status="rejected" size="micro" /> },
              { key: 'shifts', header: 'Completed Shifts', align: 'center', render: (r) => <span>{r.totalShiftsCompleted}</span> },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status === 'ACTIVE' ? 'active' : 'rejected'} size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <Button size="dense" variant="secondary" onClick={() => setSelectedEntityDrawer({ entityType: 'WORKER', data: r })}>
                    Profile
                  </Button>
                ),
              },
            ]}
            data={
              activeSubView === 'RETURNING_WORKERS'
                ? workers.filter((w) => w.isReturning)
                : activeSubView === 'RESTRICTED_WORKERS'
                ? workers.filter((w) => w.status === 'RESTRICTED' || !w.medicalFitnessValid)
                : workers
            }
          />
        </Card>
      )}

      {/* 8b. Worker Assignments View */}
      {(activeSubView === 'ASSIGNMENTS' || activeSubView === 'WORKER_ASSIGNMENTS') && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Worker-to-Work Order Assignments
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Authorized workforce deployed across plant zones, active work orders, and shifts
              </p>
            </div>
          </div>

          <DataTable
            columns={[
              { key: 'badgeNumber', header: 'Badge #', width: '110px', render: (r) => <strong>{r.badgeNumber}</strong> },
              { key: 'fullName', header: 'Worker Name', render: (r) => <strong>{r.fullName}</strong> },
              { key: 'companyName', header: 'Employer Company', render: (r) => r.companyName },
              { key: 'workOrder', header: 'Assigned Work Order', render: () => <span>WO-2026-PIPE-101</span> },
              { key: 'tradeSkill', header: 'Trade Skill', render: (r) => r.tradeSkill },
              { key: 'status', header: 'Assignment Status', render: () => <StatusBadge status="active" size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <Button size="dense" variant="secondary" onClick={() => setSelectedEntityDrawer({ entityType: 'WORKER', data: r })}>
                    Reassign
                  </Button>
                ),
              },
            ]}
            data={workers}
          />
        </Card>
      )}

      {/* 8c. Compliance, Document Verification, Training & Safety Prerequisites */}
      {(activeSubView === 'COMPLIANCE' ||
        activeSubView === 'DOCUMENT_VERIFICATION' ||
        activeSubView === 'TRAINING_RECORDS' ||
        activeSubView === 'SAFETY_INDUCTION' ||
        activeSubView === 'QUALIFICATIONS' ||
        activeSubView === 'FITNESS_MEDICAL' ||
        activeSubView === 'PERMITS' ||
        activeSubView === 'EXPIRING_DOCUMENTS') && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                {activeSubView === 'TRAINING_RECORDS'
                  ? 'Mandatory EHS Training Records'
                  : activeSubView === 'SAFETY_INDUCTION'
                  ? 'Facility Safety Induction Status'
                  : activeSubView === 'QUALIFICATIONS'
                  ? 'Contractor Trade Qualifications & Certifications'
                  : activeSubView === 'FITNESS_MEDICAL'
                  ? 'Occupational Health & Medical Fitness Records'
                  : activeSubView === 'PERMITS'
                  ? 'Permit to Work (PTW) Prerequisites & LOTO Controls'
                  : activeSubView === 'EXPIRING_DOCUMENTS'
                  ? 'Expiring Compliance Documents & Alert Tracker'
                  : 'Multi-Source Workforce Compliance Ledger'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Verified documentary evidence required for work order deployment and gate turnstile authorization
              </p>
            </div>
          </div>

          <DataTable
            columns={[
              { key: 'documentRef', header: 'Document Ref', width: '140px', render: (r) => <strong>{r.documentRef}</strong> },
              { key: 'workerName', header: 'Contractor Worker', render: (r) => <span><strong>{r.workerName}</strong> ({r.badgeNumber})</span> },
              { key: 'companyName', header: 'Employer Company', render: (r) => r.companyName },
              { key: 'requirementType', header: 'Prerequisite Type', render: (r) => <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: colors.slate[100], borderRadius: '4px' }}>{r.requirementType}</span> },
              { key: 'name', header: 'Requirement Description', render: (r) => <strong>{r.name}</strong> },
              { key: 'validity', header: 'Validity Window', render: (r) => `${r.validFrom} to ${r.validTo}` },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (
                  <StatusBadge
                    status={r.status === 'VALID' ? 'approved' : r.status === 'EXPIRING_SOON' ? 'warning' : 'rejected'}
                    size="sm"
                  />
                ),
              },
              { key: 'verifiedBy', header: 'Verified By', render: (r) => <span style={{ fontSize: '12px', color: colors.slate[600] }}>{r.verifiedBy}</span> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <Button size="dense" variant="secondary" onClick={() => setSelectedEntityDrawer({ entityType: 'COMPLIANCE', data: r })}>
                    Verify
                  </Button>
                ),
              },
            ]}
            data={complianceRecords.filter((rec) => {
              if (activeSubView === 'TRAINING_RECORDS') return rec.requirementType === 'EHS_TRAINING';
              if (activeSubView === 'SAFETY_INDUCTION') return rec.requirementType === 'SAFETY_INDUCTION';
              if (activeSubView === 'QUALIFICATIONS') return rec.requirementType === 'QUALIFICATION_CERTIFICATE' || rec.requirementType === 'TRADE_LICENSE';
              if (activeSubView === 'FITNESS_MEDICAL') return rec.requirementType === 'MEDICAL_FITNESS';
              if (activeSubView === 'PERMITS') return rec.requirementType === 'PERMIT_PREREQUISITE';
              if (activeSubView === 'EXPIRING_DOCUMENTS') return rec.status === 'EXPIRING_SOON' || rec.status === 'EXPIRED';
              return true;
            })}
          />
        </Card>
      )}

      {/* 8d. Expected Workforce Shift Scheduling View */}
      {activeSubView === 'EXPECTED_WORKFORCE' && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Scheduled & Expected Workforce Roster
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Shift schedule allocations and authorization readiness check before turnstile arrival
              </p>
            </div>
          </div>

          <DataTable
            columns={[
              { key: 'badgeNumber', header: 'Badge #', width: '110px', render: (r) => <strong>{r.badgeNumber}</strong> },
              { key: 'workerName', header: 'Contractor Worker', render: (r) => <strong>{r.workerName}</strong> },
              { key: 'companyName', header: 'Company', render: (r) => r.companyName },
              { key: 'workOrderNumber', header: 'Work Order', render: (r) => r.workOrderNumber },
              { key: 'workLocation', header: 'Location', render: (r) => r.workLocation },
              { key: 'shiftPattern', header: 'Shift Pattern', render: (r) => r.shiftPattern },
              {
                key: 'eligibility',
                header: 'Work Authorization',
                render: (r) => (
                  <StatusBadge
                    status={r.eligibility === 'ELIGIBLE' ? 'approved' : 'rejected'}
                    size="sm"
                  />
                ),
              },
              { key: 'transportMode', header: 'Planned Transport', render: (r) => r.transportMode },
              {
                key: 'status',
                header: 'Presence State',
                render: (r) => (
                  <StatusBadge
                    status={r.status === 'CHECKED_IN' ? 'active' : r.status === 'CHECKED_OUT' ? 'COMPLETED' : 'pending'}
                    size="sm"
                  />
                ),
              },
            ]}
            data={expectedWorkforce}
          />
        </Card>
      )}

      {/* 9. Attendance & Gate Operations */}
      {(activeSubView === 'ATTENDANCE' || activeSubView === 'CONTRACTOR_ATTENDANCE' || activeSubView === 'DAILY_ATTENDANCE' || activeSubView === 'CURRENTLY_ON_SITE') && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                {activeSubView === 'CURRENTLY_ON_SITE' ? 'Contractors Currently Inside Plant' : 'Daily Contractor Attendance Ledger'}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Verified entry and exit records with gate hardware telemetry and embedded commuter transport capture
              </p>
            </div>
            <Button size="dense" variant="primary" onClick={() => setIsCheckInModalOpen(true)}>
              <Stamp size={16} /> Turnstile Check-In
            </Button>
          </div>

          <DataTable<AttendanceRecordItem>
            columns={[
              { key: 'badgeNumber', header: 'Badge #', width: '110px', render: (r) => <strong>{r.badgeNumber}</strong> },
              { key: 'workerName', header: 'Contractor Worker', render: (r) => <strong>{r.workerName}</strong> },
              { key: 'companyName', header: 'Company', render: (r) => r.companyName },
              { key: 'workOrderNumber', header: 'Work Order', render: (r) => r.workOrderNumber },
              { key: 'entryTime', header: 'Entry Time', render: (r) => r.entryTime },
              { key: 'exitTime', header: 'Exit Time', render: (r) => r.exitTime || <span style={{ color: colors.esg[600], fontWeight: 600 }}>Active Inside</span> },
              { key: 'hoursWorked', header: 'Hours', align: 'center', render: (r) => r.hoursWorked ? `${r.hoursWorked}h` : '-' },
              { key: 'presenceStatus', header: 'Status', render: (r) => <StatusBadge status={r.presenceStatus === 'CHECKED_IN' ? 'active' : 'COMPLETED'} size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {r.presenceStatus === 'CHECKED_IN' && (
                      <Button size="dense" variant="secondary" onClick={() => handleCheckOutWorker(r.attendanceId)}>
                        Check Out
                      </Button>
                    )}
                    <Button
                      size="dense"
                      variant="ghost"
                      onClick={() => {
                        setSelectedRecordForCorrection(r);
                        setCorrectionForm({
                          correctedEntryTime: r.entryTime || '',
                          correctedExitTime: r.exitTime || '',
                          correctedPresenceStatus: r.presenceStatus,
                          correctionReason: '',
                        });
                        setIsCorrectionModalOpen(true);
                      }}
                    >
                      Correct
                    </Button>
                  </div>
                ),
              },
            ]}
            data={
              activeSubView === 'CURRENTLY_ON_SITE'
                ? attendanceRecords.filter((a) => a.presenceStatus === 'CHECKED_IN')
                : attendanceRecords
            }
          />
        </Card>
      )}

      {/* 10. Embedded Transport & ESG Traceability View */}
      {(activeSubView === 'CONTRACTOR_TRANSPORT' || activeSubView === 'ESG_TRACEABILITY' || activeSubView === 'REPORTS') && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Contractor Mobility & Scope 3 Category 7 Traceability
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Zero-Blocker Invariant: Group transport deduplication applied to prevent multiplying bus travel emissions
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ fontSize: '12px', padding: '4px 8px', backgroundColor: colors.esg[50], color: colors.esg[700], borderRadius: '4px', fontWeight: 600 }}>
                GHG Protocol Scope 3 Cat 7
              </span>
            </div>
          </div>

          <DataTable<AttendanceRecordItem>
            columns={[
              { key: 'badgeNumber', header: 'Badge #', width: '100px', render: (r) => <strong>{r.badgeNumber}</strong> },
              { key: 'workerName', header: 'Contractor Worker', render: (r) => r.workerName },
              { key: 'companyName', header: 'Organization', render: (r) => r.companyName },
              { key: 'transportMode', header: 'Mobility Mode', render: (r) => <strong>{r.transportMode}</strong> },
              { key: 'isSharedVehicle', header: 'Group Bus', align: 'center', render: (r) => r.isSharedVehicle ? <StatusBadge status="approved" size="micro" /> : <span style={{ fontSize: '11px', color: colors.slate[400] }}>Solo</span> },
              { key: 'occupancy', header: 'Occupancy', align: 'center', render: (r) => <strong>{r.occupancy}</strong> },
              { key: 'distanceKm', header: 'One-Way Distance', align: 'right', render: (r) => `${r.distanceKm} km` },
              { key: 'emissionsKgCO2e', header: 'Emissions', align: 'right', render: (r) => <strong style={{ color: colors.esg[700] }}>{r.emissionsKgCO2e} kg CO₂e</strong> },
              { key: 'provenance', header: 'Provenance', render: () => <span style={{ fontSize: '10px', backgroundColor: colors.slate[100], padding: '1px 5px', borderRadius: '3px' }}>GIS_ROUTED</span> },
            ]}
            data={attendanceRecords}
          />
        </Card>
      )}

      {/* 11. Pending Approvals View */}
      {activeSubView === 'PENDING_APPROVALS' && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Pending Contractor Approvals & Governance Actions
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Contracts, Work Orders, and High-Hazard permits requiring authorized manager sign-off
              </p>
            </div>
          </div>

          <DataTable
            columns={[
              { key: 'workOrderNumber', header: 'Reference', width: '140px', render: (r) => <strong>{r.workOrderNumber}</strong> },
              { key: 'title', header: 'Title / Subject', render: (r) => <strong>{r.title}</strong> },
              { key: 'companyName', header: 'Contractor', render: (r) => r.companyName },
              { key: 'workCategory', header: 'Category', render: (r) => <span style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: colors.slate[100], borderRadius: '4px' }}>{r.workCategory}</span> },
              { key: 'authorizedWorkerCount', header: 'Headcount', align: 'center', render: (r) => r.authorizedWorkerCount },
              { key: 'approvalState', header: 'Approval State', render: (r) => <StatusBadge status={r.approvalState === 'APPROVED' ? 'approved' : 'pending'} size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <Button size="dense" variant="primary" onClick={() => showToast(`Approved ${r.workOrderNumber}.`)}>
                      Approve
                    </Button>
                    <Button size="dense" variant="secondary" onClick={() => showToast(`Changes requested for ${r.workOrderNumber}.`, 'info')}>
                      Review
                    </Button>
                  </div>
                ),
              },
            ]}
            data={workOrders}
          />
        </Card>
      )}

      {/* 12. Contractor History View */}
      {activeSubView === 'CONTRACTOR_HISTORY' && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Historical Contractor Shift & Deployment Archives
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Immutable historical presence ledger across past projects, completed contracts, and shift rotations
              </p>
            </div>
          </div>

          <DataTable<AttendanceRecordItem>
            columns={[
              { key: 'attendanceId', header: 'Archive Ref', width: '120px', render: (r) => <strong>{r.attendanceId}</strong> },
              { key: 'badgeNumber', header: 'Badge #', width: '100px', render: (r) => r.badgeNumber },
              { key: 'workerName', header: 'Worker Name', render: (r) => <strong>{r.workerName}</strong> },
              { key: 'companyName', header: 'Contractor Organization', render: (r) => r.companyName },
              { key: 'workOrderNumber', header: 'Work Order', render: (r) => r.workOrderNumber },
              { key: 'shiftDate', header: 'Date', render: (r) => r.shiftDate },
              { key: 'hoursWorked', header: 'Hours', align: 'center', render: (r) => r.hoursWorked ? `${r.hoursWorked}h` : '8.0h' },
              { key: 'presenceStatus', header: 'Final Status', render: () => <StatusBadge status="COMPLETED" size="sm" /> },
            ]}
            data={attendanceRecords}
          />
        </Card>
      )}

      {/* 13. Contractor Exceptions & Breaches View */}
      {activeSubView === 'EXCEPTIONS' && (
        <Card style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: fs.lg, fontWeight: typography.fontWeight.bold }}>
                Contractor Exceptions, Lapses & Compliance Breaches
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: fs.xs, color: colors.slate[500] }}>
                Restricted workers, unverified credentials, overstay occurrences, and audited manual time adjustments
              </p>
            </div>
          </div>

          <DataTable
            columns={[
              { key: 'badgeNumber', header: 'Badge #', width: '100px', render: (r) => <strong>{r.badgeNumber}</strong> },
              { key: 'fullName', header: 'Worker Name', render: (r) => <strong>{r.fullName}</strong> },
              { key: 'companyName', header: 'Contractor', render: (r) => r.companyName },
              { key: 'tradeSkill', header: 'Specialization', render: (r) => r.tradeSkill },
              {
                key: 'issue',
                header: 'Flagged Exception Reason',
                render: (r) => (
                  <span style={{ color: colors.status.rejected.fg, fontWeight: 500 }}>
                    {!r.medicalFitnessValid ? 'Medical Fitness Expired' : 'Safety Induction Renewal Pending'}
                  </span>
                ),
              },
              { key: 'status', header: 'Gate Status', render: () => <StatusBadge status="rejected" size="sm" /> },
              {
                key: 'actions',
                header: 'Action',
                render: (r) => (
                  <Button size="dense" variant="secondary" onClick={() => setSelectedEntityDrawer({ entityType: 'WORKER', data: r })}>
                    Resolve Exception
                  </Button>
                ),
              },
            ]}
            data={workers.filter((w) => w.status === 'RESTRICTED' || !w.medicalFitnessValid)}
          />
        </Card>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 1: REGISTER COMPANY */}
      {/* ------------------------------------------------------------------- */}
      <Modal isOpen={isNewCompanyModalOpen} onClose={() => setIsNewCompanyModalOpen(false)} title="Register Contractor Organization">
        <form onSubmit={handleCreateCompany} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Contractor Legal / Trade Name</label>
            <Input
              value={newCompanyForm.tradeName}
              onChange={(e) => setNewCompanyForm({ ...newCompanyForm, tradeName: e.target.value })}
              placeholder="e.g. Acme Industrial Engineering Pvt Ltd"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Vendor Code (Optional)</label>
              <Input
                value={newCompanyForm.vendorCode}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, vendorCode: e.target.value })}
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Classification</label>
              <Select
                value={newCompanyForm.contractorClassification}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, contractorClassification: e.target.value })}
                options={[
                  { value: 'GENERAL_CONTRACTOR', label: 'General Contractor' },
                  { value: 'ELECTRICAL', label: 'Electrical & Automation' },
                  { value: 'MECHANICAL', label: 'Mechanical & Fabrication' },
                  { value: 'CIVIL', label: 'Civil & Construction' },
                  { value: 'LOGISTICS', label: 'Internal Logistics' },
                ]}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Primary Contact Person</label>
              <Input
                value={newCompanyForm.primaryContactName}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, primaryContactName: e.target.value })}
                placeholder="Manager Name"
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Primary Phone</label>
              <Input
                value={newCompanyForm.primaryContactPhone}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, primaryContactPhone: e.target.value })}
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Insurance Policy Number</label>
              <Input
                value={newCompanyForm.insurancePolicyNumber}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, insurancePolicyNumber: e.target.value })}
                placeholder="e.g. POL-2026-XXXX"
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Insurance Expiration Date</label>
              <Input
                type="date"
                value={newCompanyForm.insuranceExpiryDate}
                onChange={(e) => setNewCompanyForm({ ...newCompanyForm, insuranceExpiryDate: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsNewCompanyModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Company
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 2: NEW CONTRACT */}
      {/* ------------------------------------------------------------------- */}
      <Modal isOpen={isNewContractModalOpen} onClose={() => setIsNewContractModalOpen(false)} title="Create Commercial Contract">
        <form onSubmit={handleCreateContract} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Contractor Organization</label>
            <Select
              value={newContractForm.companyId}
              onChange={(e) => setNewContractForm({ ...newContractForm, companyId: e.target.value })}
              options={companies.map((c) => ({ value: c.companyId, label: `${c.tradeName} (${c.vendorCode})` }))}
            />
          </div>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Contract Title / Agreement Scope</label>
            <Input
              value={newContractForm.title}
              onChange={(e) => setNewContractForm({ ...newContractForm, title: e.target.value })}
              placeholder="e.g. Annual Plant Maintenance MSA 2026-27"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Start Date</label>
              <Input
                type="date"
                value={newContractForm.startDate}
                onChange={(e) => setNewContractForm({ ...newContractForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>End Date</label>
              <Input
                type="date"
                value={newContractForm.endDate}
                onChange={(e) => setNewContractForm({ ...newContractForm, endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Scope of Work Summary</label>
            <Input
              value={newContractForm.scopeOfWork}
              onChange={(e) => setNewContractForm({ ...newContractForm, scopeOfWork: e.target.value })}
              placeholder="Describe authorized work categories..."
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsNewContractModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Issue Contract
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 3: CREATE WORK ORDER */}
      {/* ------------------------------------------------------------------- */}
      <Modal isOpen={isNewWorkOrderModalOpen} onClose={() => setIsNewWorkOrderModalOpen(false)} title="Authorize Work Order">
        <form onSubmit={handleCreateWorkOrder} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Contractor Organization</label>
            <Select
              value={newWorkOrderForm.companyId}
              onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, companyId: e.target.value })}
              options={companies.map((c) => ({ value: c.companyId, label: c.tradeName }))}
            />
          </div>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Work Order Title</label>
            <Input
              value={newWorkOrderForm.title}
              onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, title: e.target.value })}
              placeholder="e.g. Substation HT Transformer Bushing Replacement"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Work Location</label>
              <Input
                value={newWorkOrderForm.workLocation}
                onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, workLocation: e.target.value })}
                placeholder="e.g. High Voltage Yard"
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Authorized Headcount Cap</label>
              <Input
                type="number"
                value={String(newWorkOrderForm.authorizedWorkerCount)}
                onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, authorizedWorkerCount: Number(e.target.value) })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <input
              type="checkbox"
              id="safetyPermitReq"
              checked={newWorkOrderForm.safetyPermitRequired}
              onChange={(e) => setNewWorkOrderForm({ ...newWorkOrderForm, safetyPermitRequired: e.target.checked })}
            />
            <label htmlFor="safetyPermitReq" style={{ fontSize: fs.sm, cursor: 'pointer' }}>
              Safety Permit to Work (PTW) is mandatory before physical entry
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsNewWorkOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Authorize Work Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 4: REGISTER WORKER */}
      {/* ------------------------------------------------------------------- */}
      <Modal isOpen={isRegisterWorkerModalOpen} onClose={() => setIsRegisterWorkerModalOpen(false)} title="Register Contractor Worker">
        <form onSubmit={handleRegisterWorker} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Employer Contractor Company</label>
            <Select
              value={newWorkerForm.companyId}
              onChange={(e) => setNewWorkerForm({ ...newWorkerForm, companyId: e.target.value })}
              options={companies.map((c) => ({ value: c.companyId, label: c.tradeName }))}
            />
          </div>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Worker Full Name</label>
            <Input
              value={newWorkerForm.fullName}
              onChange={(e) => setNewWorkerForm({ ...newWorkerForm, fullName: e.target.value })}
              placeholder="e.g. Ramesh K. Yadav"
              required
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Trade Skill</label>
              <Input
                value={newWorkerForm.tradeSkill}
                onChange={(e) => setNewWorkerForm({ ...newWorkerForm, tradeSkill: e.target.value })}
                placeholder="e.g. Certified Crane Rigger"
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Category</label>
              <Select
                value={newWorkerForm.workerCategory}
                onChange={(e) => setNewWorkerForm({ ...newWorkerForm, workerCategory: e.target.value })}
                options={[
                  { value: 'SKILLED', label: 'Skilled' },
                  { value: 'SEMI_SKILLED', label: 'Semi-Skilled' },
                  { value: 'UNSKILLED', label: 'Unskilled' },
                  { value: 'SUPERVISOR', label: 'Site Supervisor' },
                  { value: 'ENGINEER', label: 'Site Engineer' },
                ]}
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="medicalFit"
              checked={newWorkerForm.medicalFitnessValid}
              onChange={(e) => setNewWorkerForm({ ...newWorkerForm, medicalFitnessValid: e.target.checked })}
            />
            <label htmlFor="medicalFit" style={{ fontSize: fs.sm, cursor: 'pointer' }}>
              Worker has valid Medical Fitness Certificate on file
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsRegisterWorkerModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Register Worker
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 5: GATE CHECK-IN WITH MOBILITY */}
      {/* ------------------------------------------------------------------- */}
      <Modal isOpen={isCheckInModalOpen} onClose={() => setIsCheckInModalOpen(false)} title="Turnstile Gate Check-In & Mobility Capture">
        <form onSubmit={handleCheckInWorker} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Contractor Worker</label>
            <Select
              value={checkInForm.workerId}
              onChange={(e) => setCheckInForm({ ...checkInForm, workerId: e.target.value })}
              options={workers.map((w) => ({ value: w.contractorWorkerId, label: `${w.fullName} (${w.badgeNumber} - ${w.companyName})` }))}
            />
          </div>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Assigned Work Order</label>
            <Select
              value={checkInForm.workOrderId}
              onChange={(e) => setCheckInForm({ ...checkInForm, workOrderId: e.target.value })}
              options={workOrders.map((wo) => ({ value: wo.workOrderId, label: `${wo.workOrderNumber}: ${wo.title}` }))}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Entry Turnstile / Gate</label>
              <Select
                value={checkInForm.gateName}
                onChange={(e) => setCheckInForm({ ...checkInForm, gateName: e.target.value })}
                options={[
                  { value: 'Gate 2 - Turnstile A', label: 'Gate 2 - Turnstile A (Industrial)' },
                  { value: 'Gate 2 - Turnstile B', label: 'Gate 2 - Turnstile B (Industrial)' },
                  { value: 'Gate 3 - Heavy Civil Access', label: 'Gate 3 - Heavy Civil Access' },
                ]}
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Commute Mode</label>
              <Select
                value={checkInForm.transportMode}
                onChange={(e) => setCheckInForm({ ...checkInForm, transportMode: e.target.value })}
                options={[
                  { value: 'BUS', label: 'Contractor Shuttle Bus' },
                  { value: 'TWO_WHEELER', label: 'Two Wheeler (Motorcycle/EV)' },
                  { value: 'CAR', label: 'Carpool / Shared Van' },
                  { value: 'WALKING', label: 'Walking (Local Dormitory)' },
                ]}
              />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Distance (km)</label>
              <Input
                type="number"
                value={String(checkInForm.distanceKm)}
                onChange={(e) => setCheckInForm({ ...checkInForm, distanceKm: Number(e.target.value) })}
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Group Transport Deduplication</label>
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  id="sharedVeh"
                  checked={checkInForm.isSharedVehicle}
                  onChange={(e) => setCheckInForm({ ...checkInForm, isSharedVehicle: e.target.checked })}
                />
                <label htmlFor="sharedVeh" style={{ fontSize: fs.xs }}>
                  Shared Bus (Deduplicate movement)
                </label>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsCheckInModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Verify & Authorize Entry
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* MODAL 6: MANUAL ATTENDANCE CORRECTION */}
      {/* ------------------------------------------------------------------- */}
      <Modal isOpen={isCorrectionModalOpen} onClose={() => setIsCorrectionModalOpen(false)} title="Correct Attendance Event">
        <form onSubmit={handleApplyCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {selectedRecordForCorrection && (
            <Banner
              title={`Audited Event: ${selectedRecordForCorrection.workerName} (${selectedRecordForCorrection.badgeNumber})`}
              message="Manual corrections create an immutable audit trail entry recording previous timestamps, operator user ID, and justification."
              type="system"
            />
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Corrected Entry Time</label>
              <Input
                value={correctionForm.correctedEntryTime}
                onChange={(e) => setCorrectionForm({ ...correctionForm, correctedEntryTime: e.target.value })}
              />
            </div>
            <div>
              <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Corrected Exit Time</label>
              <Input
                value={correctionForm.correctedExitTime}
                onChange={(e) => setCorrectionForm({ ...correctionForm, correctedExitTime: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Presence Status</label>
            <Select
              value={correctionForm.correctedPresenceStatus}
              onChange={(e) => setCorrectionForm({ ...correctionForm, correctedPresenceStatus: e.target.value as ContractorPresenceStatus })}
              options={[
                { value: 'CHECKED_IN', label: 'Checked In' },
                { value: 'CHECKED_OUT', label: 'Checked Out' },
                { value: 'OVERSTAY', label: 'Overstay / Flagged' },
              ]}
            />
          </div>
          <div>
            <label style={{ fontSize: fs.xs, fontWeight: typography.fontWeight.medium }}>Mandatory Correction Reason</label>
            <Input
              value={correctionForm.correctionReason}
              onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })}
              placeholder="e.g. Worker failed to badge out due to power disruption at Gate 2"
              required
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
            <Button variant="secondary" onClick={() => setIsCorrectionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Save Audited Correction
            </Button>
          </div>
        </form>
      </Modal>

      {/* ------------------------------------------------------------------- */}
      {/* DRAWER: ENTITY DETAIL INSPECTION */}
      {/* ------------------------------------------------------------------- */}
      <Drawer
        isOpen={Boolean(selectedEntityDrawer)}
        onClose={() => setSelectedEntityDrawer(null)}
        title={
          selectedEntityDrawer?.entityType === 'COMPANY'
            ? 'Contractor Organization Profile'
            : selectedEntityDrawer?.entityType === 'WORK_ORDER'
            ? 'Work Order Specification'
            : selectedEntityDrawer?.entityType === 'CONTRACT'
            ? 'Commercial Contract Terms'
            : 'Contractor Worker Profile'
        }
      >
        {selectedEntityDrawer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0' }}>
            <Banner
              title="Canonical Domain Record"
              message={`Contractor records are isolated per tenant and shown for site ${siteId}.`}
              type="system"
            />
            <pre
              style={{
                backgroundColor: colors.slate[900],
                color: colors.slate[100],
                padding: '14px',
                borderRadius: radius.md,
                fontSize: fs.xs,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(selectedEntityDrawer.data, null, 2)}
            </pre>
          </div>
        )}
      </Drawer>
    </div>
  );
};
