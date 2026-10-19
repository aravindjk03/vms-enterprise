import type { StandardApiError } from '@vms/types';
export declare class SecurityError extends Error {
    readonly code: StandardApiError['code'];
    readonly statusCode: number;
    readonly details?: Record<string, unknown> | undefined;
    constructor(code: StandardApiError['code'], message: string, statusCode?: number, details?: Record<string, unknown> | undefined);
}
export declare class SafeErrorHandler {
    /**
     * Sanitizes any server error into a standardized, leak-free API response.
     * Eliminates database queries, stack traces, paths, or secret leakage.
     */
    static toSafeResponse(err: unknown, requestId: string): {
        statusCode: number;
        body: StandardApiError;
    };
}
