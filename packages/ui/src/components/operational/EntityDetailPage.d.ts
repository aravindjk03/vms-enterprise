import React from 'react';
import { type TimelineEventItem } from './Timeline.js';
export interface EntityActivityTrace {
    activityId: string;
    sourceTransactionId: string;
    activityType: string;
    status: 'CAPTURED' | 'PENDING' | 'CALCULATED';
    mode: string;
    distanceKm: number;
    occupancy?: number;
    provenance: string;
    scopeCategory?: string;
    calculatedEmissions?: string;
}
export interface EntityDetailPageProps {
    entityId: string;
    title: string;
    subtitle?: string;
    status: string;
    entityType: 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'VEHICLE' | 'MATERIAL' | 'GATE_PASS';
    onBack: () => void;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
    overviewFields: {
        label: string;
        value: React.ReactNode;
    }[];
    timelineEvents?: TimelineEventItem[];
    activityTrace?: EntityActivityTrace;
    documents?: {
        name: string;
        status: string;
        expiry?: string;
        type: string;
    }[];
    accessPermissions?: {
        zone: string;
        status: string;
        gate: string;
        validUntil: string;
    }[];
    auditInfo?: {
        createdBy: string;
        createdAt: string;
        lastUpdatedBy: string;
        lastUpdatedAt: string;
        sourceTransaction: string;
        policyDecision: string;
    };
}
export declare const EntityDetailPage: React.FC<EntityDetailPageProps>;
