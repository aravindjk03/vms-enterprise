import React from 'react';
export interface AccordionItem {
    id: string;
    title: string;
    subtitle?: string;
    badge?: React.ReactNode;
    content: React.ReactNode;
    defaultExpanded?: boolean;
}
export interface AccordionProps {
    items: AccordionItem[];
    allowMultiple?: boolean;
    style?: React.CSSProperties;
}
export declare const Accordion: React.FC<AccordionProps>;
