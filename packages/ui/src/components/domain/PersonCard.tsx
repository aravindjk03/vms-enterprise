import React from 'react';
import { User, ShieldCheck, Phone, Mail, Building } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { StatusBadge } from '../status/StatusBadge.js';

export interface PersonCardProps {
  name: string;
  roleOrDesignation?: string;
  company?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  isVerified?: boolean;
  status?: string;
}

export const PersonCard: React.FC<PersonCardProps> = ({
  name,
  roleOrDesignation,
  company,
  phone,
  email,
  photoUrl,
  isVerified = true,
  status,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 14px',
        backgroundColor: '#ffffff',
        border: `1px solid ${colors.slate[200]}`,
        borderRadius: radius.md,
      }}
      className="vms-person-card"
    >
      {/* Avatar / Photo */}
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: radius.full,
          backgroundColor: colors.slate[100],
          border: `1.5px solid ${isVerified ? colors.status.success.solid : colors.slate[300]}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {photoUrl ? (
          <img src={photoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <User size={24} color={colors.slate[500]} />
        )}
        {isVerified && (
          <span
            title="Identity Verified"
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              backgroundColor: '#ffffff',
              borderRadius: radius.full,
              padding: '1px',
              display: 'flex',
            }}
          >
            <ShieldCheck size={14} color={colors.status.success.solid} />
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <strong
            style={{
              fontSize: typography.fontSize.base.size,
              color: colors.slate[900],
              fontWeight: typography.fontWeight.bold,
            }}
          >
            {name}
          </strong>
          {status && <StatusBadge status={status as any} size="micro" />}
        </div>

        {(roleOrDesignation || company) && (
          <span style={{ fontSize: typography.fontSize.xs.size, color: colors.slate[600], display: 'flex', alignItems: 'center', gap: '4px' }}>
            {company && <Building size={12} />}
            {roleOrDesignation ? `${roleOrDesignation} • ${company || ''}` : company}
          </span>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2px', fontSize: '11px', color: colors.slate[500] }}>
          {phone && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Phone size={11} /> {phone}
            </span>
          )}
          {email && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Mail size={11} /> {email}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
