import React, { useEffect, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import type { ColumnDef } from '@vms/ui';
import { apiRequest, type SessionUser } from '../../../api/client.js';
import { PageHeader, useApi } from '../LiveViews.js';
import {
  BackLink,
  buttonStyle,
  can,
  ErrorNote,
  FormGrid,
  KeyValues,
  label,
  Notice,
  PagedTable,
  pill,
  PRIORITIES,
  reference,
  Section,
  SelectField,
  SERVICE_TYPES,
  TextField,
  useMutation,
  usePagedList,
  useSites,
  when,
} from './shared.js';

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

interface Summary {
  openRequests: number;
  pendingApprovals: number;
  scheduledWork: number;
  techniciansExpectedToday: number;
  workInProgress: number;
  overdueWork: number;
  pendingCompletion: number;
  openExceptions: number;
  avgRequestApprovalHours: number | null;
  byCategory: Array<{ key: string; count: number }>;
  byProvider: Array<{ key: string; count: number }>;
  bySite: Array<{ key: string; count: number }>;
  activityCapture: { executedWorkOrders: number; withJourney: number; journeys: number; completeJourneys: number; capturedInLedger: number };
  generatedAt: string;
}

const Distribution: React.FC<{ title: string; rows: Array<{ key: string; count: number }> }> = ({ title, rows }) => {
  const max = Math.max(1, ...rows.map(r => r.count));
  return (
    <Section title={title}>
      {rows.length === 0 ? (
        <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>No work orders yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {rows.map(r => (
              <tr key={r.key}>
                <td style={{ fontSize: '13px', padding: '4px 8px 4px 0', color: colors.slate[700], width: '45%' }}>{label(r.key)}</td>
                <td style={{ padding: '4px 0' }}>
                  <div aria-hidden style={{ height: '8px', borderRadius: radius.full, backgroundColor: colors.primary[500], width: `${(r.count / max) * 100}%`, minWidth: '4px' }} />
                </td>
                <td style={{ fontSize: '13px', fontWeight: 700, textAlign: 'right', paddingLeft: '8px', fontVariantNumeric: 'tabular-nums' }}>{r.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Section>
  );
};

export const ServiceDashboard: React.FC<{ go: (route: string) => void }> = ({ go }) => {
  const { data, error, loading, reload } = useApi<Summary>('/api/v1/service/analytics/summary');
  const tiles: Array<[string, keyof Summary, string]> = [
    ['Open requests', 'openRequests', '/services'],
    ['Pending approvals', 'pendingApprovals', '/services'],
    ['Scheduled work', 'scheduledWork', '/services/work-orders'],
    ['Technicians expected today', 'techniciansExpectedToday', '/services/calendar'],
    ['Work in progress', 'workInProgress', '/services/work-orders'],
    ['Overdue work', 'overdueWork', '/services/work-orders'],
    ['Pending completion', 'pendingCompletion', '/services/work-orders'],
    ['Open exceptions', 'openExceptions', '/services/exceptions'],
  ];
  const cap = data?.activityCapture;
  const pct = (a: number, b: number) => (b === 0 ? '—' : `${Math.round((a / b) * 100)}%`);
  return (
    <div>
      <PageHeader
        title="Service & maintenance"
        subtitle={`Requests, work orders and technician activity across your sites${data ? ` · updated ${new Date(data.generatedAt).toLocaleTimeString()}` : ''}`}
        actions={
          <button type="button" style={buttonStyle()} onClick={() => void reload()}>
            <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Refresh
          </button>
        }
      />
      <ErrorNote error={error} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        {tiles.map(([title, key, route]) => (
          <button
            key={key}
            type="button"
            onClick={() => go(route)}
            style={{ textAlign: 'left', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.lg, padding: '14px', backgroundColor: '#fff', cursor: 'pointer' }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</div>
            <div style={{ fontSize: '26px', fontWeight: 800, color: key === 'overdueWork' && data && data.overdueWork > 0 ? colors.status.danger.fg : colors.slate[900], fontVariantNumeric: 'tabular-nums' }}>
              {data ? String(data[key]) : '—'}
            </div>
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
        <Distribution title="Work orders by category" rows={data?.byCategory ?? []} />
        <Distribution title="Work orders by provider" rows={data?.byProvider ?? []} />
        <Distribution title="Work orders by site" rows={data?.bySite ?? []} />
        <Section title="Activity capture completeness" note="Operational travel facts recorded on work orders. Emissions are calculated later by the central GHG engine; no totals are shown here.">
          <KeyValues
            items={[
              ['Work orders executed', cap?.executedWorkOrders ?? '—'],
              ['…with a recorded journey', cap ? `${cap.withJourney} (${pct(cap.withJourney, cap.executedWorkOrders)})` : '—'],
              ['Journeys with complete facts', cap ? `${cap.completeJourneys} of ${cap.journeys}` : '—'],
              ['Journeys in activity ledger', cap ? `${cap.capturedInLedger} of ${cap.journeys}` : '—'],
              ['Avg. request approval time', data?.avgRequestApprovalHours != null ? `${data.avgRequestApprovalHours} h` : '—'],
            ]}
          />
        </Section>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

interface RequestRow {
  id: string;
  referenceNumber: string;
  title: string;
  serviceType: string;
  serviceCategory: string;
  priority: string;
  status: string;
  createdAt: string;
  siteName: string;
  requestedBy: string | null;
  workOrders: number;
}

export const RequestsView: React.FC<{ user: SessionUser; openCreate?: boolean; onCreateWorkOrder: (requestId: string) => void }> = ({ user, openCreate, onCreateWorkOrder }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(!!openCreate);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [search, setSearch] = useState('');
  const list = usePagedList<RequestRow>('/api/v1/service/requests', { status, priority, search: search.trim() || undefined });
  const readsAll = can(user, 'SERVICE_READ');

  if (selected) {
    return <RequestDetail id={selected} user={user} onBack={() => { setSelected(null); void list.reload(); }} onCreateWorkOrder={onCreateWorkOrder} />;
  }

  const columns: ColumnDef<RequestRow>[] = [
    { key: 'referenceNumber', header: 'Reference', render: r => reference(r.referenceNumber) },
    { key: 'title', header: 'Request', render: r => <strong>{r.title}</strong> },
    { key: 'serviceType', header: 'Type', render: r => label(r.serviceType) },
    { key: 'priority', header: 'Priority', render: r => pill(r.priority) },
    { key: 'siteName', header: 'Site' },
    { key: 'requestedBy', header: 'Requested by' },
    { key: 'createdAt', header: 'Raised', render: r => when(r.createdAt) },
    { key: 'workOrders', header: 'Work orders', align: 'right' },
    { key: 'status', header: 'Status', render: r => pill(r.status) },
  ];

  return (
    <div>
      <PageHeader
        title={readsAll ? 'Service requests' : 'My service requests'}
        subtitle={readsAll ? 'Requests for work from across your sites.' : 'Work you have requested and its progress.'}
        actions={
          can(user, 'SERVICE_REQUEST_CREATE') && (
            <button type="button" style={buttonStyle('primary')} onClick={() => setCreating(true)}>
              <Plus size={14} /> New request
            </button>
          )
        }
      />
      {creating && (
        <RequestForm
          user={user}
          onCancel={() => setCreating(false)}
          onCreated={id => {
            setCreating(false);
            setSelected(id);
          }}
        />
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <select aria-label="Status" style={{ ...buttonStyle(), padding: '7px 10px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['SUBMITTED', 'APPROVED', 'WORK_ORDERED', 'FULFILLED', 'REJECTED', 'CANCELLED'].map(s => (
            <option key={s} value={s}>{label(s)}</option>
          ))}
        </select>
        <select aria-label="Priority" style={{ ...buttonStyle(), padding: '7px 10px' }} value={priority} onChange={e => setPriority(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{label(p)}</option>
          ))}
        </select>
        <input
          aria-label="Search requests"
          placeholder="Search title or reference"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', padding: '7px 10px', fontSize: '13px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md }}
        />
      </div>
      <PagedTable list={list} columns={columns} onRowClick={r => setSelected(r.id)} emptyTitle="No service requests match this view" />
    </div>
  );
};

const RequestForm: React.FC<{ user: SessionUser; onCancel: () => void; onCreated: (id: string) => void }> = ({ user, onCancel, onCreated }) => {
  const sites = useSites();
  const m = useMutation();
  const [f, setF] = useState({
    siteId: '',
    serviceType: 'CORRECTIVE_MAINTENANCE',
    serviceCategory: '',
    title: '',
    description: '',
    priority: 'STANDARD',
    workLocation: '',
    equipmentTag: '',
    preferredStart: '',
    preferredEnd: '',
    deliverables: '',
    prerequisites: '',
    safetyPermitRequired: false,
  });
  useEffect(() => {
    if (!f.siteId && sites.length) setF(x => ({ ...x, siteId: user.defaultSiteId && sites.some(s => s.siteId === user.defaultSiteId) ? user.defaultSiteId : sites[0].siteId }));
  }, [sites, f.siteId, user.defaultSiteId]);
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await m.run<{ id: string }>(
      '/api/v1/service/requests',
      {
        ...f,
        workLocation: f.workLocation || undefined,
        equipmentTag: f.equipmentTag || undefined,
        deliverables: f.deliverables || undefined,
        prerequisites: f.prerequisites || undefined,
        preferredStart: f.preferredStart ? new Date(f.preferredStart).toISOString() : undefined,
        preferredEnd: f.preferredEnd ? new Date(f.preferredEnd).toISOString() : undefined,
      },
      { idempotent: true }
    );
    if (res) onCreated(res.id);
  };

  return (
    <form onSubmit={submit}>
      <Section title="New service request" actions={<button type="button" style={buttonStyle()} onClick={onCancel}>Cancel</button>}>
        <ErrorNote error={m.error} />
        <FormGrid>
          <SelectField label="Site" value={f.siteId} onChange={set('siteId')} required options={sites.map(s => ({ value: s.siteId, label: s.name }))} />
          <SelectField label="Service type" value={f.serviceType} onChange={set('serviceType')} required options={SERVICE_TYPES.map(t => ({ value: t, label: label(t) }))} />
          <TextField label="Category (e.g. HVAC, Robotic calibration)" value={f.serviceCategory} onChange={set('serviceCategory')} required maxLength={64} />
          <SelectField label="Priority" value={f.priority} onChange={set('priority')} required options={PRIORITIES.map(p => ({ value: p, label: label(p) }))} />
          <TextField label="Title" value={f.title} onChange={set('title')} required maxLength={255} />
          <TextField label="Work location" value={f.workLocation} onChange={set('workLocation')} maxLength={255} />
          <TextField label="Equipment / asset tag" value={f.equipmentTag} onChange={set('equipmentTag')} maxLength={64} />
          <TextField label="Preferred start" type="datetime-local" value={f.preferredStart} onChange={set('preferredStart')} />
          <TextField label="Preferred end" type="datetime-local" value={f.preferredEnd} onChange={set('preferredEnd')} />
        </FormGrid>
        <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
          <TextField label="Description of the work needed" value={f.description} onChange={set('description')} required multiline maxLength={4000} />
          <TextField label="Expected deliverables" value={f.deliverables} onChange={set('deliverables')} multiline maxLength={4000} />
          <TextField label="Known safety / document prerequisites" value={f.prerequisites} onChange={set('prerequisites')} multiline maxLength={4000} />
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
            <input type="checkbox" checked={f.safetyPermitRequired} onChange={e => setF(x => ({ ...x, safetyPermitRequired: e.target.checked }))} />
            Hazardous work — a safety permit is likely required
          </label>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="submit" style={buttonStyle('primary')} disabled={m.busy}>
            {m.busy ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      </Section>
    </form>
  );
};

interface RequestDetailData {
  id: string;
  referenceNumber: string;
  title: string;
  description: string;
  serviceType: string;
  serviceCategory: string;
  priority: string;
  status: string;
  stage: string;
  siteName: string;
  workLocation: string | null;
  equipmentTag: string | null;
  deliverables: string | null;
  prerequisites: string | null;
  safetyPermitRequired: boolean;
  preferredStart: string | null;
  preferredEnd: string | null;
  requestedBy: string | null;
  requestedById: string | null;
  createdAt: string;
  suggestedProviderName: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  decisionRemarks: string | null;
  workOrders: Array<{ id: string; referenceNumber: string; title: string; status: string; scheduledStart: string }>;
  history: Array<{ from: string | null; to: string; at: string; actor: string | null; reason: string | null }>;
}

const RequestDetail: React.FC<{ id: string; user: SessionUser; onBack: () => void; onCreateWorkOrder: (requestId: string) => void }> = ({ id, user, onBack, onCreateWorkOrder }) => {
  const { data, error, reload } = useApi<RequestDetailData>(`/api/v1/service/requests/${id}`);
  const m = useMutation();
  const [remarks, setRemarks] = useState('');

  const act = async (action: string) => {
    const res = await m.run(`/api/v1/service/requests/${id}/${action}`, { remarks: remarks || undefined });
    if (res) {
      setRemarks('');
      await reload();
    }
  };
  if (!data) return <div><BackLink onClick={onBack}>Requests</BackLink><ErrorNote error={error} /></div>;

  const isRequester = data.requestedById === user.userId;
  const canDecide = can(user, 'SERVICE_APPROVE') && data.status === 'SUBMITTED' && !isRequester;
  // A request whose every work order was cancelled or rejected can still be closed by cancelling it.
  const workStopped =
    data.status === 'WORK_ORDERED' && (data.workOrders ?? []).length > 0 && data.workOrders.every(w => ['CANCELLED', 'REJECTED'].includes(w.status));
  const cancellable = ['SUBMITTED', 'APPROVED'].includes(data.status) || workStopped;
  return (
    <div>
      <BackLink onClick={onBack}>Requests</BackLink>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{data.title}</h1>
        {pill(data.status)}
        {reference(data.referenceNumber)}
      </div>
      <ErrorNote error={m.error} />
      <Section title="Request">
        <KeyValues
          items={[
            ['Type', label(data.serviceType)],
            ['Category', label(data.serviceCategory)],
            ['Priority', pill(data.priority)],
            ['Site', data.siteName],
            ['Location', data.workLocation],
            ['Equipment', data.equipmentTag],
            ['Preferred window', data.preferredStart ? `${new Date(data.preferredStart).toLocaleString()} → ${data.preferredEnd ? new Date(data.preferredEnd).toLocaleString() : 'open'}` : '—'],
            ['Requested by', `${data.requestedBy ?? '—'} · ${new Date(data.createdAt).toLocaleString()}`],
            ['Suggested provider', data.suggestedProviderName],
            ['Safety permit expected', data.safetyPermitRequired ? 'Yes' : 'No'],
            ['Decision', data.decidedBy ? `${data.decidedBy} · ${new Date(data.decidedAt!).toLocaleString()}${data.decisionRemarks ? ` — ${data.decisionRemarks}` : ''}` : '—'],
          ]}
        />
        <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap', margin: '12px 0 0' }}>{data.description}</p>
        {data.deliverables && <p style={{ fontSize: '13px', margin: '8px 0 0' }}><strong>Deliverables:</strong> {data.deliverables}</p>}
        {data.prerequisites && <p style={{ fontSize: '13px', margin: '8px 0 0' }}><strong>Prerequisites:</strong> {data.prerequisites}</p>}
      </Section>

      {(canDecide || (data.status === 'SUBMITTED' && isRequester) || (cancellable && (isRequester || can(user, 'SERVICE_MANAGE')))) && (
        <Section title="Decision">
          {data.status === 'SUBMITTED' && isRequester && can(user, 'SERVICE_APPROVE') && (
            <Notice tone="warning">You raised this request, so another approver must decide on it.</Notice>
          )}
          <TextField label="Remarks (required to reject or cancel)" value={remarks} onChange={setRemarks} multiline maxLength={2000} />
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
            {canDecide && (
              <>
                <button type="button" style={buttonStyle('primary')} disabled={m.busy} onClick={() => void act('approve')}>Approve</button>
                <button type="button" style={buttonStyle('danger')} disabled={m.busy} onClick={() => void act('reject')}>Reject</button>
              </>
            )}
            {cancellable && (isRequester || can(user, 'SERVICE_MANAGE')) && (
              <button type="button" style={buttonStyle()} disabled={m.busy} onClick={() => void act('cancel')}>Cancel request</button>
            )}
          </div>
        </Section>
      )}

      {can(user, 'SERVICE_READ') && (
        <Section
          title="Work orders"
          actions={
            <>
              {can(user, 'SERVICE_MANAGE') && ['APPROVED', 'WORK_ORDERED'].includes(data.status) && (
                <button type="button" style={buttonStyle('primary')} onClick={() => onCreateWorkOrder(id)}>
                  <Plus size={14} /> Create work order
                </button>
              )}
              {can(user, 'SERVICE_MANAGE') && data.status === 'WORK_ORDERED' && (
                <button type="button" style={buttonStyle()} disabled={m.busy} onClick={() => void act('fulfil')}>Mark fulfilled</button>
              )}
            </>
          }
        >
          {data.workOrders.length === 0 ? (
            <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>
              {data.status === 'SUBMITTED' ? 'Work orders can be raised once the request is approved.' : 'No work orders yet.'}
            </p>
          ) : (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
              {data.workOrders.map(w => (
                <li key={w.id}>
                  {reference(w.referenceNumber)} {w.title} · {new Date(w.scheduledStart).toLocaleString()} {pill(w.status)}
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Status history">
        <ol style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
          {data.history.map((h, i) => (
            <li key={i}>
              {new Date(h.at).toLocaleString()} — {h.from ? `${label(h.from)} → ` : ''}<strong>{label(h.to)}</strong>
              {h.actor ? ` by ${h.actor}` : ''}
              {h.reason ? ` (${h.reason})` : ''}
            </li>
          ))}
        </ol>
      </Section>
    </div>
  );
};

export async function fetchJson<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}
