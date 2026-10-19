import type {
  ContractorCompany,
  ContractorCompanyStatus,
  ContractorSafetyRating,
  ContractorClassification,
  ContractorContract,
  ContractType,
  ContractStatus,
  ContractorWorkOrder,
  WorkOrderCategory,
  WorkOrderStatus,
  ContractorWorkerProfile,
  ContractorWorkerCategory,
  ContractorWorkerStatus,
  ContractorWorkerAssignment,
  ContractorAssignmentStatus,
  WorkerEligibilityStatus,
  WorkerAuthorizationDecision,
  ContractorComplianceRecord,
  ComplianceRequirementType,
  ComplianceStatus,
  ContractorQualification,
  ContractorAttendanceRecord,
  ContractorPresenceStatus,
  ContractorAnalyticsSummary,
  TransportMode,
  OwnershipType,
  VehicleClass,
  FuelType,
  UsageType,
  JourneyType,
  DataProvenance,
  MeasurementMethod,
  NormalizedTransportActivity,
  ESGActivityRecord,
  TransactionStage,
  TransactionStatus,
} from '@vms/types';

// ============================================================================
// Transport & Mobility Inputs
// ============================================================================

export interface ContractorTransportInput {
  mode: TransportMode;
  ownership: OwnershipType;
  vehicleClass: VehicleClass;
  fuelType: FuelType;
  usageType: UsageType;
  occupancy?: number;
  originLocation: string;
  destinationLocation: string;
  distanceKm?: number;
  distanceProvenance?: DataProvenance;
  measurementMethod?: MeasurementMethod;
  journeyType?: JourneyType;
  tripLegsCount?: number;
  vehiclePlate?: string;
  dataSource?: string;
  isSharedVehicle?: boolean;
  activityContext?: 'WORKER_COMMUTING' | 'WORK_RELATED_TRAVEL' | 'CONTRACTOR_MOBILIZATION';
}

// ============================================================================
// Contractor Company DTOs
// ============================================================================

