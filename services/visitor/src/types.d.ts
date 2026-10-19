import type { VisitorCategory, VisitorPurpose, BookingMode, TransportMode, OwnershipType, VehicleClass, FuelType, UsageType, JourneyType, DataProvenance, MeasurementMethod, TransportServiceType, DriverPassengerRole, VisitorProfile, IdentityVerificationMethod, IdentityVerificationRecord, VisitorEPass, NormalizedTransportActivity, ESGActivityRecord, GHGCalculationResult } from '@vms/types';
export interface TransportDetailInput {
    mode: TransportMode;
    ownership: OwnershipType;
    vehicleClass: VehicleClass;
    transportServiceType?: TransportServiceType;
    driverPassengerRole?: DriverPassengerRole;
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
    returnJourneyExpected?: boolean;
    dataSource?: string;
}
export interface GroupParticipantInput {
    fullName: string;
    phone?: string;
    email?: string;
    companyName?: string;
    role?: 'PARTICIPANT' | 'DELEGATE';
}
export interface CreateVisitorInput {
    tenantId: string;
    siteId: string;
    visitorCategory: VisitorCategory;
    purpose: VisitorPurpose;
    bookingMode: BookingMode;
    visitorName: string;
    visitorEmail?: string;
    visitorPhone?: string;
    companyName?: string;
    designation?: string;
    governmentIdNumber?: string;
    governmentIdType?: string;
    governmentIdScanUrl?: string;
    hostUserId: string;
    scheduledStart: Date | string;
    scheduledEnd: Date | string;
    escortRequired?: boolean;
    notes?: string;
    transport?: TransportDetailInput;
    groupParticipants?: GroupParticipantInput[];
    requiredDocuments?: string[];
    emergencyReason?: string;
    idempotencyKey?: string;
    submittedBy: string;
}
export interface SearchVisitorQuery {
    tenantId: string;
    query: string;
}
export interface ProfileMatchCandidate {
    profileId: string;
    personId: string;
    fullName: string;
    phone: string;
    email?: string;
    companyName?: string;
    totalVisits: number;
    vipStatus: boolean;
    matchScore: number;
    matchReason: string;
    lastVisitDate?: Date;
}
export interface CheckInInput {
    tenantId: string;
    siteId: string;
    transactionId: string;
    gateId?: string;
    operatorUserId: string;
    verificationMethod?: IdentityVerificationMethod;
    verificationToken?: string;
    overrideReason?: string;
}
export interface CheckOutInput {
    tenantId: string;
    siteId: string;
    transactionId: string;
    gateId?: string;
    operatorUserId: string;
    notes?: string;
}
export interface RescheduleVisitInput {
    tenantId: string;
    transactionId: string;
    newStart: Date | string;
    newEnd: Date | string;
    reason: string;
    updatedBy: string;
}
export interface IdentityVerificationInput {
    tenantId: string;
    transactionId: string;
    method: IdentityVerificationMethod;
    verifierUserId: string;
    status: 'SUCCESS' | 'FAILED';
    verificationToken?: string;
    notes?: string;
    failureReason?: string;
}
export interface ActivityCorrectionInput {
    tenantId: string;
    transactionId: string;
    correctedTransport: Partial<TransportDetailInput>;
    reason: string;
    correctedBy: string;
}
export interface OverstayDetectionOptions {
    tenantId: string;
    siteId?: string;
    warningThresholdMinutes?: number;
    breachThresholdMinutes?: number;
    currentTime?: Date;
}
export interface VisitorListQuery {
    tenantId: string;
    siteId?: string;
    visitorCategory?: VisitorCategory;
    purpose?: VisitorPurpose;
    bookingMode?: BookingMode;
    stage?: string;
    status?: string;
    hostUserId?: string;
    searchTerm?: string;
    dateFrom?: Date | string;
    dateTo?: Date | string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface VisitorListResult {
    items: VisitorTransactionView[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
export interface VisitorTransactionView {
    transactionId: string;
    referenceNumber: string;
    tenantId: string;
    siteId: string;
    personId: string;
    visitorName: string;
    visitorEmail?: string;
    visitorPhone?: string;
    companyName?: string;
    designation?: string;
    visitorCategory: VisitorCategory;
    purpose: VisitorPurpose;
    bookingMode: BookingMode;
    hostUserId: string;
    hostName?: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    actualArrival?: Date;
    actualEntry?: Date;
    actualExit?: Date;
    stage: string;
    status: string;
    escortRequired: boolean;
    vipStatus: boolean;
    transportSummary?: string;
    transport?: NormalizedTransportActivity;
    esgActivity?: ESGActivityRecord;
    ghgCalculation?: GHGCalculationResult;
    workflowStage?: string;
    approvalStatus?: string;
    identityVerificationStatus?: string;
    participantCount?: number;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}
export interface VisitorTraceabilityChain {
    transaction: VisitorTransactionView;
    person: Record<string, any>;
    profile: VisitorProfile | null;
    transportActivity?: NormalizedTransportActivity;
    ghgActivity?: ESGActivityRecord;
    ghgCalculation?: GHGCalculationResult;
    identityVerifications: IdentityVerificationRecord[];
    gateEvents: Array<Record<string, any>>;
    auditLogs: Array<Record<string, any>>;
    ePass?: VisitorEPass;
}
