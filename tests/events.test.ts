import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  createDomainEvent,
  InMemoryEventBus,
  EVENT_TYPES,
} from '../packages/events/src/index.js';

describe('Domain Events & Asynchronous Outbox Architecture', () => {
  const eventBus = new InMemoryEventBus();
  const testTenantId = randomUUID();
  const testOrgId = randomUUID();
  const testSiteId = randomUUID();

  it('creates CloudEvents compliant domain events with full attribution', () => {
    const event = createDomainEvent({
      eventType: EVENT_TYPES.VISITOR_APPROVED,
      eventSource: 'vms:service:visitor',
      tenantId: testTenantId,
      organizationId: testOrgId,
      siteId: testSiteId,
      data: {
        transactionId: 'VIS-2026-0001',
        visitorName: 'Alice Walker',
        hostUserId: 'host-101',
      },
      actorId: 'host-101',
      actorRole: 'HOST',
    });

    assert.ok(event.eventId.startsWith('evt-'));
    assert.equal(event.eventType, 'vms.visitor.approved.v1');
    assert.equal(event.actorRole, 'HOST');
    assert.equal(event.data.visitorName, 'Alice Walker');
    assert.ok(new Date(event.eventTimestamp).getTime() > 0);
  });

  it('dispatches and processes events asynchronously through subscribers', async () => {
    let capturedEvent: any = null;

    eventBus.subscribe(EVENT_TYPES.GHG_CALCULATED, (evt) => {
      capturedEvent = evt;
    });

    const ghgEvent = createDomainEvent({
      eventType: EVENT_TYPES.GHG_CALCULATED,
      eventSource: 'vms:service:ghg',
      tenantId: testTenantId,
      organizationId: testOrgId,
      siteId: testSiteId,
      data: {
        calculationId: randomUUID(),
        emissionsKgCO2e: 45.2,
        ghgScope: 'SCOPE_3',
        sourceTransactionId: 'VIS-2026-0001',
      },
      actorId: 'system-ghg-worker',
      actorRole: 'SUPER_ADMIN',
    });

    await eventBus.publish(ghgEvent);

    assert.ok(capturedEvent);
    assert.equal(capturedEvent.data.emissionsKgCO2e, 45.2);
    assert.equal(capturedEvent.data.sourceTransactionId, 'VIS-2026-0001');
  });
});
