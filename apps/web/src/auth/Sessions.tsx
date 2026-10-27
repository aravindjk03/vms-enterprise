import React, { useCallback, useEffect, useState } from 'react';
import { Laptop, LogOut, MonitorSmartphone, Smartphone } from 'lucide-react';
import { colors, radius } from '@vms/ui/tokens';
import { apiRequest } from '../api/client.js';
import { Chip, Dialog, DialogActions } from '../views/live/admin/common.js';
import { buttonStyle, describeError, ErrorNote, fmt } from '../views/live/LiveViews.js';
import { relativeTime } from '../views/live/activity.js';

interface DeviceSession {
  id: string;
  current: boolean;
  lastActiveAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
}

/** "Chrome on Windows" from a user-agent string; good enough to recognise one's own devices. */
export function describeDevice(userAgent: string | null): { label: string; mobile: boolean } {
  const ua = userAgent ?? '';
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Chrome\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : '';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
  const mobile = /Mobile|Android|iPhone|iPad/.test(ua);
  if (!browser && !os) return { label: 'Unknown device', mobile };
  return { label: [browser || 'Browser', os && `on ${os}`].filter(Boolean).join(' '), mobile };
}

/** Account menu → Signed-in devices: see where you are signed in and sign out the others. */
export const SessionsDialog: React.FC<{ onClose: () => void; onSignedOutOthers: (count: number) => void }> = ({ onClose, onSignedOutOthers }) => {
  const [items, setItems] = useState<DeviceSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    apiRequest<{ items: DeviceSession[] }>('/api/v1/auth/sessions')
      .then(r => setItems(r.items))
      .catch(err => setError(describeError(err)));
  }, []);
  useEffect(load, [load]);

  const act = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setError(null);
    try {
      await fn();
      load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(null);
    }
  };

  const others = (items ?? []).filter(s => !s.current);
  return (
    <Dialog title="Signed-in devices" onClose={onClose} icon={<MonitorSmartphone size={20} />} width={560} description="Each browser where you are signed in. Sign out any you do not recognise, then change your password.">
      <ErrorNote error={error} />
      {!items && !error && <p style={{ fontSize: '14px', color: colors.slate[500] }}>Loading…</p>}
      {others.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', color: colors.slate[600] }}>
            {others.length === 1 ? '1 other device' : `${others.length} other devices`}
          </span>
          <button
            type="button"
            disabled={!!busy}
            style={buttonStyle('danger')}
            onClick={() =>
              void act('all', async () => {
                const r = await apiRequest<{ revoked: number }>('/api/v1/auth/sessions/revoke-others', { method: 'POST', body: {} });
                onSignedOutOthers(r.revoked);
              })
            }
          >
            <LogOut size={15} /> {busy === 'all' ? 'Signing out…' : 'Sign out all other devices'}
          </button>
        </div>
      )}
      {items && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, border: `1px solid ${colors.slate[200]}`, borderRadius: radius.lg, maxHeight: '360px', overflowY: 'auto' }}>
          {items.map((s, i) => {
            const device = describeDevice(s.userAgent);
            const Icon = device.mobile ? Smartphone : Laptop;
            return (
              <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderTop: i ? `1px solid ${colors.slate[100]}` : 'none' }}>
                <Icon size={20} color={colors.slate[500]} aria-hidden="true" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, color: colors.slate[900] }}>
                    {device.label}
                    {s.current && <Chip tone="primary">This device</Chip>}
                  </div>
                  <div style={{ fontSize: '12px', color: colors.slate[500] }} title={`Signed in until ${fmt(s.expiresAt)}`}>
                    {s.current ? 'Active now' : `Last active ${relativeTime(s.lastActiveAt)}`}
                    {s.ipAddress ? ` · ${s.ipAddress}` : ''}
                  </div>
                </div>
                {!s.current && (
                  <button type="button" disabled={!!busy} style={buttonStyle()} onClick={() => void act(s.id, () => apiRequest(`/api/v1/auth/sessions/${s.id}/revoke`, { method: 'POST', body: {} }))}>
                    {busy === s.id ? 'Signing out…' : 'Sign out'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <DialogActions>
        <button type="button" style={buttonStyle()} onClick={onClose}>
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
};
