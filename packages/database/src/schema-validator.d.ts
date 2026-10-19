/**
 * VMS Enterprise: SQL DDL Schema Parser & Architectural Validator
 * Inspects SQL migrations, validates table structures, constraints, indexes & RLS policies
 */
export interface ParsedTable {
    name: string;
    columns: Array<{
        name: string;
        type: string;
        nullable: boolean;
        isPrimaryKey: boolean;
    }>;
    primaryKey?: string;
    foreignKeys: Array<{
        column: string;
        targetTable: string;
        targetColumn: string;
    }>;
    uniqueConstraints: string[][];
    checkConstraints: string[];
}
export interface ParsedSchema {
    tables: Map<string, ParsedTable>;
    indexes: Array<{
        name: string;
        table: string;
        columns: string[];
    }>;
    rlsTables: string[];
    policies: Array<{
        name: string;
        table: string;
    }>;
    views: string[];
}
export declare class SchemaValidator {
    parseSql(sqlContent: string): ParsedSchema;
    validateFromFile(filePath: string): ParsedSchema;
    private splitSqlClauses;
}
