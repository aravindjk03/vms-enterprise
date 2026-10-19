import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';
import { MigrationRunner } from '../packages/database/src/migrations/runner.js';

const db = new RelationalDatabase();
const runner = new MigrationRunner(db);
await runner.runMigrations();

console.log('users count:', db.count('users'));
console.log('user_roles count:', db.count('user_roles'));
console.log('all tables in db with counts:');
for (const t of db.getTableNames()) {
  const c = db.count(t);
  if (c > 0) {
    console.log(`  ${t}: ${c}`);
  }
}
