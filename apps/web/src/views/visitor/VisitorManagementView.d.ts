import React from 'react';
import type { VisitorCategory, VisitorPurpose, BookingMode, TransportMode, OwnershipType, VehicleClass, FuelType, UsageType, DataProvenance, TransportServiceType } from '@vms/types';
export type VisitorSubView = 'DASHBOARD' | 'ALL' | 'NEW' | 'REPEATED' | 'APPOINTMENTS' | 'WALK_IN' | 'GROUP' | 'VIP' | 'EXPECTED' | 'INSIDE' | 'APPROVALS' | 'VERIFICATION_QUEUE' | 'OVERSTAYS' | 'COMPLETED' | 'CANCELLED' | 'HISTORY' | 'PROFILES' | 'TRACEABILITY';
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
    documents: Array<{
        type: string;
        status: 'VERIFIED' | 'PENDING' | 'MISSING';
    }>;
}
export interface VisitorManagementViewProps {
    initialSubView?: VisitorSubView;
    currentRole?: string;
    onNavigateSubView?: (view: VisitorSubView) => void;
}
export declare const VisitorManagementView: React.FC<VisitorManagementViewProps>;
