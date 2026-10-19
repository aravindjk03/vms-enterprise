import React from 'react';
import { type ColumnDef } from '@vms/ui';
export interface GenericDomainListViewProps {
    domainTitle: string;
    domainDescription: string;
    data: Record<string, any>[];
    columns: ColumnDef<Record<string, any>>[];
    onNewRecord?: () => void;
    onOpenDetail?: (item: Record<string, any>) => void;
    requiredCapability?: string;
}
export declare const GenericDomainListView: React.FC<GenericDomainListViewProps>;
