import { PasswordSecurityService } from './password.js';
import { MfaService } from './mfa.js';
import { SessionSecurityService } from './session.js';
import { ROLE_PERMISSIONS } from '@vms/permissions';
export class LocalIdentityProvider {
    users;
    passwordService;
    providerName = 'LOCAL_DB';
    constructor(users, passwordService) {
        this.users = users;
        this.passwordService = passwordService;
    }
    async authenticate(credentials) {
        const { identifier, password } = credentials;
        if (!identifier || !password) {
            return { authenticated: false, error: 'Invalid credentials.' };
        }
        const user = Array.from(this.users.values()).find(u => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase());
        if (!user) {
            // Run dummy password verification to neutralize timing side-channel attacks
            this.passwordService.verifyPassword('dummy_pass', 'pbkdf2:100000:0000000000000000:00000000000000000000000000000000');
            return { authenticated: false, error: 'Invalid username or password.' };
        }
        if (!user.isActive) {
            return { authenticated: false, error: 'Account is deactivated.' };
        }
        // Check account lockout
        if (user.lockedUntil && Date.now() < user.lockedUntil.getTime()) {
            return { authenticated: false, error: 'Account is temporarily locked. Please try again later.' };
        }
        const isValid = this.passwordService.verifyPassword(password, user.passwordHash);
        if (!isValid) {
            user.failedLoginAttempts++;
            if (user.failedLoginAttempts >= 5) {
                user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 min lockout
            }
            return { authenticated: false, error: 'Invalid username or password.' };
        }
        // Reset failed counter on successful validation
        user.failedLoginAttempts = 0;
        user.lockedUntil = undefined;
        return { authenticated: true, user };
    }
}
/**
 * Enterprise Authentication Service
 * Implements strict server-side authentication, account lockout, MFA branching, and safe generic error reporting.
 */
export class AuthenticationService {
    passwordService;
    mfaService;
    sessionService;
    users = new Map();
    providers = new Map();
    constructor(passwordService = new PasswordSecurityService(), mfaService = new MfaService(), sessionService = new SessionSecurityService()) {
        this.passwordService = passwordService;
        this.mfaService = mfaService;
        this.sessionService = sessionService;
        this.registerProvider(new LocalIdentityProvider(this.users, this.passwordService));
    }
    registerProvider(provider) {
        this.providers.set(provider.providerName, provider);
    }
    registerUser(user) {
        this.users.set(user.userId, user);
    }
    getUser(userId) {
        return this.users.get(userId);
    }
    /**
     * Primary Login Pipeline:
     * Credential Verification -> Risk/Lockout -> MFA Requirement -> Session Creation -> Derived Tenant Context.
     */
    async login(identifier, passwordPlain, metadata) {
        const localProvider = this.providers.get('LOCAL_DB');
        const authResult = await localProvider.authenticate({ identifier, password: passwordPlain });
        if (!authResult.authenticated || !authResult.user) {
            // Safe generic message — never reveal if username exists vs password wrong!
            return {
                success: false,
                error: 'Invalid credentials. Please verify your login details and try again.',
            };
        }
        const user = authResult.user;
        // Check MFA Requirement
        const requiresMfa = this.mfaService.isMfaRequired(user.role, user.mfaEnforced);
        if (requiresMfa) {
            const challenge = this.mfaService.createChallenge(user.userId, user.tenantId);
            return {
                success: false,
                mfaRequired: true,
                mfaChallengeId: challenge.challengeId,
            };
        }
        // Issue Session
        const session = this.sessionService.createSession(user.userId, user.tenantId, metadata);
        // Resolve Context strictly from database record
        const userContext = {
            userId: user.userId,
            tenantId: user.tenantId, // Derived server-side! Never from client payload!
            organizationId: user.organizationId,
            siteId: user.siteId,
            assignedSiteIds: user.assignedSiteIds,
            assignedGateIds: user.assignedGateIds,
            assignedZoneIds: user.assignedZoneIds,
            role: user.role,
            permissions: (ROLE_PERMISSIONS[user.role] || []),
            mfaVerified: false,
            sessionId: session.sessionId,
        };
        return {
            success: true,
            session,
            userContext,
        };
    }
    /**
     * Finalizes MFA verification and completes login.
     */
    verifyMfaLogin(challengeId, mfaToken, metadata) {
        const verification = this.mfaService.verifyChallenge(challengeId, mfaToken);
        if (!verification.success || !verification.userId) {
            return {
                success: false,
                error: verification.error || 'MFA verification failed.',
            };
        }
        const user = this.users.get(verification.userId);
        if (!user) {
            return { success: false, error: 'User record not found.' };
        }
        const session = this.sessionService.createSession(user.userId, user.tenantId, metadata);
        const userContext = {
            userId: user.userId,
            tenantId: user.tenantId,
            organizationId: user.organizationId,
            siteId: user.siteId,
            assignedSiteIds: user.assignedSiteIds,
            assignedGateIds: user.assignedGateIds,
            assignedZoneIds: user.assignedZoneIds,
            role: user.role,
            permissions: (ROLE_PERMISSIONS[user.role] || []),
            mfaVerified: true,
            sessionId: session.sessionId,
        };
        return {
            success: true,
            session,
            userContext,
        };
    }
    /**
     * Complete MFA Step 2 with user reference (backwards-compatible alias)
     */
    completeMfaLogin(userId, challengeId, mfaToken, metadata) {
        return this.verifyMfaLogin(challengeId, mfaToken, metadata);
    }
}
