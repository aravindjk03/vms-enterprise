import React from 'react';
export interface RadioOption {
    label: string;
    value: string;
    description?: string;
    disabled?: boolean;
}
export interface RadioGroupProps {
    name: string;
    label?: string;
    options: RadioOption[];
    value?: string;
    onChange: (value: string) => void;
    orientation?: 'horizontal' | 'vertical';
    disabled?: boolean;
    isRequired?: boolean;
    error?: string;
    helperText?: string;
    style?: React.CSSProperties;
}
export declare const RadioGroup: React.FC<RadioGroupProps>;
