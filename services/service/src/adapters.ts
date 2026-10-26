/**
 * Integration boundaries with domains owned by later parts.
 *
 * Safety / Permit (Part 14) decides whether hazardous work may proceed.
 * Gate / Access (Part 13) decides physical entry and records observed gate events.
 * Service only displays their status; it never fabricates an approved permit or an entry.
 */

export type ExternalStatus = 'AVAILABLE' | 'UNAVAILABLE';

export interface SafetyPrerequisiteStatus {
  integration: ExternalStatus;
  /** SATISFIED / NOT_SATISFIED when the Safety service answered; UNKNOWN otherwise. */
  permitStatus: 'SATISFIED' | 'NOT_SATISFIED' | 'UNKNOWN';
  detail: string;
}

export interface SafetyPermitAdapter {
  getPrerequisiteStatus(input: { tenantId: string; workOrderId: string; siteId: string; permitRequired: boolean }): Promise<SafetyPrerequisiteStatus>;
}

export class UnavailableSafetyAdapter implements SafetyPermitAdapter {
  async getPrerequisiteStatus(input: { tenantId: string; workOrderId: string; siteId: string; permitRequired: boolean }): Promise<SafetyPrerequisiteStatus> {
    return {
      integration: 'UNAVAILABLE',
      permitStatus: 'UNKNOWN',
      detail: input.permitRequired
        ? 'The Safety & Permit service is not connected yet, so permit status cannot be confirmed automatically. An authorized EHS or site manager must verify prerequisites manually.'
        : 'The Safety & Permit service is not connected yet.',
    };
  }
}

export interface AccessStatus {
  integration: ExternalStatus;
  /** Latest observed gate event for the technician, when a Gate integration exists. */
  lastObservedEvent: null | { type: 'ENTRY' | 'EXIT'; at: string; gate: string };
  detail: string;
}

export interface AccessIntegrationAdapter {
  getTechnicianAccessStatus(input: { tenantId: string; siteId: string; personId: string }): Promise<AccessStatus>;
}

export class UnavailableAccessAdapter implements AccessIntegrationAdapter {
  async getTechnicianAccessStatus(_input: { tenantId: string; siteId: string; personId: string }): Promise<AccessStatus> {
    return {
      integration: 'UNAVAILABLE',
      lastObservedEvent: null,
      detail:
        'Gate & Access is not connected to Service yet. Arrival and departure shown here are reported milestones, not observed gate events, and a work order does not grant site access.',
    };
  }
}
