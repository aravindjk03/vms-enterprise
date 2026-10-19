import React from 'react';
export interface PanelProps {
    title?: string;
    subtitle?: string;
    onClose?: () => void;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
    style?: React.CSSProperties;
}
export declare const Panel: React.FC<PanelProps>;
