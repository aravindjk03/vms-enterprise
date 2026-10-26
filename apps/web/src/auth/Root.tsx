import React, { useEffect, useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import { ToastHost, showToast } from '@vms/ui';
import { App } from '../App.js';
import { logout, mightHaveSession, probeApi, refreshSession, setDemoBackend, setSessionLostHandler, type SessionUser } from '../api/client.js';
import { createDemoBackend, demoSessionUser, recordDemoSignIn } from '../demo/demoBackend.js';
import { ChangePasswordDialog, DEMO_ACCOUNTS, DemoLoginView, ForcePasswordChangeView, LoginView, type DemoAccount } from './AuthViews.js';

type Mode =
  | { kind: 'probing' }
  | { kind: 'unreachable' }
  | { kind: 'demo-signed-out' }
  | { kind: 'demo'; account: DemoAccount; user: SessionUser }
  | { kind: 'signed-out'; notice?: string }
  | { kind: 'must-change'; user: SessionUser; password?: string }
  | { kind: 'live'; user: SessionUser };

const RETRY_SECONDS = 10;
const DEMO_SESSION_KEY = 'vms.demo.account';

function restoreDemoAccount(): DemoAccount | null {
  try {
    const username = window.sessionStorage.getItem(DEMO_SESSION_KEY);
    return DEMO_ACCOUNTS.find(a => a.username === username) ?? null;
  } catch {
    return null;
  }
}

function rememberDemoAccount(username: string | null): void {
  try {
    if (username) window.sessionStorage.setItem(DEMO_SESSION_KEY, username);
    else window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    /* storage unavailable: the demo session lasts until reload */
  }
}

/** Enters the demo as `account`: its role's permissions drive the menu and the in-browser sample backend. */
function startDemo(account: DemoAccount, freshSignIn: boolean): Mode {
  const user = demoSessionUser(account);
  setDemoBackend(createDemoBackend(user));
  if (freshSignIn) recordDemoSignIn(user);
  return { kind: 'demo', account, user };
}

/**
 * Decides how the console runs:
 * - API reachable  -> sign-in required; data, role and permissions come from the server.
 *   A temporary password must be replaced before anything else is shown.
 * - demo build or no API (static hosting) -> sign-in with a demo account; that account's role decides
 *   what is visible. Everything is sample data.
 * - API expected but not answering -> retry screen (never sample data).
 */
export const Root: React.FC = () => {
  const [mode, setMode] = useState<Mode>({ kind: 'probing' });
  const [attempt, setAttempt] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    setSessionLostHandler(() => setMode({ kind: 'signed-out', notice: 'Your session has ended. Please sign in again.' }));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const backend = await probeApi();
      if (cancelled) return;
      if (backend === 'absent') {
        const account = restoreDemoAccount();
        return setMode(account ? startDemo(account, false) : { kind: 'demo-signed-out' });
      }
      if (backend === 'unreachable') return setMode({ kind: 'unreachable' });
      // Without the session hint there is nothing to restore: go straight to sign-in.
      const user = mightHaveSession() ? await refreshSession() : null;
      if (cancelled) return;
      if (!user) return setMode({ kind: 'signed-out' });
      setMode(user.mustChangePassword ? { kind: 'must-change', user } : { kind: 'live', user });
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // While the server is unreachable, check again on a timer as well as on demand.
  useEffect(() => {
    if (mode.kind !== 'unreachable') return;
    const timer = setTimeout(() => setAttempt(a => a + 1), RETRY_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [mode, attempt]);

  const signOut = async () => {
    await logout();
    setChangingPassword(false);
    setMode({ kind: 'signed-out', notice: 'You have signed out.' });
  };

  if (mode.kind === 'probing') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: colors.slate[500] }}>
        <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} aria-label="Loading" />
      </div>
    );
  }
  if (mode.kind === 'unreachable') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', backgroundColor: colors.slate[50] }}>
        <div role="alert" style={{ maxWidth: '420px', textAlign: 'center', display: 'grid', gap: '12px', justifyItems: 'center' }}>
          <AlertTriangle size={28} color={colors.status.warning.fg} aria-hidden="true" />
          <h1 style={{ margin: 0, fontSize: '20px', color: colors.slate[900] }}>Can't reach the VMS server</h1>
          <p style={{ margin: 0, fontSize: '14px', color: colors.slate[600], lineHeight: 1.5 }}>
            The server did not respond. It may be restarting. This page checks again every {RETRY_SECONDS} seconds.
          </p>
          <button
            type="button"
            onClick={() => setAttempt(a => a + 1)}
            style={{ padding: '10px 18px', fontSize: '14px', fontWeight: 600, color: '#ffffff', backgroundColor: colors.primary[600], border: 'none', borderRadius: radius.lg, cursor: 'pointer' }}
          >
            Try again now
          </button>
        </div>
      </div>
    );
  }
  if (mode.kind === 'demo-signed-out') {
    return (
      <DemoLoginView
        onSignedIn={account => {
          rememberDemoAccount(account.username);
          setMode(startDemo(account, true));
        }}
      />
    );
  }
  if (mode.kind === 'demo') {
    return (
      <App
        key={mode.account.username}
        demo={{
          name: mode.account.name,
          role: mode.account.role,
          user: mode.user,
          onSignOut: () => {
            rememberDemoAccount(null);
            setDemoBackend(null);
            setMode({ kind: 'demo-signed-out' });
          },
        }}
      />
    );
  }
  if (mode.kind === 'signed-out') {
    return (
      <LoginView
        notice={mode.notice}
        onSignedIn={(user, password) => setMode(user.mustChangePassword ? { kind: 'must-change', user, password } : { kind: 'live', user })}
      />
    );
  }
  if (mode.kind === 'must-change') {
    return (
      <>
        <ForcePasswordChangeView
          user={mode.user}
          knownCurrentPassword={mode.password}
          onDone={user => {
            setMode({ kind: 'live', user });
            showToast('Password saved. Welcome to VMS Enterprise.');
          }}
          onSignOut={signOut}
        />
        <ToastHost />
      </>
    );
  }
  return (
    <>
      <App
        key={mode.user.userId}
        session={{ user: mode.user, onSignOut: signOut, onChangePassword: () => setChangingPassword(true) }}
      />
      {changingPassword && (
        <ChangePasswordDialog
          user={mode.user}
          onClose={() => setChangingPassword(false)}
          onChanged={user => {
            setChangingPassword(false);
            setMode({ kind: 'live', user });
            showToast('Password changed. Other devices have been signed out.');
          }}
        />
      )}
    </>
  );
};
