import React, { useEffect, useState } from 'react';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { colors, radius, shadows } from '@vms/ui/tokens';
import { App } from '../App.js';
import { ApiError, login, logout, probeApi, refreshSession, setSessionLostHandler, type SessionUser } from '../api/client.js';

type Mode = { kind: 'probing' } | { kind: 'demo' } | { kind: 'signed-out'; notice?: string } | { kind: 'live'; user: SessionUser };

/**
 * Decides how the console runs:
 * - API reachable  -> authentication required; data comes from the server, role is the server's.
 * - no API (static hosting such as GitHub Pages) -> clearly labelled demo with sample data.
 */
export const Root: React.FC = () => {
  const [mode, setMode] = useState<Mode>({ kind: 'probing' });

  useEffect(() => {
    let cancelled = false;
    setSessionLostHandler(() => setMode({ kind: 'signed-out', notice: 'Your session has ended. Please sign in again.' }));
    (async () => {
      if (!(await probeApi())) {
        if (!cancelled) setMode({ kind: 'demo' });
        return;
      }
      const user = await refreshSession();
      if (!cancelled) setMode(user ? { kind: 'live', user } : { kind: 'signed-out' });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (mode.kind === 'probing') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: colors.slate[500] }}>
        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} aria-label="Loading" />
      </div>
    );
  }
  if (mode.kind === 'demo') {
    return <App />;
  }
  if (mode.kind === 'signed-out') {
    return <LoginView notice={mode.notice} onSignedIn={user => setMode({ kind: 'live', user })} />;
  }
  return (
    <App
      key={mode.user.userId}
      session={{
        user: mode.user,
        onSignOut: async () => {
          await logout();
          setMode({ kind: 'signed-out' });
        },
      }}
    />
  );
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  fontSize: '14px',
  border: `1px solid ${colors.slate[300]}`,
  borderRadius: radius.md,
  outline: 'none',
  backgroundColor: '#ffffff',
  color: colors.slate[900],
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: colors.slate[700],
  marginBottom: '6px',
};

const LoginView: React.FC<{ notice?: string; onSignedIn: (user: SessionUser) => void }> = ({ notice, onSignedIn }) => {
  const [tenantCode, setTenantCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onSignedIn(await login(tenantCode.trim(), username.trim(), password));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The server could not be reached. Please try again.');
      setPassword('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', backgroundColor: colors.slate[950], padding: '16px' }}>
      <form
        onSubmit={submit}
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#ffffff',
          borderRadius: radius.xl,
          boxShadow: shadows.modal,
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldCheck size={26} color={colors.primary[600]} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: colors.slate[900], letterSpacing: '0.02em' }}>VMS ENTERPRISE</div>
            <div style={{ fontSize: '12px', color: colors.slate[500] }}>Sign in to the operations console</div>
          </div>
        </div>

        {(error || notice) && (
          <div
            role="alert"
            style={{
              display: 'flex',
              gap: '8px',
              alignItems: 'flex-start',
              fontSize: '13px',
              padding: '10px 12px',
              borderRadius: radius.md,
              backgroundColor: error ? colors.status.danger.bg : colors.status.info.bg,
              color: error ? colors.status.danger.fg : colors.status.info.fg,
              border: `1px solid ${error ? colors.status.danger.border : colors.status.info.border}`,
            }}
          >
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{error || notice}</span>
          </div>
        )}

        <div>
          <label style={labelStyle} htmlFor="tenant">Organization code</label>
          <input id="tenant" style={fieldStyle} value={tenantCode} onChange={e => setTenantCode(e.target.value)} autoComplete="organization" required />
        </div>
        <div>
          <label style={labelStyle} htmlFor="username">Username</label>
          <input id="username" style={fieldStyle} value={username} onChange={e => setUsername(e.target.value)} autoComplete="username" required />
        </div>
        <div>
          <label style={labelStyle} htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            style={fieldStyle}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '11px 14px',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            backgroundColor: busy ? colors.slate[400] : colors.primary[600],
            border: 'none',
            borderRadius: radius.md,
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <div style={{ fontSize: '11px', color: colors.slate[500], textAlign: 'center' }}>
          Access is logged. Repeated failed attempts lock the account temporarily.
        </div>
      </form>
    </div>
  );
};
