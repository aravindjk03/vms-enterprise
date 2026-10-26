/** Plain-language wording for audit actions, shared by the dashboard feed and the audit log. */
const ACTION_TEXT: Record<string, string> = {
  LOGIN_SUCCESS: 'Signed in',
  LOGIN_FAILED: 'Failed sign-in attempt',
  LOGIN_LOCKED: 'Account locked after failed sign-ins',
  LOGOUT: 'Signed out',
  PASSWORD_CHANGED: 'Changed their password',
  CREDENTIAL_SET: 'Password set',
  USER_CREATED: 'Created a user',
  USER_UPDATED: 'Updated a user',
  USER_ROLES_CHANGED: 'Changed user roles',
  USER_SITES_CHANGED: 'Changed user sites',
  USER_PASSWORD_RESET: 'Reset a password',
  USER_UNLOCKED: 'Unlocked a user',
  USER_SESSIONS_REVOKED: 'Signed a user out everywhere',
  USER_SUSPENDED: 'Suspended a user',
  USER_INACTIVE: 'Deactivated a user',
  USER_ACTIVE: 'Reactivated a user',
  VISITOR_REGISTERED: 'Registered a visitor',
  VISITOR_APPROVED: 'Approved a visit',
  VISITOR_REJECTED: 'Rejected a visit',
  VISITOR_CANCELLED: 'Cancelled a visit',
  VISITOR_CHECKED_IN: 'Checked a visitor in',
  VISITOR_CHECKED_OUT: 'Checked a visitor out',
  SERVICE_REQUEST_SUBMITTED: 'Submitted a service request',
  SERVICE_REQUEST_APPROVED: 'Approved a service request',
  SERVICE_WORK_ORDER_CREATED: 'Created a work order',
  SERVICE_WORK_ORDER_APPROVED: 'Approved a work order',
  SERVICE_TECHNICIAN_ASSIGNED: 'Assigned a technician',
  SERVICE_TECHNICIAN_REGISTERED: 'Registered a technician',
  SERVICE_ARRIVED: 'Recorded technician arrival',
  SERVICE_WORK_STARTED: 'Started service work',
  SERVICE_EVIDENCE_ATTACHED: 'Attached evidence',
  SERVICE_COMPLETION_SUBMITTED: 'Submitted work for acceptance',
  SERVICE_COMPLETION_ACCEPTED: 'Accepted completed work',
  SERVICE_WORK_ORDER_CLOSED: 'Closed a work order',
  SERVICE_JOURNEY_CAPTURED: 'Captured travel for ESG',
  SERVICE_SCHEDULE_CREATED: 'Created a recurring schedule',
  SERVICE_OCCURRENCES_GENERATED: 'Generated scheduled visits',
  SERVICE_PREREQUISITES_CHECKED: 'Checked work prerequisites',
  SERVICE_PROVIDER_UPDATED: 'Updated a service provider',
};

export function describeAction(action: string): string {
  if (ACTION_TEXT[action]) return ACTION_TEXT[action];
  const words = action.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Security-relevant actions are highlighted in the activity feed and audit log. */
export function actionTone(action: string): 'danger' | 'warning' | 'neutral' {
  if (action === 'LOGIN_FAILED' || action === 'LOGIN_LOCKED') return 'danger';
  if (action.startsWith('USER_') || action === 'PASSWORD_CHANGED' || action === 'CREDENTIAL_SET') return 'warning';
  return 'neutral';
}

export function roleName(code: string | null | undefined): string {
  if (!code) return '—';
  const words = code.replace(/_/g, ' ').toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** "just now", "5 min ago", "3 h ago", "yesterday", then a date. */
export function relativeTime(value: string | null | undefined, now: number = Date.now()): string {
  if (!value) return '—';
  const then = new Date(value).getTime();
  const seconds = Math.round((now - then) / 1000);
  if (seconds < 45) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(value).toLocaleDateString(undefined, { dateStyle: 'medium' });
}
