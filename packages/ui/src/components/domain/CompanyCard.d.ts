import React from 'react';
export interface CompanyCardProps {
    name: string;
    vendorCode: string;
    tradeCategory: string;
    status: 'active' | 'blocked' | 'pending' | 'approved';
    activeWorkers?: number;
    totalAuthorizedWorkers?: number;
    ehsComplianceScore?: number;
    contactPerson?: string;
    contactPhone?: string;
    facilityLocation?: string;
    onClick?: () => void;
    style?: React.CSSProperties;
}
export declare const CompanyCard: React.FC<CompanyCardProps>;
