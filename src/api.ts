import type { Role, Status } from './ui'

/* ---------- TuitionHub PHP API client (proxied to XAMPP via vite.config.ts) ---------- */

export type AuthUser = {
  id: number
  role: Role | 'admin'
  email?: string
  username?: string
  display_name?: string
  account_status?: string
  must_change_password?: boolean
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export const isRole = (role: unknown): role is Role => role === 'tutor' || role === 'center' || role === 'guardian' || role === 'student'

const FALLBACK: Record<number, string> = {
  401: 'Please log in to continue.',
  429: 'Too many failed attempts. Please try again later.',
  500: 'TuitionHub ran into a server error. Please try again.',
  502: 'Unable to reach the TuitionHub API. Check that Apache (XAMPP) is running.',
  503: 'TuitionHub is temporarily unavailable. Check that MySQL is running and the API config is correct.',
  504: 'The TuitionHub API took too long to respond.',
}

/** Calls `/api/<path>` with the session cookie and returns the parsed JSON body, or throws ApiError. */
export async function api<T>(path: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api/${path}`, {
      method: init.method ?? 'GET',
      credentials: 'include',
      headers: init.body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new ApiError(0, 'network_error', 'Unable to connect to TuitionHub. Please check that the server is running.')
  }

  // Apache/Vite can answer with HTML (e.g. proxy errors), so never assume JSON.
  let data: { ok?: boolean; error?: { code?: unknown; message?: unknown } } | null = null
  try { data = await response.json() } catch { /* non-JSON body */ }

  if (!response.ok || !data || data.ok === false) {
    const code = typeof data?.error?.code === 'string' ? data.error.code : 'http_error'
    const message = typeof data?.error?.message === 'string' ? data.error.message : FALLBACK[response.status] ?? `Unexpected server response (${response.status}).`
    throw new ApiError(response.status, code, message)
  }
  return data as T
}

const toUser = (user: unknown): AuthUser => {
  const u = user as AuthUser | undefined
  if (!u || typeof u.role !== 'string' || (u.role !== 'admin' && !isRole(u.role))) {
    throw new ApiError(200, 'unsupported_role', 'Your account has an unsupported role. Please contact an administrator.')
  }
  return u
}

export const login = async (identifier: string, password: string) =>
  toUser((await api<{ user: unknown }>('login', { method: 'POST', body: { identifier, password } })).user)

/** Returns the signed-in user, or null when there is no valid session. */
export async function me(): Promise<AuthUser | null> {
  try {
    return toUser((await api<{ user: unknown }>('me')).user)
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null
    throw error
  }
}

export const logout = () => api('logout', { method: 'POST' })

/** Where a signed-in user lands, plus the onboarding state the screens expect. */
export function landingFor(user: AuthUser): { route: string; role?: Role; status?: Status; pct?: number } {
  if (user.role === 'admin') return { route: 'admin' }
  if (user.account_status === 'approved') return { route: 'dashboard-incomplete', role: user.role, status: 'approved', pct: 60 }
  return { route: 'dashboard', role: user.role, status: 'active', pct: 100 }
}
