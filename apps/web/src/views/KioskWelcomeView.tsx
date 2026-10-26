import React, { useState, useEffect } from 'react';
import { Calendar, UserPlus, QrCode, HelpCircle, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { colors, radius, shadows, typography } from '@vms/ui/tokens';
import { Button } from '@vms/ui';
import { Input } from '@vms/ui';

export const KioskWelcomeView: React.FC<{ onExitKiosk?: () => void }> = ({ onExitKiosk }) => {
  const [activeStep, setActiveStep] = useState<'WELCOME' | 'APPOINTMENT' | 'WALK_IN' | 'SCAN_QR' | 'ASSISTANCE' | 'SUCCESS'>('WELCOME');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [visitorName, setVisitorName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [hostName, setHostName] = useState('');
  const [idleSeconds, setIdleSeconds] = useState(0);

  // Inactivity timeout reset (60 seconds)
  useEffect(() => {
    if (activeStep === 'WELCOME') return;
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

  return (
    <div
      style={{
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
      }}
      className="vms-kiosk-view"
    >
      {/* Top Kiosk Header */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '24px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={24} color={colors.primary[600]} />
          <div>
            <strong style={{ fontSize: typography.fontSize.md.size, color: colors.slate[900] }}>
              Northwind Tyres & Polymers
            </strong>
            <div style={{ fontSize: '11px', color: colors.slate[500] }}>
              Chennai Plant Welcome Terminal
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {activeStep !== 'WELCOME' && (
            <span style={{ fontSize: '11px', color: colors.slate[400] }}>
              Auto-reset in {60 - idleSeconds}s
            </span>
          )}
          {onExitKiosk && (
            <Button variant="ghost" size="dense" onClick={onExitKiosk}>
              Exit Kiosk Mode
            </Button>
          )}
        </div>
      </div>

      {/* Main Kiosk Content Modes */}
      {activeStep === 'WELCOME' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px', maxWidth: '640px', textAlign: 'center', width: '100%' }}>
          <div>
            <h1
              style={{
                fontSize: typography.fontSize['3xl'].size,
                fontWeight: 800,
                color: colors.slate[900],
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Welcome to Chennai Facility
            </h1>
            <p style={{ fontSize: typography.fontSize.md.size, color: colors.slate[600], margin: 0 }}>
              Please select your registration option to print your visitor badge.
            </p>
          </div>

          {/* Four Primary Large Touch Option Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
            {/* 1. I Have an Appointment */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveStep('APPOINTMENT')}
              style={{
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
              }}
              className="vms-kiosk-btn"
            >
              <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.primary[100], color: colors.primary[700] }}>
                <Calendar size={32} />
              </div>
              <strong style={{ fontSize: typography.fontSize.lg.size, color: colors.slate[900] }}>
                I Have an Appointment
              </strong>
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                Enter registered phone number or booking reference
              </span>
            </div>

            {/* 2. Walk-in Visitor */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveStep('WALK_IN')}
              style={{
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
              }}
              className="vms-kiosk-btn"
            >
              <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.slate[200], color: colors.slate[700] }}>
                <UserPlus size={32} />
              </div>
              <strong style={{ fontSize: typography.fontSize.lg.size, color: colors.slate[900] }}>
                Walk-in Visitor
              </strong>
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                Register details on-site with host notification
              </span>
            </div>

            {/* 3. Scan QR */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveStep('SCAN_QR')}
              style={{
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
              }}
              className="vms-kiosk-btn"
            >
              <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.esg[100], color: colors.esg[700] }}>
                <QrCode size={32} />
              </div>
              <strong style={{ fontSize: typography.fontSize.lg.size, color: colors.slate[900] }}>
                Scan QR Pass
              </strong>
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                Hold appointment QR code in front of camera
              </span>
            </div>

            {/* 4. Assistance */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => setActiveStep('ASSISTANCE')}
              style={{
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
              }}
              className="vms-kiosk-btn"
            >
              <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.status.warning.bg, color: colors.status.warning.fg }}>
                <HelpCircle size={32} />
              </div>
              <strong style={{ fontSize: typography.fontSize.lg.size, color: colors.slate[900] }}>
                Assistance
              </strong>
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
                Request receptionist or security concierge support
              </span>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: colors.slate[400] }}>
            Security Notice: All visitor data is processed in accordance with plant privacy governance policies.
          </div>
        </div>
      )}

      {/* Appointment Flow */}
      {activeStep === 'APPOINTMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '420px', width: '100%' }}>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }}>
            Find Your Scheduled Appointment
          </h2>
          <Input
            label="Mobile Number or Email"
            placeholder="e.g. 98401 23456"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <Input
            label="Appointment Pass Code (OTP)"
            placeholder="e.g. 8829"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="large" onClick={handleReset} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button
              variant="primary"
              size="large"
              style={{ flex: 1 }}
              onClick={() => setActiveStep('SUCCESS')}
            >
              Check-in & Print Pass
            </Button>
          </div>
        </div>
      )}

      {/* Walk-in Flow */}
      {activeStep === 'WALK_IN' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '460px', width: '100%' }}>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }}>
            Walk-in Visitor Registration
          </h2>
          <Input
            label="Full Name"
            placeholder="e.g. Rajesh Kumar"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
          />
          <Input
            label="Company / Organization"
            placeholder="e.g. Tata Consultancy Services"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <Input
            label="Host Employee Name / Department"
            placeholder="e.g. Suresh Babu (Production Lead)"
            value={hostName}
            onChange={(e) => setHostName(e.target.value)}
          />

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <Button variant="secondary" size="large" onClick={handleReset} leftIcon={<ArrowLeft size={16} />}>
              Back
            </Button>
            <Button
              variant="primary"
              size="large"
              style={{ flex: 1 }}
              onClick={() => setActiveStep('SUCCESS')}
            >
              Submit for Host Approval
            </Button>
          </div>
        </div>
      )}

      {/* Scan QR Flow */}
      {activeStep === 'SCAN_QR' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', maxWidth: '420px', textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }}>
            Scan Your Appointment QR Pass
          </h2>
          <div
            style={{
              width: '240px',
              height: '240px',
              border: `2px dashed ${colors.primary[600]}`,
              borderRadius: radius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.slate[50],
            }}
          >
            <QrCode size={100} color={colors.primary[600]} />
          </div>
          <p style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[600], margin: 0 }}>
            Position the digital pass QR code on your mobile screen towards the scanner window.
          </p>
          <Button variant="secondary" size="normal" onClick={handleReset}>
            Cancel
          </Button>
        </div>
      )}

      {/* Assistance Flow */}
      {activeStep === 'ASSISTANCE' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ padding: '16px', borderRadius: radius.full, backgroundColor: colors.status.warning.bg, color: colors.status.warning.fg }}>
            <HelpCircle size={48} />
          </div>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }}>
            Reception Concierge Notified
          </h2>
          <p style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[600], margin: 0 }}>
            A reception officer has been alerted to assist you at Terminal #1. Please take a seat in the welcome lobby.
          </p>
          <Button variant="secondary" size="normal" onClick={handleReset}>
            Return to Welcome Screen
          </Button>
        </div>
      )}

      {/* Success Badge Printing */}
      {activeStep === 'SUCCESS' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', maxWidth: '420px', textAlign: 'center' }}>
          <div style={{ padding: '16px', borderRadius: radius.full, backgroundColor: colors.status.success.bg, color: colors.status.success.solid }}>
            <CheckCircle2 size={48} />
          </div>
          <h2 style={{ margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900] }}>
            Registration Complete!
          </h2>
          <p style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[600], margin: 0 }}>
            Your visitor badge is currently printing at the tray below. Please attach your pass and proceed to Gate 1 Turnstiles.
          </p>
          <Button variant="primary" size="large" onClick={handleReset}>
            Done (Reset)
          </Button>
        </div>
      )}
    </div>
  );
};
