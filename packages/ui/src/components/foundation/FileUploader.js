import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, X } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const FileUploader = ({ label, helperText = 'PDF, PNG, JPG up to 10MB', accept = '.pdf,.png,.jpg,.jpeg', onFileSelect, disabled = false, }) => {
    const inputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const handleFile = (file) => {
        setSelectedFile(file);
        if (onFileSelect) {
            onFileSelect(file);
        }
    };
    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled)
            return;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };
    const formatSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', width: '100%' }, children: [label && (_jsx("span", { style: {
                    fontSize: typography.fontSize.sm.size,
                    fontWeight: typography.fontWeight.semibold,
                    color: colors.slate[700],
                }, children: label })), _jsx("input", { ref: inputRef, type: "file", accept: accept, disabled: disabled, style: { display: 'none' }, onChange: (e) => {
                    if (e.target.files && e.target.files[0]) {
                        handleFile(e.target.files[0]);
                    }
                } }), !selectedFile ? (_jsxs("div", { role: "button", tabIndex: 0, "aria-label": label || 'Upload file', onClick: () => !disabled && inputRef.current?.click(), onKeyDown: (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        inputRef.current?.click();
                    }
                }, onDragOver: (e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }, onDragLeave: () => setIsDragging(false), onDrop: handleDrop, style: {
                    border: `1.5px dashed ${isDragging ? colors.primary[600] : colors.slate[300]}`,
                    backgroundColor: isDragging ? colors.primary[50] : colors.slate[50],
                    borderRadius: radius.md,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 120ms ease',
                }, children: [_jsx(UploadCloud, { size: 24, color: isDragging ? colors.primary[600] : colors.slate[400] }), _jsx("span", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[700], fontWeight: 500 }, children: "Click or drag file to upload" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[400] }, children: helperText })] })) : (_jsxs("div", { style: {
                    border: `1px solid ${colors.slate[300]}`,
                    borderRadius: radius.md,
                    padding: '10px 12px',
                    backgroundColor: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }, children: [_jsx(FileText, { size: 20, color: colors.primary[600] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', overflow: 'hidden' }, children: [_jsx("span", { style: {
                                            fontSize: typography.fontSize.sm.size,
                                            fontWeight: 600,
                                            color: colors.slate[900],
                                            whiteSpace: 'nowrap',
                                            textOverflow: 'ellipsis',
                                            overflow: 'hidden',
                                        }, children: selectedFile.name }), _jsxs("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: [formatSize(selectedFile.size), " \u2022 ", _jsx(CheckCircle2, { size: 12, color: colors.status.success.solid, style: { display: 'inline', verticalAlign: '-1px' } }), " Ready"] })] })] }), _jsx("button", { type: "button", "aria-label": "Remove uploaded file", onClick: () => setSelectedFile(null), style: {
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: colors.slate[400],
                            padding: '4px',
                        }, children: _jsx(X, { size: 16 }) })] }))] }));
};
