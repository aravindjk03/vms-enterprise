import React from 'react';
import { 
  Users, 
  UserCheck, 
  HardHat, 
  Handshake, 
  Package, 
  Truck, 
  ShieldCheck, 
  Clock, 
  AlertTriangle, 
  Leaf, 
  TrendingUp, 
  ArrowUpRight,
  Compass,
  Building
} from 'lucide-react';
import { colors, radius, typography } from '@vms/ui/tokens';
import { Card } from '@vms/ui';
import { StatusBadge } from '@vms/ui';
import { Progress } from '@vms/ui';
import { DEMO_OCCUPANCY, DEMO_NOTIFICATIONS, DEMO_VISITORS } from '../mockData.js';

export const ExecutiveDashboardView: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. TOP KPI ROW (Section 11) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
          gap: '14px',
        }}
      >
        {/* KPI 1: People Currently Inside */}
        <Card dense variant="default">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase' }}>
              People Inside
            </span>
            <Users size={16} color={colors.primary[600]} />
          </div>
          <div style={{ fontSize: typography.fontSize['2xl'].size, fontWeight: 800, color: colors.slate[900] }}>
            {DEMO_OCCUPANCY.totalInside.toLocaleString()}
          </div>
          <span style={{ fontSize: '11px', color: colors.status.success.solid, display: 'flex', alignItems: 'center', gap: '2px', marginTop: '2px' }}>
            <TrendingUp size={12} /> 71% of 2,000 max capacity
          </span>
        </Card>

        {/* KPI 2: Today's Visitors */}
        <Card dense variant="default">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase' }}>
              Today's Visitors
            </span>
            <UserCheck size={16} color={colors.primary[600]} />
          </div>
          <div style={{ fontSize: typography.fontSize['2xl'].size, fontWeight: 800, color: colors.slate[900] }}>
            {DEMO_OCCUPANCY.visitorCount}
          </div>
          <span style={{ fontSize: '11px', color: colors.slate[500] }}>
            98 Active • 14 Exited
          </span>
        </Card>

        {/* KPI 3: Today's Contractors */}
        <Card dense variant="default">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase' }}>
              Contractor Force
            </span>
            <HardHat size={16} color={colors.primary[600]} />
          </div>
          <div style={{ fontSize: typography.fontSize['2xl'].size, fontWeight: 800, color: colors.slate[900] }}>
            {DEMO_OCCUPANCY.contractorCount}
          </div>
          <span style={{ fontSize: '11px', color: colors.slate[500] }}>
            Across 24 active work orders
          </span>
        </Card>

        {/* KPI 4: Today's Customers */}
        <Card dense variant="default">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase' }}>
              Customer Audits
            </span>
            <Handshake size={16} color={colors.primary[600]} />
          </div>
          <div style={{ fontSize: typography.fontSize['2xl'].size, fontWeight: 800, color: colors.slate[900] }}>
            4 Accounts
          </div>
          <span style={{ fontSize: '11px', color: colors.primary[700] }}>
            VIP Protocols Active
          </span>
        </Card>

        {/* KPI 5: Material Transactions */}
        <Card dense variant="default">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase' }}>
              Material Movements
            </span>
            <Package size={16} color={colors.primary[600]} />
          </div>
          <div style={{ fontSize: typography.fontSize['2xl'].size, fontWeight: 800, color: colors.slate[900] }}>
            102 Passes
          </div>
          <span style={{ fontSize: '11px', color: colors.slate[500] }}>
            68 Inward • 34 Outward
          </span>
        </Card>

        {/* KPI 6: Vehicles Inside */}
        <Card dense variant="default">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase' }}>
              Vehicles Inside
            </span>
            <Truck size={16} color={colors.primary[600]} />
          </div>
          <div style={{ fontSize: typography.fontSize['2xl'].size, fontWeight: 800, color: colors.slate[900] }}>
            {DEMO_OCCUPANCY.vehiclesInside}
          </div>
          <span style={{ fontSize: '11px', color: colors.slate[500] }}>
            12 Weighbridge • 30 Bays
          </span>
        </Card>
      </div>

      {/* 2. SECOND AREA: Gate Activity, Approvals, Exceptions, Emergency (Section 11) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '14px' }}>
        <Card title="Gate Activity & Throughput" subtitle="Real-time ingress and egress velocity across 4 gates">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[700] }}>
                Gate 1 (North Main Passenger)
              </span>
              <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                112 movements / hr
              </strong>
            </div>
            <Progress value={78} color={colors.primary[600]} height={6} showPercent={false} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[700] }}>
                Gate 2 (Commercial Heavy Logistics)
              </span>
              <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                48 trucks / hr
              </strong>
            </div>
            <Progress value={52} color={colors.primary[600]} height={6} showPercent={false} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[700] }}>
                Gate 3 (Contractor & Maintenance)
              </span>
              <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
                86 workers / hr
              </strong>
            </div>
            <Progress value={65} color={colors.primary[600]} height={6} showPercent={false} />
          </div>
        </Card>

        <Card title="Pending Approvals & SLA" subtitle="Host, EHS and commercial approvals awaiting signature">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[900] }}>
                  CUST-2026-0089: Meridian Delegation
                </strong>
                <span style={{ fontSize: '11px', color: colors.slate[500] }}>Awaiting Plant Director sign-off</span>
              </div>
              <StatusBadge status="pending" size="micro" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[900] }}>
                  PTW-2026-094: Boiler Hot Work
                </strong>
                <span style={{ fontSize: '11px', color: colors.slate[500] }}>EHS Safety Officer review</span>
              </div>
              <StatusBadge status="warning" size="micro" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: colors.slate[50], borderRadius: radius.sm }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[900] }}>
                  MAT-ESCROW-41: Returnable Spares
                </strong>
                <span style={{ fontSize: '11px', color: colors.slate[500] }}>Gate extension SLA</span>
              </div>
              <StatusBadge status="approved" size="micro" />
            </div>
          </div>
        </Card>

        <Card title="Operational Exceptions & Security" subtitle="Live perimeter compliance and overstay alerts">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: colors.status.danger.bg, borderRadius: radius.sm, color: colors.status.danger.fg }}>
              <AlertTriangle size={16} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: typography.fontSize.xs.size }}>2 Overstay Passes Active</strong>
                <span style={{ fontSize: '10px' }}>Visitors exceeded scheduled exit by &gt; 30 mins</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: colors.status.warning.bg, borderRadius: radius.sm, color: colors.status.warning.fg }}>
              <Clock size={16} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <strong style={{ fontSize: typography.fontSize.xs.size }}>8 Contractor Inductions Lapsed</strong>
                <span style={{ fontSize: '10px' }}>Blocked from turnstile entry until re-inducted</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderTop: `1px solid ${colors.slate[200]}` }}>
              <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>Plant Safety Readiness:</span>
              <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.success.solid }}>NORMAL / DEFCON 4</strong>
            </div>
          </div>
        </Card>
      </div>

      {/* 3. THIRD AREA: MULTI-PIPELINE TRENDS (Section 11) */}
      <Card title="Weekly Operational Throughput Trends" subtitle="Aggregated volume across primary transaction pipelines (Demo Data)">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '16px' }}>
          <div style={{ padding: '12px', backgroundColor: colors.slate[50], borderRadius: radius.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }}>Visitor Influx</span>
              <span style={{ fontSize: '11px', color: colors.status.success.solid, fontWeight: 700 }}>+8.4% WoW</span>
            </div>
            <div style={{ fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>892 Visitors</div>
            <span style={{ fontSize: '11px', color: colors.slate[500] }}>Peak: Tuesday 10:00 - 11:30 AM</span>
          </div>

          <div style={{ padding: '12px', backgroundColor: colors.slate[50], borderRadius: radius.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }}>Contractor Shifts</span>
              <span style={{ fontSize: '11px', color: colors.primary[600], fontWeight: 700 }}>Stable</span>
            </div>
            <div style={{ fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>3,410 Check-ins</div>
            <span style={{ fontSize: '11px', color: colors.slate[500] }}>99.2% Induction Compliance</span>
          </div>

          <div style={{ padding: '12px', backgroundColor: colors.slate[50], borderRadius: radius.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }}>Material Freight</span>
              <span style={{ fontSize: '11px', color: colors.status.success.solid, fontWeight: 700 }}>+12.1% WoW</span>
            </div>
            <div style={{ fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>412 Consignments</div>
            <span style={{ fontSize: '11px', color: colors.slate[500] }}>Average Weighbridge Turnaround: 18 mins</span>
          </div>

          <div style={{ padding: '12px', backgroundColor: colors.slate[50], borderRadius: radius.md }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[700] }}>Commercial Vehicles</span>
              <span style={{ fontSize: '11px', color: colors.status.warning.solid, fontWeight: 700 }}>2 Gate Holds</span>
            </div>
            <div style={{ fontSize: typography.fontSize.xl.size, fontWeight: 800, color: colors.slate[900] }}>298 Trucks</div>
            <span style={{ fontSize: '11px', color: colors.slate[500] }}>Zero Overweight Violations</span>
          </div>
        </div>
      </Card>

      {/* 4. FOURTH AREA: ESG & GHG SUSTAINABILITY INTELLIGENCE (Section 11) */}
      <Card variant="esg" title="Cross-Domain ESG Activity & Scope 3 Footprint" subtitle="Normalized transport activity automatically derived from operational gate passes">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '16px' }}>
          <div>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[600] }}>
              Today's Captured Mobility Emissions
            </span>
            <div style={{ fontSize: typography.fontSize['2xl'].size, fontWeight: 800, color: colors.esg[700], margin: '4px 0' }}>
              4,820 kg CO₂e
            </div>
            <span style={{ fontSize: '11px', color: colors.slate[500] }}>
              Derived across 102 transport legs (Scope 3 Cat 4, 6 & 7)
            </span>
          </div>

          <div>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[600] }}>
              Mobility Modal Share
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Public Transit / Buses (38%)</span>
                <span>Carpool / Shared (34%)</span>
                <span>Private Auto (28%)</span>
              </div>
              <div style={{ display: 'flex', height: '8px', borderRadius: radius.full, overflow: 'hidden' }}>
                <div style={{ width: '38%', backgroundColor: colors.esg[600] }} />
                <div style={{ width: '34%', backgroundColor: colors.primary[600] }} />
                <div style={{ width: '28%', backgroundColor: colors.slate[400] }} />
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 600, color: colors.slate[600] }}>
              Site Carbon Benchmark (kg CO₂e / movement)
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px', fontSize: '11px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Chennai Plant:</span>
                <strong>4.2 kg (Best Performing)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Pune Plant:</span>
                <span>5.8 kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Jamshedpur Works:</span>
                <span>7.1 kg (Heavy Freight Focus)</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
