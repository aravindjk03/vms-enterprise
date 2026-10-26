import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Building2, Check, Eye, EyeOff, KeyRound, Leaf, Loader2, Shield, ShieldCheck, X } from 'lucide-react';
import { colors, radius, shadows } from '@vms/ui/tokens';
import { ApiError, changePassword, login, type SessionUser } from '../api/client.js';
import type { EnterpriseRole } from '@vms/types';

/* -------------------------------------------------------------------------------------------------
 * Layout: brand panel + form panel (the brand panel hides on small screens).
 * -----------------------------------------------------------------------------------------------*/

function useNarrow(): boolean {
  const query = '(max-width: 900px)';
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setNarrow(mq.matches);
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return narrow;
}

const Logo: React.FC<{ light?: boolean }> = ({ light }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span
      aria-hidden="true"
      style={{ width: '38px', height: '38px', borderRadius: radius.lg, display: 'grid', placeItems: 'center', background: `linear-gradient(135deg, ${colors.primary[500]}, ${colors.primary[700]})` }}
    >
      <Shield size={20} color="#ffffff" />
    </span>
    <strong style={{ fontSize: '17px', color: light ? '#ffffff' : colors.slate[900], letterSpacing: '0.01em' }}>VMS Enterprise</strong>
  </div>
);

export const AuthLayout: React.FC<{ children: React.ReactNode; aside?: React.ReactNode }> = ({ children, aside }) => {
  const narrow = useNarrow();
  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: '#ffffff' }}>
      {!narrow && (
        <aside
          style={{
            flex: '0 0 44%',
            maxWidth: '640px',
            color: colors.navy[400],
            padding: '48px 56px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: colors.navy[900],
            backgroundImage: `radial-gradient(1200px 600px at -10% 110%, rgba(59,120,246,0.28), transparent 60%),
              linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)`,
            backgroundSize: 'auto, 40px 40px, 40px 40px',
          }}
        >
          <Logo light />
          {aside ?? <BrandStory />}
          <div style={{ fontSize: '12px', color: colors.navy[500] }}>Sign-ins are logged. Repeated failed attempts lock the account for 15 minutes.</div>
        </aside>
      )}
      <main style={{ flex: 1, display: 'grid', placeItems: 'center', padding: narrow ? '32px 20px' : '48px', minWidth: 0 }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>
          {narrow && (
            <div style={{ marginBottom: '28px' }}>
              <Logo />
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
};

const BrandStory: React.FC = () => (
  <div style={{ display: 'grid', gap: '28px', maxWidth: '460px' }}>
    <h2 style={{ margin: 0, fontSize: '34px', lineHeight: 1.15, fontWeight: 700, color: '#ffffff', textWrap: 'balance' as React.CSSProperties['textWrap'] }}>
      Every visitor, contractor and service visit, accounted for.
    </h2>
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '18px' }}>
      {[
        { icon: <ShieldCheck size={18} />, title: 'Role-based access', text: 'People see and do only what their role allows. Every action is audited.' },
        { icon: <Building2 size={18} />, title: 'Built for the gatehouse', text: 'Reception desks, gates and control rooms work from one live register.' },
        { icon: <Leaf size={18} />, title: 'Travel captured for ESG', text: 'Journeys are recorded once at the source for emissions reporting.' },
      ].map(f => (
        <li key={f.title} style={{ display: 'flex', gap: '14px' }}>
          <span style={{ width: '36px', height: '36px', borderRadius: radius.lg, display: 'grid', placeItems: 'center', backgroundColor: 'rgba(96,150,250,0.14)', color: colors.primary[300], flexShrink: 0 }}>
            {f.icon}
          </span>
          <span style={{ display: 'grid', gap: '2px' }}>
            <strong style={{ color: '#ffffff', fontSize: '15px' }}>{f.title}</strong>
            <span style={{ fontSize: '14px', lineHeight: 1.5 }}>{f.text}</span>
          </span>
        </li>
      ))}
    </ul>
  </div>
);

/* -------------------------------------------------------------------------------------------------
 * Form parts
 * -----------------------------------------------------------------------------------------------*/

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: '44px',
  padding: '0 14px',
  fontSize: '15px',
  border: `1px solid ${colors.slate[300]}`,
  borderRadius: radius.lg,
  backgroundColor: '#ffffff',
  color: colors.slate[900],
  boxSizing: 'border-box',
};

const Label: React.FC<{ htmlFor: string; children: React.ReactNode; hint?: React.ReactNode }> = ({ htmlFor, children, hint }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
    <label htmlFor={htmlFor} style={{ fontSize: '13px', fontWeight: 600, color: colors.slate[700] }}>
      {children}
    </label>
    {hint}
  </div>
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }> = ({ label, id, ...rest }) => (
  <div>
    <Label htmlFor={id}>{label}</Label>
    <input id={id} style={inputStyle} {...rest} />
  </div>
);

