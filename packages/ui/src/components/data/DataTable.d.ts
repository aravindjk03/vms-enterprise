import React from 'react';
export interface ColumnDef<T> {
    key: string;
    header: string;
    width?: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    render?: (item: T, index: number) => React.ReactNode;
}
export interface DataTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    isError?: boolean;
    errorMessage?: string;
    onRetry?: () => void;
    emptyTitle?: string;
    emptyDescription?: string;
    density?: 'dense' | 'normal';
    sortColumn?: string;
    sortDirection?: 'asc' | 'desc';
    onSort?: (columnKey: string) => void;
    selectedIds?: string[];
    onSelectIds?: (ids: string[]) => void;
    onRowClick?: (item: T) => void;
    bulkActions?: React.ReactNode;
}
export declare function DataTable<T extends Record<string, unknown>>({ data, columns, keyExtractor, isLoading, isError, errorMessage, onRetry, emptyTitle, emptyDescription, density, sortColumn, sortDirection, onSort, selectedIds, onSelectIds, onRowClick, bulkActions, }: DataTableProps<T>): React.JSX.Element;
