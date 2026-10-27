import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Search } from 'lucide-react';
import { colors } from '@vms/ui/tokens';
import type { ColumnDef } from '@vms/ui';
import { buttonStyle, fmt, inputStyle, PageHeader } from '../LiveViews.js';
import { PagedTable, usePagedList } from '../service/shared.js';
import { actionTone, describeAction, roleName } from '../activity.js';
import { Chip } from './common.js';

interface AuditRow {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  requestId: string | null;
  reason: string | null;
}

const ENTITY_TYPES = [
  'TENANT',
  'USER',
  'USER_SESSION',
  'VISITOR_TRANSACTION',
  'SERVICE_REQUEST',
  'SERVICE_WORK_ORDER',
  'SERVICE_SCHEDULE',
  'SERVICE_PROVIDER',
  'SERVICE_TECHNICIAN',
];
/** Record types in the words the console uses (an organization is a tenant in the database). */
const recordName = (type: string) => (type === 'TENANT' ? 'Organization' : roleName(type));

const ACTIONS = [
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'PASSWORD_CHANGED',
  'USER_CREATED',
  'USER_ROLES_CHANGED',
  'USER_SITES_CHANGED',
  'USER_PASSWORD_RESET',
  'USER_UNLOCKED',
  'USER_SUSPENDED',
  'USER_INACTIVE',
  'MFA_ENABLED',
  'MFA_DISABLED',
  'USER_MFA_RESET',
  'SECURITY_SETTINGS_CHANGED',
  'REFRESH_TOKEN_REUSE',
  'VISITOR_APPROVED',
  'VISITOR_CHECKED_IN',
  'VISITOR_CHECKED_OUT',
];

/** Append-only audit log: who did what, when, and why. */
export const AuditLogView: React.FC = () => {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');
  const list = usePagedList<AuditRow>('/api/v1/audit-logs', { search: search.trim() || undefined, action, entityType }, 50);

  const columns: ColumnDef<AuditRow>[] = [
    {
      key: 'timestamp',
      header: 'When',
      render: r => <span style={{ whiteSpace: 'nowrap', color: colors.slate[600], fontVariantNumeric: 'tabular-nums' }}>{fmt(r.timestamp)}</span>,
    },
    {
      key: 'actorName',
      header: 'Who',
      render: r => (
        <div style={{ minWidth: '150px' }}>
          <div style={{ fontWeight: 600, color: colors.slate[900] }}>{r.actorName ?? (r.actorId === 'anonymous' ? 'Unknown user' : 'System')}</div>
          <div style={{ fontSize: '12px', color: colors.slate[500] }}>{roleName(r.actorRole)}</div>
        </div>
      ),
    },
    {
      key: 'action',
      header: 'What',
      render: r => {
        const tone = actionTone(r.action);
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 500,
              color: tone === 'danger' ? colors.status.danger.fg : colors.slate[800],
            }}
            title={r.action}
          >
            {tone === 'danger' && <AlertTriangle size={14} aria-hidden="true" />}
            {describeAction(r.action)}
          </span>
        );
      },
    },
    {
      key: 'entityType',
      header: 'Record',
      render: r => (
        <div>
          <div style={{ color: colors.slate[700] }}>{recordName(r.entityType)}</div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, ui-monospace, monospace',
              fontSize: '11px',
              color: colors.slate[400],
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={r.entityId}
          >
            {r.entityId}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: r => (r.reason ? <span style={{ color: colors.slate[700] }}>{r.reason}</span> : <span style={{ color: colors.slate[300] }}>—</span>),
    },
  ];

  const selectStyle: React.CSSProperties = { ...inputStyle, width: 'auto', minWidth: '150px', flex: '1 1 180px' };
  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Every sign-in and every change, with who made it and why. Entries cannot be edited or deleted."
        meta={list.data ? <Chip>{list.data.total.toLocaleString()} entries</Chip> : undefined}
        actions={
          <button type="button" style={buttonStyle()} onClick={() => void list.reload()}>
            <RefreshCw size={15} style={list.loading ? { animation: 'spin 1s linear infinite' } : undefined} /> Refresh
          </button>
        }
      />
      <div role="search" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search
            size={15}
            color={colors.slate[400]}
            style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }}
            aria-hidden="true"
          />
          <input
            aria-label="Search the audit log"
            placeholder="Search person or record ID"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px' }}
          />
        </div>
        <select aria-label="Action" value={action} onChange={e => setAction(e.target.value)} style={selectStyle}>
          <option value="">All actions</option>
          {ACTIONS.map(a => (
            <option key={a} value={a}>
              {describeAction(a)}
            </option>
          ))}
        </select>
        <select aria-label="Record type" value={entityType} onChange={e => setEntityType(e.target.value)} style={selectStyle}>
          <option value="">All record types</option>
          {ENTITY_TYPES.map(t => (
            <option key={t} value={t}>
              {recordName(t)}
            </option>
          ))}
        </select>
      </div>
      <PagedTable list={list} columns={columns} emptyTitle="No audit entries match these filters" />
    </div>
  );
};
