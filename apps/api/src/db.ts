import pg from 'pg';
import type { ApiConfig } from './config.js';

// DATE columns are calendar dates, not instants. Returned as 'YYYY-MM-DD' text so they never shift a
// day when serialized through a JavaScript Date in another time zone.
pg.types.setTypeParser(pg.types.builtins.DATE, (value: string) => value);

export type Db = pg.Pool;
export type Tx = pg.PoolClient;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

export function createPool(config: ApiConfig): Db {
  return new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: true } : undefined,
    max: Number.parseInt(process.env['DATABASE_POOL_MAX'] || '20', 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    application_name: 'vms-api',
  });
}

/**
 * Runs `fn` in a transaction bound to one tenant. `app.current_tenant_id` is set with
 * transaction scope (set_config(..., true)), so it can never leak to the next request
 * that reuses the pooled connection; row-level security does the rest.
 */
export async function withTenant<T>(db: Db, tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  if (!isUuid(tenantId)) {
    throw new Error('Invalid tenant context.');
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT set_config('app.current_tenant_id', $1, true)", [tenantId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Refuses to serve traffic through a role that would silently bypass tenant isolation
 * (superuser, BYPASSRLS, or the owner of the tenant tables).
 */
export async function assertRuntimeRoleIsRestricted(db: Db, allowPrivileged: boolean): Promise<string | null> {
  const { rows } = await db.query<{ rolname: string; rolsuper: boolean; rolbypassrls: boolean; owns_tables: boolean }>(`
    SELECT r.rolname, r.rolsuper, r.rolbypassrls,
           EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'visitor_transactions'
                   AND tableowner = current_user) AS owns_tables
    FROM pg_roles r WHERE r.rolname = current_user`);
  const role = rows[0];
  const problem = !role
    ? 'could not resolve current database role'
    : role.rolsuper
      ? `role '${role.rolname}' is a superuser`
      : role.rolbypassrls
        ? `role '${role.rolname}' has BYPASSRLS`
        : role.owns_tables
          ? `role '${role.rolname}' owns the schema tables (RLS does not apply to owners)`
          : null;
  if (problem && !allowPrivileged) {
    throw new Error(
      `Refusing to start: ${problem}. Connect DATABASE_URL as a member of 'vms_app' ` +
        '(npm run db:migrate -- --create-app-user).'
    );
  }
  return problem;
}

export async function pendingMigrations(db: Db, expectedVersions: string[]): Promise<string[]> {
  const { rows } = await db
    .query<{ version: string }>('SELECT version FROM schema_migrations')
    .catch(() => ({ rows: [] as { version: string }[] }));
  const applied = new Set(rows.map(r => r.version));
  return expectedVersions.filter(v => !applied.has(v));
}