export const PasswordInput: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: string;
  autoFocus?: boolean;
}> = ({ id, label, value, onChange, autoComplete, autoFocus }) => {
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  return (
    <div>
      <Label htmlFor={id} hint={capsLock ? <span style={{ fontSize: '12px', color: colors.status.warning.fg, fontWeight: 600 }}>Caps Lock is on</span> : undefined}>
        {label}
      </Label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyUp={e => setCapsLock(e.getModifierState('CapsLock'))}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          required
          style={{ ...inputStyle, paddingRight: '46px' }}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          style={{ position: 'absolute', right: '4px', top: '4px', width: '36px', height: '36px', display: 'grid', placeItems: 'center', border: 'none', background: 'none', color: colors.slate[500], cursor: 'pointer', borderRadius: radius.md }}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

export const ErrorBox: React.FC<{ children: React.ReactNode; tone?: 'danger' | 'info' }> = ({ children, tone = 'danger' }) => {
  const t = colors.status[tone];
  return (
    <div role="alert" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '11px 12px', fontSize: '14px', lineHeight: 1.45, color: t.fg, backgroundColor: t.bg, border: `1px solid ${t.border}`, borderRadius: radius.lg }}>
      <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
      <span>{children}</span>
    </div>
  );
};

export const PrimaryButton: React.FC<{ busy?: boolean; children: React.ReactNode; disabled?: boolean }> = ({ busy, children, disabled }) => (
  <button
    type="submit"
    disabled={busy || disabled}
    style={{
      height: '44px',
      width: '100%',
      border: 'none',
      borderRadius: radius.lg,
      fontSize: '15px',
      fontWeight: 600,
      color: '#ffffff',
      backgroundColor: busy || disabled ? colors.slate[400] : colors.primary[600],
      cursor: busy || disabled ? 'default' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      boxShadow: busy || disabled ? 'none' : '0 1px 2px rgba(16,24,40,0.1)',
    }}
  >
    {busy && <Loader2 size={17} style={{ animation: 'spin 1s linear infinite' }} />}
    {children}
  </button>
);

const Heading: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div style={{ marginBottom: '24px' }}>
    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: colors.slate[900], letterSpacing: '-0.01em' }}>{title}</h1>
    <p style={{ margin: '8px 0 0', fontSize: '15px', lineHeight: 1.5, color: colors.slate[600] }}>{text}</p>
  </div>
);

function readStored(key: string): string {
  try {
    return window.localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
}
function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/* -------------------------------------------------------------------------------------------------
 * Live sign-in
 * -----------------------------------------------------------------------------------------------*/

export const LoginView: React.FC<{ notice?: string; onSignedIn: (user: SessionUser, password: string) => void }> = ({ notice, onSignedIn }) => {
  const [tenantCode, setTenantCode] = useState(() => readStored('vms.tenant'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(tenantCode.trim(), username.trim(), password);
      writeStored('vms.tenant', tenantCode.trim());
      onSignedIn(user, password);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.status === 429
            ? 'Too many sign-in attempts. Wait a minute and try again.'
            : 'The organization code, username or password is not correct.'
          : 'The server could not be reached. Check your connection and try again.'
      );
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout>
      <Heading title="Sign in" text="Use the organization code and account your administrator gave you." />
      <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }} noValidate={false}>
        {(error || notice) && <ErrorBox tone={error ? 'danger' : 'info'}>{error || notice}</ErrorBox>}
        <TextInput id="tenant" label="Organization code" value={tenantCode} onChange={e => setTenantCode(e.target.value)} autoComplete="organization" required autoFocus={!tenantCode} />
        <TextInput id="username" label="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required autoFocus={!!tenantCode} />
        <PasswordInput id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <PrimaryButton busy={busy}>{busy ? 'Signing in…' : 'Sign in'}</PrimaryButton>
        <p style={{ margin: 0, fontSize: '13px', color: colors.slate[500], lineHeight: 1.5 }}>
          Forgot your password or locked out? Your site or organization administrator can unlock the account or issue a temporary password.
        </p>
      </form>
    </AuthLayout>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Password rules (mirror the server policy; the server remains the authority)
 * -----------------------------------------------------------------------------------------------*/

export function passwordChecks(password: string, username = '') {
  return [
    { label: 'At least 12 characters', ok: password.length >= 12 },
    { label: 'An uppercase and a lowercase letter', ok: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'A number', ok: /[0-9]/.test(password) },
    { label: 'A symbol such as ! # % or @', ok: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
    { label: 'Does not contain your username', ok: !username || !password.toLowerCase().includes(username.toLowerCase()) },
  ];
}

export const PolicyChecklist: React.FC<{ password: string; username?: string }> = ({ password, username }) => (
  <ul aria-label="Password requirements" style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '6px' }}>
    {passwordChecks(password, username).map(c => (
      <li key={c.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: c.ok ? colors.status.success.fg : colors.slate[500] }}>
        <span aria-hidden="true" style={{ width: '18px', height: '18px', borderRadius: radius.full, display: 'grid', placeItems: 'center', backgroundColor: c.ok ? colors.status.success.bg : colors.slate[100] }}>
          {c.ok ? <Check size={12} /> : <X size={11} />}
        </span>
        <span>{c.label}</span>
        <span className="sr-only">{c.ok ? '(met)' : '(not met)'}</span>
      </li>
    ))}
  </ul>
);

