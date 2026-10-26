import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, KeyRound, X } from 'lucide-react';
import { colors, radius, shadows } from '@vms/ui/tokens';
import { apiRequest } from '../../../api/client.js';
import { buttonStyle, describeError, ErrorNote, inputStyle } from '../LiveViews.js';

export interface RoleInfo {
  code: string;
  name: string;
  description: string | null;
  users: number;
  permissions: string[];
  assignable: boolean;
}

export interface UserRow {
  id: string;
  username: string;
  fullName: string;
  email: string;
  status: string;
  roles: string[];
  siteIds: string[];
  lastLoginAt: string | null;
  locked: boolean;
  mustChangePassword: boolean;
  hasPassword: boolean;
  canManage: boolean;
  isSelf: boolean;
}

export interface UserDetailData extends UserRow {
  defaultSiteId: string | null;
  passwordChangedAt: string | null;
  failedAttempts: number;
  activeSessions: number;
  assignableRoles: string[];
  history: Array<{ timestamp: string; action: string; actorRole: string | null; reason: string | null }>;
}

/** PUT / PATCH / POST with busy and error state for the admin forms. */
export function useSend() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const send = useCallback(async <T,>(method: 'POST' | 'PUT' | 'PATCH', path: string, body: unknown): Promise<T | null> => {
    setBusy(true);
    setError(null);
    try {
      return await apiRequest<T>(path, { method, body });
    } catch (err) {
      setError(describeError(err));
      return null;
    } finally {
      setBusy(false);
    }
  }, []);
  return { send, busy, error, setError };
}

export const Avatar: React.FC<{ name: string; size?: number; muted?: boolean }> = ({ name, size = 36, muted }) => {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        placeItems: 'center',
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        flexShrink: 0,
        fontSize: `${Math.round(size * 0.36)}px`,
        fontWeight: 700,
        color: muted ? colors.slate[500] : colors.primary[700],
        backgroundColor: muted ? colors.slate[100] : colors.primary[100],
      }}
    >
      {letters || '?'}
    </span>
  );
};

export const Chip: React.FC<{ children: React.ReactNode; tone?: 'neutral' | 'primary' | 'warning' | 'danger' }> = ({ children, tone = 'neutral' }) => {
  const palette = {
    neutral: { fg: colors.slate[700], bg: colors.slate[100], border: colors.slate[200] },
    primary: { fg: colors.primary[700], bg: colors.primary[50], border: colors.primary[200] },
    warning: colors.status.warning,
    danger: colors.status.danger,
  }[tone];
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '12px',
        fontWeight: 500,
        lineHeight: '18px',
        padding: '1px 8px',
        borderRadius: radius.full,
        color: palette.fg,
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
};

