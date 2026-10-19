import { SchemaValidator } from '../packages/database/src/schema-validator.js';
import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';
import { MigrationRunner } from '../packages/database/src/migrations/runner.js';
import { readFileSync } from 'node:fs';

const validator = new SchemaValidator();
const schema = validator.validateFromFile('./packages/database/migrations/001_initial_schema.sql');
const db = new RelationalDatabase();

// Apply all parsed foreign keys to db
for (const [tableName, parsedTable] of schema.tables.entries()) {
  const existingDef = (db as any).tables.get(tableName);
  if (existingDef) {
    if (parsedTable.foreignKeys.length > 0) {
      existingDef.foreignKeys = parsedTable.foreignKeys.map(fk => ({
        columns: [fk.column],
        refTable: fk.targetTable,
        refColumns: [fk.targetColumn],
        onDelete: 'CASCADE' as const,
      }));
    }
  }
}

// Now run seeds from 002_seed_data.sql
const seedsSql = readFileSync('./packages/database/migrations/002_seed_data.sql', 'utf-8');
const runner = new MigrationRunner(db);

try {
  const count = runner.applySeedsFromSql(seedsSql);
  console.log('Successfully applied seeds with ALL foreign keys enforced! Count:', count);
} catch (err: any) {
  console.error('Failed to apply seeds:', err.message);
}
