import { readFileSync } from 'node:fs';

const sql = readFileSync('./packages/database/migrations/001_initial_schema.sql', 'utf-8');

const tableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
let match: RegExpExecArray | null;

const unconstrainedFks: Array<{ table: string; column: string; line: string }> = [];

while ((match = tableRegex.exec(sql)) !== null) {
  const table = match[1].toLowerCase();
  const body = match[2];

  const lines = body.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('--') || line.startsWith('CONSTRAINT') || line.startsWith('PRIMARY KEY') || line.startsWith('UNIQUE')) continue;

    // Check if column ends in _id and is not the PK of this table
    const colMatch = /^([a-zA-Z0-9_]+_id)\s+/i.exec(line);
    if (colMatch) {
      const col = colMatch[1].toLowerCase();
      // If it has PRIMARY KEY, skip
      if (/PRIMARY\s+KEY/i.test(line)) continue;
      // If it has REFERENCES, skip
      if (/REFERENCES\s+/i.test(line)) continue;

      unconstrainedFks.push({ table, column: col, line });
    }
  }
}

console.log('Columns ending with _id without REFERENCES:');
console.log(JSON.stringify(unconstrainedFks, null, 2));