/** Centered modal dialog: Escape and the close button dismiss it; focus moves into it on open. */
export const Dialog: React.FC<{
  title: string;
  description?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
  icon?: React.ReactNode;
}> = ({ title, description, onClose, children, width = 480, icon }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    const first = ref.current?.querySelector<HTMLElement>('input, select, textarea, button[data-autofocus]');
    first?.focus();
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  const id = `dialog-${title.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={id}
      style={{ position: 'fixed', inset: 0, zIndex: 400, display: 'grid', placeItems: 'center', padding: '16px', backgroundColor: 'rgba(7,16,28,0.5)' }}
    >
      <div
        ref={ref}
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          maxHeight: 'calc(100vh - 32px)',
          overflowY: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: radius.xl,
          boxShadow: shadows.modal,
          padding: '22px 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: description ? '6px' : '16px' }}>
          {icon && <span style={{ marginTop: '3px', color: colors.primary[600] }}>{icon}</span>}
          <h2 id={id} style={{ flex: 1, margin: 0, fontSize: '18px', lineHeight: '26px', fontWeight: 650, color: colors.slate[900] }}>
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            style={{
              display: 'grid',
              placeItems: 'center',
              width: '30px',
              height: '30px',
              border: 'none',
              background: 'none',
              color: colors.slate[500],
              cursor: 'pointer',
              borderRadius: radius.md,
            }}
          >
            <X size={18} />
          </button>
        </div>
        {description && <div style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: '21px', color: colors.slate[600] }}>{description}</div>}
        {children}
      </div>
    </div>
  );
};

export const DialogActions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px', flexWrap: 'wrap' }}>{children}</div>
);

/** Every change to someone's access asks for a reason; it is stored in the audit log. */
export const ReasonField: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => (
  <label style={{ display: 'grid', gap: '6px', fontSize: '13px', fontWeight: 600, color: colors.slate[700] }}>
    Reason for the audit log
    <textarea
      required
      minLength={3}
      maxLength={500}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? 'For example: ticket number, or who asked for the change'}
      style={{ ...inputStyle, minHeight: '64px', resize: 'vertical', fontWeight: 400 }}
    />
  </label>
);

/** Confirmation that records a reason, then runs `onConfirm` (which returns false to keep the dialog open). */
export const ReasonDialog: React.FC<{
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}> = ({ title, description, confirmLabel, danger, busy, error, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  return (
    <Dialog title={title} description={description} onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault();
          if (reason.trim().length >= 3) onConfirm(reason.trim());
        }}
        style={{ display: 'grid', gap: '12px' }}
      >
        <ReasonField value={reason} onChange={setReason} />
        <ErrorNote error={error ?? null} />
        <DialogActions>
          <button type="button" style={buttonStyle()} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || reason.trim().length < 3}
            style={{
              ...buttonStyle(danger ? 'danger' : 'primary'),
              ...(danger ? { backgroundColor: colors.status.danger.fg, color: '#ffffff', borderColor: colors.status.danger.fg } : {}),
              opacity: busy || reason.trim().length < 3 ? 0.6 : 1,
            }}
          >
            {busy ? 'Saving…' : confirmLabel}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

/** Shows a one-time password exactly once. It is never stored or shown again. */
export const TemporaryPasswordDialog: React.FC<{ title: string; name: string; username: string; password: string; onClose: () => void }> = ({
  title,
  name,
  username,
  password,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return (
    <Dialog
      title={title}
      icon={<KeyRound size={20} />}
      onClose={onClose}
      description={
        <>
          Give this temporary password to <strong>{name}</strong> in person or over a trusted channel. They sign in as <strong>{username}</strong> and must
          choose their own password straight away.
        </>
      }
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 14px',
          border: `1px solid ${colors.slate[200]}`,
          borderRadius: radius.lg,
          backgroundColor: colors.slate[50],
        }}
      >
        <code
          data-testid="temporary-password"
          style={{
            flex: 1,
            fontFamily: 'JetBrains Mono, ui-monospace, monospace',
            fontSize: '17px',
            letterSpacing: '0.04em',
            color: colors.slate[900],
            wordBreak: 'break-all',
          }}
        >
          {password}
        </code>
        <button type="button" data-autofocus onClick={() => void copy()} style={buttonStyle()}>
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p style={{ margin: '12px 0 0', fontSize: '13px', color: colors.status.warning.fg }}>
        This password is shown only once. Close this window when you have passed it on.
      </p>
      <DialogActions>
        <button type="button" style={buttonStyle('primary')} onClick={onClose}>
          Done
        </button>
      </DialogActions>
    </Dialog>
  );
};

/** Permission codes grouped by area, in plain language, for the roles screen and role pickers. */
export const PERMISSION_GROUPS: Array<{ area: string; items: Array<[string, string]> }> = [
  {
    area: 'Visitors',
    items: [
      ['VISITOR_READ', 'See visitors and visit history'],
      ['VISITOR_WRITE', 'Register and edit visits'],
      ['VISITOR_APPROVE', 'Approve or reject visits'],
    ],
  },
  {
    area: 'Customers',
    items: [
      ['CUSTOMER_READ', 'See customer accounts and visits'],
      ['CUSTOMER_WRITE', 'Create and edit customer records'],
      ['CUSTOMER_APPROVE', 'Approve customer visits'],
    ],
  },
  {
    area: 'Contractors',
    items: [
      ['CONTRACTOR_READ', 'See contractor companies and workers'],
      ['CONTRACTOR_WRITE', 'Manage contractors and compliance'],
      ['CONTRACTOR_APPROVE', 'Approve contractor work'],
      ['CONTRACTOR_GATE_CHECKIN', 'Check contractors in at the gate'],
    ],
  },
  {
    area: 'Service and maintenance',
    items: [
      ['SERVICE_READ', 'See service requests and work orders'],
      ['SERVICE_REQUEST_CREATE', 'Raise service requests'],
      ['SERVICE_WRITE', 'Edit service records'],
      ['SERVICE_APPROVE', 'Approve requests and work orders'],
      ['SERVICE_MANAGE', 'Plan work, providers and schedules'],
      ['SERVICE_EXECUTE', 'Carry out and record service work'],
      ['SERVICE_ARRIVAL_RECORD', 'Record technician arrival'],
      ['SERVICE_ACCEPT', 'Accept completed work'],
      ['SERVICE_PREREQ_VERIFY', 'Verify work prerequisites'],
    ],
  },
  {
    area: 'Gates, vehicles and materials',
    items: [
      ['GATE_VIEW', 'See gate activity'],
      ['GATE_ACTUATE', 'Operate gates (entry and exit)'],
      ['VEHICLE_READ', 'See vehicles'],
      ['VEHICLE_WRITE', 'Manage vehicles'],
      ['MATERIAL_READ', 'See material movements'],
      ['MATERIAL_WRITE', 'Record material movements'],
    ],
  },
  {
    area: 'Documents and safety',
    items: [
      ['DOCUMENT_READ_STANDARD', 'Read standard documents'],
      ['DOCUMENT_READ_SENSITIVE', 'Read sensitive documents (ID scans)'],
      ['PTW_APPROVE', 'Approve permits to work'],
    ],
  },
  {
    area: 'Sustainability (ESG)',
    items: [
      ['ESG_ACTIVITY_READ', 'See travel and activity data'],
      ['ESG_ACTIVITY_WRITE', 'Record travel and activity data'],
      ['GHG_CALCULATION_READ', 'See emissions calculations'],
      ['GHG_FACTOR_MANAGE', 'Manage emission factors'],
    ],
  },
  {
    area: 'Workflow and tasks',
    items: [
      ['APPROVAL_READ', 'See approvals'],
      ['APPROVAL_ACTION', 'Act on approvals'],
      ['APPROVAL_DELEGATE', 'Delegate approvals'],
      ['TASK_READ', 'See tasks'],
      ['TASK_MANAGE', 'Manage tasks'],
      ['WORKFLOW_READ', 'See workflows'],
      ['WORKFLOW_MANAGE', 'Design workflows'],
      ['WORKFLOW_PUBLISH', 'Publish workflows'],
      ['POLICY_EVALUATE', 'Test business rules'],
      ['POLICY_MANAGE', 'Manage business rules'],
      ['MASTERDATA_READ', 'See master data'],
      ['MASTERDATA_MANAGE', 'Manage and import master data'],
    ],
  },
  {
    area: 'Administration',
    items: [
      ['USER_MANAGE', 'Manage users, roles and site access'],
      ['AUDIT_LOG_READ', 'Read the audit log'],
      ['SYSTEM_ADMIN_MANAGE', 'Change system settings'],
    ],
  },
];

const KNOWN = new Set(PERMISSION_GROUPS.flatMap(g => g.items.map(([code]) => code)));

/** Permissions a role holds, grouped for display; codes without a plain-language label are listed under "Other". */
export function groupPermissions(permissions: string[]): Array<{ area: string; items: Array<[string, string]> }> {
  const held = new Set(permissions);
  const groups = PERMISSION_GROUPS.map(g => ({ area: g.area, items: g.items.filter(([code]) => held.has(code)) })).filter(g => g.items.length);
  const other = permissions.filter(p => /^[A-Z][A-Z_]+$/.test(p) && !KNOWN.has(p));
  if (other.length) groups.push({ area: 'Other', items: other.map(p => [p, p.replace(/_/g, ' ').toLowerCase()]) });
  return groups;
}
