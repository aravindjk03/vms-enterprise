/**
 * In-browser stand-in for the API in the static demo build (no server). It answers the requests made by
 * the overview, users, roles and audit screens from sample data, and applies the same access rules as
 * the server: the shared role catalog and privilege-escalation guard come from @vms/permissions.
 * Changes last for the browser tab (sessionStorage) and never leave the browser.
 */
import { canAssignRole, canManageUserWithRoles, hasPermissionMatch, ROLE_PERMISSIONS, TENANT_WIDE_ROLES, type PermissionAction } from '@vms/permissions';
import type { EnterpriseRole } from '@vms/types';
import { ApiError, type SessionUser } from '../api/client.js';
import { DEMO_SITES } from '../mockData.js';

export interface DemoSite {
  siteId: string;
  name: string;
}

export const DEMO_ORG = 'Northwind Tyres & Polymers';

/** The same sample sites as the demo site switcher. */
export const DEMO_BACKEND_SITES: DemoSite[] = DEMO_SITES.map(s => ({ siteId: s.siteId, name: s.siteName }));

const ROLE_INFO: Record<string, [string, string]> = {
  SUPER_ADMIN: ['Global Super Administrator', 'Full system privilege'],
  ORGANIZATION_ADMIN: ['Organization Administrator', 'Tenant-wide administration across all sites'],
  SITE_ADMIN: ['Site Facility Administrator', 'Site level management'],
  IT_ADMIN: ['IT Administrator', 'Integrations, devices and technical configuration'],
  SECURITY_MANAGER: ['Security Manager', 'Security operations, approvals and gate oversight'],
  SECURITY_GUARD: ['Site Security Officer', 'Physical gate execution'],
  GATE_OPERATOR: ['Gate Operator', 'Gate check-in and check-out'],
  RECEPTIONIST: ['Receptionist', 'Visitor reception and arrival recording'],
  HOST: ['Host / Employee', 'Invites visitors and raises service requests'],
  SERVICE_MANAGER: ['Service / Maintenance Manager', 'Plans, approves and accepts service and maintenance work'],
  EHS_MANAGER: ['Safety & Environmental Health Manager', 'Safety induction and work permits'],
  ESG_MANAGER: ['Sustainability / ESG Officer', 'GHG accounting and emissions audit'],
  ESG_METHODOLOGY_ADMIN: ['ESG Methodology Administrator', 'Emission factors and calculation methodology'],
  AUDITOR: ['Auditor', 'Read-only access to records and audit trail'],
  MANAGEMENT: ['Management', 'Read-only dashboards and reports'],
  HR_MANAGER: ['HR Manager', 'Workforce records and approvals'],
  HR: ['HR Officer', 'Workforce records'],
  LEGAL: ['Legal Counsel', 'Legal documents, agreements and holds'],
  LEGAL_USER: ['Legal User', 'Read access to legal documents'],
};

interface DemoUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  roles: EnterpriseRole[];
  siteIds: string[];
  defaultSiteId: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string;
  failedAttempts: number;
  lockedUntil: string | null;
  mustChangePassword: boolean;
  activeSessions: number;
  mfaEnabled: boolean;
  recoveryCodesLeft: number;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string;
  entityId: string;
  reason: string | null;
}

interface DemoState {
  users: DemoUser[];
  audit: AuditEntry[];
  seq: number;
  requireMfaForAdmins: boolean;
  policyUpdatedAt: string | null;
}

const STORAGE_KEY = 'vms.demo.state.v2';

/** Same rule as the server: people who manage users or the system count as administrators. */
const isAdministrator = (roles: EnterpriseRole[]) =>
  roles.some(r => (ROLE_PERMISSIONS[r] as string[] | undefined)?.some(p => p === 'USER_MANAGE' || p === 'SYSTEM_ADMIN_MANAGE'));
const ALL_SITES = DEMO_BACKEND_SITES.map(s => s.siteId);
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

