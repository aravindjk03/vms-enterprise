import React from 'react';
export interface SplitViewProps {
    leftPane: React.ReactNode;
    rightPane: React.ReactNode;
    leftWidth?: string;
    minLeftWidth?: string;
    minRightWidth?: string;
}
export declare const SplitView: React.FC<SplitViewProps>;
