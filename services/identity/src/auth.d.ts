import type { EnterpriseRole, UserContext, UserSession } from '@vms/types';
import { PasswordSecurityService } from './password.js';
import { MfaService } from './mfa.js';
import { SessionSecurityService } from './session.js';
export interface AuthUserRecord {
    userId: string;
    tenantId: string;
    organizationId: string;
    username: string;
    email: string;
    passwordHash: string;
    role: EnterpriseRole;
    siteId?: string;
    assignedSiteIds?: string[];
    assignedGateIds?: string[];
    assignedZoneIds?: string[];
    isActive: boolean;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    mfaEnforced?: boolean;
}
export interface LoginResult {
    success: boolean;
    mfaRequired?: boolean;
    mfaChallengeId?: string;
    session?: UserSession;
    userContext?: UserContext;
    error?: string;
}
export interface IIdentityProvider {
    providerName: string;
    authenticate(credentials: Record<string, unknown>): Promise<{
        authenticated: boolean;
        user?: AuthUserRecord;
        error?: string;
    }>;
}
export declare class LocalIdentityProvider implements IIdentityProvider {
    private users;
    private passwordService;
    providerName: string;
    constructor(users: Map<string, AuthUserRecord>, passwordService: PasswordSecurityService);
    authenticate(credentials: Record<string, unknown>): Promise<{
        authenticated: boolean;
        user?: AuthUserRecord;
        error?: string;
    }>;
}
/**
 * Enterprise Authentication Service
 * Implements strict server-side authentication, account lockout, MFA branching, and safe generic error reporting.
 */
export declare class AuthenticationService {
    private passwordService;
    private mfaService;
    private sessionService;
    private users;
    private providers;
    constructor(passwordService?: PasswordSecurityService, mfaService?: MfaService, sessionService?: SessionSecurityService);
    registerProvider(provider: IIdentityProvider): void;
    registerUser(user: AuthUserRecord): void;
    getUser(userId: string): AuthUserRecord | undefined;
    /**
     * Primary Login Pipeline:
     * Credential Verification -> Risk/Lockout -> MFA Requirement -> Session Creation -> Derived Tenant Context.
     */
    login(identifier: string, passwordPlain: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        deviceInfo?: string;
    }): Promise<LoginResult>;
    /**
     * Finalizes MFA verification and completes login.
     */
    verifyMfaLogin(challengeId: string, mfaToken: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        deviceInfo?: string;
    }): LoginResult;
    /**
     * Complete MFA Step 2 with user reference (backwards-compatible alias)
     */
    completeMfaLogin(userId: string, challengeId: string, mfaToken: string, metadata?: {
        ipAddress?: string;
        userAgent?: string;
        deviceInfo?: string;
    }): LoginResult;
}
