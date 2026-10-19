import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FileText, Download, CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const DocumentCard = ({ documentId, documentType, originalFileName, fileSizeBytes, verificationStatus, expiryDate, onDownload, }) => {
    const formatSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    const getStatusBadge = () => {
        switch (verificationStatus) {
            case 'VERIFIED':
                return { label: 'Verified', bg: colors.status.success.bg, fg: colors.status.success.fg, icon: _jsx(CheckCircle2, { size: 12 }) };
            case 'EXPIRED':
                return { label: 'Expired', bg: colors.status.danger.bg, fg: colors.status.danger.fg, icon: _jsx(XCircle, { size: 12 }) };
            case 'REJECTED':
                return { label: 'Rejected', bg: colors.status.danger.bg, fg: colors.status.danger.fg, icon: _jsx(AlertTriangle, { size: 12 }) };
            case 'PENDING':
            default:
                return { label: 'Pending Review', bg: colors.status.warning.bg, fg: colors.status.warning.fg, icon: _jsx(Clock, { size: 12 }) };
        }
    };
    const badge = getStatusBadge();
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            gap: '12px',
        }, className: "vms-document-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }, children: [_jsx(FileText, { size: 20, color: colors.primary[600], style: { flexShrink: 0 } }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 700, color: colors.slate[900], textTransform: 'uppercase' }, children: documentType }), _jsxs("span", { style: {
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '3px',
                                            padding: '1px 6px',
                                            borderRadius: radius.sm,
                                            backgroundColor: badge.bg,
                                            color: badge.fg,
                                            fontSize: '10px',
                                            fontWeight: 600,
                                        }, children: [badge.icon, _jsx("span", { children: badge.label })] })] }), _jsxs("span", { style: {
                                    fontSize: typography.fontSize.xs.size,
                                    color: colors.slate[600],
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    overflow: 'hidden',
                                }, children: [originalFileName, " (", formatSize(fileSizeBytes), ")"] }), expiryDate && (_jsxs("span", { style: { fontSize: '11px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }, children: ["Expires: ", expiryDate] }))] })] }), onDownload && (_jsx("button", { type: "button", "aria-label": "Download document", onClick: onDownload, style: {
                    background: 'none',
                    border: `1px solid ${colors.slate[300]}`,
                    borderRadius: radius.sm,
                    padding: '6px',
                    cursor: 'pointer',
                    color: colors.slate[700],
                    display: 'flex',
                    alignItems: 'center',
                }, children: _jsx(Download, { size: 14 }) }))] }));
};
