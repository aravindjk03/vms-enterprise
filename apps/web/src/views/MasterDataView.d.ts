import React from 'react';
import type { EnterpriseRole } from '@vms/types';
export interface MasterDataViewProps {
    userRole?: EnterpriseRole;
    tenantId?: string;
    onRecordAuditView?: (recordId: string) => void;
}
export declare const MasterDataView: React.FC<MasterDataViewProps>;
