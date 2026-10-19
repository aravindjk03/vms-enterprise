import type { UserContext } from '@vms/types';
import { evaluateAccess, type PermissionAction } from '@vms/permissions';
import { SecurityError } from './errors.js';

export interface BulkItem<T> {
  id: string;
  tenantId: string;
  siteId?: string;
  ownerId?: string;
  payload: T;
}

export interface BulkExecutionResult<T, R> {
  processedCount: number;
  results: Array<{ id: string; success: boolean; result?: R; error?: string }>;
}

export class BulkOperationSecurityValidator {
  /**
   * Enforces that bulk operations cannot bypass individual item-level business and security rules.
   * Every item in the batch is evaluated against tenant boundaries, site permissions, and ABAC rules.
   */
  public static async executeBulk<T, R>(
    user: UserContext,
    action: PermissionAction,
    items: Array<BulkItem<T>>,
    processor: (item: BulkItem<T>) => Promise<R> | R
  ): Promise<BulkExecutionResult<T, R>> {
    const results: Array<{ id: string; success: boolean; result?: R; error?: string }> = [];

    for (const item of items) {
      // 1. Mandatory Tenant Boundary Check per item
      if (item.tenantId !== user.tenantId && user.role !== 'SUPER_ADMIN') {
        results.push({
          id: item.id,
          success: false,
          error: 'Cross-tenant bulk modification prohibited.',
        });
        continue;
      }

      // 2. ABAC & Site Scoping per item
      const decision = evaluateAccess(user, action, {
        tenantId: item.tenantId,
        siteId: item.siteId,
        ownerId: item.ownerId,
      });

      if (!decision.allowed) {
        results.push({
          id: item.id,
          success: false,
          error: decision.reason || 'Authorization denied for bulk target item.',
        });
        continue;
      }

      try {
        const res = await processor(item);
        results.push({ id: item.id, success: true, result: res });
      } catch (err: any) {
        results.push({ id: item.id, success: false, error: err?.message || 'Processing failed' });
      }
    }

    return {
      processedCount: results.length,
      results,
    };
  }
}
