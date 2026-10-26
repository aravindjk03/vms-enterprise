import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import type { ColumnDef } from '@vms/ui';
import { apiRequest, type SessionUser } from '../../../api/client.js';
import { PageHeader, useApi } from '../LiveViews.js';
import {
  BackLink,
  buttonStyle,
  can,
  card,
  ErrorNote,
  FormGrid,
  KeyValues,
  label,
  Notice,
  PagedTable,
  pill,
  reference,
  Section,
  SelectField,
  TextField,
  useMutation,
  usePagedList,
  useSites,
  when,
} from './shared.js';

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

interface CalendarItem {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  priority: string;
  serviceCategory: string | null;
  start: string;
  end: string;
  siteName: string;
  providerName: string;
  technicians: Array<{ technicianId: string; name: string }>;
}

type View = 'day' | 'week' | 'month';
const DAY = 86_400_000;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function rangeFor(view: View, anchor: Date): { from: Date; to: Date; days: Date[] } {
  const base = startOfDay(anchor);
  let from: Date;
  let count: number;
  if (view === 'day') {
    from = base;
    count = 1;
  } else if (view === 'week') {
    from = new Date(base.getTime() - ((base.getDay() + 6) % 7) * DAY);
    count = 7;
  } else {
    const first = new Date(base.getFullYear(), base.getMonth(), 1);
    from = new Date(first.getTime() - ((first.getDay() + 6) % 7) * DAY);
    count = 42;
  }
  const days = Array.from({ length: count }, (_, i) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + i));
  return { from, to: new Date(days[days.length - 1].getTime() + DAY), days };
}

