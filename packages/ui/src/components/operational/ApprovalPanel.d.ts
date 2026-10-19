import React from 'react';
export interface ApprovalStage {
    stageId: string;
    stageName: string;
    approverName: string;
    approverRole: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ESCALATED';
    timestamp?: string;
    comment?: string;
    slaTimeRemaining?: string;
}
export interface ApprovalPanelProps {
    stages: ApprovalStage[];
    currentStageId?: string;
    canApprove?: boolean;
    canDelegate?: boolean;
    onApprove?: (stageId: string, comment: string) => void;
    onReject?: (stageId: string, comment: string) => void;
    onRequestChanges?: (stageId: string, comment: string) => void;
    onDelegate?: (stageId: string, delegateTo: string) => void;
}
export declare const ApprovalPanel: React.FC<ApprovalPanelProps>;
