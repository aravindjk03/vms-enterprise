import React from 'react';
import { Users, UserCheck, HardHat, Truck, AlertTriangle } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Progress } from '../status/Progress.js';

export interface OccupancyStats {
  totalInside: number;
  maxCapacity: number;
  staffCount: number;
  contractorCount: number;
  visitorCount: number;
  driverCount: number;
  vehiclesInside: number;
  overstayCount: number;
}

export interface OccupancyPanelProps {
  stats: OccupancyStats;
  siteName: string;
}

export const OccupancyPanel: React.FC<OccupancyPanelProps> = ({ stats, siteName }) => {
  const occupancyPercent = Math.round((stats.totalInside / stats.maxCapacity) * 100);
  const isHighOccupancy = occupancyPercent >= 90;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        backgroundColor: '#ffffff',
        border: `1px solid ${isHighOccupancy ? colors.status.warning.solid : colors.slate[200]}`,
        borderRadius: radius.md,
        gap: '14px',
      }}
      className="vms-occupancy-panel"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color={colors.primary[600]} />
          <div>
            <h4 style={{ margin: 0, fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
              Live Facility Occupancy
            </h4>
            <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[500] }}>
              {siteName}
            </span>
          </div>
        </div>

        {stats.overstayCount > 0 && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              backgroundColor: colors.status.danger.bg,
              color: colors.status.danger.fg,
              border: `1px solid ${colors.status.danger.border}`,
              borderRadius: radius.sm,
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={12} />
            {stats.overstayCount} Overstay Alert
          </span>
        )}
      </div>

      {/* Main Big Number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: typography.fontSize['3xl'].size,
            fontWeight: 800,
            color: colors.slate[900],
            letterSpacing: '-0.02em',
          }}
        >
          {stats.totalInside.toLocaleString()}
        </span>
        <span style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[500] }}>
          / {stats.maxCapacity.toLocaleString()} Max Capacity
        </span>
      </div>

      <Progress
        value={stats.totalInside}
        max={stats.maxCapacity}
        showPercent
        color={isHighOccupancy ? colors.status.warning.solid : colors.primary[600]}
      />

      {/* Breakdown Breakdown */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '8px',
          paddingTop: '8px',
          borderTop: `1px solid ${colors.slate[100]}`,
          textAlign: 'center',
        }}
      >
        <div>
          <span style={{ fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }}>
            Staff
          </span>
          <div style={{ fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
            {stats.staffCount}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }}>
            Contractors
          </span>
          <div style={{ fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
            {stats.contractorCount}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }}>
            Visitors
          </span>
          <div style={{ fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
            {stats.visitorCount}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '10px', color: colors.slate[500], textTransform: 'uppercase', fontWeight: 600 }}>
            Vehicles
          </span>
          <div style={{ fontSize: typography.fontSize.sm.size, fontWeight: 700, color: colors.slate[900] }}>
            {stats.vehiclesInside}
          </div>
        </div>
      </div>
    </div>
  );
};
