/**
 * Browser client for the VMS API.
 * - The access token lives only in memory (never localStorage), so XSS cannot lift a long-lived credential.
 * - The refresh token is an httpOnly SameSite=Strict cookie scoped to /api/v1/auth; on a 401 the
 *   client rotates it once and retries.
 */
import type { EnterpriseRole } from '@vms/types';

const VITE_ENV = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};
const API_BASE: string = VITE_ENV['VITE_API_BASE_URL'] ?? '';
/** Static demo builds (GitHub Pages, hosted previews) set VITE_DEMO_MODE=true and never look for an API. */
const DEMO_BUILD = VITE_ENV['VITE_DEMO_MODE'] === 'true';

export interface SessionUser {
  userId: string;
  tenantId: string;
  username: string;
  fullName: string;
  role: EnterpriseRole;
  roles: EnterpriseRole[];
  siteIds: string[];
  defaultSiteId: string | null;
  permissions: string[];
}

interface TokenResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: SessionUser;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ path: string; message: string }>
  ) {
    super(message);
  }
}

let accessToken: string | null = null;
let refreshInFlight: Promise<SessionUser | null> | null = null;
let onSessionLost: (() => void) | null = null;

export function setSessionLostHandler(handler: () => void): void {
  onSessionLost = handler;
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json();
    return new ApiError(res.status, body?.error?.code ?? 'ERROR', body?.error?.message ?? res.statusText, body?.error?.details);
  } catch {
    return new ApiError(res.status, 'ERROR', res.statusText || 'Request failed');
  }
}

/**
 * A random key for Idempotency-Key headers. `crypto.randomUUID` exists only on HTTPS and localhost,
 * so plain-HTTP intranet deployments fall back to `getRandomValues`, which is available everywhere.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Finds out whether this console has a backend:
 * - 'live': the API answered;
 * - 'absent': this is a demo build, or the host has no API at all (static hosting answers 404);
 * - 'unreachable': the API should be there but did not answer (restart, proxy error, network).
 * A production console must never fall back to sample data just because the server blinked.
 */
export async function probeApi(): Promise<'live' | 'absent' | 'unreachable'> {
  if (DEMO_BUILD) return 'absent';
  try {
    const res = await fetch(`${API_BASE}/api/health`, { credentials: 'same-origin' });
    if (res.status === 404 || res.status === 405) return 'absent';
    if (!res.ok) return 'unreachable';
    const body = await res.json().catch(() => null);
    return body?.status === 'ok' ? 'live' : 'absent';
  } catch {
    return 'unreachable';
  }
}

export async function login(tenantCode: string, username: string, password: string): Promise<SessionUser> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantCode, username, password }),
  });
  if (!res.ok) throw await parseError(res);
  const body = (await res.json()) as TokenResponse;
  accessToken = body.accessToken;
  return body.user;
}

/** The API sets a readable `vms_session` hint next to the HttpOnly refresh cookie. */
export function mightHaveSession(): boolean {
  return document.cookie.split(';').some(c => c.trim().startsWith('vms_session=1'));
}

/** Restores a session from the refresh cookie; resolves null when there is none. */
export function refreshSession(): Promise<SessionUser | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const attempt = () =>
          fetch(`${API_BASE}/api/v1/auth/refresh`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'X-Requested-With': 'vms-web' },
          });
        let res = await attempt();
        // 409: another tab rotated the cookie at the same moment; the browser now holds the new one.
        if (res.status === 409) {
          await new Promise(resolve => setTimeout(resolve, 250));
          res = await attempt();
        }
        if (!res.ok) {
          accessToken = null;
          return null;
        }
        const body = (await res.json()) as TokenResponse;
        accessToken = body.accessToken;
        return body.user;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function logout(): Promise<void> {
  accessToken = null;
  await fetch(`${API_BASE}/api/v1/auth/logout`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'X-Requested-With': 'vms-web' },
  }).catch(() => undefined);
}

export async function apiRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; idempotencyKey?: string } = {}
): Promise<T> {
  const send = () =>
    fetch(`${API_BASE}${path}`, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        // Retries of the same submission reuse the key, so the server applies it once.
        ...(init.idempotencyKey ? { 'Idempotency-Key': init.idempotencyKey } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });

  let res = await send();
  if (res.status === 401) {
    const user = await refreshSession();
    if (!user) {
      onSessionLost?.();
      throw new ApiError(401, 'UNAUTHENTICATED', 'Your session has ended. Please sign in again.');
    }
    res = await send();
  }
  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
