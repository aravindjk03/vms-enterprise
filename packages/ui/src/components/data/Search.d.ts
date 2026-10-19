import React from 'react';
export interface SearchProps {
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    isLoading?: boolean;
    onClear?: () => void;
    width?: string;
    autoFocus?: boolean;
    style?: React.CSSProperties;
}
export declare const Search: React.FC<SearchProps>;
