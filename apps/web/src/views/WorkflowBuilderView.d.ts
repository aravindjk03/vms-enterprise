import React from 'react';
import type { EnterpriseRole } from '@vms/types';
export interface WorkflowBuilderViewProps {
    userRole?: EnterpriseRole;
    tenantId?: string;
}
export declare const WorkflowBuilderView: React.FC<WorkflowBuilderViewProps>;
