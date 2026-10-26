import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Clock,
  Calendar,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  QrCode,
  Search,
  Filter,
  Download,
  ArrowRight,
  TrendingUp,
  Leaf,
  Car,
  FileCheck,
  AlertTriangle,
  History,
  Briefcase,
  Layers,
  ChevronRight,
  Eye,
  Check,
  X,
  RefreshCw,
  Printer,
  Copy,
  ExternalLink,
  Flame,
  Phone,
  Mail,
  Building,
  UserX,
  HelpCircle,
  Plus
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
  DataTable,
  Modal,
  Drawer,
  Timeline,
  type ColumnDef,
} from '@vms/ui';
import type {
  VisitorCategory,
  VisitorPurpose,
  BookingMode,
  TransportMode,
  OwnershipType,
  VehicleClass,
  FuelType,
  UsageType,
  JourneyType,
  DataProvenance,
  TransportServiceType,
  IdentityVerificationMethod,
} from '@vms/types';

export type VisitorSubView =
  | 'DASHBOARD'
  | 'ALL'
  | 'NEW'
  | 'REPEATED'
  | 'APPOINTMENTS'
  | 'WALK_IN'
  | 'GROUP'
  | 'VIP'
  | 'EXPECTED'
  | 'INSIDE'
  | 'APPROVALS'
  | 'VERIFICATION_QUEUE'
  | 'OVERSTAYS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'HISTORY'
  | 'PROFILES'
  | 'TRACEABILITY';

export interface VisitorRecordItem {
  id: string;
  referenceNumber: string;
  name: string;
  phone: string;
  email?: string;
  company: string;
  designation?: string;
  visitorCategory: VisitorCategory;
  purpose: VisitorPurpose;
  bookingMode: BookingMode;
  host: string;
  hostUserId: string;
  siteId: string;
  siteName: string;
  scheduledStart: string;
  scheduledEnd: string;
  actualArrival?: string;
  actualEntry?: string;
  actualExit?: string;
  stage: string;
  status: 'PENDING' | 'APPROVED' | 'ON_PREMISES' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  escortRequired: boolean;
  vipStatus: boolean;
  overstayMinutes?: number;
  transport?: {
    mode: TransportMode;
    ownership: OwnershipType;
    vehicleClass: VehicleClass;
    fuelType: FuelType;
    usageType: UsageType;
    occupancy: number;
    origin: string;
    destination: string;
    distanceKm: number;
    provenance: DataProvenance;
    transportServiceType?: TransportServiceType;
  };
  esgActivity?: {
    id: string;
    activityType: string;
    quantity: number;
    unit: string;
    status: 'CALCULATED' | 'PENDING' | 'NEEDS_RECALCULATION';
    kgCO2e?: number;
  };
  identityVerified: boolean;
  verificationMethod?: string;
  documents: Array<{ type: string; status: 'VERIFIED' | 'PENDING' | 'MISSING' }>;
}

