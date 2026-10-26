import React, { useState } from 'react';
import { Check, ShieldCheck, Users } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import { card, ErrorNote, PageHeader, useApi } from '../LiveViews.js';
import { Chip, groupPermissions, type RoleInfo } from './common.js';

/** Read-only catalog: what each role can do, how many people hold it, and whether the viewer may grant it. */
export const RolesView: React.FC = () => {
  const { data, error, loading } = useApi<{ items: RoleInfo[] }>('/api/v1/admin/roles');
  const [selected, setSelected] = useState<string | null>(null);
  const roles = data?.items ?? [];
  const current = roles.find(r => r.code === selected) ?? roles[0];

  return (
    <div>
      <PageHeader
        title="Roles and permissions"
        subtitle="What each role can see and do. Assign roles to people on the Users screen; every change is recorded in the audit log."
      />
      <ErrorNote error={error} />
      {loading && !data && <p style={{ fontSize: '14px', color: colors.slate[500] }}>Loading…</p>}
      {current && (
        <div className="vms-master-detail">
          <nav aria-label="Roles" style={{ ...card, padding: '6px', display: 'grid', gap: '2px', maxWidth: '100%' }}>
            {roles.map(r => {
              const active = r.code === current.code;
              return (
                <button
                  key={r.code}
                  type="button"
                  aria-current={active ? 'true' : undefined}
                  onClick={() => setSelected(r.code)}
                  className="vms-menu-row"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '9px 12px',
                    border: 'none',
                    borderRadius: radius.lg,
                    textAlign: 'left',
                    cursor: 'pointer',
                    font: 'inherit',
                    backgroundColor: active ? colors.primary[50] : 'transparent',
                    boxShadow: active ? `inset 3px 0 0 ${colors.primary[600]}` : 'none',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{ display: 'block', fontSize: '14px', fontWeight: active ? 600 : 500, color: active ? colors.primary[800] : colors.slate[800] }}
                    >
                      {r.name}
                    </span>
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      color: colors.slate[500],
                      fontVariantNumeric: 'tabular-nums',
                    }}
                    title={`${r.users} active user(s)`}
                  >
                    <Users size={12} aria-hidden="true" /> {r.users}
                  </span>
                </button>
              );
            })}
          </nav>
          <section style={{ ...card, padding: '20px 22px', minWidth: 0 }} aria-label={`${current.name} permissions`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', fontWeight: 650, color: colors.slate[900] }}>
                  <ShieldCheck size={18} color={colors.primary[600]} aria-hidden="true" /> {current.name}
                </h2>
                {current.description && <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.slate[500] }}>{current.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <Chip>{current.users} active user(s)</Chip>
                {current.assignable ? (
                  <Chip tone="primary">You can grant this role</Chip>
                ) : (
                  <Chip tone="warning">Only higher administrators grant this role</Chip>
                )}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(250px, 100%), 1fr))', gap: '18px 24px', marginTop: '20px' }}>
              {groupPermissions(current.permissions).map(g => (
                <div key={g.area}>
                  <h3 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 600, color: colors.slate[500] }}>{g.area}</h3>
                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
                    {g.items.map(([code, text]) => (
                      <li key={code} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: colors.slate[800] }} title={code}>
                        <Check size={15} color={colors.status.success.fg} style={{ flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
