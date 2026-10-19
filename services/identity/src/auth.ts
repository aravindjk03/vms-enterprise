import { randomBytes } from 'node:crypto';
import type { EnterpriseRole, UserContext, UserSession } from '@vms/types';
import { PasswordSecurityService } from './password.js';
import { MfaService } from './mfa.js';
import { SessionSecurityService } from './session.js';
import { ROLE_PERMISSIONS } from '@vms/permissions';

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
  authenticate(credentials: Record<string, unknown>): Promise<{ authenticated: boolean; user?: AuthUserRecord; error?: string }>;
}

export class LocalIdentityProvider implements IIdentityProvider {
  public providerName = 'LOCAL_DB';

  constructor(
    private users: Map<string, AuthUserRecord>,
    private passwordService: PasswordSecurityService
  ) {}

  public async authenticate(credentials: Record<string, unknown>): Promise<{ authenticated: boolean; user?: AuthUserRecord; error?: string }> {
    const { identifier, password } = credentials as { identifier?: string; password?: string };
    if (!identifier || !password) {
      return { authenticated: false, error: 'Invalid credentials.' };
    }

    const user = Array.from(this.users.values()).find(
      u => u.username.toLowerCase() === identifier.toLowerCase() || u.email.toLowerCase() === identifier.toLowerCase()
    );

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
  private users: Map<string, AuthUserRecord> = new Map();
  private providers: Map<string, IIdentityProvider> = new Map();

  constructor(
    private passwordService: PasswordSecurityService = new PasswordSecurityService(),
    private mfaService: MfaService = new MfaService(),
    private sessionService: SessionSecurityService = new SessionSecurityService()
  ) {
    this.registerProvider(new LocalIdentityProvider(this.users, this.passwordService));
  }

  public registerProvider(provider: IIdentityProvider) {
    this.providers.set(provider.providerName, provider);
  }

  public registerUser(user: AuthUserRecord) {
    this.users.set(user.userId, user);
  }

  public getUser(userId: string): AuthUserRecord | undefined {
    return this.users.get(userId);
  }

  /**
   * Primary Login Pipeline:
   * Credential Verification -> Risk/Lockout -> MFA Requirement -> Session Creation -> Derived Tenant Context.
   */
  public async login(
    identifier: string,
    passwordPlain: string,
    metadata?: { ipAddress?: string; userAgent?: string; deviceInfo?: string }
  ): Promise<LoginResult> {
    const localProvider = this.providers.get('LOCAL_DB')!;
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
    const userContext: UserContext = {
      userId: user.userId,
      tenantId: user.tenantId, // Derived server-side! Never from client payload!
      organizationId: user.organizationId,
      siteId: user.siteId,
      assignedSiteIds: user.assignedSiteIds,
      assignedGateIds: user.assignedGateIds,
      assignedZoneIds: user.assignedZoneIds,
      role: user.role,
      permissions: (ROLE_PERMISSIONS[user.role] || []) as string[],
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
  public verifyMfaLogin(
    challengeId: string,
    mfaToken: string,
    metadata?: { ipAddress?: string; userAgent?: string; deviceInfo?: string }
  ): LoginResult {
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
    const userContext: UserContext = {
      userId: user.userId,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      siteId: user.siteId,
      assignedSiteIds: user.assignedSiteIds,
      assignedGateIds: user.assignedGateIds,
      assignedZoneIds: user.assignedZoneIds,
      role: user.role,
      permissions: (ROLE_PERMISSIONS[user.role] || []) as string[],
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
  public completeMfaLogin(
    userId: string,
    challengeId: string,
    mfaToken: string,
    metadata?: { ipAddress?: string; userAgent?: string; deviceInfo?: string }
  ): LoginResult {
    return this.verifyMfaLogin(challengeId, mfaToken, metadata);
  }
}
