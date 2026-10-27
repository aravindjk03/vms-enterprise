import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  DoorOpen,
  FileSearch,
  HardHat,
  RefreshCw,
  ShieldAlert,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import type { SessionUser } from '../../api/client.js';
import { buttonStyle, card, ErrorNote, fmt, StatusPill, useApi } from './LiveViews.js';
import { actionTone, describeAction, relativeTime, roleName } from './activity.js';

interface Summary {
  visitorsOnSite: number | null;
  visitorsToday: number | null;
  visitorApprovalsPending: number | null;
  contractorCompanies: number | null;
  openWorkOrders: number | null;
  openServiceWorkOrders: number | null;
  customerAccounts: number | null;
  upcomingCustomerVisits: number | null;
  materialMovementsToday: number | null;
  registeredVehicles: number | null;
  gateEventsToday: number | null;
}

interface Paged<T> {
  items: T[];
  total: number;
}

interface VisitRow {
  id: string;
  referenceNumber: string;
  status: string;
  visitorName: string;
  companyName: string | null;
  hostName: string | null;
  siteName: string;
  scheduledStart: string;
}

interface AuditRow {
  id: string;
  timestamp: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
}

const has = (user: SessionUser, permission: string) => user.permissions.includes(permission);

function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Home screen for a signed-in user. Everything on it is live and limited to what the role may see:
 * the server leaves out counts the role cannot read, and panels for other areas are not requested.
 */
