import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DataTable, Pagination, type ColumnDef } from '@vms/ui';
import { colors, radius } from '@vms/ui/tokens';
import { apiRequest, type SessionUser } from '../../../api/client.js';
import { buttonStyle, card, describeError, ErrorNote, Field, fmt, inputStyle, StatusPill } from '../LiveViews.js';

export { buttonStyle, card, describeError, ErrorNote, Field, fmt, inputStyle, StatusPill };

export const can = (user: SessionUser, permission: string) => user.permissions.includes(permission);

export const label = (value: string | null | undefined) =>
  value ? value.toLowerCase().replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()) : '—';

export const SERVICE_TYPES = [
  'PLANNED_SERVICE',
  'PREVENTIVE_MAINTENANCE',
  'CORRECTIVE_MAINTENANCE',
  'BREAKDOWN_RESPONSE',
  'INSPECTION',
  'TESTING',
  'CALIBRATION',
  'INSTALLATION',
  'REPAIR',
  'RECURRING_SERVICE',
  'EMERGENCY_SERVICE',
  'OTHER',
];
export const PRIORITIES = ['LOW', 'STANDARD', 'HIGH', 'CRITICAL'];

/** Server-side paged list: page/filters drive the query string; the server does filtering and paging. */
export function usePagedList<T>(basePath: string, filters: Record<string, string | undefined>, pageSize = 25) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: T[]; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const filterKey = JSON.stringify(filters);

  useEffect(() => setPage(1), [filterKey]);

  const path = useMemo(() => {
    const params = new URLSearchParams({ limit: String(pageSize), offset: String((page - 1) * pageSize) });
    for (const [k, v] of Object.entries(filters)) if (v) params.set(k, v);
    return `${basePath}?${params.toString()}`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePath, filterKey, page, pageSize]);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiRequest<{ items: T[]; total: number }>(path));
    } catch (err) {
      setError(describeError(err));
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, page, setPage, pageSize };
}

