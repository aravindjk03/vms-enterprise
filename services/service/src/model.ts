/**
 * Service / Work Management — domain vocabulary and lifecycle rules (Part 9).
 *
 * A Service Request is the request for work; a Service Work Order is the authorized
 * service activity. They have separate lifecycles. Arrival, work start, completion and
 * departure are distinct progress events.
 */

export const SERVICE_TYPES = [
  'PLANNED_SERVICE',
  'PREVENTIVE_MAINTENANCE',
  'CORRECTIVE_MAINTENANCE',
  'BREAKDOWN_RESPONSE',
  'INSPECTION',
  'TESTING',
  'CALIBRATION',
  'INSTALLATION',
  'REPAIR',
  'RECURRING_SERVICE',
  'EMERGENCY_SERVICE',
  'OTHER',
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_PRIORITIES = ['LOW', 'STANDARD', 'HIGH', 'CRITICAL'] as const;
export type ServicePriority = (typeof SERVICE_PRIORITIES)[number];

export const REQUEST_STATUSES = ['SUBMITTED', 'APPROVED', 'REJECTED', 'WORK_ORDERED', 'FULFILLED', 'CANCELLED'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const WORK_ORDER_STATUSES = [
  'PENDING_APPROVAL',
  'APPROVED',
  'SCHEDULED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETION_SUBMITTED',
  'COMPLETED',
  'CLOSED',
  'CANCELLED',
  'REJECTED',
] as const;
export type WorkOrderStatus = (typeof WORK_ORDER_STATUSES)[number];

export const EXCEPTION_TYPES = [
  'MISSED_OCCURRENCE',
  'OVERDUE',
  'PROVIDER_NO_SHOW',
  'SCOPE_CHANGE',
  'SAFETY_CONCERN',
  'QUALITY_ISSUE',
  'ACCESS_ISSUE',
  'OTHER',
] as const;
export type ExceptionType = (typeof EXCEPTION_TYPES)[number];

export class DomainRuleError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Service request lifecycle
// ---------------------------------------------------------------------------

export type RequestAction = 'APPROVE' | 'REJECT' | 'CANCEL' | 'WORK_ORDER_CREATED' | 'FULFIL';

const REQUEST_TRANSITIONS: Record<RequestAction, { from: RequestStatus[]; to: RequestStatus }> = {
  APPROVE: { from: ['SUBMITTED'], to: 'APPROVED' },
  REJECT: { from: ['SUBMITTED'], to: 'REJECTED' },
  // From WORK_ORDERED only when no work order was carried out (the API checks the work orders).
  CANCEL: { from: ['SUBMITTED', 'APPROVED', 'WORK_ORDERED'], to: 'CANCELLED' },
  WORK_ORDER_CREATED: { from: ['APPROVED', 'WORK_ORDERED'], to: 'WORK_ORDERED' },
  FULFIL: { from: ['WORK_ORDERED'], to: 'FULFILLED' },
};

export const REQUEST_STAGE: Record<RequestStatus, string> = {
  SUBMITTED: 'APPROVAL',
  APPROVED: 'PLANNING',
  WORK_ORDERED: 'EXECUTION',
  FULFILLED: 'CLOSED',
  REJECTED: 'CLOSED',
  CANCELLED: 'CLOSED',
};

export function nextRequestStatus(current: string, action: RequestAction): RequestStatus {
  const rule = REQUEST_TRANSITIONS[action];
  if (!rule.from.includes(current as RequestStatus)) {
    throw new DomainRuleError('INVALID_STATE', `Service request is ${current}; ${action.toLowerCase().replace(/_/g, ' ')} is not allowed.`);
  }
  return rule.to;
}

// ---------------------------------------------------------------------------
// Work order lifecycle
// ---------------------------------------------------------------------------

export type WorkOrderEvent =
  | 'APPROVE'
  | 'REJECT'
  | 'ASSIGN'
  | 'UNASSIGN_LAST'
  | 'ARRIVED'
  | 'PREREQUISITES_CHECKED'
  | 'WORK_STARTED'
  | 'WORK_PAUSED'
  | 'WORK_RESUMED'
  | 'EVIDENCE_ATTACHED'
  | 'COMPLETION_SUBMITTED'
  | 'COMPLETION_ACCEPTED'
  | 'COMPLETION_RETURNED'
  | 'CLOSED'
  | 'DEPARTED'
  | 'CANCELLED';

/** `null` target = the event is recorded but the work order status does not change. */
const WORK_ORDER_TRANSITIONS: Record<WorkOrderEvent, { from: WorkOrderStatus[]; to: WorkOrderStatus | null }> = {
  APPROVE: { from: ['PENDING_APPROVAL'], to: 'APPROVED' },
  REJECT: { from: ['PENDING_APPROVAL'], to: 'REJECTED' },
  ASSIGN: { from: ['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'], to: null },
  UNASSIGN_LAST: { from: ['SCHEDULED'], to: 'APPROVED' },
  ARRIVED: { from: ['APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'], to: null },
  PREREQUISITES_CHECKED: { from: ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD'], to: null },
  WORK_STARTED: { from: ['SCHEDULED'], to: 'IN_PROGRESS' },
  WORK_PAUSED: { from: ['IN_PROGRESS'], to: 'ON_HOLD' },
  WORK_RESUMED: { from: ['ON_HOLD'], to: 'IN_PROGRESS' },
  EVIDENCE_ATTACHED: { from: ['SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_SUBMITTED'], to: null },
  COMPLETION_SUBMITTED: { from: ['IN_PROGRESS'], to: 'COMPLETION_SUBMITTED' },
  COMPLETION_ACCEPTED: { from: ['COMPLETION_SUBMITTED'], to: 'COMPLETED' },
  COMPLETION_RETURNED: { from: ['COMPLETION_SUBMITTED'], to: 'IN_PROGRESS' },
  CLOSED: { from: ['COMPLETED'], to: 'CLOSED' },
  DEPARTED: { from: ['APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_SUBMITTED', 'COMPLETED'], to: null },
  CANCELLED: { from: ['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'ON_HOLD'], to: 'CANCELLED' },
};

export const WORK_ORDER_STAGE: Record<WorkOrderStatus, string> = {
  PENDING_APPROVAL: 'APPROVAL',
  APPROVED: 'PLANNING',
  SCHEDULED: 'SCHEDULED',
  IN_PROGRESS: 'EXECUTION',
  ON_HOLD: 'EXECUTION',
  COMPLETION_SUBMITTED: 'ACCEPTANCE',
  COMPLETED: 'ACCEPTANCE',
  CLOSED: 'CLOSED',
  CANCELLED: 'CLOSED',
  REJECTED: 'CLOSED',
};

export interface WorkOrderGuardContext {
  /** Whether the work order requires safety prerequisites (permit / declared prerequisites). */
  prerequisitesRequired: boolean;
  /** A PREREQUISITES_CHECKED event with a satisfying outcome exists. */
  prerequisitesSatisfied: boolean;
  /** At least one active technician assignment exists. */
  hasActiveAssignment: boolean;
  /** Mandatory deliverables that have not been satisfied with evidence yet. */
  outstandingDeliverables: string[];
}

export function nextWorkOrderStatus(current: string, event: WorkOrderEvent, guard?: Partial<WorkOrderGuardContext>): WorkOrderStatus {
  const rule = WORK_ORDER_TRANSITIONS[event];
  if (!rule.from.includes(current as WorkOrderStatus)) {
    throw new DomainRuleError('INVALID_STATE', `Work order is ${current}; ${event.toLowerCase().replace(/_/g, ' ')} is not allowed.`);
  }
  if (event === 'WORK_STARTED') {
    if (!guard?.hasActiveAssignment) {
      throw new DomainRuleError('NO_TECHNICIAN', 'Assign a technician before starting work.');
    }
    if (guard.prerequisitesRequired && !guard.prerequisitesSatisfied) {
      throw new DomainRuleError('PREREQUISITES_UNMET', 'Required safety prerequisites have not been verified for this work order.');
    }
  }
  if (event === 'COMPLETION_SUBMITTED' && guard?.outstandingDeliverables && guard.outstandingDeliverables.length > 0) {
    throw new DomainRuleError(
      'DELIVERABLES_OUTSTANDING',
      `Completion requires evidence for: ${guard.outstandingDeliverables.join('; ')}.`
    );
  }
  return rule.to ?? (current as WorkOrderStatus);
}

/** Work orders still open for scheduling / execution. */
export const OPEN_WORK_ORDER_STATUSES: WorkOrderStatus[] = ['PENDING_APPROVAL', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETION_SUBMITTED'];

// ---------------------------------------------------------------------------
// Deliverables / completion readiness
// ---------------------------------------------------------------------------

export interface DeliverableState {
  description: string;
  isMandatory: boolean;
  evidenceRequired: boolean;
  satisfiedAt: Date | string | null;
  hasEvidence: boolean;
}

export function outstandingDeliverables(deliverables: DeliverableState[]): string[] {
  return deliverables
    .filter(d => d.isMandatory && (!d.satisfiedAt || (d.evidenceRequired && !d.hasEvidence)))
    .map(d => d.description);
}

// ---------------------------------------------------------------------------
// Provider & technician eligibility
// ---------------------------------------------------------------------------

export interface ProviderFacts {
  status: string;
  categories: string[];
  siteIds: string[];
  effectiveFrom: string | Date | null;
  effectiveTo: string | Date | null;
}

function toDateOnly(value: string | Date): string {
  return (value instanceof Date ? value.toISOString() : value).slice(0, 10);
}

/** Registration alone grants nothing: the provider must be active, in date, authorized for the site and the category. */
export function providerEligibility(provider: ProviderFacts, siteId: string, category: string | null, on: Date): string[] {
  const reasons: string[] = [];
  const day = toDateOnly(on);
  if (provider.status !== 'ACTIVE') reasons.push(`Provider status is ${provider.status}.`);
  if (provider.effectiveFrom && toDateOnly(provider.effectiveFrom) > day) reasons.push('Provider relationship is not yet effective.');
  if (provider.effectiveTo && toDateOnly(provider.effectiveTo) < day) reasons.push('Provider relationship has expired.');
  if (!provider.siteIds.includes(siteId)) reasons.push('Provider is not authorized for this site.');
  if (category && !provider.categories.includes(category)) reasons.push(`Provider is not approved for category ${category}.`);
  return reasons;
}

export function technicianEligibility(
  technician: { status: string; serviceProviderId: string; effectiveFrom: string | Date | null; effectiveTo: string | Date | null },
  workOrderProviderId: string,
  on: Date
): string[] {
  const reasons: string[] = [];
  const day = toDateOnly(on);
  if (technician.serviceProviderId !== workOrderProviderId) reasons.push('Technician does not belong to the work order provider.');
  if (technician.status !== 'ACTIVE') reasons.push(`Technician status is ${technician.status}.`);
  if (technician.effectiveFrom && toDateOnly(technician.effectiveFrom) > day) reasons.push('Technician relationship is not yet effective.');
  if (technician.effectiveTo && toDateOnly(technician.effectiveTo) < day) reasons.push('Technician relationship has expired.');
  return reasons;
}

// ---------------------------------------------------------------------------
// Scheduling: overlap detection
// ---------------------------------------------------------------------------

export interface TimeWindow {
  id?: string;
  start: Date;
  end: Date;
  label?: string;
}

export function validateWindow(start: Date, end: Date): void {
  if (!(start instanceof Date) || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new DomainRuleError('INVALID_DATES', 'Start and end must be valid dates.');
  }
  if (end.getTime() <= start.getTime()) {
    throw new DomainRuleError('INVALID_DATES', 'End must be after start.');
  }
}

/** Half-open intervals: back-to-back windows (end == next start) do not overlap. */
export function findOverlaps(candidate: TimeWindow, existing: TimeWindow[]): TimeWindow[] {
  return existing.filter(w => w.id !== candidate.id && w.start.getTime() < candidate.end.getTime() && candidate.start.getTime() < w.end.getTime());
}

export type OverlapPolicy = 'BLOCK' | 'WARN';
