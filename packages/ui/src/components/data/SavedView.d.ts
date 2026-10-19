import React from 'react';
export interface SavedViewItem {
    id: string;
    name: string;
    isDefault?: boolean;
    filterCount?: number;
}
export interface SavedViewProps {
    views: SavedViewItem[];
    activeViewId: string;
    onSelectView: (viewId: string) => void;
    onSaveCurrentView?: (name: string) => void;
    onDeleteView?: (viewId: string) => void;
    style?: React.CSSProperties;
}
export declare const SavedView: React.FC<SavedViewProps>;
