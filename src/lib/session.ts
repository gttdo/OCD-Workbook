/**
 * The signed-in user's id.
 *
 * Auth is required before any screen that writes data renders, so by the time
 * a screen calls `currentUserId()` a session exists. That guarantee is what
 * lets this be a module singleton rather than context threaded through every
 * component — and it is enforced by the gate in App.tsx, not by convention.
 *
 * This replaces an earlier device-local id that was minted before sign-in and
 * re-keyed afterwards. That design let people use the app without an account,
 * and it cost more than it bought: records owned by an id that had to be
 * rewritten later, a sync path that had to adopt them, and a profile row whose
 * primary key changed underneath it.
 */
let userId: string | null = null

export function setCurrentUserId(id: string | null): void {
  userId = id
}

export function currentUserId(): string {
  if (!userId) {
    throw new Error(
      'currentUserId() called with no session. A screen that writes data rendered outside the auth gate.',
    )
  }
  return userId
}

/**
 * Synchronous mirror of profile.onboardedAt, keyed per account.
 *
 * The gate runs during render but Dexie resolves asynchronously, so navigating
 * away the instant onboarding finishes would otherwise be judged against a
 * stale profile and bounce straight back. Keyed by user id so a second account
 * on the same device still gets its own onboarding.
 */
function onboardedKey(id: string): string {
  return `ocd-workbook.onboarded.${id}`
}

export function markOnboardedLocally(id: string): void {
  localStorage.setItem(onboardedKey(id), '1')
}

export function hasOnboardedLocally(id: string): boolean {
  return localStorage.getItem(onboardedKey(id)) === '1'
}
