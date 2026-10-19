import React from 'react';
export interface AlertProps {
    severity?: 'critical' | 'high' | 'warning' | 'info' | 'success';
    title?: string;
    children: React.ReactNode;
    onClose?: () => void;
    action?: React.ReactNode;
}
export declare const Alert: React.FC<AlertProps>;
