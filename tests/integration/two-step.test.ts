/**
 * Two-step verification, the organization sign-in policy and the user's own sessions, against the real
 * API and PostgreSQL.
 */
import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { setUserPassword } from '../../packages/database/scripts/bootstrap-user.js';
import { base32Decode, totpCode, totpStep } from '../../apps/api/src/security/totp.js';
import { ADMIN_URL, addUser, createTestEnv, type Session, type TestEnv } from './helpers.js';

const T = '00000000-0000-0000-0000-000000000001';
const ORG = '00000000-0000-0000-0000-000000000010';
const DETROIT = '00000000-0000-0000-0000-000000000101';
const ADMIN_PW = 'Detroit#Admin2026';
const PW = 'TwoStep#Test2026!';

const codeAt = (secret: string, offset = 0) => totpCode(base32Decode(secret), totpStep() + offset);

/** Waits out the last seconds of a 30-second step so a computed code cannot roll over mid-request. */
async function freshStep(): Promise<void> {
  const into = (Date.now() / 1000) % 30;
  if (into > 24) await new Promise(r => setTimeout(r, (30 - into) * 1000 + 300));
}

describe('Two-step verification (API + PostgreSQL)', { skip: !ADMIN_URL && 'INTEGRATION_DATABASE_URL not set' }, () => {
  let env: TestEnv;
  let admin: Session;
  let adminSecret = '';
  let recoveryCodes: string[] = [];

  const login = (username: string, password: string) =>
    env.app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { tenantCode: 'GLOBAL-MFG', username, password } });
  const verify = (challenge: string, code: string) => env.app.inject({ method: 'POST', url: '/api/v1/auth/login/verify', payload: { challenge, code } });

  before(async () => {
    env = await createTestEnv();
    await setUserPassword(env.owner, 'GLOBAL-MFG', 'admin.detroit', ADMIN_PW, 'SUPER_ADMIN');
    await addUser(env.owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'site.lead', role: 'SITE_ADMIN', siteIds: [DETROIT], password: PW });
    await addUser(env.owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'gate.one', role: 'SECURITY_GUARD', siteIds: [DETROIT], password: PW });
    await addUser(env.owner, { tenantId: T, orgId: ORG, tenantCode: 'GLOBAL-MFG', username: 'locked.out', role: 'RECEPTIONIST', siteIds: [DETROIT], password: PW });
    admin = await env.login('GLOBAL-MFG', 'admin.detroit', ADMIN_PW);
  });

  after(async () => {
    await env?.close();
  });

  it('sets up an authenticator: password first, confirmed with a code, secret stored encrypted', async () => {
    assert.equal((await admin.post('/api/v1/auth/mfa/setup', { currentPassword: 'wrong' })).statusCode, 400);
    const setup = await admin.post('/api/v1/auth/mfa/setup', { currentPassword: ADMIN_PW });
    assert.equal(setup.statusCode, 200);
    adminSecret = setup.json().secret;
    assert.match(adminSecret, /^[A-Z2-7]{32}$/);
    assert.ok(setup.json().otpauthUrl.startsWith('otpauth://totp/VMS%20Enterprise:admin.detroit'));

    const stored = (await env.owner.query("SELECT secret_encrypted, enabled_at FROM user_mfa m JOIN users u USING (user_id) WHERE u.username = 'admin.detroit'")).rows[0];
    assert.ok(stored.secret_encrypted.startsWith('v1.') && !stored.secret_encrypted.includes(adminSecret));
    assert.equal(stored.enabled_at, null, 'not enforced until confirmed');
    // Until confirmed, signing in still needs only the password.
    assert.ok((await login('admin.detroit', ADMIN_PW)).json().accessToken);

    assert.equal((await admin.post('/api/v1/auth/mfa/enable', { code: '000000' })).statusCode, 400);
    await freshStep();
    const enabled = await admin.post('/api/v1/auth/mfa/enable', { code: codeAt(adminSecret, -1) });
    assert.equal(enabled.statusCode, 200, enabled.body);
    recoveryCodes = enabled.json().recoveryCodes;
    assert.equal(recoveryCodes.length, 10);
    assert.equal(enabled.json().user.mfaEnabled, true);
    const status = (await admin.get('/api/v1/auth/mfa')).json();
    assert.deepEqual([status.enabled, status.recoveryCodesLeft], [true, 10]);
  });

  it('signs in with password plus a fresh code; wrong, reused and forged codes are refused', async () => {
    const step1 = await login('admin.detroit', ADMIN_PW);
    assert.equal(step1.statusCode, 200);
    assert.equal(step1.json().mfaRequired, true);
    assert.equal(step1.json().accessToken, undefined, 'the password alone opens no session');
    assert.equal(step1.headers['set-cookie'], undefined, 'no refresh cookie before the second step');
    const challenge = step1.json().challenge;

    assert.equal((await verify(challenge, '123456')).json().error.code, 'INVALID_CODE');
    assert.equal((await verify(challenge, codeAt(adminSecret, -1))).statusCode, 401, 'the code used to confirm setup cannot be replayed');
    assert.equal((await verify(`${challenge}x`, codeAt(adminSecret))).json().error.code, 'MFA_CHALLENGE_EXPIRED');
    assert.equal((await verify(admin.auth.authorization.slice(7), codeAt(adminSecret))).statusCode, 401, 'an access token is not a challenge');

    await freshStep();
    const ok = await verify(challenge, codeAt(adminSecret));
    assert.equal(ok.statusCode, 200, ok.body);
    assert.ok(ok.json().accessToken);
    const session = env.session(ok);
    assert.equal((await session.get('/api/v1/auth/me')).json().mfaEnabled, true);
    const audit = await env.owner.query("SELECT reason FROM audit_logs WHERE action = 'LOGIN_SUCCESS' ORDER BY \"timestamp\" DESC LIMIT 1");
    assert.equal(audit.rows[0].reason, 'two-step verification: authenticator app');
    admin = session;
  });

  it('accepts each recovery code once', async () => {
    const challenge = (await login('admin.detroit', ADMIN_PW)).json().challenge;
    const used = recoveryCodes[0].toLowerCase();
    const ok = await verify(challenge, used);
    assert.equal(ok.statusCode, 200, ok.body);
    const again = await verify((await login('admin.detroit', ADMIN_PW)).json().challenge, used);
    assert.equal(again.statusCode, 401);
    assert.equal((await admin.get('/api/v1/auth/mfa')).json().recoveryCodesLeft, 9);
    const previous = recoveryCodes;
    const fresh = await admin.post('/api/v1/auth/mfa/recovery-codes', { currentPassword: ADMIN_PW });
    assert.equal(fresh.json().recoveryCodes.length, 10);
    recoveryCodes = fresh.json().recoveryCodes;
    // Without the dash works too.
    assert.equal((await verify((await login('admin.detroit', ADMIN_PW)).json().challenge, recoveryCodes[1].replace('-', ''))).statusCode, 200);
    // The earlier set no longer works.
    assert.equal((await verify((await login('admin.detroit', ADMIN_PW)).json().challenge, previous[2])).statusCode, 401);
  });

  it('counts wrong codes towards the lockout', async () => {
    const user = await env.login('GLOBAL-MFG', 'locked.out', PW);
    const secret = (await user.post('/api/v1/auth/mfa/setup', { currentPassword: PW })).json().secret;
    await freshStep();
    assert.equal((await user.post('/api/v1/auth/mfa/enable', { code: codeAt(secret, -1) })).statusCode, 200);
    for (let i = 0; i < 5; i++) {
      const challenge = (await login('locked.out', PW)).json().challenge;
      assert.equal((await verify(challenge, '000000')).statusCode, 401);
    }
    const locked = await env.owner.query("SELECT locked_until FROM user_credentials c JOIN users u USING (user_id) WHERE u.username = 'locked.out'");
    assert.ok(locked.rows[0].locked_until > new Date(), 'locked after 5 wrong codes');
    assert.equal((await login('locked.out', PW)).statusCode, 401, 'and the password step refuses too');
  });

  it('reports an unreadable secret (changed key) without counting it against the user', async () => {
    await env.owner.query("UPDATE user_mfa SET secret_encrypted = 'v1.AAAA' FROM users u WHERE u.user_id = user_mfa.user_id AND u.username = 'locked.out'");
    await env.owner.query("UPDATE user_credentials SET failed_attempts = 0, locked_until = NULL FROM users u WHERE u.user_id = user_credentials.user_id AND u.username = 'locked.out'");
    const challenge = (await login('locked.out', PW)).json().challenge;
    const res = await verify(challenge, '123456');
    assert.equal(res.statusCode, 409);
    assert.equal(res.json().error.code, 'MFA_SECRET_UNREADABLE');
    const attempts = await env.owner.query("SELECT failed_attempts FROM user_credentials c JOIN users u USING (user_id) WHERE u.username = 'locked.out'");
    assert.equal(attempts.rows[0].failed_attempts, 0);
  });

  it('lets an administrator reset a lost authenticator; the user then signs in with the password', async () => {
    const guard = await env.login('GLOBAL-MFG', 'gate.one', PW);
    const secret = (await guard.post('/api/v1/auth/mfa/setup', { currentPassword: PW })).json().secret;
    await freshStep();
    await guard.post('/api/v1/auth/mfa/enable', { code: codeAt(secret, -1) });
    const id = guard.user.userId;
    const detail = (await admin.get(`/api/v1/admin/users/${id}`)).json();
    assert.equal(detail.mfaEnabled, true);

    const siteLead = await env.login('GLOBAL-MFG', 'site.lead', PW);
    assert.equal((await siteLead.post(`/api/v1/admin/users/${id}/reset-mfa`, {})).statusCode, 400, 'a reason is required');
    assert.equal((await siteLead.post(`/api/v1/admin/users/${id}/reset-mfa`, { reason: 'Lost phone, verified in person' })).statusCode, 200);
    assert.equal((await guard.get('/api/v1/auth/me')).statusCode, 401, 'existing sessions end');
    assert.ok((await login('gate.one', PW)).json().accessToken, 'password alone works again');
    assert.equal((await siteLead.post(`/api/v1/admin/users/${id}/reset-mfa`, { reason: 'again' })).statusCode, 409);
    const audit = await env.owner.query("SELECT reason FROM audit_logs WHERE action = 'USER_MFA_RESET' AND entity_id = $1", [id]);
    assert.equal(audit.rows[0].reason, 'Lost phone, verified in person');
  });

  it('enforces the organization policy for administrators only', async () => {
    const siteLead = await env.login('GLOBAL-MFG', 'site.lead', PW);
    assert.equal((await siteLead.put('/api/v1/admin/security-settings', { requireMfaForAdmins: true, reason: 'Audit finding 12' })).statusCode, 403);
    const turnOn = await admin.put('/api/v1/admin/security-settings', { requireMfaForAdmins: true, reason: 'Audit finding 12' });
    assert.equal(turnOn.statusCode, 200, turnOn.body);
    const settings = (await admin.get('/api/v1/admin/security-settings')).json();
    assert.equal(settings.requireMfaForAdmins, true);
    assert.ok(settings.administrators >= 2 && settings.administratorsWithMfa >= 1);

    // The site admin has no authenticator yet: only the auth endpoints work until it is set up.
    const me = (await siteLead.get('/api/v1/auth/me')).json();
    assert.equal(me.mfaEnrollmentRequired, true);
    assert.equal((await siteLead.get('/api/v1/admin/users')).json().error.code, 'MFA_ENROLLMENT_REQUIRED');
    const secret = (await siteLead.post('/api/v1/auth/mfa/setup', { currentPassword: PW })).json().secret;
    await freshStep();
    assert.equal((await siteLead.post('/api/v1/auth/mfa/enable', { code: codeAt(secret, -1) })).statusCode, 200);
    assert.equal((await siteLead.get('/api/v1/admin/users')).statusCode, 200);
    assert.equal((await siteLead.get('/api/v1/admin/security-settings')).json().administrators, null, 'site admins get no organization-wide figures');
    assert.equal((await siteLead.post('/api/v1/auth/mfa/disable', { currentPassword: PW, code: codeAt(secret) })).json().error.code, 'MFA_REQUIRED_BY_POLICY');

    // A guard is not an administrator: unaffected.
    const guard = env.session(await login('gate.one', PW));
    assert.equal((await guard.get('/api/v1/auth/me')).json().mfaEnrollmentRequired, false);
    assert.equal((await guard.get('/api/v1/visitors')).statusCode, 200);

    await admin.put('/api/v1/admin/security-settings', { requireMfaForAdmins: false, reason: 'Test cleanup' });
    await freshStep();
    const off = await siteLead.post('/api/v1/auth/mfa/disable', { currentPassword: PW, code: codeAt(secret) });
    assert.equal(off.statusCode, 200, off.body);
    assert.equal(off.json().mfaEnabled, false);
    const actions = (await env.owner.query("SELECT action FROM audit_logs WHERE action IN ('SECURITY_SETTINGS_CHANGED', 'MFA_DISABLED')")).rows.map(r => r.action);
    assert.ok(actions.includes('SECURITY_SETTINGS_CHANGED') && actions.includes('MFA_DISABLED'));
  });

  it('lists the user’s own signed-in devices and signs out the others', async () => {
    const first = await env.login('GLOBAL-MFG', 'gate.one', PW);
    const second = await env.login('GLOBAL-MFG', 'gate.one', PW);
    const list = (await second.get('/api/v1/auth/sessions')).json().items as Array<{ id: string; current: boolean }>;
    assert.ok(list.length >= 2);
    assert.equal(list.filter(s => s.current).length, 1);
    const current = list.find(s => s.current)!;
    assert.equal((await second.post(`/api/v1/auth/sessions/${current.id}/revoke`)).statusCode, 400);
    assert.equal((await second.post('/api/v1/auth/sessions/revoke-others')).statusCode, 200);
    assert.equal((await first.get('/api/v1/auth/me')).statusCode, 401);
    assert.equal((await second.get('/api/v1/auth/me')).statusCode, 200);
    assert.equal(((await second.get('/api/v1/auth/sessions')).json().items as unknown[]).length, 1);
  });
});
