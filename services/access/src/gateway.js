import { randomBytes } from 'node:crypto';
import { evaluateAccess, maskRecord } from '@vms/permissions';
import { RateLimiter } from './rate-limiter.js';
import { SafeErrorHandler, SecurityError } from './errors.js';
import { SecurityHeadersService } from './headers.js';
export class SecurityGateway {
    sessionService;
    rateLimiter;
    auditLogger;
    static requestCounter = 1000;
    constructor(sessionService, rateLimiter = new RateLimiter(), auditLogger) {
        this.sessionService = sessionService;
        this.rateLimiter = rateLimiter;
        this.auditLogger = auditLogger;
    }
    /**
     * Generates a standard enterprise correlation/request ID (e.g. REQ-2026-001001)
     */
    generateRequestId() {
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
    async handleRequest(req, routeContext, userContextLookup, handler) {
        const requestId = this.generateRequestId();
        const correlationId = req.headers['x-correlation-id'] || requestId;
        const clientIdentifier = req.clientIp || '127.0.0.1';
        const securityHeaders = SecurityHeadersService.getHeaders();
        try {
            // Step 2: Rate Limit & Brute Force Check
            const rateResult = this.rateLimiter.checkRateLimit(clientIdentifier, req.category || 'DEFAULT');
            if (!rateResult.allowed) {
                throw new SecurityError('RATE_LIMITED', `Too many requests. Please retry in ${rateResult.resetSeconds} seconds.`, 429);
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
            const user = await userContextLookup(sessionCheck.session);
            if (!user) {
                throw new SecurityError('AUTHENTICATION_FAILED', 'User identity could not be resolved.', 401);
            }
            // CRITICAL SECURITY RULE: Neutralize client-supplied tenant_id!
            // If the client submitted a body containing a tenantId or tenant_id, sanitize or reject it if it conflicts with authenticated context!
            const safeBody = { ...req.body };
            if (safeBody) {
                const clientTenant = (safeBody['tenantId'] || safeBody['tenant_id']);
                if (clientTenant && clientTenant !== user.tenantId && user.role !== 'SUPER_ADMIN') {
                    throw new SecurityError('AUTHORIZATION_DENIED', 'Direct manipulation of tenant_id prohibited: payload does not match authenticated context.');
                }
                const clientSite = (safeBody['siteId'] || safeBody['site_id']);
                if (clientSite &&
                    user.siteId &&
                    clientSite !== user.siteId &&
                    user.role !== 'SUPER_ADMIN' &&
                    user.role !== 'ORGANIZATION_ADMIN') {
                    if (!user.assignedSiteIds || !user.assignedSiteIds.includes(clientSite)) {
                        throw new SecurityError('AUTHORIZATION_DENIED', 'Direct manipulation of site_id prohibited: security guards cannot act on non-assigned sites.');
                    }
                }
            }
            // Step 5: Evaluate RBAC & ABAC Policy
            const payloadTenant = safeBody ? (safeBody['tenantId'] || safeBody['tenant_id']) : undefined;
            const payloadSite = safeBody ? (safeBody['siteId'] || safeBody['site_id']) : undefined;
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
                throw new SecurityError('AUTHORIZATION_DENIED', accessDecision.reason || 'Authorization denied by enterprise security policy.', 403);
            }
            // Step 6 & 7: Execute Business Logic Handler
            const rawResult = await handler(user, safeBody, requestId);
            // Step 8: Apply Privacy-by-Design Masking
            const safeResult = maskRecord(rawResult, accessDecision);
            // Step 9: Audit Logging
            if (this.auditLogger) {
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
                    result: 'SUCCESS',
                    hash: '',
                });
            }
            return {
                statusCode: 200,
                requestId,
                correlationId,
                headers: securityHeaders,
                data: safeResult,
            };
        }
        catch (err) {
            const safeErr = SafeErrorHandler.toSafeResponse(err, requestId);
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
