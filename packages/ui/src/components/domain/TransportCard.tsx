import React from 'react';
import { Compass, Leaf, Car, Fuel, Users, MapPin, CheckCircle2 } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export interface TransportCardProps {
  transportId: string;
  sourceTransactionId: string;
  mode: string;
  vehicleClass: string;
  fuelType: string;
  distanceKm: number;
  distanceProvenance: 'MEASURED' | 'USER_PROVIDED' | 'SYSTEM_ESTIMATED' | 'SYSTEM_CALCULATED' | 'IMPORTED';
  occupancy: number;
  originLocation: string;
  destinationLocation: string;
  journeyType: string;
  isEsgCaptured?: boolean;
}

export const TransportCard: React.FC<TransportCardProps> = ({
  transportId,
  sourceTransactionId,
  mode,
  vehicleClass,
  fuelType,
  distanceKm,
  distanceProvenance,
  occupancy,
  originLocation,
  destinationLocation,
  journeyType,
  isEsgCaptured = true,
}) => {
  const getProvenanceBadge = (prov: string) => {
    switch (prov) {
      case 'MEASURED':
        return { label: 'Measured (Weighbridge/Odometer)', bg: colors.status.success.bg, fg: colors.status.success.fg };
      case 'SYSTEM_ESTIMATED':
      case 'SYSTEM_CALCULATED':
        return { label: 'System Estimated (GIS Route)', bg: colors.status.info.bg, fg: colors.status.info.fg };
      case 'USER_PROVIDED':
        return { label: 'User Provided', bg: colors.status.warning.bg, fg: colors.status.warning.fg };
      default:
        return { label: prov, bg: colors.slate[100], fg: colors.slate[700] };
    }
  };

  const badge = getProvenanceBadge(distanceProvenance);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.esg[500]}`,
        borderRadius: radius.md,
        gap: '10px',
      }}
      className="vms-transport-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Compass size={16} color={colors.primary[600]} />
          <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
            Mobility Activity
          </strong>
          <span style={{ fontSize: '11px', fontFamily: typography.fontFamily.mono, color: colors.slate[500] }}>
            {transportId}
          </span>
        </div>

        {isEsgCaptured && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 6px',
              borderRadius: radius.sm,
              backgroundColor: colors.esg[50],
              color: colors.esg[700],
              fontSize: '10px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            <Leaf size={11} color={colors.esg[600]} />
            <span>ESG Activity Captured</span>
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', fontSize: typography.fontSize.xs.size }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[700] }}>
          <Car size={13} color={colors.slate[400]} />
          <span>{mode} ({vehicleClass})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[700] }}>
          <Fuel size={13} color={colors.slate[400]} />
          <span>{fuelType}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[700] }}>
          <Users size={13} color={colors.slate[400]} />
          <span>Occupancy: {occupancy}</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '6px',
          borderTop: `1px solid ${colors.slate[100]}`,
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: colors.slate[600] }}>
          <MapPin size={12} color={colors.slate[400]} />
          <span>{originLocation} $\rightarrow$ {destinationLocation} ({journeyType})</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
            {distanceKm} km
          </strong>
          <span
            style={{
              padding: '1px 5px',
              borderRadius: radius.sm,
              backgroundColor: badge.bg,
              color: badge.fg,
              fontSize: '10px',
              fontWeight: 600,
            }}
          >
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
};
