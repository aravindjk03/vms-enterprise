import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Building2, Users, MapPin, Award } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';
export const CompanyCard = ({ name, vendorCode, tradeCategory, status, activeWorkers = 0, totalAuthorizedWorkers = 0, ehsComplianceScore, contactPerson, contactPhone, facilityLocation, onClick, style, }) => {
    return (_jsxs("div", { onClick: onClick, style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '14px 16px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.slate[200]}`,
            borderRadius: radius.md,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            gap: '12px',
            cursor: onClick ? 'pointer' : 'default',
            transition: 'border-color 120ms ease, box-shadow 120ms ease',
            ...style,
        }, className: "vms-company-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '10px' }, children: [_jsx("div", { style: {
                                    padding: '8px',
                                    backgroundColor: colors.slate[100],
                                    borderRadius: radius.sm,
                                    color: colors.primary[700],
                                    display: 'flex',
                                }, children: _jsx(Building2, { size: 20 }) }), _jsxs("div", { children: [_jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900], display: 'block' }, children: name }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.slate[500] }, children: [_jsx("span", { style: { fontFamily: typography.fontFamily.mono }, children: vendorCode }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: tradeCategory })] })] })] }), _jsx(StatusBadge, { status: status, size: "sm" })] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: colors.slate[50],
                    borderRadius: radius.sm,
                    fontSize: typography.fontSize.xs.size,
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(Users, { size: 14, color: colors.slate[500] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500], fontSize: '10px', display: 'block' }, children: "ON SITE / ROSTER" }), _jsxs("strong", { style: { color: colors.slate[900] }, children: [activeWorkers, " / ", totalAuthorizedWorkers] })] })] }), ehsComplianceScore !== undefined && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(Award, { size: 14, color: ehsComplianceScore >= 90 ? colors.status.success.solid : colors.status.warning.solid }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500], fontSize: '10px', display: 'block' }, children: "EHS COMPLIANCE" }), _jsx("strong", { style: { color: ehsComplianceScore >= 90 ? colors.status.success.solid : colors.status.warning.solid }, children: `${ehsComplianceScore}%` })] })] }))] }), (contactPerson || facilityLocation) && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: colors.slate[500] }, children: [contactPerson && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx("span", { children: "POC:" }), _jsx("span", { style: { color: colors.slate[800], fontWeight: 500 }, children: contactPerson }), contactPhone && _jsxs("span", { children: ["(", contactPhone, ")"] })] })), facilityLocation && (_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(MapPin, { size: 11 }), _jsx("span", { children: facilityLocation })] }))] }))] }));
};
