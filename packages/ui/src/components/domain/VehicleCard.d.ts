import React from 'react';
export interface VehicleCardProps {
    registrationPlate: string;
    vehicleClass: string;
    driverName: string;
    transporter?: string;
    odometerKm?: number;
    status: string;
    pucExpired?: boolean;
    insuranceExpired?: boolean;
}
export declare const VehicleCard: React.FC<VehicleCardProps>;
