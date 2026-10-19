import type { EnterpriseRole, UserContext, DataClassificationLevel, PermissionKey } from '@vms/types';
export type PermissionAction = 'VISITOR_READ' | 'VISITOR_WRITE' | 'VISITOR_APPROVE' | 'CUSTOMER_READ' | 'CUSTOMER_WRITE' | 'CUSTOMER_APPROVE' | 'CONTRACTOR_READ' | 'CONTRACTOR_WRITE' | 'SERVICE_READ' | 'SERVICE_WRITE' | 'MATERIAL_READ' | 'MATERIAL_WRITE' | 'VEHICLE_READ' | 'VEHICLE_WRITE' | 'GATE_ACTUATE' | 'GATE_VIEW' | 'DOCUMENT_READ_SENSITIVE' | 'DOCUMENT_READ_STANDARD' | 'PTW_APPROVE' | 'ESG_ACTIVITY_READ' | 'ESG_ACTIVITY_WRITE' | 'GHG_CALCULATION_READ' | 'GHG_FACTOR_MANAGE' | 'AUDIT_LOG_READ' | 'SYSTEM_ADMIN_MANAGE' | 'WORKFLOW_READ' | 'WORKFLOW_MANAGE' | 'WORKFLOW_PUBLISH' | 'MASTERDATA_READ' | 'MASTERDATA_MANAGE' | 'APPROVAL_READ' | 'APPROVAL_ACTION' | 'APPROVAL_DELEGATE' | 'POLICY_MANAGE' | 'POLICY_EVALUATE' | 'TASK_READ' | 'TASK_MANAGE' | PermissionKey;
/**
 * Normalized dot-notation mapping between legacy actions and enterprise dot-notation
 */
export declare const PERMISSION_NORMALIZATION_MAP: Record<string, string[]>;
/**
 * Comprehensive Enterprise Role-to-Permissions Matrix (18 Enterprise Roles)
 */
export declare const ROLE_PERMISSIONS: Record<EnterpriseRole, PermissionAction[]>;
export interface ResourceContext {
    tenantId: string;
    organizationId?: string;
    siteId?: string;
    gateId?: string;
    zoneId?: string;
    ownerId?: string;
    classification?: DataClassificationLevel;
    requiresSegregationOfDuties?: boolean;
    state?: string;
    currentState?: string;
    status?: string;
    allowedTimeWindow?: {
        startHour?: number;
        endHour?: number;
        startTime?: string;
        endTime?: string;
    };
    timeOfAccess?: Date;
    evaluationTime?: Date;
    isEmergencyState?: boolean;
}
export interface AccessDecision {
    allowed: boolean;
    reason?: string;
    maskedFields: string[];
}
/**
 * Normalizes permission strings between dot notation and legacy uppercase
 */
export declare function hasPermissionMatch(grantedList: PermissionAction[], requested: PermissionAction): boolean;
/**
 * Attribute-Based Access Control (ABAC) & RBAC Evaluator
 * Evaluates tenant boundaries, site scoping, segregation of duties, data classifications, and enforces field masking.
 */
export declare function evaluateAccess(user: UserContext, action: PermissionAction, resource: ResourceContext): AccessDecision;
/**
 * Concrete Privacy-by-Design Sanitizer:
 * Redacts sensitive PII and biometrics according to the evaluated AccessDecision.
 */
export declare function maskRecord<T extends Record<string, unknown>>(record: T, decision: AccessDecision): T;
/**
 * Sensitive field masking formatting helpers (Government ID, Phone)
 */
export declare function maskPhone(phone: string): string;
export declare function maskGovernmentId(id: string): string;
/**
 * Evaluates access and returns a sanitized, privacy-compliant record.
 */
export declare function sanitizeRecordForUser<T extends Record<string, unknown>>(record: T, user: UserContext, action: PermissionAction, resource: ResourceContext): T;
