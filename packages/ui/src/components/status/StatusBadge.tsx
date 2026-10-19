import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  Clock, 
  Ban, 
  AlertOctagon, 
  MinusCircle,
  ShieldCheck,
  Timer
} from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export type StatusType = 
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'pending'
  | 'neutral'
  | 'blocked'
  | 'expired'
  | 'draft'
  | 'approved'
  | 'rejected'
  | 'active'
  | 'inactive'
  | 'overdue'
  // Common Domain Transaction statuses
  | 'ON_PREMISES'
  | 'CHECKED_OUT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW'
  | 'CONFIRMED'
  | 'IN_PROGRESS';

export interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: 'micro' | 'sm' | 'md';
  icon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = 'sm',
  icon = true,
}) => {
  // Normalize domain statuses to semantic color tokens
  const normalizeStatus = (s: StatusType): keyof typeof colors.status => {
    switch (s) {
      case 'ON_PREMISES':
      case 'approved':
      case 'COMPLETED':
        return 'success';
      case 'warning':
      case 'IN_PROGRESS':
        return 'warning';
      case 'danger':
      case 'rejected':
      case 'CANCELLED':
        return 'danger';
      case 'info':
      case 'CONFIRMED':
        return 'info';
      case 'pending':
        return 'pending';
      case 'blocked':
        return 'blocked';
      case 'expired':
        return 'expired';
      case 'draft':
      case 'CHECKED_OUT':
        return 'draft';
      case 'active':
        return 'active';
      case 'inactive':
      case 'NO_SHOW':
        return 'inactive';
      case 'overdue':
        return 'overdue';
      case 'neutral':
      default:
        return 'neutral';
    }
  };

  const semanticKey = normalizeStatus(status);
  const token = colors.status[semanticKey] || colors.status.neutral;

  // Icon mapping
  const renderIcon = () => {
    const iconSize = size === 'micro' ? 10 : size === 'sm' ? 12 : 14;
    switch (semanticKey) {
      case 'success':
      case 'approved':
        return <CheckCircle2 size={iconSize} />;
      case 'warning':
      case 'pending':
        return <AlertTriangle size={iconSize} />;
      case 'danger':
      case 'rejected':
        return <XCircle size={iconSize} />;
      case 'blocked':
        return <Ban size={iconSize} />;
      case 'expired':
        return <Clock size={iconSize} />;
      case 'overdue':
        return <Timer size={iconSize} />;
      case 'active':
        return <ShieldCheck size={iconSize} />;
      case 'info':
        return <Info size={iconSize} />;
      case 'draft':
      case 'inactive':
      case 'neutral':
      default:
        return <MinusCircle size={iconSize} />;
    }
  };

  const displayText = label || status.replace(/_/g, ' ').toUpperCase();

  const sizeStyles: Record<string, React.CSSProperties> = {
    micro: {
      padding: '1px 5px',
      fontSize: typography.fontSize.micro.size,
      height: '18px',
    },
    sm: {
      padding: '2px 7px',
      fontSize: '11px',
      height: '22px',
    },
    md: {
      padding: '3px 10px',
      fontSize: typography.fontSize.xs.size,
      height: '26px',
    },
  };

  return (
    <span
      role="status"
      aria-label={`Status: ${displayText}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        borderRadius: radius.sm,
        fontWeight: typography.fontWeight.semibold,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        backgroundColor: token.bg,
        color: token.fg,
        border: `1px solid ${token.border}`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...sizeStyles[size],
      }}
      className={`vms-status-badge vms-status-${semanticKey}`}
    >
      {icon && renderIcon()}
      <span>{displayText}</span>
    </span>
  );
};
