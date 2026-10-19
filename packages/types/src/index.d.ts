/**
 * VMS Enterprise: Unified Domain Type Definitions
 */
export interface Tenant {
    tenantId: string;
    code: string;
    name: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
    createdAt: Date;
    updatedAt: Date;
}
export interface Organization {
    organizationId: string;
    tenantId: string;
    code: string;
    name: string;
    createdAt: Date;
}
export interface Site {
    siteId: string;
    tenantId: string;
    organizationId: string;
    code: string;
    name: string;
    latitude: number;
    longitude: number;
    timezone: string;
    createdAt: Date;
}
export interface Gate {
    gateId: string;
    tenantId: string;
    siteId: string;
    name: string;
    gateType: 'PEDESTRIAN' | 'COMMERCIAL_VEHICLE' | 'EXECUTIVE' | 'SERVICE';
    isActive: boolean;
}
export interface Zone {
    zoneId: string;
    tenantId: string;
    siteId: string;
    name: string;
    securityLevel: 'STANDARD' | 'HIGH_SECURITY' | 'HAZARDOUS';
    maxCapacity?: number;
}
export type SourceDomain = 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'SERVICE' | 'MATERIAL' | 'VEHICLE';
export type TransactionStage = 'DRAFT' | 'APPROVAL' | 'SCHEDULED' | 'CHECK_IN' | 'ACTIVE' | 'CHECK_OUT' | 'CLOSED';
export type TransactionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED' | 'IN_PROGRESS' | 'ON_PREMISES' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW' | 'BLOCKED';
export interface CommonTransactionEnvelope {
    transactionId: string;
    tenantId: string;
    organizationId: string;
    siteId: string;
    sourceDomain: SourceDomain;
    stage: TransactionStage;
    status: TransactionStatus;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
    version: number;
    metadata?: Record<string, unknown>;
}
export type TransportMode = 'CAR' | 'TWO_WHEELER' | 'BUS' | 'TRAIN' | 'FLIGHT' | 'TAXI_CAB' | 'AUTO_RICKSHAW' | 'VAN' | 'TRUCK' | 'WALKING' | 'OTHER';
export type OwnershipType = 'PERSONAL' | 'COMPANY' | 'HIRED' | 'PUBLIC' | 'SUPPLIER' | 'TRANSPORTER' | 'CUSTOMER' | 'THIRD_PARTY_LOGISTICS' | 'OTHER';
export type VehicleClass = 'HATCHBACK' | 'SEDAN' | 'SUV' | 'TWO_WHEELER' | 'MINI_BUS' | 'COACH_BUS' | 'LIGHT_COMMERCIAL_VAN' | 'MEDIUM_DUTY_TRUCK' | 'HEAVY_DUTY_TRUCK' | 'TRAILER' | 'CONTAINER_CARRIER' | 'OTHER';
export type FuelType = 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC' | 'HYBRID_PETROL' | 'HYBRID_DIESEL' | 'HYDROGEN' | 'OTHER';
export type UsageType = 'INDIVIDUAL' | 'SHARED' | 'CARPOOL' | 'COMPANY_POOL' | 'PUBLIC_COMMUTE' | 'OTHER';
export type JourneyType = 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP' | 'LOCAL_CAMPUS';
export type TripDirection = 'INBOUND' | 'OUTBOUND' | 'INTERNAL_TRANSFER';
export type MeasurementMethod = 'ODOMETER' | 'TELEMATICS_GPS' | 'GIS_ROUTING' | 'WEIGHBRIDGE_SCALE' | 'DECLARED_MANIFEST' | 'ESTIMATED_TABLE';
export type DataProvenance = 'MEASURED' | 'USER_PROVIDED' | 'SYSTEM_ESTIMATED' | 'SYSTEM_CALCULATED' | 'IMPORTED';
export interface NormalizedTransportActivity {
    transportId: string;
    tenantId: string;
    sourceDomain: SourceDomain;
    sourceTransactionId: string;
    mode: TransportMode;
    ownership: OwnershipType;
    vehicleClass: VehicleClass;
    fuelType: FuelType;
    usageType: UsageType;
    occupancy: number;
    originLocation: string;
    destinationLocation: string;
    distanceKm: number;
    journeyType: JourneyType;
    tripDirection: TripDirection;
    fuelConsumedLitres?: number;
    payloadWeightTonnes?: number;
    distanceProvenance: DataProvenance;
    measurementMethod: MeasurementMethod;
    dataSource: string;
    createdAt: Date;
}
export type ESGActivityType = 'COMMUTER_TRAVEL' | 'BUSINESS_TRAVEL' | 'UPSTREAM_LOGISTICS' | 'DOWNSTREAM_LOGISTICS' | 'FLEET_FUEL' | 'ON_SITE_EQUIPMENT';
export type GHGScope = 'SCOPE_1' | 'SCOPE_2' | 'SCOPE_3';
export interface AccountingScopeMapping {
    scope: GHGScope;
    category: string;
    subcategory: string;
    methodology: string;
}
export interface ScopeMappingRule {
    ruleId: string;
    tenantId?: string;
    sourceDomain: SourceDomain;
    ownership?: OwnershipType;
    tripDirection?: TripDirection;
    activityType?: ESGActivityType;
    scope: GHGScope;
    category: string;
    subcategory: string;
    methodology: string;
    priority: number;
    isActive: boolean;
}
export interface ESGActivityRecord {
    esgActivityId: string;
    tenantId: string;
    siteId: string;
    sourceDomain: SourceDomain;
    sourceTransactionId: string;
    transportId?: string;
    activityType: ESGActivityType;
    activityQuantity: number;
    activityUnit: 'KM' | 'LITRES' | 'TONNE_KM' | 'KWH';
    dataProvenance: DataProvenance;
    createdAt: Date;
}
export interface EmissionFactor {
    factorId: string;
    factorCode: string;
    version: string;
    source: string;
    factorValue: number;
    unit: string;
    geography: string;
    reportingYear: number;
    methodology: string;
    validFrom: string;
    validTo?: string | null;
    gasScope: 'CO2e' | 'CO2' | 'CH4' | 'N2O';
    evidenceDocUrl?: string;
    status: 'ACTIVE' | 'SUPERSEDED' | 'DRAFT' | 'REVOKED';
    tenantId?: string;
}
export interface GHGCalculationResult {
    calculationId: string;
    tenantId: string;
    esgActivityId: string;
    factorId: string;
    factorVersion: string;
    ghgScope: GHGScope;
    ghgCategory: string;
    subcategory: string;
    methodology: string;
    factorValueUsed: number;
    activityQuantity: number;
    emissionsKgCO2e: number;
    calculationHash: string;
    calculatedAt: Date;
    status: 'FINAL' | 'NEEDS_RECALCULATION' | 'HISTORICAL_ARCHIVED';
}
export type VisitorCategory = 'NEW_VISITOR' | 'REPEATED_VISITOR' | 'GROUP_VISITOR' | 'VIP_VISITOR' | 'AUDITOR' | 'CONSULTANT' | 'GOVERNMENT_OFFICIAL' | 'INTERVIEW_CANDIDATE' | 'OTHER';
export type VisitorPurpose = 'MEETING' | 'AUDIT' | 'INSPECTION' | 'TRAINING' | 'INTERVIEW' | 'CONSULTATION' | 'SITE_VISIT' | 'VENDOR_NEGOTIATION' | 'OTHER';
export type BookingMode = 'RESERVED' | 'WALK_IN' | 'RECURRING' | 'GROUP' | 'EMERGENCY';
export interface VisitorTransaction extends CommonTransactionEnvelope {
    sourceDomain: 'VISITOR';
    visitorCategory: VisitorCategory;
    purpose: VisitorPurpose;
    bookingMode: BookingMode;
    visitorName: string;
    visitorEmail?: string;
    visitorPhone?: string;
    governmentIdNumber?: string;
    governmentIdType?: string;
    governmentIdScanUrl?: string;
    facialBiometricTemplate?: string;
    hostUserId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    actualCheckIn?: Date;
    actualCheckOut?: Date;
    transport?: NormalizedTransportActivity;
}
export type CustomerVisitType = 'CUSTOMER_MEETING' | 'CUSTOMER_AUDIT' | 'CUSTOMER_INSPECTION' | 'QUALITY_VISIT' | 'TECHNICAL_VISIT' | 'PLANT_VISIT' | 'MANAGEMENT_VISIT' | 'DELEGATION_VISIT' | 'DELEGATION' | 'PRODUCT_REVIEW' | 'PROCESS_REVIEW' | 'OTHER';
export type CustomerVisitTypeCode = CustomerVisitType;
export interface CustomerTransaction extends CommonTransactionEnvelope {
    sourceDomain: 'CUSTOMER';
    customerAccountName: string;
    visitType: CustomerVisitType;
    delegationSize: number;
    executiveHostId: string;
    ndaSigned: boolean;
    scheduledStart: Date;
    scheduledEnd: Date;
    transport?: NormalizedTransportActivity;
}
export interface ContractorWorker {
    workerId: string;
    contractorTransactionId: string;
    workerName: string;
    nationalIdNumber: string;
    medicalFitnessValid: boolean;
    inductionCompleted: boolean;
    inductionExpiryDate?: Date;
}
export interface ContractorTransaction extends CommonTransactionEnvelope {
    sourceDomain: 'CONTRACTOR';
    contractorCompanyName: string;
    workOrderNumber: string;
    authorizedWorkerCount: number;
    safetyPermitRequired: boolean;
    contractStartDate: Date;
    contractEndDate: Date;
    workers?: ContractorWorker[];
    transport?: NormalizedTransportActivity;
}
export type ServiceRequestType = 'OEM_BREAKDOWN' | 'PREVENTIVE_MAINTENANCE' | 'CALIBRATION' | 'INSTALLATION' | 'EMERGENCY_REPAIR';
export interface ServiceTransaction extends CommonTransactionEnvelope {
    sourceDomain: 'SERVICE';
    serviceRequestType: ServiceRequestType;
    equipmentTag: string;
    targetZoneId: string;
    maintenanceLeadId: string;
    inwardToolsDeclared: boolean;
    serviceCompleted: boolean;
    transport?: NormalizedTransportActivity;
}
export type MaterialMovementType = 'INWARD' | 'OUTWARD';
export type MaterialClassification = 'RETURNABLE' | 'NON_RETURNABLE' | 'SCRAP' | 'SAMPLE' | 'EQUIPMENT' | 'SPARE' | 'EMERGENCY';
export interface MaterialTransaction extends CommonTransactionEnvelope {
    sourceDomain: 'MATERIAL';
    movementType: MaterialMovementType;
    classification: MaterialClassification;
    deliveryChallanNumber: string;
    poReference?: string;
    transporterCompany: string;
    vehicleRegistration: string;
    grossWeightKg?: number;
    tareWeightKg?: number;
    netWeightKg?: number;
    transport?: NormalizedTransportActivity;
}
export interface VehicleTransaction extends CommonTransactionEnvelope {
    sourceDomain: 'VEHICLE';
    registrationPlate: string;
    vehicleType: string;
    driverName: string;
    driverLicenseNumber: string;
    breathalyzerPassed: boolean;
    entryOdometerKm?: number;
    exitOdometerKm?: number;
    transport?: NormalizedTransportActivity;
}
export type ComplianceDocumentType = 'GOVT_ID' | 'NDA' | 'POLLUTION_CERT' | 'INSURANCE' | 'SAFETY_CERT' | 'PERMIT_TO_WORK' | 'MEDICAL_FITNESS' | 'CHALLAN' | 'TAX_INVOICE';
export interface ComplianceDocument {
    documentId: string;
    tenantId: string;
    sourceDomain: SourceDomain;
    sourceTransactionId: string;
    documentType: ComplianceDocumentType;
    fileStorageKey: string;
    originalFileName: string;
    fileMimeType: string;
    fileSizeBytes: number;
    issuedDate?: Date;
    expiryDate?: Date;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
    verifiedBy?: string;
    verifiedAt?: Date;
    createdAt: Date;
}
export interface GatePass {
    passId: string;
    tenantId: string;
    siteId: string;
    sourceDomain: SourceDomain;
    sourceTransactionId: string;
    subjectType: 'PERSON' | 'VEHICLE' | 'CARGO';
    subjectIdentifier: string;
    authorizedGates: string[];
    authorizedZones: string[];
    validFrom: Date;
    validTo: Date;
    qrCodeToken: string;
    isActive: boolean;
}
export interface GatePassageDecision {
    allowed: boolean;
    gateId: string;
    subjectIdentifier: string;
    rejectionReason?: string;
    timestamp: Date;
}
export type EnterpriseRole = 'SUPER_ADMIN' | 'ORGANIZATION_ADMIN' | 'SITE_ADMIN' | 'SECURITY_MANAGER' | 'SECURITY_GUARD' | 'GATE_OPERATOR' | 'RECEPTIONIST' | 'HOST' | 'EHS_MANAGER' | 'HR' | 'HR_MANAGER' | 'LEGAL' | 'LEGAL_USER' | 'ESG_MANAGER' | 'ESG_METHODOLOGY_ADMIN' | 'AUDITOR' | 'IT_ADMIN' | 'MANAGEMENT';
export type DataClassificationLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'HIGHLY_RESTRICTED';
export type PermissionKey = 'visitor.read' | 'visitor.create' | 'visitor.update' | 'visitor.approve' | 'visitor.reject' | 'visitor.checkin' | 'visitor.checkout' | 'visitor.export' | 'customer.read' | 'customer.create' | 'customer.approve' | 'contractor.read' | 'contractor.create' | 'contractor.approve' | 'contractor.manage_compliance' | 'service.read' | 'service.create' | 'service.approve' | 'material.read' | 'material.create' | 'material.approve' | 'material.gate_entry' | 'vehicle.read' | 'vehicle.manage' | 'document.read' | 'document.upload' | 'document.verify' | 'document.delete' | 'gate.read' | 'gate.entry' | 'gate.exit' | 'gate.override' | 'gate.actuate' | 'emergency.read' | 'emergency.declare' | 'emergency.manage' | 'esg.activity.read' | 'esg.activity.export' | 'esg.calculation.manage' | 'esg.mapping.manage' | 'audit.read' | 'audit.export' | 'admin.users' | 'admin.roles' | 'admin.permissions' | 'admin.settings' | (string & {});
export interface UserContext {
    userId: string;
    tenantId: string;
    organizationId: string;
    siteId?: string;
    role: EnterpriseRole;
    roles?: EnterpriseRole[];
    permissions?: string[];
    assignedSiteIds?: string[];
    assignedGateIds?: string[];
    assignedZoneIds?: string[];
    mfaVerified?: boolean;
    sessionId?: string;
    isBreakGlass?: boolean;
    deviceContext?: DeviceSecurityContext;
}
export interface DeviceSecurityContext {
    deviceId: string;
    deviceType: 'GATE_TERMINAL' | 'SECURITY_KIOSK' | 'SECURITY_TABLET' | 'MOBILE' | 'DESKTOP';
    appVersion?: string;
    os?: string;
    siteId?: string;
    gateId?: string;
    isTrusted?: boolean;
    isOffline?: boolean;
    lastSyncAt?: Date;
}
export interface UserSession {
    sessionId: string;
    userId: string;
    tenantId: string;
    deviceInfo?: string;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;
    isRevoked: boolean;
    revokedAt?: Date;
    revokedReason?: string;
    revokedByUserId?: string;
}
export type MfaChannel = 'TOTP' | 'OTP_EMAIL' | 'OTP_SMS' | 'RECOVERY_CODE' | 'WEBAUTHN';
export interface MfaPolicyConfig {
    mandatoryRoles: EnterpriseRole[];
    tenantEnforced: boolean;
    allowedChannels: MfaChannel[];
    maxFailedAttempts: number;
}
export interface MfaVerificationResult {
    verified: boolean;
    channel: MfaChannel;
    timestamp: Date;
    failureReason?: string;
}
export interface ConsentRecord {
    consentId: string;
    tenantId: string;
    personId: string;
    transactionId?: string;
    purpose: string;
    consentType: 'VISITOR_REGISTRATION' | 'PRIVACY_NOTICE' | 'BIOMETRIC_PROCESSING' | 'PHOTOGRAPHY' | 'TERMS_OF_ACCESS';
    versionPresented: string;
    accepted: boolean;
    timestamp: Date;
    channel: 'WEB_PORTAL' | 'KIOSK' | 'GUARD_MOBILE' | 'PAPER_SCAN';
    evidenceReference?: string;
    withdrawn: boolean;
    withdrawnAt?: Date;
}
export interface BiometricVerificationRecord {
    verificationId: string;
    tenantId: string;
    personId: string;
    transactionId?: string;
    provider: string;
    method: 'FACIAL_RECOGNITION' | 'LIVENESS_CHECK' | 'CARD_PLUS_FACE';
    livenessResult: boolean;
    matchResult: boolean;
    confidenceBand: 'VERIFIED' | 'NOT_VERIFIED' | 'MANUAL_REVIEW';
    timestamp: Date;
    device?: string;
    result: 'ALLOW' | 'DENY' | 'MANUAL_INSPECTION';
    failureReason?: string;
}
export interface BiometricReferenceRecord {
    biometricId: string;
    tenantId: string;
    personId: string;
    provider: string;
    templateReferenceId: string;
    version: string;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    consentReferenceId: string;
    retentionExpiresAt: Date;
    enrolledAt: Date;
    deletedAt?: Date;
}
export interface AuditRecord {
    auditId: string;
    tenantId: string;
    actorUserId: string;
    actorRoleContext: EnterpriseRole;
    action: string;
    entityType: string;
    entityId: string;
    timestamp: Date;
    requestId: string;
    correlationId: string;
    source: string;
    ipMetadata?: string;
    deviceMetadata?: string;
    beforeSnapshot?: Record<string, unknown>;
    afterSnapshot?: Record<string, unknown>;
    reason?: string;
    result: 'SUCCESS' | 'DENIED' | 'FAILED';
    hash: string;
    previousHash?: string;
}
export type EventClassification = 'OPERATIONAL' | 'AUDIT' | 'SECURITY';
export interface SecurityAlert {
    alertId: string;
    tenantId: string;
    alertType: 'MULTIPLE_FAILED_LOGINS' | 'IMPOSSIBLE_LOGIN_PATTERN' | 'REPEATED_AUTHZ_FAILURE' | 'UNAUTHORIZED_DOCUMENT_ACCESS' | 'MASS_EXPORT_DETECTED' | 'PRIVILEGE_ESCALATION_ATTEMPT' | 'SUSPICIOUS_GATE_OVERRIDE' | 'BIOMETRIC_VERIFICATION_FAILURE_BURST';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    details: Record<string, unknown>;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface BreakGlassGrant {
    grantId: string;
    tenantId: string;
    userId: string;
    reason: string;
    elevatedRole: EnterpriseRole;
    requestedAt: Date;
    expiresAt: Date;
    revokedAt?: Date;
    auditRecordId: string;
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}
export interface DocumentRetentionPolicy {
    policyId: string;
    tenantId: string;
    documentType: string;
    retentionDays: number;
    legalHold: boolean;
    actionOnExpiry: 'DELETE' | 'ARCHIVE' | 'ANONYMIZE';
}
export interface RetentionExecutionLog {
    logId: string;
    policyId: string;
    tenantId: string;
    documentId: string;
    actionTaken: string;
    executedAt: Date;
    status: 'SUCCESS' | 'EXCEPTION_PREVENTED' | 'FAILED';
    details?: string;
}
export interface StandardApiError {
    code: 'AUTHENTICATION_FAILED' | 'AUTHORIZATION_DENIED' | 'RESOURCE_NOT_FOUND' | 'VALIDATION_ERROR' | 'RATE_LIMITED' | 'SESSION_EXPIRED' | 'MFA_REQUIRED' | 'INTERNAL_ERROR';
    message: string;
    requestId: string;
    timestamp: string;
    details?: Record<string, unknown>;
}
export interface RetentionException {
    exceptionId: string;
    tenantId: string;
    policyId?: string;
    documentId?: string;
    documentType?: string;
    reason: string;
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
}
export interface UserSecurityProfile {
    userId: string;
    tenantId: string;
    organizationId: string;
    username: string;
    email: string;
    accountStatus: 'ACTIVE' | 'LOCKED' | 'SUSPENDED' | 'DEACTIVATED';
    roles: EnterpriseRole[];
    permissions: string[];
    assignedSites: string[];
    assignedGates: string[];
    assignedZones: string[];
    mfaEnabled: boolean;
    activeSessionsCount: number;
    lastLoginAt?: Date;
    lastPasswordChangeAt?: Date;
    securityEventsCount: number;
    recentSecurityAlerts: SecurityAlert[];
}
export interface ServiceIdentity {
    serviceId: string;
    serviceName: string;
    allowedAudiences: string[];
    publicKeyOrSecret: string;
    isActive: boolean;
    createdAt: Date;
}
export interface ServiceTokenPayload {
    serviceId: string;
    serviceName: string;
    audience: string;
    issuedAt: number;
    expiresAt: number;
    nonce: string;
}
export interface OfflineGatePassCache {
    passId: string;
    tenantId: string;
    siteId: string;
    gateId: string;
    subjectIdentifier: string;
    qrHash: string;
    validFrom: Date;
    validTo: Date;
    cachedAt: Date;
    isBlacklisted: boolean;
}
export interface OfflineActionSyncRecord {
    syncRecordId: string;
    deviceId: string;
    siteId: string;
    gateId: string;
    action: 'OFFLINE_PASS_ENTRY' | 'OFFLINE_PASS_EXIT' | 'OFFLINE_GATE_OVERRIDE';
    subjectIdentifier: string;
    passId?: string;
    recordedAt: Date;
    signature: string;
}
export interface ConflictResolutionResult {
    actionId: string;
    status: 'RECONCILED' | 'CONFLICT_DETECTED' | 'DUPLICATE_REJECTED';
    conflictReason?: string;
    reconciledAt: Date;
}
export interface DomainEvent<T = unknown> {
    eventId: string;
    eventType: string;
    eventSource: string;
    eventTimestamp: string;
    tenantId: string;
    organizationId: string;
    siteId: string;
    correlationId: string;
    version: string;
    data: T;
    actorId: string;
    actorRole: EnterpriseRole;
    eventClassification?: EventClassification;
}
export type MasterRecordStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
export interface MasterDataCategoryDef {
    categoryCode: string;
    name: string;
    domain: string;
    description: string;
    isSensitive: boolean;
    requiresApprovalForActivation: boolean;
    fieldSchema?: Record<string, unknown>;
}
export interface MasterRecord {
    id: string;
    tenantId: string;
    organizationId?: string;
    siteId?: string;
    category: string;
    code: string;
    name: string;
    description?: string;
    parentRecordId?: string;
    status: MasterRecordStatus;
    sortOrder: number;
    effectiveFrom: Date;
    effectiveUntil?: Date;
    metadata?: Record<string, unknown>;
    version: number;
    createdBy: string;
    createdAt: Date;
    updatedBy: string;
    updatedAt: Date;
    isSensitive?: boolean;
    pendingApproval?: boolean;
}
export interface MasterRecordVersion {
    versionId: string;
    recordId: string;
    versionNumber: number;
    snapshot: Record<string, unknown>;
    changedBy: string;
    changedAt: Date;
    reason?: string;
}
export interface MasterDataImportRow {
    code: string;
    name: string;
    description?: string;
    category: string;
    siteCode?: string;
    parentCode?: string;
    sortOrder?: number;
    effectiveFrom?: string;
    effectiveUntil?: string;
    metadata?: Record<string, unknown>;
}
export interface MasterDataImportResult {
    importId: string;
    tenantId: string;
    category: string;
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    errors: Array<{
        rowNumber: number;
        code?: string;
        field?: string;
        message: string;
    }>;
    importedRecords: MasterRecord[];
    auditLogId: string;
}
export type WorkflowDomain = 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'SERVICE' | 'MATERIAL' | 'VEHICLE' | 'DOCUMENT' | 'SAFETY' | 'OTHER_APPROVED_DOMAIN';
export type WorkflowLifecycleStatus = 'DRAFT' | 'VALIDATED' | 'PUBLISHED' | 'RETIRED';
export type WorkflowStageType = 'START' | 'DATA_VALIDATION' | 'APPROVAL' | 'AUTOMATED_RULE_EVALUATION' | 'DOCUMENT_VERIFICATION' | 'IDENTITY_VERIFICATION' | 'SAFETY_CHECK' | 'ACCESS_DECISION' | 'OPERATIONAL_TASK' | 'NOTIFICATION' | 'DELAY_WAIT' | 'END' | 'EXCEPTION_HANDLING';
export interface WorkflowCondition {
    conditionId?: string;
    field: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'EXISTS' | 'IS_VALID' | 'IS_EXPIRED';
    value: unknown;
    logicGroup?: 'AND' | 'OR';
}
export interface WorkflowTransition {
    transitionId: string;
    fromStageId: string;
    toStageId: string;
    trigger: string;
    requiredPermission?: string;
    conditions?: WorkflowCondition[];
    reasonRequired?: boolean;
    resultStatus?: string;
}
export type ApprovalPolicyType = 'SINGLE' | 'SEQUENTIAL' | 'PARALLEL_ALL_REQUIRED' | 'PARALLEL_ANY_ONE' | 'PARALLEL_QUORUM';
export type ApprovalApproverType = 'NAMED_USER' | 'ROLE' | 'DEPARTMENT' | 'SITE_RESPONSIBILITY' | 'HOST_SPONSOR' | 'RESPONSIBLE_MANAGER' | 'APPROVAL_GROUP';
export interface SlaConfig {
    slaMinutes: number;
    warningMinutes: number;
    escalationTargetRole?: string;
    escalationTargetUserId?: string;
    escalationFrequencyMinutes?: number;
    escalateToManager?: boolean;
    autoApproveOnExpiry?: boolean;
}
export type SlaStatus = 'ON_SCHEDULE' | 'WARNING_TRIGGERED' | 'BREACHED' | 'ESCALATED';
export interface SlaEvaluationResult {
    taskId: string;
    slaStatus: SlaStatus;
    actionTaken: string;
}
export interface ApprovalAssignmentRule {
    approverType: ApprovalApproverType;
    targetRole?: EnterpriseRole;
    targetUserId?: string;
    targetDepartmentCode?: string;
    allowSelfApproval?: boolean;
    delegationAllowed?: boolean;
}
export interface WorkflowStage {
    stageId: string;
    stageCode: string;
    stageName: string;
    stageType: WorkflowStageType;
    orderIndex: number;
    slaConfig?: SlaConfig;
    approvalPolicy?: ApprovalPolicyType;
    assignmentRules?: ApprovalAssignmentRule[];
    quorumRequired?: number;
    notificationTemplateId?: string;
    requiredInputs?: string[];
    isMandatory?: boolean;
}
export interface WorkflowDefinition {
    definitionId: string;
    tenantId: string;
    siteId?: string;
    domain: WorkflowDomain;
    code: string;
    name: string;
    description: string;
    isCurrent: boolean;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowVersion {
    versionId: string;
    definitionId: string;
    versionNumber: number;
    status: WorkflowLifecycleStatus;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    stages: WorkflowStage[];
    transitions: WorkflowTransition[];
    publishedBy?: string;
    publishedAt?: Date;
    immutable: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkflowValidationDiagnostic {
    severity: 'ERROR' | 'WARNING';
    stageId?: string;
    transitionId?: string;
    code: string;
    message: string;
}
export interface WorkflowValidationResult {
    isValid: boolean;
    diagnostics: WorkflowValidationDiagnostic[];
}
export interface WorkflowInstance {
    instanceId: string;
    tenantId: string;
    definitionId: string;
    versionId: string;
    sourceDomain: WorkflowDomain;
    sourceTransactionId: string;
    currentStageId: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'EXCEPTION';
    startedAt: Date;
    completedAt?: Date;
    history: Array<{
        stageId: string;
        stageName: string;
        enteredAt: Date;
        exitedAt?: Date;
        action?: string;
        actorId?: string;
        remarks?: string;
    }>;
    createdAt: Date;
    updatedAt: Date;
}
export type ApprovalDecision = 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'DELEGATED';
export interface ApprovalTask {
    taskId: string;
    instanceId: string;
    stageId: string;
    tenantId: string;
    siteId?: string;
    sourceDomain: WorkflowDomain;
    sourceTransactionId: string;
    assignedToUserId?: string;
    assignedToRole?: EnterpriseRole;
    assignedGroup?: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED' | 'DELEGATED' | 'ESCALATED' | 'EXPIRED' | 'CONFIGURATION_EXCEPTION' | 'SUPERSEDED' | 'CANCELLED';
    slaDueAt?: Date;
    slaWarningAt?: Date;
    slaBreached?: boolean;
    slaEscalated?: boolean;
    escalationCount?: number;
    submittedAt: Date;
    resolvedAt?: Date;
    metadata?: Record<string, unknown>;
}
export interface ApprovalActionRecord {
    actionId: string;
    taskId: string;
    instanceId: string;
    stageId: string;
    actorUserId: string;
    actorRole: EnterpriseRole;
    decision: ApprovalDecision;
    remarks?: string;
    delegationId?: string;
    timestamp: Date;
    correlationId?: string;
    changesRequiredDetails?: string;
}
export interface ApprovalDelegation {
    delegationId: string;
    tenantId: string;
    delegatorUserId: string;
    delegateUserId: string;
    domainScope?: WorkflowDomain;
    siteScopeId?: string;
    stageScopeId?: string;
    validFrom: Date;
    validTo: Date;
    reason?: string;
    status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
    createdAt: Date;
}
export type RuleOperator = 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'IN' | 'NOT_IN' | 'CONTAINS' | 'EXISTS' | 'IS_VALID' | 'IS_EXPIRED';
export interface RuleCondition {
    field: string;
    operator: RuleOperator;
    value: unknown;
    logic?: 'AND' | 'OR';
}
export interface PolicyRule {
    ruleId: string;
    policyId: string;
    ruleCode: string;
    name: string;
    priority: number;
    conditions: RuleCondition[];
    action: 'ALLOW' | 'DENY' | 'REQUIRE_APPROVAL' | 'REQUIRE_DOCUMENT' | 'ESCALATE';
    actionPayload?: Record<string, unknown>;
}
export interface PolicyDefinition {
    policyId: string;
    tenantId: string;
    siteId?: string;
    domain: WorkflowDomain;
    code: string;
    name: string;
    description?: string;
    rules: PolicyRule[];
    isActive: boolean;
    version: number;
}
export interface PolicyEvaluationResult {
    allowed: boolean;
    action: string;
    matchedRules: Array<{
        ruleId: string;
        ruleCode: string;
        name: string;
    }>;
    explanation: string;
}
export interface TransactionalOutboxEvent {
    outboxId: string;
    tenantId: string;
    eventType: string;
    payload: Record<string, unknown>;
    status: 'PENDING' | 'DISPATCHED' | 'FAILED';
    retryCount: number;
    createdAt: Date;
    dispatchedAt?: Date;
    errorDetails?: string;
}
export type TransportServiceType = 'SELF_DRIVEN_PERSONAL' | 'PASSENGER_PERSONAL' | 'HIRED_TAXI_CAB' | 'COMPANY_BOOKED_CAB' | 'COMPANY_BUS_SHUTTLE' | 'PUBLIC_BUS' | 'RAIL' | 'AIR_TRAVEL' | 'WALKING' | 'OTHER';
export type DriverPassengerRole = 'DRIVER' | 'PASSENGER' | 'UNKNOWN' | 'NOT_APPLICABLE';
export type VisitorLifecycleState = 'DRAFT' | 'SUBMITTED' | 'PENDING_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'ARRIVED' | 'IDENTITY_PENDING' | 'VERIFIED' | 'CHECKED_IN' | 'ACTIVE' | 'CHECKED_OUT' | 'CLOSED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED' | 'NO_SHOW' | 'BLOCKED';
export interface VisitorProfile {
    profileId: string;
    tenantId: string;
    personId: string;
    fullName: string;
    phone: string;
    email?: string;
    companyName?: string;
    designation?: string;
    vipStatus: boolean;
    governmentIdNumber?: string;
    governmentIdType?: string;
    totalVisits: number;
    lastVisitDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export type IdentityVerificationMethod = 'OTP' | 'GOVT_ID_DOCUMENT' | 'APPOINTMENT_QR' | 'MANUAL_VERIFICATION' | 'BIOMETRIC_FACE_BOUNDARY';
export interface IdentityVerificationRecord {
    verificationId: string;
    tenantId: string;
    transactionId: string;
    personId: string;
    method: IdentityVerificationMethod;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    verifierUserId: string;
    verifierNotes?: string;
    failureReason?: string;
    verifiedAt: Date;
}
export interface VisitorGroupParticipant {
    participantId: string;
    visitorTransactionId: string;
    personId: string;
    fullName: string;
    phone?: string;
    email?: string;
    companyName?: string;
    role: 'ORGANIZER' | 'PARTICIPANT' | 'DELEGATE';
    status: 'INVITED' | 'ARRIVED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
    actualArrival?: Date;
    actualExit?: Date;
}
export interface VisitorEPass {
    passId: string;
    tenantId: string;
    transactionId: string;
    referenceNumber: string;
    visitorName: string;
    companyName: string;
    hostName: string;
    siteName: string;
    gateName?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    passStatus: 'ACTIVE' | 'USED' | 'EXPIRED' | 'REVOKED';
    token: string;
    qrPayload: string;
    issuedAt: Date;
    expiresAt: Date;
}
export interface OverstayRecord {
    overstayId: string;
    tenantId: string;
    siteId: string;
    transactionId: string;
    referenceNumber: string;
    visitorName: string;
    hostUserId: string;
    scheduledEnd: Date;
    detectionTime: Date;
    overstayMinutes: number;
    status: 'WARNING' | 'BREACH' | 'RESOLVED';
    resolutionReason?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
}
export interface VisitorAnalyticsSummary {
    expectedToday: number;
    arrivedToday: number;
    currentlyInside: number;
    pendingApprovals: number;
    identityVerificationPending: number;
    overstays: number;
    completedToday: number;
    cancelledToday: number;
    bookingModeDistribution: Record<string, number>;
    purposeDistribution: Record<string, number>;
    transportModeDistribution: Record<string, number>;
    activityCaptureCompletenessPercent: number;
    unknownDistanceRatePercent: number;
}
export type CustomerClassification = 'EXISTING_CUSTOMER' | 'PROSPECTIVE_CUSTOMER' | 'STRATEGIC_CUSTOMER' | 'OEM_CUSTOMER' | 'QUALITY_CUSTOMER' | 'TECHNICAL_CUSTOMER' | 'OTHER';
export type CustomerAccountTier = 'STANDARD' | 'TIER_1_STRATEGIC' | 'OEM' | 'KEY_ACCOUNT' | 'GLOBAL_ENTERPRISE';
export type CustomerAccountStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type CustomerBookingMode = 'RESERVED' | 'WALK_IN' | 'DELEGATION' | 'RECURRING';
export type CustomerPhotographyPolicy = 'PROHIBITED' | 'RESTRICTED' | 'PERMITTED';
export interface CustomerAccount {
    customerAccountId: string;
    tenantId: string;
    externalOrgId: string;
    accountCode: string;
    accountName: string;
    legalName?: string;
    tradeName?: string;
    classification: CustomerClassification;
    tier: CustomerAccountTier;
    status: CustomerAccountStatus;
    registrationNumber?: string;
    primaryContactPersonId?: string;
    commercialOwnerUserId?: string;
    approvedSiteIds?: string[];
    defaultVisitRequirements?: string[];
    defaultNdaRequired?: boolean;
    defaultPhotographyPolicy?: CustomerPhotographyPolicy;
    defaultEscortRequired?: boolean;
    defaultAccessRequirements?: string[];
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CustomerRepresentative {
    repId: string;
    tenantId: string;
    customerAccountId: string;
    personId: string;
    fullName?: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
    department?: string;
    isPrimary: boolean;
    identityVerificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
    profileStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    preferredContactChannel?: 'EMAIL' | 'PHONE' | 'SMS';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CustomerVisitTypeEntity {
    visitTypeId: string;
    tenantId?: string;
    code: CustomerVisitTypeCode;
    name: string;
    description?: string;
    isActive: boolean;
}
export interface CustomerRequirement {
    requirementId: string;
    tenantId: string;
    customerVisitId: string;
    requirementType: 'NDA' | 'SAFETY_INDUCTION' | 'PPE' | 'ESCORT' | 'QUALITY_REP' | 'TECHNICAL_REP' | 'PHOTO_RESTRICTION' | 'RESTRICTED_AREA' | 'CONFIDENTIALITY';
    description: string;
    isMandatory: boolean;
    isFulfilled: boolean;
    fulfilledAt?: Date;
    scope?: 'GLOBAL' | 'SITE' | 'CUSTOMER_ACCOUNT' | 'VISIT_TYPE' | 'VISIT_EXCEPTION';
    createdAt: Date;
}
export interface CustomerAuditDetails {
    auditType: 'QUALITY_AUDIT' | 'PROCESS_AUDIT' | 'PRODUCT_AUDIT' | 'SYSTEM_AUDIT' | 'COMPLIANCE_AUDIT' | 'SUPPLIER_ASSESSMENT' | 'OTHER';
    auditScope: string;
    auditReference?: string;
    auditingOrganization?: string;
    leadAuditorPersonId?: string;
    leadAuditorName?: string;
    additionalAuditorIds?: string[];
    departmentsInvolved?: string[];
    closureSummary?: CustomerVisitClosure;
}
export interface CustomerInspectionDetails {
    inspectionCategory: 'PRODUCT_INSPECTION' | 'PROCESS_INSPECTION' | 'PRE_DISPATCH' | 'TOOLING' | 'FIRST_ARTICLE' | 'OTHER';
    inspectionScope: string;
    productProcessReference?: string;
    leadInspectorPersonId?: string;
    leadInspectorName?: string;
    requiredQualityRepId?: string;
    productionAreaRequirements?: string;
    closureSummary?: CustomerVisitClosure;
}
export interface CustomerVisitClosure {
    completed: boolean;
    actualStart?: Date;
    actualEnd?: Date;
    followUpRequired: boolean;
    notes: string;
    evidenceDocumentRefs?: string[];
    closedBy: string;
    closedAt: Date;
}
export interface CustomerVisitTransaction {
    transactionId: string;
    referenceNumber: string;
    tenantId: string;
    siteId: string;
    customerAccountId: string;
    visitTypeId?: string;
    visitTypeCode: CustomerVisitTypeCode;
    title: string;
    purpose?: string;
    description?: string;
    department?: string;
    hostUserId: string;
    relationshipOwnerUserId?: string;
    bookingMode: CustomerBookingMode;
    scheduledStart: Date;
    scheduledEnd: Date;
    actualArrival?: Date;
    actualEntry?: Date;
    actualExit?: Date;
    stage: TransactionStage;
    status: TransactionStatus;
    version: number;
    workflowInstanceId?: string;
    approvalState: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
    ndaSigned: boolean;
    ndaDocumentRef?: string;
    photographyPolicy: CustomerPhotographyPolicy;
    escortRequired: boolean;
    accessRequirement?: string;
    transportActivityId?: string;
    ghgActivityId?: string;
    auditDetails?: CustomerAuditDetails;
    inspectionDetails?: CustomerInspectionDetails;
    closureSummary?: CustomerVisitClosure;
    metadata?: Record<string, any>;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface CustomerVisitParticipant {
    participantId: string;
    customerVisitId: string;
    personId: string;
    customerRepId?: string;
    fullName: string;
    designation?: string;
    email?: string;
    phone?: string;
    isLead: boolean;
    identityStatus: 'PENDING' | 'VERIFIED' | 'FAILED';
    presenceStatus: 'EXPECTED' | 'ARRIVED' | 'CHECKED_IN' | 'DEPARTED' | 'NO_SHOW';
    actualArrival?: Date;
    actualEntry?: Date;
    actualExit?: Date;
    transportMode?: string;
    createdAt: Date;
}
export interface CustomerDelegationView {
    customerVisitId: string;
    referenceNumber: string;
    customerAccountName: string;
    title: string;
    organizerName: string;
    totalParticipants: number;
    expectedParticipants: number;
    arrivedParticipants: number;
    checkedInParticipants: number;
    departedParticipants: number;
    outstandingVerificationCount: number;
    vehiclesCount: number;
    sharedRequirements: CustomerRequirement[];
    participants: CustomerVisitParticipant[];
}
export interface CustomerAnalyticsSummary {
    activeCustomerAccounts: number;
    expectedVisitsToday: number;
    customerVisitsToday: number;
    currentlyInside: number;
    pendingApprovals: number;
    visitsRequiringLegalAction: number;
    completedVisits: number;
    repeatVisits: number;
    auditVisits: number;
    inspectionVisits: number;
    averageVisitDurationHours: number;
    approvalTurnaroundMinutes: number;
    cancellationRatePercent: number;
    noShowRatePercent: number;
    delegationParticipationCount: number;
    transportModeDistribution: Record<string, number>;
    activityCaptureCompletenessPercent: number;
    unknownDistanceRatePercent: number;
    activityRecordsPendingProcessing: number;
}
