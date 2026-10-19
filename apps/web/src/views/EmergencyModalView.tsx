import React from 'react';
import { AlertOctagon, Users, ShieldAlert, CheckCircle2, AlertTriangle, PhoneCall, Radio, Volume2 } from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Modal, Button, Progress } from '@vms/ui';
import { DEMO_OCCUPANCY } from '../mockData.js';

export interface EmergencyModalViewProps {
  isOpen: boolean;
  onClose: () => void;
  isSirenActive: boolean;
  onToggleSiren: () => void;
}

export const EmergencyModalView: React.FC<EmergencyModalViewProps> = ({
  isOpen,
  onClose,
  isSirenActive,
  onToggleSiren,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="EMERGENCY MUSTER COMMAND CENTER"
      description="Real-time plant evacuation headcount and muster station roll-call"
      maxWidth="720px"
      footer={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button
              variant={isSirenActive ? 'danger' : 'secondary'}
              size="dense"
              leftIcon={<Volume2 size={14} />}
              onClick={onToggleSiren}
            >
              {isSirenActive ? 'Silence Siren Alarm' : 'Sound Evacuation Alarm'}
            </Button>
          </div>
          <Button variant="secondary" size="dense" onClick={onClose}>
            Close Console
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Evacuation Alert Banner */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: colors.status.danger.bg,
            border: `2px solid ${colors.status.danger.solid}`,
            borderRadius: radius.md,
            color: colors.status.danger.fg,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertOctagon size={28} color={colors.status.danger.solid} style={{ flexShrink: 0 }} />
          <div>
            <strong style={{ fontSize: typography.fontSize.sm.size, textTransform: 'uppercase' }}>
              LEVEL 1 PLANT EVACUATION PROTOCOL ACTIVE
            </strong>
            <div style={{ fontSize: typography.fontSize.xs.size }}>
              Total Facility Population on Premises: <strong>{DEMO_OCCUPANCY.totalInside} Persons</strong>. Turnstiles unlocked for free egress.
            </div>
          </div>
        </div>

        {/* Muster Station Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: typography.fontSize.sm.size }}>
            <span style={{ fontWeight: 600, color: colors.slate[700] }}>Muster Station Roll-Call Completed</span>
            <strong style={{ color: colors.status.success.solid }}>1,280 / 1,428 Accounted For (90%)</strong>
          </div>
          <Progress value={1280} max={1428} color={colors.status.success.solid} height={10} showPercent={false} />
          <span style={{ fontSize: '11px', color: colors.status.danger.solid, fontWeight: 700 }}>
            148 Persons Pending Muster Verification
          </span>
        </div>

        {/* Muster Station Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: colors.status.success.bg, border: `1px solid ${colors.status.success.border}`, borderRadius: radius.sm }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.success.fg }}>Muster Station A</strong>
              <CheckCircle2 size={14} color={colors.status.success.solid} />
            </div>
            <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.success.fg, margin: '4px 0' }}>
              520 / 520
            </div>
            <span style={{ fontSize: '10px', color: colors.slate[600] }}>Administrative Lawn (100% Cleared)</span>
          </div>

          <div style={{ padding: '10px', backgroundColor: colors.status.success.bg, border: `1px solid ${colors.status.success.border}`, borderRadius: radius.sm }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.success.fg }}>Muster Station B</strong>
              <CheckCircle2 size={14} color={colors.status.success.solid} />
            </div>
            <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.success.fg, margin: '4px 0' }}>
              480 / 500
            </div>
            <span style={{ fontSize: '10px', color: colors.slate[600] }}>Assembly Bay Yard (96% Cleared)</span>
          </div>

          <div style={{ padding: '10px', backgroundColor: colors.status.danger.bg, border: `1px solid ${colors.status.danger.border}`, borderRadius: radius.sm }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.danger.fg }}>Muster Station C</strong>
              <AlertTriangle size={14} color={colors.status.danger.solid} />
            </div>
            <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.danger.fg, margin: '4px 0' }}>
              280 / 408
            </div>
            <span style={{ fontSize: '10px', color: colors.status.danger.fg }}>Chemical Farm (128 Missing)</span>
          </div>
        </div>

        {/* Missing Personnel Roll-Call Roster Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 700, color: colors.slate[700], textTransform: 'uppercase' }}>
            Unaccounted Personnel (Last Known Badge Sensor Ping)
          </span>
          <div style={{ maxHeight: '140px', overflowY: 'auto', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.sm, fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: `1px solid ${colors.slate[100]}` }}>
              <span>Rajesh K. (PestControl Contractor #8820)</span>
              <span style={{ color: colors.status.danger.solid, fontWeight: 600 }}>Chemical Storage Bay B (2 mins ago)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', borderBottom: `1px solid ${colors.slate[100]}` }}>
              <span>Arun Kumar (Facilities Lead - Staff)</span>
              <span style={{ color: colors.status.warning.solid, fontWeight: 600 }}>Control Room 2 (4 mins ago)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px' }}>
              <span>Driver Santosh Yadav (TCI Freight)</span>
              <span style={{ color: colors.status.warning.solid, fontWeight: 600 }}>Weighbridge Inward Bay (6 mins ago)</span>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
