import type { UserContext, UserSession, AuditRecord, StandardApiError, DataClassificationLevel } from '@vms/types';
import { type PermissionAction } from '@vms/permissions';
import { RateLimiter, type RateLimitCategory } from './rate-limiter.js';
import { SessionSecurityService } from '@vms/identity';
export interface RequestEnvelope<TBody = Record<string, unknown>> {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers: Record<string, string>;
    sessionId?: string;
    clientIp?: string;
    body?: TBody;
    category?: RateLimitCategory;
}
export interface SecurityGatewayResponse<TData = unknown> {
    statusCode: number;
    requestId: string;
    correlationId: string;
    headers: Record<string, string>;
    data?: TData;
    error?: StandardApiError;
}
export interface ProtectedRouteContext {
    requiredPermission: PermissionAction;
    targetResourceId?: string;
    targetTenantId?: string;
    targetSiteId?: string;
    targetOwnerId?: string;
    classification?: DataClassificationLevel;
    requiresSegregationOfDuties?: boolean;
}
export declare class SecurityGateway {
    private sessionService;
    private rateLimiter;
    private auditLogger?;
    private static requestCounter;
    constructor(sessionService: SessionSecurityService, rateLimiter?: RateLimiter, auditLogger?: ((record: AuditRecord) => void) | undefined);
    /**
     * Generates a standard enterprise correlation/request ID (e.g. REQ-2026-001001)
     */
    generateRequestId(): string;
    /**
     * Primary Enterprise Request Pipeline:
     * 1. Assign Request ID & Correlation ID
     * 2. Rate Limit & Brute Force Check
     * 3. Session Validation & Extraction
     * 4. Identity & Tenant Context Derivation (Never trust client-supplied tenant_id!)
     * 5. RBAC & ABAC Policy Authorization (including site scoping and segregation of duties)
     * 6. Resource Ownership & Boundary Check
     * 7. Business Logic Execution
     * 8. Privacy-by-Design Data Masking
     * 9. Forensic Audit Logging
     */
    handleRequest<TBody extends Record<string, unknown>, TResult extends Record<string, unknown>>(req: RequestEnvelope<TBody>, routeContext: ProtectedRouteContext, userContextLookup: (session: UserSession) => Promise<UserContext | null>, handler: (authenticatedUser: UserContext, safeBody: TBody, requestId: string) => Promise<TResult>): Promise<SecurityGatewayResponse<TResult>>;
}