const ChangePasswordForm: React.FC<{
  username: string;
  knownCurrentPassword?: string;
  submitLabel: string;
  onDone: (user: SessionUser) => void;
  onCancel?: () => void;
}> = ({ username, knownCurrentPassword, submitLabel, onDone, onCancel }) => {
  const [current, setCurrent] = useState(knownCurrentPassword ?? '');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const allOk = useMemo(() => passwordChecks(next, username).every(c => c.ok), [next, username]);
  const mismatch = confirm.length > 0 && confirm !== next;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allOk || next !== confirm) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await changePassword(current, next));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The server could not be reached. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
      {error && <ErrorBox>{error}</ErrorBox>}
      {!knownCurrentPassword && <PasswordInput id="current-password" label="Current password" value={current} onChange={setCurrent} autoComplete="current-password" autoFocus />}
      <PasswordInput id="new-password" label="New password" value={next} onChange={setNext} autoComplete="new-password" autoFocus={!!knownCurrentPassword} />
      <PolicyChecklist password={next} username={username} />
      <div>
        <PasswordInput id="confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />
        {mismatch && <div style={{ marginTop: '6px', fontSize: '13px', color: colors.status.danger.fg }}>The passwords do not match.</div>}
      </div>
      <PrimaryButton busy={busy} disabled={!allOk || next !== confirm || !current}>
        {submitLabel}
      </PrimaryButton>
      {onCancel && (
        <button type="button" onClick={onCancel} style={{ height: '40px', border: `1px solid ${colors.slate[300]}`, borderRadius: radius.lg, background: '#ffffff', color: colors.slate[700], fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
          Cancel
        </button>
      )}
    </form>
  );
};

/** Shown after signing in with a temporary password: nothing else is available until it is changed. */
export const ForcePasswordChangeView: React.FC<{ user: SessionUser; knownCurrentPassword?: string; onDone: (user: SessionUser) => void; onSignOut: () => void }> = ({
  user,
  knownCurrentPassword,
  onDone,
  onSignOut,
}) => (
  <AuthLayout>
    <Heading title="Set your password" text={`Welcome, ${user.fullName.split(' ')[0]}. You signed in with a temporary password; choose your own to continue.`} />
    <ChangePasswordForm username={user.username} knownCurrentPassword={knownCurrentPassword} submitLabel="Save password and continue" onDone={onDone} />
    <button type="button" onClick={onSignOut} style={{ marginTop: '16px', border: 'none', background: 'none', color: colors.slate[600], fontSize: '14px', cursor: 'pointer', padding: 0 }}>
      Sign out
    </button>
  </AuthLayout>
);

