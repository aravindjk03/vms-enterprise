/**
 * VMS Enterprise: Migration Runner & Seed Data Initializer
 * Coordinates SQL DDL migration parsing, schema verification, and deterministic seed loading
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RelationalDatabase } from '../in-memory-db.js';
import { SchemaValidator, type ParsedSchema } from '../schema-validator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MigrationStatus {
  applied: boolean;
  tableCount: number;
  seedRowCount: number;
  schemaVersion: string;
  appliedAt?: Date;
}

export class MigrationRunner {
  private schemaValidator: SchemaValidator;

  constructor(private db: RelationalDatabase) {
    this.schemaValidator = new SchemaValidator();
  }

  /**
   * Resets the database to clean slate
   */
  public resetDatabase(): void {
    this.db.reset();
  }

  /**
   * Executes initial schema validation and seeds deterministic data
   */
  public async runMigrations(): Promise<{ schema: ParsedSchema; seedCount: number }> {
    // 1. Locate and read SQL migration files (prioritize canonical migrations/ directory)
    const schemaSql = this.loadSqlFile(['../../migrations/001_initial_schema.sql', '../schema.sql']);
    const seedsSql = this.loadSqlFile(['../../migrations/002_seed_data.sql', '../seeds.sql']);

    // 2. Validate DDL against architectural requirements
    const parsedSchema = this.schemaValidator.parseSql(schemaSql);

    // 3. Register parsed foreign keys and constraints into RelationalDatabase
    for (const [tableName, parsedTable] of parsedSchema.tables.entries()) {
      const existingDef = (this.db as any).tables.get(tableName.toLowerCase());
      if (existingDef) {
        if (parsedTable.foreignKeys && parsedTable.foreignKeys.length > 0) {
          existingDef.foreignKeys = parsedTable.foreignKeys.map(fk => ({
            columns: [fk.column],
            refTable: fk.targetTable,
            refColumns: [fk.targetColumn],
            onDelete: 'CASCADE' as const,
          }));
        }
      }
    }

    // 4. Populate deterministic seed dataset
    let seedCount = this.applySeedsFromSql(seedsSql);
    try {
      const part7Sql = this.loadSqlFile(['../../migrations/004_part7_customer_domain.sql', '../migrations/004_part7_customer_domain.sql']);
      seedCount += this.applySeedsFromSql(part7Sql);
    } catch {
      // Optional migration
    }
    try {
      const part8Sql = this.loadSqlFile(['../../migrations/005_part8_contractor_domain.sql', '../migrations/005_part8_contractor_domain.sql']);
      seedCount += this.applySeedsFromSql(part8Sql);
    } catch {
      // Optional migration
    }

    return {
      schema: parsedSchema,
      seedCount,
    };
  }

  /**
   * Verifies current migration status and entity counts
   */
  public verifyMigrationStatus(): MigrationStatus {
    const tableNames = this.db.getTableNames();
    let totalRows = 0;

    for (const tableName of tableNames) {
      try {
        totalRows += this.db.count(tableName);
      } catch {
        // Ignore table access errors during status check
      }
    }

    return {
      applied: tableNames.length > 50 && totalRows > 0,
      tableCount: tableNames.length,
      seedRowCount: totalRows,
      schemaVersion: '1.0.0-PostgreSQL-16',
      appliedAt: new Date(),
    };
  }

  /**
   * Parses and executes SQL statements statement-by-statement into RelationalDatabase
   */
  public applySeedsFromSql(sqlContent: string): number {
    let insertedRows = 0;
    const statements = this.splitSqlStatements(sqlContent);

    for (const rawStmt of statements) {
      const stmt = rawStmt.replace(/--[^\r\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
      if (!stmt) continue;

      // Match INSERT INTO table_name (columns) VALUES (values);
      const insertValuesMatch = /^INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\)\s*VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT[\s\S]*?)?$/i.exec(stmt);
      if (insertValuesMatch) {
        const tableName = insertValuesMatch[1].trim().toLowerCase();
        const rawColumns = insertValuesMatch[2];
        const rawValues = insertValuesMatch[3];

        const columns = rawColumns
          .split(',')
          .map(c => c.trim().toLowerCase())
          .filter(c => c.length > 0);

        const tupleRows = this.parseValueTuples(rawValues);

        for (const rowValues of tupleRows) {
          if (rowValues.length !== columns.length) {
            continue;
          }

          const rowRecord: Record<string, any> = {};
          for (let i = 0; i < columns.length; i++) {
            rowRecord[columns[i]] = rowValues[i];
          }

          try {
            this.db.insert(tableName, rowRecord);
            insertedRows++;
          } catch (err: any) {
            // Handle ON CONFLICT DO NOTHING: ignore duplicate primary/unique key conflicts
            if (
              err &&
              typeof err.message === 'string' &&
              (err.message.includes('Primary key violation') || err.message.includes('Unique constraint violation'))
            ) {
              continue;
            }
            throw err;
          }
        }
      }
    }

    return insertedRows;
  }

  /**
   * Splits SQL script into discrete statements, respecting single-quoted strings
   */
  private splitSqlStatements(sql: string): string[] {
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

  /**
   * Parses multiple SQL value tuples e.g. ('val1', 123), ('val2', 456)
   */
  private parseValueTuples(rawValues: string): any[][] {
    const tuples: any[][] = [];
    let inTuple = false;
    let inString = false;
    let wasQuoted = false;
    let currentToken = '';
    let currentTuple: any[] = [];

    for (let i = 0; i < rawValues.length; i++) {
      const char = rawValues[i];
      const prevChar = i > 0 ? rawValues[i - 1] : '';

      if (char === "'" && prevChar !== '\\') {
        inString = !inString;
        wasQuoted = true;
        continue;
      }

      if (inString) {
        currentToken += char;
        continue;
      }

      if (char === '(' && !inTuple) {
        inTuple = true;
        currentTuple = [];
        currentToken = '';
        wasQuoted = false;
        continue;
      }

      if (char === ')' && inTuple) {
        if (currentToken.trim().length > 0 || wasQuoted || currentTuple.length > 0) {
          currentTuple.push(this.castSqlValue(currentToken.trim(), wasQuoted));
          currentToken = '';
          wasQuoted = false;
        }
        tuples.push(currentTuple);
        currentTuple = [];
        inTuple = false;
        continue;
      }

      if (char === ',' && inTuple) {
        currentTuple.push(this.castSqlValue(currentToken.trim(), wasQuoted));
        currentToken = '';
        wasQuoted = false;
        continue;
      }

      if (inTuple) {
        currentToken += char;
      }
    }

    return tuples;
  }

  /**
   * Casts raw SQL literal string into JavaScript types
   */
  private castSqlValue(raw: string, wasQuoted = false): any {
    if (wasQuoted) {
      if (raw === '{}' || raw.includes('{}::JSONB')) {
        return {};
      }
      return raw;
    }
    if (raw === '' || raw.toUpperCase() === 'NULL') {
      return null;
    }
    if (raw.toUpperCase() === 'TRUE') {
      return true;
    }
    if (raw.toUpperCase() === 'FALSE') {
      return false;
    }
    if (raw.toUpperCase() === 'CURRENT_TIMESTAMP' || raw.toUpperCase() === 'NOW()') {
      return new Date();
    }
    // Check if numeric
    if (!Number.isNaN(Number(raw)) && !/^0\d+/.test(raw) && raw.length > 0) {
      return Number(raw);
    }
    return raw;
  }

  /**
   * Resolves SQL file path across local development or built directory structure
   */
  private loadSqlFile(relativeCandidates: string[]): string {
    for (const candidate of relativeCandidates) {
      const fullPath = resolve(__dirname, candidate);
      if (existsSync(fullPath)) {
        return readFileSync(fullPath, 'utf-8');
      }
    }
    throw new Error(`Unable to resolve SQL file from candidates: ${relativeCandidates.join(', ')}`);
  }
}
