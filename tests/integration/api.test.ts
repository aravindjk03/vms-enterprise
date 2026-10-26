/**
 * End-to-end integration tests: real PostgreSQL + the HTTP API.
 *
 * Requires INTEGRATION_DATABASE_URL pointing at a role that can CREATE DATABASE / CREATE ROLE
 * (e.g. postgresql://postgres:postgres@localhost:5432/postgres). Each run creates and drops
 * its own throwaway database. Skipped when the variable is unset.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import pg from 'pg';
import type { FastifyInstance } from 'fastify';
import { runMigrations, ensureAppUser, loadMigrationFiles } from '../../packages/database/scripts/migrate.js';
import { setUserPassword } from '../../packages/database/scripts/bootstrap-user.js';
import { buildApp } from '../../apps/api/src/app.js';
import { assertRuntimeRoleIsRestricted, createPool, type Db } from '../../apps/api/src/db.js';
import type { ApiConfig } from '../../apps/api/src/config.js';

const ADMIN_URL = process.env['INTEGRATION_DATABASE_URL'];
const TENANT = '00000000-0000-0000-0000-000000000001';
const DETROIT = '00000000-0000-0000-0000-000000000101';
const HOST_MARY = '00000000-0000-0000-0000-000000000604';
const PASSWORDS = { admin: 'Detroit#Admin2026', guard: 'Guard#Detroit2026', host: 'Host#Mary20261', rival: 'Rival#Tenant2026' };

function withDatabase(url: string, database: string, user?: string, password?: string): string {
  const u = new URL(url);
  u.pathname = `/${database}`;
  if (user) {
    u.username = user;
    u.password = password ?? '';
  }
  return u.toString();
}

describe('API + PostgreSQL integration', { skip: !ADMIN_URL && 'INTEGRATION_DATABASE_URL not set' }, () => {
  const dbName = `vms_it_${randomBytes(4).toString('hex')}`;
  const appUser = `vms_api_${randomBytes(3).toString('hex')}`;
  const appPassword = randomBytes(18).toString('base64url');
  let ownerUrl: string;
  let owner: pg.Client;
  let appDb: Db;
  let app: FastifyInstance;

  const config: ApiConfig = {
    env: 'test',
    host: '127.0.0.1',
    port: 0,
    databaseUrl: '',
    databaseSsl: false,
    jwtSecret: randomBytes(48).toString('base64'),
    accessTokenTtlSeconds: 900,
    refreshTokenTtlSeconds: 3600,
    maxFailedLogins: 5,
    loginRateLimitPerMinute: 1000,
    lockoutMinutes: 15,
    corsAllowedOrigins: [],
    trustProxy: false,
    allowPrivilegedDbRole: false,
  };

  before(async () => {
    const admin = new pg.Client({ connectionString: ADMIN_URL });
    await admin.connect();
    await admin.query(`CREATE DATABASE ${dbName}`);
    await admin.end();

    ownerUrl = withDatabase(ADMIN_URL!, dbName);
    owner = new pg.Client({ connectionString: ownerUrl });
    await owner.connect();
    await runMigrations(owner, () => undefined);
    await ensureAppUser(owner, appUser, appPassword);
    await setUserPassword(owner, 'GLOBAL-MFG', 'admin.detroit', PASSWORDS.admin, 'SUPER_ADMIN');
    await setUserPassword(owner, 'GLOBAL-MFG', 'guard.detroit', PASSWORDS.guard);
    await setUserPassword(owner, 'GLOBAL-MFG', 'host.mary', PASSWORDS.host);

    // A second tenant with its own administrator, to prove isolation.
    await owner.query(`
      INSERT INTO tenants (tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000b2', 'RIVAL-CO', 'Rival Co');
      INSERT INTO organizations (organization_id, tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-0000000000b2', 'RIVAL', 'Rival');
      INSERT INTO users (user_id, tenant_id, organization_id, username, email, full_name)
        VALUES ('00000000-0000-0000-0000-0000000000b4', '00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-0000000000b3', 'rival.admin', 'admin@rival.test', 'Rival Admin');
      INSERT INTO roles (tenant_id, code, name) VALUES ('00000000-0000-0000-0000-0000000000b2', 'SUPER_ADMIN', 'Super Admin');`);
    await setUserPassword(owner, 'RIVAL-CO', 'rival.admin', PASSWORDS.rival, 'SUPER_ADMIN');

    config.databaseUrl = withDatabase(ADMIN_URL!, dbName, appUser, appPassword);
    appDb = createPool(config);
    app = await buildApp({ config, db: appDb });
  });

  after(async () => {
    await app?.close();
    await appDb?.end();
    await owner?.end();
    const admin = new pg.Client({ connectionString: ADMIN_URL });
    await admin.connect();
    await admin.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
    await admin.query(`DROP ROLE IF EXISTS ${appUser}`);
    await admin.end();
  });

  async function login(tenantCode: string, username: string, password: string) {
    const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { tenantCode, username, password } });
    const cookie = String(res.headers['set-cookie'] ?? '').split(';')[0];
    return { status: res.statusCode, body: res.json(), cookie, auth: { authorization: `Bearer ${res.json().accessToken}` } };
  }

  it('migrations are recorded and re-running them is a no-op', async () => {
    const report = await runMigrations(owner, () => undefined);
    assert.equal(report.applied.length, 0);
    assert.equal(report.alreadyApplied.length, 6);
  });

  it('detects drift when an applied migration is edited', async () => {
    await owner.query("UPDATE schema_migrations SET checksum = repeat('0', 64) WHERE version = '002'");
    await assert.rejects(runMigrations(owner, () => undefined), /Migration drift/);
    const seed = loadMigrationFiles().find(f => f.version === '002')!;
    await owner.query("UPDATE schema_migrations SET checksum = $1 WHERE version = '002'", [seed.checksum]);
  });

  it('refuses to serve through a role that bypasses row-level security', async () => {
    const privileged = new pg.Pool({ connectionString: ownerUrl, max: 1 });
    await assert.rejects(assertRuntimeRoleIsRestricted(privileged, false), /Refusing to start/);
    await privileged.end();
    assert.equal(await assertRuntimeRoleIsRestricted(appDb, false), null);
  });

  it('enforces row-level security in the database itself', async () => {
    const { rows } = await appDb.query('SELECT count(*)::int AS n FROM users');
    assert.equal(rows[0].n, 0, 'no tenant context => no rows');
    await assert.rejects(appDb.query('DELETE FROM audit_logs'), /permission denied/);
    await assert.rejects(appDb.query("UPDATE schema_migrations SET name = 'x'"), /permission denied/);
  });

  it('rejects bad credentials with a generic message and locks the account', async () => {
    const wrong = await login('GLOBAL-MFG', 'host.mary', 'not-the-password');
    const unknown = await login('GLOBAL-MFG', 'nobody.here', 'not-the-password');
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.equal(wrong.body.error.message, unknown.body.error.message);

    await setUserPassword(owner, 'GLOBAL-MFG', 'esg.officer', 'Esg#Officer2026');
    for (let i = 0; i < 5; i++) await login('GLOBAL-MFG', 'esg.officer', `wrong-${i}`);
    const locked = await login('GLOBAL-MFG', 'esg.officer', 'Esg#Officer2026');
    assert.equal(locked.status, 401, 'correct password is refused while locked');
  });

  it('runs the visitor lifecycle with segregation of duties and gate events', async () => {
    const admin = await login('GLOBAL-MFG', 'admin.detroit', PASSWORDS.admin);
    const guard = await login('GLOBAL-MFG', 'guard.detroit', PASSWORDS.guard);
    const host = await login('GLOBAL-MFG', 'host.mary', PASSWORDS.host);
    assert.equal(admin.status, 200);
    assert.equal(admin.body.user.role, 'SUPER_ADMIN');

    const start = new Date(Date.now() + 3600_000);
    const created = await app.inject({
      method: 'POST',
      url: '/api/v1/visitors',
      headers: admin.auth,
      payload: { siteId: DETROIT, hostUserId: HOST_MARY, firstName: 'Priya', lastName: 'Raman', companyName: 'Acme', scheduledStart: start, scheduledEnd: new Date(start.getTime() + 7200_000) },
    });
    assert.equal(created.statusCode, 201);
    const id = created.json().id;

    const guardCreate = await app.inject({ method: 'POST', url: '/api/v1/visitors', headers: guard.auth, payload: {} });
    assert.equal(guardCreate.statusCode, 403, 'guards cannot register visitors');

    const selfApprove = await app.inject({ method: 'POST', url: `/api/v1/visitors/${id}/approve`, headers: admin.auth, payload: {} });
    assert.equal(selfApprove.statusCode, 403, 'creator cannot approve own request');
    const guardApprove = await app.inject({ method: 'POST', url: `/api/v1/visitors/${id}/approve`, headers: guard.auth, payload: {} });
    assert.equal(guardApprove.statusCode, 403);
    const hostApprove = await app.inject({ method: 'POST', url: `/api/v1/visitors/${id}/approve`, headers: host.auth, payload: { remarks: 'expected' } });
    assert.equal(hostApprove.statusCode, 200);
    assert.equal(hostApprove.json().status, 'APPROVED');

    const gates = (await app.inject({ method: 'GET', url: `/api/v1/gates?siteId=${DETROIT}`, headers: guard.auth })).json().items;
    const gateId = gates[0].gateId;
    const checkIn = await app.inject({ method: 'POST', url: `/api/v1/visitors/${id}/check-in`, headers: guard.auth, payload: { gateId } });
    assert.equal(checkIn.statusCode, 200);
    const again = await app.inject({ method: 'POST', url: `/api/v1/visitors/${id}/check-in`, headers: guard.auth, payload: { gateId } });
    assert.equal(again.statusCode, 409);
    const checkOut = await app.inject({ method: 'POST', url: `/api/v1/visitors/${id}/check-out`, headers: guard.auth, payload: { gateId } });
    assert.equal(checkOut.json().status, 'COMPLETED');

    const audit = (await app.inject({ method: 'GET', url: `/api/v1/audit-logs?entityId=${id}`, headers: admin.auth })).json().items;
    assert.deepEqual(
      audit.map((a: { action: string }) => a.action).sort(),
      ['VISITOR_APPROVED', 'VISITOR_CHECKED_IN', 'VISITOR_CHECKED_OUT', 'VISITOR_REGISTERED']
    );
    const guardAudit = await app.inject({ method: 'GET', url: '/api/v1/audit-logs', headers: guard.auth });
    assert.equal(guardAudit.statusCode, 403);

    const events = await owner.query('SELECT event_type FROM gate_events WHERE source_transaction_id = $1 ORDER BY event_timestamp', [id]);
    assert.deepEqual(events.rows.map(r => r.event_type), ['ENTRY', 'EXIT']);

    const summary = (await app.inject({ method: 'GET', url: '/api/v1/dashboard/summary', headers: admin.auth })).json();
    assert.equal(summary.gateEventsToday >= 2, true);
  });

  it('isolates tenants end to end', async () => {
    const admin = await login('GLOBAL-MFG', 'admin.detroit', PASSWORDS.admin);
    const rival = await login('RIVAL-CO', 'rival.admin', PASSWORDS.rival);
    assert.equal(rival.status, 200);

    const mine = (await app.inject({ method: 'GET', url: '/api/v1/visitors', headers: admin.auth })).json();
    assert.ok(mine.total >= 1);
    const theirs = (await app.inject({ method: 'GET', url: '/api/v1/visitors', headers: rival.auth })).json();
    assert.equal(theirs.total, 0);
    const sites = (await app.inject({ method: 'GET', url: '/api/v1/sites', headers: rival.auth })).json();
    assert.equal(sites.items.length, 0);

    const foreignId = mine.items[0].id;
    const peek = await app.inject({ method: 'POST', url: `/api/v1/visitors/${foreignId}/cancel`, headers: rival.auth, payload: {} });
    assert.equal(peek.statusCode, 404);

    const smuggle = await app.inject({
      method: 'POST',
      url: '/api/v1/visitors',
      headers: rival.auth,
      payload: { siteId: DETROIT, hostUserId: HOST_MARY, firstName: 'X', lastName: 'Y', scheduledStart: new Date(), scheduledEnd: new Date(Date.now() + 3600_000) },
    });
    assert.equal(smuggle.statusCode, 400, 'foreign site/host are invisible to the other tenant');
  });

  it('rotates refresh tokens, detects reuse and supports logout', async () => {
    const session = await login('GLOBAL-MFG', 'host.mary', PASSWORDS.host);
    const csrf = { 'x-requested-with': 'vms-web' };

    const noCsrf = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: session.cookie } });
    assert.equal(noCsrf.statusCode, 403);

    const rotated = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: session.cookie, ...csrf } });
    assert.equal(rotated.statusCode, 200);
    const newAuth = { authorization: `Bearer ${rotated.json().accessToken}` };
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: newAuth })).statusCode, 200);

    const replay = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: session.cookie, ...csrf } });
    assert.equal(replay.statusCode, 401, 'old refresh token is single-use');
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: newAuth })).statusCode, 401, 'reuse revokes all sessions');

    const fresh = await login('GLOBAL-MFG', 'host.mary', PASSWORDS.host);
    const out = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: fresh.cookie, ...csrf } });
    assert.equal(out.statusCode, 204);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: fresh.auth })).statusCode, 401);
  });

  it('rejects malformed and forged requests and sets security headers', async () => {
    const admin = await login('GLOBAL-MFG', 'admin.detroit', PASSWORDS.admin);
    const tampered = admin.auth.authorization.slice(0, -2) + 'xx';
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/visitors', headers: { authorization: tampered } })).statusCode, 401);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/visitors' })).statusCode, 401);

    const invalid = await app.inject({ method: 'POST', url: '/api/v1/visitors', headers: admin.auth, payload: { siteId: 'nope' } });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.json().error.code, 'VALIDATION_ERROR');

    const res = await app.inject({ method: 'GET', url: '/api/health' });
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
    assert.match(String(res.headers['content-security-policy']), /default-src 'none'/);
    assert.equal(res.headers['cache-control'], 'no-store');
    assert.equal((await app.inject({ method: 'GET', url: '/api/ready' })).json().status, 'ready');
  });
});
