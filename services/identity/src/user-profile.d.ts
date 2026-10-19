import type { UserContext, UserSecurityProfile, SecurityAlert } from '@vms/types';
import type { SessionSecurityService } from './session.js';
import type { AuthUserRecord } from './auth.js';
export declare class UserSecurityProfileService {
    private sessionService;
    private getUserRecord;
    private getSecurityAlertsForUser?;
    constructor(sessionService: SessionSecurityService, getUserRecord: (userId: string) => AuthUserRecord | undefined, getSecurityAlertsForUser?: ((userId: string) => SecurityAlert[]) | undefined);
    /**
     * Builds and returns a comprehensive User Security Profile with strict authorization enforcement.
     * Only the user themselves or an administrator with admin.users capability may view the security profile.
     */
    getProfile(viewer: UserContext, targetUserId: string): UserSecurityProfile;
}
