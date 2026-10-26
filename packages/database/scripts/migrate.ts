/**
 * VMS Enterprise: PostgreSQL migration runner
 *
 *   npm run db:migrate                       apply pending migrations
 *   npm run db:migrate -- --status           list applied / pending migrations
 *   npm run db:migrate -- --create-app-user  also create/rotate the runtime LOGIN role
 *
 * Connection: MIGRATION_DATABASE_URL (schema owner / superuser), falling back to DATABASE_URL.
 * Runtime role: APP_DB_USER / APP_DB_PASSWORD, granted membership of `vms_app` (RLS-enforced).
 *
 * Every migration runs in its own transaction and is recorded in `schema_migrations`
 * with a SHA-256 checksum; editing an already-applied file is refused (drift detection).
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations');
const LOCK_KEY = 7_315_550_001; // pg_advisory_lock key reserved for VMS migrations

export interface MigrationFile {
  version: string;
  name: string;
  sql: string;
  checksum: string;
}

export function loadMigrationFiles(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  return readdirSync(dir)
    .filter(f => /^\d{3}_[a-z0-9_]+\.sql$/.test(f))
    .sort()
    .map(f => {
      const sql = readFileSync(join(dir, f), 'utf-8');
      return {
        version: f.slice(0, 3),
        name: f,
        sql,
        checksum: createHash('sha256').update(sql).digest('hex'),
      };
    });
}

export interface MigrationReport {
  applied: string[];
  alreadyApplied: string[];
}

export async function runMigrations(client: pg.ClientBase, log: (msg: string) => void = console.log): Promise<MigrationReport> {
  await client.query('SELECT pg_advisory_lock($1)', [LOCK_KEY]);
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(16) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        checksum CHAR(64) NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`);

    const { rows } = await client.query<{ version: string; name: string; checksum: string }>(
      'SELECT version, name, checksum FROM schema_migrations ORDER BY version'
    );
    const applied = new Map(rows.map(r => [r.version, r]));
    const report: MigrationReport = { applied: [], alreadyApplied: [] };

    for (const migration of loadMigrationFiles()) {
      const existing = applied.get(migration.version);
      if (existing) {
        if (existing.checksum !== migration.checksum) {
          throw new Error(
            `Migration drift: ${migration.name} was modified after being applied ` +
              `(recorded ${existing.checksum.slice(0, 12)}, file ${migration.checksum.slice(0, 12)}). ` +
              'Add a new migration instead of editing an applied one.'
          );
        }
        report.alreadyApplied.push(migration.name);
        continue;
      }

      log(`→ applying ${migration.name}`);
      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)', [
          migration.version,
          migration.name,
          migration.checksum,
        ]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${migration.name} failed: ${(err as Error).message}`);
      }
      report.applied.push(migration.name);
    }
    return report;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [LOCK_KEY]);
  }
}

/** Creates (or rotates the password of) the runtime LOGIN role and adds it to `vms_app`. */
export async function ensureAppUser(client: pg.ClientBase, username: string, password: string): Promise<void> {
  if (!/^[a-z_][a-z0-9_]{2,62}$/.test(username)) {
    throw new Error('APP_DB_USER must be a lowercase identifier (letters, digits, underscore).');
  }
  if (password.length < 16) {
    throw new Error('APP_DB_PASSWORD must be at least 16 characters.');
  }
  const ident = client.escapeIdentifier(username);
  const literal = client.escapeLiteral(password);
  const { rowCount } = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [username]);
  if (rowCount) {
    await client.query(`ALTER ROLE ${ident} WITH LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD ${literal}`);
  } else {
    await client.query(`CREATE ROLE ${ident} WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS PASSWORD ${literal}`);
  }
  await client.query(`GRANT vms_app TO ${ident}`);
}

async function main(): Promise<void> {
  const args = new Set(process.argv.slice(2));
  const connectionString = process.env['MIGRATION_DATABASE_URL'] || process.env['DATABASE_URL'];
  if (!connectionString) {
    throw new Error('Set MIGRATION_DATABASE_URL (or DATABASE_URL) to the schema owner connection string.');
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    if (args.has('--status')) {
      const files = loadMigrationFiles();
      const { rows } = await client
        .query<{ version: string; applied_at: Date }>('SELECT version, applied_at FROM schema_migrations')
        .catch(() => ({ rows: [] as { version: string; applied_at: Date }[] }));
      const applied = new Map(rows.map(r => [r.version, r.applied_at]));
      for (const f of files) {
        const at = applied.get(f.version);
        console.log(`${at ? 'applied ' : 'PENDING '} ${f.name}${at ? `  (${at.toISOString()})` : ''}`);
      }
      return;
    }

    const report = await runMigrations(client);
    console.log(
      report.applied.length
        ? `✓ applied ${report.applied.length} migration(s); ${report.alreadyApplied.length} already up to date`
        : `✓ database up to date (${report.alreadyApplied.length} migrations)`
    );

    if (args.has('--create-app-user')) {
      const user = process.env['APP_DB_USER'];
      const password = process.env['APP_DB_PASSWORD'];
      if (!user || !password) {
        throw new Error('--create-app-user requires APP_DB_USER and APP_DB_PASSWORD.');
      }
      await ensureAppUser(client, user, password);
      console.log(`✓ runtime role '${user}' is a member of vms_app (RLS enforced)`);
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch(err => {
    console.error(`✗ ${(err as Error).message}`);
    process.exit(1);
  });
}
