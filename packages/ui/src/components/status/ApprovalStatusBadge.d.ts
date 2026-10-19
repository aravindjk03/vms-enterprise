import React from 'react';
export type ApprovalStageStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED' | 'SKIPPED';
export interface ApprovalStatusBadgeProps {
    stageName: string;
    approverRole?: string;
    approverName?: string;
    status: ApprovalStageStatus;
    slaTimeRemaining?: string;
}
export declare const ApprovalStatusBadge: React.FC<ApprovalStatusBadgeProps>;
