import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { CheckCircle2, FileText, ArrowRight, ArrowLeft, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Button, Input, Card, StatusBadge, FileUploader, ActivitySustainabilityCapture, ValidationErrorStateView } from '@vms/ui';
export const TransactionFormView = ({ onComplete }) => {
    // Step indicator and layout mode
    const [activeStep, setActiveStep] = useState(1);
    const [isMultiStep, setIsMultiStep] = useState(false);
    const [isDraftSaved, setIsDraftSaved] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [validationErrors, setValidationErrors] = useState([]);
    const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
    // Operational Form State (Visitor Pre-Registration Demo)
    const [visitorName, setVisitorName] = useState('Aravind Swaminathan');
    const [visitorCompany, setVisitorCompany] = useState('Siemens Industrial Automation');
    const [visitorEmail, setVisitorEmail] = useState('aravind.s@siemens.com');
    const [visitorPhone, setVisitorPhone] = useState('+91 98401 23456');
    const [purpose, setPurpose] = useState('PLC Diagnostic & SCADA Upgrade');
    const [hostUserId, setHostUserId] = useState('Vikram Mehta (Plant Lead - Ext: 4102)');
    const [scheduledDate, setScheduledDate] = useState('2026-10-24');
    const [zoneAllocated, setZoneAllocated] = useState('Control Room Bay 2 & Administration');
    // Embedded Activity & Sustainability State (Critical Sections 16, 17, 18)
    const [esgActivity, setEsgActivity] = useState({
        mode: 'CAR',
        ownership: 'COMPANY',
        vehicleClass: 'SEDAN',
        fuelType: 'DIESEL',
        occupancy: 2,
        originLocation: 'Siemens Regional Campus, Bengaluru',
        destinationLocation: 'MRF Chennai Plant Gate 1',
        distanceKm: 348,
        distanceProvenance: 'SYSTEM_ESTIMATED',
        journeyType: 'ROUND_TRIP',
        fuelProvenance: 'From Siemens Corporate Fleet Profile',
    });
    const handleSaveDraft = () => {
        setIsDraftSaved(true);
        setTimeout(() => setIsDraftSaved(false), 2500);
    };
    const handleReset = () => {
        if (confirm('Reset form fields to default?')) {
            setVisitorName('');
            setVisitorCompany('');
            setVisitorEmail('');
            setVisitorPhone('');
            setPurpose('');
            setHostUserId('');
            setScheduledDate('');
            setZoneAllocated('');
            setValidationErrors([]);
        }
    };
    const validate = () => {
        const errors = [];
        if (!visitorName.trim())
            errors.push('Visitor Full Name is required.');
        if (!visitorCompany.trim())
            errors.push('Company / Vendor Organization is required.');
        if (!visitorPhone.trim())
            errors.push('Contact Mobile Number is required.');
        if (!purpose.trim())
            errors.push('Purpose of Visit is required.');
        if (!hostUserId.trim())
            errors.push('Designated Host is required.');
        if (!scheduledDate.trim())
            errors.push('Scheduled Date is required.');
        setValidationErrors(errors);
        return errors.length === 0;
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }
        setIsSubmitted(true);
    };
    if (isSubmitted) {
        return (_jsx(Card, { style: { textAlign: 'center', padding: '48px 24px' }, children: _jsxs("div", { style: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }, children: [_jsx("div", { style: { padding: '16px', borderRadius: radius.full, backgroundColor: colors.status.success.bg, color: colors.status.success.solid }, children: _jsx(CheckCircle2, { size: 48 }) }), _jsx("h2", { style: { margin: 0, fontSize: typography.fontSize['2xl'].size, color: colors.slate[900], fontWeight: 800 }, children: "Transaction Submitted Successfully" }), _jsx("span", { style: { fontSize: typography.fontSize.sm.size, fontFamily: typography.fontFamily.mono, color: colors.slate[500] }, children: "Transaction Reference: VIS-2026-00187 \u2022 Status: PENDING HOST APPROVAL" }), _jsx("p", { style: { fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '500px', margin: 0 }, children: "Host Vikram Mehta has received an immediate notification. The normalized mobility activity (696 km round-trip) was recorded and linked for Scope 3 emissions derivation." }), _jsxs("div", { style: { display: 'flex', gap: '12px', marginTop: '12px' }, children: [_jsx(Button, { variant: "secondary", size: "normal", onClick: () => setIsSubmitted(false), children: "Register Another Transaction" }), onComplete && (_jsx(Button, { variant: "primary", size: "normal", onClick: onComplete, children: "Return to Visitor Roster" }))] })] }) }));
    }
    const steps = [
        { num: 1, title: 'Visitor & Host' },
        { num: 2, title: 'Activity & Mobility' },
        { num: 3, title: 'Compliance & KYC' },
        { num: 4, title: 'Review & Approvals' },
    ];
    return (_jsxs("form", { onSubmit: handleSubmit, style: { display: 'flex', flexDirection: 'column', gap: '20px' }, children: [_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    backgroundColor: '#ffffff',
                    borderRadius: radius.md,
                    border: `1px solid ${colors.slate[200]}`,
                    flexWrap: 'wrap',
                    gap: '12px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '12px' }, children: [_jsx("div", { style: { padding: '8px', backgroundColor: colors.primary[50], color: colors.primary[600], borderRadius: radius.sm }, children: _jsx(FileText, { size: 20 }) }), _jsxs("div", { children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("span", { style: { fontSize: '11px', fontFamily: typography.fontFamily.mono, color: colors.slate[500] }, children: "NEW TRANSACTION" }), _jsx(StatusBadge, { status: "draft", size: "micro" }), isDraftSaved && (_jsx("span", { style: { fontSize: '11px', color: colors.status.success.solid, fontWeight: 600 }, children: "\u2713 Draft Saved" }))] }), _jsx("h3", { style: { margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }, children: "Visitor Pre-Registration Envelope" })] })] }), _jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx("button", { type: "button", onClick: () => setIsMultiStep(!isMultiStep), style: {
                                    padding: '5px 10px',
                                    backgroundColor: colors.slate[100],
                                    border: `1px solid ${colors.slate[200]}`,
                                    borderRadius: radius.sm,
                                    fontSize: '11px',
                                    color: colors.slate[700],
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }, children: isMultiStep ? 'Switch to Full Page Form' : 'Switch to Wizard Steps' }), _jsx(Button, { type: "button", variant: "outline", size: "dense", onClick: handleSaveDraft, leftIcon: _jsx(Save, { size: 13 }), children: "Save Draft" }), _jsx(Button, { type: "button", variant: "secondary", size: "dense", onClick: () => {
                                    if (visitorName) {
                                        setShowUnsavedWarning(true);
                                    }
                                    else if (onComplete) {
                                        onComplete();
                                    }
                                }, children: "Cancel" }), _jsx(Button, { type: "submit", variant: "primary", size: "dense", rightIcon: _jsx(ArrowRight, { size: 13 }), children: "Submit Transaction" })] })] }), showUnsavedWarning && (_jsxs("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: colors.status.warning.bg,
                    border: `1px solid ${colors.status.warning.border}`,
                    borderRadius: radius.md,
                    gap: '12px',
                }, children: [_jsxs("div", { style: { display: 'flex', alignItems: 'center', gap: '8px' }, children: [_jsx(AlertTriangle, { size: 18, color: colors.status.warning.solid }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, color: colors.status.warning.fg, fontWeight: 600 }, children: "You have unsaved changes in this pre-registration transaction. Are you sure you want to discard them?" })] }), _jsxs("div", { style: { display: 'flex', gap: '6px' }, children: [_jsx(Button, { variant: "secondary", size: "dense", onClick: () => setShowUnsavedWarning(false), children: "Keep Editing" }), _jsx(Button, { variant: "outline", size: "dense", style: { color: colors.status.danger.solid, borderColor: colors.status.danger.border }, onClick: () => onComplete && onComplete(), children: "Discard & Exit" })] })] })), validationErrors.length > 0 && (_jsx(ValidationErrorStateView, { errors: validationErrors, onCorrect: () => setValidationErrors([]) })), isMultiStep && (_jsx("div", { style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    backgroundColor: '#ffffff',
                    borderRadius: radius.md,
                    border: `1px solid ${colors.slate[200]}`,
                    gap: '8px',
                }, children: steps.map((st, idx) => {
                    const isCurrent = activeStep === st.num;
                    const isCompleted = activeStep > st.num;
                    return (_jsxs(React.Fragment, { children: [idx > 0 && (_jsx("div", { style: {
                                    flex: 1,
                                    height: '2px',
                                    backgroundColor: isCompleted ? colors.primary[600] : colors.slate[200],
                                } })), _jsxs("button", { type: "button", onClick: () => setActiveStep(st.num), style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '4px 8px',
                                    borderRadius: radius.sm,
                                    backgroundColor: isCurrent ? colors.primary[50] : 'transparent',
                                }, children: [_jsx("span", { style: {
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: radius.full,
                                            backgroundColor: isCurrent ? colors.primary[600] : isCompleted ? colors.status.success.solid : colors.slate[200],
                                            color: isCurrent || isCompleted ? '#ffffff' : colors.slate[600],
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }, children: isCompleted ? '✓' : st.num }), _jsx("span", { style: { fontSize: typography.fontSize.xs.size, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? colors.primary[900] : colors.slate[600] }, children: st.title })] })] }, st.num));
                }) })), _jsxs("div", { style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: colors.slate[50],
                    borderRadius: radius.md,
                    border: `1px solid ${colors.slate[200]}`,
                    fontSize: typography.fontSize.xs.size,
                }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Target Facility:" }), _jsx("div", { style: { fontWeight: 700, color: colors.slate[900] }, children: "Chennai Radial Tyre Plant" })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Authorized Gate:" }), _jsx("div", { style: { fontWeight: 700, color: colors.slate[900] }, children: "Gate 1 (North Main Passenger)" })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Host Approver:" }), _jsx("div", { style: { fontWeight: 700, color: colors.slate[900] }, children: "Vikram Mehta (Plant Lead)" })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Sustainability Status:" }), _jsx("div", { style: { fontWeight: 700, color: colors.esg[700] }, children: "ESG Activity Integrated" })] })] }), (!isMultiStep || activeStep === 1) && (_jsxs(Card, { title: "1. Operational Visitor & Visit Details", children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }, children: [_jsx(Input, { label: "Visitor Full Name", isRequired: true, value: visitorName, onChange: (e) => setVisitorName(e.target.value) }), _jsx(Input, { label: "Company / Vendor Organization", isRequired: true, value: visitorCompany, onChange: (e) => setVisitorCompany(e.target.value) }), _jsx(Input, { label: "Corporate Email Address", type: "email", value: visitorEmail, onChange: (e) => setVisitorEmail(e.target.value) }), _jsx(Input, { label: "Contact Mobile Number", isRequired: true, value: visitorPhone, onChange: (e) => setVisitorPhone(e.target.value) }), _jsx(Input, { label: "Purpose of Visit", isRequired: true, value: purpose, onChange: (e) => setPurpose(e.target.value) }), _jsx(Input, { label: "Designated Host", isRequired: true, value: hostUserId, onChange: (e) => setHostUserId(e.target.value) }), _jsx(Input, { label: "Scheduled Date", type: "date", isRequired: true, value: scheduledDate, onChange: (e) => setScheduledDate(e.target.value) }), _jsx(Input, { label: "Authorized Facility Zone", value: zoneAllocated, onChange: (e) => setZoneAllocated(e.target.value) })] }), isMultiStep && (_jsx("div", { style: { display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }, children: _jsx(Button, { type: "button", variant: "primary", size: "dense", rightIcon: _jsx(ArrowRight, { size: 13 }), onClick: () => setActiveStep(2), children: "Next: Mobility & ESG Activity" }) }))] })), (!isMultiStep || activeStep === 2) && (_jsxs("div", { children: [_jsx(ActivitySustainabilityCapture, { data: esgActivity, onChange: setEsgActivity }), isMultiStep && (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginTop: '12px' }, children: [_jsx(Button, { type: "button", variant: "secondary", size: "dense", leftIcon: _jsx(ArrowLeft, { size: 13 }), onClick: () => setActiveStep(1), children: "Back to Visitor Details" }), _jsx(Button, { type: "button", variant: "primary", size: "dense", rightIcon: _jsx(ArrowRight, { size: 13 }), onClick: () => setActiveStep(3), children: "Next: Compliance & KYC" })] }))] })), (!isMultiStep || activeStep === 3) && (_jsxs(Card, { title: "2. Mandatory Compliance & Verification Documents", subtitle: "Government KYC, Non-Disclosure Agreement (NDA) & Safety Induction", children: [_jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }, children: [_jsx(FileUploader, { label: "Government Identification (Aadhaar / Passport / DL)", helperText: "PDF or scanned photo (Max 10MB)" }), _jsx(FileUploader, { label: "Signed Plant Non-Disclosure Agreement (NDA)", helperText: "Mandatory for high-security production bays" })] }), isMultiStep && (_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginTop: '16px' }, children: [_jsx(Button, { type: "button", variant: "secondary", size: "dense", leftIcon: _jsx(ArrowLeft, { size: 13 }), onClick: () => setActiveStep(2), children: "Back to Activity" }), _jsx(Button, { type: "button", variant: "primary", size: "dense", rightIcon: _jsx(ArrowRight, { size: 13 }), onClick: () => setActiveStep(4), children: "Next: Review & Submit" })] }))] })), (!isMultiStep || activeStep === 4) && (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: '12px' }, children: [_jsx(Card, { title: "3. Final Review & Approvals Governance", subtitle: "Host approval dispatch and immutable transaction ledger", children: _jsxs("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: typography.fontSize.xs.size }, children: [_jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Visitor:" }), _jsx("div", { style: { fontWeight: 700 }, children: visitorName || '—' }), _jsx("div", { style: { color: colors.slate[600] }, children: visitorCompany })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Host Approver:" }), _jsx("div", { style: { fontWeight: 700 }, children: hostUserId })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Mobility Route:" }), _jsxs("div", { style: { fontWeight: 700 }, children: [esgActivity.originLocation, " \u2192 MRF Chennai"] }), _jsxs("div", { style: { color: colors.esg[700] }, children: [esgActivity.distanceKm, " km (", esgActivity.mode, ")"] })] }), _jsxs("div", { children: [_jsx("span", { style: { color: colors.slate[500] }, children: "Gate Pass Status:" }), _jsx("div", { style: { fontWeight: 700, color: colors.status.warning.solid }, children: "Pending Host Authorization" })] })] }) }), _jsx(Card, { dense: true, variant: "sunken", children: _jsxs("div", { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: colors.slate[500], flexWrap: 'wrap', gap: '8px' }, children: [_jsx("span", { children: "Created by: Operator ID #REC-01 (Chennai Reception Desk)" }), _jsx("span", { children: "Security Protocol: ISO 27001 & ABAC Privacy Filter Active" }), _jsx("span", { children: "Calculation Hash: SHA-256 Verified on Submit" })] }) }), _jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', marginTop: '4px' }, children: [isMultiStep && (_jsx(Button, { type: "button", variant: "secondary", size: "dense", leftIcon: _jsx(ArrowLeft, { size: 13 }), onClick: () => setActiveStep(3), children: "Back to Documents" })), _jsxs("div", { style: { display: 'flex', gap: '8px', marginLeft: 'auto' }, children: [_jsx(Button, { type: "button", variant: "outline", size: "dense", leftIcon: _jsx(RotateCcw, { size: 13 }), onClick: handleReset, children: "Reset Form" }), _jsx(Button, { type: "submit", variant: "primary", size: "dense", rightIcon: _jsx(ArrowRight, { size: 13 }), children: "Confirm & Submit Pre-Registration" })] })] })] }))] }));
};
