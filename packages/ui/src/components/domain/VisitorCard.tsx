import React from 'react';
import { Calendar, Clock, User, QrCode } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';

export interface VisitorCardProps {
  transactionId: string;
  visitorName: string;
  company?: string;
  purpose: string;
  hostName: string;
  scheduledTime: string;
  status: string;
  gatePassId?: string;
  onPrintBadge?: () => void;
  onClick?: () => void;
}

export const VisitorCard: React.FC<VisitorCardProps> = ({
  transactionId,
  visitorName,
  company,
  purpose,
  hostName,
  scheduledTime,
  status,
  gatePassId,
  onPrintBadge,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
        gap: '8px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 100ms ease',
      }}
      className="vms-visitor-card"
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <span style={{ fontSize: typography.fontSize.xs.size, fontFamily: typography.fontFamily.mono, color: colors.slate[500] }}>
          {transactionId}
        </span>
        <StatusBadge status={status as any} size="micro" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <strong style={{ fontSize: typography.fontSize.base.size, color: colors.slate[900] }}>
            {visitorName}
          </strong>
          {company && (
            <div style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600] }}>
              {company}
            </div>
          )}
        </div>
        {onPrintBadge && (
          <button
            type="button"
            title="Print Pass / Badge"
            onClick={(e) => {
              e.stopPropagation();
              onPrintBadge();
            }}
            style={{
              padding: '6px',
              borderRadius: radius.sm,
              border: `1px solid ${colors.slate[200]}`,
              backgroundColor: colors.slate[50],
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <QrCode size={16} color={colors.primary[600]} />
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          paddingTop: '6px',
          borderTop: `1px solid ${colors.slate[100]}`,
          fontSize: '11px',
          color: colors.slate[600],
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <User size={11} color={colors.slate[400]} />
          <span>Host: <strong>{hostName}</strong></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={11} color={colors.slate[400]} />
          <span>{scheduledTime}</span>
        </div>
      </div>
    </div>
  );
};