export const LiveDashboard: React.FC<{
  user: SessionUser;
  navigate: (route: string) => void;
  canOpen: (route: string) => boolean;
}> = ({ user, navigate, canOpen }) => {
  const summary = useApi<Summary>('/api/v1/dashboard/summary');
  const visits = useApi<Paged<VisitRow>>(has(user, 'VISITOR_READ') ? '/api/v1/visitors?limit=6' : null);
  const exceptions = useApi<Paged<unknown>>(has(user, 'SERVICE_READ') ? '/api/v1/service/exceptions?status=OPEN&limit=1' : null);
  const requestApprovals = useApi<Paged<unknown>>(has(user, 'SERVICE_APPROVE') ? '/api/v1/service/requests?status=SUBMITTED&limit=1' : null);
  const acceptance = useApi<Paged<unknown>>(has(user, 'SERVICE_ACCEPT') ? '/api/v1/service/work-orders?status=COMPLETION_SUBMITTED&limit=1' : null);
  const workOrderApprovals = useApi<Paged<unknown>>(has(user, 'SERVICE_APPROVE') ? '/api/v1/service/work-orders?status=PENDING_APPROVAL&limit=1' : null);
  const activity = useApi<Paged<AuditRow>>(has(user, 'AUDIT_LOG_READ') ? '/api/v1/audit-logs?limit=8' : null);
  // Rounded to the minute so the request (and its cache key) is stable across re-renders.
  const [dayAgo] = React.useState(() => new Date(Math.floor((Date.now() - 86_400_000) / 60_000) * 60_000).toISOString());
  const failedSignIns = useApi<Paged<unknown>>(
    has(user, 'AUDIT_LOG_READ') ? `/api/v1/audit-logs?action=LOGIN_FAILED&from=${encodeURIComponent(dayAgo)}&limit=1` : null,
  );

  const s = summary.data;
  const firstName = user.fullName.split(' ')[0] || user.fullName;
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const refreshing = summary.loading || visits.loading || activity.loading;
  const refreshAll = () => {
    for (const r of [summary, visits, exceptions, requestApprovals, workOrderApprovals, acceptance, activity, failedSignIns]) void r.reload();
  };

  const kpis: Array<{
    label: string;
    value: number | null | undefined;
    hint: string;
    icon: React.ReactNode;
    route?: string;
    accent: string;
  }> = [
    {
      label: 'Visitors on site',
      value: s?.visitorsOnSite,
      hint: 'Checked in and not yet out',
      icon: <DoorOpen size={18} />,
      route: '/visitors/inside',
      accent: colors.primary[600],
    },
    {
      label: 'Visits today',
      value: s?.visitorsToday,
      hint: 'Scheduled to start today',
      icon: <CalendarClock size={18} />,
      route: '/visitors',
      accent: '#7c3aed',
    },
    {
      label: 'Awaiting approval',
      value: s?.visitorApprovalsPending,
      hint: 'Visits pending a decision',
      icon: <ClipboardCheck size={18} />,
      route: '/visitors/approvals',
      accent: '#d97706',
    },
    {
      label: 'Open service work',
      value: s?.openServiceWorkOrders,
      hint: 'Work orders not yet closed',
      icon: <Wrench size={18} />,
      route: '/services/work-orders',
      accent: '#0891b2',
    },
    {
      label: 'Gate events today',
      value: s?.gateEventsToday,
      hint: 'Entries and exits recorded',
      icon: <ShieldAlert size={18} />,
      accent: '#475569',
    },
    {
      label: 'Contractor work open',
      value: s?.openWorkOrders,
      hint: 'Contractor work orders in progress',
      icon: <HardHat size={18} />,
      route: '/contractors/companies',
      accent: '#b45309',
    },
  ];
  const visibleKpis = kpis.filter(k => k.value !== null);

  const attention: Array<{
    key: string;
    count: number;
    text: string;
    route?: string;
    tone: 'warning' | 'danger' | 'info';
  }> = [];
  if (has(user, 'VISITOR_APPROVE') && (s?.visitorApprovalsPending ?? 0) > 0)
    attention.push({
      key: 'visits',
      count: s!.visitorApprovalsPending!,
      text: 'visits waiting for approval',
      route: '/visitors/approvals',
      tone: 'warning',
    });
  if ((requestApprovals.data?.total ?? 0) > 0)
    attention.push({
      key: 'req',
      count: requestApprovals.data!.total,
      text: 'service requests waiting for approval',
      route: '/services',
      tone: 'warning',
    });
  if ((workOrderApprovals.data?.total ?? 0) > 0)
    attention.push({
      key: 'wo',
      count: workOrderApprovals.data!.total,
      text: 'work orders waiting for approval',
      route: '/services/work-orders',
      tone: 'warning',
    });
  if ((acceptance.data?.total ?? 0) > 0)
    attention.push({
      key: 'acc',
      count: acceptance.data!.total,
      text: 'completed jobs waiting for your acceptance',
      route: '/services/work-orders',
      tone: 'warning',
    });
  if ((exceptions.data?.total ?? 0) > 0)
    attention.push({
      key: 'exc',
      count: exceptions.data!.total,
      text: 'open service exceptions',
      route: '/services/exceptions',
      tone: 'danger',
    });
  if ((failedSignIns.data?.total ?? 0) > 0)
    attention.push({
      key: 'auth',
      count: failedSignIns.data!.total,
      text: 'failed sign-in attempts in the last 24 hours',
      route: '/admin/audit',
      tone: 'info',
    });

  const actions: Array<{
    label: string;
    route: string;
    icon: React.ReactNode;
  }> = [
    {
      label: 'Register a visitor',
      route: '/visitors/new',
      icon: <UserPlus size={16} />,
    },
    {
      label: 'Raise a service request',
      route: '/services/new',
      icon: <Wrench size={16} />,
    },
    { label: 'Manage users', route: '/admin/users', icon: <Users size={16} /> },
    {
      label: 'Review the audit log',
      route: '/admin/audit',
      icon: <FileSearch size={16} />,
    },
  ].filter(a => canOpen(a.route));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px' }}>
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '16px',
        }}
      >
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500] }}>{today}</p>
          <h1
            style={{
              margin: '2px 0 0',
              fontSize: '24px',
              lineHeight: '32px',
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: colors.slate[900],
            }}
          >
            {greeting()}, {firstName}
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '14px',
              color: colors.slate[500],
            }}
          >
            Signed in as {roleName(user.role)}
            {user.organizationName ? ` · ${user.organizationName}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {actions.slice(0, 2).map(a => (
            <button key={a.route} type="button" style={buttonStyle(a === actions[0] ? 'primary' : 'secondary')} onClick={() => navigate(a.route)}>
              {a.icon} {a.label}
            </button>
          ))}
          <button type="button" style={buttonStyle()} onClick={refreshAll} aria-label="Refresh dashboard">
            <RefreshCw size={15} style={refreshing ? { animation: 'spin 1s linear infinite' } : undefined} />
          </button>
        </div>
      </header>

      <ErrorNote error={summary.error} />

      {visibleKpis.length > 0 && (
        <section
          aria-label="Key figures"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(168px, 100%), 1fr))',
            gap: '14px',
          }}
        >
          {visibleKpis.map(k => {
            const clickable = !!k.route && canOpen(k.route);
            const body = (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontWeight: 500,
                      color: colors.slate[600],
                    }}
                  >
                    {k.label}
                  </span>
                  <span
                    aria-hidden="true"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: radius.lg,
                      color: k.accent,
                      backgroundColor: `${k.accent}14`,
                    }}
                  >
                    {k.icon}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '30px',
                    lineHeight: '36px',
                    fontWeight: 700,
                    color: colors.slate[900],
                    fontVariantNumeric: 'tabular-nums',
                    marginTop: '6px',
                  }}
                >
                  {k.value == null ? <span style={{ color: colors.slate[300] }}>—</span> : k.value.toLocaleString()}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    marginTop: '4px',
                    fontSize: '12px',
                    color: colors.slate[500],
                  }}
                >
                  <span>{k.hint}</span>
                  {clickable && <ArrowRight size={14} aria-hidden="true" />}
                </div>
              </>
            );
            const style: React.CSSProperties = {
              ...card,
              padding: '16px 18px',
              textAlign: 'left',
              font: 'inherit',
              width: '100%',
            };
            return clickable ? (
              <button key={k.label} type="button" className="vms-card-link" style={{ ...style, cursor: 'pointer' }} onClick={() => navigate(k.route!)}>
                {body}
              </button>
            ) : (
              <div key={k.label} style={style}>
                {body}
              </div>
            );
          })}
        </section>
      )}

      {/* With the activity feed: two columns (see .vms-dash-grid); without it, one full-width column. */}
      <div
        className={has(user, 'AUDIT_LOG_READ') ? 'vms-dash-grid' : undefined}
        style={has(user, 'AUDIT_LOG_READ') ? undefined : { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px', minWidth: 0 }}>
          <Panel title="Needs your attention">
            {attention.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '6px 0',
                }}
              >
                <CheckCircle2 size={22} color={colors.status.success.fg} aria-hidden="true" />
                <div>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.slate[900],
                    }}
                  >
                    You're all caught up
                  </div>
                  <div style={{ fontSize: '13px', color: colors.slate[500] }}>Nothing is waiting on you right now.</div>
                </div>
              </div>
            ) : (
              <ul
                style={{
                  listStyle: 'none',
                  margin: 0,
                  padding: 0,
                  display: 'grid',
                  gap: '8px',
                }}
              >
                {attention.map(a => {
                  const tone = colors.status[a.tone];
                  const open = a.route && canOpen(a.route);
                  return (
                    <li key={a.key}>
                      <button
                        type="button"
                        disabled={!open}
                        onClick={() => open && navigate(a.route!)}
                        className="vms-card-link"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '10px 12px',
                          border: `1px solid ${colors.slate[200]}`,
                          borderRadius: radius.lg,
                          background: '#ffffff',
                          cursor: open ? 'pointer' : 'default',
                          textAlign: 'left',
                          font: 'inherit',
                        }}
                      >
                        <span
                          style={{
                            display: 'grid',
                            placeItems: 'center',
                            minWidth: '34px',
                            height: '28px',
                            padding: '0 8px',
                            borderRadius: radius.full,
                            fontSize: '13px',
                            fontWeight: 700,
                            color: tone.fg,
                            backgroundColor: tone.bg,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {a.count}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            fontSize: '14px',
                            color: colors.slate[800],
                          }}
                        >
                          {a.text}
                        </span>
                        {open && <ArrowRight size={15} color={colors.slate[400]} aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {actions.length > 2 && (
              <div
                style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: `1px solid ${colors.slate[100]}`,
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: colors.slate[500],
                    marginBottom: '8px',
                  }}
                >
                  Shortcuts
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {actions.slice(2).map(a => (
                    <button key={a.route} type="button" style={buttonStyle()} onClick={() => navigate(a.route)}>
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Panel>

          {has(user, 'VISITOR_READ') && (
            <Panel
              title="Latest visits"
              action={
                canOpen('/visitors')
                  ? {
                      label: 'Visitor register',
                      onClick: () => navigate('/visitors'),
                    }
                  : undefined
              }
            >
              <ErrorNote error={visits.error} />
              {visits.data && visits.data.items.length === 0 && <Empty text="No visits recorded yet." />}
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {visits.data?.items.map((v, i) => (
                  <li
                    key={v.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 0',
                      borderTop: i ? `1px solid ${colors.slate[100]}` : 'none',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        display: 'grid',
                        placeItems: 'center',
                        width: '34px',
                        height: '34px',
                        borderRadius: '50%',
                        backgroundColor: colors.slate[100],
                        color: colors.slate[600],
                        fontSize: '12px',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {v.visitorName
                        .split(/\s+/)
                        .map(w => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: colors.slate[900],
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {v.visitorName}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: colors.slate[500],
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {[v.companyName, v.hostName && `host ${v.hostName}`, fmt(v.scheduledStart)].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <StatusPill status={v.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        {has(user, 'AUDIT_LOG_READ') && (
          <Panel
            title="Recent activity"
            action={
              canOpen('/admin/audit')
                ? {
                    label: 'Audit log',
                    onClick: () => navigate('/admin/audit'),
                  }
                : undefined
            }
          >
            <ErrorNote error={activity.error} />
            {activity.data && activity.data.items.length === 0 && <Empty text="No activity yet." />}
            <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {activity.data?.items.map((a, i) => {
                const tone = actionTone(a.action);
                return (
                  <li
                    key={a.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '9px 0',
                      borderTop: i ? `1px solid ${colors.slate[100]}` : 'none',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: '8px',
                        height: '8px',
                        marginTop: '6px',
                        borderRadius: '50%',
                        flexShrink: 0,
                        backgroundColor: tone === 'danger' ? colors.status.danger.fg : tone === 'warning' ? colors.status.warning.fg : colors.slate[300],
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', color: colors.slate[800] }}>
                        <strong style={{ fontWeight: 600, color: colors.slate[900] }}>{a.actorName ?? roleName(a.actorRole)}</strong>{' '}
                        {describeAction(a.action).toLowerCase()}
                        {tone === 'danger' && (
                          <AlertTriangle
                            size={13}
                            color={colors.status.danger.fg}
                            style={{ marginLeft: '6px', verticalAlign: '-2px' }}
                            aria-label="Security event"
                          />
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.slate[500] }}>
                        {relativeTime(a.timestamp)} · {roleName(a.actorRole)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Panel>
        )}
      </div>
    </div>
  );
};

const Panel: React.FC<{
  title: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}> = ({ title, action, children }) => (
  <section style={{ ...card, padding: '18px 20px' }} aria-label={title}>
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        marginBottom: '12px',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '15px',
          fontWeight: 600,
          color: colors.slate[900],
        }}
      >
        {title}
      </h2>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            border: 'none',
            background: 'none',
            padding: '4px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: colors.primary[600],
            cursor: 'pointer',
          }}
        >
          {action.label} <ArrowRight size={14} aria-hidden="true" />
        </button>
      )}
    </div>
    {children}
  </section>
);

const Empty: React.FC<{ text: string }> = ({ text }) => <p style={{ margin: '8px 0', fontSize: '13px', color: colors.slate[500] }}>{text}</p>;
