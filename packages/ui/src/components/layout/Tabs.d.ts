import React from 'react';
export interface TabItem {
    id: string;
    label: string;
    badge?: string | number;
    icon?: React.ReactNode;
    disabled?: boolean;
}
export interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    variant?: 'underline' | 'pills';
}
export declare const Tabs: React.FC<TabsProps>;
