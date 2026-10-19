import React from 'react';
export interface ComboboxOption {
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
}
export interface ComboboxProps {
    label?: string;
    options: ComboboxOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    isRequired?: boolean;
    error?: string;
    helperText?: string;
    style?: React.CSSProperties;
}
export declare const Combobox: React.FC<ComboboxProps>;
