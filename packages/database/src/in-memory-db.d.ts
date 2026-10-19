/**
 * VMS Enterprise: In-Memory Relational PostgreSQL Simulation Engine
 * Enforces: Multi-Tenant RLS, Foreign Keys, Uniqueness, Immutability & ACID Transactions
 */
export interface DatabaseConstraint {
    name: string;
    type: 'PRIMARY_KEY' | 'UNIQUE' | 'FOREIGN_KEY' | 'CHECK';
    columns: string[];
    refTable?: string;
    refColumns?: string[];
    onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL';
    checkFn?: (row: any) => boolean;
}
export interface TableDefinition {
    name: string;
    primaryKey: string | string[];
    tenantScoped: boolean;
    tenantColumn?: string;
    isImmutable?: boolean;
    uniqueKeys?: string[][];
    foreignKeys?: Array<{
        columns: string[];
        refTable: string;
        refColumns: string[];
        onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL';
    }>;
}
export declare class RelationalDatabase {
    private tables;
    private data;
    private transactionSnapshots;
    private currentTenantId;
    constructor();
    getPkCols(table: TableDefinition): string[];
    getRowPkValue(table: TableDefinition, row: Record<string, any>): string;
    setTenantContext(tenantId: string | null): void;
    getTenantContext(): string | null;
    registerTable(def: TableDefinition): void;
    getTableNames(): string[];
    hasTable(name: string): boolean;
    reset(): void;
    beginTransaction(): void;
    commit(): void;
    rollback(): void;
    insert<T extends Record<string, any>>(tableName: string, row: T, tenantIdOverride?: string): T;
    findById<T = Record<string, any>>(tableName: string, id: string, tenantIdOverride?: string): T | null;
    findMany<T = Record<string, any>>(tableName: string, filter?: Record<string, any>, tenantIdOverride?: string): T[];
    update<T = Record<string, any>>(tableName: string, id: string, updates: Partial<T>, tenantIdOverride?: string): T;
    delete(tableName: string, id: string, tenantIdOverride?: string): boolean;
    count(tableName: string, filter?: Record<string, any>, tenantIdOverride?: string): number;
    private handleCascades;
    private resolveTable;
    private registerSchema;
}
