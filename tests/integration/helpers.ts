import { randomBytes } from 'node:crypto';
import pg from 'pg';
import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { runMigrations, ensureAppUser } from '../../packages/database/scripts/migrate.js';
import { setUserPassword } from '../../packages/database/scripts/bootstrap-user.js';
import { buildApp } from '../../apps/api/src/app.js';
import { createPool, type Db } from '../../apps/api/src/db.js';
import type { ApiConfig } from '../../apps/api/src/config.js';

export const ADMIN_URL = process.env['INTEGRATION_DATABASE_URL'];

export function withDatabase(url: string, database: string, user?: string, password?: string): string {
  const u = new URL(url);
  u.pathname = `/${database}`;
  if (user) {
    u.username = user;
    u.password = password ?? '';
  }
  return u.toString();
}

export interface TestEnv {
  app: FastifyInstance;
  owner: pg.Client;
  appDb: Db;
  dbName: string;
  login(tenantCode: string, username: string, password: string): Promise<Session>;
  close(): Promise<void>;
}

export interface Session {
  status: number;
  user: { userId: string; role: string };
  auth: { authorization: string };
  get(url: string): Promise<LightMyRequestResponse>;
  post(url: string, payload?: unknown, headers?: Record<string, string>): Promise<LightMyRequestResponse>;
  patch(url: string, payload?: unknown): Promise<LightMyRequestResponse>;
}

/** Creates a throwaway database, applies every migration, creates the RLS runtime role and boots the API. */
export async function createTestEnv(): Promise<TestEnv> {
  const dbName = `vms_it_${randomBytes(4).toString('hex')}`;
  const appUser = `vms_api_${randomBytes(3).toString('hex')}`;
  const appPassword = randomBytes(18).toString('base64url');

  const admin = new pg.Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${dbName}`);
  await admin.end();

  const owner = new pg.Client({ connectionString: withDatabase(ADMIN_URL!, dbName) });
  await owner.connect();
  await runMigrations(owner, () => undefined);
  await ensureAppUser(owner, appUser, appPassword);

  const config: ApiConfig = {
    env: 'test',
    host: '127.0.0.1',
    port: 0,
    databaseUrl: withDatabase(ADMIN_URL!, dbName, appUser, appPassword),
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
  const appDb = createPool(config);
  const app = await buildApp({ config, db: appDb });

  return {
    app,
    owner,
    appDb,
    dbName,
    async login(tenantCode, username, password) {
      const res = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { tenantCode, username, password } });
      const body = res.json();
      const auth = { authorization: `Bearer ${body.accessToken}` };
      return {
        status: res.statusCode,
        user: body.user,
        auth,
        get: url => app.inject({ method: 'GET', url, headers: auth }),
        post: (url, payload = {}, headers = {}) => app.inject({ method: 'POST', url, payload: payload as object, headers: { ...auth, ...headers } }),
        patch: (url, payload = {}) => app.inject({ method: 'PATCH', url, payload: payload as object, headers: auth }),
      };
    },
    async close() {
      await app.close();
      await appDb.end();
      await owner.end();
      const a = new pg.Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`);
      await a.query(`DROP ROLE IF EXISTS ${appUser}`);
      await a.end();
    },
  };
}

/** Adds a user with a role and (optionally) site access, then sets a password. */
export async function addUser(
  owner: pg.Client,
  opts: { tenantId: string; orgId: string; tenantCode: string; username: string; role: string; siteIds?: string[]; password: string }
): Promise<string> {
  const { rows } = await owner.query<{ user_id: string }>(
    `INSERT INTO users (tenant_id, organization_id, username, email, full_name) VALUES ($1, $2, $3, $4, $5) RETURNING user_id`,
    [opts.tenantId, opts.orgId, opts.username, `${opts.username}@example.test`, opts.username]
  );
  const userId = rows[0].user_id;
  for (const [i, siteId] of (opts.siteIds ?? []).entries()) {
    await owner.query('INSERT INTO user_site_access (user_id, site_id, tenant_id, is_default) VALUES ($1, $2, $3, $4)', [userId, siteId, opts.tenantId, i === 0]);
  }
  await setUserPassword(owner, opts.tenantCode, opts.username, opts.password, opts.role);
  return userId;
}
