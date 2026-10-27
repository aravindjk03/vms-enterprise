import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import qrcode from 'qrcode-generator';
import { colors, radius, typography } from '@vms/ui/tokens';
import { ApiError, apiRequest, type SessionUser } from '../api/client.js';
import { Dialog, DialogActions } from '../views/live/admin/common.js';
import { buttonStyle } from '../views/live/LiveViews.js';
import { AuthLayout, ErrorBox, Heading, PasswordInput, PrimaryButton, TextInput, inputStyle } from './AuthViews.js';

/* -------------------------------------------------------------------------------------------------
 * Two-step verification: setup (password → scan → confirm → recovery codes), management, and the
 * full-page setup an organization can require from administrators.
 * -----------------------------------------------------------------------------------------------*/

interface MfaStatus {
  enabled: boolean;
  enabledAt: string | null;
  recoveryCodesLeft: number;
  requiredByPolicy: boolean;
}

const message = (err: unknown, fallback: string) =>
  err instanceof ApiError ? (err.status === 429 ? 'Too many attempts. Wait a minute and try again.' : err.message) : fallback;

/** QR code drawn as one SVG path (no images, so it works under a strict content security policy). */
export const QrCode: React.FC<{ value: string; size?: number; label: string }> = ({ value, size = 184, label }) => {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + 4} ${r + 4}h1v1h-1z`;
    return { path: d, count: n + 8 };
  }, [value]);
  return (
    <svg role="img" aria-label={label} width={size} height={size} viewBox={`0 0 ${count} ${count}`} shapeRendering="crispEdges" style={{ display: 'block', background: '#ffffff', borderRadius: radius.lg }}>
      <path d={path} fill="#0b1626" />
    </svg>
  );
};

/** Recovery codes, shown once: copy or download them before continuing. */
const RecoveryCodes: React.FC<{ codes: string[]; onDone: () => void; doneLabel?: string }> = ({ codes, onDone, doneLabel = 'I have saved my codes' }) => {
  const [copied, setCopied] = useState(false);
  const text = `VMS Enterprise recovery codes\nEach code works once. Keep them somewhere safe.\n\n${codes.join('\n')}\n`;
  return (
    <div style={{ display: 'grid', gap: '14px' }}>
      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: colors.slate[600] }}>
        If you lose your phone, each of these codes lets you sign in once. Store them in your password manager or print them. They are shown only now.
      </p>
      <ol
        aria-label="Recovery codes"
        style={{ listStyle: 'none', margin: 0, padding: '14px', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 16px', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.lg, backgroundColor: colors.slate[50] }}
      >
        {codes.map(code => (
          <li key={code} style={{ fontFamily: typography.fontFamily.mono, fontSize: '15px', letterSpacing: '0.04em', color: colors.slate[900] }}>
            {code}
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          type="button"
          style={buttonStyle()}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
        >
          {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy all'}
        </button>
        <button
          type="button"
          style={buttonStyle()}
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'vms-recovery-codes.txt';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download size={15} /> Download
        </button>
      </div>
      <button type="button" data-autofocus onClick={onDone} style={{ ...buttonStyle('primary'), minHeight: '40px' }}>
        {doneLabel}
      </button>
    </div>
  );
};

/** Setup steps shared by the account dialog and the required-setup page. */
export const TwoStepSetup: React.FC<{ onEnabled: (user: SessionUser) => void; compact?: boolean }> = ({ onEnabled, compact }) => {
  const [stage, setStage] = useState<'password' | 'scan' | 'codes'>('password');
  const [password, setPassword] = useState('');
  const [setup, setSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<{ recoveryCodes: string[]; user: SessionUser } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(message(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'codes' && result) return <RecoveryCodes codes={result.recoveryCodes} onDone={() => onEnabled(result.user)} />;

  if (stage === 'scan' && setup) {
    const grouped = setup.secret.match(/.{1,4}/g)?.join(' ') ?? setup.secret;
    return (
      <form
        onSubmit={e => {
          e.preventDefault();
          void run(async () => {
            setResult(await apiRequest<{ recoveryCodes: string[]; user: SessionUser }>('/api/v1/auth/mfa/enable', { method: 'POST', body: { code } }));
            setStage('codes');
          }, 'The code could not be checked.');
        }}
        style={{ display: 'grid', gap: '16px' }}
      >
        <ol style={{ margin: 0, paddingLeft: '20px', display: 'grid', gap: '6px', fontSize: '14px', lineHeight: 1.5, color: colors.slate[700] }}>
          <li>Open an authenticator app on your phone (for example Microsoft Authenticator, Google Authenticator or 1Password).</li>
          <li>Scan this code, or type the setup key.</li>
          <li>Enter the 6-digit code the app shows.</li>
        </ol>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', padding: '14px', border: `1px solid ${colors.slate[200]}`, borderRadius: radius.lg, backgroundColor: colors.slate[50] }}>
          <QrCode value={setup.otpauthUrl} size={compact ? 156 : 176} label="QR code for your authenticator app" />
          <div style={{ minWidth: 0, flex: '1 1 160px' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: colors.slate[500] }}>Setup key</div>
            <code data-testid="mfa-setup-key" style={{ display: 'block', marginTop: '4px', fontFamily: typography.fontFamily.mono, fontSize: '14px', lineHeight: 1.6, color: colors.slate[900], wordBreak: 'break-all' }}>
              {grouped}
            </code>
            <div style={{ marginTop: '6px', fontSize: '12px', color: colors.slate[500] }}>Time-based, 6 digits</div>
          </div>
        </div>
        {error && <ErrorBox>{error}</ErrorBox>}
        <TextInput
          id="mfa-code"
          label="Code from the app"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          autoFocus
          required
          style={{ ...inputStyle, fontSize: '20px', letterSpacing: '0.3em', fontFamily: typography.fontFamily.mono, textAlign: 'center' }}
        />
        <PrimaryButton busy={busy} disabled={code.length !== 6}>
          {busy ? 'Checking…' : 'Turn on two-step verification'}
        </PrimaryButton>
      </form>
    );
  }

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        void run(async () => {
          setSetup(await apiRequest<{ secret: string; otpauthUrl: string }>('/api/v1/auth/mfa/setup', { method: 'POST', body: { currentPassword: password } }));
          setStage('scan');
        }, 'Setup could not start.');
      }}
      style={{ display: 'grid', gap: '16px' }}
    >
      <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: colors.slate[600] }}>
        After your password, you will also enter a code from an app on your phone when you sign in. Someone who learns your password still cannot get in.
      </p>
      {error && <ErrorBox>{error}</ErrorBox>}
      <PasswordInput id="mfa-password" label="Your current password" value={password} onChange={setPassword} autoComplete="current-password" autoFocus />
      <PrimaryButton busy={busy}>{busy ? 'Starting…' : 'Continue'}</PrimaryButton>
    </form>
  );
};

/** Account menu → Two-step verification. */
export const TwoStepDialog: React.FC<{ user: SessionUser; onClose: () => void; onChanged: (user: SessionUser, note: string) => void }> = ({ user, onClose, onChanged }) => {
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [mode, setMode] = useState<'view' | 'setup' | 'disable' | 'codes'>('view');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiRequest<MfaStatus>('/api/v1/auth/mfa')
      .then(setStatus)
      .catch(err => setError(message(err, 'Could not load your settings.')));
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError(message(err, 'That did not work. Try again.'));
    } finally {
      setBusy(false);
    }
  };

  const title = 'Two-step verification';
  if (!status) {
    return (
      <Dialog title={title} onClose={onClose} icon={<ShieldCheck size={20} />}>
        {error ? <ErrorBox>{error}</ErrorBox> : <p style={{ fontSize: '14px', color: colors.slate[500] }}>Loading…</p>}
      </Dialog>
    );
  }

  if (!status.enabled) {
    return (
      <Dialog title={title} onClose={onClose} icon={<ShieldCheck size={20} />} width={520}>
        <TwoStepSetup compact onEnabled={next => onChanged(next, 'Two-step verification is on.')} />
      </Dialog>
    );
  }

  if (codes) {
    return (
      <Dialog title="New recovery codes" onClose={onClose} icon={<KeyRound size={20} />} width={480}>
        <RecoveryCodes codes={codes} onDone={onClose} doneLabel="Done" />
      </Dialog>
    );
  }

  return (
    <Dialog title={title} onClose={onClose} icon={<ShieldCheck size={20} />} width={480}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 14px', borderRadius: radius.lg, backgroundColor: colors.status.success.bg, border: `1px solid ${colors.status.success.border}` }}>
        <Smartphone size={20} color={colors.status.success.fg} aria-hidden="true" />
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: colors.status.success.fg }}>On{status.enabledAt ? ` since ${new Date(status.enabledAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}` : ''}</div>
          <div style={{ fontSize: '13px', color: colors.slate[600] }}>{status.recoveryCodesLeft} of 10 recovery codes left</div>
        </div>
      </div>
      {status.requiredByPolicy && (
        <p style={{ margin: '12px 0 0', fontSize: '13px', color: colors.slate[600] }}>Your organization requires two-step verification for administrators, so it cannot be turned off.</p>
      )}
      {mode === 'view' && (
        <DialogActions>
          <button type="button" style={buttonStyle()} onClick={() => setMode('codes')}>
            <KeyRound size={15} /> New recovery codes
          </button>
          {!status.requiredByPolicy && (
            <button type="button" style={buttonStyle('danger')} onClick={() => setMode('disable')}>
              Turn off
            </button>
          )}
        </DialogActions>
      )}
      {mode !== 'view' && (
        <form
          onSubmit={e => {
            e.preventDefault();
            void run(async () => {
              if (mode === 'codes') {
                const r = await apiRequest<{ recoveryCodes: string[] }>('/api/v1/auth/mfa/recovery-codes', { method: 'POST', body: { currentPassword: password } });
                setCodes(r.recoveryCodes);
              } else {
                const next = await apiRequest<SessionUser>('/api/v1/auth/mfa/disable', { method: 'POST', body: { currentPassword: password, code } });
                onChanged(next, 'Two-step verification is off.');
              }
            });
          }}
          style={{ display: 'grid', gap: '14px', marginTop: '16px' }}
        >
          <p style={{ margin: 0, fontSize: '14px', color: colors.slate[600] }}>
            {mode === 'codes'
              ? 'New codes replace all the old ones. Confirm with your password.'
              : 'Signing in will need only your password. Confirm with your password and a current code (or a recovery code).'}
          </p>
          {error && <ErrorBox>{error}</ErrorBox>}
          <PasswordInput id="mfa-manage-password" label="Your current password" value={password} onChange={setPassword} autoComplete="current-password" autoFocus />
          {mode === 'disable' && <TextInput id="mfa-manage-code" label="Code from the app" value={code} onChange={e => setCode(e.target.value.trim())} autoComplete="one-time-code" required />}
          <DialogActions>
            <button type="button" style={buttonStyle()} onClick={() => setMode('view')}>
              Cancel
            </button>
            <button type="submit" disabled={busy} style={{ ...buttonStyle(mode === 'disable' ? 'danger' : 'primary'), opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Working…' : mode === 'codes' ? 'Create new codes' : 'Turn off'}
            </button>
          </DialogActions>
        </form>
      )}
    </Dialog>
  );
};

/** Full page shown when the organization requires two-step verification and the administrator has none yet. */
export const MfaEnrollmentView: React.FC<{ user: SessionUser; onDone: (user: SessionUser) => void; onSignOut: () => void }> = ({ user, onDone, onSignOut }) => (
  <AuthLayout>
    <Heading
      title="Set up two-step verification"
      text={`${user.fullName.split(' ')[0]}, your organization requires administrators to confirm each sign-in with a code from their phone. It takes about a minute.`}
    />
    <TwoStepSetup onEnabled={onDone} />
    <button type="button" onClick={onSignOut} style={{ marginTop: '16px', border: 'none', background: 'none', color: colors.slate[600], fontSize: '14px', cursor: 'pointer', padding: 0 }}>
      Sign out
    </button>
  </AuthLayout>
);
