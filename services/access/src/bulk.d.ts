import type { UserContext } from '@vms/types';
import { type PermissionAction } from '@vms/permissions';
export interface BulkItem<T> {
    id: string;
    tenantId: string;
    siteId?: string;
    ownerId?: string;
    payload: T;
}
export interface BulkExecutionResult<T, R> {
    processedCount: number;
    results: Array<{
        id: string;
        success: boolean;
        result?: R;
        error?: string;
    }>;
}
export declare class BulkOperationSecurityValidator {
    /**
     * Enforces that bulk operations cannot bypass individual item-level business and security rules.
     * Every item in the batch is evaluated against tenant boundaries, site permissions, and ABAC rules.
     */
    static executeBulk<T, R>(user: UserContext, action: PermissionAction, items: Array<BulkItem<T>>, processor: (item: BulkItem<T>) => Promise<R> | R): Promise<BulkExecutionResult<T, R>>;
}
