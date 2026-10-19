import React from 'react';
export interface DateTimePickerProps {
    label?: string;
    value?: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    isRequired?: boolean;
    minDate?: string;
    maxDate?: string;
    error?: string;
    helperText?: string;
    showPresets?: boolean;
    style?: React.CSSProperties;
}
export declare const DateTimePicker: React.FC<DateTimePickerProps>;
