import React from 'react';
import { 
  Loader2, 
  Inbox, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowLeft, 
  SearchX, 
  WifiOff, 
  Clock, 
  Lock, 
  ServerCrash,
  RefreshCw
} from 'lucide-react';
import { colors, radius, typography } from '../../tokens.js';
import { Button } from '../foundation/Button.js';

export interface StateViewProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

// 1. Loading State
export const LoadingStateView: React.FC<{ message?: string }> = ({
  message = 'Loading operational telemetry and records...',
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '12px',
      color: colors.slate[600],
    }}
    className="vms-loading-state"
  >
    <Loader2 size={32} color={colors.primary[600]} style={{ animation: 'spin 1s linear infinite' }} />
    <span style={{ fontSize: typography.fontSize.sm.size, fontWeight: 500 }}>{message}</span>
  </div>
);

// 2. Empty State
export const EmptyStateView: React.FC<StateViewProps> = ({
  title = 'No Records Found',
  description = 'There are no active transactions or records for this site view.',
  actionLabel,
  onAction,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '12px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.slate[200]}`,
      borderRadius: radius.md,
    }}
    className="vms-empty-state"
  >
    <div
      style={{
        padding: '12px',
        borderRadius: radius.full,
        backgroundColor: colors.slate[100],
        color: colors.slate[400],
      }}
    >
      <Inbox size={32} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxWidth: '420px' }}>
      <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600] }}>
        {description}
      </p>
    </div>
    {actionLabel && onAction && (
      <div style={{ marginTop: '8px' }}>
        <Button variant="primary" size="normal" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    )}
  </div>
);

// 3. No Permission State
export const NoPermissionStateView: React.FC<{
  requiredRoleOrCapability?: string;
  onGoBack?: () => void;
}> = ({
  requiredRoleOrCapability = 'Higher administrative or domain privileges',
  onGoBack,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '16px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.slate[200]}`,
      borderRadius: radius.md,
    }}
    className="vms-no-permission-state"
  >
    <div
      style={{
        padding: '12px',
        borderRadius: radius.full,
        backgroundColor: colors.status.danger.bg,
        color: colors.status.danger.solid,
      }}
    >
      <ShieldAlert size={36} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '460px' }}>
      <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }}>
        Access Restricted by Policy
      </h3>
      <p style={{ margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600] }}>
        You do not possess the required RBAC or ABAC capability to inspect or execute operations on this domain.
      </p>
      <div
        style={{
          marginTop: '6px',
          padding: '6px 12px',
          backgroundColor: colors.slate[100],
          borderRadius: radius.sm,
          fontSize: '11px',
          fontFamily: typography.fontFamily.mono,
          color: colors.slate[700],
        }}
      >
        Required Capability: {requiredRoleOrCapability}
      </div>
    </div>
    {onGoBack && (
      <Button variant="secondary" size="dense" leftIcon={<ArrowLeft size={14} />} onClick={onGoBack}>
        Return to Dashboard
      </Button>
    )}
  </div>
);

// 4. Generic Error State
export const ErrorStateView: React.FC<{
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
}> = ({
  errorTitle = 'System Communication Failure',
  errorMessage = 'An unexpected error occurred while communicating with the facility gateway.',
  onRetry,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '14px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.status.danger.solid}`,
      borderRadius: radius.md,
    }}
    className="vms-error-state"
  >
    <div
      style={{
        padding: '12px',
        borderRadius: radius.full,
        backgroundColor: colors.status.danger.bg,
        color: colors.status.danger.solid,
      }}
    >
      <AlertTriangle size={36} />
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxWidth: '460px' }}>
      <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }}>
        {errorTitle}
      </h3>
      <p style={{ margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600] }}>
        {errorMessage}
      </p>
    </div>
    {onRetry && (
      <Button variant="primary" size="dense" onClick={onRetry}>
        Retry Operation
      </Button>
    )}
  </div>
);

// 5. Not Found State
export const NotFoundStateView: React.FC<{
  entityName?: string;
  searchId?: string;
  onGoBack?: () => void;
}> = ({
  entityName = 'Record',
  searchId,
  onGoBack,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '12px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.slate[200]}`,
      borderRadius: radius.md,
    }}
    className="vms-not-found-state"
  >
    <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.slate[100], color: colors.slate[400] }}>
      <SearchX size={36} />
    </div>
    <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }}>
      {entityName} Not Found
    </h3>
    <p style={{ margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }}>
      The requested identifier {searchId ? `"${searchId}"` : ''} does not exist in the active site ledger or has expired.
    </p>
    {onGoBack && (
      <Button variant="secondary" size="dense" leftIcon={<ArrowLeft size={14} />} onClick={onGoBack}>
        Return to List
      </Button>
    )}
  </div>
);

// 6. Validation Error State
export const ValidationErrorStateView: React.FC<{
  errors: string[];
  onCorrect?: () => void;
}> = ({
  errors,
  onCorrect,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 20px',
      backgroundColor: colors.status.danger.bg,
      border: `1px solid ${colors.status.danger.border}`,
      borderRadius: radius.md,
      gap: '8px',
    }}
    className="vms-validation-error-state"
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.status.danger.fg }}>
      <AlertTriangle size={16} />
      <strong style={{ fontSize: typography.fontSize.sm.size }}>
        Please correct the following {errors.length} validation errors before proceeding:
      </strong>
    </div>
    <ul style={{ margin: '4px 0 0 20px', padding: 0, fontSize: typography.fontSize.xs.size, color: colors.status.danger.fg }}>
      {errors.map((err, idx) => (
        <li key={idx} style={{ marginBottom: '2px' }}>{err}</li>
      ))}
    </ul>
    {onCorrect && (
      <div style={{ marginTop: '6px' }}>
        <Button variant="outline" size="dense" onClick={onCorrect}>
          Review Fields
        </Button>
      </div>
    )}
  </div>
);

