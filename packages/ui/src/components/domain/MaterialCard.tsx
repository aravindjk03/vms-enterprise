import React from 'react';
import { Package, ArrowDownRight, ArrowUpRight, Scale, FileText } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';

export interface MaterialCardProps {
  challanNumber: string;
  movementType: 'INWARD' | 'OUTWARD';
  classification: string;
  transporter: string;
  grossWeightKg?: number;
  tareWeightKg?: number;
  netWeightKg?: number;
  status: string;
  poReference?: string;
}

export const MaterialCard: React.FC<MaterialCardProps> = ({
  challanNumber,
  movementType,
  classification,
  transporter,
  grossWeightKg,
  tareWeightKg,
  netWeightKg,
  status,
  poReference,
}) => {
  const isInward = movementType === 'INWARD';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        gap: '8px',
      }}
      className="vms-material-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {isInward ? (
            <ArrowDownRight size={16} color={colors.status.success.solid} />
          ) : (
            <ArrowUpRight size={16} color={colors.primary[600]} />
          )}
          <span style={{ fontSize: typography.fontSize.xs.size, fontWeight: 700, color: isInward ? colors.status.success.solid : colors.primary[700] }}>
            {movementType} • {classification}
          </span>
        </div>
        <StatusBadge status={status as any} size="micro" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.sm.size, color: colors.slate[900] }}>
            {challanNumber}
          </strong>
          {poReference && (
            <div style={{ fontSize: '11px', color: colors.slate[500] }}>
              PO: {poReference}
            </div>
          )}
        </div>
        <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
          {transporter}
        </span>
      </div>

      {(grossWeightKg !== undefined || netWeightKg !== undefined) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '6px',
            borderTop: `1px solid ${colors.slate[100]}`,
            fontSize: '11px',
            color: colors.slate[600],
          }}
        >
          <Scale size={12} color={colors.slate[400]} />
          {netWeightKg !== undefined ? (
            <span>Net: <strong>{netWeightKg.toLocaleString()} kg</strong></span>
          ) : null}
          {grossWeightKg !== undefined ? (
            <span>Gross: {grossWeightKg.toLocaleString()} kg</span>
          ) : null}
        </div>
      )}
    </div>
  );
};
