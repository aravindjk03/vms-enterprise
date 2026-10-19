import { SchemaValidator } from '../packages/database/src/schema-validator.js';
import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';
import { MigrationRunner } from '../packages/database/src/migrations/runner.js';
import { readFileSync } from 'node:fs';

const validator = new SchemaValidator();
const schema = validator.validateFromFile('./packages/database/migrations/001_initial_schema.sql');
const db = new RelationalDatabase();

const seedsSql = readFileSync('./packages/database/migrations/002_seed_data.sql', 'utf-8');
const runner = new MigrationRunner(db);

// Intercept insert calls
const origInsert = db.insert.bind(db);
db.insert = function(table: string, row: any, override?: string) {
  if (table === 'users') {
    console.log('Inserting user:', row.user_id, row.username);
  }
  return origInsert(table, row, override);
};

// Check parsed tuples for users
const insertRegex = /INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT[\s\S]*?)?;/gi;
let match: RegExpExecArray | null;
while ((match = insertRegex.exec(seedsSql)) !== null) {
  const tableName = match[1].trim().toLowerCase();
  if (tableName === 'users') {
    console.log('Matched users INSERT statement!');
    console.log('Columns:', match[2].trim());
    console.log('Values snippet:', match[3].substring(0, 150));
  }
}
