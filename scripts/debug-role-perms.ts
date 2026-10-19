import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';
import { MigrationRunner } from '../packages/database/src/migrations/runner.js';

const db = new RelationalDatabase();
const runner = new MigrationRunner(db);
await runner.runMigrations();

const rolePerms = db.findMany('role_permissions');
console.log('role_permissions rows:', rolePerms.length);
console.log('role_permissions sample:', rolePerms);
