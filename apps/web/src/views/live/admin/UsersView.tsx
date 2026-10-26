import React, { useEffect, useMemo, useState } from 'react';
import { Ban, KeyRound, Lock, LogOut, Pencil, Search, ShieldCheck, Unlock, UserCheck, UserPlus } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import type { ColumnDef } from '@vms/ui';
import type { SessionUser } from '../../../api/client.js';
import { buttonStyle, ErrorNote, fmt, inputStyle, PageHeader, StatusPill, useApi } from '../LiveViews.js';
import { BackLink, KeyValues, PagedTable, Section, usePagedList, useSites, type SiteOption } from '../service/shared.js';
import { describeAction, relativeTime, roleName } from '../activity.js';
import {
  Avatar,
  Chip,
  Dialog,
  DialogActions,
  ReasonDialog,
  ReasonField,
  TemporaryPasswordDialog,
  useSend,
  type RoleInfo,
  type UserDetailData,
  type UserRow,
} from './common.js';

const STATUSES = ['ACTIVE', 'SUSPENDED', 'INACTIVE'];

function useRoles() {
  const { data } = useApi<{ items: RoleInfo[] }>('/api/v1/admin/roles');
  return useMemo(() => {
    const map = new Map((data?.items ?? []).map(r => [r.code, r]));
    return { list: data?.items ?? [], name: (code: string) => map.get(code)?.name ?? roleName(code), get: (code: string) => map.get(code) };
  }, [data]);
}

type Roles = ReturnType<typeof useRoles>;

function siteNames(ids: string[], sites: SiteOption[]): string {
  if (ids.length === 0) return 'All sites';
  const names = ids.map(id => sites.find(s => s.siteId === id)?.name ?? 'Other site');
  return names.length > 1 ? `${names[0]} +${names.length - 1}` : names[0];
}

