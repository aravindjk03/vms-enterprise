import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ApiError } from '../apps/web/src/api/client.js';
import { createDemoBackend, demoSessionUser, resetDemoState } from '../apps/web/src/demo/demoBackend.js';
import { groupPermissions } from '../apps/web/src/views/live/admin/common.js';
import { describeAction, relativeTime } from '../apps/web/src/views/live/activity.js';
import { ROLE_PERMISSIONS } from '../packages/permissions/src/index.js';
import type { EnterpriseRole } from '../packages/types/src/index.js';

type Rows = { items: Array<Record<string, unknown>>; total: number };

function backendFor(username: string, name: string, role: EnterpriseRole) {
  return createDemoBackend(demoSessionUser({ username, name, role }));
}

async function rejects(p: Promise<unknown>, status: number): Promise<ApiError> {
  try {
    await p;
  } catch (err) {
    assert.ok(err instanceof ApiError, 'expected an ApiError');
    assert.equal(err.status, status, err.message);
    return err;
  }
  assert.fail(`expected HTTP ${status}`);
}

test('demo backend applies the same access rules as the server', async t => {
  await t.test('a super admin creates a user with a one-time password that meets the policy', async () => {
    resetDemoState();
    const api = backendFor('admin', 'Dana Whitfield', 'SUPER_ADMIN');
    const created = (await api('POST', '/api/v1/admin/users', {
      fullName: 'Lena Ortiz',
      username: 'lena.ortiz',
      email: 'lena.ortiz@northwind.example',
      roles: ['RECEPTIONIST'],
      siteIds: ['SITE-CHN-01'],
    })) as { id: string; temporaryPassword: string };
    assert.match(created.temporaryPassword, /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{16}$/);
    const detail = (await api('GET', `/api/v1/admin/users/${created.id}`, undefined)) as Record<string, unknown>;
    assert.equal(detail['mustChangePassword'], true);
    assert.deepEqual((detail['history'] as Array<{ action: string }>).map(h => h.action), ['USER_CREATED']);
    await rejects(api('POST', '/api/v1/admin/users', { fullName: 'Dup', username: 'lena.ortiz', email: 'x@northwind.example', roles: ['HOST'] }), 409);
  });

  await t.test('a site admin cannot grant tenant-wide roles, see users outside their sites, or manage wider access', async () => {
    resetDemoState();
    const api = backendFor('site.admin', 'Marcus Okafor', 'SITE_ADMIN');
    await rejects(
      api('POST', '/api/v1/admin/users', { fullName: 'Eve Mallory', username: 'eve', email: 'eve@northwind.example', roles: ['SUPER_ADMIN'], siteIds: ['SITE-CHN-01'] }),
      403
    );
    await rejects(
      api('POST', '/api/v1/admin/users', { fullName: 'Eve Mallory', username: 'eve', email: 'eve@northwind.example', roles: ['HOST'], siteIds: ['SITE-PUN-02'] }),
      403
    );
    const list = (await api('GET', '/api/v1/admin/users?limit=100', undefined)) as Rows;
    const names = list.items.map(u => u['fullName']);
    assert.ok(!names.includes('Dana Whitfield'), 'super admin without shared sites is hidden');
    const leena = list.items.find(u => u['fullName'] === 'Leena Joshi')!;
    assert.equal(leena['canManage'], false, 'a user with a site outside scope is view-only');
    await rejects(api('POST', `/api/v1/admin/users/${leena['id']}/reset-password`, { reason: 'testing scope' }), 403);
    const roles = (await api('GET', '/api/v1/admin/roles', undefined)) as { items: Array<{ code: string; assignable: boolean }> };
    const assignable = roles.items.filter(r => r.assignable).map(r => r.code);
    for (const r of ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'IT_ADMIN']) assert.ok(!assignable.includes(r), r);
    assert.ok(assignable.includes('RECEPTIONIST'));
  });

  await t.test('changes need a reason, cannot target yourself and keep one active super admin', async () => {
    resetDemoState();
    const api = backendFor('admin', 'Dana Whitfield', 'SUPER_ADMIN');
    const guard = 'u-guard';
    await rejects(api('POST', `/api/v1/admin/users/${guard}/unlock`, { reason: '' }), 400);
    await rejects(api('PATCH', '/api/v1/admin/users/u-admin', { status: 'SUSPENDED', reason: 'self test' }), 403);
    const audit = (await api('GET', '/api/v1/audit-logs?action=USER_UNLOCKED', undefined)) as Rows;
    assert.equal(audit.total, 0, 'refused changes are not audited');
    await api('POST', '/api/v1/admin/users/u-guard-2/unlock', { reason: 'Verified identity by phone' });
    const after = (await api('GET', '/api/v1/audit-logs?action=USER_UNLOCKED', undefined)) as Rows;
    assert.equal(after.items[0]['reason'], 'Verified identity by phone');
    // The org admin may not remove the only super admin's role.
    const org = backendFor('org.admin', 'Olu Adebayo', 'ORGANIZATION_ADMIN');
    await rejects(org('PUT', '/api/v1/admin/users/u-admin/roles', { roles: ['HOST'], reason: 'downgrade' }), 403);
  });

  await t.test('two-step verification: reset by an administrator and the organization policy', async () => {
    resetDemoState();
    const admin = backendFor('admin', 'Dana Whitfield', 'SUPER_ADMIN');
    const before = (await admin('GET', '/api/v1/admin/users/u-security-manager', undefined)) as Record<string, unknown>;
    assert.equal(before['mfaEnabled'], true);
    await rejects(admin('POST', '/api/v1/admin/users/u-security-manager/reset-mfa', {}), 400);
    await admin('POST', '/api/v1/admin/users/u-security-manager/reset-mfa', { reason: 'Lost phone' });
    const after = (await admin('GET', '/api/v1/admin/users/u-security-manager', undefined)) as Record<string, unknown>;
    assert.equal(after['mfaEnabled'], false);
    await rejects(admin('POST', '/api/v1/admin/users/u-security-manager/reset-mfa', { reason: 'again' }), 409);

    const siteAdmin = backendFor('site.admin', 'Marcus Okafor', 'SITE_ADMIN');
    await rejects(siteAdmin('PUT', '/api/v1/admin/security-settings', { requireMfaForAdmins: true, reason: 'policy' }), 403);
    assert.equal(((await siteAdmin('GET', '/api/v1/admin/security-settings', undefined)) as Record<string, unknown>)['administrators'], null);
    await admin('PUT', '/api/v1/admin/security-settings', { requireMfaForAdmins: true, reason: 'Security review' });
    const settings = (await admin('GET', '/api/v1/admin/security-settings', undefined)) as Record<string, number | boolean>;
    assert.equal(settings['requireMfaForAdmins'], true);
    assert.ok((settings['administrators'] as number) > (settings['administratorsWithMfa'] as number));
    const marcus = (await admin('GET', '/api/v1/admin/users/u-site-admin', undefined)) as Record<string, unknown>;
    assert.equal(marcus['mfaRequiredByPolicy'], true);
  });

  await t.test('roles without USER_MANAGE are refused and the dashboard hides counts the role cannot read', async () => {
    resetDemoState();
    const host = backendFor('host', 'Priya Raman', 'HOST');
    await rejects(host('GET', '/api/v1/admin/users', undefined), 403);
    await rejects(host('GET', '/api/v1/audit-logs', undefined), 403);
    const summary = (await host('GET', '/api/v1/dashboard/summary', undefined)) as Record<string, number | null>;
    assert.equal(summary['contractorCompanies'], null);
    assert.equal(summary['gateEventsToday'], null);
  });
});

test('roles screen and activity wording', async t => {
  await t.test('every permission any role holds has a plain-language label', () => {
    for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
      const other = groupPermissions(permissions).find(g => g.area === 'Other');
      assert.equal(other, undefined, `${role} has unlabelled permissions: ${other?.items.map(i => i[0]).join(', ')}`);
    }
  });

  await t.test('audit actions read as sentences and times as relative phrases', () => {
    assert.equal(describeAction('USER_PASSWORD_RESET'), 'Reset a password');
    assert.equal(describeAction('SOMETHING_NEW'), 'Something new');
    const now = Date.parse('2026-10-26T12:00:00Z');
    assert.equal(relativeTime('2026-10-26T11:59:40Z', now), 'just now');
    assert.equal(relativeTime('2026-10-26T11:15:00Z', now), '45 min ago');
    assert.equal(relativeTime('2026-10-25T11:00:00Z', now), 'yesterday');
  });
});
