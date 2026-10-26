import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Plus, RefreshCw, X } from 'lucide-react';
import { Pagination } from '@vms/ui';
import { colors, radius, shadows } from '@vms/ui/tokens';
import { ApiError, apiRequest, type SessionUser } from '../../api/client.js';

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

export const card: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: `1px solid ${colors.slate[200]}`,
  borderRadius: radius.lg,
  boxShadow: shadows.card,
};

export const th: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: colors.slate[500],
  padding: '10px 12px',
  borderBottom: `1px solid ${colors.slate[200]}`,
  whiteSpace: 'nowrap',
};

export const td: React.CSSProperties = {
  fontSize: '13px',
  color: colors.slate[800],
  padding: '10px 12px',
  borderBottom: `1px solid ${colors.slate[100]}`,
  verticalAlign: 'middle',
};

export function buttonStyle(variant: 'primary' | 'secondary' | 'danger' = 'secondary'): React.CSSProperties {
  const palette = {
    primary: { bg: colors.primary[600], fg: '#ffffff', border: colors.primary[600] },
    secondary: { bg: '#ffffff', fg: colors.slate[700], border: colors.slate[300] },
    danger: { bg: '#ffffff', fg: colors.status.danger.fg, border: colors.status.danger.border },
  }[variant];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: 600,
    color: palette.fg,
    backgroundColor: palette.bg,
    border: `1px solid ${palette.border}`,
    borderRadius: radius.md,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

const STATUS_TONE: Record<string, keyof typeof colors.status> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  ON_PREMISES: 'active',
  COMPLETED: 'neutral',
  REJECTED: 'rejected',
  CANCELLED: 'inactive',
  ACTIVE: 'active',
  // Service / work management
  SUBMITTED: 'pending',
  PENDING_APPROVAL: 'pending',
  WORK_ORDERED: 'active',
  FULFILLED: 'neutral',
  SCHEDULED: 'info',
  IN_PROGRESS: 'active',
  ON_HOLD: 'warning',
  COMPLETION_SUBMITTED: 'pending',
  CLOSED: 'neutral',
  DRAFT: 'draft',
  PAUSED: 'warning',
  ENDED: 'inactive',
  GENERATED: 'info',
  MISSED: 'overdue',
  OPEN: 'warning',
  RESOLVED: 'approved',
  SUSPENDED: 'warning',
  BLOCKED: 'blocked',
  INACTIVE: 'inactive',
  ASSIGNED: 'info',
  // Activity capture
  QUEUED: 'pending',
  CAPTURED: 'approved',
  FAILED: 'rejected',
  SUPERSEDED: 'inactive',
  NEEDS_DATA: 'warning',
  PENDING_CALCULATION: 'info',
  COMPLETE: 'approved',
  PARTIAL: 'warning',
  INSUFFICIENT: 'overdue',
  VERIFIED: 'approved',
  NOT_VERIFIED: 'rejected',
  UNAVAILABLE: 'draft',
  // Priority / severity
  LOW: 'neutral',
  STANDARD: 'info',
  MEDIUM: 'info',
  HIGH: 'warning',
  CRITICAL: 'danger',
};

