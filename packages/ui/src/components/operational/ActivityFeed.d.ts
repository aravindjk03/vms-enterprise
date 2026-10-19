import React from 'react';
export interface ActivityItem {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    entityType: 'VISITOR' | 'CONTRACTOR' | 'VEHICLE' | 'MATERIAL' | 'GATE' | 'SECURITY' | 'ESG' | 'SYSTEM';
    entityId: string;
    details?: string;
    severity?: 'NORMAL' | 'WARN' | 'CRITICAL';
}
export interface ActivityFeedProps {
    items: ActivityItem[];
    title?: string;
    maxItems?: number;
    onItemClick?: (item: ActivityItem) => void;
    style?: React.CSSProperties;
}
export declare const ActivityFeed: React.FC<ActivityFeedProps>;
