import React from 'react';
import type { EnterpriseRole } from '@vms/types';
export interface TaskCenterViewProps {
    userRole?: EnterpriseRole;
    userId?: string;
    tenantId?: string;
}
export declare const TaskCenterView: React.FC<TaskCenterViewProps>;
