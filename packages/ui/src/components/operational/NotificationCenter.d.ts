import React from 'react';
export interface NotificationItem {
    id: string;
    category: 'APPROVAL' | 'SECURITY' | 'DOCUMENT' | 'SAFETY' | 'GATE' | 'EMERGENCY' | 'ESG' | 'SYSTEM';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    message: string;
    timestamp: string;
    isRead: boolean;
    sourceTransactionId?: string;
    actionUrl?: string;
}
export interface NotificationCenterProps {
    notifications: NotificationItem[];
    onMarkAsRead?: (id: string) => void;
    onMarkAllAsRead?: () => void;
    onNavigate?: (url: string) => void;
}
export declare const NotificationCenter: React.FC<NotificationCenterProps>;