function person(
  id: string,
  username: string,
  fullName: string,
  roles: EnterpriseRole[],
  siteIds: string[],
  extra: Partial<DemoUser> = {}
): DemoUser {
  return {
    id,
    username,
    fullName,
    email: `${username}@northwind.example`,
    status: 'ACTIVE',
    roles,
    siteIds,
    defaultSiteId: siteIds[0] ?? null,
    lastLoginAt: ago(60 * 26),
    passwordChangedAt: ago(60 * 24 * 40),
    failedAttempts: 0,
    lockedUntil: null,
    mustChangePassword: false,
    activeSessions: 0,
    mfaEnabled: false,
    recoveryCodesLeft: 0,
    ...extra,
  };
}

function seed(): DemoState {
  const [chn, pun, jsr] = ALL_SITES;
  const users: DemoUser[] = [
    person('u-admin', 'admin', 'Dana Whitfield', ['SUPER_ADMIN'], [], { mfaEnabled: true, recoveryCodesLeft: 10 }),
    person('u-site-admin', 'site.admin', 'Marcus Okafor', ['SITE_ADMIN'], [chn]),
    person('u-security-manager', 'security.manager', 'Leena Joshi', ['SECURITY_MANAGER'], [chn, pun], { mfaEnabled: true, recoveryCodesLeft: 8 }),
    person('u-guard', 'guard', 'Ravi Kumar', ['SECURITY_GUARD'], [chn], { lastLoginAt: ago(35) }),
    person('u-reception', 'reception', 'Sofia Martins', ['RECEPTIONIST'], [chn], { lastLoginAt: ago(80) }),
    person('u-host', 'host', 'Priya Raman', ['HOST'], [chn]),
    person('u-service-manager', 'service.manager', 'Arun Pillai', ['SERVICE_MANAGER'], [chn, jsr]),
    person('u-ehs', 'ehs', 'Grace Lin', ['EHS_MANAGER'], [chn, pun]),
    person('u-esg', 'esg', 'Tom Becker', ['ESG_MANAGER'], [], { lastLoginAt: ago(60 * 24 * 3) }),
    person('u-auditor', 'auditor', 'Nadia Haddad', ['AUDITOR'], [], { lastLoginAt: ago(60 * 24 * 9) }),
    person('u-guard-2', 'guard.night', 'Imran Sheikh', ['SECURITY_GUARD', 'GATE_OPERATOR'], [chn], { failedAttempts: 5, lockedUntil: ago(-12) }),
    person('u-reception-2', 'reception.pune', 'Kavya Nair', ['RECEPTIONIST'], [pun], { mustChangePassword: true, lastLoginAt: null }),
    person('u-host-2', 'host.jsr', 'Owen Brooks', ['HOST'], [jsr], { status: 'SUSPENDED' }),
    person('u-it', 'it.admin', 'Mei Tanaka', ['IT_ADMIN'], []),
  ];
  const name = (id: string) => users.find(u => u.id === id)?.fullName ?? null;
  const entry = (minutes: number, actorId: string, actorRole: string, action: string, entityType: string, entityId: string, reason: string | null = null): AuditEntry => ({
    id: `a-${minutes}-${action}`,
    timestamp: ago(minutes),
    actorId,
    actorName: name(actorId),
    actorRole,
    action,
    entityType,
    entityId,
    reason,
  });
  const audit: AuditEntry[] = [
    entry(12, 'u-guard', 'SECURITY_GUARD', 'VISITOR_CHECKED_IN', 'VISITOR_TRANSACTION', 'VIS-2026-0418'),
    entry(19, 'u-host', 'HOST', 'VISITOR_APPROVED', 'VISITOR_TRANSACTION', 'VIS-2026-0418'),
    entry(27, 'u-reception', 'RECEPTIONIST', 'VISITOR_REGISTERED', 'VISITOR_TRANSACTION', 'VIS-2026-0418'),
    entry(35, 'u-guard', 'SECURITY_GUARD', 'LOGIN_SUCCESS', 'USER', 'u-guard'),
    entry(48, 'u-guard-2', 'UNAUTHENTICATED', 'LOGIN_FAILED', 'USER', 'u-guard-2'),
    entry(52, 'u-service-manager', 'SERVICE_MANAGER', 'SERVICE_WORK_ORDER_APPROVED', 'SERVICE_WORK_ORDER', 'SWO-2026-0093'),
    entry(80, 'u-reception', 'RECEPTIONIST', 'LOGIN_SUCCESS', 'USER', 'u-reception'),
    entry(140, 'u-admin', 'SUPER_ADMIN', 'USER_CREATED', 'USER', 'u-reception-2', null),
    entry(60 * 5, 'u-admin', 'SUPER_ADMIN', 'USER_SUSPENDED', 'USER', 'u-host-2', 'Contract paused pending renewal'),
    entry(60 * 26, 'u-site-admin', 'SITE_ADMIN', 'USER_ROLES_CHANGED', 'USER', 'u-guard-2', 'Covers the night gate (ticket OPS-118)'),
  ];
  return { users, audit, seq: 1, requireMfaForAdmins: false, policyUpdatedAt: null };
}

