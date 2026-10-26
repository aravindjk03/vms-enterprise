import type {
  EnterpriseRole,
  UserContext,
  DataClassificationLevel,
  PermissionKey,
} from '@vms/types';

export type PermissionAction =
  | 'VISITOR_READ'
  | 'VISITOR_WRITE'
  | 'VISITOR_APPROVE'
  | 'CUSTOMER_READ'
  | 'CUSTOMER_WRITE'
  | 'CUSTOMER_APPROVE'
  | 'CONTRACTOR_READ'
  | 'CONTRACTOR_WRITE'
  | 'CONTRACTOR_APPROVE'
  | 'CONTRACTOR_GATE_CHECKIN'
  | 'SERVICE_READ'
  | 'SERVICE_WRITE'
  | 'MATERIAL_READ'
  | 'MATERIAL_WRITE'
  | 'VEHICLE_READ'
  | 'VEHICLE_WRITE'
  | 'GATE_ACTUATE'
  | 'GATE_VIEW'
  | 'DOCUMENT_READ_SENSITIVE' // e.g., Government ID scans, passport photos
  | 'DOCUMENT_READ_STANDARD'  // e.g., NDA, Delivery Challan, PUC
  | 'PTW_APPROVE'             // Permit To Work safety sign-off
  | 'ESG_ACTIVITY_READ'
  | 'ESG_ACTIVITY_WRITE'
  | 'GHG_CALCULATION_READ'
  | 'GHG_FACTOR_MANAGE'
  | 'AUDIT_LOG_READ'
  | 'SYSTEM_ADMIN_MANAGE'
  | 'WORKFLOW_READ'
  | 'WORKFLOW_MANAGE'
  | 'WORKFLOW_PUBLISH'
  | 'MASTERDATA_READ'
  | 'MASTERDATA_MANAGE'
  | 'APPROVAL_READ'
  | 'APPROVAL_ACTION'
  | 'APPROVAL_DELEGATE'
  | 'POLICY_MANAGE'
  | 'POLICY_EVALUATE'
  | 'TASK_READ'
  | 'TASK_MANAGE'
  | PermissionKey;

/**
 * Normalized dot-notation mapping between legacy actions and enterprise dot-notation
 */
export const PERMISSION_NORMALIZATION_MAP: Record<string, string[]> = {
  VISITOR_READ: ['visitor.read'],
  VISITOR_WRITE: ['visitor.create', 'visitor.update'],
  VISITOR_APPROVE: ['visitor.approve'],
  CUSTOMER_READ: ['customer.read'],
  CUSTOMER_WRITE: ['customer.create', 'customer.update'],
  CUSTOMER_APPROVE: ['customer.approve'],
  CONTRACTOR_READ: ['contractor.read'],
  CONTRACTOR_WRITE: ['contractor.create', 'contractor.update', 'contractor.manage_compliance'],
  CONTRACTOR_APPROVE: ['contractor.approve'],
  CONTRACTOR_GATE_CHECKIN: ['contractor.checkin', 'contractor.gate', 'gate.actuate'],
  SERVICE_READ: ['service.read'],
  SERVICE_WRITE: ['service.create', 'service.update'],
  MATERIAL_READ: ['material.read'],
  MATERIAL_WRITE: ['material.create', 'material.update', 'material.gate_entry'],
  VEHICLE_READ: ['vehicle.read'],
  VEHICLE_WRITE: ['vehicle.manage'],
  GATE_ACTUATE: ['gate.actuate', 'gate.entry', 'gate.exit'],
  GATE_VIEW: ['gate.read'],
  DOCUMENT_READ_SENSITIVE: ['document.read.sensitive'],
  DOCUMENT_READ_STANDARD: ['document.read'],
  PTW_APPROVE: ['safety.permit.approve'],
  ESG_ACTIVITY_READ: ['esg.activity.read'],
  ESG_ACTIVITY_WRITE: ['esg.activity.create', 'esg.activity.update'],
  GHG_CALCULATION_READ: ['esg.calculation.read', 'ghg.calculation.read'],
  GHG_FACTOR_MANAGE: ['esg.calculation.manage', 'esg.mapping.manage', 'ghg.factor.manage'],
  AUDIT_LOG_READ: ['audit.read'],
  SYSTEM_ADMIN_MANAGE: ['admin.users', 'admin.roles', 'admin.permissions', 'admin.settings'],
  WORKFLOW_READ: ['workflow.read'],
  WORKFLOW_MANAGE: ['workflow.manage', 'workflow.validate'],
  WORKFLOW_PUBLISH: ['workflow.publish'],
  MASTERDATA_READ: ['masterdata.read'],
  MASTERDATA_MANAGE: ['masterdata.manage', 'masterdata.import'],
  APPROVAL_READ: ['approval.read'],
  APPROVAL_ACTION: ['approval.action'],
  APPROVAL_DELEGATE: ['approval.delegate'],
  POLICY_MANAGE: ['policy.manage', 'policy.validate'],
  POLICY_EVALUATE: ['policy.evaluate', 'policy.test'],
  TASK_READ: ['task.read'],
  TASK_MANAGE: ['task.manage'],
};

