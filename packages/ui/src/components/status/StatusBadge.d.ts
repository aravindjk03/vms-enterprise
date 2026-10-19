import React from 'react';
export type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'pending' | 'neutral' | 'blocked' | 'expired' | 'draft' | 'approved' | 'rejected' | 'active' | 'inactive' | 'overdue' | 'ON_PREMISES' | 'CHECKED_OUT' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'CONFIRMED' | 'IN_PROGRESS';
export interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    size?: 'micro' | 'sm' | 'md';
    icon?: boolean;
}
export declare const StatusBadge: React.FC<StatusBadgeProps>;
