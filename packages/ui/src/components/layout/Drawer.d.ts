import React from 'react';
export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    width?: string;
}
export declare const Drawer: React.FC<DrawerProps>;