export interface CreateContractorCompanyInput {
  tenantId: string;
  externalOrgId?: string;
  organizationName?: string;
  companyName?: string;
  tradeName?: string;
  vendorCode?: string;
  registrationNumber?: string;
  safetyRating?: ContractorSafetyRating;
  contractorClassification?: ContractorClassification;
  responsibleInternalManagerId?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  siteContactName?: string;
  approvedSiteIds?: string[];
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Date | string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateContractorCompanyInput {
  tenantId: string;
  companyName?: string;
  tradeName?: string;
  safetyRating?: ContractorSafetyRating;
  status?: ContractorCompanyStatus;
  contractorClassification?: ContractorClassification;
  responsibleInternalManagerId?: string;
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  siteContactName?: string;
  approvedSiteIds?: string[];
  insurancePolicyNumber?: string;
  insuranceExpiryDate?: Date | string;
  notes?: string;
  updatedBy: string;
}

export interface ContractorCompanyQuery {
  tenantId: string;
  status?: ContractorCompanyStatus;
  classification?: ContractorClassification;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ContractorCompanyResponse extends ContractorCompany {
  activeContractsCount?: number;
  activeWorkOrdersCount?: number;
  assignedWorkersCount?: number;
  compliancePassRate?: number;
}

export interface CompanyDuplicateCheckResult {
  isDuplicate: boolean;
  existingCompanyId?: string;
  matchReason?: string;
}

// ============================================================================
// Contract DTOs
// ============================================================================

export interface CreateContractInput {
  tenantId: string;
  companyId: string;
  contractNumber?: string;
  title: string;
  contractType?: ContractType;
  contractOwnerUserId?: string;
  startDate: Date | string;
  endDate: Date | string;
  scopeOfWork?: string;
  authorizedSiteIds?: string[];
  applicableDepartments?: string[];
  requiredInsurance?: string;
  requiredQualifications?: string[];
  requiredComplianceDocuments?: string[];
  authorizedWorkCategories?: string[];
  notes?: string;
  createdBy?: string;
}

export interface UpdateContractInput {
  tenantId: string;
  title?: string;
  contractType?: ContractType;
  contractOwnerUserId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: ContractStatus;
  scopeOfWork?: string;
  authorizedSiteIds?: string[];
  applicableDepartments?: string[];
  requiredInsurance?: string;
  requiredQualifications?: string[];
  requiredComplianceDocuments?: string[];
  authorizedWorkCategories?: string[];
  updatedBy: string;
}

export interface RenewContractInput {
  tenantId: string;
  contractId: string;
  newEndDate: Date | string;
  renewalReason: string;
  approvedByUserId: string;
}

export interface ContractorContractQuery {
  tenantId: string;
  companyId?: string;
  status?: ContractStatus;
  siteId?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Work Order DTOs
// ============================================================================

export interface CreateWorkOrderInput {
  tenantId: string;
  siteId: string;
  contractId: string;
  companyId: string;
  workOrderNumber?: string;
  title: string;
  scopeOfWork: string;
  workCategory?: WorkOrderCategory;
  responsibleInternalManagerId?: string;
  workLocation?: string;
  targetZoneId?: string;
  startDate: Date | string;
  endDate: Date | string;
  authorizedWorkerCount?: number;
  safetyPermitRequired?: boolean;
  requiredQualifications?: string[];
  requiredDocuments?: string[];
  requiredTraining?: string[];
  permitRequirements?: string[];
  transport?: ContractorTransportInput;
  createdBy?: string;
}

export interface UpdateWorkOrderInput {
  tenantId: string;
  title?: string;
  scopeOfWork?: string;
  workCategory?: WorkOrderCategory;
  responsibleInternalManagerId?: string;
  workLocation?: string;
  targetZoneId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  authorizedWorkerCount?: number;
  safetyPermitRequired?: boolean;
  requiredQualifications?: string[];
  requiredDocuments?: string[];
  requiredTraining?: string[];
  permitRequirements?: string[];
  status?: WorkOrderStatus;
  updatedBy: string;
}

export interface SubmitWorkOrderInput {
  tenantId: string;
  workOrderId: string;
  submittedByUserId: string;
}

export interface ApproveWorkOrderInput {
  tenantId: string;
  workOrderId: string;
  approvedByUserId: string;
  remarks?: string;
}

export interface RejectWorkOrderInput {
  tenantId: string;
  workOrderId: string;
  rejectedByUserId: string;
  reason: string;
}

export interface ContractorWorkOrderQuery {
  tenantId: string;
  siteId?: string;
  companyId?: string;
  contractId?: string;
  status?: WorkOrderStatus;
  workCategory?: WorkOrderCategory;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// Worker DTOs
// ============================================================================

export interface RegisterContractorWorkerInput {
  tenantId: string;
  companyId: string;
  personId?: string;
  fullName: string;
  badgeNumber?: string;
  tradeSkill: string;
  workerCategory?: ContractorWorkerCategory;
  designation?: string;
  phone?: string;
  email?: string;
  nationalIdNumber?: string;
  medicalFitnessValid?: boolean;
  medicalFitnessExpiry?: Date | string;
  transportPreference?: ContractorTransportInput;
  notes?: string;
  createdBy?: string;
}

export interface UpdateContractorWorkerInput {
  tenantId: string;
  tradeSkill?: string;
  workerCategory?: ContractorWorkerCategory;
  designation?: string;
  phone?: string;
  email?: string;
  medicalFitnessValid?: boolean;
  medicalFitnessExpiry?: Date | string;
  status?: ContractorWorkerStatus;
  notes?: string;
  updatedBy: string;
}

export interface ContractorWorkerQuery {
  tenantId: string;
  companyId?: string;
  workerCategory?: ContractorWorkerCategory;
  status?: ContractorWorkerStatus;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface WorkerDuplicateCheckResult {
  isDuplicate: boolean;
  existingWorkerId?: string;
  matchReason?: string;
}

// ============================================================================
// Worker Assignment DTOs
// ============================================================================

export interface AssignWorkerInput {
  tenantId: string;
  workOrderId: string;
  contractorWorkerId: string;
  siteId?: string;
  workLocation?: string;
  assignedFrom: Date | string;
  assignedTo: Date | string;
  shiftPattern?: 'DAY_SHIFT' | 'NIGHT_SHIFT' | 'GENERAL_SHIFT' | 'ROTATIONAL';
  transport?: ContractorTransportInput;
  assignedByUserId?: string;
}

export interface ReassignWorkerInput {
  tenantId: string;
  currentAssignmentId: string;
  newWorkOrderId: string;
  assignedFrom: Date | string;
  assignedTo: Date | string;
  reassignedByUserId: string;
  reason?: string;
}

export interface EndAssignmentInput {
  tenantId: string;
  assignmentId: string;
  endedByUserId: string;
  reason?: string;
}

// ============================================================================
// Compliance & Qualification DTOs
// ============================================================================

export interface EvaluateWorkerComplianceInput {
  tenantId: string;
  workerId: string;
  workOrderId: string;
  siteId?: string;
}

export interface RecordWorkerTrainingInput {
  tenantId: string;
  workerId: string;
  trainingType: string;
  completedDate: Date | string;
  expiryDate: Date | string;
  certificateNumber?: string;
  verifiedByUserId?: string;
}

export interface RecordWorkerQualificationInput {
  tenantId: string;
  workerId: string;
  qualificationName: string;
  qualificationCode?: string;
  issuingBody?: string;
  issueDate: Date | string;
  expiryDate?: Date | string;
  certificateRef?: string;
  verifiedByUserId?: string;
}

export interface VerifyComplianceDocumentInput {
  tenantId: string;
  recordId: string;
  documentRef: string;
  verifiedByUserId: string;
  validTo?: Date | string;
  notes?: string;
}

// ============================================================================
// Attendance DTOs
// ============================================================================

export interface CheckInContractorWorkerInput {
  tenantId: string;
  siteId: string;
  gateId?: string;
  workOrderId: string;
  contractorWorkerId: string;
  assignmentId?: string;
  shiftDate?: Date | string;
  entryTime?: Date | string;
  operatorUserId?: string;
  transport?: ContractorTransportInput;
  idempotencyKey?: string;
}

export interface CheckOutContractorWorkerInput {
  tenantId: string;
  attendanceId: string;
  gateId?: string;
  exitTime?: Date | string;
  operatorUserId?: string;
  hoursWorked?: number;
}

export interface CorrectAttendanceInput {
  tenantId: string;
  attendanceId: string;
  correctedEntryTime?: Date | string;
  correctedExitTime?: Date | string;
  correctedPresenceStatus?: ContractorPresenceStatus;
  correctionReason: string;
  correctedByUserId: string;
  correctedTransport?: ContractorTransportInput;
}

export interface ContractorAttendanceQuery {
  tenantId: string;
  siteId?: string;
  workOrderId?: string;
  companyId?: string;
  workerId?: string;
  shiftDate?: string;
  presenceStatus?: ContractorPresenceStatus;
  limit?: number;
  offset?: number;
}
