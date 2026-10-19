/**
 * VMS Enterprise: SQL DDL Schema Parser & Architectural Validator
 * Inspects SQL migrations, validates table structures, constraints, indexes & RLS policies
 */
import { readFileSync } from 'node:fs';
export class SchemaValidator {
    parseSql(sqlContent) {
        const tables = new Map();
        const indexes = [];
        const rlsTables = [];
        const policies = [];
        const views = [];
        // Parse CREATE TABLE statements
        const createTableRegex = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s*\(([\s\S]*?)\);/gi;
        let match;
        while ((match = createTableRegex.exec(sqlContent)) !== null) {
            const tableName = match[1].toLowerCase();
            const body = match[2];
            const parsedTable = {
                name: tableName,
                columns: [],
                foreignKeys: [],
                uniqueConstraints: [],
                checkConstraints: [],
            };
            // Split lines by comma (handling nested parentheses if any)
            const lines = this.splitSqlClauses(body);
            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line)
                    continue;
                if (/^PRIMARY\s+KEY\s*\(([^)]+)\)/i.test(line)) {
                    const pkMatch = /^PRIMARY\s+KEY\s*\(([^)]+)\)/i.exec(line);
                    if (pkMatch) {
                        parsedTable.primaryKey = pkMatch[1].trim();
                    }
                }
                else if (/^CONSTRAINT\s+([a-zA-Z0-9_]+)\s+UNIQUE\s*\(([^)]+)\)/i.test(line) || /^UNIQUE\s*\(([^)]+)\)/i.test(line)) {
                    const uqMatch = /\(([^)]+)\)/i.exec(line);
                    if (uqMatch) {
                        const cols = uqMatch[1].split(',').map(c => c.trim().toLowerCase());
                        parsedTable.uniqueConstraints.push(cols);
                    }
                }
                else if (/^CONSTRAINT\s+([a-zA-Z0-9_]+)\s+CHECK\s*\(([\s\S]+)\)/i.test(line) || /^CHECK\s*\(([\s\S]+)\)/i.test(line)) {
                    parsedTable.checkConstraints.push(line);
                }
                else if (/^FOREIGN\s+KEY/i.test(line)) {
                    // Explicit table-level FK
                }
                else {
                    // Column definition
                    const colParts = line.split(/\s+/);
                    const colName = colParts[0].toLowerCase();
                    const colType = colParts[1] ? colParts[1].toUpperCase() : 'UNKNOWN';
                    const isPk = /PRIMARY\s+KEY/i.test(line);
                    const nullable = !/NOT\s+NULL/i.test(line);
                    parsedTable.columns.push({
                        name: colName,
                        type: colType,
                        nullable,
                        isPrimaryKey: isPk,
                    });
                    if (isPk) {
                        parsedTable.primaryKey = colName;
                    }
                    if (/REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i.test(line)) {
                        const fkMatch = /REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i.exec(line);
                        if (fkMatch) {
                            parsedTable.foreignKeys.push({
                                column: colName,
                                targetTable: fkMatch[1].toLowerCase(),
                                targetColumn: fkMatch[2].toLowerCase(),
                            });
                        }
                    }
                }
            }
            tables.set(tableName, parsedTable);
        }
        // Parse ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY
        const alterFkRegex = /ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+CONSTRAINT\s+([a-zA-Z0-9_]+)\s+FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([^)]+)\)/gi;
        let alterMatch;
        while ((alterMatch = alterFkRegex.exec(sqlContent)) !== null) {
            const tableName = alterMatch[1].toLowerCase();
            const colName = alterMatch[3].trim().toLowerCase();
            const targetTable = alterMatch[4].toLowerCase();
            const targetCol = alterMatch[5].trim().toLowerCase();
            const table = tables.get(tableName);
            if (table) {
                table.foreignKeys.push({
                    column: colName,
                    targetTable,
                    targetColumn: targetCol,
                });
            }
        }
        // Parse CREATE INDEX
        const createIndexRegex = /CREATE\s+INDEX(?:\s+IF\s+NOT\s+EXISTS)?\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)\s*(?:USING\s+[a-zA-Z0-9_]+\s*)?\(([^)]+)\)(?:\s+INCLUDE\s*\([^)]+\))?(?:\s+WHERE\s+[^;]+)?;/gi;
        while ((match = createIndexRegex.exec(sqlContent)) !== null) {
            indexes.push({
                name: match[1],
                table: match[2].toLowerCase(),
                columns: match[3].split(',').map(c => c.trim()),
            });
        }
        // Parse ROW LEVEL SECURITY enablements
        const rlsRegex = /ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;/gi;
        while ((match = rlsRegex.exec(sqlContent)) !== null) {
            rlsTables.push(match[1].toLowerCase());
        }
        // Parse CREATE POLICY
        const policyRegex = /CREATE\s+POLICY\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)/gi;
        while ((match = policyRegex.exec(sqlContent)) !== null) {
            policies.push({
                name: match[1],
                table: match[2].toLowerCase(),
            });
        }
        // Parse CREATE VIEW
        const viewRegex = /CREATE(?:\s+OR\s+REPLACE)?\s+VIEW\s+([a-zA-Z0-9_]+)\s+AS/gi;
        while ((match = viewRegex.exec(sqlContent)) !== null) {
            views.push(match[1].toLowerCase());
        }
        return { tables, indexes, rlsTables, policies, views };
    }
    validateFromFile(filePath) {
        const content = readFileSync(filePath, 'utf-8');
        return this.parseSql(content);
    }
    splitSqlClauses(body) {
        const clauses = [];
        let current = '';
        let depth = 0;
        for (let i = 0; i < body.length; i++) {
            const char = body[i];
            if (char === '(')
                depth++;
            else if (char === ')')
                depth--;
            if (char === ',' && depth === 0) {
                clauses.push(current.trim());
                current = '';
            }
            else {
                current += char;
            }
        }
        if (current.trim()) {
            clauses.push(current.trim());
        }
        return clauses;
    }
}
