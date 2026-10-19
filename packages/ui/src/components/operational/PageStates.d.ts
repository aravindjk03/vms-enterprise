import React from 'react';
export interface StateViewProps {
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
}
export declare const LoadingStateView: React.FC<{
    message?: string;
}>;
export declare const EmptyStateView: React.FC<StateViewProps>;
export declare const NoPermissionStateView: React.FC<{
    requiredRoleOrCapability?: string;
    onGoBack?: () => void;
}>;
export declare const ErrorStateView: React.FC<{
    errorTitle?: string;
    errorMessage?: string;
    onRetry?: () => void;
}>;
export declare const NotFoundStateView: React.FC<{
    entityName?: string;
    searchId?: string;
    onGoBack?: () => void;
}>;
export declare const ValidationErrorStateView: React.FC<{
    errors: string[];
    onCorrect?: () => void;
}>;
export declare const NetworkErrorStateView: React.FC<{
    onRetry?: () => void;
}>;
export declare const ServerErrorStateView: React.FC<{
    incidentId?: string;
    onRetry?: () => void;
}>;
export declare const OfflineStateView: React.FC<{
    pendingTransactions?: number;
    onSync?: () => void;
}>;
export declare const SyncPendingStateView: React.FC<{
    count: number;
    onSyncAll?: () => void;
}>;
export declare const SessionExpiredStateView: React.FC<{
    onRelogin?: () => void;
}>;