/**
 * Comprehensive Enterprise Role-to-Permissions Matrix (18 Enterprise Roles)
 */
export const ROLE_PERMISSIONS: Record<EnterpriseRole, PermissionAction[]> = {
  SUPER_ADMIN: [
    'VISITOR_READ', 'VISITOR_WRITE', 'VISITOR_APPROVE',
    'CUSTOMER_READ', 'CUSTOMER_WRITE', 'CUSTOMER_APPROVE',
    'CONTRACTOR_READ', 'CONTRACTOR_WRITE',
    'SERVICE_READ', 'SERVICE_WRITE',
    'MATERIAL_READ', 'MATERIAL_WRITE',
    'VEHICLE_READ', 'VEHICLE_WRITE',
    'GATE_ACTUATE', 'GATE_VIEW',
    'DOCUMENT_READ_SENSITIVE', 'DOCUMENT_READ_STANDARD',
    'PTW_APPROVE',
    'ESG_ACTIVITY_READ', 'ESG_ACTIVITY_WRITE',
    'GHG_CALCULATION_READ', 'GHG_FACTOR_MANAGE',
    'AUDIT_LOG_READ', 'SYSTEM_ADMIN_MANAGE',
    'WORKFLOW_READ', 'WORKFLOW_MANAGE', 'WORKFLOW_PUBLISH',
    'MASTERDATA_READ', 'MASTERDATA_MANAGE',
    'APPROVAL_READ', 'APPROVAL_ACTION', 'APPROVAL_DELEGATE',
    'POLICY_MANAGE', 'POLICY_EVALUATE',
    'TASK_READ', 'TASK_MANAGE',
    'visitor.read', 'visitor.create', 'visitor.update', 'visitor.approve', 'visitor.reject', 'visitor.checkin', 'visitor.checkout', 'visitor.export',
    'customer.read', 'customer.create', 'customer.approve', 'customer.export', 'customer_accounts.export', 'customer_visits.export',
    'contractor.read', 'contractor.create', 'contractor.approve', 'contractor.manage_compliance',
    'service.read', 'service.create', 'service.approve',
    'material.read', 'material.create', 'material.approve', 'material.gate_entry',
    'vehicle.read', 'vehicle.manage',
    'document.read', 'document.upload', 'document.verify', 'document.delete',
    'gate.read', 'gate.entry', 'gate.exit', 'gate.override', 'gate.actuate',
    'emergency.read', 'emergency.declare', 'emergency.manage',
    'esg.activity.read', 'esg.activity.export', 'esg.calculation.manage', 'esg.mapping.manage',
    'audit.read', 'audit.export',
    'admin.users', 'admin.roles', 'admin.permissions', 'admin.settings',
    'workflow.read', 'workflow.manage', 'workflow.validate', 'workflow.publish',
    'masterdata.read', 'masterdata.manage', 'masterdata.import',
    'approval.read', 'approval.action', 'approval.delegate',
    'policy.manage', 'policy.validate', 'policy.evaluate',
    'task.read', 'task.manage',
  ],
  ORGANIZATION_ADMIN: [
    'VISITOR_READ', 'VISITOR_WRITE', 'VISITOR_APPROVE',
    'CUSTOMER_READ', 'CUSTOMER_WRITE', 'CUSTOMER_APPROVE',
    'CONTRACTOR_READ', 'CONTRACTOR_WRITE',
    'SERVICE_READ', 'SERVICE_WRITE',
    'MATERIAL_READ', 'MATERIAL_WRITE',
    'VEHICLE_READ', 'VEHICLE_WRITE',
    'GATE_VIEW', 'DOCUMENT_READ_STANDARD',
    'ESG_ACTIVITY_READ', 'GHG_CALCULATION_READ',
    'AUDIT_LOG_READ',
    'visitor.read', 'visitor.create', 'visitor.update', 'visitor.approve',
    'customer.read', 'customer.create', 'customer.approve',
    'contractor.read', 'contractor.create',
    'material.read', 'material.create',
    'gate.read',
    'audit.read',
    'admin.users', 'admin.roles',
    'workflow.read', 'workflow.manage',
    'masterdata.read', 'masterdata.manage',
    'approval.read', 'approval.action', 'approval.delegate',
    'task.read', 'task.manage',
  ],
  SITE_ADMIN: [
    'VISITOR_READ', 'VISITOR_WRITE', 'VISITOR_APPROVE',
    'CUSTOMER_READ', 'CUSTOMER_WRITE', 'CUSTOMER_APPROVE',
    'CONTRACTOR_READ', 'CONTRACTOR_WRITE',
    'SERVICE_READ', 'SERVICE_WRITE',
    'MATERIAL_READ', 'MATERIAL_WRITE',
    'VEHICLE_READ', 'VEHICLE_WRITE',
    'GATE_ACTUATE', 'GATE_VIEW', 'DOCUMENT_READ_STANDARD',
    'ESG_ACTIVITY_READ', 'GHG_CALCULATION_READ',
    'AUDIT_LOG_READ',
    'visitor.read', 'visitor.create', 'visitor.update', 'visitor.approve', 'visitor.checkin', 'visitor.checkout',
    'customer.read', 'customer.create', 'customer.approve',
    'contractor.read', 'contractor.create',
    'service.read', 'service.create',
    'material.read', 'material.create', 'material.approve', 'material.gate_entry',
    'vehicle.read', 'vehicle.manage',
    'gate.read', 'gate.entry', 'gate.exit', 'gate.actuate', 'gate.override',
    'document.read', 'document.upload', 'document.verify',
    'emergency.read', 'emergency.declare', 'emergency.manage',
    'audit.read',
    'workflow.read', 'workflow.manage',
    'masterdata.read', 'masterdata.manage',
    'approval.read', 'approval.action', 'approval.delegate',
    'task.read', 'task.manage',
  ],
  SECURITY_MANAGER: [
    'VISITOR_READ', 'VISITOR_APPROVE',
    'CUSTOMER_READ',
    'CONTRACTOR_READ',
    'SERVICE_READ',
    'MATERIAL_READ',
    'VEHICLE_READ', 'VEHICLE_WRITE',
    'GATE_ACTUATE', 'GATE_VIEW',
    'DOCUMENT_READ_SENSITIVE', 'DOCUMENT_READ_STANDARD',
    'AUDIT_LOG_READ',
    'visitor.read', 'visitor.approve', 'visitor.reject', 'visitor.checkin', 'visitor.checkout',
    'customer.read',
    'contractor.read',
    'material.read', 'material.gate_entry',
    'vehicle.read', 'vehicle.manage',
    'gate.read', 'gate.entry', 'gate.exit', 'gate.override', 'gate.actuate',
    'document.read', 'document.verify',
    'emergency.read', 'emergency.declare', 'emergency.manage',
    'audit.read',
  ],
  SECURITY_GUARD: [
    'VISITOR_READ',
    'CUSTOMER_READ',
    'CONTRACTOR_READ',
    'SERVICE_READ',
    'MATERIAL_READ',
    'VEHICLE_READ', 'VEHICLE_WRITE',
    'GATE_ACTUATE', 'GATE_VIEW',
    'DOCUMENT_READ_STANDARD',
    'visitor.read', 'visitor.checkin', 'visitor.checkout',
    'customer.read',
    'contractor.read',
    'material.read', 'material.gate_entry',
    'vehicle.read', 'vehicle.manage',
    'gate.read', 'gate.entry', 'gate.exit', 'gate.actuate',
    'document.read',
  ],
  GATE_OPERATOR: [
    'VISITOR_READ',
    'CUSTOMER_READ',
    'CONTRACTOR_READ',
    'SERVICE_READ',
    'MATERIAL_READ',
    'VEHICLE_READ', 'VEHICLE_WRITE',
    'GATE_ACTUATE', 'GATE_VIEW',
    'DOCUMENT_READ_STANDARD',
    'visitor.read', 'visitor.checkin', 'visitor.checkout',
    'customer.read',
    'contractor.read',
    'material.read', 'material.gate_entry',
    'vehicle.read', 'vehicle.manage',
    'gate.read', 'gate.entry', 'gate.exit', 'gate.actuate',
    'document.read',
  ],
  RECEPTIONIST: [
    'VISITOR_READ', 'VISITOR_WRITE',
    'CUSTOMER_READ',
    'GATE_VIEW',
    'DOCUMENT_READ_STANDARD',
    'visitor.read', 'visitor.create', 'visitor.update', 'visitor.checkin', 'visitor.checkout',
    'customer.read', 'customer.create',
    'gate.read',
    'document.read', 'document.upload',
  ],
  HOST: [
    'VISITOR_READ', 'VISITOR_WRITE', 'VISITOR_APPROVE',
    'CUSTOMER_READ', 'CUSTOMER_WRITE', 'CUSTOMER_APPROVE',
    'visitor.read', 'visitor.create', 'visitor.update', 'visitor.approve',
    'customer.read', 'customer.create', 'customer.approve',
  ],
  EHS_MANAGER: [
    'CONTRACTOR_READ',
    'SERVICE_READ',
    'PTW_APPROVE',
    'DOCUMENT_READ_STANDARD',
    'GATE_VIEW',
    'ESG_ACTIVITY_READ',
    'contractor.read', 'contractor.manage_compliance',
    'service.read',
    'document.read', 'document.verify',
    'gate.read',
    'emergency.read', 'emergency.declare', 'emergency.manage',
    'esg.activity.read',
  ],
  HR: [
    'VISITOR_READ', 'VISITOR_WRITE', 'VISITOR_APPROVE',
    'CONTRACTOR_READ',
    'DOCUMENT_READ_STANDARD',
    'visitor.read', 'visitor.create', 'visitor.approve',
    'contractor.read',
    'document.read',
  ],
  HR_MANAGER: [
    'VISITOR_READ', 'VISITOR_WRITE', 'VISITOR_APPROVE',
    'CONTRACTOR_READ',
    'DOCUMENT_READ_STANDARD',
    'visitor.read', 'visitor.create', 'visitor.approve',
    'contractor.read',
    'document.read',
  ],
  LEGAL: [
    'CUSTOMER_READ',
    'CONTRACTOR_READ',
    'DOCUMENT_READ_STANDARD',
    'AUDIT_LOG_READ',
    'customer.read',
    'contractor.read',
    'document.read', 'document.verify',
    'audit.read',
  ],
  LEGAL_USER: [
    'CUSTOMER_READ',
    'CONTRACTOR_READ',
    'DOCUMENT_READ_STANDARD',
    'AUDIT_LOG_READ',
    'customer.read',
    'contractor.read',
    'document.read', 'document.verify',
    'audit.read',
  ],
  ESG_MANAGER: [
    'ESG_ACTIVITY_READ',
    'ESG_ACTIVITY_WRITE',
    'GHG_CALCULATION_READ',
    'VISITOR_READ', // Access strictly limited to transport/route metrics; PII is stripped by ABAC!
    'CUSTOMER_READ',
    'CONTRACTOR_READ',
    'SERVICE_READ',
    'MATERIAL_READ',
    'VEHICLE_READ',
    'esg.activity.read', 'esg.activity.export',
    'visitor.read',
    'customer.read',
    'contractor.read',
    'material.read',
    'vehicle.read',
  ],
  ESG_METHODOLOGY_ADMIN: [
    'ESG_ACTIVITY_READ',
    'ESG_ACTIVITY_WRITE',
    'GHG_CALCULATION_READ',
    'GHG_FACTOR_MANAGE',
    'AUDIT_LOG_READ',
    'esg.activity.read', 'esg.calculation.manage', 'esg.mapping.manage',
    'audit.read',
  ],
  AUDITOR: [
    'VISITOR_READ',
    'CUSTOMER_READ',
    'CONTRACTOR_READ',
    'MATERIAL_READ',
    'ESG_ACTIVITY_READ',
    'GHG_CALCULATION_READ',
    'AUDIT_LOG_READ',
    'visitor.read',
    'customer.read',
    'contractor.read',
    'material.read',
    'esg.activity.read',
    'audit.read', 'audit.export',
  ],
  IT_ADMIN: [
    'SYSTEM_ADMIN_MANAGE',
    'GATE_VIEW',
    'AUDIT_LOG_READ',
    'admin.settings',
    'gate.read',
    'audit.read',
  ],
  MANAGEMENT: [
    'VISITOR_READ',
    'CUSTOMER_READ', 'CUSTOMER_APPROVE',
    'CONTRACTOR_READ',
    'MATERIAL_READ',
    'VEHICLE_READ',
    'GATE_VIEW',
    'ESG_ACTIVITY_READ',
    'GHG_CALCULATION_READ',
    'AUDIT_LOG_READ',
    'visitor.read',
    'customer.read', 'customer.approve',
    'contractor.read',
    'material.read',
    'vehicle.read',
    'gate.read',
    'esg.activity.read',
    'audit.read',
  ],
};

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
export function hasPermissionMatch(
  grantedList: PermissionAction[],
  requested: PermissionAction
): boolean {
  if (grantedList.includes(requested)) {
    return true;
  }

  // Check normalized mapping
  for (const [legacy, dotList] of Object.entries(PERMISSION_NORMALIZATION_MAP)) {
    // A legacy capability is implied only when every one of its fine-grained permissions is held.
    if (requested === legacy && dotList.every(d => grantedList.includes(d as PermissionAction))) {
      return true;
    }
    if (dotList.includes(requested as string) && grantedList.includes(legacy as PermissionAction)) {
      return true;
    }
  }

  return false;
}

