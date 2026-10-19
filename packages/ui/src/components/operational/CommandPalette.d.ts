import React from 'react';
export interface CommandItem {
    id: string;
    category: 'ACTIONS' | 'NAVIGATION' | 'EMERGENCY' | 'SEARCH';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    shortcut?: string;
    onSelect: () => void;
}
export interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    commands?: CommandItem[];
    onNavigate?: (path: string) => void;
}
export declare const CommandPalette: React.FC<CommandPaletteProps>;
