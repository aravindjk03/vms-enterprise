import { randomBytes } from 'node:crypto';
import type { UserSession } from '@vms/types';

export interface SessionConfig {
  inactivityTimeoutMinutes: number;
  absoluteLifetimeHours: number;
  maxConcurrentSessions: number;
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  inactivityTimeoutMinutes: 30,
  absoluteLifetimeHours: 12,
  maxConcurrentSessions: 5,
};

export class SessionSecurityService {
  private sessions: Map<string, UserSession> = new Map();

  constructor(private config: SessionConfig = DEFAULT_SESSION_CONFIG) {}

  /**
   * Creates a new cryptographically random server-tracked session.
   */
  public createSession(
    userId: string,
    tenantId: string,
    metadata?: { ipAddress?: string; userAgent?: string; deviceInfo?: string }
  ): UserSession {
    const sessionId = `sess_${randomBytes(24).toString('base64url')}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.config.absoluteLifetimeHours * 3600 * 1000);

    const session: UserSession = {
      sessionId,
      userId,
      tenantId,
      deviceInfo: metadata?.deviceInfo,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      createdAt: now,
      lastActivityAt: now,
      expiresAt,
      isRevoked: false,
    };

    // Clean up expired or enforce max concurrent sessions
    this.enforceConcurrencyLimit(userId);

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Validates active session, enforcing absolute expiration and inactivity timeouts.
   */
  public validateSession(sessionId: string): { valid: boolean; session?: UserSession; reason?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { valid: false, reason: 'Session not found or already terminated.' };
    }

    if (session.isRevoked) {
      return { valid: false, session, reason: `Session was revoked: ${session.revokedReason || 'Administrative action'}` };
    }

    const now = Date.now();

    // 1. Check absolute expiration
    if (now > session.expiresAt.getTime()) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      session.revokedReason = 'Absolute session lifetime reached.';
      return { valid: false, session, reason: 'Session expired.' };
    }

    // 2. Check inactivity timeout
    const inactivityMs = this.config.inactivityTimeoutMinutes * 60 * 1000;
    if (now - session.lastActivityAt.getTime() > inactivityMs) {
      session.isRevoked = true;
      session.revokedAt = new Date();
      session.revokedReason = 'Inactivity timeout triggered.';
      return { valid: false, session, reason: 'Session timed out due to inactivity.' };
    }

    // Touch session activity
    session.lastActivityAt = new Date();
    return { valid: true, session };
  }

  /**
   * Rotates a session ID to prevent session fixation upon privilege changes.
   */
  public rotateSession(oldSessionId: string): UserSession {
    const oldSession = this.sessions.get(oldSessionId);
    if (!oldSession || oldSession.isRevoked) {
      throw new Error('Cannot rotate an invalid or revoked session.');
    }

    // Revoke old session with reason
    oldSession.isRevoked = true;
    oldSession.revokedAt = new Date();
    oldSession.revokedReason = 'Session rotated for security.';

    // Issue new session with preserved creation & metadata
    const newSessionId = `sess_${randomBytes(24).toString('base64url')}`;
    const newSession: UserSession = {
      ...oldSession,
      sessionId: newSessionId,
      lastActivityAt: new Date(),
      isRevoked: false,
      revokedAt: undefined,
      revokedReason: undefined,
    };

    this.sessions.set(newSessionId, newSession);
    return newSession;
  }

  /**
   * Explicitly logs out and revokes a session.
   */
  public revokeSession(sessionId: string, reason: string = 'User explicit logout', revokedByUserId?: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.isRevoked = true;
    session.revokedAt = new Date();
    session.revokedReason = reason;
    session.revokedByUserId = revokedByUserId;
    return true;
  }

  /**
   * Revokes all active sessions for a specific user (e.g. on password change, compromise, or admin action).
   */
  public revokeAllUserSessions(userId: string, reason: string = 'Global user session revocation', revokedByUserId?: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && !session.isRevoked) {
        session.isRevoked = true;
        session.revokedAt = new Date();
        session.revokedReason = reason;
        session.revokedByUserId = revokedByUserId;
        count++;
      }
    }
    return count;
  }

  /**
   * Lists all sessions for a user (active and past).
   */
  public getUserSessions(userId: string): UserSession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  /**
   * Detects suspicious session behavior (e.g. excessive concurrent logins).
   */
  public detectSuspiciousActivity(userId: string): { isSuspicious: boolean; reason?: string } {
    const activeSessions = this.sessionsForUser(userId).filter(s => !s.isRevoked);
    if (activeSessions.length >= this.config.maxConcurrentSessions) {
      return {
        isSuspicious: true,
        reason: `Exceeded maximum concurrent session threshold (${activeSessions.length}/${this.config.maxConcurrentSessions}).`,
      };
    }
    return { isSuspicious: false };
  }

  /**
   * Refreshes an active session, extending inactivity timeout while maintaining absolute expiration limit.
   */
  public refreshSession(sessionId: string): UserSession {
    const session = this.sessions.get(sessionId);
    if (!session || session.isRevoked) {
      throw new Error('Cannot refresh an invalid or revoked session.');
    }
    const now = new Date();
    if (now.getTime() > session.expiresAt.getTime()) {
      session.isRevoked = true;
      session.revokedAt = now;
      session.revokedReason = 'Session expired.';
      throw new Error('Cannot refresh an expired session.');
    }
    session.lastActivityAt = now;
    return { ...session };
  }

  /**
   * Administrative revocation of a user session with tenant-boundary enforcement.
   */
  public revokeSessionByAdmin(
    adminUser: { userId: string; tenantId: string; role: string; permissions?: string[] },
    targetSessionId: string,
    reason: string = 'Revoked by administrator'
  ): boolean {
    const targetSession = this.sessions.get(targetSessionId);
    if (!targetSession) {
      return false;
    }

    // Tenant isolation: non-superadmin can only revoke sessions in their own tenant
    if (adminUser.role !== 'SUPER_ADMIN' && adminUser.tenantId !== targetSession.tenantId) {
      throw new Error('Cross-tenant session revocation prohibited.');
    }

    // Role check: must have admin capability
    const canRevoke =
      adminUser.role === 'SUPER_ADMIN' ||
      adminUser.role === 'ORGANIZATION_ADMIN' ||
      adminUser.role === 'SITE_ADMIN' ||
      adminUser.role === 'IT_ADMIN' ||
      (adminUser.permissions || []).includes('admin.users') ||
      (adminUser.permissions || []).includes('admin.settings');

    if (!canRevoke) {
      throw new Error(`User lacks administrative authorization to revoke sessions.`);
    }

    targetSession.isRevoked = true;
    targetSession.revokedAt = new Date();
    targetSession.revokedReason = reason;
    targetSession.revokedByUserId = adminUser.userId;
    return true;
  }

  private sessionsForUser(userId: string): UserSession[] {
    return Array.from(this.sessions.values()).filter(s => s.userId === userId);
  }

  private enforceConcurrencyLimit(userId: string) {
    const active = this.sessionsForUser(userId).filter(s => !s.isRevoked);
    if (active.length >= this.config.maxConcurrentSessions) {
      // Sort oldest first and revoke
      active.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      const oldest = active[0];
      oldest.isRevoked = true;
      oldest.revokedAt = new Date();
      oldest.revokedReason = 'Evicted by concurrency limit.';
    }
  }
}