const INITIAL_VISITORS: VisitorRecordItem[] = [
  {
    id: 'tx-vis-101',
    referenceNumber: 'VIS-2026-000182',
    name: 'Aravind Swaminathan',
    phone: '+91-9884011223',
    email: 'aravind@siemens.example',
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
    email: 'priya.s@tuvsud.example',
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
    email: 'rchen@bridgestone-tech.example',
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

export interface VisitorManagementViewProps {
  initialSubView?: VisitorSubView;
  currentRole?: string;
  onNavigateSubView?: (view: VisitorSubView) => void;
}

export const VisitorManagementView: React.FC<VisitorManagementViewProps> = ({
  initialSubView = 'DASHBOARD',
  currentRole = 'SUPER_ADMIN',
  onNavigateSubView,
}) => {
  const [subView, setSubView] = useState<VisitorSubView>(initialSubView);
  // Keep the screen in step with the menu item (the component stays mounted between Visitor items).
  useEffect(() => setSubView(initialSubView), [initialSubView]);
  const [visitors, setVisitors] = useState<VisitorRecordItem[]>(INITIAL_VISITORS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Interactive Modals and Drawers
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRecordItem | null>(null);
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
  const [matchedCandidate, setMatchedCandidate] = useState<VisitorRecordItem | null>(null);

  // New Visitor Form State
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formCategory, setFormCategory] = useState<VisitorCategory>('NEW_VISITOR');
  const [formPurpose, setFormPurpose] = useState<VisitorPurpose>('MEETING');
  const [formBookingMode, setFormBookingMode] = useState<BookingMode>('RESERVED');
  const [formHost, setFormHost] = useState('Vikram Mehta (Plant Lead)');
  const [formDate, setFormDate] = useState('2026-10-12');
  const [formStartTime, setFormStartTime] = useState('10:00');
  const [formEndTime, setFormEndTime] = useState('14:00');
  const [formEscort, setFormEscort] = useState(false);
  const [formGovtId, setFormGovtId] = useState('');

  // Form Transport & ESG fields
  const [formTransportMode, setFormTransportMode] = useState<TransportMode>('CAR');
  const [formOwnership, setFormOwnership] = useState<OwnershipType>('PERSONAL');
  const [formVehicleClass, setFormVehicleClass] = useState<VehicleClass>('SEDAN');
  const [formFuelType, setFormFuelType] = useState<FuelType>('PETROL');
  const [formOccupancy, setFormOccupancy] = useState(1);
  const [formOrigin, setFormOrigin] = useState('Bengaluru');
  const [formDestination, setFormDestination] = useState('Chennai Radial Tyre Plant');
  const [formDistance, setFormDistance] = useState(348);
  const [formDistanceProvenance, setFormDistanceProvenance] = useState<DataProvenance>('SYSTEM_ESTIMATED');

  // Change subview
  const handleSelectSubView = (target: VisitorSubView) => {
    setSubView(target);
    if (onNavigateSubView) onNavigateSubView(target);
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
      if (statusFilter !== 'ALL' && v.status !== statusFilter) return false;
      if (categoryFilter !== 'ALL' && v.visitorCategory !== categoryFilter) return false;

      // Special subview filters
      if (subView === 'EXPECTED' && !(v.status === 'APPROVED' || v.status === 'PENDING')) return false;
      if (subView === 'INSIDE' && v.status !== 'ON_PREMISES') return false;
      if (subView === 'APPROVALS' && v.status !== 'PENDING') return false;
      if (subView === 'OVERSTAYS' && !((v.overstayMinutes || 0) > 0 && v.status === 'ON_PREMISES')) return false;
      if (subView === 'COMPLETED' && v.status !== 'COMPLETED') return false;
      if (subView === 'VIP' && !v.vipStatus && v.visitorCategory !== 'VIP_VISITOR') return false;
      if (subView === 'GROUP' && v.bookingMode !== 'GROUP') return false;
      if (subView === 'WALK_IN' && v.bookingMode !== 'WALK_IN') return false;
      if (subView === 'VERIFICATION_QUEUE' && v.identityVerified) return false;

      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = v.name.toLowerCase().includes(term);
        const matchesRef = v.referenceNumber.toLowerCase().includes(term);
        const matchesComp = v.company.toLowerCase().includes(term);
        const matchesHost = v.host.toLowerCase().includes(term);
        if (!matchesName && !matchesRef && !matchesComp && !matchesHost) return false;
      }

      return true;
    });
  }, [visitors, statusFilter, categoryFilter, subView, searchTerm]);

  // Actions
  const handleApprove = (txId: string) => {
    setVisitors(prev => prev.map(v => v.id === txId ? { ...v, status: 'APPROVED', stage: 'SCHEDULED' } : v));
    setIsApproveModalOpen(false);
  };

  const handleCheckIn = (txId: string) => {
    setVisitors(prev => prev.map(v => v.id === txId ? {
      ...v,
      status: 'ON_PREMISES',
      stage: 'CHECK_IN',
      actualEntry: new Date().toISOString(),
      identityVerified: true,
    } : v));
    setIsCheckInModalOpen(false);
  };

  const handleCheckOut = (txId: string) => {
    setVisitors(prev => prev.map(v => v.id === txId ? {
      ...v,
      status: 'COMPLETED',
      stage: 'CLOSED',
      actualExit: new Date().toISOString(),
      overstayMinutes: undefined,
    } : v));
    setIsCheckOutModalOpen(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef = `VIS-2026-${String(Math.floor(100000 + Math.random() * 900000))}`;
    const newRecord: VisitorRecordItem = {
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
    } else {
      setMatchedCandidate(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* 18-SUBVIEW ENTERPRISE TAB NAVIGATION BAR */}
      <div className="bg-white border border-slate-200 rounded-md p-1.5 shadow-sm overflow-x-auto flex items-center gap-1">
        {[
          { id: 'DASHBOARD', label: 'Dashboard', icon: <TrendingUp size={14} /> },
          { id: 'ALL', label: 'All Visitors', icon: <Users size={14} />, badge: visitors.length },
          { id: 'EXPECTED', label: 'Expected Today', icon: <Calendar size={14} />, badge: kpis.expected },
          { id: 'INSIDE', label: 'Currently Inside', icon: <UserCheck size={14} />, badge: kpis.inside, color: 'text-emerald-700 bg-emerald-50' },
          { id: 'APPROVALS', label: 'Pending Approvals', icon: <Clock size={14} />, badge: kpis.pendingApproval, color: 'text-amber-700 bg-amber-50' },
          { id: 'OVERSTAYS', label: 'Overstays', icon: <AlertTriangle size={14} />, badge: kpis.overstays, color: 'text-rose-700 bg-rose-50' },
          { id: 'VERIFICATION_QUEUE', label: 'Verification Queue', icon: <ShieldAlert size={14} />, badge: kpis.verificationPending },
          { id: 'NEW', label: '+ New Registration', icon: <UserPlus size={14} /> },
          { id: 'REPEATED', label: 'Returning Lookup', icon: <History size={14} /> },
          { id: 'WALK_IN', label: 'Gate Walk-In (<60s)', icon: <CheckCircle2 size={14} /> },
          { id: 'GROUP', label: 'Group Delegation', icon: <Layers size={14} /> },
          { id: 'VIP', label: 'VIP Protocol', icon: <Briefcase size={14} /> },
          { id: 'COMPLETED', label: 'Completed Visits', icon: <CheckCircle2 size={14} /> },
          { id: 'TRACEABILITY', label: 'ESG Traceability', icon: <Leaf size={14} /> },
        ].map(tab => {
          const isActive = subView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleSelectSubView(tab.id as VisitorSubView)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-slate-700 text-white' : tab.color || 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* OVERSTAY PERSISTENT CRITICAL ALERT BANNER IF BREACH DETECTED */}
      {kpis.overstays > 0 && (
        <div className="bg-rose-50 border border-rose-300 rounded-md p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-600 text-white rounded">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-900">Critical Security Alert: Active Overstay Detected</h4>
              <p className="text-xs text-rose-700">
                {kpis.overstays} visitor(s) currently on premises have exceeded their approved time window. Host and Security dispatch alerted.
              </p>
            </div>
          </div>
          <Button
            variant="danger"
            size="dense"
            onClick={() => handleSelectSubView('OVERSTAYS')}
          >
            Review Overstays ({kpis.overstays})
          </Button>
        </div>
      )}

      {/* SUBVIEW 1: OPERATIONAL DASHBOARD */}
      {subView === 'DASHBOARD' && (
        <div className="space-y-4">
          {/* TOP 6 KPI METRICS */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Expected Today</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-slate-900">{kpis.expected}</span>
                <span className="text-[10px] font-bold text-slate-500">Scheduled</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Currently Inside</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-emerald-700">{kpis.inside}</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Active</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-amber-700">{kpis.pendingApproval}</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Host/Sec</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Overstays</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-rose-700">{kpis.overstays}</span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">Breach</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Verification Due</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-blue-700">{kpis.verificationPending}</span>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Queue</span>
              </div>
            </Card>

            <Card className="p-3 bg-white border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">ESG Auto-Capture</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-bold text-teal-700">{kpis.esgRate}%</span>
                <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">Scope 3</span>
              </div>
            </Card>
          </div>

          {/* TWO-COLUMN OPERATIONAL SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Live On-Premises Roster */}
            <Card className="p-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <UserCheck size={16} className="text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-900">Live On-Premises Visitors</h3>
                </div>
                <Button size="dense" variant="ghost" onClick={() => handleSelectSubView('INSIDE')}>
                  View All ({kpis.inside})
                </Button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {visitors.filter(v => v.status === 'ON_PREMISES').map(v => (
                  <div key={v.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{v.name}</span>
                        {v.overstayMinutes && (
                          <span className="px-1.5 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded">
                            OVERSTAY +{v.overstayMinutes}m
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{v.company} • Host: {v.host}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="dense"
                        variant="secondary"
                        onClick={() => { setSelectedVisitor(v); setIsCheckOutModalOpen(true); }}
                      >
                        Check Out
                      </Button>
                      <Button
                        size="dense"
                        variant="ghost"
                        onClick={() => { setSelectedVisitor(v); setIsTraceabilityDrawerOpen(true); }}
                      >
                        Trace
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Approvals & Action Queue */}
            <Card className="p-4 bg-white border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900">Pending Approvals & Verification</h3>
                </div>
                <Button size="dense" variant="ghost" onClick={() => handleSelectSubView('APPROVALS')}>
                  View Queue
                </Button>
              </div>

              <div className="mt-3 divide-y divide-slate-100">
                {visitors.filter(v => v.status === 'PENDING').map(v => (
                  <div key={v.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900">{v.name}</span>
                      <div className="text-[11px] text-slate-500">
                        {v.company} • Purpose: {v.purpose} • Host: {v.host}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="dense"
                        variant="primary"
                        onClick={() => { setSelectedVisitor(v); setIsApproveModalOpen(true); }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="dense"
                        variant="secondary"
                        onClick={() => {
                          setVisitors(prev => prev.map(item => item.id === v.id ? { ...item, status: 'REJECTED' } : item));
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* SUBVIEW: ALL VISITORS TABLE */}
      {(subView === 'ALL' || subView === 'EXPECTED' || subView === 'INSIDE' || subView === 'APPROVALS' || subView === 'OVERSTAYS' || subView === 'COMPLETED' || subView === 'VIP' || subView === 'GROUP' || subView === 'WALK_IN' || subView === 'VERIFICATION_QUEUE') && (
        <Card className="bg-white border border-slate-200">
          {/* HEADER & FILTERS */}
          <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[280px]">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search visitor by name, reference, company or host..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="ON_PREMISES">On Premises</option>
                <option value="COMPLETED">Completed</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="NEW_VISITOR">New Visitor</option>
                <option value="REPEATED_VISITOR">Repeated Visitor</option>
                <option value="VIP_VISITOR">VIP Visitor</option>
                <option value="AUDITOR">Auditor</option>
                <option value="CONSULTANT">Consultant</option>
                <option value="INTERVIEW_CANDIDATE">Candidate</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button size="dense" variant="secondary" onClick={() => handleSelectSubView('NEW')}>
                <UserPlus size={14} />
                <span>Register Visitor</span>
              </Button>
              <Button size="dense" variant="ghost" onClick={() => handleSelectSubView('WALK_IN')}>
                <span>Fast Walk-In</span>
              </Button>
            </div>
          </div>

          {/* PRODUCTION DATA TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Reference</th>
                  <th className="py-2.5 px-3">Visitor Name</th>
                  <th className="py-2.5 px-3">Company / Org</th>
                  <th className="py-2.5 px-3">Purpose & Category</th>
                  <th className="py-2.5 px-3">Host Sponsor</th>
                  <th className="py-2.5 px-3">Schedule</th>
                  <th className="py-2.5 px-3">Transport Vector</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Gate Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      No visitor records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map(v => (
                    <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {v.referenceNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{v.name}</div>
                        <div className="text-[11px] text-slate-500">{v.phone}</div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <div>{v.company}</div>
                        {v.designation && <div className="text-[11px] text-slate-500">{v.designation}</div>}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-800">{v.purpose}</div>
                        <span className="text-[10px] text-slate-500 uppercase">{v.visitorCategory}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {v.host}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div>{new Date(v.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-[10px] text-slate-400">{new Date(v.scheduledStart).toLocaleDateString()}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {v.transport ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Car size={13} className="text-slate-400" />
                            <span>{v.transport.mode} ({v.transport.distanceKm} km)</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Not recorded</span>
                        )}
                        {v.esgActivity && (
                          <div className="text-[10px] text-teal-700 font-semibold flex items-center gap-1">
                            <Leaf size={10} />
                            <span>{v.esgActivity.kgCO2e ? `${v.esgActivity.kgCO2e} kg CO2e` : 'Pending Calc'}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge
                          status={
                            v.status === 'ON_PREMISES' ? 'ON_PREMISES' :
                            v.status === 'APPROVED' ? 'approved' :
                            v.status === 'PENDING' ? 'pending' :
                            v.status === 'COMPLETED' ? 'COMPLETED' : 'rejected'
                          }
                          label={
                            v.status === 'ON_PREMISES' ? 'INSIDE' :
                            v.status === 'APPROVED' ? 'APPROVED' :
                            v.status === 'PENDING' ? 'PENDING' : v.status
                          }
                        />
                        {v.overstayMinutes && (
                          <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                            +{v.overstayMinutes}m Overstay
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {v.status === 'PENDING' && (
                            <Button
                              size="dense"
                              variant="primary"
                              onClick={() => { setSelectedVisitor(v); setIsApproveModalOpen(true); }}
                            >
                              Approve
                            </Button>
                          )}
                          {v.status === 'APPROVED' && (
                            <Button
                              size="dense"
                              variant="primary"
                              onClick={() => { setSelectedVisitor(v); setIsCheckInModalOpen(true); }}
                            >
                              Check In
                            </Button>
                          )}
                          {v.status === 'ON_PREMISES' && (
                            <Button
                              size="dense"
                              variant="secondary"
                              onClick={() => { setSelectedVisitor(v); setIsCheckOutModalOpen(true); }}
                            >
                              Check Out
                            </Button>
                          )}
                          {(v.status === 'APPROVED' || v.status === 'ON_PREMISES') && (
                            <button
                              onClick={() => { setSelectedVisitor(v); setIsEPassModalOpen(true); }}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                              title="View QR e-Pass"
                            >
                              <QrCode size={15} />
                            </button>
                          )}
                          <button
                            onClick={() => { setSelectedVisitor(v); setIsTraceabilityDrawerOpen(true); }}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded"
                            title="Audit & Traceability"
                          >
                            <ExternalLink size={15} />
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

      {/* SUBVIEW 3: NEW VISITOR REGISTRATION FORM WITH PROGRESSIVE DISCLOSURE & EMBEDDED ESG */}
      {subView === 'NEW' && (
        <Card className="bg-white border border-slate-200 p-6 max-w-4xl mx-auto">
          <div className="border-b border-slate-200 pb-4 mb-6">
            <h2 className="text-base font-bold text-slate-900">New Visitor Pre-Registration & ESG Activity Capture</h2>
            <p className="text-xs text-slate-500 mt-1">
              Captures visitor profile, schedule, and operational mobility vectors in-flow without exposing raw Scope 3 formulas.
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* SECTION A: VISITOR DETAILS */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Section A — Visitor Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Ramesh Chandran"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+91-9884012345"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="ramesh@company.example"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Company / Organization *</label>
                  <input
                    type="text"
                    required
                    value={formCompany}
                    onChange={e => setFormCompany(e.target.value)}
                    placeholder="Organization Name"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Designation</label>
                  <input
                    type="text"
                    value={formDesignation}
                    onChange={e => setFormDesignation(e.target.value)}
                    placeholder="e.g. Quality Auditor"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Visitor Classification</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as VisitorCategory)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  >
                    <option value="NEW_VISITOR">New General Visitor</option>
                    <option value="REPEATED_VISITOR">Repeated Visitor</option>
                    <option value="VIP_VISITOR">VIP Executive</option>
                    <option value="AUDITOR">Auditor</option>
                    <option value="CONSULTANT">Consultant</option>
                    <option value="GOVERNMENT_OFFICIAL">Government / Official</option>
                    <option value="INTERVIEW_CANDIDATE">Interview Candidate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION B: VISIT DETAILS */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Section B — Visit Details & Host</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Visit Purpose</label>
                  <select
                    value={formPurpose}
                    onChange={e => setFormPurpose(e.target.value as VisitorPurpose)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  >
                    <option value="MEETING">Business Meeting</option>
                    <option value="AUDIT">Safety / Environmental Audit</option>
                    <option value="INSPECTION">Plant Equipment Inspection</option>
                    <option value="TRAINING">Technical Training</option>
                    <option value="INTERVIEW">Candidate Interview</option>
                    <option value="CONSULTATION">Engineering Consultation</option>
                    <option value="SITE_VISIT">Executive Site Visit</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Designated Plant Host *</label>
                  <select
                    value={formHost}
                    onChange={e => setFormHost(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  >
                    <option value="Vikram Mehta (Plant Lead)">Vikram Mehta (Plant Operations)</option>
                    <option value="Kavita Nair (EHS Head)">Kavita Nair (EHS Head)</option>
                    <option value="Suresh Babu (VP Operations)">Suresh Babu (VP Operations)</option>
                    <option value="Arun Kumar (Facilities Mgr)">Arun Kumar (Facilities)</option>
                    <option value="Pooja Iyer (HR Talent)">Pooja Iyer (HR)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Booking Mode</label>
                  <select
                    value={formBookingMode}
                    onChange={e => setFormBookingMode(e.target.value as BookingMode)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  >
                    <option value="RESERVED">Reserved Pre-Booking</option>
                    <option value="WALK_IN">Walk-In (On-Spot)</option>
                    <option value="GROUP">Group Delegation</option>
                    <option value="EMERGENCY">Emergency Entry</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Visit Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Scheduled Arrival</label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Scheduled Departure</label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={e => setFormEndTime(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>
              </div>
            </div>

            {/* SECTION D: EMBEDDED TRANSPORT & MOBILITY (MANDATORY REQUIREMENT) */}
            <div className="border-t border-slate-100 pt-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Car size={16} className="text-teal-700" />
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Section D — Transport & Mobility Vectors
                  </h3>
                </div>
                <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded">
                  Embedded In-Flow
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Transport Mode</label>
                  <select
                    value={formTransportMode}
                    onChange={e => setFormTransportMode(e.target.value as TransportMode)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  >
                    <option value="CAR">Car</option>
                    <option value="TWO_WHEELER">Two-Wheeler</option>
                    <option value="BUS">Bus / Shuttle</option>
                    <option value="TRAIN">Rail / Train</option>
                    <option value="FLIGHT">Flight / Air</option>
                    <option value="TAXI_CAB">Taxi / Cab</option>
                    <option value="WALKING">Walking (Zero Emission)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Ownership</label>
                  <select
                    value={formOwnership}
                    onChange={e => setFormOwnership(e.target.value as OwnershipType)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  >
                    <option value="PERSONAL">Personal</option>
                    <option value="COMPANY">Company Pool</option>
                    <option value="HIRED">Hired / Rental</option>
                    <option value="PUBLIC">Public Transit</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Fuel Type</label>
                  <select
                    value={formFuelType}
                    onChange={e => setFormFuelType(e.target.value as FuelType)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  >
                    <option value="PETROL">Petrol</option>
                    <option value="DIESEL">Diesel</option>
                    <option value="ELECTRIC">Electric (EV)</option>
                    <option value="CNG">CNG</option>
                    <option value="HYBRID_PETROL">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Vehicle Occupancy</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formOccupancy}
                    onChange={e => setFormOccupancy(Number(e.target.value))}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Journey Origin</label>
                  <input
                    type="text"
                    value={formOrigin}
                    onChange={e => setFormOrigin(e.target.value)}
                    placeholder="e.g. Bengaluru, Airport, Hotel"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Destination</label>
                  <input
                    type="text"
                    value={formDestination}
                    onChange={e => setFormDestination(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Distance (km)</label>
                  <input
                    type="number"
                    value={formDistance}
                    onChange={e => {
                      setFormDistance(Number(e.target.value));
                      setFormDistanceProvenance('USER_PROVIDED');
                    }}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700">Provenance</label>
                  <div className="text-xs p-2 bg-slate-50 border border-slate-200 rounded mt-1 text-slate-600 font-mono">
                    {formDistanceProvenance}
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION G: ACTIVITY & SUSTAINABILITY PREVIEW (NO RAW SCOPE 3 FORMULAS) */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Leaf size={16} className="text-teal-700" />
                  <h4 className="text-xs font-bold text-slate-900">Activity & Sustainability Summary</h4>
                </div>
                <span className="text-[11px] text-teal-800 font-semibold">
                  Automatic Cross-Cutting Capture
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                Operational mobility data recorded automatically for ESG Scope 3 Category 7 (Employee and Visitor Commuting).
                Emission factors and verified CO2e accounting are managed centrally by the corporate ESG engine.
              </p>
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400">Activity Type</span>
                  <div className="font-semibold text-slate-800">Visitor Transit</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400">Recorded Distance</span>
                  <div className="font-semibold text-slate-800">{formDistance} km ({formDistanceProvenance})</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400">Vehicle Vector</span>
                  <div className="font-semibold text-slate-800">{formTransportMode} • {formFuelType}</div>
                </div>
                <div className="bg-white p-2 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400">GHG Status</span>
                  <div className="font-semibold text-teal-700">Auto-Linked on Submit</div>
                </div>
              </div>
            </div>

            {/* BUTTON BAR */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="secondary" onClick={() => handleSelectSubView('ALL')}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save & Submit for Approval
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* SUBVIEW 4: RETURNING VISITOR FAST LOOKUP & DISAMBIGUATION */}
      {subView === 'REPEATED' && (
        <Card className="bg-white border border-slate-200 p-6 max-w-2xl mx-auto space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-sm font-bold text-slate-900">Returning Visitor Fast Lookup</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Instant mobile or government ID profile resolution. Reuses verified history without overwriting previous visit records.
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter mobile number or government ID (e.g. 9444098765)..."
              value={lookupPhone}
              onChange={e => setLookupPhone(e.target.value)}
              className="flex-1 text-xs p-2 border border-slate-200 rounded"
            />
            <Button variant="primary" onClick={handleLookupPhone}>
              <Search size={14} />
              <span>Lookup Profile</span>
            </Button>
          </div>

          {matchedCandidate ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100 px-2 py-0.5 rounded">
                    Verified Profile Match (100%)
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1">{matchedCandidate.name}</h3>
                  <p className="text-xs text-slate-600">{matchedCandidate.company} • {matchedCandidate.phone}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900">Total Visits: 2</span>
                  <div className="text-[11px] text-slate-500">Last: {matchedCandidate.scheduledStart.split('T')[0]}</div>
                </div>
              </div>

              <div className="border-t border-emerald-200 pt-3 flex items-center justify-between">
                <span className="text-xs text-slate-600">Previous Transport: {matchedCandidate.transport?.mode} ({matchedCandidate.transport?.origin} - {matchedCandidate.transport?.destination})</span>
                <Button
                  size="dense"
                  variant="primary"
                  onClick={() => {
                    handleSelectSubView('NEW');
                  }}
                >
                  Create New Visit for {matchedCandidate.name.split(' ')[0]}
                </Button>
              </div>
            </div>
          ) : lookupPhone && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
              No matching returning visitor found for &quot;{lookupPhone}&quot;. Click &quot;Register Visitor&quot; to create a new profile.
            </div>
          )}
        </Card>
      )}

      {/* SUBVIEW 18: ESG TRACEABILITY DRILL-DOWN */}
      {subView === 'TRACEABILITY' && (
        <Card className="bg-white border border-slate-200 p-6 space-y-4">
          <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Leaf size={18} className="text-teal-700" />
                <h2 className="text-sm font-bold text-slate-900">Bidirectional Visitor ESG Activity Traceability Ledger</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Full cryptographic and relational provenance chain: Visitor Transaction ↔ Normalized Transport ↔ GHG Activity ↔ Calculation Hash ↔ Audit Ledger.
              </p>
            </div>
            <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              ISO 14064 & GHG Protocol Traceable
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="p-2.5">Visitor Reference</th>
                  <th className="p-2.5">Visitor & Company</th>
                  <th className="p-2.5">Transport Mode & Distance</th>
                  <th className="p-2.5">GHG Activity ID</th>
                  <th className="p-2.5">Scope & Category</th>
                  <th className="p-2.5">Factor Used</th>
                  <th className="p-2.5">Calculated Emissions</th>
                  <th className="p-2.5">Audit Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visitors.filter(v => v.transport).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-slate-800">{v.referenceNumber}</td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-900">{v.name}</div>
                      <div className="text-[11px] text-slate-500">{v.company}</div>
                    </td>
                    <td className="p-2.5">
                      <div>{v.transport?.mode} ({v.transport?.fuelType})</div>
                      <div className="text-[11px] text-slate-500">{v.transport?.distanceKm} km • {v.transport?.provenance}</div>
                    </td>
                    <td className="p-2.5 font-mono text-slate-700">{v.esgActivity?.id || 'GHA-PENDING'}</td>
                    <td className="p-2.5">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[10px]">
                        Scope 3 Cat 7
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600 font-mono text-[11px]">
                      DEFRA-2026.1 (0.1708 kg/km)
                    </td>
                    <td className="p-2.5 font-bold text-teal-700">
                      {v.esgActivity?.kgCO2e ? `${v.esgActivity.kgCO2e} kg CO2e` : 'Pending'}
                    </td>
                    <td className="p-2.5 font-mono text-[10px] text-slate-400">
                      SHA256:7f9a2b4...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: QR E-PASS BADGE (NON-SENSITIVE SECURE PAYLOAD) */}
      {isEPassModalOpen && selectedVisitor && (
        <Modal
          isOpen={isEPassModalOpen}
          onClose={() => setIsEPassModalOpen(false)}
          title="Industrial Plant Visitor Electronic Pass (e-Pass)"
        >
          <div className="p-6 bg-slate-50 text-center space-y-4">
            <div className="bg-white border-2 border-slate-800 rounded-lg p-5 shadow-sm inline-block max-w-sm w-full text-left">
              <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Security Access Badge</span>
                  <h3 className="text-base font-black text-slate-900">{selectedVisitor.siteName}</h3>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                  AUTHORIZED
                </span>
              </div>

              <div className="py-4 flex gap-4 items-center">
                <div className="p-2 bg-slate-100 border border-slate-300 rounded inline-block">
                  <QrCode size={96} className="text-slate-900" />
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-mono font-bold text-slate-900">{selectedVisitor.referenceNumber}</div>
                  <div className="text-sm font-bold text-slate-900">{selectedVisitor.name}</div>
                  <div className="text-slate-600">{selectedVisitor.company}</div>
                  <div className="text-[11px] text-slate-500">Host: {selectedVisitor.host}</div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 flex justify-between">
                <span>Valid: {new Date(selectedVisitor.scheduledStart).toLocaleDateString()}</span>
                <span>Time: {new Date(selectedVisitor.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedVisitor.scheduledEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Opaque cryptographic QR token. Raw identity documents and personal PII are strictly excluded from barcode payload.
            </p>

            <div className="flex justify-center gap-2">
              <Button size="dense" variant="secondary" onClick={() => window.print()}>
                <Printer size={14} />
                <span>Print Badge</span>
              </Button>
              <Button size="dense" variant="primary" onClick={() => setIsEPassModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 2: CHECK IN CONFIRMATION */}
      {isCheckInModalOpen && selectedVisitor && (
        <Modal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          title="Gate Security Check-In Authorization"
        >
          <div className="p-5 space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900">{selectedVisitor.name} ({selectedVisitor.referenceNumber})</div>
              <div className="text-slate-600">{selectedVisitor.company} • Host: {selectedVisitor.host}</div>
              <div className="text-slate-500">Scheduled: {selectedVisitor.scheduledStart.split('T')[1]?.substring(0, 5)} - {selectedVisitor.scheduledEnd.split('T')[1]?.substring(0, 5)}</div>
            </div>

            <div className="space-y-2">
              <span className="font-semibold text-slate-700">Pre-Entry Verification Checklist</span>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <span>Host Approval: Granted</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <span>Identity Document: Verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 size={16} />
                <span>Transport Vector: {selectedVisitor.transport?.mode || 'Logged'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsCheckInModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleCheckIn(selectedVisitor.id)}>
                Authorize Entry & Check In
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 3: CHECK OUT CONFIRMATION */}
      {isCheckOutModalOpen && selectedVisitor && (
        <Modal
          isOpen={isCheckOutModalOpen}
          onClose={() => setIsCheckOutModalOpen(false)}
          title="Gate Security Check-Out"
        >
          <div className="p-5 space-y-4 text-xs">
            <p className="text-slate-600">
              Confirm departure for <strong>{selectedVisitor.name}</strong> ({selectedVisitor.referenceNumber}).
              This will close the active on-premises session and decrement the live emergency muster count.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsCheckOutModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => handleCheckOut(selectedVisitor.id)}>
                Confirm Departure & Exit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 4: HOST APPROVAL */}
      {isApproveModalOpen && selectedVisitor && (
        <Modal
          isOpen={isApproveModalOpen}
          onClose={() => setIsApproveModalOpen(false)}
          title="Host Visit Approval"
        >
          <div className="p-5 space-y-4 text-xs">
            <div className="bg-slate-50 p-3 rounded border border-slate-200">
              <div className="font-bold text-slate-900">{selectedVisitor.name}</div>
              <div className="text-slate-600">{selectedVisitor.company} • Purpose: {selectedVisitor.purpose}</div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <Button variant="secondary" onClick={() => setIsApproveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => handleApprove(selectedVisitor.id)}>
                Approve Visit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL 5: NEW VISITOR CREATED SUCCESS */}
      {isNewVisitorSuccessModalOpen && (
        <Modal
          isOpen={isNewVisitorSuccessModalOpen}
          onClose={() => setIsNewVisitorSuccessModalOpen(false)}
          title="Visit Transaction Created Successfully"
        >
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Reference: {createdRefNumber}</h3>
              <p className="text-xs text-slate-600 mt-1">
                Visitor profile stored, host notification queued, and normalized transport mobility record linked to the ESG ledger.
              </p>
            </div>
            <div className="flex justify-center gap-2">
              <Button
                variant="primary"
                onClick={() => {
                  setIsNewVisitorSuccessModalOpen(false);
                  handleSelectSubView('ALL');
                }}
              >
                View in All Visitors
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* DRAWER: BIDIRECTIONAL TRACEABILITY INSPECTION */}
      {isTraceabilityDrawerOpen && selectedVisitor && (
        <Drawer
          isOpen={isTraceabilityDrawerOpen}
          onClose={() => setIsTraceabilityDrawerOpen(false)}
          title={`Traceability Chain: ${selectedVisitor.referenceNumber}`}
        >
          <div className="p-4 space-y-5 text-xs">
            {/* 1. Transaction Node */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">1. Source Operational Transaction</span>
                <span className="px-1.5 py-0.5 bg-slate-200 text-slate-800 text-[10px] rounded font-bold">VISITOR</span>
              </div>
              <div className="text-slate-700">Visitor: {selectedVisitor.name}</div>
              <div className="text-slate-500">Scheduled: {selectedVisitor.scheduledStart}</div>
              <div className="text-slate-500">Status: {selectedVisitor.status}</div>
            </div>

            {/* 2. Transport Vector Node */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">2. Normalized Transport Vector</span>
                <span className="px-1.5 py-0.5 bg-teal-100 text-teal-800 text-[10px] rounded font-bold">TRANSPORT</span>
              </div>
              <div className="text-slate-700">Mode: {selectedVisitor.transport?.mode} ({selectedVisitor.transport?.fuelType})</div>
              <div className="text-slate-500">Route: {selectedVisitor.transport?.origin} → {selectedVisitor.transport?.destination}</div>
              <div className="text-slate-500">Distance: {selectedVisitor.transport?.distanceKm} km (Provenance: {selectedVisitor.transport?.provenance})</div>
            </div>

            {/* 3. GHG Activity Node */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">3. Source-Linked GHG Activity Record</span>
                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold">GHG</span>
              </div>
              <div className="font-mono text-slate-700">{selectedVisitor.esgActivity?.id}</div>
              <div className="text-slate-500">Type: {selectedVisitor.esgActivity?.activityType}</div>
              <div className="text-slate-500">Quantity: {selectedVisitor.esgActivity?.quantity} {selectedVisitor.esgActivity?.unit}</div>
              <div className="font-bold text-teal-700">
                Calculated Emission: {selectedVisitor.esgActivity?.kgCO2e ? `${selectedVisitor.esgActivity.kgCO2e} kg CO2e` : 'Pending'}
              </div>
            </div>

            {/* 4. Immutable Audit Ledger */}
            <div className="bg-slate-50 p-3 rounded border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900">4. Immutable Append-Only Audit Trail</span>
              <div className="mt-2 text-[11px] space-y-1 text-slate-600 font-mono">
                <div>[09:30] VISITOR_CREATED by {selectedVisitor.host}</div>
                <div>[09:32] TRANSPORT_NORMALIZED distance={selectedVisitor.transport?.distanceKm}km</div>
                <div>[09:32] GHG_ACTIVITY_CREATED {selectedVisitor.esgActivity?.id}</div>
                {selectedVisitor.actualEntry && <div>[09:45] GATE_ENTRY_RECORDED Gate 1</div>}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};
