import React from 'react';
import { 
  Users, 
  HardHat, 
  Truck, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Card } from '@vms/ui';
import { StatusBadge } from '@vms/ui';
import { OccupancyPanel } from '@vms/ui';
import { DEMO_OCCUPANCY } from '../mockData.js';

export const OperationsDashboardView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Live Site Occupancy Widget */}
      <OccupancyPanel stats={DEMO_OCCUPANCY} siteName="Chennai Radial Tyre Plant — Real-time Headcounts" />

      {/* 2. Operations Breakdown Grids (Visitors, Contractors, Vehicles, Materials) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Visitors Breakdown */}
        <Card title="Visitor Operations" subtitle="Expected, Arrived, Inside, Exited, Overdue">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>EXPECTED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }}>18</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>ARRIVED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.primary[700] }}>112</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.primary[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.primary[800], fontWeight: 700 }}>INSIDE</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.primary[800] }}>98</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>EXITED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[700] }}>14</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.status.danger.bg, borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.status.danger.fg, fontWeight: 700 }}>OVERDUE</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.danger.solid }}>2</div>
            </div>
          </div>
        </Card>

        {/* Contractors Breakdown */}
        <Card title="Contractor Roster" subtitle="Expected, Checked-in, Active, Non-compliant">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>EXPECTED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }}>450</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>CHECKED-IN</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.primary[700] }}>428</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.primary[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.primary[800], fontWeight: 700 }}>ACTIVE</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.primary[800] }}>420</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.status.warning.bg, borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.status.warning.fg, fontWeight: 700 }}>NON-COMPLY</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.warning.solid }}>8</div>
            </div>
          </div>
        </Card>

        {/* Commercial Vehicles Breakdown */}
        <Card title="Commercial Vehicles" subtitle="Expected, Inside, Exited, Exceptions">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>EXPECTED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }}>54</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.primary[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.primary[800], fontWeight: 700 }}>INSIDE</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.primary[800] }}>42</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>EXITED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[700] }}>12</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.status.danger.bg, borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.status.danger.fg, fontWeight: 700 }}>EXCEPTIONS</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.danger.solid }}>1</div>
            </div>
          </div>
        </Card>

        {/* Materials Inspection Pipeline */}
        <Card title="Material Inward / Outward" subtitle="Expected, Arrived, Inspection, Approved, Blocked">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', textAlign: 'center' }}>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>EXPECTED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }}>82</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>ARRIVED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[900] }}>68</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.status.warning.bg, borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.status.warning.fg, fontWeight: 700 }}>INSPECT</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.warning.solid }}>5</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.status.success.bg, borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.status.success.fg, fontWeight: 700 }}>APPROVED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.status.success.solid }}>63</div>
            </div>
            <div style={{ padding: '8px 4px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <span style={{ fontSize: '10px', color: colors.slate[500], fontWeight: 700 }}>BLOCKED</span>
              <div style={{ fontSize: typography.fontSize.lg.size, fontWeight: 800, color: colors.slate[700] }}>0</div>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. Approvals and Severity Alerts Band */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Approvals State */}
        <Card title="Approvals Queue SLA" subtitle="Pending, Escalated, Overdue approvals">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color={colors.status.warning.solid} />
                <span style={{ fontSize: typography.fontSize.sm.size, fontWeight: 600 }}>Pending Host Reviews</span>
              </div>
              <strong style={{ fontSize: typography.fontSize.md.size, color: colors.slate[900] }}>6 Pending</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} color={colors.status.danger.solid} />
                <span style={{ fontSize: typography.fontSize.sm.size, fontWeight: 600 }}>Escalated to Site Head</span>
              </div>
              <strong style={{ fontSize: typography.fontSize.md.size, color: colors.status.danger.solid }}>1 Escalated</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.sm }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} color={colors.status.success.solid} />
                <span style={{ fontSize: typography.fontSize.sm.size, fontWeight: 600 }}>Resolved Within SLA (Today)</span>
              </div>
              <strong style={{ fontSize: typography.fontSize.md.size, color: colors.status.success.solid }}>94.2%</strong>
            </div>
          </div>
        </Card>

        {/* Operational Severity Alerts */}
        <Card title="Active Operational Alerts" subtitle="Prioritized actionable incidents">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: colors.status.danger.bg, borderRadius: radius.sm, color: colors.status.danger.fg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} />
                <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 700 }}>CRITICAL: Restricted Zone Breach (Solvent Bay B)</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>Immediate</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: colors.status.warning.bg, borderRadius: radius.sm, color: colors.status.warning.fg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={16} />
                <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 700 }}>HIGH: Hot Work PTW #HW-094 Expiring Soon</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>45m left</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: colors.slate[50], borderRadius: radius.sm, color: colors.slate[700] }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color={colors.slate[500]} />
                <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 500 }}>MEDIUM: Weighbridge Scale #2 Routine Zero-Calibration</span>
              </div>
              <span style={{ fontSize: '11px' }}>2h left</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
