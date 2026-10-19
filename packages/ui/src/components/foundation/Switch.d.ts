import React from 'react';
export interface SwitchProps {
    id?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: string;
    description?: string;
    disabled?: boolean;
}
export declare const Switch: React.FC<SwitchProps>;
