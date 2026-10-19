import React from 'react';
export interface SectionProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    divider?: boolean;
}
export declare const Section: React.FC<SectionProps>;
