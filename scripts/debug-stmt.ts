import { readFileSync } from 'node:fs';

const seedsSql = readFileSync('./packages/database/migrations/002_seed_data.sql', 'utf-8');

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inString = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prev = i > 0 ? sql[i - 1] : '';

    if (char === "'" && prev !== '\\') {
      inString = !inString;
    }

    if (char === ';' && !inString) {
      if (current.trim().length > 0) {
        statements.push(current.trim());
      }
      current = '';
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    statements.push(current.trim());
  }

  return statements;
}

const stmts = splitSqlStatements(seedsSql);
console.log('Total statements:', stmts.length);
console.log('First statement raw:', stmts[0]);

function cleanStatement(s: string): string {
  // Remove single line comments and multi-line comments
  return s.replace(/--[^\r\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
}

console.log('First statement cleaned:', cleanStatement(stmts[0]));
const m = /^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT[\s\S]*?)?$/i.exec(cleanStatement(stmts[0]));
console.log('Matched?', !!m);
if (m) {
  console.log('Table:', m[1]);
}
