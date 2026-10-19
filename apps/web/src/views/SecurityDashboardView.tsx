import React from 'react';
import { 
  ShieldAlert, 
  DoorClosed, 
  Ban, 
  Clock, 
  AlertTriangle, 
  UserX, 
  Eye, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Card } from '@vms/ui';
import { StatusBadge } from '@vms/ui';
import { Button } from '@vms/ui';

export const SecurityDashboardView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. TOP CRITICAL ALERTS TICKER (Immediately Visible) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: colors.status.danger.solid,
          color: '#ffffff',
          borderRadius: radius.md,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldAlert size={24} />
          <div>
            <strong style={{ fontSize: typography.fontSize.sm.size, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              CRITICAL SECURITY EVENT: RESTRICTED ZONE ACCESS BREACH
            </strong>
            <div style={{ fontSize: typography.fontSize.xs.size, opacity: 0.95 }}>
              Badge #CONT-8820 (PestControl Services) rejected at Solvent Storage Bay B turnstile. Security guard dispatched.
            </div>
          </div>
        </div>

        <Button
          variant="secondary"
          size="dense"
          style={{ backgroundColor: '#ffffff', color: colors.status.danger.solid, fontWeight: 800 }}
          onClick={() => alert('Dispatched shift patrol to Solvent Storage Bay B')}
        >
          Acknowledge / Dispatch
        </Button>
      </div>

      {/* 2. SECURITY SPLIT VIEW: Gate Monitor & Access Denials */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Gate Activity & Live Lane Monitor */}
        <Card title="Live Gate Lane Monitor" subtitle="Turnstiles, Boom Barriers, and ANPR feed telemetry">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: radius.full, backgroundColor: colors.status.success.solid }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: typography.fontSize.xs.size }}>Gate 1 — Pedestrian Turnstile #1A</strong>
                  <span style={{ fontSize: '11px', color: colors.slate[500] }}>Passage: Aravind S. (Siemens) • Inbound</span>
                </div>
              </div>
              <StatusBadge status="approved" size="micro" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: radius.full, backgroundColor: colors.status.success.solid }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: typography.fontSize.xs.size }}>Gate 2 — Commercial Barrier #2B (Weighbridge)</strong>
                  <span style={{ fontSize: '11px', color: colors.slate[500] }}>Vehicle: TN 22 CX 9821 • Gross Weight: 38.4 MT</span>
                </div>
              </div>
              <StatusBadge status="approved" size="micro" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: colors.status.danger.bg, borderRadius: radius.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: radius.full, backgroundColor: colors.status.danger.solid }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.danger.fg }}>Gate 3 — Contractor Barrier #3A</strong>
                  <span style={{ fontSize: '11px', color: colors.status.danger.fg }}>ANPR Hold: MH 12 QZ 1099 (PUC Expired)</span>
                </div>
              </div>
              <StatusBadge status="blocked" size="micro" />
            </div>
          </div>
        </Card>

        {/* Access Denied & Watchlist hits */}
        <Card title="Access Denied Stream" subtitle="Automated perimeter blocks and compliance failures">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '8px 12px', border: `1px solid ${colors.status.danger.border}`, backgroundColor: colors.status.danger.bg, borderRadius: radius.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.danger.fg }}>
                  Turnstile Denied: Suresh K. (Contractor)
                </strong>
                <span style={{ fontSize: '10px', color: colors.slate[500] }}>09:12 AM</span>
              </div>
              <span style={{ fontSize: '11px', color: colors.slate[700] }}>
                Reason: Safety Induction expired on 22-Sep-2026. Required mandatory re-training.
              </span>
            </div>

            <div style={{ padding: '8px 12px', border: `1px solid ${colors.slate[200]}`, backgroundColor: '#ffffff', borderRadius: radius.sm }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[900] }}>
                  Zone Pass Denied: Visitor #VIS-00185
                </strong>
                <span style={{ fontSize: '10px', color: colors.slate[500] }}>08:45 AM</span>
              </div>
              <span style={{ fontSize: '11px', color: colors.slate[600] }}>
                Reason: Attempted entry to R&D Prototyping Workshop without NDA clearance.
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. OVERSTAYS AND RECENT SECURITY EVENTS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Active Overstay Tracker */}
        <Card title="Active Overstay Tracker" subtitle="Personnel exceeding authorized exit time by &gt; 30 minutes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: colors.status.overdue.bg, border: `1px solid ${colors.status.overdue.border}`, borderRadius: radius.sm }}>
              <div>
                <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.overdue.fg }}>
                  Karthik Raja (L&T Construction)
                </strong>
                <div style={{ fontSize: '11px', color: colors.slate[600] }}>
                  Scheduled Exit: 12:00 PM • Overstayed: <strong>+4h 25m</strong>
                </div>
                <div style={{ fontSize: '10px', color: colors.slate[500] }}>
                  Host: Arun Kumar (Ext: 4421)
                </div>
              </div>
              <Button variant="danger" size="dense" onClick={() => alert('Host contacted')}>
                Call Host
              </Button>
            </div>
          </div>
        </Card>

        {/* Security Audit Log Stream */}
        <Card title="Audit Event Stream" subtitle="Tamper-evident chronological security log">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: typography.fontSize.xs.size }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.slate[100]}` }}>
              <span>10:04 AM • Guard ID #G-102 manually overrode barrier for Ambulance #TN-09-EM-112</span>
              <span style={{ color: colors.slate[400] }}>EMERGENCY OVERRIDE</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: `1px solid ${colors.slate[100]}` }}>
              <span>09:41 AM • Driver Murugan G. passed zero-tolerance breathalyzer test (0.00% BAC)</span>
              <span style={{ color: colors.status.success.solid, fontWeight: 600 }}>PASSED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span>08:15 AM • ANPR Camera matched transport vehicle TN 22 CX 9821 with manifest DC-882109</span>
              <span style={{ color: colors.primary[600], fontWeight: 600 }}>MATCHED</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
