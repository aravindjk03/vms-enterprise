import React from 'react';
export interface ProgressProps {
    value: number;
    max?: number;
    label?: string;
    showPercent?: boolean;
    color?: string;
    height?: number;
}
export declare const Progress: React.FC<ProgressProps>;
