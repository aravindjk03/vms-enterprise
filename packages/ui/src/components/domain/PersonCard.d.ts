import React from 'react';
export interface PersonCardProps {
    name: string;
    roleOrDesignation?: string;
    company?: string;
    phone?: string;
    email?: string;
    photoUrl?: string;
    isVerified?: boolean;
    status?: string;
}
export declare const PersonCard: React.FC<PersonCardProps>;
