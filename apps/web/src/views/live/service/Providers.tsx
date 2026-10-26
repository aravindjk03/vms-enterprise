import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import type { ColumnDef } from '@vms/ui';
import { apiRequest, type SessionUser } from '../../../api/client.js';
import { PageHeader, useApi } from '../LiveViews.js';
import {
  BackLink,
  buttonStyle,
  can,
  ErrorNote,
  fmtDate,
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

interface ProviderRow {
  id: string;
  providerCode: string;
  name: string;
  status: string;
  categories: string[];
  siteCount: number;
  activeTechnicians: number;
  openWorkOrders: number;
  isContractor: boolean;
}

export const ProvidersView: React.FC<{ user: SessionUser }> = ({ user }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const list = usePagedList<ProviderRow>('/api/v1/service/providers', { status, search: search.trim() || undefined });

  if (selected) return <ProviderDetail id={selected} user={user} onBack={() => { setSelected(null); void list.reload(); }} />;

  const columns: ColumnDef<ProviderRow>[] = [
    { key: 'providerCode', header: 'Code', render: r => reference(r.providerCode) },
    { key: 'name', header: 'Provider', render: r => <strong>{r.name}</strong> },
    { key: 'categories', header: 'Approved categories', render: r => r.categories.map(label).join(', ') || '—' },
    { key: 'siteCount', header: 'Sites', align: 'right' },
    { key: 'activeTechnicians', header: 'Technicians', align: 'right' },
    { key: 'openWorkOrders', header: 'Open work', align: 'right' },
    { key: 'isContractor', header: 'Also contractor', render: r => (r.isContractor ? 'Yes' : 'No') },
    { key: 'status', header: 'Status', render: r => pill(r.status) },
  ];
  return (
    <div>
      <PageHeader
        title="Service providers"
        subtitle="External organizations approved to perform service work. Registration alone grants no site or category."
        actions={
          can(user, 'SERVICE_MANAGE') && (
            <button type="button" style={buttonStyle('primary')} onClick={() => setCreating(true)}>
              <Plus size={14} /> Register provider
            </button>
          )
        }
      />
      {creating && <ProviderForm onCancel={() => setCreating(false)} onCreated={id => { setCreating(false); setSelected(id); }} />}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
        <select aria-label="Status" style={{ ...buttonStyle(), padding: '7px 10px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED'].map(s => <option key={s} value={s}>{label(s)}</option>)}
        </select>
        <input aria-label="Search providers" placeholder="Search name or code" value={search} onChange={e => setSearch(e.target.value)} style={{ flex: '1 1 220px', padding: '7px 10px', fontSize: '13px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md }} />
      </div>
      <PagedTable list={list} columns={columns} onRowClick={r => setSelected(r.id)} emptyTitle="No providers registered" />
    </div>
  );
};

const ProviderForm: React.FC<{ onCancel: () => void; onCreated: (id: string) => void }> = ({ onCancel, onCreated }) => {
  const sites = useSites();
  const m = useMutation();
  const [orgs, setOrgs] = useState<Array<{ id: string; legalName: string; code: string; serviceProviderId: string | null; isContractor: boolean }>>([]);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [orgId, setOrgId] = useState('');
  const [org, setOrg] = useState({ code: '', legalName: '', tradeName: '' });
  const [providerCode, setProviderCode] = useState('');
  const [categories, setCategories] = useState('');
  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [agreementReference, setAgreement] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  useEffect(() => {
    apiRequest<{ items: typeof orgs }>('/api/v1/service/organizations').then(r => setOrgs(r.items)).catch(() => undefined);
  }, []);
  const available = orgs.filter(o => !o.serviceProviderId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await m.run<{ id: string }>(
      '/api/v1/service/providers',
      {
        externalOrgId: mode === 'existing' ? orgId : undefined,
        newOrganization: mode === 'new' ? { code: org.code, legalName: org.legalName, tradeName: org.tradeName || undefined } : undefined,
        providerCode,
        categories: categories.split(',').map(c => c.trim()).filter(Boolean),
        siteIds,
        agreementReference: agreementReference || undefined,
        effectiveTo: effectiveTo || undefined,
      },
      { idempotent: true }
    );
    if (res) onCreated(res.id);
  };

  return (
    <form onSubmit={submit}>
      <Section title="Register service provider" actions={<button type="button" style={buttonStyle()} onClick={onCancel}>Cancel</button>}>
        <ErrorNote error={m.error} />
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', marginBottom: '10px' }}>
          <label><input type="radio" checked={mode === 'existing'} onChange={() => setMode('existing')} /> Existing organization</label>
          <label><input type="radio" checked={mode === 'new'} onChange={() => setMode('new')} /> New organization</label>
        </div>
        <FormGrid>
          {mode === 'existing' ? (
            <SelectField label="Organization" value={orgId} onChange={setOrgId} required options={available.map(o => ({ value: o.id, label: `${o.legalName}${o.isContractor ? ' (contractor)' : ''}` }))} />
          ) : (
            <>
              <TextField label="Organization code" value={org.code} onChange={v => setOrg(x => ({ ...x, code: v }))} required maxLength={32} />
              <TextField label="Legal name" value={org.legalName} onChange={v => setOrg(x => ({ ...x, legalName: v }))} required maxLength={255} />
              <TextField label="Trade name" value={org.tradeName} onChange={v => setOrg(x => ({ ...x, tradeName: v }))} maxLength={255} />
            </>
          )}
          <TextField label="Provider code" value={providerCode} onChange={setProviderCode} required maxLength={64} />
          <TextField label="Approved categories (comma separated)" value={categories} onChange={setCategories} required placeholder="HVAC, Electrical inspection" />
          <TextField label="Agreement reference" value={agreementReference} onChange={setAgreement} maxLength={128} />
          <TextField label="Relationship valid until" type="date" value={effectiveTo} onChange={setEffectiveTo} />
        </FormGrid>
        <fieldset style={{ border: 'none', padding: 0, margin: '12px 0 0' }}>
          <legend style={{ fontSize: '12px', fontWeight: 600, color: colors.slate[700] }}>Authorized sites</legend>
          {sites.map(s => (
            <label key={s.siteId} style={{ display: 'inline-flex', gap: '6px', marginRight: '16px', fontSize: '13px' }}>
              <input type="checkbox" checked={siteIds.includes(s.siteId)} onChange={e => setSiteIds(x => (e.target.checked ? [...x, s.siteId] : x.filter(i => i !== s.siteId)))} />
              {s.name}
            </label>
          ))}
        </fieldset>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button type="submit" style={buttonStyle('primary')} disabled={m.busy}>{m.busy ? 'Registering…' : 'Register provider'}</button>
        </div>
      </Section>
    </form>
  );
};

interface ProviderDetailData {
  id: string;
  providerCode: string;
  status: string;
  legalName: string;
  tradeName: string | null;
  agreementReference: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  notes: string | null;
  internalOwnerName: string | null;
  isContractor: boolean;
  categories: string[];
  sites: Array<{ siteId: string; name: string }>;
  technicians: Array<{ id: string; name: string; certificationLevel: string | null; status: string }>;
  recentWorkOrders: Array<{ id: string; referenceNumber: string; title: string; status: string; scheduledStart: string }>;
}

const ProviderDetail: React.FC<{ id: string; user: SessionUser; onBack: () => void }> = ({ id, user, onBack }) => {
  const { data, error, reload } = useApi<ProviderDetailData>(`/api/v1/service/providers/${id}`);
  const sites = useSites();
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState<{ status: string; categories: string; siteIds: string[]; reason: string }>({ status: '', categories: '', siteIds: [], reason: '' });
  const [tech, setTech] = useState({ firstName: '', lastName: '', certificationLevel: '' });
  const m = useMutation();
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (data) setEdit({ status: data.status, categories: data.categories.join(', '), siteIds: data.sites.map(s => s.siteId), reason: '' });
  }, [data]);

  if (!data) return <div><BackLink onClick={onBack}>Providers</BackLink><ErrorNote error={error} /></div>;

  const save = async () => {
    setSaveError(null);
    try {
      await apiRequest(`/api/v1/service/providers/${id}`, {
        method: 'PATCH',
        body: { status: edit.status, categories: edit.categories.split(',').map(c => c.trim()).filter(Boolean), siteIds: edit.siteIds, reason: edit.reason },
      });
      setEditing(false);
      await reload();
    } catch (err) {
      setSaveError((err as Error).message);
    }
  };

  return (
    <div>
      <BackLink onClick={onBack}>Providers</BackLink>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{data.tradeName ?? data.legalName}</h1>
        {pill(data.status)}
        {reference(data.providerCode)}
      </div>
      <Section title="Relationship" actions={can(user, 'SERVICE_MANAGE') && !editing && <button type="button" style={buttonStyle()} onClick={() => setEditing(true)}>Edit</button>}>
        {data.isContractor && <Notice>This organization is also registered as a contractor company; it keeps one identity across both relationships.</Notice>}
        <KeyValues
          items={[
            ['Legal name', data.legalName],
            ['Internal owner', data.internalOwnerName],
            ['Agreement', data.agreementReference],
            [
              'Valid',
              data.effectiveFrom
                ? `${fmtDate(data.effectiveFrom)} → ${data.effectiveTo ? fmtDate(data.effectiveTo) : 'no end date'}`
                : data.effectiveTo
                  ? `Until ${fmtDate(data.effectiveTo)}`
                  : 'No validity period set',
            ],
            ['Approved categories', data.categories.map(label).join(', ')],
            ['Authorized sites', data.sites.map(s => s.name).join(', ') || 'None (cannot receive work)'],
          ]}
        />
        {editing && (
          <div style={{ marginTop: '12px', borderTop: `1px solid ${colors.slate[100]}`, paddingTop: '12px' }}>
            <ErrorNote error={saveError} />
            <FormGrid>
              <SelectField label="Status" value={edit.status} onChange={v => setEdit(x => ({ ...x, status: v }))} required options={['ACTIVE', 'SUSPENDED', 'INACTIVE', 'BLOCKED'].map(s => ({ value: s, label: label(s) }))} />
              <TextField label="Approved categories" value={edit.categories} onChange={v => setEdit(x => ({ ...x, categories: v }))} required />
              <TextField label="Reason for change (audited)" value={edit.reason} onChange={v => setEdit(x => ({ ...x, reason: v }))} required />
            </FormGrid>
            <div style={{ marginTop: '8px', fontSize: '13px' }}>
              {sites.map(s => (
                <label key={s.siteId} style={{ display: 'inline-flex', gap: '6px', marginRight: '16px' }}>
                  <input type="checkbox" checked={edit.siteIds.includes(s.siteId)} onChange={e => setEdit(x => ({ ...x, siteIds: e.target.checked ? [...x.siteIds, s.siteId] : x.siteIds.filter(i => i !== s.siteId) }))} />
                  {s.name}
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button type="button" style={buttonStyle('primary')} disabled={edit.reason.trim().length < 3} onClick={() => void save()}>Save changes</button>
              <button type="button" style={buttonStyle()} onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </div>
        )}
      </Section>
      <Section title="Technicians">
        {data.technicians.length === 0 && <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>No technicians registered.</p>}
        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
          {data.technicians.map(t => <li key={t.id}>{t.name}{t.certificationLevel ? ` · ${t.certificationLevel}` : ''} {pill(t.status)}</li>)}
        </ul>
        {can(user, 'SERVICE_MANAGE') && (
          <div style={{ marginTop: '12px' }}>
            <ErrorNote error={m.error} />
            <FormGrid>
              <TextField label="First name" value={tech.firstName} onChange={v => setTech(x => ({ ...x, firstName: v }))} maxLength={100} />
              <TextField label="Last name" value={tech.lastName} onChange={v => setTech(x => ({ ...x, lastName: v }))} maxLength={100} />
              <TextField label="Certification level" value={tech.certificationLevel} onChange={v => setTech(x => ({ ...x, certificationLevel: v }))} maxLength={64} />
            </FormGrid>
            <button
              type="button"
              style={{ ...buttonStyle('primary'), marginTop: '8px' }}
              disabled={m.busy || !tech.firstName.trim() || !tech.lastName.trim()}
              onClick={() =>
                void m
                  .run('/api/v1/service/technicians', { providerId: id, newPerson: { firstName: tech.firstName, lastName: tech.lastName }, certificationLevel: tech.certificationLevel || undefined }, { idempotent: true })
                  .then(async r => {
                    if (r) {
                      setTech({ firstName: '', lastName: '', certificationLevel: '' });
                      await reload();
                    }
                  })
              }
            >
              <Plus size={14} /> Add technician
            </button>
          </div>
        )}
      </Section>
      <Section title="Recent work orders">
        {data.recentWorkOrders.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>No work orders at your sites.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
            {data.recentWorkOrders.map(w => <li key={w.id}>{reference(w.referenceNumber)} {w.title} · {when(w.scheduledStart)} {pill(w.status)}</li>)}
          </ul>
        )}
      </Section>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Technicians
// ---------------------------------------------------------------------------

interface TechnicianRow {
  id: string;
  name: string;
  certificationLevel: string | null;
  status: string;
  providerName: string;
  isContractorWorker: boolean;
  upcomingAssignments: number;
}

export const TechniciansView: React.FC<{ user: SessionUser }> = () => {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const list = usePagedList<TechnicianRow>('/api/v1/service/technicians', { search: search.trim() || undefined });
  if (selected) return <TechnicianDetail id={selected} onBack={() => setSelected(null)} />;
  const columns: ColumnDef<TechnicianRow>[] = [
    { key: 'name', header: 'Technician', render: r => <strong>{r.name}</strong> },
    { key: 'providerName', header: 'Provider' },
    { key: 'certificationLevel', header: 'Certification' },
    { key: 'upcomingAssignments', header: 'Upcoming', align: 'right' },
    { key: 'isContractorWorker', header: 'Also contractor worker', render: r => (r.isContractorWorker ? 'Yes' : 'No') },
    { key: 'status', header: 'Status', render: r => pill(r.status) },
  ];
  return (
    <div>
      <PageHeader title="Technicians" subtitle="People working for service providers. Add technicians from the provider's profile." />
      <input aria-label="Search technicians" placeholder="Search name or badge" value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', maxWidth: '360px', padding: '7px 10px', fontSize: '13px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.md, marginBottom: '12px' }} />
      <PagedTable list={list} columns={columns} onRowClick={r => setSelected(r.id)} emptyTitle="No technicians" />
    </div>
  );
};

const TechnicianDetail: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const { data, error } = useApi<{
    name: string;
    providerName: string;
    certificationLevel: string | null;
    badgeId: string | null;
    status: string;
    effectiveTo: string | null;
    isContractorWorker: boolean;
    contractorVendorCode: string | null;
    assignments: Array<{ id: string; plannedStart: string; plannedEnd: string; status: string; workOrderReference: string; workOrderTitle: string; workOrderStatus: string; siteName: string }>;
  }>(`/api/v1/service/technicians/${id}`);
  if (!data) return <div><BackLink onClick={onBack}>Technicians</BackLink><ErrorNote error={error} /></div>;
  return (
    <div>
      <BackLink onClick={onBack}>Technicians</BackLink>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>{data.name}</h1>
        {pill(data.status)}
      </div>
      <Section title="Profile">
        {data.isContractorWorker && <Notice>This person also has a contractor-worker relationship (vendor {data.contractorVendorCode}). The two relationships are kept separate; the person record is shared.</Notice>}
        <KeyValues items={[['Provider', data.providerName], ['Certification', data.certificationLevel], ['Badge', data.badgeId], ['Relationship valid until', data.effectiveTo ? fmtDate(data.effectiveTo) : 'open']]} />
      </Section>
      <Section title="Assignments">
        {data.assignments.length === 0 ? (
          <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>No assignments at your sites.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px' }}>
            {data.assignments.map(a => (
              <li key={a.id}>
                {when(a.plannedStart)} · {reference(a.workOrderReference)} {a.workOrderTitle} · {a.siteName} {pill(a.workOrderStatus)}
                {a.status === 'CANCELLED' ? ' (unassigned)' : ''}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
};
