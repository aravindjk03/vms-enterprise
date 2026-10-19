import { randomUUID } from 'node:crypto';
import type { ConsentRecord, UserContext } from '@vms/types';

export interface RecordConsentInput {
  tenantId: string;
  personId: string;
  transactionId?: string;
  purpose: string;
  consentType: ConsentRecord['consentType'];
  versionPresented: string;
  accepted: boolean;
  channel: ConsentRecord['channel'];
  evidenceReference?: string;
}

export class PrivacyConsentService {
  private consents: Map<string, ConsentRecord> = new Map();
  private auditTrail: Array<{ action: string; consentId: string; personId: string; timestamp: Date; details?: Record<string, unknown> }> = [];

  /**
   * Records a granular, purpose-specific consent or refusal.
   */
  public recordConsent(input: RecordConsentInput): ConsentRecord {
    const consentId = `csnt-${randomUUID()}`;
    const timestamp = new Date();

    const record: ConsentRecord = {
      consentId,
      tenantId: input.tenantId,
      personId: input.personId,
      transactionId: input.transactionId,
      purpose: input.purpose,
      consentType: input.consentType,
      versionPresented: input.versionPresented,
      accepted: input.accepted,
      timestamp,
      channel: input.channel,
      evidenceReference: input.evidenceReference,
      withdrawn: false,
    };

    this.consents.set(consentId, record);
    this.logAuditEvent(input.accepted ? 'CONSENT_GRANTED' : 'CONSENT_REFUSED', consentId, input.personId, {
      purpose: input.purpose,
      consentType: input.consentType,
      channel: input.channel,
    });

    return record;
  }

  /**
   * Verifies if a person has valid, active (non-withdrawn) affirmative consent for a specific purpose.
   */
  public hasValidConsent(personId: string, consentType: ConsentRecord['consentType'], purpose?: string): boolean {
    const personConsents = Array.from(this.consents.values()).filter(
      c => c.personId === personId && c.consentType === consentType && !c.withdrawn
    );

    if (personConsents.length === 0) return false;

    // If specific purpose provided, check matching purpose
    if (purpose) {
      return personConsents.some(c => c.accepted && c.purpose.toLowerCase() === purpose.toLowerCase());
    }

    // Latest consent for this type must be accepted
    personConsents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return personConsents[0].accepted;
  }

  /**
   * Withdraws an existing consent record per GDPR / DPDP Right-to-Withdraw.
   */
  public withdrawConsent(consentId: string, requestedByUserId?: string, reason?: string): boolean {
    const record = this.consents.get(consentId);
    if (!record) return false;

    record.withdrawn = true;
    record.withdrawnAt = new Date();

    this.logAuditEvent('CONSENT_WITHDRAWN', consentId, record.personId, {
      requestedByUserId,
      reason: reason || 'Individual invoked right to withdraw consent.',
    });

    return true;
  }

  /**
   * Withdraws all active consents for a person (e.g. right-to-be-forgotten / full withdrawal).
   */
  public withdrawAllForPerson(personId: string, requestedByUserId?: string, reason?: string): number {
    let count = 0;
    for (const record of this.consents.values()) {
      if (record.personId === personId && !record.withdrawn) {
        record.withdrawn = true;
        record.withdrawnAt = new Date();
        count++;
        this.logAuditEvent('CONSENT_WITHDRAWN', record.consentId, personId, {
          requestedByUserId,
          reason: reason || 'Comprehensive consent withdrawal.',
        });
      }
    }
    return count;
  }

  /**
   * Returns all consent records for a person (with tenant isolation check).
   */
  public getConsentsForPerson(user: UserContext, personId: string): ConsentRecord[] {
    return Array.from(this.consents.values()).filter(c => {
      if (c.personId !== personId) return false;
      if (user.role !== 'SUPER_ADMIN' && user.tenantId !== c.tenantId) return false;
      return true;
    });
  }

  public getAuditTrail(personId?: string) {
    if (personId) {
      return this.auditTrail.filter(a => a.personId === personId);
    }
    return this.auditTrail;
  }

  private logAuditEvent(action: string, consentId: string, personId: string, details?: Record<string, unknown>) {
    this.auditTrail.push({
      action,
      consentId,
      personId,
      timestamp: new Date(),
      details,
    });
  }
}
