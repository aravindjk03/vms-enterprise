import React from 'react';
export interface GateDecisionSubject {
    identifier: string;
    name: string;
    domain: 'VISITOR' | 'CONTRACTOR' | 'VEHICLE' | 'MATERIAL';
    company?: string;
    passValid: boolean;
    inductionValid: boolean;
    zoneAuthorized: boolean;
    rejectionReasons?: string[];
    photoUrl?: string;
}
export interface GateDecisionPanelProps {
    laneName: string;
    gateType: string;
    subject?: GateDecisionSubject | null;
    onAllow: () => void;
    onDeny: (reason: string) => void;
    onClear: () => void;
    onReprint?: () => void;
    isProcessing?: boolean;
}
export declare const GateDecisionPanel: React.FC<GateDecisionPanelProps>;
