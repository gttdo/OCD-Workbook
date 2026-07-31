import { newId } from '@/db'

const LOCAL_USER_KEY = 'ocd-workbook.local-user-id'

/**
 * Every local record needs an owner id before the user has signed in.
 *
 * We mint a device-local id immediately so the app is usable on first open,
 * then re-key those rows to the Supabase auth id once a magic link is
 * confirmed. Nothing is gated behind sign-in.
 */
export function getLocalUserId(): string {
  let id = localStorage.getItem(LOCAL_USER_KEY)
  if (!id) {
    id = newId()
    localStorage.setItem(LOCAL_USER_KEY, id)
  }
  return id
}

export function setLocalUserId(id: string): void {
  localStorage.setItem(LOCAL_USER_KEY, id)
}

const ONBOARDED_KEY = 'ocd-workbook.onboarded'

/**
 * A synchronous mirror of profile.onboardedAt.
 *
 * The onboarding gate runs during render, but Dexie's live query resolves
 * asynchronously — so navigating away the instant onboarding finishes would
 * otherwise be judged against a stale profile and bounced straight back.
 * localStorage is readable synchronously, which closes that window. The
 * database remains the source of truth; this is only a race guard.
 */
export function markOnboardedLocally(): void {
  localStorage.setItem(ONBOARDED_KEY, '1')
}

export function hasOnboardedLocally(): boolean {
  return localStorage.getItem(ONBOARDED_KEY) === '1'
}
