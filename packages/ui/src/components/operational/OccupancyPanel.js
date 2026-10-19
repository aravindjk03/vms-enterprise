import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Users, AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Progress } from '../status/Progress.js';
export const OccupancyPanel = ({ stats, siteName }) => {
    const occupancyPercent = Math.round((stats.totalInside / stats.maxCapacity) * 100);
    const isHighOccupancy = occupancyPercent >= 90;
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            padding: '16px',
            backgroundColor: '#ffffff',
            border: `1px solid ${isHighOccupancy ? colors.status.warning.solid : colors.slate[200]}`,
            borderRadius: radius.md,
            gap: '14px',
        }, className: "vms-occupancy-panel", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Users, { size: 18, color: colors.primary[600] }), _jsxs("div", { children: [_jsx("h4", { style: { margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: "Live Facility Occupancy" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: siteName })] })] }), stats.overstayCount > 0 && (_jsxs("span", { style: {
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '2px 8px',
                            backgroundColor: colors.status.danger.bg,
                            color: colors.status.danger.fg,
                            border: `1px solid ${colors.status.danger.border}`,
                            borderRadius: radius.sm,
                            fontSize: '11px',
                            fontWeight: 700,
                        }, children: [_jsx(AlertTriangle, { size: 12 }), stats.overstayCount, " Overstay Alert"] }))] }), _jsxs("div", { style: { display: 'flex', alignItems: 'baseline', gap: '8px' }, children: [_jsx("span", { style: {
                            fontSize: typography.fontSize['3xl'].size,
                            fontWeight: 800,
                            color: colors.slate[900],
                            letterSpacing: '-0.02em',
                        }, children: stats.totalInside.toLocaleString() }), _jsxs("span", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[500] }, children: ["/ ", stats.maxCapacity.toLocaleString(), " Max Capacity"] })] }), _jsx(Progress, { value: stats.totalInside, max: stats.maxCapacity, showPercent: true, color: isHighOccupancy ? colors.status.warning.solid : colors.primary[600] }), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '8px',
                    paddingTop: '8px',
                    borderTop: `1px solid ${colors.slate[100]}`,
                    textAlign: 'center',
                }, children: [_jsxs("div", { children: [_jsx("span", { style: { fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }, children: "Staff" }), _jsx("div", { style: { fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: stats.staffCount })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }, children: "Contractors" }), _jsx("div", { style: { fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: stats.contractorCount })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }, children: "Visitors" }), _jsx("div", { style: { fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: stats.visitorCount })] }), _jsxs("div", { children: [_jsx("span", { style: { fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }, children: "Vehicles" }), _jsx("div", { style: { fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: stats.vehiclesInside })] })] })] }));
};