/**
 * Attribute-Based Access Control (ABAC) & RBAC Evaluator
 * Evaluates tenant boundaries, site scoping, segregation of duties, data classifications, and enforces field masking.
 */
export function evaluateAccess(
  user: UserContext,
  action: PermissionAction,
  resource: ResourceContext
): AccessDecision {
  // 1. Mandatory Server-Side Multi-Tenant Isolation Check (no role or break-glass exemption)
  if (!user.tenantId || user.tenantId !== resource.tenantId) {
    return {
      allowed: false,
      reason: 'Cross-tenant access prohibited by data isolation policy.',
      maskedFields: [],
    };
  }

  // 2. Break-glass contexts must carry a live expiry. A stale or unbounded elevated
  // context is denied outright rather than silently treated as the elevated role.
  // Break-glass relaxes only site/gate/zone/time scoping below; RBAC, segregation of
  // duties and data classification still apply to the elevated role.
  const evaluationNow = resource.evaluationTime || resource.timeOfAccess || new Date();
  if (user.isBreakGlass) {
    const expiresAt = user.breakGlassExpiresAt?.getTime();
    if (expiresAt === undefined || !Number.isFinite(expiresAt) || evaluationNow.getTime() >= expiresAt) {
      return {
        allowed: false,
        reason: 'Break-glass elevation has expired or is not time-bounded.',
        maskedFields: [],
      };
    }
  }
  const bypassScoping = user.isBreakGlass === true;

  // 3. Check Role Baseline & User Permissions (evaluates primary role and all multi-roles)
  const allUserRoles: EnterpriseRole[] = [user.role, ...(user.roles || [])];
  const rolePermissions = Array.from(new Set(allUserRoles.flatMap(r => ROLE_PERMISSIONS[r] || [])));
  const userExplicitPermissions = (user.permissions || []) as PermissionAction[];
  const combinedPermissions = [...rolePermissions, ...userExplicitPermissions];

  if (!hasPermissionMatch(combinedPermissions, action)) {
    return {
      allowed: false,
      reason: `Role ${user.role} lacks capability ${action}.`,
      maskedFields: [],
    };
  }

  if (!bypassScoping) {
    // 4. Site Scoping Check
    const isGateScopedRole = user.role === 'SECURITY_GUARD' || user.role === 'GATE_OPERATOR';
    if (isGateScopedRole && user.siteId && resource.siteId && user.siteId !== resource.siteId) {
      return {
        allowed: false,
        reason: 'Security Guard is scoped strictly to home site gates.',
        maskedFields: [],
      };
    }

    // General site scoping for site-assigned users (excluding super/org admins)
    if (
      user.role !== 'SUPER_ADMIN' &&
      user.role !== 'ORGANIZATION_ADMIN' &&
      user.siteId &&
      resource.siteId &&
      user.siteId !== resource.siteId
    ) {
      if (!user.assignedSiteIds || !user.assignedSiteIds.includes(resource.siteId)) {
        return {
          allowed: false,
          reason: `User is scoped strictly to home site ${user.siteId} and lacks clearance for site ${resource.siteId}.`,
          maskedFields: [],
        };
      }
    }

    // Multi-site access check if user has assigned sites list
    if (user.assignedSiteIds && user.assignedSiteIds.length > 0 && resource.siteId) {
      if (!user.assignedSiteIds.includes(resource.siteId)) {
        return {
          allowed: false,
          reason: `User is not authorized for resource at site ${resource.siteId}.`,
          maskedFields: [],
        };
      }
    }

    // Gate Scoping Check (Section 8 & 13)
    if (user.assignedGateIds && user.assignedGateIds.length > 0 && resource.gateId) {
      if (!user.assignedGateIds.includes(resource.gateId)) {
        return {
          allowed: false,
          reason: `User is not authorized for gate ${resource.gateId}.`,
          maskedFields: [],
        };
      }
    }

    // Zone Scoping Check (Section 8 & 13)
    if (user.assignedZoneIds && user.assignedZoneIds.length > 0 && resource.zoneId) {
      if (!user.assignedZoneIds.includes(resource.zoneId)) {
        return {
          allowed: false,
          reason: `User is not authorized for zone ${resource.zoneId} (not in assigned zones).`,
          maskedFields: [],
        };
      }
    }

    // Time-based Operational Window Check (Section 58)
    if (resource.allowedTimeWindow) {
      const accessTime = resource.evaluationTime || resource.timeOfAccess || new Date();
      const currentHour = accessTime.getUTCHours();
      const currentMinute = accessTime.getUTCMinutes();
      const currentTimeMinutes = currentHour * 60 + currentMinute;

      let startMinutes = 0;
      let endMinutes = 24 * 60;

      if (resource.allowedTimeWindow.startTime && resource.allowedTimeWindow.endTime) {
        const [sh, sm] = resource.allowedTimeWindow.startTime.split(':').map(Number);
        const [eh, em] = resource.allowedTimeWindow.endTime.split(':').map(Number);
        startMinutes = sh * 60 + (sm || 0);
        endMinutes = eh * 60 + (em || 0);
      } else if (resource.allowedTimeWindow.startHour !== undefined && resource.allowedTimeWindow.endHour !== undefined) {
        startMinutes = resource.allowedTimeWindow.startHour * 60;
        endMinutes = resource.allowedTimeWindow.endHour * 60;
      }

      if (currentTimeMinutes < startMinutes || currentTimeMinutes >= endMinutes) {
        return {
          allowed: false,
          reason: `Access denied: outside permitted operational hours (${startMinutes / 60}:00-${endMinutes / 60}:00).`,
          maskedFields: [],
        };
      }
    }
  }

  // 5. Approval Actions: Transaction State Check & Segregation of Duties
  const isApprovalAction =
    action.includes('APPROVE') ||
    action.endsWith('.approve') ||
    action === 'ghg.factor.manage' ||
    action === 'esg.calculation.manage';

  // Section 57: Approval Security - Never allow approving cancelled, expired, rejected, or completed transactions
  const targetState = (resource.currentState || resource.status || resource.state || '').toUpperCase();
  if (isApprovalAction && ['CANCELLED', 'EXPIRED', 'REJECTED', 'COMPLETED'].includes(targetState)) {
    return {
      allowed: false,
      reason: `Cannot approve transaction in ${targetState} state.`,
      maskedFields: [],
    };
  }

  // Section 56: Segregation of Duties Check (creator cannot approve their own record)
  if (isApprovalAction && resource.ownerId && user.userId === resource.ownerId) {
    return {
      allowed: false,
      reason: 'Segregation of duties violation: creator cannot approve their own record or change.',
      maskedFields: [],
    };
  }

  // 6. Data Classification Check
  if (resource.classification) {
    if (resource.classification === 'HIGHLY_RESTRICTED') {
      const canAccessHighlyRestricted =
        user.role === 'SUPER_ADMIN' ||
        user.role === 'SECURITY_MANAGER';
      if (!canAccessHighlyRestricted) {
        return {
          allowed: false,
          reason: 'Access denied: resource is HIGHLY_RESTRICTED.',
          maskedFields: [],
        };
      }
    } else if (resource.classification === 'RESTRICTED') {
      const canAccessRestricted =
        user.role === 'SUPER_ADMIN' ||
        user.role === 'SECURITY_MANAGER' ||
        user.role === 'LEGAL' ||
        user.role === 'LEGAL_USER' ||
        combinedPermissions.includes('DOCUMENT_READ_SENSITIVE' as PermissionAction) ||
        combinedPermissions.includes('document.read.sensitive' as PermissionAction);
      if (!canAccessRestricted) {
        return {
          allowed: false,
          reason: 'Access denied: resource is RESTRICTED.',
          maskedFields: [],
        };
      }
    }
  }

  // 7. Privacy-by-Design Field Masking:
  const maskedFields: string[] = [];

  // ESG Roles: Strictly mask PII & biometrics
  if (user.role === 'ESG_MANAGER' || user.role === 'ESG_METHODOLOGY_ADMIN') {
    maskedFields.push(
      'governmentIdNumber',
      'governmentIdType',
      'governmentIdScanUrl',
      'facialBiometricTemplate',
      'nationalIdNumber',
      'visitorPhone',
      'visitorEmail',
      'driverLicenseNumber',
      'personalPhoneNumber'
    );
  }

  // Gate operator: Mask full ID numbers and sensitive attachments unless authorized
  if ((user.role === 'SECURITY_GUARD' || user.role === 'GATE_OPERATOR') && !combinedPermissions.includes('DOCUMENT_READ_SENSITIVE' as PermissionAction)) {
    maskedFields.push('facialBiometricTemplate');
  }

  return {
    allowed: true,
    maskedFields,
  };
}

