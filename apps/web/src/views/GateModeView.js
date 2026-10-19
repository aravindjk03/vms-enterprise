import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Scan, Camera, Sun, Moon } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button } from '@vms/ui';
import { GateDecisionPanel } from '@vms/ui';
export const GateModeView = () => {
    const [barcodeInput, setBarcodeInput] = useState('');
    const [activeSubject, setActiveSubject] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [decisionHistory, setDecisionHistory] = useState([]);
    const [nightMode, setNightMode] = useState(false);
    // Fast demo scan presets
    const handleScanPreset = (type) => {
        if (type === 'VALID_VISITOR') {
            setActiveSubject({
                identifier: 'VIS-2026-00182',
                name: 'Aravind Swaminathan',
                domain: 'VISITOR',
                company: 'Siemens Industrial Automation',
                passValid: true,
                inductionValid: true,
                zoneAuthorized: true,
            });
        }
        else if (type === 'VALID_TRUCK') {
            setActiveSubject({
                identifier: 'VEH-TN-22-CX-9821',
                name: 'Murugan G. (Heavy Duty Truck)',
                domain: 'VEHICLE',
                company: 'VRL Logistics / Exxon Consignment',
                passValid: true,
                inductionValid: true,
                zoneAuthorized: true,
            });
        }
        else {
            setActiveSubject({
                identifier: 'CONT-WO-2026-004',
                name: 'Suresh Kumar (Worker #8820)',
                domain: 'CONTRACTOR',
                company: 'PestControl Enterprise Services',
                passValid: true,
                inductionValid: false,
                zoneAuthorized: false,
                rejectionReasons: [
                    'EHS Safety Induction Expired (Lapsed 14 days ago)',
                    'Unauthorized Zone (Chemical Solvent Bay B)',
                ],
            });
        }
    };
    const handleAllow = () => {
        if (!activeSubject)
            return;
        setIsProcessing(true);
        setTimeout(() => {
            setDecisionHistory((prev) => [
                `[${new Date().toLocaleTimeString()}] ALLOWED: ${activeSubject.name} (${activeSubject.identifier}) passage recorded. Barrier actuated.`,
                ...prev,
            ]);
            setActiveSubject(null);
            setBarcodeInput('');
            setIsProcessing(false);
        }, 300);
    };
    const handleDeny = (reason) => {
        if (!activeSubject)
            return;
        setIsProcessing(true);
        setTimeout(() => {
            setDecisionHistory((prev) => [
                `[${new Date().toLocaleTimeString()}] DENIED: ${activeSubject.name} (${activeSubject.identifier}) held. Reason: ${reason}`,
                ...prev,
            ]);
            setActiveSubject(null);
            setBarcodeInput('');
            setIsProcessing(false);
        }, 300);
    };
    // Keyboard shortcut listener for Gate Mode [SPACE] to Allow, [X] to Deny, [ESC] to Clear
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space' && activeSubject) {
                e.preventDefault();
                handleAllow();
            }
            else if (e.code === 'KeyX' && activeSubject) {
                e.preventDefault();
                handleDeny('Operator Denied');
            }
            else if (e.code === 'Escape' && activeSubject) {
                e.preventDefault();
                setActiveSubject(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeSubject]);
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            minHeight: '80vh',
            backgroundColor: nightMode ? colors.slate[950] : 'transparent',
            color: nightMode ? '#ffffff' : colors.slate[900],
            padding: '8px',
            borderRadius: radius.md,
        }, className: "vms-gate-mode", children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: nightMode ? colors.slate[900] : '#ffffff',
                    padding: '12px 18px',
                    borderRadius: radius.md,
                    border: `1px solid ${nightMode ? colors.slate[800] : colors.slate[200]}`,
                    gap: '16px',
                    flexWrap: 'wrap',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }, children: [_jsx(Scan, { size: 24, color: colors.primary[600] }), _jsx("input", { type: "text", autoFocus: true, placeholder: "SCAN RFID / QR CODE PASS OR TYPE ANPR REGISTRATION PLATE...", value: barcodeInput, onChange: (e) => setBarcodeInput(e.target.value), style: {
                                    width: '100%',
                                    height: '42px',
                                    padding: '0 12px',
                                    backgroundColor: nightMode ? colors.slate[950] : colors.slate[50],
                                    border: `2px solid ${colors.primary[600]}`,
                                    borderRadius: radius.sm,
                                    fontSize: typography.fontSize.md.size,
                                    fontFamily: typography.fontFamily.mono,
                                    fontWeight: 700,
                                    color: nightMode ? '#ffffff' : colors.slate[900],
                                    outline: 'none',
                                    letterSpacing: '0.04em',
                                } })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(Button, { variant: "outline", size: "dense", onClick: () => handleScanPreset('VALID_VISITOR'), children: "Scan Valid Visitor" }), _jsx(Button, { variant: "outline", size: "dense", onClick: () => handleScanPreset('VALID_TRUCK'), children: "Scan Freight Truck" }), _jsx(Button, { variant: "danger", size: "dense", onClick: () => handleScanPreset('EXPIRED_CONTRACTOR'), children: "Scan Lapsed Contractor" }), _jsx(Button, { variant: "ghost", size: "dense", onClick: () => setNightMode(!nightMode), title: "Toggle night mode for guard cabin", children: nightMode ? _jsx(Sun, { size: 16 }) : _jsx(Moon, { size: 16 }) })] })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }, children: [_jsxs("div", { style: {
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            padding: '16px',
                            backgroundColor: nightMode ? colors.slate[900] : '#ffffff',
                            borderRadius: radius.md,
                            border: `1px solid ${nightMode ? colors.slate[800] : colors.slate[200]}`,
                        }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsx("span", { style: { fontSize: typography.fontSize.sm.size, fontWeight: 700, textTransform: 'uppercase' }, children: "Optical ANPR & CCTV Camera Stream" }), _jsx("span", { style: { fontSize: '11px', color: colors.status.success.solid, fontWeight: 700 }, children: "\u25CF LIVE (25 FPS)" })] }), _jsxs("div", { style: {
                                    height: '240px',
                                    backgroundColor: colors.slate[950],
                                    borderRadius: radius.sm,
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: `1px solid ${colors.slate[800]}`,
                                    overflow: 'hidden',
                                }, children: [_jsx(Camera, { size: 48, color: colors.slate[700] }), _jsx("div", { style: {
                                            position: 'absolute',
                                            bottom: '10px',
                                            left: '10px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.75)',
                                            color: '#ffffff',
                                            padding: '4px 8px',
                                            borderRadius: '2px',
                                            fontSize: '11px',
                                            fontFamily: typography.fontFamily.mono,
                                        }, children: "LANE 1A (ANPR OCR OPTICAL RECOGNITION ACTIVE)" }), activeSubject && (_jsxs("div", { style: {
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            backgroundColor: colors.primary[600],
                                            color: '#ffffff',
                                            padding: '4px 8px',
                                            borderRadius: '2px',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            fontFamily: typography.fontFamily.mono,
                                        }, children: ["MATCHED: ", activeSubject.identifier] }))] }), _jsxs("div", { style: {
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '10px',
                                    fontSize: typography.fontSize.xs.size,
                                }, children: [_jsxs("div", { style: { padding: '8px 10px', backgroundColor: nightMode ? colors.slate[950] : colors.slate[50], borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}` }, children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Weighbridge Scale:" }), _jsx("div", { style: { fontWeight: 700, color: nightMode ? '#ffffff' : colors.slate[900] }, children: "SCALE 1: 0.00 MT (CALIBRATED)" })] }), _jsxs("div", { style: { padding: '8px 10px', backgroundColor: nightMode ? colors.slate[950] : colors.slate[50], borderRadius: radius.sm, border: `1px solid ${colors.slate[300]}` }, children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Driver Breathalyzer:" }), _jsx("div", { style: { fontWeight: 700, color: colors.status.success.solid }, children: "0.00% BAC (PASSED)" })] })] })] }), _jsx(GateDecisionPanel, { laneName: "Gate 1 \u2014 Commercial & Ingress Lane A", gateType: "COMMERCIAL_VEHICLE & PASSENGER", subject: activeSubject, isProcessing: isProcessing, onAllow: handleAllow, onDeny: handleDeny, onClear: () => setActiveSubject(null), onReprint: () => alert('Printing thermal gate pass with QR token') })] }), _jsxs("div", { style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '12px 16px',
                    backgroundColor: nightMode ? colors.slate[900] : '#ffffff',
                    borderRadius: radius.md,
                    border: `1px solid ${nightMode ? colors.slate[800] : colors.slate[200]}`,
                }, children: [_jsx("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: 700, textTransform: 'uppercase', color: colors.slate[500] }, children: "Lane Passage Audit Log (Last 10 Movements)" }), _jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontFamily: typography.fontFamily.mono }, children: decisionHistory.length === 0 ? (_jsx("span", { style: { color: colors.slate[400] }, children: "No gate passages executed in this session." })) : (decisionHistory.map((item, idx) => (_jsx("div", { style: { color: item.includes('ALLOWED') ? colors.status.success.solid : colors.status.danger.solid }, children: item }, idx)))) })] })] }));
};
