import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { User, ShieldCheck, Phone, Mail, Building } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';
export const PersonCard = ({ name, roleOrDesignation, company, phone, email, photoUrl, isVerified = true, status, }) => {
    return (_jsxs("div", { style: {
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
        }, className: "vms-person-card", children: [_jsxs("div", { style: {
                    width: '48px',
                    height: '48px',
                    borderRadius: radius.full,
                    backgroundColor: colors.slate[100],
                    border: `1.5px solid ${isVerified ? colors.status.success.solid : colors.slate[300]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    flexShrink: 0,
                    position: 'relative',
                }, children: [photoUrl ? (_jsx("img", { src: photoUrl, alt: name, style: { width: '100%', height: '100%', objectFit: 'cover' } })) : (_jsx(User, { size: 24, color: colors.slate[500] })), isVerified && (_jsx("span", { title: "Identity Verified", style: {
                            position: 'absolute',
                            bottom: '-2px',
                            right: '-2px',
                            backgroundColor: '#ffffff',
                            borderRadius: radius.full,
                            padding: '1px',
                            display: 'flex',
                        }, children: _jsx(ShieldCheck, { size: 14, color: colors.status.success.solid }) }))] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }, children: [_jsx("strong", { style: {
                                    fontSize: typography.fontSize.base.size,
                                    color: colors.slate[900],
                                    fontWeight: typography.fontWeight.bold,
                                }, children: name }), status && _jsx(StatusBadge, { status: status, size: "micro" })] }), (roleOrDesignation || company) && (_jsxs("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600], display: 'flex', alignItems: 'center', gap: '4px' }, children: [company && _jsx(Building, { size: 12 }), roleOrDesignation ? `${roleOrDesignation} • ${company || ''}` : company] })), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '11px', color: colors.slate[500] }, children: [phone && (_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '3px' }, children: [_jsx(Phone, { size: 11 }), " ", phone] })), email && (_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '3px' }, children: [_jsx(Mail, { size: 11 }), " ", email] }))] })] })] }));
};
