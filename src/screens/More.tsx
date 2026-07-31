import { useState } from 'react'
import { Screen } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { Link } from 'react-router-dom'
import { isSupabaseConfigured, setPassword, signOut } from '@/lib/supabase'
import { sync } from '@/lib/sync'
import type { AuthState } from '@/lib/useAuth'
import type { SyncState } from '@/lib/useSync'

/**
 * Settings, and the backup account.
 *
 * Signing in is never required and never blocks anything. It is offered as
 * what it actually is — a way to not lose weeks of work to a cleared browser
 * store — and the copy says plainly what leaves the device, because people
 * with contamination and harm obsessions will read this carefully and deserve
 * a straight answer.
 */
export function More({
  auth,
  syncState,
}: {
  auth: AuthState
  syncState: SyncState
}) {
  return (
    <Screen title="More">
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-medium text-ink-500">Your data</h2>
          {auth.signedIn ? (
            <SignedIn email={auth.email} syncState={syncState} />
          ) : isSupabaseConfigured ? (
            <SignedOut />
          ) : (
            <p className="rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
              Backup is not set up on this build, so everything stays on this
              device.
            </p>
          )}
        </section>

        <section>
          <h2 className="mb-3 text-sm font-medium text-ink-500">
            What we do not do
          </h2>
          <ul className="space-y-2 rounded-xl border border-ink-200 bg-white p-4 text-sm leading-relaxed text-ink-600">
            <li>No analytics or advertising trackers of any kind.</li>
            <li>Your writing is never used to train anything.</li>
            <li>No streaks, no scores, nothing designed to keep you here.</li>
          </ul>
        </section>
      </div>
    </Screen>
  )
}

/**
 * Signed out, More states the situation and points at the sign-in screen. It
 * does not inline the form.
 *
 * Settings is the wrong place to host a signup: it buries a primary action in
 * a junk drawer, it duplicates /signin, and it hands the largest block on the
 * page to the one thing a signed-in person never needs again.
 */
function SignedOut() {
  return (
    <Link
      to="/signin"
      className="tap block rounded-xl border border-ink-200 bg-white p-4 active:bg-ink-50"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium text-ink-900">
            Everything is on this device only
          </div>
          <div className="mt-0.5 text-sm leading-relaxed text-ink-500">
            Clearing your browsing data would take it with it. An account keeps
            a copy and lets you pick up elsewhere.
          </div>
        </div>
        <span aria-hidden className="flex-none text-ink-400">
          →
        </span>
      </div>
    </Link>
  )
}

function SignedIn({
  email,
  syncState,
}: {
  email: string | null
  syncState: SyncState
}) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function syncNow() {
    setBusy(true)
    const r = await sync()
    setBusy(false)
    setResult(
      r.errors.length > 0
        ? r.errors[0]!
        : `Sent ${r.pushed}, received ${r.pulled}.`,
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 bg-white p-4">
      <div>
        <div className="text-sm text-ink-500">Backing up to</div>
        <div className="font-medium text-ink-900">{email}</div>
      </div>

      <p className="text-sm leading-relaxed text-ink-600">
        {syncState.kind === 'error'
          ? 'Your work is safe on this device and will catch up when it can.'
          : 'Your work is copied to your account as you go.'}
      </p>

      {result && <p className="text-sm text-ink-500">{result}</p>}

      <div className="space-y-2">
        <Button full variant="secondary" disabled={busy} onClick={() => void syncNow()}>
          {busy ? 'Syncing…' : 'Sync now'}
        </Button>
        <Button full variant="quiet" onClick={() => void signOut()}>
          Sign out
        </Button>
      </div>

      <PasswordSetter />

      <p className="text-xs leading-relaxed text-ink-400">
        Signing out leaves everything on this device untouched.
      </p>
    </div>
  )
}

/**
 * Set or change a password without leaving the app.
 *
 * Someone signed in by magic link otherwise has no route to a password except
 * the forgot-password flow — which sends them back to their inbox, the exact
 * thing they were trying to stop doing.
 */
function PasswordSetter() {
  const [open, setOpen] = useState(false)
  const [password, setPasswordValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function save() {
    setBusy(true)
    setError(null)
    const { error } = await setPassword(password)
    setBusy(false)
    if (error) {
      setError(error)
    } else {
      setDone(true)
      setPasswordValue('')
    }
  }

  if (done) {
    return (
      <p className="rounded-lg bg-calm-50 p-3 text-sm leading-relaxed text-ink-700">
        Password saved. You can sign in with it from now on.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap text-left text-sm text-ink-500 underline decoration-ink-300
                   underline-offset-4 active:text-ink-800"
      >
        Set or change your password
      </button>
    )
  }

  return (
    <div className="space-y-2 border-t border-ink-100 pt-3">
      <label htmlFor="new-pw" className="block text-sm font-medium text-ink-700">
        New password
      </label>
      <input
        id="new-pw"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPasswordValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && password.length >= 8 && !busy) void save()
        }}
        placeholder="At least 8 characters"
        className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                   placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
      />
      <p className="text-xs leading-relaxed text-ink-400">
        This protects notes about your own symptoms. Please do not reuse a
        password from somewhere else.
      </p>
      {error && <p className="text-sm leading-relaxed text-amber-800">{error}</p>}
      <Button full disabled={busy || password.length < 8} onClick={() => void save()}>
        {busy ? 'Saving…' : 'Save password'}
      </Button>
    </div>
  )
}
