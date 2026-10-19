import React from 'react';
export interface ActivitySustainabilityFormData {
    mode: string;
    ownership: string;
    vehicleClass: string;
    fuelType: string;
    occupancy: number;
    originLocation: string;
    destinationLocation: string;
    distanceKm: number;
    distanceProvenance: 'MEASURED' | 'USER_PROVIDED' | 'SYSTEM_ESTIMATED' | 'SYSTEM_CALCULATED' | 'IMPORTED';
    journeyType: 'ONE_WAY' | 'ROUND_TRIP' | 'MULTI_STOP' | 'LOCAL_CAMPUS';
    fuelProvenance?: string;
}
export interface ActivitySustainabilityCaptureProps {
    data: ActivitySustainabilityFormData;
    onChange: (updated: ActivitySustainabilityFormData) => void;
    disabled?: boolean;
}
export declare const ActivitySustainabilityCapture: React.FC<ActivitySustainabilityCaptureProps>;
