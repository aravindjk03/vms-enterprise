/**
 * Browser client for the VMS API.
 * - The access token lives only in memory (never localStorage), so XSS cannot lift a long-lived credential.
 * - The refresh token is an httpOnly SameSite=Strict cookie scoped to /api/v1/auth; on a 401 the
 *   client rotates it once and retries.
 */
import type { EnterpriseRole } from '@vms/types';

const API_BASE: string = (import.meta as { env?: Record<string, string | undefined> }).env?.['VITE_API_BASE_URL'] ?? '';

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

/** Returns true when an API backend is reachable (false on static hosting such as GitHub Pages). */
export async function probeApi(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { credentials: 'same-origin' });
    if (!res.ok) return false;
    const body = await res.json().catch(() => null);
    return body?.status === 'ok';
  } catch {
    return false;
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

/** Restores a session from the refresh cookie; resolves null when there is none. */
export function refreshSession(): Promise<SessionUser | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/auth/refresh`, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-Requested-With': 'vms-web' },
        });
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
