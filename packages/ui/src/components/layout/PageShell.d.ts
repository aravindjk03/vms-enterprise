import React from 'react';
export interface PageShellBreadcrumb {
    label: string;
    href?: string;
    onClick?: () => void;
}
export interface PageShellProps {
    breadcrumbs?: (string | PageShellBreadcrumb)[];
    title: string;
    description?: string;
    badge?: React.ReactNode;
    actions?: React.ReactNode;
    filters?: React.ReactNode;
    children?: React.ReactNode;
    rightPanel?: React.ReactNode;
    isRightPanelOpen?: boolean;
    style?: React.CSSProperties;
}
export declare const PageShell: React.FC<PageShellProps>;