// 7. Network Error State
export const NetworkErrorStateView: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '12px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.slate[200]}`,
      borderRadius: radius.md,
    }}
    className="vms-network-error-state"
  >
    <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.status.warning.bg, color: colors.status.warning.solid }}>
      <WifiOff size={36} />
    </div>
    <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }}>
      Network Connection Interrupted
    </h3>
    <p style={{ margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }}>
      Unable to reach the central facility gateway. Check local LAN cabling or security cabin Wi-Fi.
    </p>
    {onRetry && (
      <Button variant="primary" size="dense" leftIcon={<RefreshCw size={14} />} onClick={onRetry}>
        Retry Connection
      </Button>
    )}
  </div>
);

// 8. Server Error State
export const ServerErrorStateView: React.FC<{ incidentId?: string; onRetry?: () => void }> = ({
  incidentId = 'SRV-ERR-9842',
  onRetry,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '12px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.status.danger.border}`,
      borderRadius: radius.md,
    }}
    className="vms-server-error-state"
  >
    <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.status.danger.bg, color: colors.status.danger.solid }}>
      <ServerCrash size={36} />
    </div>
    <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }}>
      Facility Gateway Internal Error (500)
    </h3>
    <p style={{ margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }}>
      The server encountered an unexpected error. Incident tracking reference: <code style={{ fontFamily: typography.fontFamily.mono }}>{incidentId}</code>.
    </p>
    {onRetry && (
      <Button variant="primary" size="dense" onClick={onRetry}>
        Retry Request
      </Button>
    )}
  </div>
);

// 9. Offline State
export const OfflineStateView: React.FC<{ pendingTransactions?: number; onSync?: () => void }> = ({
  pendingTransactions = 0,
  onSync,
}) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 20px',
      gap: '12px',
      textAlign: 'center',
      backgroundColor: colors.slate[50],
      border: `1px solid ${colors.slate[300]}`,
      borderRadius: radius.md,
    }}
    className="vms-offline-state"
  >
    <div style={{ padding: '10px', borderRadius: radius.full, backgroundColor: colors.slate[200], color: colors.slate[600] }}>
      <WifiOff size={32} />
    </div>
    <h3 style={{ margin: 0, fontSize: typography.fontSize.md.size, fontWeight: 700, color: colors.slate[900] }}>
      Operating in Offline Gate Mode
    </h3>
    <p style={{ margin: 0, fontSize: typography.fontSize.xs.size, color: colors.slate[600], maxWidth: '380px' }}>
      All pass scans and entry validations are caching securely to local IndexedDB. {pendingTransactions} transactions awaiting synchronization.
    </p>
    {onSync && (
      <Button variant="outline" size="dense" onClick={onSync}>
        Attempt Sync Now
      </Button>
    )}
  </div>
);

// 10. Synchronization Pending State
export const SyncPendingStateView: React.FC<{ count: number; onSyncAll?: () => void }> = ({
  count,
  onSyncAll,
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      backgroundColor: colors.status.warning.bg,
      border: `1px solid ${colors.status.warning.border}`,
      borderRadius: radius.md,
      gap: '12px',
    }}
    className="vms-sync-pending-state"
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Clock size={18} color={colors.status.warning.solid} />
      <div>
        <strong style={{ fontSize: typography.fontSize.xs.size, color: colors.status.warning.fg }}>
          Synchronization Pending ({count} records)
        </strong>
        <div style={{ fontSize: '11px', color: colors.slate[600] }}>
          Local lane scans will automatically flush to the central cloud once high-speed link restores.
        </div>
      </div>
    </div>
    {onSyncAll && (
      <Button variant="secondary" size="dense" onClick={onSyncAll}>
        Flush Queue
      </Button>
    )}
  </div>
);

// 11. Session Expired State
export const SessionExpiredStateView: React.FC<{ onRelogin?: () => void }> = ({ onRelogin }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 20px',
      gap: '14px',
      textAlign: 'center',
      backgroundColor: '#ffffff',
      border: `1px solid ${colors.slate[200]}`,
      borderRadius: radius.md,
    }}
    className="vms-session-expired-state"
  >
    <div style={{ padding: '12px', borderRadius: radius.full, backgroundColor: colors.slate[100], color: colors.slate[600] }}>
      <Lock size={36} />
    </div>
    <h3 style={{ margin: 0, fontSize: typography.fontSize.lg.size, fontWeight: 700, color: colors.slate[900] }}>
      Security Session Expired
    </h3>
    <p style={{ margin: 0, fontSize: typography.fontSize.sm.size, color: colors.slate[600], maxWidth: '420px' }}>
      Your authenticated operational shift token has expired in compliance with ISO 27001 idle-timeout governance.
    </p>
    {onRelogin && (
      <Button variant="primary" size="dense" onClick={onRelogin}>
        Re-authenticate Operator
      </Button>
    )}
  </div>
);
