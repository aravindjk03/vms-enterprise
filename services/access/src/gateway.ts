import { randomBytes } from 'node:crypto';
import type {
  UserContext,
  UserSession,
  AuditRecord,
  StandardApiError,
  DataClassificationLevel,
} from '@vms/types';
import { evaluateAccess, maskRecord, type PermissionAction } from '@vms/permissions';
import { RateLimiter, type RateLimitCategory } from './rate-limiter.js';
import { SafeErrorHandler, SecurityError } from './errors.js';
import { SecurityHeadersService } from './headers.js';
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

export class SecurityGateway {
  private static requestCounter = 1000;

  constructor(
    private sessionService: SessionSecurityService,
    private rateLimiter: RateLimiter = new RateLimiter(),
    private auditLogger?: (record: AuditRecord) => void
  ) {}

  /**
   * Generates a standard enterprise correlation/request ID (e.g. REQ-2026-001001)
   */
  public generateRequestId(): string {
    const year = new Date().getFullYear();
    const count = ++SecurityGateway.requestCounter;
    return `REQ-${year}-${String(count).padStart(6, '0')}`;
  }

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
  private audit(
    req: RequestEnvelope<Record<string, unknown>>,
    routeContext: ProtectedRouteContext,
    user: UserContext,
    requestId: string,
    correlationId: string,
    result: 'SUCCESS' | 'DENIED' | 'FAILED',
    reason?: string
  ): void {
    if (!this.auditLogger) return;
    this.auditLogger({
      auditId: `aud-${randomBytes(12).toString('hex')}`,
      tenantId: user.tenantId,
      actorUserId: user.userId,
      actorRoleContext: user.role,
      action: String(routeContext.requiredPermission),
      entityType: req.path.split('/')[2] || 'RESOURCE',
      entityId: routeContext.targetResourceId || 'GLOBAL',
      timestamp: new Date(),
      requestId,
      correlationId,
      source: 'API_GATEWAY',
      ipMetadata: req.clientIp,
      reason,
      result,
      hash: '',
    });
  }

