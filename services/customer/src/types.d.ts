/**
 * VMS Enterprise: Customer Management Domain Types (Part 7)
 */
import type { CustomerClassification, CustomerAccountTier, CustomerAccountStatus, CustomerVisitTypeCode, CustomerBookingMode, CustomerPhotographyPolicy, CustomerAccount, CustomerVisitTransaction, CustomerVisitParticipant, CustomerRequirement, CustomerAuditDetails, CustomerInspectionDetails, TransportMode, OwnershipType, VehicleClass, FuelType, UsageType, JourneyType, DataProvenance, MeasurementMethod, NormalizedTransportActivity, ESGActivityRecord, GHGCalculationResult, IdentityVerificationMethod, TransactionStage, TransactionStatus } from '@vms/types';
export interface TransportDetailInput {
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
    returnJourneyExpected?: boolean;
    vehiclePlate?: string;
    dataSource?: string;
    isSharedDelegationVehicle?: boolean;
}
export interface CustomerParticipantInput {
    personId?: string;
    customerRepId?: string;
    fullName: string;
    designation?: string;
    email?: string;
    phone?: string;
    governmentIdNumber?: string;
    governmentIdType?: string;
    isLead?: boolean;
    transportMode?: string;
}
export interface CreateCustomerAccountInput {
    tenantId: string;
    externalOrgId?: string;
    organizationName?: string;
    legalName?: string;
    tradeName?: string;
    accountCode?: string;
    classification?: CustomerClassification;
    tier?: CustomerAccountTier;
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
    createdBy?: string;
}
export interface UpdateCustomerAccountInput {
    tenantId: string;
    accountName?: string;
    classification?: CustomerClassification;
    tier?: CustomerAccountTier;
    status?: CustomerAccountStatus;
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
    updatedBy: string;
}
export interface CreateCustomerRepresentativeInput {
    tenantId: string;
    customerAccountId: string;
    personId?: string;
    fullName: string;
    jobTitle?: string;
    department?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
    governmentIdNumber?: string;
    governmentIdType?: string;
    preferredContactChannel?: 'EMAIL' | 'PHONE' | 'SMS';
    notes?: string;
    createdBy?: string;
}
export interface UpdateCustomerRepresentativeInput {
    tenantId: string;
    jobTitle?: string;
    department?: string;
    email?: string;
    phone?: string;
    isPrimary?: boolean;
    identityVerificationStatus?: 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';
    profileStatus?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    preferredContactChannel?: 'EMAIL' | 'PHONE' | 'SMS';
    notes?: string;
    updatedBy: string;
}
export interface CreateCustomerVisitInput {
    tenantId: string;
    siteId: string;
    customerAccountId: string;
    visitTypeCode: CustomerVisitTypeCode;
    title: string;
    purpose?: string;
    description?: string;
    department?: string;
    hostUserId: string;
    relationshipOwnerUserId?: string;
    bookingMode?: CustomerBookingMode;
    scheduledStart: Date | string;
    scheduledEnd: Date | string;
    participants: CustomerParticipantInput[];
    transport?: TransportDetailInput;
    additionalTransports?: TransportDetailInput[];
    ndaSigned?: boolean;
    ndaDocumentRef?: string;
    photographyPolicy?: CustomerPhotographyPolicy;
    escortRequired?: boolean;
    accessRequirement?: string;
    requirements?: string[];
    auditDetails?: CustomerAuditDetails;
    inspectionDetails?: CustomerInspectionDetails;
    recurrence?: {
        frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
        occurrencesCount: number;
        intervalDays?: number;
    };
    idempotencyKey?: string;
    submittedBy?: string;
}
export interface CheckInCustomerParticipantInput {
    tenantId: string;
    siteId?: string;
    customerVisitId?: string;
    transactionId?: string;
    participantId?: string;
    gateId?: string;
    operatorUserId?: string;
    verificationMethod?: IdentityVerificationMethod;
    notes?: string;
}
export interface CheckOutCustomerParticipantInput {
    tenantId: string;
    siteId?: string;
    customerVisitId?: string;
    transactionId?: string;
    participantId?: string;
    gateId?: string;
    operatorUserId?: string;
    notes?: string;
}
export interface CloseCustomerVisitInput {
    tenantId: string;
    customerVisitId?: string;
    transactionId?: string;
    actualStart?: Date | string;
    actualEnd?: Date | string;
    completed?: boolean;
    followUpRequired?: boolean;
    notes: string;
    evidenceDocumentRefs?: string[];
    closedBy?: string;
    closedByUserId?: string;
}
export interface RescheduleCustomerVisitInput {
    tenantId: string;
    customerVisitId?: string;
    transactionId?: string;
    newStart: Date | string;
    newEnd: Date | string;
    reason: string;
    updatedBy: string;
}
export interface CancelCustomerVisitInput {
    tenantId: string;
    customerVisitId?: string;
    transactionId?: string;
    reason: string;
    cancelledBy: string;
}
export interface CustomerActivityCorrectionInput {
    tenantId: string;
    customerVisitId: string;
    transportId?: string;
    correctedTransport: Partial<TransportDetailInput>;
    reason: string;
    correctedBy: string;
}
export interface CustomerVisitQuery {
    tenantId: string;
    siteId?: string;
    customerAccountId?: string;
    visitTypeCode?: CustomerVisitTypeCode;
    stage?: TransactionStage;
    status?: TransactionStatus;
    hostUserId?: string;
    search?: string;
    startDate?: Date | string;
    endDate?: Date | string;
    limit?: number;
    offset?: number;
}
export interface CustomerAccountQuery {
    tenantId: string;
    classification?: CustomerClassification;
    status?: CustomerAccountStatus;
    siteId?: string;
    search?: string;
    limit?: number;
    offset?: number;
}
export interface CustomerRepresentativeQuery {
    tenantId: string;
    customerAccountId?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    search?: string;
    limit?: number;
    offset?: number;
}
export interface CustomerEPass {
    passId: string;
    tenantId: string;
    customerVisitId: string;
    referenceNumber: string;
    customerAccountName: string;
    participantName: string;
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
export interface CustomerTraceabilityChain {
    customerVisit: CustomerVisitTransaction;
    customerAccount: CustomerAccount;
    participants: CustomerVisitParticipant[];
    transportActivities: NormalizedTransportActivity[];
    esgActivities: ESGActivityRecord[];
    ghgCalculations: GHGCalculationResult[];
    requirements: CustomerRequirement[];
    gateEvents: Record<string, any>[];
    auditLogs: Record<string, any>[];
}
export type GateCheckInCustomerInput = CheckInCustomerParticipantInput;
export type GateCheckOutCustomerInput = CheckOutCustomerParticipantInput;
