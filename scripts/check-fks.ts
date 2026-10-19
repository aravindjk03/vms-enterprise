import { readFileSync } from 'node:fs';

const sql = readFileSync('./packages/database/migrations/001_initial_schema.sql', 'utf-8');

// Find all CREATE TABLE statements in order
const tableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
const createdTables = new Set<string>();
const forwardRefs: Array<{ table: string; col: string; refTable: string }> = [];

let match: RegExpExecArray | null;
while ((match = tableRegex.exec(sql)) !== null) {
  const table = match[1].toLowerCase();
  const body = match[2];

  const fkRegex = /([a-zA-Z0-9_]+)\s+[^,]+REFERENCES\s+([a-zA-Z0-9_]+)\s*\(/gi;
  let fkMatch: RegExpExecArray | null;
  while ((fkMatch = fkRegex.exec(body)) !== null) {
    const col = fkMatch[1].trim();
    const refTable = fkMatch[2].toLowerCase();
    if (!createdTables.has(refTable)) {
      forwardRefs.push({ table, col, refTable });
    }
  }

  createdTables.add(table);
}

console.log('Forward references in CREATE TABLE order:');
console.log(JSON.stringify(forwardRefs, null, 2));

// Also check for ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
const alterFkRegex = /ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+CONSTRAINT\s+([a-zA-Z0-9_]+)\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z0-9_]+)/gi;
const alterFks: Array<{ table: string; fk: string; target: string }> = [];
while ((match = alterFkRegex.exec(sql)) !== null) {
  alterFks.push({ table: match[1], fk: match[2], target: match[4] });
}
console.log('ALTER TABLE FKs count:', alterFks.length);
