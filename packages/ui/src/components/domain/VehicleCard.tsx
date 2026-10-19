import React from 'react';
import { Truck, User, Gauge, ShieldAlert } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';

export interface VehicleCardProps {
  registrationPlate: string;
  vehicleClass: string;
  driverName: string;
  transporter?: string;
  odometerKm?: number;
  status: string;
  pucExpired?: boolean;
  insuranceExpired?: boolean;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  registrationPlate,
  vehicleClass,
  driverName,
  transporter,
  odometerKm,
  status,
  pucExpired = false,
  insuranceExpired = false,
}) => {
  const hasComplianceAlert = pucExpired || insuranceExpired;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${hasComplianceAlert ? colors.status.danger.solid : colors.slate[200]}`,
        borderRadius: radius.md,
        gap: '8px',
      }}
      className="vms-vehicle-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={18} color={colors.primary[600]} />
          <strong
            style={{
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.fontSize.md.size,
              color: colors.slate[900],
              letterSpacing: '0.04em',
            }}
          >
            {registrationPlate}
          </strong>
        </div>
        <StatusBadge status={status as any} size="micro" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <User size={12} color={colors.slate[400]} />
          <span>Driver: <strong>{driverName}</strong></span>
          {transporter && <span>({transporter})</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
          <span>Class: {vehicleClass}</span>
          {odometerKm !== undefined && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Gauge size={11} /> {odometerKm.toLocaleString()} km
            </span>
          )}
        </div>
      </div>

      {hasComplianceAlert && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: colors.status.danger.bg,
            color: colors.status.danger.fg,
            padding: '4px 8px',
            borderRadius: radius.sm,
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          <ShieldAlert size={12} />
          <span>Compliance Alert: {pucExpired ? 'PUC Expired' : ''} {insuranceExpired ? 'Insurance Expired' : ''}</span>
        </div>
      )}
    </div>
  );
};
