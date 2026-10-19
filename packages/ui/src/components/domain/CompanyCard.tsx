import React from 'react';
import { Building2, ShieldCheck, Users, Phone, MapPin, Award } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';

export interface CompanyCardProps {
  name: string;
  vendorCode: string;
  tradeCategory: string;
  status: 'active' | 'blocked' | 'pending' | 'approved';
  activeWorkers?: number;
  totalAuthorizedWorkers?: number;
  ehsComplianceScore?: number; // e.g. 98%
  contactPerson?: string;
  contactPhone?: string;
  facilityLocation?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  name,
  vendorCode,
  tradeCategory,
  status,
  activeWorkers = 0,
  totalAuthorizedWorkers = 0,
  ehsComplianceScore,
  contactPerson,
  contactPhone,
  facilityLocation,
  onClick,
  style,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '14px 16px',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 120ms ease, box-shadow 120ms ease',
        ...style,
      }}
      className="vms-company-card"
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              padding: '8px',
              backgroundColor: colors.slate[100],
              borderRadius: radius.sm,
              color: colors.primary[700],
              display: 'flex',
            }}
          >
            <Building2 size={20} />
          </div>
          <div>
            <strong style={{ fontSize: typography.fontSize.sm.size, color: colors.slate[900], display: 'block' }}>
              {name}
            </strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: colors.slate[500] }}>
              <span style={{ fontFamily: typography.fontFamily.mono }}>{vendorCode}</span>
              <span>•</span>
              <span>{tradeCategory}</span>
            </div>
          </div>
        </div>

        <StatusBadge status={status} size="sm" />
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px',
          padding: '8px 10px',
          backgroundColor: colors.slate[50],
          borderRadius: radius.sm,
          fontSize: typography.fontSize.xs.size,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={14} color={colors.slate[500]} />
          <div>
            <span style={{ color: colors.slate[500], fontSize: '10px', display: 'block' }}>ON SITE / ROSTER</span>
            <strong style={{ color: colors.slate[900] }}>
              {activeWorkers} / {totalAuthorizedWorkers}
            </strong>
          </div>
        </div>

        {ehsComplianceScore !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Award size={14} color={ehsComplianceScore >= 90 ? colors.status.success.solid : colors.status.warning.solid} />
            <div>
              <span style={{ color: colors.slate[500], fontSize: '10px', display: 'block' }}>EHS COMPLIANCE</span>
              <strong style={{ color: ehsComplianceScore >= 90 ? colors.status.success.solid : colors.status.warning.solid }}>
                {`${ehsComplianceScore}%`}
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Footer Details */}
      {(contactPerson || facilityLocation) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: colors.slate[500] }}>
          {contactPerson && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span>POC:</span>
              <span style={{ color: colors.slate[800], fontWeight: 500 }}>{contactPerson}</span>
              {contactPhone && <span>({contactPhone})</span>}
            </div>
          )}
          {facilityLocation && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} />
              <span>{facilityLocation}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
