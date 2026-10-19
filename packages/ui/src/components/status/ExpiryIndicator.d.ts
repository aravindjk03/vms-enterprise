import React from 'react';
export type DocumentLifecycleStatus = 'VALID' | 'EXPIRING_SOON' | 'EXPIRED' | 'PENDING_VERIFICATION' | 'REJECTED' | 'MISSING';
export interface ExpiryIndicatorProps {
    documentName: string;
    status: DocumentLifecycleStatus;
    expiryDate?: string;
    daysRemaining?: number;
}
export declare const ExpiryIndicator: React.FC<ExpiryIndicatorProps>;
