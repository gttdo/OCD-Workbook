import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Supabase is optional at runtime. The app is fully usable without it — local
 * IndexedDB holds everything — so an unconfigured environment degrades to
 * "works, but this device only" rather than a blank screen.
 */
export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

const NOT_CONFIGURED = 'Sync is not configured on this build.'

/**
 * Email and password is the primary path. An ERP cycle runs for weeks, so
 * people sign in on a phone repeatedly over a long stretch — routing every one
 * of those through an inbox is friction in the wrong place.
 */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED }
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  return { error: error ? humanise(error.message) : null }
}

export async function signUpWithPassword(
  email: string,
  password: string,
): Promise<{ error: string | null; needsConfirmation: boolean }> {
  if (!supabase) return { error: NOT_CONFIGURED, needsConfirmation: false }
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) return { error: humanise(error.message), needsConfirmation: false }
  // With email confirmation switched on, signUp returns a user but no session.
  return { error: null, needsConfirmation: !data.session }
}

export async function sendPasswordReset(
  email: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset`,
  })
  return { error: error?.message ?? null }
}

export async function setPassword(
  password: string,
): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED }
  const { error } = await supabase.auth.updateUser({ password })
  return { error: error ? humanise(error.message) : null }
}

/**
 * Kept as a secondary route. Someone who has forgotten whether they ever set a
 * password should still have a way in that always works.
 */
export async function sendMagicLink(email: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: NOT_CONFIGURED }
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  })
  return { error: error?.message ?? null }
}

/** Supabase's defaults are terse and slightly accusatory. */
function humanise(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials'))
    return 'That email and password do not match. Worth trying a reset if you are unsure.'
  if (m.includes('email not confirmed'))
    return 'Check your email for a confirmation link first.'
  if (m.includes('already registered'))
    return 'There is already an account with that email. Try signing in instead.'
  if (m.includes('weak') || m.includes('pwned') || m.includes('compromised'))
    return 'That password has appeared in a known breach. Please choose another.'
  if (m.includes('at least'))
    return message
  return message
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut()
}
