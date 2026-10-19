import React from 'react';
export interface BannerProps {
    type?: 'emergency' | 'system' | 'maintenance';
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
    onDismiss?: () => void;
    isPersistent?: boolean;
}
export declare const Banner: React.FC<BannerProps>;