  public async handleRequest<TBody extends Record<string, unknown>, TResult extends Record<string, unknown>>(
    req: RequestEnvelope<TBody>,
    routeContext: ProtectedRouteContext,
    userContextLookup: (session: UserSession) => Promise<UserContext | null>,
    handler: (authenticatedUser: UserContext, safeBody: TBody, requestId: string) => Promise<TResult>
  ): Promise<SecurityGatewayResponse<TResult>> {
    const requestId = this.generateRequestId();
    const suppliedCorrelationId = req.headers['x-correlation-id'];
    // Client-supplied correlation ids flow into the audit ledger, so only well-formed ids are kept.
    const correlationId =
      typeof suppliedCorrelationId === 'string' && /^[A-Za-z0-9._:-]{1,128}$/.test(suppliedCorrelationId)
        ? suppliedCorrelationId
        : requestId;
    let user: UserContext | null = null;
    const clientIdentifier = req.clientIp || '127.0.0.1';
    const securityHeaders = SecurityHeadersService.getHeaders();

    try {
      // Step 2: Rate Limit & Brute Force Check
      const rateResult = this.rateLimiter.checkRateLimit(clientIdentifier, req.category || 'DEFAULT');
      if (!rateResult.allowed) {
        throw new SecurityError(
          'RATE_LIMITED',
          `Too many requests. Please retry in ${rateResult.resetSeconds} seconds.`,
          429
        );
      }

      // Step 3: Session Authentication & Validation
      if (!req.sessionId) {
        throw new SecurityError('AUTHENTICATION_FAILED', 'Authentication session token required.', 401);
      }

      const sessionCheck = this.sessionService.validateSession(req.sessionId);
      if (!sessionCheck.valid || !sessionCheck.session) {
        throw new SecurityError('SESSION_EXPIRED', sessionCheck.reason || 'Session expired or revoked.', 401);
      }

      // Step 4: Resolve Authenticated User & Derive Tenant Context strictly from database
      user = await userContextLookup(sessionCheck.session);
      if (!user) {
        throw new SecurityError('AUTHENTICATION_FAILED', 'User identity could not be resolved.', 401);
      }

      // CRITICAL SECURITY RULE: Neutralize client-supplied tenant_id!
      // If the client submitted a body containing a tenantId or tenant_id, sanitize or reject it if it conflicts with authenticated context!
      // Every alias is validated (not just the first truthy one), otherwise
      // { tenantId: own, tenant_id: other } would smuggle a foreign tenant to the handler.
      const safeBody = { ...req.body } as TBody;
      const clientTenants = [safeBody['tenantId'], safeBody['tenant_id']].filter(v => v !== undefined && v !== null);
      if (clientTenants.some(t => t !== user!.tenantId)) {
        throw new SecurityError(
          'AUTHORIZATION_DENIED',
          'Direct manipulation of tenant_id prohibited: payload does not match authenticated context.'
        );
      }

      const clientSites = [safeBody['siteId'], safeBody['site_id']].filter(v => v !== undefined && v !== null) as string[];
      if (clientSites.length > 1 && clientSites[0] !== clientSites[1]) {
        throw new SecurityError('AUTHORIZATION_DENIED', 'Conflicting site identifiers in payload.');
      }
      const clientSite = clientSites[0];
      if (
        clientSite &&
        user.siteId &&
        clientSite !== user.siteId &&
        user.role !== 'SUPER_ADMIN' &&
        user.role !== 'ORGANIZATION_ADMIN'
      ) {
        if (!user.assignedSiteIds || !user.assignedSiteIds.includes(clientSite)) {
          throw new SecurityError(
            'AUTHORIZATION_DENIED',
            'Direct manipulation of site_id prohibited: security guards cannot act on non-assigned sites.'
          );
        }
      }

      // Step 5: Evaluate RBAC & ABAC Policy
      const payloadTenant = clientTenants[0] as string | undefined;
      const payloadSite = clientSite;
      const targetTenantId = routeContext.targetTenantId || payloadTenant || user.tenantId;
      const targetSiteId = routeContext.targetSiteId || payloadSite || user.siteId;

      const accessDecision = evaluateAccess(user, routeContext.requiredPermission, {
        tenantId: targetTenantId,
        siteId: targetSiteId,
        ownerId: routeContext.targetOwnerId,
        classification: routeContext.classification,
        requiresSegregationOfDuties: routeContext.requiresSegregationOfDuties,
      });

      if (!accessDecision.allowed) {
        throw new SecurityError(
          'AUTHORIZATION_DENIED',
          accessDecision.reason || 'Authorization denied by enterprise security policy.',
          403
        );
      }

      // Step 6 & 7: Execute Business Logic Handler
      const rawResult = await handler(user, safeBody, requestId);

      // Step 8: Apply Privacy-by-Design Masking
      const safeResult = maskRecord(rawResult, accessDecision);

      // Step 9: Audit Logging
      this.audit(req, routeContext, user, requestId, correlationId, 'SUCCESS');

      return {
        statusCode: 200,
        requestId,
        correlationId,
        headers: securityHeaders,
        data: safeResult,
      };
    } catch (err: unknown) {
      const safeErr = SafeErrorHandler.toSafeResponse(err, requestId);
      // Denied and failed requests are audited too; the DENIED-based security alerts depend on them.
      // Unauthenticated noise (no resolved identity) is left to the rate limiter / access logs.
      if (user) {
        const result = err instanceof SecurityError && err.statusCode < 500 ? 'DENIED' : 'FAILED';
        this.audit(req, routeContext, user, requestId, correlationId, result, safeErr.body?.code);
      }
      return {
        statusCode: safeErr.statusCode,
        requestId,
        correlationId,
        headers: securityHeaders,
        error: safeErr.body,
      };
    }
  }
}
