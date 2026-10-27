import React, { useState } from 'react';
import { Check, Clock, KeyRound, Lock, ShieldCheck, Smartphone } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import { card, ErrorNote, fmt, PageHeader, useApi } from '../LiveViews.js';
import { Chip, ReasonDialog, useSend } from './common.js';

interface SecuritySettings {
  requireMfaForAdmins: boolean;
  updatedAt: string | null;
  activeUsers: number | null;
  usersWithMfa: number | null;
  administrators: number | null;
  administratorsWithMfa: number | null;
  canEdit: boolean;
  youHaveMfa: boolean;
}

const Stat: React.FC<{ label: string; value: number | null; of: number | null }> = ({ label, value, of }) => {
  const pct = value !== null && of ? Math.round((value / of) * 100) : null;
  return (
    <div style={{ padding: '14px 16px', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.lg }}>
      <div style={{ fontSize: '13px', color: colors.slate[600] }}>{label}</div>
      <div style={{ marginTop: '4px', fontSize: '24px', fontWeight: 700, color: colors.slate[900], fontVariantNumeric: 'tabular-nums' }}>
        {value ?? '—'}
        {of !== null && <span style={{ fontSize: '14px', fontWeight: 500, color: colors.slate[500] }}> of {of}</span>}
      </div>
      {pct !== null && (
        <div aria-hidden="true" style={{ marginTop: '8px', height: '6px', borderRadius: radius.full, backgroundColor: colors.slate[100] }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: radius.full, backgroundColor: pct === 100 ? colors.status.success.fg : colors.primary[500] }} />
        </div>
      )}
    </div>
  );
};

/** Organization sign-in policy: require two-step verification for administrators, plus the fixed password rules. */
export const SecurityView: React.FC<{ onSetUpTwoStep?: () => void }> = ({ onSetUpTwoStep }) => {
  const { data, error, reload } = useApi<SecuritySettings>('/api/v1/admin/security-settings');
  const [confirming, setConfirming] = useState(false);
  const { send, busy, error: sendError, setError } = useSend();

  const next = data ? !data.requireMfaForAdmins : false;
  return (
    <div>
      <PageHeader title="Sign-in security" subtitle="How people in your organization sign in. Every change is recorded in the audit log." />
      <ErrorNote error={error} />
      {data && (
        <div style={{ display: 'grid', gap: '20px' }}>
          <section style={{ ...card, padding: '20px 22px' }} aria-label="Two-step verification policy">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', minWidth: 0, flex: '1 1 360px' }}>
                <span style={{ display: 'grid', placeItems: 'center', width: '40px', height: '40px', flexShrink: 0, borderRadius: radius.lg, backgroundColor: colors.primary[50], color: colors.primary[600] }}>
                  <Smartphone size={20} aria-hidden="true" />
                </span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: colors.slate[900] }}>Require two-step verification for administrators</h2>
                  <p style={{ margin: '4px 0 0', fontSize: '14px', lineHeight: 1.5, color: colors.slate[600], maxWidth: '640px' }}>
                    Anyone who can manage users or system settings must confirm each sign-in with a code from an authenticator app. Administrators without it are asked to set
                    it up before they can do anything else.
                  </p>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {data.requireMfaForAdmins ? <Chip tone="primary">Required</Chip> : <Chip>Not required</Chip>}
                    {data.updatedAt && <span style={{ fontSize: '12px', color: colors.slate[500] }}>Changed {fmt(data.updatedAt)}</span>}
                  </div>
                </div>
              </div>
              {data.canEdit ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={data.requireMfaForAdmins}
                  aria-label="Require two-step verification for administrators"
                  onClick={() => setConfirming(true)}
                  style={{
                    position: 'relative',
                    width: '48px',
                    height: '28px',
                    flexShrink: 0,
                    border: 'none',
                    borderRadius: radius.full,
                    backgroundColor: data.requireMfaForAdmins ? colors.primary[600] : colors.slate[300],
                    cursor: 'pointer',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      top: '3px',
                      left: data.requireMfaForAdmins ? '23px' : '3px',
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 2px rgba(16,24,40,0.2)',
                      transition: 'left 120ms ease',
                    }}
                  />
                </button>
              ) : (
                <span style={{ fontSize: '13px', color: colors.slate[500] }}>Changed by organization administrators</span>
              )}
            </div>
            {data.canEdit && !data.requireMfaForAdmins && !data.youHaveMfa && (
              <div role="note" style={{ marginTop: '14px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', padding: '10px 12px', borderRadius: radius.lg, backgroundColor: colors.status.warning.bg, border: `1px solid ${colors.status.warning.border}`, fontSize: '13px', color: colors.status.warning.fg }}>
                Turn on two-step verification for your own account before requiring it from others.
                {onSetUpTwoStep && (
                  <button type="button" onClick={onSetUpTwoStep} style={{ border: 'none', background: 'none', padding: 0, fontWeight: 600, color: colors.primary[700], cursor: 'pointer', fontSize: '13px' }}>
                    Set it up now
                  </button>
                )}
              </div>
            )}
            {data.administrators !== null && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: '12px', marginTop: '18px' }}>
                <Stat label="Administrators using two-step" value={data.administratorsWithMfa} of={data.administrators} />
                <Stat label="Everyone using two-step" value={data.usersWithMfa} of={data.activeUsers} />
              </div>
            )}
          </section>

          <section style={{ ...card, padding: '20px 22px' }} aria-label="Password and sign-in rules">
            <h2 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 600, color: colors.slate[900] }}>Password and sign-in rules</h2>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '12px' }}>
              {[
                [<KeyRound key="k" size={16} />, 'Passwords have at least 12 characters with upper- and lowercase letters, a number and a symbol, and never contain the username.'],
                [<Check key="c" size={16} />, 'The last 5 passwords cannot be used again. Changing a password signs out the person’s other devices.'],
                [<Lock key="l" size={16} />, 'By default, five wrong passwords or codes in a row lock the account for 15 minutes. Administrators can unlock it sooner.'],
                [<ShieldCheck key="s" size={16} />, 'New accounts and password resets get a one-time password that must be replaced at the first sign-in.'],
                [<Clock key="t" size={16} />, 'By default, a session ends after 12 hours without use. People can see and sign out their own devices from the account menu.'],
              ].map(([icon, text], i) => (
                <li key={i} style={{ display: 'flex', gap: '10px', fontSize: '14px', lineHeight: 1.5, color: colors.slate[700] }}>
                  <span style={{ color: colors.primary[600], marginTop: '2px', flexShrink: 0 }}>{icon}</span>
                  {text}
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {confirming && data && (
        <ReasonDialog
          title={next ? 'Require two-step verification?' : 'Stop requiring two-step verification?'}
          description={
            next
              ? `Administrators without two-step verification (${data.administrators !== null && data.administratorsWithMfa !== null ? data.administrators - data.administratorsWithMfa : 'some'}) will have to set it up before they can continue working.`
              : 'Administrators keep two-step verification if they already use it, but new administrators will not have to set it up.'
          }
          confirmLabel={next ? 'Require it' : 'Stop requiring'}
          danger={!next}
          busy={busy}
          error={sendError}
          onClose={() => {
            setConfirming(false);
            setError(null);
          }}
          onConfirm={async reason => {
            if (await send('PUT', '/api/v1/admin/security-settings', { requireMfaForAdmins: next, reason })) {
              setConfirming(false);
              void reload();
            }
          }}
        />
      )}
    </div>
  );
};