/** Fallback when sessionStorage is unavailable (some private windows): changes then last until reload. */
let memory: DemoState | null = null;

function load(): DemoState {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DemoState;
  } catch {
    /* storage unavailable or corrupt: fall back to memory */
  }
  return memory ? (JSON.parse(JSON.stringify(memory)) as DemoState) : seed();
}

function save(state: DemoState): void {
  memory = state;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: the in-memory copy is used */
  }
}

/** Tests only: forget all demo changes. */
export function resetDemoState(): void {
  memory = null;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing stored */
  }
}

const forbidden = (message = 'You do not have permission to perform this action.') => new ApiError(403, 'FORBIDDEN', message);
const notFound = (what: string) => new ApiError(404, 'NOT_FOUND', `${what} not found.`);
const invalid = (message: string) => new ApiError(400, 'VALIDATION_ERROR', message);

function temporaryPassword(): string {
  const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghijkmnopqrstuvwxyz', '23456789', '!@#$%&*?'];
  const all = sets.join('');
  const pick = (chars: string) => chars[crypto.getRandomValues(new Uint32Array(1))[0] % chars.length];
  const chars = [...sets.map(pick), ...Array.from({ length: 12 }, () => pick(all))];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

/** The session user the demo screens run as, built from a demo account's role exactly as the server would. */
export function demoSessionUser(account: { username: string; name: string; role: EnterpriseRole }): SessionUser {
  const state = load();
  const record = state.users.find(u => u.username === account.username);
  const roles = record?.roles.length ? record.roles : [account.role];
  return {
    userId: record?.id ?? `u-${account.username}`,
    tenantId: 'demo',
    username: account.username,
    fullName: account.name,
    role: account.role,
    roles,
    siteIds: record?.siteIds ?? [],
    defaultSiteId: record?.defaultSiteId ?? null,
    permissions: Array.from(new Set(roles.flatMap(r => ROLE_PERMISSIONS[r] ?? []))),
    email: record?.email,
    organizationName: DEMO_ORG,
  };
}

/** Records the demo sign-in in the sample audit log. */
export function recordDemoSignIn(user: SessionUser): void {
  const state = load();
  state.audit.unshift({
    id: `a-login-${state.seq++}`,
    timestamp: new Date().toISOString(),
    actorId: user.userId,
    actorName: user.fullName,
    actorRole: user.role,
    action: 'LOGIN_SUCCESS',
    entityType: 'USER',
    entityId: user.userId,
    reason: null,
  });
  const record = state.users.find(u => u.id === user.userId);
  if (record) record.lastLoginAt = new Date().toISOString();
  save(state);
}

type Body = Record<string, unknown> | undefined;

export function createDemoBackend(actor: SessionUser) {
  const actorRoles = [actor.role, ...actor.roles] as EnterpriseRole[];
  const tenantWide = actorRoles.some(r => TENANT_WIDE_ROLES.includes(r));
  const scope = tenantWide ? ALL_SITES : actor.siteIds;
  const can = (p: PermissionAction) => hasPermissionMatch(actor.permissions as PermissionAction[], p);
  const require = (p: PermissionAction) => {
    if (!can(p)) throw forbidden();
  };
  const visible = (u: DemoUser) => tenantWide || u.siteIds.some(s => scope.includes(s)) || u.id === actor.userId;
  const manageable = (u: DemoUser) =>
    u.id !== actor.userId &&
    canManageUserWithRoles(actorRoles, u.roles.length ? u.roles : ['HOST']) &&
    (tenantWide || (u.siteIds.length > 0 && u.siteIds.every(s => scope.includes(s))));
  const locked = (u: DemoUser) => !!u.lockedUntil && new Date(u.lockedUntil).getTime() > Date.now();
  const row = (u: DemoUser) => ({
    id: u.id,
    username: u.username,
    fullName: u.fullName,
    email: u.email,
    status: u.status,
    roles: u.roles,
    siteIds: u.siteIds,
    lastLoginAt: u.lastLoginAt,
    locked: locked(u),
    mustChangePassword: u.mustChangePassword,
    mfaEnabled: u.mfaEnabled,
    hasPassword: true,
    canManage: manageable(u),
    isSelf: u.id === actor.userId,
  });

  const audit = (state: DemoState, action: string, target: DemoUser, reason: string | null) => {
    state.audit.unshift({
      id: `a-${state.seq++}`,
      timestamp: new Date().toISOString(),
      actorId: actor.userId,
      actorName: actor.fullName,
      actorRole: actor.role,
      action,
      entityType: 'USER',
      entityId: target.id,
      reason,
    });
  };

  const target = (state: DemoState, id: string, forChange: boolean): DemoUser => {
    const u = state.users.find(x => x.id === id);
    if (!u || !visible(u)) throw notFound('User');
    if (forChange) {
      if (u.id === actor.userId) throw forbidden('You cannot change your own access. Ask another administrator.');
      if (!manageable(u)) throw forbidden('This user has access you are not allowed to administer.');
    }
    return u;
  };

  const reasonOf = (body: Body) => {
    const reason = String(body?.['reason'] ?? '').trim();
    if (reason.length < 3) throw invalid('Give a reason of at least 3 characters.');
    return reason;
  };

  const keepSuperAdmin = (state: DemoState, excluding: string) => {
    if (!state.users.some(u => u.id !== excluding && u.status === 'ACTIVE' && u.roles.includes('SUPER_ADMIN'))) {
      throw new ApiError(409, 'LAST_SUPER_ADMIN', 'The organization must keep at least one active super administrator.');
    }
  };

  const page = <T>(items: T[], params: URLSearchParams) => {
    const limit = Math.min(Number(params.get('limit') ?? 50) || 50, 200);
    const offset = Number(params.get('offset') ?? 0) || 0;
    return { items: items.slice(offset, offset + limit), total: items.length, limit, offset };
  };

  return async (method: string, fullPath: string, body: Body): Promise<unknown> => {
    // A short pause keeps loading states honest, as with a real network.
    await new Promise(r => setTimeout(r, 120));
    const [path, query = ''] = fullPath.split('?');
    const params = new URLSearchParams(query);
    const state = load();
    const m = path.match(/^\/api\/v1\/admin\/users\/([^/]+)(?:\/([a-z-]+))?$/);

    if (method === 'GET' && path === '/api/v1/sites') {
      return { items: DEMO_BACKEND_SITES.filter(s => scope.includes(s.siteId)) };
    }

    if (method === 'GET' && path === '/api/v1/dashboard/summary') {
      const gate = (p: PermissionAction, v: number) => (can(p) ? v : null);
      return {
        visitorsOnSite: gate('VISITOR_READ', 42),
        visitorsToday: gate('VISITOR_READ', 112),
        visitorApprovalsPending: gate('VISITOR_READ', 6),
        contractorCompanies: gate('CONTRACTOR_READ', 24),
        openWorkOrders: gate('CONTRACTOR_READ', 18),
        openServiceWorkOrders: gate('SERVICE_READ', 27),
        customerAccounts: gate('CUSTOMER_READ', 31),
        upcomingCustomerVisits: gate('CUSTOMER_READ', 4),
        materialMovementsToday: gate('MATERIAL_READ', 102),
        registeredVehicles: gate('VEHICLE_READ', 58),
        gateEventsToday: gate('GATE_VIEW', 386),
      };
    }

    if (method === 'GET' && path === '/api/v1/visitors') {
      require('VISITOR_READ');
      const visits = [
        ['Anika Sharma', 'Brannick Mobility', 'Priya Raman', 'ON_PREMISES', 25],
        ['Daniel Osei', 'Kestrel Logistics', 'Arun Pillai', 'APPROVED', -40],
        ['Hannah Weiss', 'Lumen Audit Partners', 'Leena Joshi', 'PENDING', -90],
        ['Rahul Menon', 'Apex Calibration', 'Arun Pillai', 'ON_PREMISES', 70],
        ['Sara Lindqvist', 'Nordic Rubber AB', 'Priya Raman', 'COMPLETED', 240],
        ['Victor Alves', 'Iberia Polymers', 'Priya Raman', 'CANCELLED', 300],
      ] as const;
      return page(
        visits.map(([visitorName, companyName, hostName, status, minutes], i) => ({
          id: `v-${i}`,
          referenceNumber: `VIS-2026-04${20 - i}`,
          status,
          visitorName,
          companyName,
          hostName,
          siteName: DEMO_BACKEND_SITES[0].name,
          scheduledStart: ago(minutes),
        })),
        params
      );
    }

    if (method === 'GET' && path.startsWith('/api/v1/service/')) {
      require('SERVICE_READ');
      const status = params.get('status');
      const totals: Record<string, number> = { OPEN: 2, SUBMITTED: 3, PENDING_APPROVAL: 1, COMPLETION_SUBMITTED: 2 };
      return { items: [], total: status ? totals[status] ?? 0 : 0, limit: 1, offset: 0 };
    }

    if (method === 'GET' && path === '/api/v1/audit-logs') {
      require('AUDIT_LOG_READ');
      const action = params.get('action');
      const entityType = params.get('entityType');
      const search = params.get('search')?.toLowerCase();
      const from = params.get('from');
      const rows = state.audit.filter(
        a =>
          (!action || a.action === action) &&
          (!entityType || a.entityType === entityType) &&
          (!from || a.timestamp >= from) &&
          (!search || a.entityId.toLowerCase().includes(search) || (a.actorName ?? '').toLowerCase().includes(search))
      );
      return page(rows, params);
    }

    if (path.startsWith('/api/v1/admin/')) require('USER_MANAGE');

    if (method === 'GET' && path === '/api/v1/admin/roles') {
      return {
        items: Object.keys(ROLE_INFO)
          .filter(code => code in ROLE_PERMISSIONS)
          .map(code => ({
            code,
            name: ROLE_INFO[code][0],
            description: ROLE_INFO[code][1],
            users: state.users.filter(u => u.status === 'ACTIVE' && u.roles.includes(code as EnterpriseRole)).length,
            permissions: ROLE_PERMISSIONS[code as EnterpriseRole],
            assignable: canAssignRole(actorRoles, code as EnterpriseRole),
          }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      };
    }

    if (method === 'GET' && path === '/api/v1/admin/users') {
      const search = params.get('search')?.toLowerCase();
      const role = params.get('role');
      const status = params.get('status');
      const siteId = params.get('siteId');
      const rows = state.users
        .filter(visible)
        .filter(
          u =>
            (!search || [u.fullName, u.username, u.email].some(v => v.toLowerCase().includes(search))) &&
            (!role || u.roles.includes(role as EnterpriseRole)) &&
            (!status || u.status === status) &&
            (!siteId || u.siteIds.includes(siteId))
        )
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .map(row);
      return page(rows, params);
    }

    if (method === 'POST' && path === '/api/v1/admin/users') {
      const fullName = String(body?.['fullName'] ?? '').trim();
      const username = String(body?.['username'] ?? '').trim().toLowerCase();
      const email = String(body?.['email'] ?? '').trim().toLowerCase();
      const roles = Array.from(new Set((body?.['roles'] as EnterpriseRole[]) ?? []));
      const siteIds = Array.from(new Set((body?.['siteIds'] as string[]) ?? []));
      if (fullName.length < 2) throw invalid('Enter the full name.');
      if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(username)) throw invalid('Usernames use 3–64 lowercase letters, digits, ".", "_" or "-".');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw invalid('Enter a valid email address.');
      if (roles.length === 0) throw invalid('Choose at least one role.');
      const denied = roles.filter(r => !canAssignRole(actorRoles, r));
      if (denied.length) throw forbidden(`You are not allowed to grant: ${denied.join(', ')}.`);
      if (!tenantWide && siteIds.length === 0) throw invalid('Choose at least one of your sites.');
      if (siteIds.some(s => !scope.includes(s))) throw forbidden('You can only grant access to your own sites.');
      if (state.users.some(u => u.username === username)) throw new ApiError(409, 'ALREADY_EXISTS', 'That username is already in use.');
      if (state.users.some(u => u.email === email)) throw new ApiError(409, 'ALREADY_EXISTS', 'That email address is already in use.');
      const defaultSiteId = (body?.['defaultSiteId'] as string | undefined) ?? siteIds[0] ?? null;
      const user = person(`u-new-${state.seq++}`, username, fullName, roles, siteIds, {
        email,
        defaultSiteId,
        lastLoginAt: null,
        passwordChangedAt: new Date().toISOString(),
        mustChangePassword: true,
      });
      state.users.push(user);
      audit(state, 'USER_CREATED', user, null);
      save(state);
      return { id: user.id, temporaryPassword: temporaryPassword() };
    }

    if (m && method === 'GET' && !m[2]) {
      const u = target(state, m[1], false);
      return {
        ...row(u),
        defaultSiteId: u.defaultSiteId,
        passwordChangedAt: u.passwordChangedAt,
        failedAttempts: u.failedAttempts,
        activeSessions: u.activeSessions,
        mfaEnabledAt: u.mfaEnabled ? u.passwordChangedAt : null,
        recoveryCodesLeft: u.mfaEnabled ? u.recoveryCodesLeft : 0,
        mfaRequiredByPolicy: state.requireMfaForAdmins && isAdministrator(u.roles),
        assignableRoles: Object.keys(ROLE_PERMISSIONS).filter(r => canAssignRole(actorRoles, r as EnterpriseRole)),
        history: state.audit
          .filter(a => a.entityType === 'USER' && a.entityId === u.id && a.action !== 'LOGIN_SUCCESS' && a.action !== 'LOGIN_FAILED')
          .slice(0, 20)
          .map(a => ({ timestamp: a.timestamp, action: a.action, actorRole: a.actorRole, reason: a.reason })),
      };
    }

    if (m && method === 'PATCH' && !m[2]) {
      const u = target(state, m[1], true);
      const reason = reasonOf(body);
      const status = body?.['status'] as DemoUser['status'] | undefined;
      if (status && status !== 'ACTIVE' && u.roles.includes('SUPER_ADMIN')) keepSuperAdmin(state, u.id);
      if (typeof body?.['fullName'] === 'string') u.fullName = String(body['fullName']).trim();
      if (typeof body?.['email'] === 'string') {
        const email = String(body['email']).trim().toLowerCase();
        if (state.users.some(x => x.id !== u.id && x.email === email)) throw new ApiError(409, 'ALREADY_EXISTS', 'That email address is already in use.');
        u.email = email;
      }
      const changedStatus = status && status !== u.status;
      if (status) u.status = status;
      if (status && status !== 'ACTIVE') u.activeSessions = 0;
      audit(state, changedStatus ? `USER_${status}` : 'USER_UPDATED', u, reason);
      save(state);
      return { id: u.id };
    }

    if (m && method === 'PUT' && m[2] === 'roles') {
      const u = target(state, m[1], true);
      const reason = reasonOf(body);
      const next = Array.from(new Set((body?.['roles'] as EnterpriseRole[]) ?? []));
      if (next.length === 0) throw invalid('Keep at least one role.');
      const changed = [...next.filter(r => !u.roles.includes(r)), ...u.roles.filter(r => !next.includes(r))];
      const denied = changed.filter(r => !canAssignRole(actorRoles, r));
      if (denied.length) throw forbidden(`You are not allowed to change: ${denied.join(', ')}.`);
      if (u.roles.includes('SUPER_ADMIN') && !next.includes('SUPER_ADMIN')) keepSuperAdmin(state, u.id);
      u.roles = next;
      audit(state, 'USER_ROLES_CHANGED', u, reason);
      save(state);
      return { id: u.id, roles: next };
    }

    if (m && method === 'PUT' && m[2] === 'sites') {
      const u = target(state, m[1], true);
      const reason = reasonOf(body);
      const next = Array.from(new Set((body?.['siteIds'] as string[]) ?? []));
      if (next.filter(s => !u.siteIds.includes(s)).some(s => !scope.includes(s))) throw forbidden('You can only grant access to your own sites.');
      if (!tenantWide && u.siteIds.some(s => !next.includes(s) && !scope.includes(s))) throw forbidden('You can only remove access to your own sites.');
      if (!tenantWide && next.length === 0) throw invalid('Keep at least one site; deactivate the user to remove all access.');
      u.siteIds = next;
      u.defaultSiteId = (body?.['defaultSiteId'] as string | undefined) ?? next[0] ?? null;
      audit(state, 'USER_SITES_CHANGED', u, reason);
      save(state);
      return { id: u.id, siteIds: next };
    }

    if (m && method === 'POST' && m[2] === 'reset-password') {
      const u = target(state, m[1], true);
      const reason = reasonOf(body);
      u.mustChangePassword = true;
      u.passwordChangedAt = new Date().toISOString();
      u.failedAttempts = 0;
      u.lockedUntil = null;
      u.activeSessions = 0;
      audit(state, 'USER_PASSWORD_RESET', u, reason);
      save(state);
      return { id: u.id, temporaryPassword: temporaryPassword() };
    }

    if (m && method === 'POST' && m[2] === 'unlock') {
      const u = target(state, m[1], true);
      const reason = reasonOf(body);
      u.failedAttempts = 0;
      u.lockedUntil = null;
      audit(state, 'USER_UNLOCKED', u, reason);
      save(state);
      return { id: u.id };
    }

    if (m && method === 'POST' && m[2] === 'revoke-sessions') {
      const u = target(state, m[1], true);
      const reason = reasonOf(body);
      u.activeSessions = 0;
      audit(state, 'USER_SESSIONS_REVOKED', u, reason);
      save(state);
      return { id: u.id };
    }

    if (m && method === 'POST' && m[2] === 'reset-mfa') {
      const u = target(state, m[1], true);
      const reason = reasonOf(body);
      if (!u.mfaEnabled) throw new ApiError(409, 'MFA_NOT_ENABLED', 'This user has not set up two-step verification.');
      u.mfaEnabled = false;
      u.recoveryCodesLeft = 0;
      u.activeSessions = 0;
      audit(state, 'USER_MFA_RESET', u, reason);
      save(state);
      return { id: u.id };
    }

    if (path === '/api/v1/admin/security-settings') {
      const active = state.users.filter(u => u.status === 'ACTIVE');
      const admins = active.filter(u => isAdministrator(u.roles));
      const me = state.users.find(u => u.id === actor.userId);
      if (method === 'GET') {
        return {
          requireMfaForAdmins: state.requireMfaForAdmins,
          updatedAt: state.policyUpdatedAt,
          activeUsers: tenantWide ? active.length : null,
          usersWithMfa: tenantWide ? active.filter(u => u.mfaEnabled).length : null,
          administrators: tenantWide ? admins.length : null,
          administratorsWithMfa: tenantWide ? admins.filter(u => u.mfaEnabled).length : null,
          canEdit: tenantWide,
          youHaveMfa: !!me?.mfaEnabled,
        };
      }
      if (method === 'PUT') {
        const reason = reasonOf(body);
        if (!tenantWide) throw forbidden('Only organization-wide administrators change the sign-in policy.');
        const next = body?.['requireMfaForAdmins'] === true;
        if (next && !me?.mfaEnabled) throw new ApiError(409, 'MFA_SELF_FIRST', 'Turn on two-step verification for your own account first.');
        state.requireMfaForAdmins = next;
        state.policyUpdatedAt = new Date().toISOString();
        state.audit.unshift({
          id: `a-${state.seq++}`,
          timestamp: state.policyUpdatedAt,
          actorId: actor.userId,
          actorName: actor.fullName,
          actorRole: actor.role,
          action: 'SECURITY_SETTINGS_CHANGED',
          entityType: 'TENANT',
          entityId: 'demo',
          reason,
        });
        save(state);
        return { requireMfaForAdmins: next };
      }
    }

    throw new ApiError(404, 'NOT_FOUND', 'This part of the console needs the VMS server; the demo shows sample data only.');
  };
}
