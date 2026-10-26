import React, { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import type { ColumnDef } from '@vms/ui';
import { apiRequest, type SessionUser } from '../../../api/client.js';
import { PageHeader, toLocalInput, useApi } from '../LiveViews.js';
import {
  BackLink,
  buttonStyle,
  can,
  ErrorNote,
  fmt,
  fmtDate,
  FormGrid,
  KeyValues,
  label,
  localDateString,
  Notice,
  PagedTable,
  pill,
  PRIORITIES,
  reference,
  Section,
  SelectField,
  SERVICE_TYPES,
  Tabs,
  TextField,
  titleWithRef,
  useMutation,
  usePagedList,
  useSites,
  when,
} from './shared.js';

interface WorkOrderRow {
  id: string;
  referenceNumber: string;
  title: string;
  status: string;
  priority: string;
  serviceCategory: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  siteName: string;
  providerName: string;
  overdue: boolean;
  technicians: number;
}

export const WorkOrdersView: React.FC<{ user: SessionUser; createForRequest?: string | null; openId?: string | null; onConsumed?: () => void }> = ({
  user,
  createForRequest,
  openId,
  onConsumed,
}) => {
  const [selected, setSelected] = useState<string | null>(openId ?? null);
  const [creating, setCreating] = useState<string | null | undefined>(createForRequest ? createForRequest : undefined);
  const [status, setStatus] = useState('');
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState('');
  const list = usePagedList<WorkOrderRow>('/api/v1/service/work-orders', { status, overdue: overdue ? 'true' : undefined, search: search.trim() || undefined });

  useEffect(() => {
    if (createForRequest) setCreating(createForRequest);
    if (openId) setSelected(openId);
    if (createForRequest || openId) onConsumed?.();
  }, [createForRequest, openId, onConsumed]);

  if (selected) {
    return <WorkOrderDetail id={selected} user={user} onBack={() => { setSelected(null); void list.reload(); }} />;
  }

  const columns: ColumnDef<WorkOrderRow>[] = [
    { key: 'title', header: 'Work order', wrap: true, minWidth: '220px', render: r => titleWithRef(r.title, r.referenceNumber) },
    {
      key: 'status',
      header: 'Status',
      render: r => (
        <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
          {pill(r.status)}
          {r.overdue && <span style={{ fontSize: '11px', fontWeight: 700, color: colors.status.danger.fg }}>OVERDUE</span>}
        </span>
      ),
    },
    { key: 'priority', header: 'Priority', render: r => pill(r.priority) },
    { key: 'scheduledStart', header: 'Scheduled', render: r => when(r.scheduledStart) },
    { key: 'providerName', header: 'Provider', wrap: true, minWidth: '120px' },
    { key: 'siteName', header: 'Site', wrap: true, minWidth: '140px' },
    { key: 'technicians', header: 'Technicians', align: 'right' },
  ];

  return (
    <div>
      <PageHeader
        title="Work orders"
        subtitle="Authorized service activity, from approval to accepted completion."
        actions={
          can(user, 'SERVICE_MANAGE') && (
            <button type="button" style={buttonStyle('primary')} onClick={() => setCreating(null)}>
              <Plus size={14} /> New work order
            </button>
          )
        }
      />
      {creating !== undefined && (
        <WorkOrderForm
          requestId={creating}
          onCancel={() => setCreating(undefined)}
          onCreated={id => {
            setCreating(undefined);
            setSelected(id);
          }}
        />
      )}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px', alignItems: 'center' }}>
        <select aria-label="Status" style={{ ...buttonStyle(), padding: '7px 10px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_SUBMITTED', 'COMPLETED', 'CLOSED', 'CANCELLED', 'REJECTED'].map(s => (
            <option key={s} value={s}>{label(s)}</option>
          ))}
        </select>
        <label style={{ fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input type="checkbox" checked={overdue} onChange={e => setOverdue(e.target.checked)} /> Overdue only
        </label>
        <input
          aria-label="Search work orders"
          placeholder="Search title or reference"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', padding: '7px 10px', fontSize: '13px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md }}
        />
      </div>
      <PagedTable list={list} columns={columns} onRowClick={r => setSelected(r.id)} emptyTitle="No work orders match this view" />
    </div>
  );
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

interface ProviderOption {
  id: string;
  name: string;
  categories: string[];
  status: string;
}

const WorkOrderForm: React.FC<{ requestId: string | null; onCancel: () => void; onCreated: (id: string) => void }> = ({ requestId, onCancel, onCreated }) => {
  const sites = useSites();
  const m = useMutation();
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [staff, setStaff] = useState<Array<{ userId: string; fullName: string }>>([]);
  const start = new Date(Math.ceil(Date.now() / 3_600_000) * 3_600_000 + 24 * 3_600_000);
  const [f, setF] = useState({
    siteId: '',
    providerId: '',
    title: '',
    scopeOfWork: '',
    serviceType: 'CORRECTIVE_MAINTENANCE',
    serviceCategory: '',
    priority: 'STANDARD',
    workLocation: '',
    equipmentTag: '',
    scheduledStart: toLocalInput(start),
    scheduledEnd: toLocalInput(new Date(start.getTime() + 3 * 3_600_000)),
    maintenanceLeadId: '',
    safetyPermitRequired: false,
    prerequisites: '',
    completionCriteria: '',
  });
  const [deliverables, setDeliverables] = useState<Array<{ description: string; evidenceRequired: boolean }>>([]);

  useEffect(() => {
    apiRequest<{ items: ProviderOption[] }>('/api/v1/service/providers?status=ACTIVE&limit=200').then(r => setProviders(r.items)).catch(() => undefined);
    apiRequest<{ items: Array<{ userId: string; fullName: string }> }>('/api/v1/service/staff').then(r => setStaff(r.items)).catch(() => undefined);
    if (requestId) {
      apiRequest<{ siteId: string; title: string; description: string; serviceType: string; serviceCategory: string; priority: string; workLocation: string | null; equipmentTag: string | null; safetyPermitRequired: boolean; prerequisites: string | null; deliverables: string | null }>(
        `/api/v1/service/requests/${requestId}`
      )
        .then(r => {
          setF(x => ({
            ...x,
            siteId: r.siteId,
            title: r.title,
            scopeOfWork: r.description,
            serviceType: r.serviceType ?? x.serviceType,
            serviceCategory: r.serviceCategory ?? '',
            priority: r.priority,
            workLocation: r.workLocation ?? '',
            equipmentTag: r.equipmentTag ?? '',
            safetyPermitRequired: r.safetyPermitRequired,
            prerequisites: r.prerequisites ?? '',
          }));
          if (r.deliverables) setDeliverables([{ description: r.deliverables.slice(0, 255), evidenceRequired: true }]);
        })
        .catch(err => m.setError(String(err?.message ?? err)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    if (!f.siteId && sites.length) setF(x => ({ ...x, siteId: sites[0].siteId }));
  }, [sites, f.siteId]);

  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }));
  const provider = providers.find(p => p.id === f.providerId);
  const categoryCode = f.serviceCategory.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await m.run<{ id: string }>(
      '/api/v1/service/work-orders',
      {
        ...f,
        requestId: requestId ?? undefined,
        workLocation: f.workLocation || undefined,
        equipmentTag: f.equipmentTag || undefined,
        prerequisites: f.prerequisites || undefined,
        completionCriteria: f.completionCriteria || undefined,
        scheduledStart: new Date(f.scheduledStart).toISOString(),
        scheduledEnd: new Date(f.scheduledEnd).toISOString(),
        deliverables: deliverables.filter(d => d.description.trim()).map(d => ({ ...d, isMandatory: true })),
      },
      { idempotent: true }
    );
    if (res) onCreated(res.id);
  };

  return (
    <form onSubmit={submit}>
      <Section title={requestId ? 'Create work order from request' : 'New work order'} actions={<button type="button" style={buttonStyle()} onClick={onCancel}>Cancel</button>}>
        <ErrorNote error={m.error} />
        <FormGrid>
          <SelectField label="Site" value={f.siteId} onChange={set('siteId')} required options={sites.map(s => ({ value: s.siteId, label: s.name }))} />
          <SelectField label="Provider" value={f.providerId} onChange={set('providerId')} required options={providers.map(p => ({ value: p.id, label: p.name }))} />
          <TextField label="Category" value={f.serviceCategory} onChange={set('serviceCategory')} required maxLength={64} />
          <SelectField label="Service type" value={f.serviceType} onChange={set('serviceType')} required options={SERVICE_TYPES.map(t => ({ value: t, label: label(t) }))} />
          <SelectField label="Priority" value={f.priority} onChange={set('priority')} required options={PRIORITIES.map(p => ({ value: p, label: label(p) }))} />
          <SelectField label="Maintenance lead" value={f.maintenanceLeadId} onChange={set('maintenanceLeadId')} required options={staff.map(s => ({ value: s.userId, label: s.fullName }))} />
          <TextField label="Title" value={f.title} onChange={set('title')} required maxLength={255} />
          <TextField label="Work location" value={f.workLocation} onChange={set('workLocation')} maxLength={255} />
          <TextField label="Equipment / asset tag" value={f.equipmentTag} onChange={set('equipmentTag')} maxLength={64} />
          <TextField label="Scheduled start" type="datetime-local" value={f.scheduledStart} onChange={set('scheduledStart')} required />
          <TextField label="Scheduled end" type="datetime-local" value={f.scheduledEnd} onChange={set('scheduledEnd')} required />
        </FormGrid>
        {provider && categoryCode && !provider.categories.includes(categoryCode) && (
          <Notice tone="warning">
            {provider.name} is approved for {provider.categories.map(label).join(', ') || 'no categories'}; the server will reject category “{label(categoryCode)}”.
          </Notice>
        )}
        <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
          <TextField label="Scope of work" value={f.scopeOfWork} onChange={set('scopeOfWork')} required multiline maxLength={4000} />
          <TextField label="Completion criteria" value={f.completionCriteria} onChange={set('completionCriteria')} multiline maxLength={4000} />
          <TextField label="Safety / document prerequisites" value={f.prerequisites} onChange={set('prerequisites')} multiline maxLength={4000} />
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}>
            <input type="checkbox" checked={f.safetyPermitRequired} onChange={e => setF(x => ({ ...x, safetyPermitRequired: e.target.checked }))} />
            Safety permit required before work starts
          </label>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: colors.slate[700], marginBottom: '6px' }}>Required deliverables (evidence needed before completion)</div>
            {deliverables.map((d, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                <input
                  aria-label={`Deliverable ${i + 1}`}
                  style={{ flex: 1, padding: '7px 10px', fontSize: '13px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md }}
                  value={d.description}
                  maxLength={255}
                  onChange={e => setDeliverables(ds => ds.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                />
                <label style={{ fontSize: '12px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input type="checkbox" checked={d.evidenceRequired} onChange={e => setDeliverables(ds => ds.map((x, j) => (j === i ? { ...x, evidenceRequired: e.target.checked } : x)))} />
                  Evidence
                </label>
                <button type="button" style={buttonStyle()} onClick={() => setDeliverables(ds => ds.filter((_, j) => j !== i))} aria-label={`Remove deliverable ${i + 1}`}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" style={buttonStyle()} onClick={() => setDeliverables(ds => [...ds, { description: '', evidenceRequired: true }])}>
              <Plus size={14} /> Add deliverable
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="submit" style={buttonStyle('primary')} disabled={m.busy}>
            {m.busy ? 'Creating…' : 'Create work order'}
          </button>
        </div>
      </Section>
    </form>
  );
};

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

interface Journey {
  id: string;
  referenceNumber: string;
  associationRole: string;
  activityDate: string;
  mode: string | null;
  ownership: string | null;
  vehicleType: string | null;
  fuel: string | null;
  occupancy: number | null;
  origin: string | null;
  destination: string | null;
  distance: string | null;
  journeyType: string;
  direction: string | null;
  measurementMethod: string;
  completeness: string;
  missingFacts: string[] | null;
  supersededBy: string | null;
  correctionReason: string | null;
  travellerName: string | null;
  linkedWorkOrders: number;
  ghgReference: string | null;
  ghgCalculationStatus: string | null;
  captureRetries: number | null;
  activityCapture: string;
}

interface WorkOrderDetailData {
  id: string;
  referenceNumber: string;
  title: string;
  scopeOfWork: string;
  status: string;
  stage: string;
  priority: string;
  serviceType: string;
  serviceCategory: string;
  workLocation: string | null;
  zoneName: string | null;
  equipmentTag: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  completionCriteria: string | null;
  safetyPermitRequired: boolean;
  prerequisites: string | null;
  siteName: string;
  providerName: string;
  providerId: string;
  maintenanceLead: string | null;
  createdBy: string | null;
  createdById: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  requestReference: string | null;
  scheduleReference: string | null;
  deliverables: Array<{ id: string; description: string; evidenceRequired: boolean; isMandatory: boolean; satisfiedAt: string | null; satisfiedBy: string | null; evidenceNote: string | null }>;
  assignments: Array<{ id: string; technicianId: string; technicianName: string; role: string; plannedStart: string; plannedEnd: string; status: string; conflictAcknowledged: boolean }>;
  progress: Array<{ id: string; eventType: string; occurredAt: string; recordedAt: string; actor: string; statusBefore: string | null; statusAfter: string | null; outcome: string | null; comment: string | null; technicianName: string | null; correctsEventId: string | null; corrected: boolean; source: string }>;
  completions: Array<{ id: string; workSummary: string; submittedAt: string; submittedBy: string; submittedById: string; decision: string | null; decidedAt: string | null; decidedBy: string | null; decisionRemarks: string | null }>;
  exceptions: Array<{ id: string; referenceNumber: string; exceptionType: string; severity: string; description: string; status: string; raisedAt: string; resolution: string | null }>;
  journeys: Journey[];
  history: Array<{ from: string | null; to: string; at: string; actor: string | null; reason: string | null }>;
  readiness: { prerequisitesRequired: boolean; prerequisitesSatisfied: boolean; hasActiveAssignment: boolean; outstandingDeliverables: string[] };
  integrations: { safety: { integration: string; permitStatus: string; detail: string }; access: { integration: string; detail: string } };
}

const TABS = ['Overview', 'Technicians', 'Progress', 'Deliverables & completion', 'Transport & mobility', 'Activity traceability', 'Exceptions', 'History'];

export const WorkOrderDetail: React.FC<{ id: string; user: SessionUser; onBack: () => void }> = ({ id, user, onBack }) => {
  const { data, error, reload } = useApi<WorkOrderDetailData>(`/api/v1/service/work-orders/${id}`);
  const [tab, setTab] = useState('Overview');
  const m = useMutation();
  const [remarks, setRemarks] = useState('');

  const post = async (path: string, body: unknown, idempotent = false) => {
    const res = await m.run(`/api/v1/service/work-orders/${id}${path}`, body, { idempotent });
    if (res) {
      setRemarks('');
      await reload();
    }
    return res;
  };

  if (!data) return <div><BackLink onClick={onBack}>Work orders</BackLink><ErrorNote error={error} /></div>;
  const isCreator = data.createdById === user.userId;
  const pendingCompletion = data.completions.find(c => !c.decision);

  return (
    <div>
      <BackLink onClick={onBack}>Work orders</BackLink>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{data.title}</h1>
        {pill(data.status)}
        {reference(data.referenceNumber)}
      </div>
      <p style={{ margin: '0 0 12px', fontSize: '13px', color: colors.slate[500] }}>
        {data.providerName} · {data.siteName} · {new Date(data.scheduledStart).toLocaleString()} – {new Date(data.scheduledEnd).toLocaleTimeString()}
      </p>
      <ErrorNote error={m.error} />
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Overview' && (
        <>
          <Section title="Work order">
            <KeyValues
              items={[
                ['Type', label(data.serviceType)],
                ['Category', label(data.serviceCategory)],
                ['Priority', pill(data.priority)],
                ['Stage', label(data.stage)],
                ['Location', [data.workLocation, data.zoneName].filter(Boolean).join(' · ') || '—'],
                ['Equipment', data.equipmentTag],
                ['Maintenance lead', data.maintenanceLead],
                ['Created by', data.createdBy],
                ['Approved', data.approvedBy ? `${data.approvedBy} · ${new Date(data.approvedAt!).toLocaleString()}` : data.approvedAt ? `Approved via schedule` : '—'],
                ['Request', data.requestReference],
                ['Recurring schedule', data.scheduleReference],
              ]}
            />
            <p style={{ fontSize: '13px', whiteSpace: 'pre-wrap', margin: '12px 0 0' }}>{data.scopeOfWork}</p>
            {data.completionCriteria && <p style={{ fontSize: '13px', margin: '8px 0 0' }}><strong>Completion criteria:</strong> {data.completionCriteria}</p>}
          </Section>
          <Section title="Prerequisites & access" note="Safety permits and physical gate access are decided by their own services; a work order approval grants neither.">
            <KeyValues
              items={[
                ['Safety permit required', data.safetyPermitRequired ? 'Yes' : 'No'],
                ['Declared prerequisites', data.prerequisites],
                ['Prerequisites verified', data.readiness.prerequisitesRequired ? pill(data.readiness.prerequisitesSatisfied ? 'VERIFIED' : 'NOT_VERIFIED') : 'Not required'],
                ['Safety & Permit integration', pill(data.integrations.safety.integration)],
                ['Gate & Access integration', pill(data.integrations.access.integration)],
              ]}
            />
            <Notice tone="warning">{data.integrations.safety.detail}</Notice>
            <Notice>{data.integrations.access.detail}</Notice>
          </Section>
          {(data.status === 'PENDING_APPROVAL' || ['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'ON_HOLD'].includes(data.status) || data.status === 'COMPLETED') && (
            <Section title="Actions">
              {data.status === 'PENDING_APPROVAL' && isCreator && can(user, 'SERVICE_APPROVE') && (
                <Notice tone="warning">You created this work order, so another approver must decide on it.</Notice>
              )}
              <TextField label="Remarks / reason" value={remarks} onChange={setRemarks} multiline maxLength={2000} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {data.status === 'PENDING_APPROVAL' && can(user, 'SERVICE_APPROVE') && !isCreator && (
                  <>
                    <button type="button" style={buttonStyle('primary')} disabled={m.busy} onClick={() => void post('/approve', { remarks: remarks || undefined })}>Approve</button>
                    <button type="button" style={buttonStyle('danger')} disabled={m.busy} onClick={() => void post('/reject', { remarks: remarks || undefined })}>Reject</button>
                  </>
                )}
                {['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'ON_HOLD'].includes(data.status) && can(user, 'SERVICE_MANAGE') && (
                  <button type="button" style={buttonStyle()} disabled={m.busy} onClick={() => void post('/cancel', { reason: remarks })}>Cancel work order</button>
                )}
                {data.status === 'COMPLETED' && can(user, 'SERVICE_MANAGE') && (
                  <button type="button" style={buttonStyle('primary')} disabled={m.busy} onClick={() => void post('/close', { remarks: remarks || undefined })}>Close work order</button>
                )}
              </div>
            </Section>
          )}
        </>
      )}

      {tab === 'Technicians' && <AssignmentsPanel data={data} user={user} post={post} busy={m.busy} />}
      {tab === 'Progress' && <ProgressPanel data={data} user={user} post={post} busy={m.busy} />}
      {tab === 'Deliverables & completion' && (
        <CompletionPanel data={data} user={user} post={post} busy={m.busy} pendingCompletion={pendingCompletion} />
      )}
      {tab === 'Transport & mobility' && <TransportPanel data={data} user={user} onChanged={reload} />}
      {tab === 'Activity traceability' && <TraceabilityPanel data={data} />}
      {tab === 'Exceptions' && <ExceptionsPanel data={data} user={user} post={post} busy={m.busy} />}
      {tab === 'History' && (
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
      )}
    </div>
  );
};

type PostFn = (path: string, body: unknown, idempotent?: boolean) => Promise<unknown>;

const AssignmentsPanel: React.FC<{ data: WorkOrderDetailData; user: SessionUser; post: PostFn; busy: boolean }> = ({ data, user, post, busy }) => {
  const [technicians, setTechnicians] = useState<Array<{ id: string; name: string; status: string }>>([]);
  const [technicianId, setTechnicianId] = useState('');
  const [start, setStart] = useState(toLocalInput(new Date(data.scheduledStart)));
  const [end, setEnd] = useState(toLocalInput(new Date(data.scheduledEnd)));
  const [reason, setReason] = useState('');
  useEffect(() => {
    apiRequest<{ items: Array<{ id: string; name: string; status: string }> }>(`/api/v1/service/technicians?providerId=${data.providerId}&status=ACTIVE&limit=200`)
      .then(r => setTechnicians(r.items))
      .catch(() => undefined);
  }, [data.providerId]);
  const canAssign = can(user, 'SERVICE_MANAGE') && ['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'].includes(data.status);
  return (
    <>
      <Section title="Assigned technicians">
        {data.assignments.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>No technicians assigned.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <tbody>
              {data.assignments.map(a => (
                <tr key={a.id} style={{ borderBottom: `1px solid ${colors.slate[100]}` }}>
                  <td style={{ padding: '6px 0' }}><strong>{a.technicianName}</strong> · {label(a.role)}</td>
                  <td>{new Date(a.plannedStart).toLocaleString()} – {new Date(a.plannedEnd).toLocaleTimeString()}</td>
                  <td>{pill(a.status)}{a.conflictAcknowledged ? ' overlap acknowledged' : ''}</td>
                  <td style={{ textAlign: 'right' }}>
                    {a.status === 'ASSIGNED' && can(user, 'SERVICE_MANAGE') && (
                      <button type="button" style={buttonStyle()} disabled={busy || reason.trim().length < 3} title={reason.trim().length < 3 ? 'Enter a reason below first' : undefined} onClick={() => void post(`/assignments/${a.id}/cancel`, { reason })}>
                        Unassign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {can(user, 'SERVICE_MANAGE') && data.assignments.some(a => a.status === 'ASSIGNED') && (
          <div style={{ marginTop: '8px' }}><TextField label="Reason for unassigning" value={reason} onChange={setReason} maxLength={500} /></div>
        )}
      </Section>
      {canAssign && (
        <Section title="Assign technician" note="Technicians must belong to the work order's provider. Overlapping assignments for the same technician are rejected.">
          <FormGrid>
            <SelectField label="Technician" value={technicianId} onChange={setTechnicianId} required options={technicians.map(t => ({ value: t.id, label: t.name }))} />
            <TextField label="Planned start" type="datetime-local" value={start} onChange={setStart} required />
            <TextField label="Planned end" type="datetime-local" value={end} onChange={setEnd} required />
          </FormGrid>
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              style={buttonStyle('primary')}
              disabled={busy || !technicianId}
              onClick={() => void post('/assignments', { technicianId, plannedStart: new Date(start).toISOString(), plannedEnd: new Date(end).toISOString() }, true)}
            >
              Assign
            </button>
          </div>
        </Section>
      )}
    </>
  );
};

const EVENT_HELP: Record<string, string> = {
  ARRIVED: 'Technician reported at site (not a gate event)',
  PREREQUISITES_CHECKED: 'Safety prerequisites verified manually',
  WORK_STARTED: 'Work started',
  WORK_PAUSED: 'Work paused',
  WORK_RESUMED: 'Work resumed',
  DEPARTED: 'Technician left site (does not complete the work)',
};

const ProgressPanel: React.FC<{ data: WorkOrderDetailData; user: SessionUser; post: PostFn; busy: boolean }> = ({ data, user, post, busy }) => {
  const [technicianId, setTechnicianId] = useState('');
  const [comment, setComment] = useState('');
  const [outcome, setOutcome] = useState('VERIFIED');
  const [correcting, setCorrecting] = useState<string | null>(null);
  const [correctedAt, setCorrectedAt] = useState(toLocalInput(new Date()));
  const assigned = data.assignments.filter(a => a.status === 'ASSIGNED');

  const options = useMemo(() => {
    const s = data.status;
    const list: string[] = [];
    const arrival = can(user, 'SERVICE_ARRIVAL_RECORD') || can(user, 'SERVICE_EXECUTE');
    if (arrival && ['APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'].includes(s)) list.push('ARRIVED');
    if (can(user, 'SERVICE_PREREQ_VERIFY') && ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'].includes(s)) list.push('PREREQUISITES_CHECKED');
    if (can(user, 'SERVICE_EXECUTE')) {
      if (s === 'SCHEDULED') list.push('WORK_STARTED');
      if (s === 'IN_PROGRESS') list.push('WORK_PAUSED');
      if (s === 'ON_HOLD') list.push('WORK_RESUMED');
    }
    if (arrival && ['APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_SUBMITTED', 'COMPLETED'].includes(s)) list.push('DEPARTED');
    return list;
  }, [data.status, user]);

  const record = (eventType: string) =>
    post('/progress', { eventType, technicianId: technicianId || undefined, comment: comment || undefined, outcome: eventType === 'PREREQUISITES_CHECKED' ? outcome : undefined }, true).then(r => {
      if (r) setComment('');
    });

  return (
    <>
      {data.readiness.prerequisitesRequired && !data.readiness.prerequisitesSatisfied && ['SCHEDULED', 'APPROVED'].includes(data.status) && (
        <Notice tone="warning">Work cannot start until an authorized EHS or site manager records verified safety prerequisites.</Notice>
      )}
      {options.length > 0 && (
        <Section title="Record progress">
          <FormGrid>
            <SelectField label="Technician (optional)" value={technicianId} onChange={setTechnicianId} options={assigned.map(a => ({ value: a.technicianId, label: a.technicianName }))} />
            {options.includes('PREREQUISITES_CHECKED') && (
              <SelectField label="Prerequisite outcome" value={outcome} onChange={setOutcome} required options={[{ value: 'VERIFIED', label: 'Verified' }, { value: 'NOT_VERIFIED', label: 'Not verified' }]} />
            )}
          </FormGrid>
          <div style={{ marginTop: '8px' }}>
            <TextField label="Comment (required to pause, and to record what was verified)" value={comment} onChange={setComment} multiline maxLength={2000} />
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
            {options.map(o => (
              <button key={o} type="button" style={buttonStyle(o === 'WORK_STARTED' ? 'primary' : 'secondary')} disabled={busy} onClick={() => void record(o)} title={EVENT_HELP[o]}>
                {label(o)}
              </button>
            ))}
          </div>
        </Section>
      )}
      <Section title="Timeline" note="Events are append-only. Corrections are recorded as new entries that reference the original.">
        <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {data.progress.map(e => (
            <li key={e.id} style={{ borderLeft: `2px solid ${e.eventType === 'CORRECTION' ? colors.status.warning.solid : colors.primary[500]}`, padding: '4px 0 10px 12px', fontSize: '13px' }}>
              <div>
                <strong>{label(e.eventType)}</strong>
                {e.technicianName ? ` · ${e.technicianName}` : ''}
                {e.outcome ? <> · {pill(e.outcome)}</> : null}
                {e.corrected && <span style={{ color: colors.status.warning.fg, fontWeight: 600 }}> · corrected</span>}
              </div>
              <div style={{ color: colors.slate[500], fontSize: '12px' }}>
                {new Date(e.occurredAt).toLocaleString()} · recorded by {e.actor}
                {e.statusBefore && e.statusAfter && e.statusBefore !== e.statusAfter ? ` · ${label(e.statusBefore)} → ${label(e.statusAfter)}` : ''}
              </div>
              {e.comment && <div style={{ marginTop: '2px' }}>{e.comment}</div>}
              {can(user, 'SERVICE_EXECUTE') && ['ARRIVED', 'DEPARTED', 'WORK_STARTED', 'WORK_PAUSED', 'WORK_RESUMED'].includes(e.eventType) && (
                correcting === e.id ? (
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end', marginTop: '6px', flexWrap: 'wrap' }}>
                    <TextField label="Correct time" type="datetime-local" value={correctedAt} onChange={setCorrectedAt} />
                    <TextField label="Reason" value={comment} onChange={setComment} maxLength={1000} />
                    <button type="button" style={buttonStyle('primary')} disabled={busy || comment.trim().length < 3} onClick={() => void post(`/progress/${e.id}/corrections`, { occurredAt: new Date(correctedAt).toISOString(), reason: comment }).then(() => setCorrecting(null))}>
                      Save correction
                    </button>
                    <button type="button" style={buttonStyle()} onClick={() => setCorrecting(null)}>Cancel</button>
                  </div>
                ) : (
                  <button type="button" style={{ ...buttonStyle(), marginTop: '4px', padding: '2px 8px' }} onClick={() => setCorrecting(e.id)}>Correct time</button>
                )
              )}
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
};

const CompletionPanel: React.FC<{ data: WorkOrderDetailData; user: SessionUser; post: PostFn; busy: boolean; pendingCompletion?: WorkOrderDetailData['completions'][number] }> = ({
  data,
  user,
  post,
  busy,
  pendingCompletion,
}) => {
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [replacing, setReplacing] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState('');
  const [remarks, setRemarks] = useState('');
  const canEvidence = can(user, 'SERVICE_EXECUTE') && ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_SUBMITTED'].includes(data.status);
  // Recorded evidence can be corrected while work is open (e.g. after a reviewer returned the completion).
  const canReplace = can(user, 'SERVICE_EXECUTE') && ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'].includes(data.status);
  const evidenceInput = (d: { id: string; description: string }, actionLabel: string) => (
    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
      <input
        aria-label={`Evidence for ${d.description}`}
        placeholder="Evidence reference (e.g. certificate number, report ID)"
        value={evidence[d.id] ?? ''}
        onChange={e => setEvidence(x => ({ ...x, [d.id]: e.target.value }))}
        style={{ flex: '1 1 220px', minWidth: 0, padding: '7px 10px', fontSize: '13px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md }}
      />
      <button
        type="button"
        style={buttonStyle('primary')}
        disabled={busy || (evidence[d.id] ?? '').trim().length < 3}
        onClick={() =>
          void post(`/deliverables/${d.id}/evidence`, { evidenceNote: evidence[d.id] }).then(saved => {
            if (!saved) return;
            setReplacing(x => ({ ...x, [d.id]: false }));
            setEvidence(x => ({ ...x, [d.id]: '' }));
          })
        }
      >
        {actionLabel}
      </button>
    </div>
  );
  return (
    <>
      <Section title="Deliverables" note="File upload is not available yet; record evidence as a reference (certificate number, report ID) until it is.">
        {data.deliverables.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>No deliverables were required.</p>}
        {data.deliverables.map(d => (
          <div key={d.id} style={{ borderBottom: `1px solid ${colors.slate[100]}`, padding: '8px 0', fontSize: '13px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <strong>{d.description}</strong>
              {d.isMandatory ? pill('REQUIRED') : null}
              {d.satisfiedAt ? pill('COMPLETE') : pill('OPEN')}
            </div>
            {d.satisfiedAt ? (
              <>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap', color: colors.slate[600] }}>
                  <span>
                    {d.evidenceNote} — {d.satisfiedBy}, {fmt(d.satisfiedAt)}
                  </span>
                  {canReplace && !replacing[d.id] && (
                    <button type="button" style={{ ...buttonStyle(), padding: '3px 8px', fontSize: '12px' }} onClick={() => setReplacing(x => ({ ...x, [d.id]: true }))}>
                      Replace evidence
                    </button>
                  )}
                </div>
                {canReplace && replacing[d.id] && evidenceInput(d, 'Save replacement')}
              </>
            ) : (
              canEvidence && evidenceInput(d, 'Attach evidence')
            )}
          </div>
        ))}
      </Section>
      {data.status === 'IN_PROGRESS' && can(user, 'SERVICE_EXECUTE') && (
        <Section title="Submit completion">
          {data.readiness.outstandingDeliverables.length > 0 && <Notice tone="warning">Outstanding evidence: {data.readiness.outstandingDeliverables.join('; ')}</Notice>}
          <TextField label="Work summary" value={summary} onChange={setSummary} required multiline maxLength={4000} />
          <button type="button" style={{ ...buttonStyle('primary'), marginTop: '8px' }} disabled={busy || summary.trim().length < 3} onClick={() => void post('/completion', { workSummary: summary }, true)}>
            Submit completion
          </button>
        </Section>
      )}
      {pendingCompletion && (
        <Section title="Completion awaiting decision">
          <p style={{ fontSize: '13px', margin: '0 0 8px' }}>
            “{pendingCompletion.workSummary}” — submitted by {pendingCompletion.submittedBy}, {new Date(pendingCompletion.submittedAt).toLocaleString()}
          </p>
          {can(user, 'SERVICE_ACCEPT') && pendingCompletion.submittedById === user.userId && <Notice tone="warning">You submitted this completion; someone else must accept or return it.</Notice>}
          {can(user, 'SERVICE_ACCEPT') && pendingCompletion.submittedById !== user.userId && (
            <>
              <TextField label="Remarks (required to return)" value={remarks} onChange={setRemarks} multiline maxLength={2000} />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" style={buttonStyle('primary')} disabled={busy} onClick={() => void post('/completion/accept', { remarks: remarks || undefined })}>Accept completion</button>
                <button type="button" style={buttonStyle('danger')} disabled={busy} onClick={() => void post('/completion/return', { remarks: remarks || undefined })}>Return for rework</button>
              </div>
            </>
          )}
        </Section>
      )}
      <Section title="Completion records">
        {data.completions.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>Nothing submitted yet.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
            {data.completions.map(c => (
              <li key={c.id}>
                {new Date(c.submittedAt).toLocaleString()} {c.submittedBy}: {c.workSummary} — {c.decision ? `${label(c.decision)} by ${c.decidedBy}${c.decisionRemarks ? ` (${c.decisionRemarks})` : ''}` : 'awaiting decision'}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
};

interface TransportReference {
  modes: Array<{ code: string; name: string }>;
  ownership: Array<{ code: string; name: string }>;
  vehicleTypes: Array<{ code: string; name: string }>;
  fuels: Array<{ code: string; name: string }>;
  journeyTypes: string[];
  directions: string[];
  usageTypes: string[];
  measurementMethods: string[];
}

const ROAD_MODES = new Set(['CAR', 'TWO_WHEELER', 'TAXI_CAB', 'TRUCK', 'BUS']);

const TransportPanel: React.FC<{ data: WorkOrderDetailData; user: SessionUser; onChanged: () => Promise<void> }> = ({ data, user, onChanged }) => {
  const { data: ref } = useApi<TransportReference>('/api/v1/service/transport-reference');
  const m = useMutation();
  const [result, setResult] = useState<string | null>(null);
  const empty = {
    technicianId: '',
    activityDate: localDateString(new Date(data.scheduledStart)),
    modeCode: '',
    ownershipCode: '',
    vehicleTypeCode: '',
    fuelCode: '',
    usageType: '',
    occupancy: '',
    originName: '',
    originCity: '',
    destinationName: data.siteName,
    destinationCity: '',
    distanceKm: '',
    journeyType: 'ONE_WAY',
    direction: 'INBOUND',
    measurementMethod: 'UNKNOWN',
  };
  const [f, setF] = useState(empty);
  const set = (k: keyof typeof f) => (v: string) => setF(x => ({ ...x, [k]: v }));
  const road = ROAD_MODES.has(f.modeCode);
  const canCapture = (can(user, 'SERVICE_EXECUTE') || can(user, 'SERVICE_MANAGE')) && !['CANCELLED', 'REJECTED'].includes(data.status);

  const submit = async () => {
    setResult(null);
    const res = await m.run<{ deduplicated: boolean; completeness?: string; missingFacts?: string[] }>(
      `/api/v1/service/work-orders/${data.id}/journeys`,
      {
        technicianId: f.technicianId || undefined,
        activityDate: f.activityDate,
        modeCode: f.modeCode || null,
        ownershipCode: road ? f.ownershipCode || null : null,
        vehicleTypeCode: road ? f.vehicleTypeCode || null : null,
        fuelCode: road ? f.fuelCode || null : null,
        usageType: f.usageType || null,
        occupancy: f.occupancy ? Number(f.occupancy) : null,
        originName: f.originName || null,
        originCity: f.originCity || null,
        destinationName: f.destinationName || null,
        destinationCity: f.destinationCity || null,
        distanceKm: f.distanceKm ? Number(f.distanceKm) : null,
        journeyType: f.journeyType,
        direction: f.direction || null,
        measurementMethod: f.distanceKm ? (f.measurementMethod === 'UNKNOWN' ? 'USER_REPORTED' : f.measurementMethod) : 'UNKNOWN',
      },
      { idempotent: true }
    );
    if (res) {
      setResult(
        res.deduplicated
          ? 'This trip was already recorded (e.g. from another work order on the same visit); it has been linked instead of duplicated.'
          : res.missingFacts && res.missingFacts.length
            ? `Recorded. Missing facts for later calculation: ${res.missingFacts.join(', ')}.`
            : 'Recorded with complete facts.'
      );
      setF(empty);
      await onChanged();
    }
  };

  return (
    <>
      <Section title="Transport & mobility" note="Record how technicians travelled for this work. Only travel facts are captured here — scope, emission factors and CO₂e are assigned later by the central GHG engine.">
        {data.journeys.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>No journeys recorded.</p>}
        {data.journeys.map(j => (
          <div key={j.id} style={{ borderBottom: `1px solid ${colors.slate[100]}`, padding: '8px 0', fontSize: '13px', opacity: j.supersededBy ? 0.6 : 1 }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {reference(j.referenceNumber)}
              <strong>{j.travellerName ?? 'Traveller not specified'}</strong>
              {pill(j.completeness)}
              {pill(j.activityCapture)}
              {j.linkedWorkOrders > 1 && <span style={{ fontSize: '12px', color: colors.slate[600] }}>shared by {j.linkedWorkOrders} work orders</span>}
            </div>
            <div style={{ color: colors.slate[700] }}>
              {fmtDate(j.activityDate)} · {j.origin ?? '?'} → {j.destination ?? '?'} · {label(j.mode) || 'mode unknown'}
              {j.fuel ? ` · ${label(j.fuel)}` : ''} · {j.distance ? `${Number(j.distance)} km (${label(j.measurementMethod)})` : 'distance unknown'} · {label(j.journeyType)}
            </div>
            {j.missingFacts && j.missingFacts.length > 0 && !j.supersededBy && <div style={{ color: colors.status.warning.fg, fontSize: '12px' }}>Missing: {j.missingFacts.join(', ')}</div>}
            {j.correctionReason && <div style={{ fontSize: '12px', color: colors.slate[500] }}>Correction: {j.correctionReason}</div>}
          </div>
        ))}
      </Section>
      {canCapture && (
        <Section title="Add a journey">
          <ErrorNote error={m.error} />
          {result && <Notice>{result}</Notice>}
          <FormGrid>
            <SelectField label="Traveller (assigned technician)" value={f.technicianId} onChange={set('technicianId')} options={data.assignments.filter(a => a.status === 'ASSIGNED').map(a => ({ value: a.technicianId, label: a.technicianName }))} />
            <TextField label="Date of travel" type="date" value={f.activityDate} onChange={set('activityDate')} required />
            <SelectField label="Mode" value={f.modeCode} onChange={set('modeCode')} placeholder="Unknown" options={(ref?.modes ?? []).map(o => ({ value: o.code, label: o.name }))} />
            {road && (
              <>
                <SelectField label="Ownership" value={f.ownershipCode} onChange={set('ownershipCode')} placeholder="Unknown" options={(ref?.ownership ?? []).map(o => ({ value: o.code, label: o.name }))} />
                <SelectField label="Vehicle type" value={f.vehicleTypeCode} onChange={set('vehicleTypeCode')} placeholder="Unknown" options={(ref?.vehicleTypes ?? []).map(o => ({ value: o.code, label: o.name }))} />
                <SelectField label="Fuel" value={f.fuelCode} onChange={set('fuelCode')} placeholder="Unknown" options={(ref?.fuels ?? []).map(o => ({ value: o.code, label: o.name }))} />
                <TextField label="People in vehicle" type="number" value={f.occupancy} onChange={set('occupancy')} />
              </>
            )}
            <SelectField label="Usage" value={f.usageType} onChange={set('usageType')} placeholder="Unknown" options={(ref?.usageTypes ?? []).map(o => ({ value: o, label: label(o) }))} />
            <TextField label="From (place)" value={f.originName} onChange={set('originName')} maxLength={255} />
            <TextField label="From (city)" value={f.originCity} onChange={set('originCity')} maxLength={128} />
            <TextField label="To (place)" value={f.destinationName} onChange={set('destinationName')} maxLength={255} />
            <TextField label="To (city)" value={f.destinationCity} onChange={set('destinationCity')} maxLength={128} />
            <SelectField label="Journey" value={f.journeyType} onChange={set('journeyType')} required options={(ref?.journeyTypes ?? ['ONE_WAY']).map(o => ({ value: o, label: label(o) }))} />
            <SelectField label="Direction" value={f.direction} onChange={set('direction')} options={(ref?.directions ?? []).map(o => ({ value: o, label: label(o) }))} />
            <TextField label="Distance (km) — leave blank if unknown" type="number" value={f.distanceKm} onChange={set('distanceKm')} />
            {f.distanceKm && (
              <SelectField label="How was distance obtained?" value={f.measurementMethod} onChange={set('measurementMethod')} required options={(ref?.measurementMethods ?? []).filter(x => x !== 'UNKNOWN').map(o => ({ value: o, label: label(o) }))} />
            )}
          </FormGrid>
          <button type="button" style={{ ...buttonStyle('primary'), marginTop: '10px' }} disabled={m.busy} onClick={() => void submit()}>
            {m.busy ? 'Saving…' : 'Record journey'}
          </button>
        </Section>
      )}
    </>
  );
};

interface Trace {
  transportActivity: { referenceNumber: string; sourceDomain: string; activityDate: string; distance: string | null; measurementMethod: string; dataSource: string; completeness: string; missingFacts: string[] | null; capturedAt: string; supersedes: string | null; supersededBy: string | null };
  sources: Array<{ workOrderReference: string; associationRole: string; requestReference: string | null; linkedAt: string }>;
  ghgActivity: null | { referenceNumber: string; activityType: string; sourceDomain: string; sourceEntityType: string; quantity: string | null; quantityUnit: string | null; dataQuality: string | null; calculationStatus: string; verificationStatus: string; scope: string | null; co2e: string | null };
  captureQueue: null | { status: string; retryCount: number; lastError: string | null; queuedAt: string; processedAt: string | null };
  note: string;
}

const TraceabilityPanel: React.FC<{ data: WorkOrderDetailData }> = ({ data }) => {
  const [selected, setSelected] = useState<string | null>(data.journeys.find(j => !j.supersededBy)?.id ?? data.journeys[0]?.id ?? null);
  const { data: trace, error } = useApi<Trace>(selected ? `/api/v1/service/journeys/${selected}/trace` : null);
  if (data.journeys.length === 0) {
    return <Section title="Activity & sustainability traceability"><p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>Record a journey to see its activity record.</p></Section>;
  }
  return (
    <Section title="Activity & sustainability traceability" note="Source work order → transport activity → activity ledger entry. Calculation happens later in the central GHG engine.">
      <SelectField label="Journey" value={selected ?? ''} onChange={setSelected} required options={data.journeys.map(j => ({ value: j.id, label: `${j.referenceNumber}${j.supersededBy ? ' (superseded)' : ''}` }))} />
      <ErrorNote error={error} />
      {trace && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '12px' }}>
          <div style={{ border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[500] }}>1 · SOURCE TRANSACTIONS</div>
            {trace.sources.map(s => (
              <div key={s.workOrderReference} style={{ fontSize: '13px', marginTop: '4px' }}>
                {reference(s.workOrderReference)} {label(s.associationRole)}{s.requestReference ? ` · request ${s.requestReference}` : ''}
              </div>
            ))}
          </div>
          <div style={{ border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[500] }}>2 · TRANSPORT ACTIVITY</div>
            <KeyValues
              items={[
                ['Reference', reference(trace.transportActivity.referenceNumber)],
                ['Distance', trace.transportActivity.distance ? `${Number(trace.transportActivity.distance)} km` : 'Unknown'],
                ['Method', label(trace.transportActivity.measurementMethod)],
                ['Completeness', pill(trace.transportActivity.completeness)],
                ['Version', trace.transportActivity.supersededBy ? 'Superseded by a correction' : trace.transportActivity.supersedes ? 'Corrected version' : 'Original'],
              ]}
            />
          </div>
          <div style={{ border: `1px solid ${colors.slate[200]}`, borderRadius: radius.md, padding: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: colors.slate[500] }}>3 · ACTIVITY LEDGER</div>
            {trace.ghgActivity ? (
              <KeyValues
                items={[
                  ['Reference', reference(trace.ghgActivity.referenceNumber)],
                  ['Activity', label(trace.ghgActivity.activityType)],
                  ['Quantity', trace.ghgActivity.quantity ? `${Number(trace.ghgActivity.quantity)} ${trace.ghgActivity.quantityUnit}` : 'Unknown'],
                  ['Data quality', trace.ghgActivity.dataQuality ? label(trace.ghgActivity.dataQuality) : 'Not determined'],
                  ['Calculation', pill(trace.ghgActivity.calculationStatus)],
                  ['Scope / CO₂e', trace.ghgActivity.co2e ?? 'Not calculated yet'],
                ]}
              />
            ) : (
              <p style={{ fontSize: '13px', margin: '4px 0 0' }}>
                Not in the ledger yet — {trace.captureQueue ? `queue status ${label(trace.captureQueue.status)}${trace.captureQueue.retryCount ? `, ${trace.captureQueue.retryCount} retr${trace.captureQueue.retryCount === 1 ? 'y' : 'ies'}` : ''}` : 'no capture event'}.
              </p>
            )}
          </div>
        </div>
      )}
      {trace && <p style={{ fontSize: '12px', color: colors.slate[500], margin: '10px 0 0' }}>{trace.note}</p>}
    </Section>
  );
};

const ExceptionsPanel: React.FC<{ data: WorkOrderDetailData; user: SessionUser; post: PostFn; busy: boolean }> = ({ data, user, post, busy }) => {
  const [type, setType] = useState('OTHER');
  const [severity, setSeverity] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  return (
    <>
      <Section title="Exceptions">
        {data.exceptions.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>None raised.</p>}
        {data.exceptions.map(e => (
          <div key={e.id} style={{ borderBottom: `1px solid ${colors.slate[100]}`, padding: '6px 0', fontSize: '13px' }}>
            {reference(e.referenceNumber)} <strong>{label(e.exceptionType)}</strong> {pill(e.severity)} {pill(e.status)}
            <div>{e.description}</div>
            {e.resolution && <div style={{ color: colors.slate[600] }}>Resolution: {e.resolution}</div>}
          </div>
        ))}
      </Section>
      {(can(user, 'SERVICE_EXECUTE') || can(user, 'SERVICE_MANAGE')) && (
        <Section title="Raise an exception">
          <FormGrid>
            <SelectField label="Type" value={type} onChange={setType} required options={['PROVIDER_NO_SHOW', 'SCOPE_CHANGE', 'SAFETY_CONCERN', 'QUALITY_ISSUE', 'ACCESS_ISSUE', 'OVERDUE', 'OTHER'].map(t => ({ value: t, label: label(t) }))} />
            <SelectField label="Severity" value={severity} onChange={setSeverity} required options={['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(t => ({ value: t, label: label(t) }))} />
          </FormGrid>
          <div style={{ marginTop: '8px' }}><TextField label="Description" value={description} onChange={setDescription} required multiline maxLength={4000} /></div>
          <button type="button" style={{ ...buttonStyle('primary'), marginTop: '8px' }} disabled={busy || description.trim().length < 3} onClick={() => void post('/exceptions', { exceptionType: type, severity, description }, true).then(r => r && setDescription(''))}>
            Raise exception
          </button>
        </Section>
      )}
    </>
  );
};
