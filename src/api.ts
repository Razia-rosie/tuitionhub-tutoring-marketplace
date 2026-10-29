import { AuthError } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Role, Status } from './ui'

/* ---------- TuitionHub data access on Supabase (Auth + Postgres with RLS) ---------- */

export type AuthUser = {
  id: string
  email?: string
  role: Role | 'admin'
  display_name: string
  account_status: Status
  profile_pct: number
  status_note: string | null
}

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message)
  }
}

export const isRole = (role: unknown): role is Role => role === 'tutor' || role === 'center' || role === 'guardian' || role === 'student'

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect.',
  email_not_confirmed: 'Confirm your email first — check your inbox for the link we sent.',
  user_already_exists: 'An account with this email already exists. Try logging in instead.',
  email_exists: 'An account with this email already exists. Try logging in instead.',
  weak_password: 'Choose a stronger password: 8+ characters with a letter, a number and a symbol.',
  over_request_rate_limit: 'Too many attempts. Please wait a minute and try again.',
  over_email_send_rate_limit: 'Too many emails sent. Please wait a few minutes and try again.',
  signup_disabled: 'New sign-ups are currently closed.',
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (error instanceof AuthError) {
    const code = error.code ?? 'auth_error'
    if (error.status === 0 || error.name === 'AuthRetryableFetchError') return new ApiError(0, 'network_error', 'Unable to reach TuitionHub. Check your internet connection.')
    return new ApiError(error.status ?? 400, code, AUTH_MESSAGES[code] ?? error.message)
  }
  return new ApiError(500, 'unknown', error instanceof Error ? error.message : 'Something went wrong. Please try again.')
}

/** Loads the signed-in user's profile row (RLS limits it to their own). */
async function loadProfile(userId: string, email?: string): Promise<AuthUser> {
  const { data, error } = await supabase.from('profiles').select('role, display_name, account_status, profile_pct, status_note').eq('id', userId).maybeSingle()
  if (error) throw new ApiError(503, 'profile_unavailable', 'Unable to load your account. Please try again.')
  if (!data) throw new ApiError(404, 'profile_missing', 'Your account profile is missing. Please contact support.')
  if (data.role !== 'admin' && !isRole(data.role)) throw new ApiError(200, 'unsupported_role', 'Your account has an unsupported role. Please contact an administrator.')
  return { id: userId, email, ...data } as AuthUser
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw toApiError(error)
  return loadProfile(data.user.id, data.user.email)
}

/** Creates the auth user; a database trigger creates the matching profile with status 'pending'. */
export async function signUp(input: { email: string; password: string; role: Role; displayName: string; phone?: string }): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { role: input.role, display_name: input.displayName, phone: input.phone ?? null },
      emailRedirectTo: window.location.origin,
    },
  })
  if (error) throw toApiError(error)
  // With email confirmation on (Supabase default) there is no session until the link is clicked.
  if (!data.session || !data.user) return null
  return loadProfile(data.user.id, data.user.email)
}

/** Returns the signed-in user, or null when there is no valid session. */
export async function me(): Promise<AuthUser | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw toApiError(error)
  if (!data.session) return null
  return loadProfile(data.session.user.id, data.session.user.email)
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw toApiError(error)
}

export async function requestPasswordReset(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin })
  if (error) throw toApiError(error)
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw toApiError(error)
}

export async function updateDisplayName(displayName: string): Promise<AuthUser> {
  const { data } = await supabase.auth.getUser()
  if (!data.user) throw new ApiError(401, 'not_authenticated', 'Please log in again.')
  const { error } = await supabase.from('profiles').update({ display_name: displayName.trim().slice(0, 120) }).eq('id', data.user.id)
  if (error) throw new ApiError(400, error.code ?? 'update_failed', 'Unable to save your name. Please try again.')
  return loadProfile(data.user.id, data.user.email)
}

/* ---------- profile & admin RPCs (server-side checks in supabase/migrations) ---------- */

/** Approved user finished the profile wizard → account becomes active. */
export async function completeProfile(): Promise<void> {
  const { error } = await supabase.rpc('complete_profile')
  if (error) throw new ApiError(403, error.code ?? 'rpc_error', error.message)
}

export type Applicant = {
  id: string; role: Role; account_status: Status; display_name: string; phone: string | null
  email: string; status_note: string | null; created_at: string
}

export async function listApplicants(): Promise<Applicant[]> {
  const { data, error } = await supabase.rpc('admin_list_applicants')
  if (error) throw new ApiError(403, error.code ?? 'rpc_error', error.message)
  return (data ?? []) as Applicant[]
}

export async function setAccountStatus(id: string, status: Status, note?: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_account_status', { target: id, new_status: status, note: note ?? null })
  if (error) throw new ApiError(403, error.code ?? 'rpc_error', error.message)
}

/** Where a signed-in user lands, plus the onboarding state the screens expect. */
export function landingFor(user: AuthUser): { route: string; role?: Role; status: Status; pct: number } {
  if (user.role === 'admin') return { route: 'admin', status: 'active', pct: 100 }
  const base = { role: user.role, status: user.account_status, pct: user.profile_pct }
  if (user.account_status === 'active') return { ...base, route: 'dashboard', pct: 100 }
  if (user.account_status === 'approved') return { ...base, route: 'dashboard-incomplete' }
  return { ...base, route: 'pending' }
}
