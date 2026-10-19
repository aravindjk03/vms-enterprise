import React from 'react';
export type SearchCategory = 'VISITOR' | 'CUSTOMER' | 'CONTRACTOR' | 'WORKER' | 'VEHICLE' | 'DRIVER' | 'MATERIAL' | 'APPOINTMENT' | 'GATE_PASS' | 'DOCUMENT' | 'TRANSACTION_ID';
export interface SearchResultItem {
    id: string;
    category: SearchCategory;
    title: string;
    subtitle: string;
    details?: string;
    status?: string;
    route?: string;
}
export interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectResult: (result: SearchResultItem) => void;
    dataset?: SearchResultItem[];
}
export declare const GlobalSearch: React.FC<GlobalSearchProps>;
