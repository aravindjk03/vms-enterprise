/**
 * VMS Enterprise: set a user's sign-in password (and optionally grant a role).
 *
 *   BOOTSTRAP_PASSWORD='…' npm run db:bootstrap-user -- --tenant GLOBAL-MFG --username admin.detroit [--role SUPER_ADMIN]
 *
 * Runs with the migration (schema owner) connection because it writes credentials for a
 * tenant before anyone from that tenant can sign in. The password is read from the
 * environment, never from argv, so it does not land in shell history or process listings.
 */
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { PasswordSecurityService } from '../../../services/identity/src/password.js';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(`--${name}`);
  return idx > -1 ? process.argv[idx + 1] : undefined;
}

export async function setUserPassword(
  client: pg.ClientBase,
  tenantCode: string,
  username: string,
  password: string,
  role?: string
): Promise<{ userId: string; tenantId: string }> {
  const passwords = new PasswordSecurityService();
  const policy = passwords.validatePolicy(password);
  if (!policy.isValid) {
    throw new Error(`Password rejected by policy: ${policy.errors.join('; ')}`);
  }

  const { rows } = await client.query<{ user_id: string; tenant_id: string }>(
    `SELECT u.user_id, u.tenant_id FROM users u JOIN tenants t ON t.tenant_id = u.tenant_id
      WHERE t.code = $1 AND u.username = $2::citext`,
    [tenantCode, username]
  );
  if (rows.length === 0) {
    throw new Error(`No user '${username}' in tenant '${tenantCode}'.`);
  }
  const { user_id: userId, tenant_id: tenantId } = rows[0];

  await client.query('BEGIN');
  try {
    await client.query(
      `INSERT INTO user_credentials (user_id, tenant_id, password_hash, must_change_password)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (user_id) DO UPDATE
         SET password_hash = EXCLUDED.password_hash, password_changed_at = CURRENT_TIMESTAMP,
             failed_attempts = 0, locked_until = NULL, updated_at = CURRENT_TIMESTAMP`,
      [userId, tenantId, passwords.hashPassword(password)]
    );
    await client.query(
      `INSERT INTO user_password_history (tenant_id, user_id, password_hash, reason)
       SELECT $1, $2, password_hash, 'BOOTSTRAP' FROM user_credentials WHERE user_id = $2`,
      [tenantId, userId]
    );
    // A password reset invalidates every existing session.
    await client.query('UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL', [userId]);

    if (role) {
      const roleRow = await client.query<{ role_id: string }>(
        'SELECT role_id FROM roles WHERE code = $1 AND (tenant_id = $2 OR tenant_id IS NULL) ORDER BY tenant_id NULLS LAST LIMIT 1',
        [role, tenantId]
      );
      if (roleRow.rows.length === 0) {
        throw new Error(`Role '${role}' does not exist for tenant '${tenantCode}'.`);
      }
      await client.query(
        `INSERT INTO user_roles (user_id, role_id, tenant_id)
         SELECT $1, $2, $3
         WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = $1 AND role_id = $2)`,
        [userId, roleRow.rows[0].role_id, tenantId]
      );
    }

    await client.query(
      `INSERT INTO audit_logs (tenant_id, actor_id, actor_role, action, entity_type, entity_id, source, reason)
       VALUES ($1, 'bootstrap-user', 'SYSTEM', 'CREDENTIAL_SET', 'USER', $2, 'CLI', $3)`,
      [tenantId, userId, role ? `role granted: ${role}` : null]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }
  return { userId, tenantId };
}

async function main(): Promise<void> {
  const tenant = arg('tenant');
  const username = arg('username');
  const role = arg('role');
  const password = process.env['BOOTSTRAP_PASSWORD'];
  const connectionString = process.env['MIGRATION_DATABASE_URL'] || process.env['DATABASE_URL'];
  if (!tenant || !username || !password || !connectionString) {
    throw new Error('Usage: BOOTSTRAP_PASSWORD=… MIGRATION_DATABASE_URL=… db:bootstrap-user -- --tenant CODE --username NAME [--role ROLE]');
  }

  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await setUserPassword(client, tenant, username, password, role);
    console.log(`✓ credentials set for ${username}@${tenant}${role ? ` with role ${role}` : ''}`);
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
