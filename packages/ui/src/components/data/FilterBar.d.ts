import React from 'react';
export interface FilterBarProps {
    searchValue: string;
    onSearchChange: (val: string) => void;
    statusFilter?: string;
    onStatusFilterChange?: (val: string) => void;
    statusOptions?: {
        label: string;
        value: string;
    }[];
    dateFilter?: string;
    onDateFilterChange?: (val: string) => void;
    density?: 'dense' | 'normal';
    onDensityToggle?: () => void;
    onExport?: () => void;
    onToggleColumns?: () => void;
    activeFilterCount?: number;
    onClearFilters?: () => void;
    savedViews?: string[];
    selectedView?: string;
    onViewChange?: (view: string) => void;
}
export declare const FilterBar: React.FC<FilterBarProps>;
