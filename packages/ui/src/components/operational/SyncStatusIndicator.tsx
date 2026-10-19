import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';

export type GateSyncState = 'ONLINE' | 'OFFLINE' | 'SYNC_PENDING' | 'SYNCING' | 'SYNCED' | 'CONFLICT';

export interface SyncStatusIndicatorProps {
  state: GateSyncState;
  pendingCount?: number;
  lastSyncTime?: string;
  onSyncTrigger?: () => void;
  compact?: boolean;
  style?: React.CSSProperties;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({
  state,
  pendingCount = 0,
  lastSyncTime,
  onSyncTrigger,
  compact = false,
  style,
}) => {
  const getConfig = () => {
    switch (state) {
      case 'ONLINE':
        return {
          label: 'Online',
          icon: <Wifi size={compact ? 13 : 15} color={colors.status.success.solid} />,
          bg: colors.status.success.bg,
          fg: colors.status.success.fg,
          border: colors.status.success.border,
          description: 'Connected to Plant Gateway',
        };
      case 'OFFLINE':
        return {
          label: 'Offline',
          icon: <WifiOff size={compact ? 13 : 15} color={colors.status.danger.solid} />,
          bg: colors.status.danger.bg,
          fg: colors.status.danger.fg,
          border: colors.status.danger.border,
          description: 'Local Offline Cache Active',
        };
      case 'SYNC_PENDING':
        return {
          label: `Sync Pending (${pendingCount})`,
          icon: <Clock size={compact ? 13 : 15} color={colors.status.warning.solid} />,
          bg: colors.status.warning.bg,
          fg: colors.status.warning.fg,
          border: colors.status.warning.border,
          description: `${pendingCount} entries queued locally`,
        };
      case 'SYNCING':
        return {
          label: 'Syncing...',
          icon: <RefreshCw size={compact ? 13 : 15} color={colors.primary[600]} style={{ animation: 'spin 1s linear infinite' }} />,
          bg: colors.primary[50],
          fg: colors.primary[700],
          border: colors.primary[200],
          description: 'Synchronizing with Enterprise DB',
        };
      case 'SYNCED':
        return {
          label: 'Synced',
          icon: <CheckCircle2 size={compact ? 13 : 15} color={colors.status.success.solid} />,
          bg: colors.status.success.bg,
          fg: colors.status.success.fg,
          border: colors.status.success.border,
          description: 'All local passes synchronized',
        };
      case 'CONFLICT':
        return {
          label: 'Conflict Detected',
          icon: <AlertCircle size={compact ? 13 : 15} color={colors.status.danger.solid} />,
          bg: colors.status.danger.bg,
          fg: colors.status.danger.fg,
          border: colors.status.danger.border,
          description: 'Discrepancy requires manual review',
        };
    }
  };

  const config = getConfig();

  if (compact) {
    return (
      <div
        title={`${config.label} — ${config.description}${lastSyncTime ? ` (Last: ${lastSyncTime})` : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: radius.sm,
          backgroundColor: config.bg,
          border: `1px solid ${config.border}`,
          color: config.fg,
          fontSize: '11px',
          fontWeight: 600,
          cursor: onSyncTrigger ? 'pointer' : 'default',
          ...style,
        }}
        onClick={onSyncTrigger}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: radius.md,
        gap: '12px',
        ...style,
      }}
      className="vms-sync-status-indicator"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>{config.icon}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <strong style={{ fontSize: typography.fontSize.xs.size, color: config.fg }}>
            {config.label}
          </strong>
          <span style={{ fontSize: '11px', color: colors.slate[600] }}>
            {config.description}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {lastSyncTime && (
          <span style={{ fontSize: '10px', color: colors.slate[500], fontFamily: typography.fontFamily.mono }}>
            Last: {lastSyncTime}
          </span>
        )}
        {onSyncTrigger && (
          <button
            type="button"
            onClick={onSyncTrigger}
            style={{
              padding: '3px 8px',
              backgroundColor: '#ffffff',
              border: `1px solid ${config.border}`,
              borderRadius: radius.sm,
              fontSize: '11px',
              fontWeight: 600,
              color: config.fg,
              cursor: 'pointer',
            }}
          >
            Sync Now
          </button>
        )}
      </div>
    </div>
  );
};
