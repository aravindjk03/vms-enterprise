import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canAssignRole, canManageUserWithRoles, ROLE_PERMISSIONS, evaluateAccess } from '../packages/permissions/src/index.js';
import type { EnterpriseRole } from '../packages/types/src/index.js';

const ALL = Object.keys(ROLE_PERMISSIONS) as EnterpriseRole[];

test('role assignment cannot escalate privileges', async t => {
  await t.test('super admins grant every role', () => {
    assert.ok(ALL.every(r => canAssignRole(['SUPER_ADMIN'], r)));
  });

  await t.test('organization admins grant every role except super admin', () => {
    assert.equal(canAssignRole(['ORGANIZATION_ADMIN'], 'SUPER_ADMIN'), false);
    assert.ok(ALL.filter(r => r !== 'SUPER_ADMIN').every(r => canAssignRole(['ORGANIZATION_ADMIN'], r)));
  });

  await t.test('site admins grant only roles within their own permissions, never tenant-wide ones', () => {
    for (const r of ['SUPER_ADMIN', 'ORGANIZATION_ADMIN', 'IT_ADMIN'] as EnterpriseRole[]) {
      assert.equal(canAssignRole(['SITE_ADMIN'], r), false, r);
    }
    for (const r of ['HOST', 'RECEPTIONIST', 'SECURITY_GUARD', 'GATE_OPERATOR', 'SERVICE_MANAGER'] as EnterpriseRole[]) {
      assert.equal(canAssignRole(['SITE_ADMIN'], r), true, r);
    }
    // Every role a site admin may grant carries only permissions the site admin already holds.
    for (const r of ALL.filter(role => canAssignRole(['SITE_ADMIN'], role))) {
      for (const p of ROLE_PERMISSIONS[r]) {
        assert.ok(
          evaluateAccess({ userId: 'u', tenantId: 't', organizationId: 'o', role: 'SITE_ADMIN' }, p, { tenantId: 't' }).allowed,
          `${r} grants ${p}, which SITE_ADMIN lacks`
        );
      }
    }
  });

  await t.test('roles without USER_MANAGE cannot administer anyone more privileged', () => {
    assert.equal(canManageUserWithRoles(['SITE_ADMIN'], ['SUPER_ADMIN']), false);
    assert.equal(canManageUserWithRoles(['SITE_ADMIN'], ['HOST', 'SECURITY_GUARD']), true);
    assert.equal(canManageUserWithRoles(['SITE_ADMIN'], ['HOST', 'ORGANIZATION_ADMIN']), false);
  });

  await t.test('only administrator roles hold USER_MANAGE', () => {
    const holders = ALL.filter(r => ROLE_PERMISSIONS[r].includes('USER_MANAGE')).sort();
    assert.deepEqual(holders, ['ORGANIZATION_ADMIN', 'SITE_ADMIN', 'SUPER_ADMIN']);
  });
});
