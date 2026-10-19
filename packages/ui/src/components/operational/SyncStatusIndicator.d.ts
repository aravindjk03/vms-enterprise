import React from 'react';
export type GateSyncState = 'ONLINE' | 'OFFLINE' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT';
export interface SyncStatusIndicatorProps {
    state: GateSyncState;
    pendingCount?: number;
    lastSyncTime?: string;
    onSyncTrigger?: () => void;
    compact?: boolean;
    style?: React.CSSProperties;
}
export declare const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps>;