export const ServiceCalendar: React.FC<{ onOpenWorkOrder: (id: string) => void }> = ({ onOpenWorkOrder }) => {
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(new Date());
  const [siteId, setSiteId] = useState('');
  const [providerId, setProviderId] = useState('');
  const [status, setStatus] = useState('');
  const sites = useSites();
  const [providers, setProviders] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    apiRequest<{ items: Array<{ id: string; name: string }> }>('/api/v1/service/providers?limit=200').then(r => setProviders(r.items)).catch(() => undefined);
  }, []);

  const { from, to, days } = useMemo(() => rangeFor(view, anchor), [view, anchor]);
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  if (siteId) params.set('siteId', siteId);
  if (providerId) params.set('providerId', providerId);
  if (status) params.set('status', status);
  const { data, error, loading } = useApi<{ items: CalendarItem[] }>(`/api/v1/service/calendar?${params.toString()}`);

  const shift = (dir: number) => {
    const d = new Date(anchor);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setAnchor(d);
  };
  const itemsOn = (day: Date) =>
    (data?.items ?? []).filter(i => new Date(i.start) < new Date(day.getTime() + DAY) && new Date(i.end) > day).sort((a, b) => a.start.localeCompare(b.start));
  const today = startOfDay(new Date()).getTime();
  const title =
    view === 'month'
      ? anchor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
      : `${days[0].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}${days.length > 1 ? ` – ${days[days.length - 1].toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : `, ${days[0].getFullYear()}`}`;

  return (
    <div>
      <PageHeader title="Service schedule" subtitle="Scheduled work orders and assigned technicians." />
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
        <div role="group" aria-label="Calendar view" style={{ display: 'inline-flex' }}>
          {(['day', 'week', 'month'] as View[]).map(v => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v} style={{ ...buttonStyle(view === v ? 'primary' : 'secondary'), borderRadius: 0 }}>
              {label(v)}
            </button>
          ))}
        </div>
        <button type="button" style={buttonStyle()} onClick={() => shift(-1)} aria-label="Previous"><ChevronLeft size={14} /></button>
        <button type="button" style={buttonStyle()} onClick={() => setAnchor(new Date())}>Today</button>
        <button type="button" style={buttonStyle()} onClick={() => shift(1)} aria-label="Next"><ChevronRight size={14} /></button>
        <strong style={{ fontSize: '14px', marginRight: 'auto' }}>{title}</strong>
        <select aria-label="Site" style={{ ...buttonStyle(), padding: '7px 10px' }} value={siteId} onChange={e => setSiteId(e.target.value)}>
          <option value="">All my sites</option>
          {sites.map(s => <option key={s.siteId} value={s.siteId}>{s.name}</option>)}
        </select>
        <select aria-label="Provider" style={{ ...buttonStyle(), padding: '7px 10px' }} value={providerId} onChange={e => setProviderId(e.target.value)}>
          <option value="">All providers</option>
          {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select aria-label="Status" style={{ ...buttonStyle(), padding: '7px 10px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_SUBMITTED', 'COMPLETED', 'CLOSED', 'CANCELLED'].map(s => <option key={s} value={s}>{label(s)}</option>)}
        </select>
      </div>
      <ErrorNote error={error} />
      <div
        style={{
          ...card,
          display: 'grid',
          gridTemplateColumns: view === 'day' ? '1fr' : 'repeat(7, minmax(0, 1fr))',
          overflowX: 'auto',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {view !== 'day' &&
          ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} style={{ padding: '6px 8px', fontSize: '11px', fontWeight: 700, color: colors.slate[500], borderBottom: `1px solid ${colors.slate[200]}` }}>{d}</div>
          ))}
        {days.map(day => {
          const items = itemsOn(day);
          const outside = view === 'month' && day.getMonth() !== anchor.getMonth();
          return (
            <div
              key={day.toISOString()}
              style={{
                minHeight: view === 'month' ? '96px' : '160px',
                borderRight: `1px solid ${colors.slate[100]}`,
                borderBottom: `1px solid ${colors.slate[100]}`,
                padding: '6px',
                backgroundColor: day.getTime() === today ? colors.primary[50] : outside ? colors.slate[50] : '#fff',
                minWidth: 0,
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 700, color: outside ? colors.slate[400] : colors.slate[700], marginBottom: '4px' }}>
                {view === 'day' ? day.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' }) : day.getDate()}
              </div>
              {items.slice(0, view === 'month' ? 3 : 20).map(i => (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => onOpenWorkOrder(i.id)}
                  title={`${i.referenceNumber} · ${i.title} · ${i.providerName}`}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    fontSize: '11px',
                    padding: '3px 5px',
                    marginBottom: '3px',
                    borderRadius: radius.sm,
                    border: `1px solid ${colors.slate[200]}`,
                    borderLeft: `3px solid ${i.status === 'IN_PROGRESS' ? colors.status.active.solid : i.status === 'PENDING_APPROVAL' ? colors.status.pending.solid : colors.primary[500]}`,
                    background: '#fff',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <strong>{new Date(i.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</strong> {i.title}
                  {view !== 'month' && (
                    <span style={{ display: 'block', color: colors.slate[500] }}>
                      {i.providerName} · {i.technicians.length ? i.technicians.map(t => t.name).join(', ') : 'unassigned'} · {label(i.status)}
                    </span>
                  )}
                </button>
              ))}
              {view === 'month' && items.length > 3 && <div style={{ fontSize: '11px', color: colors.slate[500] }}>+{items.length - 3} more</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Recurring schedules
// ---------------------------------------------------------------------------

interface ScheduleRow {
  id: string;
  referenceNumber: string;
  title: string;
  frequency: string;
  intervalCount: number;
  byWeekdays: number[] | null;
  dayOfMonth: number | null;
  status: string;
  siteName: string;
  providerName: string;
  occurrences: number;
  missed: number;
  windowStartTime: string;
  timezone: string;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const describeRule = (r: Pick<ScheduleRow, 'frequency' | 'intervalCount' | 'byWeekdays' | 'dayOfMonth' | 'windowStartTime' | 'timezone'>) => {
  const every = r.intervalCount > 1 ? `Every ${r.intervalCount} ${r.frequency === 'DAILY' ? 'days' : r.frequency === 'WEEKLY' ? 'weeks' : 'months'}` : label(r.frequency);
  const on =
    r.frequency === 'WEEKLY' && r.byWeekdays?.length ? ` on ${r.byWeekdays.map(d => WEEKDAYS[d - 1]).join(', ')}` : r.frequency === 'MONTHLY' && r.dayOfMonth ? ` on day ${r.dayOfMonth}` : '';
  return `${every}${on} at ${r.windowStartTime.slice(0, 5)} (${r.timezone})`;
};

export const SchedulesView: React.FC<{ user: SessionUser; onOpenWorkOrder: (id: string) => void }> = ({ user, onOpenWorkOrder }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const list = usePagedList<ScheduleRow>('/api/v1/service/schedules', {});
  const sweep = useMutation();
  const [sweepResult, setSweepResult] = useState<string | null>(null);

  if (selected) return <ScheduleDetail id={selected} user={user} onBack={() => { setSelected(null); void list.reload(); }} onOpenWorkOrder={onOpenWorkOrder} />;
  const columns: ColumnDef<ScheduleRow>[] = [
    { key: 'referenceNumber', header: 'Reference', render: r => reference(r.referenceNumber) },
    { key: 'title', header: 'Schedule', render: r => <strong>{r.title}</strong> },
    { key: 'frequency', header: 'Recurrence', render: r => describeRule(r) },
    { key: 'providerName', header: 'Provider' },
    { key: 'siteName', header: 'Site' },
    { key: 'occurrences', header: 'Occurrences', align: 'right' },
    { key: 'missed', header: 'Missed', align: 'right' },
    { key: 'status', header: 'Status', render: r => pill(r.status) },
  ];
  return (
    <div>
      <PageHeader
        title="Recurring service"
        subtitle="Approved templates generate one dated work order per occurrence."
        actions={
          can(user, 'SERVICE_MANAGE') && (
            <>
              <button
                type="button"
                style={buttonStyle()}
                disabled={sweep.busy}
                onClick={() => void sweep.run<{ missed: number }>('/api/v1/service/occurrences/sweep-missed', {}).then(r => { if (r) { setSweepResult(`${r.missed} occurrence(s) marked missed.`); void list.reload(); } })}
              >
                Check for missed occurrences
              </button>
              <button type="button" style={buttonStyle('primary')} onClick={() => setCreating(true)}>
                <Plus size={14} /> New schedule
              </button>
            </>
          )
        }
      />
      <ErrorNote error={sweep.error} />
      {sweepResult && <Notice>{sweepResult}</Notice>}
      {creating && <ScheduleForm onCancel={() => setCreating(false)} onCreated={id => { setCreating(false); setSelected(id); }} />}
      <PagedTable list={list} columns={columns} onRowClick={r => setSelected(r.id)} emptyTitle="No recurring schedules" />
    </div>
  );
};

const ScheduleForm: React.FC<{ onCancel: () => void; onCreated: (id: string) => void }> = ({ onCancel, onCreated }) => {
  const sites = useSites();
  const m = useMutation();
  const [providers, setProviders] = useState<Array<{ id: string; name: string }>>([]);
  const [staff, setStaff] = useState<Array<{ userId: string; fullName: string }>>([]);
  const [f, setF] = useState({
    siteId: '',
    providerId: '',
    title: '',
    scopeOfWork: '',
    serviceCategory: '',
    maintenanceLeadId: '',
    frequency: 'WEEKLY',
    intervalCount: '1',
    dayOfMonth: '1',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    windowStartTime: '08:00',
    durationMinutes: '120',
    deliverables: '',
  });
  const [weekdays, setWeekdays] = useState<number[]>([1]);
  useEffect(() => {
    apiRequest<{ items: Array<{ id: string; name: string }> }>('/api/v1/service/providers?status=ACTIVE&limit=200').then(r => setProviders(r.items)).catch(() => undefined);
    apiRequest<{ items: Array<{ userId: string; fullName: string }> }>('/api/v1/service/staff').then(r => setStaff(r.items)).catch(() => undefined);
  }, []);
  useEffect(() => {
    if (!f.siteId && sites.length) setF(x => ({ ...x, siteId: sites[0].siteId }));
  }, [sites, f.siteId]);
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await m.run<{ id: string }>(
      '/api/v1/service/schedules',
      {
        siteId: f.siteId,
        providerId: f.providerId,
        title: f.title,
        scopeOfWork: f.scopeOfWork,
        serviceCategory: f.serviceCategory,
        maintenanceLeadId: f.maintenanceLeadId,
        frequency: f.frequency,
        intervalCount: Number(f.intervalCount),
        byWeekdays: f.frequency === 'WEEKLY' ? weekdays : undefined,
        dayOfMonth: f.frequency === 'MONTHLY' ? Number(f.dayOfMonth) : undefined,
        startDate: f.startDate,
        endDate: f.endDate || undefined,
        windowStartTime: f.windowStartTime,
        durationMinutes: Number(f.durationMinutes),
        deliverables: f.deliverables.split('\n').map(d => d.trim()).filter(Boolean),
      },
      { idempotent: true }
    );
    if (res) onCreated(res.id);
  };
  return (
    <form onSubmit={submit}>
      <Section title="New recurring schedule" note="Times are in the site's local time zone. The schedule must be approved by someone other than its creator before it generates work." actions={<button type="button" style={buttonStyle()} onClick={onCancel}>Cancel</button>}>
        <ErrorNote error={m.error} />
        <FormGrid>
          <SelectField label="Site" value={f.siteId} onChange={set('siteId')} required options={sites.map(s => ({ value: s.siteId, label: s.name }))} />
          <SelectField label="Provider" value={f.providerId} onChange={set('providerId')} required options={providers.map(p => ({ value: p.id, label: p.name }))} />
          <SelectField label="Maintenance lead" value={f.maintenanceLeadId} onChange={set('maintenanceLeadId')} required options={staff.map(s => ({ value: s.userId, label: s.fullName }))} />
          <TextField label="Title" value={f.title} onChange={set('title')} required maxLength={255} />
          <TextField label="Category" value={f.serviceCategory} onChange={set('serviceCategory')} required maxLength={64} />
          <SelectField label="Frequency" value={f.frequency} onChange={set('frequency')} required options={['DAILY', 'WEEKLY', 'MONTHLY'].map(x => ({ value: x, label: label(x) }))} />
          <TextField label="Every N periods" type="number" value={f.intervalCount} onChange={set('intervalCount')} required />
          {f.frequency === 'MONTHLY' && <TextField label="Day of month (1–28)" type="number" value={f.dayOfMonth} onChange={set('dayOfMonth')} required />}
          <TextField label="Starts" type="date" value={f.startDate} onChange={set('startDate')} required />
          <TextField label="Ends (optional)" type="date" value={f.endDate} onChange={set('endDate')} />
          <TextField label="Start time" type="time" value={f.windowStartTime} onChange={set('windowStartTime')} required />
          <TextField label="Duration (minutes)" type="number" value={f.durationMinutes} onChange={set('durationMinutes')} required />
        </FormGrid>
        {f.frequency === 'WEEKLY' && (
          <div style={{ marginTop: '10px', fontSize: '13px' }}>
            {WEEKDAYS.map((d, i) => (
              <label key={d} style={{ marginRight: '12px' }}>
                <input type="checkbox" checked={weekdays.includes(i + 1)} onChange={e => setWeekdays(w => (e.target.checked ? [...w, i + 1] : w.filter(x => x !== i + 1)))} /> {d}
              </label>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
          <TextField label="Scope of work" value={f.scopeOfWork} onChange={set('scopeOfWork')} required multiline maxLength={4000} />
          <TextField label="Deliverables (one per line)" value={f.deliverables} onChange={set('deliverables')} multiline />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="submit" style={buttonStyle('primary')} disabled={m.busy}>{m.busy ? 'Saving…' : 'Create schedule'}</button>
        </div>
      </Section>
    </form>
  );
};

const ScheduleDetail: React.FC<{ id: string; user: SessionUser; onBack: () => void; onOpenWorkOrder: (id: string) => void }> = ({ id, user, onBack, onOpenWorkOrder }) => {
  const { data, error, reload } = useApi<
    ScheduleRow & {
      scopeOfWork: string;
      startDate: string;
      endDate: string | null;
      durationMinutes: number;
      deliverables: string[];
      occurrences: Array<{ id: string; occurrenceDate: string; plannedStart: string; status: string; workOrderId: string | null; workOrderReference: string | null; workOrderStatus: string | null }>;
    }
  >(`/api/v1/service/schedules/${id}`);
  const m = useMutation();
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date(Date.now() + 30 * DAY).toISOString().slice(0, 10));
  const [result, setResult] = useState<string | null>(null);
  if (!data) return <div><BackLink onClick={onBack}>Recurring service</BackLink><ErrorNote error={error} /></div>;
  const act = async (action: string, body: unknown = {}) => {
    setResult(null);
    const r = await m.run<{ created?: number; existing?: number }>(`/api/v1/service/schedules/${id}/${action}`, body, { idempotent: action === 'generate' });
    if (r) {
      if (action === 'generate') setResult(`${r.created} work order(s) generated; ${r.existing} occurrence(s) already existed.`);
      await reload();
    }
  };
  return (
    <div>
      <BackLink onClick={onBack}>Recurring service</BackLink>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{data.title}</h1>
        {pill(data.status)}
        {reference(data.referenceNumber)}
      </div>
      <ErrorNote error={m.error} />
      {result && <Notice>{result}</Notice>}
      <Section
        title="Template"
        actions={
          <>
            {data.status === 'DRAFT' && can(user, 'SERVICE_APPROVE') && <button type="button" style={buttonStyle('primary')} disabled={m.busy} onClick={() => void act('approve')}>Approve</button>}
            {data.status === 'ACTIVE' && can(user, 'SERVICE_MANAGE') && <button type="button" style={buttonStyle()} disabled={m.busy} onClick={() => void act('pause')}>Pause</button>}
            {data.status === 'PAUSED' && can(user, 'SERVICE_MANAGE') && <button type="button" style={buttonStyle()} disabled={m.busy} onClick={() => void act('resume')}>Resume</button>}
            {data.status !== 'ENDED' && can(user, 'SERVICE_MANAGE') && <button type="button" style={buttonStyle('danger')} disabled={m.busy} onClick={() => void act('end')}>End schedule</button>}
          </>
        }
      >
        <KeyValues items={[['Recurrence', describeRule(data)], ['Duration', `${data.durationMinutes} min`], ['Period', `${data.startDate} → ${data.endDate ?? 'open'}`], ['Deliverables', data.deliverables.join('; ') || '—']]} />
        <p style={{ fontSize: '13px', margin: '10px 0 0' }}>{data.scopeOfWork}</p>
      </Section>
      {data.status === 'ACTIVE' && can(user, 'SERVICE_MANAGE') && (
        <Section title="Generate occurrences" note="Safe to repeat: dates that already have an occurrence are skipped.">
          <FormGrid>
            <TextField label="From" type="date" value={from} onChange={setFrom} required />
            <TextField label="To" type="date" value={to} onChange={setTo} required />
          </FormGrid>
          <button type="button" style={{ ...buttonStyle('primary'), marginTop: '8px' }} disabled={m.busy} onClick={() => void act('generate', { from, to })}>Generate</button>
        </Section>
      )}
      <Section title={`Occurrences (${data.occurrences.length})`}>
        {data.occurrences.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>None generated yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              {data.occurrences.map(o => (
                <tr key={o.id} style={{ borderBottom: `1px solid ${colors.slate[100]}` }}>
                  <td style={{ padding: '6px 0' }}>{when(o.plannedStart)}</td>
                  <td>{pill(o.status)}</td>
                  <td>
                    {o.workOrderId && (
                      <button type="button" style={{ ...buttonStyle(), padding: '2px 8px' }} onClick={() => onOpenWorkOrder(o.workOrderId!)}>
                        {o.workOrderReference}
                      </button>
                    )}
                  </td>
                  <td>{o.workOrderStatus && pill(o.workOrderStatus)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Exceptions
// ---------------------------------------------------------------------------

interface ExceptionRow {
  id: string;
  referenceNumber: string;
  exceptionType: string;
  severity: string;
  description: string;
  status: string;
  raisedAt: string;
  siteName: string;
  workOrderId: string | null;
  workOrderReference: string | null;
  raisedBy: string | null;
  resolution: string | null;
}

export const ExceptionsView: React.FC<{ user: SessionUser; onOpenWorkOrder: (id: string) => void }> = ({ user, onOpenWorkOrder }) => {
  const [status, setStatus] = useState('OPEN');
  const list = usePagedList<ExceptionRow>('/api/v1/service/exceptions', { status });
  const [resolving, setResolving] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const m = useMutation();
  const columns: ColumnDef<ExceptionRow>[] = [
    { key: 'referenceNumber', header: 'Reference', render: r => reference(r.referenceNumber) },
    { key: 'exceptionType', header: 'Type', render: r => label(r.exceptionType) },
    { key: 'severity', header: 'Severity', render: r => pill(r.severity) },
    { key: 'description', header: 'Description' },
    { key: 'siteName', header: 'Site' },
    {
      key: 'workOrderReference',
      header: 'Work order',
      render: r => (r.workOrderId ? <button type="button" style={{ ...buttonStyle(), padding: '2px 8px' }} onClick={e => { e.stopPropagation(); onOpenWorkOrder(r.workOrderId!); }}>{r.workOrderReference}</button> : '—'),
    },
    { key: 'raisedAt', header: 'Raised', render: r => when(r.raisedAt) },
    { key: 'status', header: 'Status', render: r => pill(r.status) },
  ];
  return (
    <div>
      <PageHeader title="Service exceptions" subtitle="Missed occurrences, no-shows, scope changes and other issues needing follow-up." />
      <div style={{ marginBottom: '12px' }}>
        <select aria-label="Status" style={{ ...buttonStyle(), padding: '7px 10px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="OPEN">Open</option>
          <option value="RESOLVED">Resolved</option>
          <option value="">All</option>
        </select>
      </div>
      {resolving && (
        <Section title="Resolve exception">
          <ErrorNote error={m.error} />
          <TextField label="Resolution" value={resolution} onChange={setResolution} required multiline maxLength={4000} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="button" style={buttonStyle('primary')} disabled={m.busy || resolution.trim().length < 3} onClick={() => void m.run(`/api/v1/service/exceptions/${resolving}/resolve`, { resolution }).then(r => { if (r) { setResolving(null); setResolution(''); void list.reload(); } })}>
              Resolve
            </button>
            <button type="button" style={buttonStyle()} onClick={() => setResolving(null)}>Cancel</button>
          </div>
        </Section>
      )}
      <PagedTable list={list} columns={columns} onRowClick={r => (can(user, 'SERVICE_MANAGE') && r.status === 'OPEN' ? setResolving(r.id) : undefined)} emptyTitle="No exceptions in this view" />
      {can(user, 'SERVICE_MANAGE') && <p style={{ fontSize: '12px', color: colors.slate[500] }}>Select an open exception to resolve it.</p>}
    </div>
  );
};

export { KeyValues };
