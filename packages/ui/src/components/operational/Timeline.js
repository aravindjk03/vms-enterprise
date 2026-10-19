import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, Clock, ShieldCheck, DoorOpen, LogOut, FileText, AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
export const Timeline = ({ events, title }) => {
    const renderIcon = (type, status) => {
        const iconColor = status === 'ALERT'
            ? colors.status.danger.solid
            : status === 'PENDING'
                ? colors.status.warning.solid
                : colors.status.success.solid;
        switch (type) {
            case 'SECURITY':
                return _jsx(ShieldCheck, { size: 14, color: iconColor });
            case 'GATE_ENTRY':
                return _jsx(DoorOpen, { size: 14, color: iconColor });
            case 'GATE_EXIT':
                return _jsx(LogOut, { size: 14, color: iconColor });
            case 'DOCUMENT':
                return _jsx(FileText, { size: 14, color: iconColor });
            case 'ALERT':
                return _jsx(AlertTriangle, { size: 14, color: iconColor });
            case 'CLOCK':
                return _jsx(Clock, { size: 14, color: iconColor });
            case 'CHECK':
            default:
                return _jsx(CheckCircle2, { size: 14, color: iconColor });
        }
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }, className: "vms-timeline", children: [title && (_jsx("h4", { style: { margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }, children: title })), _jsxs("div", { style: { position: 'relative', paddingLeft: '24px' }, children: [_jsx("div", { style: {
                            position: 'absolute',
                            left: '7px',
                            top: '8px',
                            bottom: '8px',
                            width: '2px',
                            backgroundColor: colors.slate[200],
                        } }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px' }, children: events.map((evt, idx) => {
                            const isCompleted = evt.status !== 'PENDING';
                            return (_jsxs("div", { style: { position: 'relative', display: 'flex', alignItems: 'flex-start', gap: '12px' }, children: [_jsx("div", { style: {
                                            position: 'absolute',
                                            left: '-24px',
                                            top: '2px',
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: radius.full,
                                            backgroundColor: '#ffffff',
                                            border: `2px solid ${isCompleted ? colors.primary[600] : colors.slate[400]}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 2,
                                        }, children: _jsx("div", { style: {
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: radius.full,
                                                backgroundColor: isCompleted ? colors.primary[600] : colors.slate[400],
                                            } }) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }, children: [_jsxs("span", { style: {
                                                            fontSize: '11px',
                                                            fontFamily: typography.fontFamily.mono,
                                                            fontWeight: 600,
                                                            color: colors.slate[500],
                                                        }, children: [evt.time, " ", evt.date ? `• ${evt.date}` : ''] }), _jsx("strong", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[900] }, children: evt.title })] }), evt.description && (_jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: evt.description })), evt.actor && (_jsxs("span", { style: { fontSize: '11px', color: colors.slate[400] }, children: ["By: ", evt.actor] }))] })] }, evt.id || idx));
                        }) })] })] }));
};