export const StatusPill: React.FC<{ status: string | null | undefined }> = ({ status }) => {
  const tone = colors.status[STATUS_TONE[status ?? ''] ?? 'neutral'];
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '11px',
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: radius.full,
        color: tone.fg,
        backgroundColor: tone.bg,
        border: `1px solid ${tone.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {(status ?? '—').replace(/_/g, ' ')}
    </span>
  );
};

export const ErrorNote: React.FC<{ error: string | null }> = ({ error }) =>
  error ? (
    <div
      role="alert"
      style={{
        fontSize: '13px',
        padding: '10px 12px',
        borderRadius: radius.md,
        color: colors.status.danger.fg,
        backgroundColor: colors.status.danger.bg,
        border: `1px solid ${colors.status.danger.border}`,
      }}
    >
      {error}
    </div>
  ) : null;

export const LiveBadge: React.FC = () => (
  <span
    style={{
      fontSize: '10px',
      fontWeight: 800,
      letterSpacing: '0.06em',
      color: colors.status.success.fg,
      backgroundColor: colors.status.success.bg,
      border: `1px solid ${colors.status.success.border}`,
      borderRadius: radius.full,
      padding: '2px 8px',
      whiteSpace: 'nowrap',
    }}
  >
    LIVE DATA
  </span>
);

export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    const detail = err.details?.map(d => `${d.path}: ${d.message}`).join('; ');
    return detail ? `${err.message} (${detail})` : err.message;
  }
  return 'Request failed. Please try again.';
}

/** Returns `value` once it has stopped changing for `ms` (search boxes fire on every keystroke). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return settled;
}

/** Loads `path`; only the response to the latest request is applied, so slow earlier replies never win. */
export function useApi<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const latest = useRef(0);
  const load = useCallback(async () => {
    if (!path) return;
    const seq = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const result = await apiRequest<T>(path);
      if (seq === latest.current) setData(result);
    } catch (err) {
      if (seq === latest.current) setError(describeError(err));
    } finally {
      if (seq === latest.current) setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    void load();
  }, [load]);
  return { data, error, loading, reload: load };
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Formats an instant in the viewer's time zone; a calendar date ('YYYY-MM-DD') is shown as that same date. */
export const fmt = (value: string | null | undefined) => {
  if (!value) return '—';
  if (DATE_ONLY.test(value)) return fmtDate(value);
  return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
};

/** Formats a calendar date without converting it through UTC (which can shift it by a day). */
export const fmtDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { dateStyle: 'medium' });
};

/** Today's date in the viewer's time zone as 'YYYY-MM-DD' (toISOString() would give the UTC date). */
export const localDateString = (date: Date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export const PageHeader: React.FC<{ title: string; subtitle: string; actions?: React.ReactNode }> = ({ title, subtitle, actions }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '16px' }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: colors.slate[900] }}>{title}</h1>
        <LiveBadge />
      </div>
      <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.slate[500] }}>{subtitle}</p>
    </div>
    {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
  </div>
);

// ---------------------------------------------------------------------------
// Dashboard KPI strip
// ---------------------------------------------------------------------------

interface Summary {
  visitorsOnSite: number;
  visitorsToday: number;
  visitorApprovalsPending: number;
  contractorCompanies: number;
  openWorkOrders: number;
  openServiceWorkOrders: number;
  customerAccounts: number;
  upcomingCustomerVisits: number;
  materialMovementsToday: number;
  registeredVehicles: number;
  gateEventsToday: number;
}

export const LiveKpiStrip: React.FC = () => {
  const { data, error, loading, reload } = useApi<Summary>('/api/v1/dashboard/summary');
  const tiles: Array<[string, keyof Summary]> = [
    ['Visitors on site', 'visitorsOnSite'],
    ['Visits scheduled today', 'visitorsToday'],
    ['Visitor approvals pending', 'visitorApprovalsPending'],
    ['Gate events today', 'gateEventsToday'],
    ['Contractor companies', 'contractorCompanies'],
    ['Open contractor work orders', 'openWorkOrders'],
    ['Open service work orders', 'openServiceWorkOrders'],
    ['Customer accounts', 'customerAccounts'],
    ['Registered vehicles', 'registeredVehicles'],
  ];
  return (
    <section style={{ ...card, padding: '16px', marginBottom: '16px' }} aria-label="Live operational summary">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <strong style={{ fontSize: '14px', color: colors.slate[900] }}>Live operational summary</strong>
          <LiveBadge />
        </div>
        <button type="button" style={buttonStyle()} onClick={() => void reload()} aria-label="Refresh summary">
          <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Refresh
        </button>
      </div>
      <ErrorNote error={error} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
        {tiles.map(([label, key]) => (
          <div key={key} style={{ border: `1px solid ${colors.slate[100]}`, borderRadius: radius.md, padding: '12px', backgroundColor: colors.slate[50] }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: colors.slate[900], marginTop: '4px', fontVariantNumeric: 'tabular-nums' }}>
              {data ? data[key].toLocaleString() : '—'}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

// ---------------------------------------------------------------------------
// Visitor register (live)
// ---------------------------------------------------------------------------

interface VisitorItem {
  id: string;
  referenceNumber: string;
  status: string;
  visitorName: string;
  companyName: string | null;
  siteId: string;
  siteName: string;
  hostName: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  actualEntry: string | null;
  actualExit: string | null;
}

interface Option {
  id: string;
  label: string;
}

const STATUS_FILTERS = ['', 'PENDING', 'APPROVED', 'ON_PREMISES', 'COMPLETED', 'REJECTED', 'CANCELLED'];
const VISITOR_PAGE_SIZE = 50;

interface GateOption {
  gateId: string;
  siteId: string;
  name: string;
  gateType: string;
  isActive: boolean;
}

export const LiveVisitorsView: React.FC<{ user: SessionUser; initialStatus?: string; openRegister?: boolean }> = ({
  user,
  initialStatus = '',
  openRegister = false,
}) => {
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [showForm, setShowForm] = useState(openRegister);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [gates, setGates] = useState<GateOption[]>([]);
  const [gateId, setGateId] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => setStatus(initialStatus), [initialStatus]);
  useEffect(() => setShowForm(openRegister), [openRegister]);
  useEffect(() => setPage(1), [status, query]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: String(VISITOR_PAGE_SIZE), offset: String((page - 1) * VISITOR_PAGE_SIZE) });
    if (status) params.set('status', status);
    if (query) params.set('search', query);
    return `/api/v1/visitors?${params.toString()}`;
  }, [status, query, page]);
  const { data, error, loading, reload } = useApi<{ items: VisitorItem[]; total: number }>(path);

  const can = (perm: string) => user.permissions.includes(perm);
  const canGate = can('GATE_ACTUATE');

  useEffect(() => {
    if (!canGate) return;
    apiRequest<{ items: GateOption[] }>('/api/v1/gates')
      .then(r => {
        // Only active gates can record movements; pedestrian gates first, as most visitors walk in.
        const active = r.items.filter(g => g.isActive).sort((a, b) => Number(b.gateType === 'PEDESTRIAN') - Number(a.gateType === 'PEDESTRIAN'));
        setGates(active);
        setGateId(current => current || active[0]?.gateId || '');
      })
      .catch(() => setGates([]));
  }, [canGate]);

  const act = async (visit: VisitorItem, action: 'approve' | 'reject' | 'cancel' | 'check-in' | 'check-out') => {
    setActionError(null);
    let body: Record<string, unknown> = {};
    if (action === 'check-in' || action === 'check-out') {
      // The operator's chosen gate when it is at the visit's site; otherwise the site's only active gate.
      const atSite = gates.filter(g => g.siteId === visit.siteId);
      const chosen = atSite.find(g => g.gateId === gateId) ?? (atSite.length === 1 ? atSite[0] : undefined);
      if (!chosen) {
        setActionError(
          atSite.length === 0
            ? `No active gate is configured for ${visit.siteName}.`
            : `Choose the gate you are working at for ${visit.siteName} in "Recording at gate" above.`
        );
        return;
      }
      body = { gateId: chosen.gateId };
    }
    setBusyId(visit.id);
    try {
      await apiRequest(`/api/v1/visitors/${visit.id}/${action}`, { method: 'POST', body });
      await reload();
    } catch (err) {
      setActionError(describeError(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Visitor register"
        subtitle="Pre-registrations, approvals and gate movements recorded in the database."
        actions={
          <>
            <button type="button" style={buttonStyle()} onClick={() => void reload()}>
              <RefreshCw size={14} /> Refresh
            </button>
            {can('VISITOR_WRITE') && (
              <button type="button" style={buttonStyle('primary')} onClick={() => setShowForm(true)}>
                <Plus size={14} /> Register visitor
              </button>
            )}
          </>
        }
      />

      {showForm && (
        <RegisterVisitorForm
          user={user}
          onClose={() => setShowForm(false)}
          onCreated={() => {
            setShowForm(false);
            void reload();
          }}
        />
      )}

      <div style={{ ...card, padding: '12px', marginBottom: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)} style={{ ...buttonStyle(), padding: '7px 10px' }}>
          {STATUS_FILTERS.map(s => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, ' ') : 'All statuses'}
            </option>
          ))}
        </select>
        <form
          onSubmit={e => {
            e.preventDefault();
            setQuery(search.trim());
          }}
          style={{ display: 'flex', gap: '8px', flex: '1 1 240px' }}
        >
          <input
            aria-label="Search visitors"
            placeholder="Search name or reference"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: '7px 10px', fontSize: '13px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md }}
          />
          <button type="submit" style={buttonStyle()}>
            Search
          </button>
        </form>
        {canGate && gates.length > 0 && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.slate[600] }}>
            Recording at gate
            <select value={gateId} onChange={e => setGateId(e.target.value)} style={{ ...buttonStyle(), padding: '7px 10px' }}>
              {gates.map(g => (
                <option key={g.gateId} value={g.gateId}>
                  {g.name} ({g.gateType === 'PEDESTRIAN' ? 'pedestrian' : g.gateType.toLowerCase().replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </label>
        )}
        <span style={{ fontSize: '12px', color: colors.slate[500] }}>{data ? `${data.total} record(s)` : ''}</span>
      </div>

      <ErrorNote error={error || actionError} />

      <div style={{ ...card, overflowX: 'auto', marginTop: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '880px' }}>
          <thead>
            <tr>
              {['Reference', 'Visitor', 'Host', 'Site', 'Scheduled', 'Entry / exit', 'Status', ''].map(h => (
                <th key={h} style={th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td style={{ ...td, textAlign: 'center', color: colors.slate[500] }} colSpan={8}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Loading…
                </td>
              </tr>
            )}
            {data && data.items.length === 0 && (
              <tr>
                <td style={{ ...td, textAlign: 'center', color: colors.slate[500], padding: '28px' }} colSpan={8}>
                  No visitors match this view.
                </td>
              </tr>
            )}
            {data?.items.map(v => (
              <tr key={v.id}>
                <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{v.referenceNumber}</td>
                <td style={td}>
                  <div style={{ fontWeight: 600 }}>{v.visitorName}</div>
                  {v.companyName && <div style={{ fontSize: '12px', color: colors.slate[500] }}>{v.companyName}</div>}
                </td>
                <td style={td}>{v.hostName ?? '—'}</td>
                <td style={td}>{v.siteName}</td>
                <td style={td}>{fmt(v.scheduledStart)}</td>
                <td style={{ ...td, fontSize: '12px' }}>
                  {v.actualEntry ? `In ${fmt(v.actualEntry)}` : '—'}
                  {v.actualExit && <div>Out {fmt(v.actualExit)}</div>}
                </td>
                <td style={td}>
                  <StatusPill status={v.status} />
                </td>
                <td style={{ ...td, textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '6px', opacity: busyId === v.id ? 0.5 : 1 }}>
                    {v.status === 'PENDING' && can('VISITOR_APPROVE') && (
                      <>
                        <button type="button" style={buttonStyle('primary')} disabled={busyId === v.id} onClick={() => void act(v, 'approve')}>
                          Approve
                        </button>
                        <button type="button" style={buttonStyle('danger')} disabled={busyId === v.id} onClick={() => void act(v, 'reject')}>
                          Reject
                        </button>
                      </>
                    )}
                    {v.status === 'APPROVED' && canGate && (
                      <button type="button" style={buttonStyle('primary')} disabled={busyId === v.id} onClick={() => void act(v, 'check-in')}>
                        Check in
                      </button>
                    )}
                    {v.status === 'ON_PREMISES' && canGate && (
                      <button type="button" style={buttonStyle('primary')} disabled={busyId === v.id} onClick={() => void act(v, 'check-out')}>
                        Check out
                      </button>
                    )}
                    {(v.status === 'PENDING' || v.status === 'APPROVED') && can('VISITOR_WRITE') && (
                      <button type="button" style={buttonStyle()} disabled={busyId === v.id} onClick={() => void act(v, 'cancel')}>
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data && data.total > VISITOR_PAGE_SIZE && (
          <div style={{ borderTop: `1px solid ${colors.slate[100]}`, padding: '8px 12px' }}>
            <Pagination currentPage={page} totalRecords={data.total} pageSize={VISITOR_PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '13px',
  border: `1px solid ${colors.slate[300]}`,
  borderRadius: radius.md,
  backgroundColor: '#ffffff',
};

export const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600, color: colors.slate[700] }}>
    {label}
    {children}
  </label>
);

export function toLocalInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const RegisterVisitorForm: React.FC<{ user: SessionUser; onClose: () => void; onCreated: () => void }> = ({ user, onClose, onCreated }) => {
  const [sites, setSites] = useState<Option[]>([]);
  const [hosts, setHosts] = useState<Option[]>([]);
  const nextHour = new Date(Math.ceil(Date.now() / 3_600_000) * 3_600_000);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    siteId: user.defaultSiteId ?? '',
    hostUserId: '',
    scheduledStart: toLocalInput(nextHour),
    scheduledEnd: toLocalInput(new Date(nextHour.getTime() + 2 * 3_600_000)),
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<{ items: Array<{ siteId: string; name: string }> }>('/api/v1/sites')
      .then(r => {
        setSites(r.items.map(s => ({ id: s.siteId, label: s.name })));
        setForm(f => ({ ...f, siteId: f.siteId || r.items[0]?.siteId || '' }));
      })
      .catch(err => setError(describeError(err)));
    apiRequest<{ items: Array<{ userId: string; fullName: string }> }>('/api/v1/hosts')
      .then(r => setHosts(r.items.map(h => ({ id: h.userId, label: h.fullName }))))
      .catch(err => setError(describeError(err)));
  }, []);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiRequest('/api/v1/visitors', {
        method: 'POST',
        body: {
          ...form,
          companyName: form.companyName || undefined,
          scheduledStart: new Date(form.scheduledStart).toISOString(),
          scheduledEnd: new Date(form.scheduledEnd).toISOString(),
        },
      });
      onCreated();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ ...card, padding: '16px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <strong style={{ fontSize: '14px', color: colors.slate[900] }}>Register a visitor</strong>
        <button type="button" style={{ ...buttonStyle(), padding: '4px' }} onClick={onClose} aria-label="Close form">
          <X size={14} />
        </button>
      </div>
      <ErrorNote error={error} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <Field label="First name">
          <input style={inputStyle} value={form.firstName} onChange={set('firstName')} required maxLength={100} />
        </Field>
        <Field label="Last name">
          <input style={inputStyle} value={form.lastName} onChange={set('lastName')} required maxLength={100} />
        </Field>
        <Field label="Company">
          <input style={inputStyle} value={form.companyName} onChange={set('companyName')} maxLength={255} />
        </Field>
        <Field label="Site">
          <select style={inputStyle} value={form.siteId} onChange={set('siteId')} required>
            <option value="" disabled>
              Select a site
            </option>
            {sites.map(s => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Host">
          <select style={inputStyle} value={form.hostUserId} onChange={set('hostUserId')} required>
            <option value="" disabled>
              Select the host employee
            </option>
            {hosts.map(h => (
              <option key={h.id} value={h.id}>
                {h.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Arrives">
          <input type="datetime-local" style={inputStyle} value={form.scheduledStart} onChange={set('scheduledStart')} required />
        </Field>
        <Field label="Departs">
          <input type="datetime-local" style={inputStyle} value={form.scheduledEnd} onChange={set('scheduledEnd')} required />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <button type="button" style={buttonStyle()} onClick={onClose}>
          Cancel
        </button>
        <button type="submit" style={buttonStyle('primary')} disabled={busy}>
          {busy ? 'Saving…' : 'Submit for approval'}
        </button>
      </div>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Generic read-only live tables
// ---------------------------------------------------------------------------

const TABLE_PAGE_SIZE = 50;

export interface LiveColumn {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

export const LiveTableView: React.FC<{ title: string; subtitle: string; path: string; columns: LiveColumn[] }> = ({
  title,
  subtitle,
  path,
  columns,
}) => {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [path]);
  const pagedPath = `${path}${path.includes('?') ? '&' : '?'}limit=${TABLE_PAGE_SIZE}&offset=${(page - 1) * TABLE_PAGE_SIZE}`;
  const { data, error, loading, reload } = useApi<{ items: Array<Record<string, unknown>>; total?: number }>(pagedPath);
  return (
    <div>
      <PageHeader
        title={data?.total !== undefined ? `${title} (${data.total})` : title}
        subtitle={subtitle}
        actions={
          <button type="button" style={buttonStyle()} onClick={() => void reload()}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />
      <ErrorNote error={error} />
      <div style={{ ...card, overflowX: 'auto', marginTop: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '720px' }}>
          <thead>
            <tr>
              {columns.map(c => (
                <th key={c.key} style={th}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !data && (
              <tr>
                <td style={{ ...td, textAlign: 'center', color: colors.slate[500] }} colSpan={columns.length}>
                  Loading…
                </td>
              </tr>
            )}
            {data && data.items.length === 0 && (
              <tr>
                <td style={{ ...td, textAlign: 'center', color: colors.slate[500], padding: '28px' }} colSpan={columns.length}>
                  No records yet.
                </td>
              </tr>
            )}
            {data?.items.map((row, i) => (
              <tr key={String(row['id'] ?? i)}>
                {columns.map(c => (
                  <td key={c.key} style={td}>
                    {c.render ? c.render(row[c.key], row) : String(row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data?.total !== undefined && data.total > TABLE_PAGE_SIZE && (
          <div style={{ borderTop: `1px solid ${colors.slate[100]}`, padding: '8px 12px' }}>
            <Pagination currentPage={page} totalRecords={data.total} pageSize={TABLE_PAGE_SIZE} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
};

export const renderDate = (value: unknown) => fmt(value as string | null);
export const renderStatus = (value: unknown) => <StatusPill status={value as string} />;
