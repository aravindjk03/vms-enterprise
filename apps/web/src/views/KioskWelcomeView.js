import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Calendar, UserPlus, QrCode, HelpCircle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { colors, radius, shadows, typography } from '@vms/ui/tokens';
import { Button } from '@vms/ui';
import { Input } from '@vms/ui';
export const KioskWelcomeView = ({ onExitKiosk }) => {
    const [activeStep, setActiveStep] = useState('WELCOME');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [visitorName, setVisitorName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [hostName, setHostName] = useState('');
    const [idleSeconds, setIdleSeconds] = useState(0);
    // Inactivity timeout reset (60 seconds)
    useEffect(() => {
        if (activeStep === 'WELCOME')
            return;
        const interval = setInterval(() => {
            setIdleSeconds((prev) => {
                if (prev >= 60) {
                    setActiveStep('WELCOME');
                    return 0;
                }
                return prev + 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [activeStep]);
    const handleReset = () => {
        setActiveStep('WELCOME');
        setPhoneNumber('');
        setOtpCode('');
        setVisitorName('');
        setCompanyName('');
        setHostName('');
        setIdleSeconds(0);
    };
    return (_jsxs("div", { style: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '85vh',
            backgroundColor: '#ffffff',
            borderRadius: radius.lg,
            boxShadow: shadows.modal,
            border: `1px solid ${colors.slate[200]}`,
            padding: '32px 24px',
            position: 'relative',
            userSelect: 'none',
        }, className: "vms-kiosk-view", children: [_jsxs("div", { style: {
                    position: 'absolute',
                    top: '20px',
                    left: '24px',
                    right: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(ShieldCheck, { size: 24, color: colors.primary[600] }), _jsxs("div", { children: [_jsx("strong", { style: { fontSize: typography.fontSize.md.size, color: colors.slate[900] }, children: "MRF Tyres & Polymers" }), _jsx("div", { style: { fontSize: '11px', color: colors.slate[500] }, children: "Chennai Plant Welcome Terminal" })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [activeStep !== 'WELCOME' && (_jsxs("span", { style: { fontSize: '11px', color: colors.slate[400] }, children: ["Auto-reset in ", 60 - idleSeconds, "s"] })), onExitKiosk && (_jsx(Button, { variant: "ghost", size: "dense", onClick: onExitKiosk, children: "Exit Kiosk Mode" }))] })] }), activeStep === 'WELCOME' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', maxWidth: '640px', textAlign: 'center', width: '100%' }, children: [_jsxs("div", { children: [_jsx("h1", { style: {
                                    fontSize: typography.fontSize['3xl'].size,
                                    fontWeight: 800,
                                    color: colors.slate[900],
                                    margin: '0 0 8px 0',
                                    letterSpacing: '-0.02em',
                                }, children: "Welcome to Chennai Facility" }), _jsx("p", { style: { fontSize: typography.fontSize.md.size, color: colors.slate[600], margin: 0 }, children: "Please select your registration option to print your visitor badge." })] }), _jsxs("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }, children: [_jsxs("div", { role: "button", tabIndex: 0, onClick: () => setActiveStep('APPOINTMENT'), style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '28px 20px',
                                    backgroundColor: colors.slate[50],
                                    border: `2px solid ${colors.slate[200]}`,
                                    borderRadius: radius.md,
                                    cursor: 'pointer',
                                    gap: '12px',
                                    transition: 'all 150ms ease',
                                }, className: "vms-kiosk-btn", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.primary[100], color: colors.primary[700] }, children: _jsx(Calendar, { size: 32 }) }), _jsx("strong", { style: { fontSize: typography.fontSize.lg.size, color: colors.slate[900] }, children: "I Have an Appointment" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: "Enter registered phone number or booking reference" })] }), _jsxs("div", { role: "button", tabIndex: 0, onClick: () => setActiveStep('WALK_IN'), style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '28px 20px',
                                    backgroundColor: colors.slate[50],
                                    border: `2px solid ${colors.slate[200]}`,
                                    borderRadius: radius.md,
                                    cursor: 'pointer',
                                    gap: '12px',
                                    transition: 'all 150ms ease',
                                }, className: "vms-kiosk-btn", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.slate[200], color: colors.slate[700] }, children: _jsx(UserPlus, { size: 32 }) }), _jsx("strong", { style: { fontSize: typography.fontSize.lg.size, color: colors.slate[900] }, children: "Walk-in Visitor" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: "Register details on-site with host notification" })] }), _jsxs("div", { role: "button", tabIndex: 0, onClick: () => setActiveStep('SCAN_QR'), style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '28px 20px',
                                    backgroundColor: colors.slate[50],
                                    border: `2px solid ${colors.slate[200]}`,
                                    borderRadius: radius.md,
                                    cursor: 'pointer',
                                    gap: '12px',
                                    transition: 'all 150ms ease',
                                }, className: "vms-kiosk-btn", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.esg[100], color: colors.esg[700] }, children: _jsx(QrCode, { size: 32 }) }), _jsx("strong", { style: { fontSize: typography.fontSize.lg.size, color: colors.slate[900] }, children: "Scan QR Pass" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: "Hold appointment QR code in front of camera" })] }), _jsxs("div", { role: "button", tabIndex: 0, onClick: () => setActiveStep('ASSISTANCE'), style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '28px 20px',
                                    backgroundColor: colors.slate[50],
                                    border: `2px solid ${colors.slate[200]}`,
                                    borderRadius: radius.md,
                                    cursor: 'pointer',
                                    gap: '12px',
                                    transition: 'all 150ms ease',
                                }, className: "vms-kiosk-btn", children: [_jsx("div", { style: { padding: '12px', borderRadius: radius.full, backgroundColor: colors.status.warning.bg, color: colors.status.warning.fg }, children: _jsx(HelpCircle, { size: 32 }) }), _jsx("strong", { style: { fontSize: typography.fontSize.lg.size, color: colors.slate[900] }, children: "Assistance" }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.slate[500] }, children: "Request receptionist or security concierge support" })] })] }), _jsx("div", { style: { fontSize: '11px', color: colors.slate[400] }, children: "Security Notice: All visitor data is processed in accordance with plant privacy governance policies." })] })), activeStep === 'APPOINTMENT' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '420px', width: '100%' }, children: [_jsx("h2", { style: { margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }, children: "Find Your Scheduled Appointment" }), _jsx(Input, { label: "Mobile Number or Email", placeholder: "e.g. 98401 23456", value: phoneNumber, onChange: (e) => setPhoneNumber(e.target.value) }), _jsx(Input, { label: "Appointment Pass Code (OTP)", placeholder: "e.g. 8829", value: otpCode, onChange: (e) => setOtpCode(e.target.value) }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginTop: '12px' }, children: [_jsx(Button, { variant: "secondary", size: "large", onClick: handleReset, leftIcon: _jsx(ArrowLeft, { size: 16 }), children: "Back" }), _jsx(Button, { variant: "primary", size: "large", style: { flex: 1 }, onClick: () => setActiveStep('SUCCESS'), children: "Check-in & Print Pass" })] })] })), activeStep === 'WALK_IN' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '460px', width: '100%' }, children: [_jsx("h2", { style: { margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }, children: "Walk-in Visitor Registration" }), _jsx(Input, { label: "Full Name", placeholder: "e.g. Rajesh Kumar", value: visitorName, onChange: (e) => setVisitorName(e.target.value) }), _jsx(Input, { label: "Company / Organization", placeholder: "e.g. Tata Consultancy Services", value: companyName, onChange: (e) => setCompanyName(e.target.value) }), _jsx(Input, { label: "Host Employee Name / Department", placeholder: "e.g. Suresh Babu (Production Lead)", value: hostName, onChange: (e) => setHostName(e.target.value) }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginTop: '12px' }, children: [_jsx(Button, { variant: "secondary", size: "large", onClick: handleReset, leftIcon: _jsx(ArrowLeft, { size: 16 }), children: "Back" }), _jsx(Button, { variant: "primary", size: "large", style: { flex: 1 }, onClick: () => setActiveStep('SUCCESS'), children: "Submit for Host Approval" })] })] })), activeStep === 'SCAN_QR' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '420px', textAlign: 'center' }, children: [_jsx("h2", { style: { margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }, children: "Scan Your Appointment QR Pass" }), _jsx("div", { style: {
                            width: '240px',
                            height: '240px',
                            border: `2px dashed ${colors.primary[600]}`,
                            borderRadius: radius.md,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: colors.slate[50],
                        }, children: _jsx(QrCode, { size: 100, color: colors.primary[600] }) }), _jsx("p", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[600], margin: 0 }, children: "Position the digital pass QR code on your mobile screen towards the scanner window." }), _jsx(Button, { variant: "secondary", size: "normal", onClick: handleReset, children: "Cancel" })] })), activeStep === 'ASSISTANCE' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '420px', textAlign: 'center' }, children: [_jsx("div", { style: { padding: '16px', borderRadius: radius.full, backgroundColor: colors.status.warning.bg, color: colors.status.warning.fg }, children: _jsx(HelpCircle, { size: 48 }) }), _jsx("h2", { style: { margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }, children: "Reception Concierge Notified" }), _jsx("p", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[600], margin: 0 }, children: "A reception officer has been alerted to assist you at Terminal #1. Please take a seat in the welcome lobby." }), _jsx(Button, { variant: "secondary", size: "normal", onClick: handleReset, children: "Return to Welcome Screen" })] })), activeStep === 'SUCCESS' && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '420px', textAlign: 'center' }, children: [_jsx("div", { style: { padding: '16px', borderRadius: radius.full, backgroundColor: colors.status.success.bg, color: colors.status.success.solid }, children: _jsx(CheckCircle2, { size: 48 }) }), _jsx("h2", { style: { margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }, children: "Registration Complete!" }), _jsx("p", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[600], margin: 0 }, children: "Your visitor badge is currently printing at the tray below. Please attach your pass and proceed to Gate 1 Turnstiles." }), _jsx(Button, { variant: "primary", size: "large", onClick: handleReset, children: "Done (Reset)" })] }))] }));
};
