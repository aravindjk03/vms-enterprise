import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect } from 'react';
import { X } from 'lucide-react';
import { colors, overlay, shadows, typography } from '../../tokens.js';
export const Drawer = ({ isOpen, onClose, title, subtitle, children, footer, width = '440px', }) => {
    // Close on Escape key
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
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
        }, children: [_jsx("div", { "aria-hidden": "true", onClick: onClose, style: {
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: overlay.dimmer,
                    transition: 'opacity 150ms ease',
                } }), _jsxs("aside", { role: "dialog", "aria-modal": "true", "aria-labelledby": "drawer-title", style: {
                    position: 'relative',
                    width,
                    maxWidth: '100vw',
                    height: '100%',
                    backgroundColor: '#ffffff',
                    boxShadow: shadows.modal,
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 1001,
                    animation: 'slideInRight 150ms ease-out',
                }, children: [_jsxs("div", { style: {
                            padding: '16px 20px',
                            borderBottom: `1px solid ${colors.slate[200]}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                        }, children: [_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px' }, children: [_jsx("h2", { id: "drawer-title", style: {
                                            margin: 0,
                                            fontSize: typography.fontSize.lg.size,
                                            fontWeight: typography.fontWeight.bold,
                                            color: colors.slate[900],
                                        }, children: title }), subtitle && (_jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: subtitle }))] }), _jsx("button", { type: "button", "aria-label": "Close drawer", onClick: onClose, style: {
                                    background: 'none',
                                    border: 'none',
                                    padding: '6px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: colors.slate[500],
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }, children: _jsx(X, { size: 18 }) })] }), _jsx("div", { style: {
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                        }, children: children }), footer && (_jsx("div", { style: {
                            padding: '14px 20px',
                            borderTop: `1px solid ${colors.slate[200]}`,
                            backgroundColor: colors.slate[50],
                        }, children: footer }))] })] }));
};
