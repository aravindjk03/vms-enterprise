import React from 'react';
export interface TimelineEventItem {
    id: string;
    time: string;
    date?: string;
    title: string;
    description?: string;
    actor?: string;
    status?: 'COMPLETED' | 'PENDING' | 'ALERT' | 'SKIPPED';
    iconType?: 'CHECK' | 'CLOCK' | 'SECURITY' | 'GATE_ENTRY' | 'GATE_EXIT' | 'DOCUMENT' | 'ALERT';
}
export interface TimelineProps {
    events: TimelineEventItem[];
    title?: string;
}
export declare const Timeline: React.FC<TimelineProps>;
