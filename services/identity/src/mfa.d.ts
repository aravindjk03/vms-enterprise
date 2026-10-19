import type { EnterpriseRole, MfaChannel, MfaPolicyConfig } from '@vms/types';
export interface TotpSecret {
    secretKey: string;
    uri: string;
}
export interface MfaChallenge {
    challengeId: string;
    userId: string;
    tenantId: string;
    requiredChannel: MfaChannel;
    expiresAt: Date;
    attempts: number;
}
export declare class MfaService {
    private policy;
    private static readonly TIME_STEP_SECONDS;
    private challenges;
    private userMfaSecrets;
    private userRecoveryCodes;
    constructor(policy?: MfaPolicyConfig);
    /**
     * Evaluates whether MFA is mandatory for a user based on role, user opt-in, and tenant policy.
     */
    isMfaRequired(role: EnterpriseRole, userEnforced?: boolean, tenantPolicyEnforced?: boolean): boolean;
    /**
     * Generates a new TOTP secret for user enrollment.
     */
    generateTotpSecret(userId: string, email: string, issuer?: string): TotpSecret;
    /**
     * Generates a set of single-use emergency recovery codes.
     */
    generateRecoveryCodes(userId: string, count?: number): string[];
    /**
     * Computes current RFC 6238 TOTP code for a secret and time.
     */
    computeTotp(secretKey: string, time?: Date): string;
    /**
     * Verifies TOTP code allowing ±1 step clock drift (60 second window).
     */
    verifyTotpCode(secretKey: string, token: string): boolean;
    /**
     * Creates an MFA challenge when user credentials pass step 1.
     */
    createChallenge(userId: string, tenantId: string, channel?: MfaChannel): MfaChallenge;
    /**
     * Verifies an active MFA challenge using TOTP or single-use recovery code.
     */
    verifyChallenge(challengeId: string, token: string): {
        success: boolean;
        userId?: string;
        tenantId?: string;
        error?: string;
    };
}