/** Users & access: who can sign in, with which roles and at which sites. */
export const UsersView: React.FC<{ user: SessionUser; startCreating?: boolean }> = ({ user, startCreating }) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(!!startCreating);
  const [created, setCreated] = useState<{ id: string; name: string; username: string; password: string } | null>(null);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [siteId, setSiteId] = useState('');
  const roles = useRoles();
  const sites = useSites();
  const list = usePagedList<UserRow>('/api/v1/admin/users', { search: search.trim() || undefined, role, status, siteId }, 25);

  if (selected) {
    return (
      <UserDetail
        id={selected}
        roles={roles}
        sites={sites}
        onBack={() => {
          setSelected(null);
          void list.reload();
        }}
      />
    );
  }

  const columns: ColumnDef<UserRow>[] = [
    {
      key: 'fullName',
      header: 'Name',
      render: r => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '200px' }}>
          <Avatar name={r.fullName} muted={r.status !== 'ACTIVE'} size={34} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: colors.slate[900] }}>
              {r.fullName}
              {r.isSelf && <Chip tone="primary">You</Chip>}
            </div>
            <div style={{ fontSize: '12px', color: colors.slate[500], maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.email}>
              {r.username} · {r.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      render: r => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '250px' }}>
          {r.roles.length ? r.roles.map(code => <Chip key={code}>{roles.name(code)}</Chip>) : <span style={{ color: colors.slate[400] }}>No role</span>}
        </div>
      ),
    },
    {
      key: 'siteIds',
      header: 'Sites',
      render: r => (
        <span
          title={r.siteIds.map(id => sites.find(s => s.siteId === id)?.name ?? '').filter(Boolean).join('\n') || undefined}
          style={{ display: 'block', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.slate[600] }}
        >
          {siteNames(r.siteIds, sites)}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last sign-in',
      render: r => <span style={{ whiteSpace: 'nowrap', color: colors.slate[600] }}>{r.lastLoginAt ? relativeTime(r.lastLoginAt) : 'Never'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: r => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <StatusPill status={r.status} />
          {r.locked && (
            <Chip tone="danger">
              <Lock size={11} /> Locked
            </Chip>
          )}
          {r.mustChangePassword && r.status === 'ACTIVE' && <Chip tone="warning">New password due</Chip>}
        </div>
      ),
    },
  ];

  const selectStyle: React.CSSProperties = { ...inputStyle, width: 'auto', minWidth: '140px', flex: '1 1 160px' };
  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Everyone who can sign in. Roles decide what each person can see and do; site access decides where."
        meta={list.data ? <Chip>{list.data.total.toLocaleString()} total</Chip> : undefined}
        actions={
          <button type="button" style={buttonStyle('primary')} onClick={() => setCreating(true)}>
            <UserPlus size={15} /> Add user
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
            aria-label="Search users"
            placeholder="Search name, username or email"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: '34px' }}
          />
        </div>
        <select aria-label="Role" value={role} onChange={e => setRole(e.target.value)} style={selectStyle}>
          <option value="">All roles</option>
          {roles.list.map(r => (
            <option key={r.code} value={r.code}>
              {r.name}
            </option>
          ))}
        </select>
        <select aria-label="Status" value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}>
          <option value="">All statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>
              {roleName(s)}
            </option>
          ))}
        </select>
        {sites.length > 1 && (
          <select aria-label="Site" value={siteId} onChange={e => setSiteId(e.target.value)} style={selectStyle}>
            <option value="">All sites</option>
            {sites.map(s => (
              <option key={s.siteId} value={s.siteId}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <PagedTable list={list} columns={columns} onRowClick={r => setSelected(r.id)} emptyTitle="No users match these filters" />
      <p style={{ margin: '10px 2px 0', fontSize: '12px', color: colors.slate[500] }}>
        {user.roles.includes('SUPER_ADMIN') || user.role === 'SUPER_ADMIN' || user.role === 'ORGANIZATION_ADMIN'
          ? 'You administer every site in the organization.'
          : 'You see people with access to your sites, and manage those whose access is entirely within your sites.'}
      </p>

      {creating && (
        <CreateUserDialog
          roles={roles}
          sites={sites}
          onClose={() => setCreating(false)}
          onCreated={c => {
            setCreating(false);
            setCreated(c);
            void list.reload();
          }}
        />
      )}
      {created && (
        <TemporaryPasswordDialog
          title="User created"
          name={created.name}
          username={created.username}
          password={created.password}
          onClose={() => {
            const id = created.id;
            setCreated(null);
            setSelected(id);
          }}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pickers
// ---------------------------------------------------------------------------

const checkboxRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '9px 12px',
  borderBottom: `1px solid ${colors.slate[100]}`,
  cursor: 'pointer',
};

const RolePicker: React.FC<{ roles: Roles; value: string[]; onChange: (v: string[]) => void; allowed: (code: string) => boolean }> = ({
  roles,
  value,
  onChange,
  allowed,
}) => (
  <fieldset style={{ border: `1px solid ${colors.slate[200]}`, borderRadius: radius.lg, padding: 0, margin: 0, maxHeight: '260px', overflowY: 'auto' }}>
    <legend className="sr-only">Roles</legend>
    {roles.list.map(r => {
      const can = allowed(r.code);
      const checked = value.includes(r.code);
      return (
        <label
          key={r.code}
          style={{ ...checkboxRow, cursor: can ? 'pointer' : 'not-allowed', opacity: can ? 1 : 0.55 }}
          title={can ? undefined : 'Your role cannot grant or remove this role'}
        >
          <input
            type="checkbox"
            checked={checked}
            disabled={!can}
            onChange={e => onChange(e.target.checked ? [...value, r.code] : value.filter(c => c !== r.code))}
            style={{ marginTop: '3px', accentColor: colors.primary[600] }}
          />
          <span style={{ display: 'grid', gap: '1px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: colors.slate[900] }}>{r.name}</span>
            {r.description && <span style={{ fontSize: '12px', color: colors.slate[500] }}>{r.description}</span>}
          </span>
        </label>
      );
    })}
  </fieldset>
);

const SitePicker: React.FC<{
  sites: SiteOption[];
  value: string[];
  onChange: (v: string[]) => void;
  defaultSiteId: string;
  onDefault: (id: string) => void;
}> = ({ sites, value, onChange, defaultSiteId, onDefault }) => (
  <fieldset style={{ border: `1px solid ${colors.slate[200]}`, borderRadius: radius.lg, padding: 0, margin: 0, maxHeight: '220px', overflowY: 'auto' }}>
    <legend className="sr-only">Sites</legend>
    {sites.length === 0 && <div style={{ padding: '12px', fontSize: '13px', color: colors.slate[500] }}>No sites available.</div>}
    {sites.map(s => {
      const checked = value.includes(s.siteId);
      return (
        <div key={s.siteId} style={{ ...checkboxRow, alignItems: 'center', cursor: 'default' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, cursor: 'pointer', fontSize: '14px', color: colors.slate[900] }}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => {
                const next = e.target.checked ? [...value, s.siteId] : value.filter(id => id !== s.siteId);
                onChange(next);
                if (!next.includes(defaultSiteId)) onDefault(next[0] ?? '');
              }}
              style={{ accentColor: colors.primary[600] }}
            />
            {s.name}
          </label>
          {checked && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: colors.slate[600], cursor: 'pointer' }}>
              <input
                type="radio"
                name="default-site"
                checked={defaultSiteId === s.siteId}
                onChange={() => onDefault(s.siteId)}
                style={{ accentColor: colors.primary[600] }}
              />
              Default
            </label>
          )}
        </div>
      );
    })}
  </fieldset>
);

/** A single input with its visible label (the label element names the input for assistive technology). */
const FieldLabel: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label style={{ display: 'grid', gap: '6px' }}>
    <span style={{ fontSize: '13px', fontWeight: 600, color: colors.slate[700] }}>{label}</span>
    {children}
    {hint && <span style={{ fontSize: '12px', color: colors.slate[500] }}>{hint}</span>}
  </label>
);

/** A group of checkboxes under a visible heading. */
const FieldGroup: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div role="group" aria-label={label} style={{ display: 'grid', gap: '6px' }}>
    <span aria-hidden="true" style={{ fontSize: '13px', fontWeight: 600, color: colors.slate[700] }}>
      {label}
    </span>
    {children}
    {hint && <span style={{ fontSize: '12px', color: colors.slate[500] }}>{hint}</span>}
  </div>
);

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

const CreateUserDialog: React.FC<{
  roles: Roles;
  sites: SiteOption[];
  onClose: () => void;
  onCreated: (c: { id: string; name: string; username: string; password: string }) => void;
}> = ({ roles, sites, onClose, onCreated }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [siteIds, setSiteIds] = useState<string[]>([]);
  const [defaultSiteId, setDefaultSiteId] = useState('');
  const { send, busy, error } = useSend();

  // Suggest a username from the name until the administrator types one.
  useEffect(() => {
    if (usernameTouched) return;
    const parts = fullName
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    setUsername(parts.length > 1 ? `${parts[0]}.${parts[parts.length - 1]}` : (parts[0] ?? ''));
  }, [fullName, usernameTouched]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await send<{ id: string; temporaryPassword: string }>('POST', '/api/v1/admin/users', {
      fullName: fullName.trim(),
      username: username.trim(),
      email: email.trim(),
      roles: picked,
      siteIds,
      defaultSiteId: defaultSiteId || undefined,
    });
    if (result) onCreated({ id: result.id, name: fullName.trim(), username: username.trim().toLowerCase(), password: result.temporaryPassword });
  };

  const ready = fullName.trim().length >= 2 && username.trim().length >= 3 && email.includes('@') && picked.length > 0;
  return (
    <Dialog
      title="Add user"
      onClose={onClose}
      width={620}
      icon={<UserPlus size={20} />}
      description="The new user gets a temporary password and must choose their own at first sign-in."
    >
      <form onSubmit={e => void submit(e)} style={{ display: 'grid', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))', gap: '14px' }}>
          <FieldLabel label="Full name">
            <input required value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} autoComplete="off" maxLength={255} />
          </FieldLabel>
          <FieldLabel label="Work email">
            <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} autoComplete="off" maxLength={255} />
          </FieldLabel>
          <FieldLabel label="Username" hint="Lowercase letters, digits, dots, dashes or underscores.">
            <input
              required
              value={username}
              onChange={e => {
                setUsernameTouched(true);
                setUsername(e.target.value.toLowerCase());
              }}
              pattern="[a-z0-9][a-z0-9._\-]{2,63}"
              style={{ ...inputStyle, fontFamily: 'JetBrains Mono, ui-monospace, monospace' }}
              autoComplete="off"
            />
          </FieldLabel>
        </div>
        <FieldGroup label="Roles" hint="Only roles you are allowed to grant can be selected.">
          <RolePicker roles={roles} value={picked} onChange={setPicked} allowed={code => !!roles.get(code)?.assignable} />
        </FieldGroup>
        <FieldGroup label="Site access" hint="Leave empty only for organization-wide roles. The default site opens first after sign-in.">
          <SitePicker sites={sites} value={siteIds} onChange={setSiteIds} defaultSiteId={defaultSiteId} onDefault={setDefaultSiteId} />
        </FieldGroup>
        <ErrorNote error={error} />
        <DialogActions>
          <button type="button" style={buttonStyle()} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" disabled={busy || !ready} style={{ ...buttonStyle('primary'), opacity: busy || !ready ? 0.6 : 1 }}>
            {busy ? 'Creating…' : 'Create user'}
          </button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

type PendingAction =
  | { kind: 'reset' }
  | { kind: 'unlock' }
  | { kind: 'revoke' }
  | { kind: 'status'; status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' }
  | { kind: 'profile' }
  | { kind: 'roles' }
  | { kind: 'sites' };

const UserDetail: React.FC<{ id: string; roles: Roles; sites: SiteOption[]; onBack: () => void }> = ({ id, roles, sites, onBack }) => {
  const { data: u, error, loading, reload } = useApi<UserDetailData>(`/api/v1/admin/users/${id}`);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const { send, busy, error: sendError, setError } = useSend();

  const close = () => {
    setPending(null);
    setError(null);
  };
  const done = () => {
    close();
    void reload();
  };

  if (!u) {
    return (
      <div>
        <BackLink onClick={onBack}>All users</BackLink>
        <ErrorNote error={error} />
        {loading && <p style={{ fontSize: '14px', color: colors.slate[500] }}>Loading…</p>}
      </div>
    );
  }

  const manage = u.canManage;
  const actionButton = (label: string, icon: React.ReactNode, action: PendingAction, danger = false) => (
    <button type="button" style={buttonStyle(danger ? 'danger' : 'secondary')} onClick={() => setPending(action)}>
      {icon} {label}
    </button>
  );

  return (
    <div>
      <BackLink onClick={onBack}>All users</BackLink>
      <header style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <Avatar name={u.fullName} size={52} muted={u.status !== 'ACTIVE'} />
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: '22px', lineHeight: '30px', fontWeight: 700, color: colors.slate[900] }}>{u.fullName}</h1>
              <StatusPill status={u.status} />
              {u.locked && (
                <Chip tone="danger">
                  <Lock size={11} /> Locked
                </Chip>
              )}
              {u.isSelf && <Chip tone="primary">You</Chip>}
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '14px', color: colors.slate[500] }}>
              <span style={{ fontFamily: 'JetBrains Mono, ui-monospace, monospace', fontSize: '13px' }}>{u.username}</span> · {u.email}
            </p>
          </div>
        </div>
        {manage && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {u.locked && actionButton('Unlock', <Unlock size={15} />, { kind: 'unlock' })}
            {actionButton('Reset password', <KeyRound size={15} />, { kind: 'reset' })}
            {u.activeSessions > 0 && actionButton('Sign out everywhere', <LogOut size={15} />, { kind: 'revoke' })}
            {u.status === 'ACTIVE' ? (
              <>
                {actionButton('Suspend', <Ban size={15} />, { kind: 'status', status: 'SUSPENDED' }, true)}
                {actionButton('Deactivate', <Ban size={15} />, { kind: 'status', status: 'INACTIVE' }, true)}
              </>
            ) : (
              actionButton('Reactivate', <UserCheck size={15} />, { kind: 'status', status: 'ACTIVE' })
            )}
          </div>
        )}
      </header>

      {!manage && (
        <div
          role="note"
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'flex-start',
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: radius.lg,
            border: `1px solid ${colors.slate[200]}`,
            backgroundColor: colors.slate[50],
            fontSize: '13px',
            color: colors.slate[600],
          }}
        >
          <ShieldCheck size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
          {u.isSelf
            ? 'This is your own account. To protect against mistakes, another administrator has to change your roles, sites or status. You can change your password from the account menu.'
            : 'You can view this user, but they hold roles or site access beyond what your role may administer.'}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(420px, 100%), 1fr))', gap: '0 20px', alignItems: 'start' }}>
        <div>
          <Section title="Roles" actions={manage && <EditButton onClick={() => setPending({ kind: 'roles' })} />}>
            {u.roles.length === 0 ? (
              <p style={{ margin: 0, fontSize: '14px', color: colors.slate[500] }}>No role. The user has basic host access only.</p>
            ) : (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
                {u.roles.map(code => (
                  <li key={code} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <ShieldCheck size={16} color={colors.primary[600]} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: colors.slate[900] }}>{roles.name(code)}</div>
                      <div style={{ fontSize: '13px', color: colors.slate[500] }}>{roles.get(code)?.description ?? ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Site access" actions={manage && <EditButton onClick={() => setPending({ kind: 'sites' })} />}>
            {u.siteIds.length === 0 ? (
              <p style={{ margin: 0, fontSize: '14px', color: colors.slate[500] }}>
                No specific sites. Organization-wide roles reach every site; other roles reach none.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {u.siteIds.map(sid => (
                  <Chip key={sid} tone={sid === u.defaultSiteId ? 'primary' : 'neutral'}>
                    {sites.find(s => s.siteId === sid)?.name ?? 'Site outside your scope'}
                    {sid === u.defaultSiteId ? ' · default' : ''}
                  </Chip>
                ))}
              </div>
            )}
          </Section>
          <Section title="Profile" actions={manage && <EditButton onClick={() => setPending({ kind: 'profile' })} />}>
            <KeyValues
              items={[
                ['Full name', u.fullName],
                ['Email', u.email],
                ['Username', u.username],
                ['Status', roleName(u.status)],
              ]}
            />
          </Section>
        </div>
        <div>
          <Section title="Sign-in and security">
            <KeyValues
              items={[
                ['Last sign-in', u.lastLoginAt ? fmt(u.lastLoginAt) : 'Never'],
                ['Password last set', u.passwordChangedAt ? fmt(u.passwordChangedAt) : '—'],
                ['Password', !u.hasPassword ? 'Not set' : u.mustChangePassword ? 'Temporary; must be changed at next sign-in' : 'Chosen by the user'],
                ['Failed attempts', String(u.failedAttempts)],
                ['Active sessions', String(u.activeSessions)],
                ['Account', u.locked ? 'Locked after failed sign-ins' : 'Not locked'],
              ]}
            />
          </Section>
          <Section title="History">
            {u.history.length === 0 ? (
              <p style={{ margin: 0, fontSize: '14px', color: colors.slate[500] }}>No administrative changes yet.</p>
            ) : (
              <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {u.history.map((h, i) => (
                  <li key={i} style={{ padding: '9px 0', borderTop: i ? `1px solid ${colors.slate[100]}` : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '14px' }}>
                      <span style={{ fontWeight: 600, color: colors.slate[900] }}>{describeAction(h.action)}</span>
                      <span style={{ fontSize: '12px', color: colors.slate[500], whiteSpace: 'nowrap' }} title={fmt(h.timestamp)}>
                        {relativeTime(h.timestamp)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: colors.slate[500] }}>
                      By {roleName(h.actorRole)}
                      {h.reason ? ` · “${h.reason}”` : ''}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
      </div>

      {pending?.kind === 'reset' && (
        <ReasonDialog
          title="Reset password?"
          description={`${u.fullName} will be signed out everywhere and must sign in with a new temporary password, then choose their own.`}
          confirmLabel="Reset password"
          busy={busy}
          error={sendError}
          onClose={close}
          onConfirm={async reason => {
            const r = await send<{ temporaryPassword: string }>('POST', `/api/v1/admin/users/${u.id}/reset-password`, { reason });
            if (r) {
              done();
              setPassword(r.temporaryPassword);
            }
          }}
        />
      )}
      {pending?.kind === 'unlock' && (
        <ReasonDialog
          title="Unlock account?"
          description={`${u.fullName} can try to sign in again straight away. Their password does not change.`}
          confirmLabel="Unlock"
          busy={busy}
          error={sendError}
          onClose={close}
          onConfirm={async reason => (await send('POST', `/api/v1/admin/users/${u.id}/unlock`, { reason })) && done()}
        />
      )}
      {pending?.kind === 'revoke' && (
        <ReasonDialog
          title="Sign out everywhere?"
          description={`Ends all ${u.activeSessions} active session(s). ${u.fullName} can sign in again with their password.`}
          confirmLabel="Sign out everywhere"
          busy={busy}
          error={sendError}
          onClose={close}
          onConfirm={async reason => (await send('POST', `/api/v1/admin/users/${u.id}/revoke-sessions`, { reason })) && done()}
        />
      )}
      {pending?.kind === 'status' && (
        <ReasonDialog
          title={pending.status === 'ACTIVE' ? 'Reactivate user?' : pending.status === 'SUSPENDED' ? 'Suspend user?' : 'Deactivate user?'}
          description={
            pending.status === 'ACTIVE'
              ? `${u.fullName} will be able to sign in again with their existing roles and sites.`
              : pending.status === 'SUSPENDED'
                ? `${u.fullName} is signed out at once and cannot sign in until reactivated. Use this for a temporary block.`
                : `${u.fullName} is signed out at once and the account is closed. Their history stays in the audit log.`
          }
          confirmLabel={pending.status === 'ACTIVE' ? 'Reactivate' : pending.status === 'SUSPENDED' ? 'Suspend' : 'Deactivate'}
          danger={pending.status !== 'ACTIVE'}
          busy={busy}
          error={sendError}
          onClose={close}
          onConfirm={async reason => (await send('PATCH', `/api/v1/admin/users/${u.id}`, { status: pending.status, reason })) && done()}
        />
      )}
      {pending?.kind === 'profile' && (
        <ProfileDialog
          user={u}
          busy={busy}
          error={sendError}
          onClose={close}
          onSave={async body => (await send('PATCH', `/api/v1/admin/users/${u.id}`, body)) && done()}
        />
      )}
      {pending?.kind === 'roles' && (
        <RolesDialog
          user={u}
          roles={roles}
          busy={busy}
          error={sendError}
          onClose={close}
          onSave={async body => (await send('PUT', `/api/v1/admin/users/${u.id}/roles`, body)) && done()}
        />
      )}
      {pending?.kind === 'sites' && (
        <SitesDialog
          user={u}
          sites={sites}
          busy={busy}
          error={sendError}
          onClose={close}
          onSave={async body => (await send('PUT', `/api/v1/admin/users/${u.id}/sites`, body)) && done()}
        />
      )}
      {password && (
        <TemporaryPasswordDialog title="Password reset" name={u.fullName} username={u.username} password={password} onClose={() => setPassword(null)} />
      )}
    </div>
  );
};

const EditButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button type="button" onClick={onClick} style={{ ...buttonStyle(), minHeight: '30px', padding: '0 10px' }}>
    <Pencil size={13} /> Edit
  </button>
);

type SaveProps<T> = { busy: boolean; error: string | null; onClose: () => void; onSave: (body: T) => void };

const ProfileDialog: React.FC<{ user: UserDetailData } & SaveProps<{ fullName?: string; email?: string; reason: string }>> = ({
  user,
  busy,
  error,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [reason, setReason] = useState('');
  const changed = fullName.trim() !== user.fullName || email.trim().toLowerCase() !== user.email;
  return (
    <Dialog title="Edit profile" onClose={onClose}>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSave({
            fullName: fullName.trim() !== user.fullName ? fullName.trim() : undefined,
            email: email.trim().toLowerCase() !== user.email ? email.trim() : undefined,
            reason: reason.trim(),
          });
        }}
        style={{ display: 'grid', gap: '14px' }}
      >
        <FieldLabel label="Full name">
          <input required value={fullName} onChange={e => setFullName(e.target.value)} style={inputStyle} maxLength={255} />
        </FieldLabel>
        <FieldLabel label="Work email">
          <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} maxLength={255} />
        </FieldLabel>
        <ReasonField value={reason} onChange={setReason} />
        <ErrorNote error={error} />
        <SaveActions busy={busy} disabled={!changed || reason.trim().length < 3} onClose={onClose} />
      </form>
    </Dialog>
  );
};

const RolesDialog: React.FC<{ user: UserDetailData; roles: Roles } & SaveProps<{ roles: string[]; reason: string }>> = ({
  user,
  roles,
  busy,
  error,
  onClose,
  onSave,
}) => {
  const [picked, setPicked] = useState<string[]>(user.roles);
  const [reason, setReason] = useState('');
  const changed = picked.length !== user.roles.length || picked.some(r => !user.roles.includes(r));
  return (
    <Dialog
      title={`Roles for ${user.fullName}`}
      onClose={onClose}
      width={560}
      description="Changes apply at the user's next request. Greyed-out roles are outside what you may grant."
    >
      <form
        onSubmit={e => {
          e.preventDefault();
          onSave({ roles: picked, reason: reason.trim() });
        }}
        style={{ display: 'grid', gap: '14px' }}
      >
        <RolePicker roles={roles} value={picked} onChange={setPicked} allowed={code => user.assignableRoles.includes(code)} />
        {picked.length === 0 && (
          <p style={{ margin: 0, fontSize: '13px', color: colors.status.warning.fg }}>
            Keep at least one role. To remove all access, deactivate the user instead.
          </p>
        )}
        <ReasonField value={reason} onChange={setReason} />
        <ErrorNote error={error} />
        <SaveActions busy={busy} disabled={!changed || picked.length === 0 || reason.trim().length < 3} onClose={onClose} />
      </form>
    </Dialog>
  );
};

const SitesDialog: React.FC<{ user: UserDetailData; sites: SiteOption[] } & SaveProps<{ siteIds: string[]; defaultSiteId?: string; reason: string }>> = ({
  user,
  sites,
  busy,
  error,
  onClose,
  onSave,
}) => {
  // Sites outside the administrator's own list stay as they are (the server refuses to change them).
  const visible = new Set(sites.map(s => s.siteId));
  const hidden = user.siteIds.filter(s => !visible.has(s));
  const [picked, setPicked] = useState<string[]>(user.siteIds.filter(s => visible.has(s)));
  const [defaultSiteId, setDefaultSiteId] = useState(user.defaultSiteId ?? '');
  const [reason, setReason] = useState('');
  const next = [...hidden, ...picked];
  const changed = next.length !== user.siteIds.length || next.some(s => !user.siteIds.includes(s)) || (defaultSiteId || null) !== user.defaultSiteId;
  return (
    <Dialog title={`Site access for ${user.fullName}`} onClose={onClose} width={560}>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSave({ siteIds: next, defaultSiteId: defaultSiteId || undefined, reason: reason.trim() });
        }}
        style={{ display: 'grid', gap: '14px' }}
      >
        <SitePicker sites={sites} value={picked} onChange={setPicked} defaultSiteId={defaultSiteId} onDefault={setDefaultSiteId} />
        {hidden.length > 0 && (
          <p style={{ margin: 0, fontSize: '12px', color: colors.slate[500] }}>
            Also has access to {hidden.length} site(s) you do not administer; those stay unchanged.
          </p>
        )}
        <ReasonField value={reason} onChange={setReason} />
        <ErrorNote error={error} />
        <SaveActions busy={busy} disabled={!changed || reason.trim().length < 3} onClose={onClose} />
      </form>
    </Dialog>
  );
};

const SaveActions: React.FC<{ busy: boolean; disabled: boolean; onClose: () => void }> = ({ busy, disabled, onClose }) => (
  <DialogActions>
    <button type="button" style={buttonStyle()} onClick={onClose}>
      Cancel
    </button>
    <button type="submit" disabled={busy || disabled} style={{ ...buttonStyle('primary'), opacity: busy || disabled ? 0.6 : 1 }}>
      {busy ? 'Saving…' : 'Save changes'}
    </button>
  </DialogActions>
);
