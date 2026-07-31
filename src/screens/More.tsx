import { useState } from 'react'
import { Screen } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { isSupabaseConfigured, sendMagicLink, signOut } from '@/lib/supabase'
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
          ) : (
            <SignIn />
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

function SignIn() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    setError(null)
    const { error } = await sendMagicLink(email.trim())
    setBusy(false)
    if (error) setError(error)
    else setSent(true)
  }

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
        Backup is not set up on this build, so everything stays on this device.
      </p>
    )
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-calm-600 bg-calm-50 p-4">
        <div className="font-medium text-ink-900">Check your email</div>
        <p className="mt-1 text-sm leading-relaxed text-ink-700">
          We sent a link to {email}. Opening it on this device finishes the
          setup. Nothing is lost if you ignore it.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 bg-white p-4">
      <p className="text-sm leading-relaxed text-ink-600">
        Right now everything you have written lives only in this browser.
        Clearing your browsing data would take it with it. Adding an email keeps
        a copy, and lets you pick up on another device.
      </p>
      <p className="text-sm leading-relaxed text-ink-500">
        We only ever email you a sign-in link. No password, no newsletters.
      </p>

      <label htmlFor="email" className="block text-sm font-medium text-ink-700">
        Email
      </label>
      <input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                   placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
      />

      {error && (
        <p className="text-sm leading-relaxed text-amber-800">{error}</p>
      )}

      <Button
        full
        disabled={busy || !email.includes('@')}
        onClick={() => void send()}
      >
        {busy ? 'Sending…' : 'Send me a link'}
      </Button>
    </div>
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

      <p className="text-xs leading-relaxed text-ink-400">
        Signing out leaves everything on this device untouched.
      </p>
    </div>
  )
}