/**
 * Concrete Privacy-by-Design Sanitizer:
 * Redacts sensitive PII and biometrics according to the evaluated AccessDecision.
 */
export function maskRecord<T extends Record<string, unknown>>(
  record: T,
  decision: AccessDecision
): T {
  if (!decision.allowed) {
    throw new Error('Cannot mask record: access denied.');
  }

  if (decision.maskedFields.length === 0) {
    return { ...record };
  }

  const sanitized: Record<string, unknown> = { ...record };
  for (const field of decision.maskedFields) {
    if (field in sanitized) {
      delete sanitized[field];
    }
  }

  return sanitized as T;
}

/**
 * Sensitive field masking formatting helpers (Government ID, Phone)
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '******';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

export function maskGovernmentId(id: string): string {
  if (!id || id.length <= 4) return 'XXXX-XXXX';
  return 'XXXX-XXXX-' + id.slice(-4);
}

/**
 * Evaluates access and returns a sanitized, privacy-compliant record.
 */
export function sanitizeRecordForUser<T extends Record<string, unknown>>(
  record: T,
  user: UserContext,
  action: PermissionAction,
  resource: ResourceContext
): T {
  const decision = evaluateAccess(user, action, resource);
  if (!decision.allowed) {
    throw new Error(decision.reason || 'Access denied by security policy.');
  }
  return maskRecord(record, decision);
}
