import React from 'react';
export interface FileUploaderProps {
    label?: string;
    helperText?: string;
    accept?: string;
    maxSizeBytes?: number;
    onFileSelect?: (file: File) => void;
    disabled?: boolean;
}
export declare const FileUploader: React.FC<FileUploaderProps>;
