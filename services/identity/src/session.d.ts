import type { UserSession } from '@vms/types';
export interface SessionConfig {
    inactivityTimeoutMinutes: number;
    absoluteLifetimeHours: number;
    maxConcurrentSessions: number;
}
export declare const DEFAULT_SESSION_CONFIG: SessionConfig;
export declare class SessionSecurityService {
    private config;
    private sessions;
    constructor(config?: SessionConfig);
    /**
     * Creates a new cryptographically random server-tracked session.
     */
    createSession(userId: string, tenantId: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        deviceInfo?: string;
    }): UserSession;
    /**
     * Validates active session, enforcing absolute expiration and inactivity timeouts.
     */
    validateSession(sessionId: string): {
        valid: boolean;
        session?: UserSession;
        reason?: string;
    };
    /**
     * Rotates a session ID to prevent session fixation upon privilege changes.
     */
    rotateSession(oldSessionId: string): UserSession;
    /**
     * Explicitly logs out and revokes a session.
     */
    revokeSession(sessionId: string, reason?: string, revokedByUserId?: string): boolean;
    /**
     * Revokes all active sessions for a specific user (e.g. on password change, compromise, or admin action).
     */
    revokeAllUserSessions(userId: string, reason?: string, revokedByUserId?: string): number;
    /**
     * Lists all sessions for a user (active and past).
     */
    getUserSessions(userId: string): UserSession[];
    /**
     * Detects suspicious session behavior (e.g. excessive concurrent logins).
     */
    detectSuspiciousActivity(userId: string): {
        isSuspicious: boolean;
        reason?: string;
    };
    /**
     * Refreshes an active session, extending inactivity timeout while maintaining absolute expiration limit.
     */
    refreshSession(sessionId: string): UserSession;
    /**
     * Administrative revocation of a user session with tenant-boundary enforcement.
     */
    revokeSessionByAdmin(adminUser: {
        userId: string;
        tenantId: string;
        role: string;
        permissions?: string[];
    }, targetSessionId: string, reason?: string): boolean;
    private sessionsForUser;
    private enforceConcurrencyLimit;
}
