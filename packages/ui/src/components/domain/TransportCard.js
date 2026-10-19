import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Compass, Leaf, Car, Fuel, Users, MapPin } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const TransportCard = ({ transportId, sourceTransactionId, mode, vehicleClass, fuelType, distanceKm, distanceProvenance, occupancy, originLocation, destinationLocation, journeyType, isEsgCaptured = true, }) => {
    const getProvenanceBadge = (prov) => {
        switch (prov) {
            case 'MEASURED':
                return { label: 'Measured (Weighbridge/Odometer)', bg: colors.status.success.bg, fg: colors.status.success.fg };
            case 'SYSTEM_ESTIMATED':
            case 'SYSTEM_CALCULATED':
                return { label: 'System Estimated (GIS Route)', bg: colors.status.info.bg, fg: colors.status.info.fg };
            case 'USER_PROVIDED':
                return { label: 'User Provided', bg: colors.status.warning.bg, fg: colors.status.warning.fg };
            default:
                return { label: prov, bg: colors.slate[100], fg: colors.slate[700] };
        }
    };
    const badge = getProvenanceBadge(distanceProvenance);
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '12px 14px',
            backgroundColor: '#ffffff',
            border: `1px solid ${colors.esg[500]}`,
            borderRadius: radius.md,
            gap: '10px',
        }, className: "vms-transport-card", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsx(Compass, { size: 16, color: colors.primary[600] }), _jsx("strong", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: "Mobility Activity" }), _jsx("span", { style: { fontSize: '11px', fontFamily: typography.fontFamily.mono, color: colors.slate[500] }, children: transportId })] }), isEsgCaptured && (_jsxs("span", { style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 6px',
                            borderRadius: radius.sm,
                            backgroundColor: colors.esg[50],
                            color: colors.esg[700],
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                        }, children: [_jsx(Leaf, { size: 11, color: colors.esg[600] }), _jsx("span", { children: "ESG Activity Captured" })] }))] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: typography.fontSize.xs.size }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[700] }, children: [_jsx(Car, { size: 13, color: colors.slate[400] }), _jsxs("span", { children: [mode, " (", vehicleClass, ")"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[700] }, children: [_jsx(Fuel, { size: 13, color: colors.slate[400] }), _jsx("span", { children: fuelType })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[700] }, children: [_jsx(Users, { size: 13, color: colors.slate[400] }), _jsxs("span", { children: ["Occupancy: ", occupancy] })] })] }), _jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingTop: '6px',
                    borderTop: `1px solid ${colors.slate[100]}`,
                    fontSize: '11px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[600] }, children: [_jsx(MapPin, { size: 12, color: colors.slate[400] }), _jsxs("span", { children: [originLocation, " $\\rightarrow$ ", destinationLocation, " (", journeyType, ")"] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '6px' }, children: [_jsxs("strong", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[900] }, children: [distanceKm, " km"] }), _jsx("span", { style: {
                                    padding: '1px 5px',
                                    borderRadius: radius.sm,
                                    backgroundColor: badge.bg,
                                    color: badge.fg,
                                    fontSize: '10px',
                                    fontWeight: 600,
                                }, children: badge.label })] })] })] }));
};
