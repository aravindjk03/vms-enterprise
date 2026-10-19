import React from 'react';
export type DashboardWidgetType = 'KPI' | 'CHART' | 'TABLE' | 'TIMELINE' | 'ALERT' | 'MAP' | 'OCCUPANCY' | 'ACTIVITY' | 'APPROVAL' | 'COMPLIANCE' | 'TREND' | 'STATUS' | 'HEATMAP';
export interface DashboardFilterBarProps {
    dateRange?: string;
    onDateRangeChange?: (range: string) => void;
    selectedDomain?: string;
    onDomainChange?: (domain: string) => void;
    selectedGate?: string;
    onGateChange?: (gate: string) => void;
    onRefresh?: () => void;
    onExport?: () => void;
    isRefreshing?: boolean;
    style?: React.CSSProperties;
}
export declare const DashboardFilterBar: React.FC<DashboardFilterBarProps>;
export interface DashboardWidgetProps {
    title: string;
    type: DashboardWidgetType;
    subtitle?: string;
    badge?: React.ReactNode;
    headerAction?: React.ReactNode;
    children?: React.ReactNode;
    spanCols?: number;
    style?: React.CSSProperties;
}
export declare const DashboardWidget: React.FC<DashboardWidgetProps>;
export declare const DashboardGrid: React.FC<{
    columns?: number;
    gap?: string;
    children: React.ReactNode;
    style?: React.CSSProperties;
}>;
