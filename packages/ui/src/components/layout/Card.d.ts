import React from 'react';
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    subtitle?: string;
    headerAction?: React.ReactNode;
    footer?: React.ReactNode;
    variant?: 'default' | 'sunken' | 'elevated' | 'alert' | 'esg';
    dense?: boolean;
}
export declare const Card: React.FC<CardProps>;
