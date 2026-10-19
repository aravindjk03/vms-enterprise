import React from 'react';
import type { EnterpriseRole, CustomerClassification, CustomerAccountTier, CustomerAccountStatus, CustomerVisitTypeCode, CustomerBookingMode, CustomerPhotographyPolicy } from '@vms/types';
export type CustomerSubView = 'DASHBOARD' | 'ACCOUNTS' | 'REPRESENTATIVES' | 'VISITS' | 'NEW' | 'MEETINGS' | 'AUDITS' | 'INSPECTIONS' | 'QUALITY' | 'TECHNICAL' | 'PLANT' | 'DELEGATIONS' | 'EXPECTED' | 'INSIDE' | 'APPROVALS' | 'NDA' | 'EXCEPTIONS' | 'COMPLETED' | 'CANCELLED' | 'HISTORY' | 'TRACEABILITY';
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
export declare const CustomerManagementView: React.FC<CustomerManagementViewProps>;
