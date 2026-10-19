import React from 'react';
export interface TransportCardProps {
    transportId: string;
    sourceTransactionId: string;
    mode: string;
    vehicleClass: string;
    fuelType: string;
    distanceKm: number;
    distanceProvenance: 'MEASURED' | 'USER_PROVIDED' | 'SYSTEM_ESTIMATED' | 'SYSTEM_CALCULATED' | 'IMPORTED';
    occupancy: number;
    originLocation: string;
    destinationLocation: string;
    journeyType: string;
    isEsgCaptured?: boolean;
}
export declare const TransportCard: React.FC<TransportCardProps>;
