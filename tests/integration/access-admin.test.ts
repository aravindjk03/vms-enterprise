/**
 * Access administration against the real API and PostgreSQL: user lifecycle, temporary passwords,
 * forced password change, escalation guards, site scope, lockout recovery and tenant isolation.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setUserPassword } from '../../packages/database/scripts/bootstrap-user.js';
import { ROLE_PERMISSIONS } from '../../packages/permissions/src/index.js';
import { ADMIN_URL, addUser, createTestEnv, type Session, type TestEnv } from './helpers.js';

const T = '00000000-0000-0000-0000-000000000001';
const ORG = '00000000-0000-0000-0000-000000000010';
const DETROIT = '00000000-0000-0000-0000-000000000101';
const CHENNAI = '00000000-0000-0000-0000-000000000102';
const ADMIN_PW = 'Detroit#Admin2026';
const PW = 'Access#Test2026!';

describe('Access administration (API + PostgreSQL)', { skip: !ADMIN_URL && 'INTEGRATION_DATABASE_URL not set' }, () => {
  let env: TestEnv;
  let superAdmin: Session;
  let siteAdmin: Session;
  let orgAdmin: Session;

  before(async () => {
    env = await createTestEnv();
    await setUserPassword(env.owner, 'GLOBAL-MFG', 'admin.detroit', ADMIN_PW, 'SUPER_ADMIN');
    await addUser(env.owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'site.admin', role: 'SITE_ADMIN', siteIds: [DETROIT], password: PW });
    await addUser(env.owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'org.admin', role: 'ORGANIZATION_ADMIN', password: PW });
    [superAdmin, siteAdmin, orgAdmin] = await Promise.all([
      env.login('GLOBAL-MFG', 'admin.detroit', ADMIN_PW),
      env.login('GLOBAL-MFG', 'site.admin', PW),
      env.login('GLOBAL-MFG', 'org.admin', PW),
    ]);
  });

  after(async () => {
    await env?.close();
  });

  it('creates a user with a one-time password that must be changed before anything else works', async () => {
    const created = await superAdmin.post('/api/v1/admin/users', {
      username: 'Priya.Raman',
      fullName: 'Priya Raman',
      email: 'priya.raman@example.test',
      roles: ['RECEPTIONIST', 'HOST'],
      siteIds: [DETROIT],
    });
    assert.equal(created.statusCode, 201);
    const { id, temporaryPassword } = created.json();
    assert.match(temporaryPassword, /^.{16}$/);

    const audit = await env.owner.query("SELECT after_snapshot::text AS a FROM audit_logs WHERE action = 'USER_CREATED' AND entity_id = $1", [id]);
    assert.equal(audit.rowCount, 1);
    assert.ok(!audit.rows[0].a.includes(temporaryPassword), 'the temporary password is never written to the audit log');

    const dup = await superAdmin.post('/api/v1/admin/users', { username: 'priya.raman', fullName: 'Dup', email: 'other@example.test', roles: ['HOST'], siteIds: [DETROIT] });
    assert.equal(dup.statusCode, 409);

    const priya = await env.login('GLOBAL-MFG', 'priya.raman', temporaryPassword);
    assert.equal(priya.status, 200);
    const me = (await priya.get('/api/v1/auth/me')).json();
    assert.equal(me.mustChangePassword, true);
    const blocked = await priya.get('/api/v1/visitors');
    assert.equal(blocked.statusCode, 403);
    assert.equal(blocked.json().error.code, 'PASSWORD_CHANGE_REQUIRED');

    assert.equal((await priya.post('/api/v1/auth/change-password', { currentPassword: 'wrong', newPassword: 'Another#Pass2026' })).statusCode, 400);
    const weak = await priya.post('/api/v1/auth/change-password', { currentPassword: temporaryPassword, newPassword: 'short' });
    assert.equal(weak.json().error.code, 'PASSWORD_POLICY');
    const same = await priya.post('/api/v1/auth/change-password', { currentPassword: temporaryPassword, newPassword: temporaryPassword });
    assert.equal(same.json().error.code, 'PASSWORD_REUSED');
    const changed = await priya.post('/api/v1/auth/change-password', { currentPassword: temporaryPassword, newPassword: 'Reception#Desk2026' });
    assert.equal(changed.statusCode, 200);
    assert.equal(changed.json().mustChangePassword, false);
    assert.equal((await priya.get('/api/v1/visitors')).statusCode, 200);
    assert.equal((await env.login('GLOBAL-MFG', 'priya.raman', 'Reception#Desk2026')).status, 200);
  });

  it('stops administrators from granting more access than they are allowed to', async () => {
    const asSite = (roles: string[], siteIds = [DETROIT]) =>
      siteAdmin.post('/api/v1/admin/users', { username: `s${Date.now()}${roles.length}`, fullName: 'Site Hire', email: `s${Date.now()}@example.test`, roles, siteIds });
    assert.equal((await asSite(['SUPER_ADMIN'])).statusCode, 403);
    assert.equal((await asSite(['ORGANIZATION_ADMIN'])).statusCode, 403);
    assert.equal((await asSite(['HOST'], [CHENNAI])).statusCode, 403, 'site admins grant only their own sites');
    assert.equal((await asSite(['HOST'], [])).statusCode, 400);
    const ok = await asSite(['SECURITY_GUARD']);
    assert.equal(ok.statusCode, 201);

    const roles = (await siteAdmin.get('/api/v1/admin/roles')).json().items as Array<{ code: string; assignable: boolean }>;
    assert.equal(roles.find(r => r.code === 'SUPER_ADMIN')!.assignable, false);
    assert.equal(roles.find(r => r.code === 'SECURITY_GUARD')!.assignable, true);

    // Site admins cannot touch more privileged users, nor their own access.
    const users = (await siteAdmin.get('/api/v1/admin/users?limit=200')).json().items as Array<{ id: string; username: string; canManage: boolean; isSelf: boolean }>;
    const superRow = users.find(u => u.username === 'admin.detroit')!;
    assert.equal(superRow.canManage, false);
    assert.equal((await siteAdmin.post(`/api/v1/admin/users/${superRow.id}/reset-password`, { reason: 'Attempted takeover' })).statusCode, 403);
    const self = users.find(u => u.isSelf)!;
    assert.equal((await siteAdmin.put(`/api/v1/admin/users/${self.id}/roles`, { roles: ['SUPER_ADMIN'], reason: 'Promote myself' })).statusCode, 403);

    // Organization admins grant anything except super admin.
    const orgCreate = (roles: string[]) =>
      orgAdmin.post('/api/v1/admin/users', { username: `o${Date.now()}${roles[0].length}`, fullName: 'Org Hire', email: `o${Date.now()}@example.test`, roles, siteIds: [DETROIT] });
    assert.equal((await orgCreate(['SUPER_ADMIN'])).statusCode, 403);
    assert.equal((await orgCreate(['SITE_ADMIN'])).statusCode, 201);
  });

  it('changes roles and sites, resets passwords and unlocks accounts, with an audit trail', async () => {
    const created = await siteAdmin.post('/api/v1/admin/users', { username: 'gate.night', fullName: 'Night Gate', email: 'gate.night@example.test', roles: ['GATE_OPERATOR'], siteIds: [DETROIT] });
    const { id, temporaryPassword } = created.json();
    assert.equal((await siteAdmin.put(`/api/v1/admin/users/${id}/roles`, { roles: ['GATE_OPERATOR', 'SECURITY_GUARD'], reason: 'Covers patrols' })).statusCode, 200);
    assert.equal((await siteAdmin.put(`/api/v1/admin/users/${id}/roles`, { roles: ['SECURITY_MANAGER'], reason: 'Not allowed' })).statusCode, 403);
    assert.equal((await siteAdmin.put(`/api/v1/admin/users/${id}/sites`, { siteIds: [DETROIT, CHENNAI], reason: 'Not my site' })).statusCode, 403);
    assert.equal((await superAdmin.put(`/api/v1/admin/users/${id}/sites`, { siteIds: [DETROIT, CHENNAI], defaultSiteId: CHENNAI, reason: 'Covers both plants' })).statusCode, 200);
    const detail = (await superAdmin.get(`/api/v1/admin/users/${id}`)).json();
    assert.deepEqual([...detail.siteIds].sort(), [DETROIT, CHENNAI].sort());
    assert.equal(detail.defaultSiteId, CHENNAI);
    assert.equal(detail.canManage, true);
    assert.equal((await siteAdmin.get(`/api/v1/admin/users/${id}`)).json().canManage, false, 'now also on a site the site admin does not run');

    // Lockout and recovery.
    for (let i = 0; i < 5; i++) await env.login('GLOBAL-MFG', 'gate.night', `wrong-${i}`);
    assert.equal((await env.login('GLOBAL-MFG', 'gate.night', temporaryPassword)).status, 401, 'locked');
    assert.equal((await superAdmin.get(`/api/v1/admin/users/${id}`)).json().locked, true);
    assert.equal((await superAdmin.post(`/api/v1/admin/users/${id}/unlock`, { reason: 'Verified by phone' })).statusCode, 200);
    const back = await env.login('GLOBAL-MFG', 'gate.night', temporaryPassword);
    assert.equal(back.status, 200);

    // Reset: new one-time password, old sessions end.
    const reset = await superAdmin.post(`/api/v1/admin/users/${id}/reset-password`, { reason: 'Forgot password' });
    const fresh = reset.json().temporaryPassword;
    assert.notEqual(fresh, temporaryPassword);
    assert.equal((await back.get('/api/v1/auth/me')).statusCode, 401, 'reset ends existing sessions');
    assert.equal((await env.login('GLOBAL-MFG', 'gate.night', temporaryPassword)).status, 401);
    assert.equal((await env.login('GLOBAL-MFG', 'gate.night', fresh)).status, 200);

    // Deactivation ends sessions and blocks sign-in.
    const active = await env.login('GLOBAL-MFG', 'gate.night', fresh);
    assert.equal((await superAdmin.patch(`/api/v1/admin/users/${id}`, { status: 'INACTIVE', reason: 'Left the company' })).statusCode, 200);
    assert.equal((await active.get('/api/v1/auth/me')).statusCode, 401);
    assert.equal((await env.login('GLOBAL-MFG', 'gate.night', fresh)).status, 401);

    const actions = (await env.owner.query('SELECT action FROM audit_logs WHERE entity_id = $1 ORDER BY "timestamp"', [id])).rows.map(r => r.action);
    for (const a of ['USER_CREATED', 'USER_ROLES_CHANGED', 'USER_SITES_CHANGED', 'USER_UNLOCKED', 'USER_PASSWORD_RESET', 'USER_INACTIVE']) {
      assert.ok(actions.includes(a), `audit has ${a}`);
    }
    const history = await env.owner.query('SELECT reason FROM user_password_history WHERE user_id = $1 ORDER BY created_at', [id]);
    assert.deepEqual(history.rows.map(r => r.reason), ['INITIAL', 'ADMIN_RESET']);
  });

  it('keeps access administration inside the tenant and behind USER_MANAGE', async () => {
    await env.owner.query(`
      INSERT INTO tenants (tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000c2', 'OTHER-CO', 'Other Co');
      INSERT INTO organizations (organization_id, tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000c3', '00000000-0000-0000-0000-0000000000c2', 'OTHER', 'Other');`);
    await addUser(env.owner, { tenantId: '00000000-0000-0000-0000-0000000000c2', orgId: '00000000-0000-0000-0000-0000000000c3', tenantCode: 'OTHER-CO', username: 'other.admin', role: 'SUPER_ADMIN', password: PW });
    const other = await env.login('OTHER-CO', 'other.admin', PW);
    const theirs = (await other.get('/api/v1/admin/users?limit=200')).json().items as Array<{ username: string }>;
    assert.ok(theirs.every(u => u.username === 'other.admin'), 'only their own tenant');
    const ours = (await superAdmin.get('/api/v1/admin/users?search=priya')).json().items[0];
    assert.equal((await other.get(`/api/v1/admin/users/${ours.id}`)).statusCode, 404);
    assert.equal((await other.post(`/api/v1/admin/users/${ours.id}/reset-password`, { reason: 'Cross-tenant attempt' })).statusCode, 404);

    await addUser(env.owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'plain.guard', role: 'SECURITY_GUARD', siteIds: [DETROIT], password: PW });
    const guard = await env.login('GLOBAL-MFG', 'plain.guard', PW);
    assert.equal((await guard.get('/api/v1/admin/users')).statusCode, 403);
    assert.equal((await guard.get('/api/v1/admin/roles')).statusCode, 403);
  });

  it('returns dashboard counts only to roles that may read them, and a searchable audit log with names', async () => {
    const NEEDS: Record<string, string> = {
      visitorsOnSite: 'VISITOR_READ',
      contractorCompanies: 'CONTRACTOR_READ',
      openServiceWorkOrders: 'SERVICE_READ',
      customerAccounts: 'CUSTOMER_READ',
      registeredVehicles: 'VEHICLE_READ',
      gateEventsToday: 'GATE_VIEW',
    };
    await addUser(env.owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'plain.host', role: 'HOST', siteIds: [DETROIT], password: PW });
    const host = await env.login('GLOBAL-MFG', 'plain.host', PW);
    for (const [session, role] of [[host, 'HOST'], [superAdmin, 'SUPER_ADMIN']] as const) {
      const summary = (await session.get('/api/v1/dashboard/summary')).json() as Record<string, number | null>;
      for (const [key, permission] of Object.entries(NEEDS)) {
        const allowed = (ROLE_PERMISSIONS[role] as string[]).includes(permission);
        assert.equal(summary[key] === null, !allowed, `${role} ${key}`);
      }
    }

    const created = (await superAdmin.get('/api/v1/audit-logs?action=USER_CREATED&limit=5')).json();
    assert.ok(created.total >= 1);
    for (const row of created.items) {
      assert.equal(row.action, 'USER_CREATED');
      assert.ok(typeof row.actorName === 'string' && row.actorName.length > 0, 'actor is named');
    }
    const byActor = (await superAdmin.get('/api/v1/audit-logs?search=site.admin&limit=50')).json();
    assert.ok(byActor.items.length > 0 && byActor.items.every((r: { actorId: string; entityId: string }) => r.actorId !== null));
    const future = encodeURIComponent(new Date(Date.now() + 3_600_000).toISOString());
    assert.equal((await superAdmin.get(`/api/v1/audit-logs?from=${future}`)).json().total, 0);
    assert.equal((await superAdmin.get('/api/v1/audit-logs?from=yesterday')).statusCode, 400);
    assert.equal((await host.get('/api/v1/audit-logs')).statusCode, 403);
  });
});
