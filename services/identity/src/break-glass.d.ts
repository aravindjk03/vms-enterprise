import type { BreakGlassGrant, EnterpriseRole, UserContext } from '@vms/types';
export interface BreakGlassRequest {
    userId: string;
    tenantId: string;
    reason: string;
    requestedRole: EnterpriseRole;
    durationMinutes: number;
}
export declare class BreakGlassService {
    private auditLogger?;
    private static readonly MAX_DURATION_MINUTES;
    private grants;
    constructor(auditLogger?: ((event: {
        action: string;
        grantId: string;
        userId: string;
        tenantId: string;
        details?: Record<string, unknown>;
    }) => void) | undefined);
    /**
     * Evaluates and provisions an emergency break-glass elevation grant.
     * Mandates explicit operational rationale and hard time expiration.
     */
    requestBreakGlass(request: BreakGlassRequest): BreakGlassGrant;
    /**
     * Verifies if a break-glass grant is currently active and within its valid time window.
     */
    validateGrant(grantId: string): {
        active: boolean;
        grant?: BreakGlassGrant;
        reason?: string;
    };
    /**
     * Revokes an active emergency grant immediately upon incident conclusion.
     */
    revokeGrant(grantId: string, revokedByUserId?: string): boolean;
    /**
     * Elevates a base user context into an audited temporary break-glass context.
     */
    applyGrantToUser(baseUser: UserContext, grantId: string): UserContext;
}
