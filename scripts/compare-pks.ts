import { SchemaValidator } from '../packages/database/src/schema-validator.js';
import { RelationalDatabase } from '../packages/database/src/in-memory-db.js';

const validator = new SchemaValidator();
const schema = validator.validateFromFile('./packages/database/migrations/001_initial_schema.sql');
const db = new RelationalDatabase();

const mismatches: Array<{ table: string; schemaPk?: string; dbPk: string }> = [];

for (const [name, def] of (db as any).tables.entries()) {
  const schemaTable = schema.tables.get(name);
  if (!schemaTable) continue;
  if (schemaTable.primaryKey && schemaTable.primaryKey.toLowerCase() !== def.primaryKey.toLowerCase()) {
    mismatches.push({
      table: name,
      schemaPk: schemaTable.primaryKey,
      dbPk: def.primaryKey,
    });
  }
}

console.log('PK mismatches between SQL schema and in-memory-db:');
console.log(JSON.stringify(mismatches, null, 2));