export function PagedTable<T>({
  list,
  columns,
  onRowClick,
  emptyTitle,
}: {
  list: ReturnType<typeof usePagedList<T>>;
  columns: ColumnDef<T>[];
  onRowClick?: (row: T) => void;
  emptyTitle: string;
}) {
  return (
    <div style={{ ...card, overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        {/* Row interfaces have no index signature, so they are widened for the shared table's generic. */}
        <DataTable<Record<string, unknown>>
          data={(list.data?.items ?? []) as unknown as Record<string, unknown>[]}
          columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
          isLoading={list.loading && !list.data}
          isError={!!list.error}
          errorMessage={list.error ?? undefined}
          onRetry={() => void list.reload()}
          emptyTitle={emptyTitle}
          onRowClick={onRowClick ? row => onRowClick(row as unknown as T) : undefined}
          keyExtractor={row => String(row['id'])}
        />
      </div>
      {list.data && list.data.total > list.pageSize && (
        <div style={{ borderTop: `1px solid ${colors.slate[100]}`, padding: '8px 12px' }}>
          <Pagination currentPage={list.page} totalRecords={list.data.total} pageSize={list.pageSize} onPageChange={list.setPage} />
        </div>
      )}
    </div>
  );
}

export const Section: React.FC<{ title: string; actions?: React.ReactNode; children: React.ReactNode; note?: string }> = ({ title, actions, children, note }) => (
  <section style={{ ...card, padding: '16px', marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
      <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: colors.slate[900] }}>{title}</h2>
      {actions && <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
    {note && <p style={{ margin: '0 0 10px', fontSize: '12px', color: colors.slate[500] }}>{note}</p>}
    {children}
  </section>
);

export const KeyValues: React.FC<{ items: Array<[string, React.ReactNode]> }> = ({ items }) => (
  <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px 16px', margin: 0 }}>
    {items.map(([k, v]) => (
      <div key={k}>
        <dt style={{ fontSize: '11px', fontWeight: 600, color: colors.slate[500], textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k}</dt>
        <dd style={{ margin: '2px 0 0', fontSize: '13px', color: colors.slate[900], wordBreak: 'break-word' }}>{v ?? '—'}</dd>
      </div>
    ))}
  </dl>
);

export const Notice: React.FC<{ tone?: 'info' | 'warning'; children: React.ReactNode }> = ({ tone = 'info', children }) => {
  const t = colors.status[tone];
  return (
    <div role="note" style={{ fontSize: '12px', color: t.fg, backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: radius.md, padding: '8px 12px', marginBottom: '10px' }}>
      {children}
    </div>
  );
};

export const Tabs: React.FC<{ tabs: string[]; active: string; onChange: (t: string) => void }> = ({ tabs, active, onChange }) => (
  <div role="tablist" style={{ display: 'flex', gap: '4px', borderBottom: `1px solid ${colors.slate[200]}`, marginBottom: '12px', overflowX: 'auto' }}>
    {tabs.map(t => (
      <button
        key={t}
        role="tab"
        aria-selected={t === active}
        type="button"
        onClick={() => onChange(t)}
        style={{
          padding: '8px 12px',
          fontSize: '13px',
          fontWeight: t === active ? 700 : 500,
          color: t === active ? colors.primary[700] : colors.slate[600],
          border: 'none',
          borderBottom: `2px solid ${t === active ? colors.primary[600] : 'transparent'}`,
          background: 'none',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
        }}
      >
        {t}
      </button>
    ))}
  </div>
);

export const BackLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button type="button" onClick={onClick} style={{ ...buttonStyle(), marginBottom: '12px' }}>
    ← {children}
  </button>
);

/** Submits a mutation once; retries of the same attempt reuse its idempotency key. */
export function useMutation() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(() => crypto.randomUUID());
  const run = useCallback(
    async <T,>(path: string, body: unknown, opts: { idempotent?: boolean } = {}): Promise<T | null> => {
      setBusy(true);
      setError(null);
      try {
        const result = await apiRequest<T>(path, { method: 'POST', body, idempotencyKey: opts.idempotent ? key : undefined });
        setKey(crypto.randomUUID());
        return result;
      } catch (err) {
        setError(describeError(err));
        return null;
      } finally {
        setBusy(false);
      }
    },
    [key]
  );
  return { run, busy, error, setError };
}

export const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  required?: boolean;
}> = ({ label: l, value, onChange, options, placeholder, required }) => (
  <Field label={l}>
    <select style={inputStyle} value={value} onChange={e => onChange(e.target.value)} required={required}>
      <option value="">{placeholder ?? (required ? 'Select…' : 'Any / not specified')}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </Field>
);

export const TextField: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  maxLength?: number;
  multiline?: boolean;
  placeholder?: string;
}> = ({ label: l, value, onChange, required, type = 'text', maxLength, multiline, placeholder }) => (
  <Field label={l}>
    {multiline ? (
      <textarea style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' }} value={value} onChange={e => onChange(e.target.value)} required={required} maxLength={maxLength} placeholder={placeholder} />
    ) : (
      <input type={type} style={inputStyle} value={value} onChange={e => onChange(e.target.value)} required={required} maxLength={maxLength} placeholder={placeholder} />
    )}
  </Field>
);

export const FormGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>{children}</div>
);

export interface SiteOption {
  siteId: string;
  name: string;
}

export function useSites() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  useEffect(() => {
    apiRequest<{ items: SiteOption[] }>('/api/v1/sites').then(r => setSites(r.items)).catch(() => setSites([]));
  }, []);
  return sites;
}

export const reference = (v: string) => <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>{v}</span>;
export const pill = (v: string | null | undefined) => <StatusPill status={v} />;
export const when = (v: string | null | undefined) => <span style={{ whiteSpace: 'nowrap' }}>{fmt(v)}</span>;