/** Self-service password change from the account menu. */
export const ChangePasswordDialog: React.FC<{ user: SessionUser; onClose: () => void; onChanged: (user: SessionUser) => void }> = ({ user, onClose, onChanged }) => {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="change-password-title" style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'grid', placeItems: 'center', padding: '16px', backgroundColor: 'rgba(7,16,28,0.55)' }}>
      <div style={{ width: '100%', maxWidth: '440px', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: radius.xl, boxShadow: shadows.modal, padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <KeyRound size={20} color={colors.primary[600]} />
          <h2 id="change-password-title" style={{ margin: 0, fontSize: '19px', color: colors.slate[900] }}>
            Change password
          </h2>
        </div>
        <p style={{ margin: '0 0 18px', fontSize: '14px', color: colors.slate[600] }}>Other devices signed in to your account will be signed out.</p>
        <ChangePasswordForm username={user.username} submitLabel="Change password" onDone={onChanged} onCancel={onClose} />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------------------------------
 * Demo sign-in (static demo build: no server, sample data). Accounts decide what each role can see.
 * -----------------------------------------------------------------------------------------------*/

export interface DemoAccount {
  username: string;
  name: string;
  role: EnterpriseRole;
  roleLabel: string;
  description: string;
}

export const DEMO_PASSWORD = 'Demo#2026';

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { username: 'admin', name: 'Dana Whitfield', role: 'SUPER_ADMIN', roleLabel: 'Super administrator', description: 'Everything, including administration' },
  { username: 'site.admin', name: 'Marcus Okafor', role: 'SITE_ADMIN', roleLabel: 'Site administrator', description: 'Runs one plant: people, visitors, service' },
  { username: 'security.manager', name: 'Leena Joshi', role: 'SECURITY_MANAGER', roleLabel: 'Security manager', description: 'Gates, approvals and security reports' },
  { username: 'guard', name: 'Ravi Kumar', role: 'SECURITY_GUARD', roleLabel: 'Security guard', description: 'Gate check-in and check-out' },
  { username: 'reception', name: 'Sofia Martins', role: 'RECEPTIONIST', roleLabel: 'Receptionist', description: 'Visitor registration at the front desk' },
  { username: 'host', name: 'Priya Raman', role: 'HOST', roleLabel: 'Host (employee)', description: 'Invites visitors and raises requests' },
  { username: 'service.manager', name: 'Arun Pillai', role: 'SERVICE_MANAGER', roleLabel: 'Service manager', description: 'Maintenance and service work' },
  { username: 'ehs', name: 'Grace Lin', role: 'EHS_MANAGER', roleLabel: 'EHS manager', description: 'Safety inductions and permits' },
  { username: 'esg', name: 'Tom Becker', role: 'ESG_MANAGER', roleLabel: 'ESG manager', description: 'Travel activity and emissions data' },
  { username: 'auditor', name: 'Nadia Haddad', role: 'AUDITOR', roleLabel: 'Auditor', description: 'Read-only access with the audit trail' },
];

export const DemoLoginView: React.FC<{ onSignedIn: (account: DemoAccount) => void }> = ({ onSignedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const account = DEMO_ACCOUNTS.find(a => a.username === username.trim().toLowerCase());
    if (!account || password !== DEMO_PASSWORD) {
      setError('That demo username or password is not correct. Pick an account below to fill it in.');
      setPassword('');
      return;
    }
    onSignedIn(account);
  };
  return (
    <AuthLayout
      aside={
        <div style={{ display: 'grid', gap: '16px', maxWidth: '460px' }}>
          <span style={{ alignSelf: 'start', justifySelf: 'start', fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: colors.primary[300], border: `1px solid ${colors.navy[700]}`, borderRadius: radius.full, padding: '4px 10px' }}>
            Demo environment
          </span>
          <h2 style={{ margin: 0, fontSize: '32px', lineHeight: 1.15, fontWeight: 700, color: '#ffffff' }}>Try VMS Enterprise as any role.</h2>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: 1.6 }}>
            Each demo account sees only the screens and actions its role allows, just like the real system. Everything here is sample data;
            changes stay in this browser tab and are never sent anywhere.
          </p>
        </div>
      }
    >
      <Heading title="Sign in to the demo" text={`Choose a demo account. All demo accounts use the password ${DEMO_PASSWORD}.`} />
      <form onSubmit={submit} style={{ display: 'grid', gap: '16px' }}>
        {error && <ErrorBox>{error}</ErrorBox>}
        <TextInput id="username" label="Username" value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
        <PasswordInput id="password" label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
        <PrimaryButton>Sign in</PrimaryButton>
      </form>
      <div style={{ marginTop: '28px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: colors.slate[600], marginBottom: '10px' }}>Demo accounts</div>
        <div style={{ display: 'grid', gap: '6px', maxHeight: '340px', overflowY: 'auto', paddingRight: '2px' }}>
          {DEMO_ACCOUNTS.map(a => (
            <button
              key={a.username}
              type="button"
              className="vms-menu-row"
              onClick={() => {
                setUsername(a.username);
                setPassword(DEMO_PASSWORD);
                setError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${username === a.username ? colors.primary[300] : colors.slate[200]}`,
                borderRadius: radius.lg,
                backgroundColor: username === a.username ? colors.primary[50] : '#ffffff',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ width: '34px', height: '34px', borderRadius: radius.full, display: 'grid', placeItems: 'center', backgroundColor: colors.primary[100], color: colors.primary[800], fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                {a.name.split(' ').map(p => p[0]).join('')}
              </span>
              <span style={{ display: 'grid', minWidth: 0, flex: 1 }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: colors.slate[900] }}>{a.roleLabel}</span>
                <span style={{ fontSize: '12px', color: colors.slate[500], whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.description}</span>
              </span>
              <code style={{ fontSize: '12px', color: colors.slate[600] }}>{a.username}</code>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
};
