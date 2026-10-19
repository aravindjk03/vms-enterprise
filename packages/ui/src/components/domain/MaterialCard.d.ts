import React from 'react';
export interface MaterialCardProps {
    challanNumber: string;
    movementType: 'INWARD' | 'OUTWARD';
    classification: string;
    transporter: string;
    grossWeightKg?: number;
    tareWeightKg?: number;
    netWeightKg?: number;
    status: string;
    poReference?: string;
}
export declare const MaterialCard: React.FC<MaterialCardProps>;
