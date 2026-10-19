import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Truck, User, Gauge, ShieldAlert } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';
export const VehicleCard = ({ registrationPlate, vehicleClass, driverName, transporter, odometerKm, status, pucExpired = false, insuranceExpired = false, }) => {
    const hasComplianceAlert = pucExpired || insuranceExpired;
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${hasComplianceAlert ? colors.status.danger.solid : colors.slate[200]}`,
            borderRadius: radius.md,
            gap: '8px',
        }, className: "vms-vehicle-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Truck, { size: 18, color: colors.primary[600] }), _jsx("strong", { style: {
                                    fontFamily: typography.fontFamily.mono,
                                    fontSize: typography.fontSize.md.size,
                                    color: colors.slate[900],
                                    letterSpacing: '0.04em',
                                }, children: registrationPlate })] }), _jsx(StatusBadge, { status: status, size: "micro" })] }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' }, children: [_jsx(User, { size: 12, color: colors.slate[400] }), _jsxs("span", { children: ["Driver: ", _jsx("strong", { children: driverName })] }), transporter && _jsxs("span", { children: ["(", transporter, ")"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }, children: [_jsxs("span", { children: ["Class: ", vehicleClass] }), odometerKm !== undefined && (_jsxs("span", { style: { display: 'flex', alignItems: 'center', gap: '3px' }, children: [_jsx(Gauge, { size: 11 }), " ", odometerKm.toLocaleString(), " km"] }))] })] }), hasComplianceAlert && (_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: colors.status.danger.bg,
                    color: colors.status.danger.fg,
                    padding: '4px 8px',
                    borderRadius: radius.sm,
                    fontSize: '11px',
                    fontWeight: 600,
                }, children: [_jsx(ShieldAlert, { size: 12 }), _jsxs("span", { children: ["Compliance Alert: ", pucExpired ? 'PUC Expired' : '', " ", insuranceExpired ? 'Insurance Expired' : ''] })] }))] }));
};
