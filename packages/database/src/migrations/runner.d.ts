/**
 * VMS Enterprise: Migration Runner & Seed Data Initializer
 * Coordinates SQL DDL migration parsing, schema verification, and deterministic seed loading
 */
import { RelationalDatabase } from '../in-memory-db.js';
import { type ParsedSchema } from '../schema-validator.js';
export interface MigrationStatus {
    applied: boolean;
    tableCount: number;
    seedRowCount: number;
    schemaVersion: string;
    appliedAt?: Date;
}
export declare class MigrationRunner {
    private db;
    private schemaValidator;
    constructor(db: RelationalDatabase);
    /**
     * Resets the database to clean slate
     */
    resetDatabase(): void;
    /**
     * Executes initial schema validation and seeds deterministic data
     */
    runMigrations(): Promise<{
        schema: ParsedSchema;
        seedCount: number;
    }>;
    /**
     * Verifies current migration status and entity counts
     */
    verifyMigrationStatus(): MigrationStatus;
    /**
     * Parses and executes SQL statements statement-by-statement into RelationalDatabase
     */
    applySeedsFromSql(sqlContent: string): number;
    /**
     * Splits SQL script into discrete statements, respecting single-quoted strings
     */
    private splitSqlStatements;
    /**
     * Parses multiple SQL value tuples e.g. ('val1', 123), ('val2', 456)
     */
    private parseValueTuples;
    /**
     * Casts raw SQL literal string into JavaScript types
     */
    private castSqlValue;
    /**
     * Resolves SQL file path across local development or built directory structure
     */
    private loadSqlFile;
}
