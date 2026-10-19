import React, { useState } from 'react';
import { 
  CheckCircle2, 
  User, 
  Building, 
  Calendar, 
  ShieldCheck, 
  FileText, 
  Compass, 
  Leaf, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw, 
  Save, 
  Lock,
  AlertTriangle 
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { 
  Button, 
  Input, 
  Select, 
  Card, 
  Section, 
  StatusBadge, 
  FileUploader, 
  ActivitySustainabilityCapture, 
  ValidationErrorStateView,
  type ActivitySustainabilityFormData 
} from '@vms/ui';

export const TransactionFormView: React.FC<{
  onComplete?: () => void;
}> = ({ onComplete }) => {
  // Step indicator and layout mode
  const [activeStep, setActiveStep] = useState<number>(1);
  const [isMultiStep, setIsMultiStep] = useState(false);
  const [isDraftSaved, setIsDraftSaved] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
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
  const [esgActivity, setEsgActivity] = useState<ActivitySustainabilityFormData>({
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

  const validate = (): boolean => {
    const errors: string[] = [];
    if (!visitorName.trim()) errors.push('Visitor Full Name is required.');
    if (!visitorCompany.trim()) errors.push('Company / Vendor Organization is required.');
    if (!visitorPhone.trim()) errors.push('Contact Mobile Number is required.');
    if (!purpose.trim()) errors.push('Purpose of Visit is required.');
    if (!hostUserId.trim()) errors.push('Designated Host is required.');
    if (!scheduledDate.trim()) errors.push('Scheduled Date is required.');

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <Card style={{ textAlign: 'center', padding: '48px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: radius.full, backgroundColor: colors.status.success.bg, color: colors.status.success.solid }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 style={{ margin: 0, fontSize: typography.fontSize['2xl'].size, color: colors.slate[900], fontWeight: 800 }}>
            Transaction Submitted Successfully
          </h2>
          <span style={{ fontSize: typography.fontSize.sm.size, fontFamily: typography.fontFamily.mono, color: colors.slate[500] }}>
            Transaction Reference: VIS-2026-00187 • Status: PENDING HOST APPROVAL
          </span>
          <p style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '500px', margin: 0 }}>
            Host Vikram Mehta has received an immediate notification. The normalized mobility activity (696 km round-trip) was recorded and linked for Scope 3 emissions derivation.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="normal" onClick={() => setIsSubmitted(false)}>
              Register Another Transaction
            </Button>
            {onComplete && (
              <Button variant="primary" size="normal" onClick={onComplete}>
                Return to Visitor Roster
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const steps = [
    { num: 1, title: 'Visitor & Host' },
    { num: 2, title: 'Activity & Mobility' },
    { num: 3, title: 'Compliance & KYC' },
    { num: 4, title: 'Review & Approvals' },
  ];

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. TRANSACTION HEADER & SUMMARY (Section 15) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          backgroundColor: '#ffffff',
          borderRadius: radius.md,
          border: `1px solid ${colors.slate[200]}`,
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', backgroundColor: colors.primary[50], color: colors.primary[600], borderRadius: radius.sm }}>
            <FileText size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontFamily: typography.fontFamily.mono, color: colors.slate[500] }}>
                NEW TRANSACTION
              </span>
              <StatusBadge status="draft" size="micro" />
              {isDraftSaved && (
                <span style={{ fontSize: '11px', color: colors.status.success.solid, fontWeight: 600 }}>
                  ✓ Draft Saved
                </span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }}>
              Visitor Pre-Registration Envelope
            </h3>
          </div>
        </div>

        {/* Action Controls & Multi-Step Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsMultiStep(!isMultiStep)}
            style={{
              padding: '5px 10px',
              backgroundColor: colors.slate[100],
              border: `1px solid ${colors.slate[200]}`,
              borderRadius: radius.sm,
              fontSize: '11px',
              color: colors.slate[700],
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {isMultiStep ? 'Switch to Full Page Form' : 'Switch to Wizard Steps'}
          </button>
          <Button type="button" variant="outline" size="dense" onClick={handleSaveDraft} leftIcon={<Save size={13} />}>
            Save Draft
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="dense"
            onClick={() => {
              if (visitorName) {
                setShowUnsavedWarning(true);
              } else if (onComplete) {
                onComplete();
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="dense" rightIcon={<ArrowRight size={13} />}>
            Submit Transaction
          </Button>
        </div>
      </div>

      {/* Unsaved Changes Warning Modal / Banner */}
      {showUnsavedWarning && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: colors.status.warning.bg,
            border: `1px solid ${colors.status.warning.border}`,
            borderRadius: radius.md,
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color={colors.status.warning.solid} />
            <span style={{ fontSize: typography.fontSize.xs.size, color: colors.status.warning.fg, fontWeight: 600 }}>
              You have unsaved changes in this pre-registration transaction. Are you sure you want to discard them?
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <Button variant="secondary" size="dense" onClick={() => setShowUnsavedWarning(false)}>
              Keep Editing
            </Button>
            <Button
              variant="outline"
              size="dense"
              style={{ color: colors.status.danger.solid, borderColor: colors.status.danger.border }}
              onClick={() => onComplete && onComplete()}
            >
              Discard & Exit
            </Button>
          </div>
        </div>
      )}

      {/* Validation Errors Summary (Section 14) */}
      {validationErrors.length > 0 && (
        <ValidationErrorStateView
          errors={validationErrors}
          onCorrect={() => setValidationErrors([])}
        />
      )}

      {/* Stepper Wizard Indicator (when in Multi-Step mode) */}
      {isMultiStep && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            backgroundColor: '#ffffff',
            borderRadius: radius.md,
            border: `1px solid ${colors.slate[200]}`,
            gap: '8px',
          }}
        >
          {steps.map((st, idx) => {
            const isCurrent = activeStep === st.num;
            const isCompleted = activeStep > st.num;

            return (
              <React.Fragment key={st.num}>
                {idx > 0 && (
                  <div
                    style={{
                      flex: 1,
                      height: '2px',
                      backgroundColor: isCompleted ? colors.primary[600] : colors.slate[200],
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setActiveStep(st.num)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: radius.sm,
                    backgroundColor: isCurrent ? colors.primary[50] : 'transparent',
                  }}
                >
                  <span
                    style={{
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
                    }}
                  >
                    {isCompleted ? '✓' : st.num}
                  </span>
                  <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? colors.primary[900] : colors.slate[600] }}>
                    {st.title}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* 2. TRANSACTION SUMMARY CARD (Entity Overview) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          padding: '12px 16px',
          backgroundColor: colors.slate[50],
          borderRadius: radius.md,
          border: `1px solid ${colors.slate[200]}`,
          fontSize: typography.fontSize.xs.size,
        }}
      >
        <div>
          <span style={{ color: colors.slate[500] }}>Target Facility:</span>
          <div style={{ fontWeight: 700, color: colors.slate[900] }}>Chennai Radial Tyre Plant</div>
        </div>
        <div>
          <span style={{ color: colors.slate[500] }}>Authorized Gate:</span>
          <div style={{ fontWeight: 700, color: colors.slate[900] }}>Gate 1 (North Main Passenger)</div>
        </div>
        <div>
          <span style={{ color: colors.slate[500] }}>Host Approver:</span>
          <div style={{ fontWeight: 700, color: colors.slate[900] }}>Vikram Mehta (Plant Lead)</div>
        </div>
        <div>
          <span style={{ color: colors.slate[500] }}>Sustainability Status:</span>
          <div style={{ fontWeight: 700, color: colors.esg[700] }}>ESG Activity Integrated</div>
        </div>
      </div>

      {/* 3. SECTION 1: OPERATIONAL VISITOR INFORMATION */}
      {(!isMultiStep || activeStep === 1) && (
        <Card title="1. Operational Visitor & Visit Details">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Input
              label="Visitor Full Name"
              isRequired
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
            />
            <Input
              label="Company / Vendor Organization"
              isRequired
              value={visitorCompany}
              onChange={(e) => setVisitorCompany(e.target.value)}
            />
            <Input
              label="Corporate Email Address"
              type="email"
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
            />
            <Input
              label="Contact Mobile Number"
              isRequired
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
            />
            <Input
              label="Purpose of Visit"
              isRequired
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
            />
            <Input
              label="Designated Host"
              isRequired
              value={hostUserId}
              onChange={(e) => setHostUserId(e.target.value)}
            />
            <Input
              label="Scheduled Date"
              type="date"
              isRequired
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <Input
              label="Authorized Facility Zone"
              value={zoneAllocated}
              onChange={(e) => setZoneAllocated(e.target.value)}
            />
          </div>
          {isMultiStep && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button type="button" variant="primary" size="dense" rightIcon={<ArrowRight size={13} />} onClick={() => setActiveStep(2)}>
                Next: Mobility & ESG Activity
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 4. CRITICAL SECTION: ACTIVITY & SUSTAINABILITY (Sections 16, 17, 18) */}
      {(!isMultiStep || activeStep === 2) && (
        <div>
          <ActivitySustainabilityCapture
            data={esgActivity}
            onChange={setEsgActivity}
          />
          {isMultiStep && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <Button type="button" variant="secondary" size="dense" leftIcon={<ArrowLeft size={13} />} onClick={() => setActiveStep(1)}>
                Back to Visitor Details
              </Button>
              <Button type="button" variant="primary" size="dense" rightIcon={<ArrowRight size={13} />} onClick={() => setActiveStep(3)}>
                Next: Compliance & KYC
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 5. SECTION: COMPLIANCE DOCUMENTS & KYC */}
      {(!isMultiStep || activeStep === 3) && (
        <Card title="2. Mandatory Compliance & Verification Documents" subtitle="Government KYC, Non-Disclosure Agreement (NDA) & Safety Induction">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <FileUploader
              label="Government Identification (Aadhaar / Passport / DL)"
              helperText="PDF or scanned photo (Max 10MB)"
            />
            <FileUploader
              label="Signed Plant Non-Disclosure Agreement (NDA)"
              helperText="Mandatory for high-security production bays"
            />
          </div>
          {isMultiStep && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <Button type="button" variant="secondary" size="dense" leftIcon={<ArrowLeft size={13} />} onClick={() => setActiveStep(2)}>
                Back to Activity
              </Button>
              <Button type="button" variant="primary" size="dense" rightIcon={<ArrowRight size={13} />} onClick={() => setActiveStep(4)}>
                Next: Review & Submit
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* 6. SECTION: AUDIT & PROVENANCE PREVIEW */}
      {(!isMultiStep || activeStep === 4) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card title="3. Final Review & Approvals Governance" subtitle="Host approval dispatch and immutable transaction ledger">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', fontSize: typography.fontSize.xs.size }}>
              <div>
                <span style={{ color: colors.slate[500] }}>Visitor:</span>
                <div style={{ fontWeight: 700 }}>{visitorName || '—'}</div>
                <div style={{ color: colors.slate[600] }}>{visitorCompany}</div>
              </div>
              <div>
                <span style={{ color: colors.slate[500] }}>Host Approver:</span>
                <div style={{ fontWeight: 700 }}>{hostUserId}</div>
              </div>
              <div>
                <span style={{ color: colors.slate[500] }}>Mobility Route:</span>
                <div style={{ fontWeight: 700 }}>{esgActivity.originLocation} → MRF Chennai</div>
                <div style={{ color: colors.esg[700] }}>{esgActivity.distanceKm} km ({esgActivity.mode})</div>
              </div>
              <div>
                <span style={{ color: colors.slate[500] }}>Gate Pass Status:</span>
                <div style={{ fontWeight: 700, color: colors.status.warning.solid }}>Pending Host Authorization</div>
              </div>
            </div>
          </Card>

          <Card dense variant="sunken">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: colors.slate[500], flexWrap: 'wrap', gap: '8px' }}>
              <span>Created by: Operator ID #REC-01 (Chennai Reception Desk)</span>
              <span>Security Protocol: ISO 27001 & ABAC Privacy Filter Active</span>
              <span>Calculation Hash: SHA-256 Verified on Submit</span>
            </div>
          </Card>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
            {isMultiStep && (
              <Button type="button" variant="secondary" size="dense" leftIcon={<ArrowLeft size={13} />} onClick={() => setActiveStep(3)}>
                Back to Documents
              </Button>
            )}
            <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
              <Button type="button" variant="outline" size="dense" leftIcon={<RotateCcw size={13} />} onClick={handleReset}>
                Reset Form
              </Button>
              <Button type="submit" variant="primary" size="dense" rightIcon={<ArrowRight size={13} />}>
                Confirm & Submit Pre-Registration
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
