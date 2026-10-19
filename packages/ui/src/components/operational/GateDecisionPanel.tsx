import React from 'react';
import { CheckCircle2, XCircle, Search, AlertOctagon, Printer, RotateCcw } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';

export interface GateDecisionSubject {
  identifier: string;
  name: string;
  domain: 'VISITOR' | 'CONTRACTOR' | 'VEHICLE' | 'MATERIAL';
  company?: string;
  passValid: boolean;
  inductionValid: boolean;
  zoneAuthorized: boolean;
  rejectionReasons?: string[];
  photoUrl?: string;
}

export interface GateDecisionPanelProps {
  laneName: string;
  gateType: string;
  subject?: GateDecisionSubject | null;
  onAllow: () => void;
  onDeny: (reason: string) => void;
  onClear: () => void;
  onReprint?: () => void;
  isProcessing?: boolean;
}

export const GateDecisionPanel: React.FC<GateDecisionPanelProps> = ({
  laneName,
  gateType,
  subject,
  onAllow,
  onDeny,
  onClear,
  onReprint,
  isProcessing = false,
}) => {
  const isAllowed = subject ? subject.passValid && subject.inductionValid && subject.zoneAuthorized : false;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        backgroundColor: '#ffffff',
        border: `2px solid ${subject ? (isAllowed ? colors.status.success.solid : colors.status.danger.solid) : colors.slate[300]}`,
        borderRadius: radius.md,
      }}
      className="vms-gate-decision-panel"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[500], textTransform: 'uppercase' }}>
            {gateType} • Active Lane
          </span>
          <h3 style={{ margin: 0, fontSize: typography.fontSize.xl.size, color: colors.slate[900], fontWeight: 800 }}>
            {laneName}
          </h3>
        </div>

        {subject && (
          <Button variant="outline" size="dense" onClick={onClear} leftIcon={<RotateCcw size={12} />}>
            Clear [ESC]
          </Button>
        )}
      </div>

      {/* Subject Identity & Verification Checks */}
      {subject ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '12px 14px',
              backgroundColor: colors.slate[50],
              borderRadius: radius.md,
              border: `1px solid ${colors.slate[200]}`,
            }}
          >
            {/* Avatar or Snapshot */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: radius.sm,
                backgroundColor: colors.slate[200],
                overflow: 'hidden',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {subject.photoUrl ? (
                <img src={subject.photoUrl} alt={subject.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '24px', fontWeight: 700, color: colors.slate[500] }}>
                  {subject.name.charAt(0)}
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
              <span style={{ fontSize: '11px', fontFamily: typography.fontFamily.mono, color: colors.slate[500] }}>
                {subject.identifier} • {subject.domain}
              </span>
              <strong style={{ fontSize: typography.fontSize.lg.size, color: colors.slate[900] }}>
                {subject.name}
              </strong>
              {subject.company && (
                <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
                  {subject.company}
                </span>
              )}
            </div>
          </div>

          {/* Verification Check Matrix */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              fontSize: typography.fontSize.xs.size,
            }}
          >
            <div
              style={{
                padding: '8px',
                borderRadius: radius.sm,
                backgroundColor: subject.passValid ? colors.status.success.bg : colors.status.danger.bg,
                border: `1px solid ${subject.passValid ? colors.status.success.border : colors.status.danger.border}`,
                color: subject.passValid ? colors.status.success.fg : colors.status.danger.fg,
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Pass: {subject.passValid ? 'VALID' : 'INVALID'}
            </div>

            <div
              style={{
                padding: '8px',
                borderRadius: radius.sm,
                backgroundColor: subject.inductionValid ? colors.status.success.bg : colors.status.danger.bg,
                border: `1px solid ${subject.inductionValid ? colors.status.success.border : colors.status.danger.border}`,
                color: subject.inductionValid ? colors.status.success.fg : colors.status.danger.fg,
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Induction: {subject.inductionValid ? 'VALID' : 'LAPSED'}
            </div>

            <div
              style={{
                padding: '8px',
                borderRadius: radius.sm,
                backgroundColor: subject.zoneAuthorized ? colors.status.success.bg : colors.status.danger.bg,
                border: `1px solid ${subject.zoneAuthorized ? colors.status.success.border : colors.status.danger.border}`,
                color: subject.zoneAuthorized ? colors.status.success.fg : colors.status.danger.fg,
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              Zone: {subject.zoneAuthorized ? 'PERMITTED' : 'BLOCKED'}
            </div>
          </div>

          {subject.rejectionReasons && subject.rejectionReasons.length > 0 && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: colors.status.danger.bg,
                color: colors.status.danger.fg,
                borderRadius: radius.sm,
                fontSize: typography.fontSize.xs.size,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertOctagon size={16} />
              <span><strong>Block Reason:</strong> {subject.rejectionReasons.join('; ')}</span>
            </div>
          )}

          {/* Decision Buttons (Large high-vis controls) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
            <Button
              variant={isAllowed ? 'primary' : 'secondary'}
              size="large"
              isLoading={isProcessing}
              shortcut="SPACE"
              onClick={onAllow}
              style={{
                backgroundColor: isAllowed ? colors.status.success.solid : colors.slate[300],
                color: isAllowed ? '#ffffff' : colors.slate[700],
                fontSize: typography.fontSize.md.size,
                fontWeight: 800,
              }}
              leftIcon={<CheckCircle2 size={22} />}
            >
              ALLOW PASSAGE
            </Button>

            <Button
              variant="danger"
              size="large"
              isLoading={isProcessing}
              shortcut="X"
              onClick={() => onDeny('Operator Rejected')}
              style={{
                fontSize: typography.fontSize.md.size,
                fontWeight: 800,
              }}
              leftIcon={<XCircle size={22} />}
            >
              DENY / HOLD
            </Button>
          </div>

          {onReprint && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button variant="outline" size="dense" onClick={onReprint} leftIcon={<Printer size={14} />}>
                Reprint Gate Pass [P]
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
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
          }}
        >
          <Search size={28} color={colors.slate[400]} />
          <strong style={{ fontSize: typography.fontSize.md.size, color: colors.slate[800] }}>
            Awaiting Barcode / QR / ANPR Scan
          </strong>
          <span style={{ fontSize: typography.fontSize.xs.size }}>
            Scan a credential, RFID token or enter license plate in the fast-search box.
          </span>
        </div>
      )}
    </div>
  );
};
