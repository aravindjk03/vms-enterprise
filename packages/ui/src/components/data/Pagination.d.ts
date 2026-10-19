import React from 'react';
export interface PaginationProps {
    currentPage: number;
    totalRecords: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}
export declare const Pagination: React.FC<PaginationProps>;
