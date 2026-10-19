import React from 'react';
export interface DocumentCardProps {
    documentId: string;
    documentType: string;
    originalFileName: string;
    fileSizeBytes: number;
    verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
    expiryDate?: string;
    onDownload?: () => void;
}
export declare const DocumentCard: React.FC<DocumentCardProps>;
