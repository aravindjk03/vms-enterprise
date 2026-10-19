import React from 'react';
export interface EmergencyModalViewProps {
    isOpen: boolean;
    onClose: () => void;
    isSirenActive: boolean;
    onToggleSiren: () => void;
}
export declare const EmergencyModalView: React.FC<EmergencyModalViewProps>;
