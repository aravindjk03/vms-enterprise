import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { CheckCircle2, XCircle, Search, AlertOctagon, Printer, RotateCcw } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';
export const GateDecisionPanel = ({ laneName, gateType, subject, onAllow, onDeny, onClear, onReprint, isProcessing = false, }) => {
    const isAllowed = subject ? subject.passValid && subject.inductionValid && subject.zoneAuthorized : false;
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            padding: '20px',
            backgroundColor: '#ffffff',
            border: `2px solid ${subject ? (isAllowed ? colors.status.success.solid : colors.status.danger.solid) : colors.slate[300]}`,
            borderRadius: radius.md,
        }, className: "vms-gate-decision-panel", children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs("div", { children: [_jsxs("span", { style: { fontSize: '11px', fontWeight: 700, color: colors.slate[500], textTransform: 'uppercase' }, children: [gateType, " \u2022 Active Lane"] }), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900], fontWeight: 800 }, children: laneName })] }), subject && (_jsx(Button, { variant: "outline", size: "dense", onClick: onClear, leftIcon: _jsx(RotateCcw, { size: 12 }), children: "Clear [ESC]" }))] }), subject ? (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '12px 14px',
                            backgroundColor: colors.slate[50],
                            borderRadius: radius.md,
                            border: `1px solid ${colors.slate[200]}`,
                        }, children: [_jsx("div", { style: {
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: radius.sm,
                                    backgroundColor: colors.slate[200],
                                    overflow: 'hidden',
                                    flexShrink: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }, children: subject.photoUrl ? (_jsx("img", { src: subject.photoUrl, alt: subject.name, style: { width: '100%', height: '100%', objectFit: 'cover' } })) : (_jsx("span", { style: { fontSize: '24px', fontWeight: 700, color: colors.slate[500] }, children: subject.name.charAt(0) })) }), _jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }, children: [_jsxs("span", { style: { fontSize: '11px', fontFamily: typography.fontFamily.mono, color: colors.slate[500] }, children: [subject.identifier, " \u2022 ", subject.domain] }), _jsx("strong", { style: { fontSize: typography.fontSize.lg.size, color: colors.slate[900] }, children: subject.name }), subject.company && (_jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[600] }, children: subject.company }))] })] }), _jsxs("div", { style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '8px',
                            fontSize: typography.fontSize.xs.size,
                        }, children: [_jsxs("div", { style: {
                                    padding: '8px',
                                    borderRadius: radius.sm,
                                    backgroundColor: subject.passValid ? colors.status.success.bg : colors.status.danger.bg,
                                    border: `1px solid ${subject.passValid ? colors.status.success.border : colors.status.danger.border}`,
                                    color: subject.passValid ? colors.status.success.fg : colors.status.danger.fg,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                }, children: ["Pass: ", subject.passValid ? 'VALID' : 'INVALID'] }), _jsxs("div", { style: {
                                    padding: '8px',
                                    borderRadius: radius.sm,
                                    backgroundColor: subject.inductionValid ? colors.status.success.bg : colors.status.danger.bg,
                                    border: `1px solid ${subject.inductionValid ? colors.status.success.border : colors.status.danger.border}`,
                                    color: subject.inductionValid ? colors.status.success.fg : colors.status.danger.fg,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                }, children: ["Induction: ", subject.inductionValid ? 'VALID' : 'LAPSED'] }), _jsxs("div", { style: {
                                    padding: '8px',
                                    borderRadius: radius.sm,
                                    backgroundColor: subject.zoneAuthorized ? colors.status.success.bg : colors.status.danger.bg,
                                    border: `1px solid ${subject.zoneAuthorized ? colors.status.success.border : colors.status.danger.border}`,
                                    color: subject.zoneAuthorized ? colors.status.success.fg : colors.status.danger.fg,
                                    textAlign: 'center',
                                    fontWeight: 600,
                                }, children: ["Zone: ", subject.zoneAuthorized ? 'PERMITTED' : 'BLOCKED'] })] }), subject.rejectionReasons && subject.rejectionReasons.length > 0 && (_jsxs("div", { style: {
                            padding: '8px 12px',
                            backgroundColor: colors.status.danger.bg,
                            color: colors.status.danger.fg,
                            borderRadius: radius.sm,
                            fontSize: typography.fontSize.xs.size,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }, children: [_jsx(AlertOctagon, { size: 16 }), _jsxs("span", { children: [_jsx("strong", { children: "Block Reason:" }), " ", subject.rejectionReasons.join('; ')] })] })), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }, children: [_jsx(Button, { variant: isAllowed ? 'primary' : 'secondary', size: "large", isLoading: isProcessing, shortcut: "SPACE", onClick: onAllow, style: {
                                    backgroundColor: isAllowed ? colors.status.success.solid : colors.slate[300],
                                    color: isAllowed ? '#ffffff' : colors.slate[700],
                                    fontSize: typography.fontSize.md.size,
                                    fontWeight: 800,
                                }, leftIcon: _jsx(CheckCircle2, { size: 22 }), children: "ALLOW PASSAGE" }), _jsx(Button, { variant: "danger", size: "large", isLoading: isProcessing, shortcut: "X", onClick: () => onDeny('Operator Rejected'), style: {
                                    fontSize: typography.fontSize.md.size,
                                    fontWeight: 800,
                                }, leftIcon: _jsx(XCircle, { size: 22 }), children: "DENY / HOLD" })] }), onReprint && (_jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }, children: _jsx(Button, { variant: "outline", size: "dense", onClick: onReprint, leftIcon: _jsx(Printer, { size: 14 }), children: "Reprint Gate Pass [P]" }) }))] })) : (_jsxs("div", { style: {
                    padding: '36px 16px',
                    textAlign: 'center',
                    backgroundColor: colors.slate[50],
                    borderRadius: radius.md,
                    border: `1.5px dashed ${colors.slate[300]}`,
                    color: colors.slate[500],
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                }, children: [_jsx(Search, { size: 28, color: colors.slate[400] }), _jsx("strong", { style: { fontSize: typography.fontSize.md.size, color: colors.slate[800] }, children: "Awaiting Barcode / QR / ANPR Scan" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size }, children: "Scan a credential, RFID token or enter license plate in the fast-search box." })] }))] }));
};
