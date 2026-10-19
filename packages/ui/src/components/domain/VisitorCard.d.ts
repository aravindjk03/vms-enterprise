import React from 'react';
export interface VisitorCardProps {
    transactionId: string;
    visitorName: string;
    company?: string;
    purpose: string;
    hostName: string;
    scheduledTime: string;
    status: string;
    gatePassId?: string;
    onPrintBadge?: () => void;
    onClick?: () => void;
}
export declare const VisitorCard: React.FC<VisitorCardProps>;
