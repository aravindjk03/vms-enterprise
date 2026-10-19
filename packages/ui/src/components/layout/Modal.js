import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { colors, overlay, radius, shadows, typography } from '../../tokens.js';
export const Modal = ({ isOpen, onClose, title, description, children, footer, maxWidth = '560px', }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);
    if (!isOpen)
        return null;
    return (_jsxs("div", { style: {
            position: 'fixed',
            inset: 0,
            zIndex: 1100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
        }, children: [_jsx("div", { "aria-hidden": "true", onClick: onClose, style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: overlay.modalBackdrop,
                } }), _jsxs("div", { role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title", style: {
                    position: 'relative',
                    width: '100%',
                    maxWidth,
                    backgroundColor: '#ffffff',
                    borderRadius: radius.lg,
                    boxShadow: shadows.modal,
                    overflow: 'hidden',
                    zIndex: 1101,
                    display: 'flex',
                    flexDirection: 'column',
                    maxHeight: '90vh',
                }, children: [_jsxs("div", { style: {
                            padding: '16px 20px',
                            borderBottom: `1px solid ${colors.slate[200]}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                        }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("h2", { id: "modal-title", style: {
                                            margin: 0,
                                            fontSize: typography.fontSize.lg.size,
                                            fontWeight: typography.fontWeight.bold,
                                            color: colors.slate[900],
                                        }, children: title }), description && (_jsx("p", { style: { margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600] }, children: description }))] }), _jsx("button", { type: "button", "aria-label": "Close dialog", onClick: onClose, style: {
                                    background: 'none',
                                    border: 'none',
                                    padding: '6px',
                                    borderRadius: radius.sm,
                                    cursor: 'pointer',
                                    color: colors.slate[500],
                                }, children: _jsx(X, { size: 18 }) })] }), _jsx("div", { style: { padding: '20px', overflowY: 'auto', flex: 1 }, children: children }), footer && (_jsx("div", { style: {
                            padding: '12px 20px',
                            borderTop: `1px solid ${colors.slate[200]}`,
                            backgroundColor: colors.slate[50],
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '10px',
                        }, children: footer }))] })] }));
};
