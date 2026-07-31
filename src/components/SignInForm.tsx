import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  isSupabaseConfigured,
  sendMagicLink,
  sendPasswordReset,
  signInWithPassword,
  signUpWithPassword,
} from '@/lib/supabase'

type Mode = 'signin' | 'signup' | 'reset' | 'link'

/**
 * Email and password, shared by the settings panel and the sign-in screen.
 *
 * Magic link is kept as a secondary route rather than removed: someone who
 * cannot remember whether they ever set a password should still have a way in
 * that always works.
 */
export function SignInForm({
  intro,
  initialMode = 'signin',
}: {
  intro?: React.ReactNode
  initialMode?: Mode
}) {
  const [mode, setMode] = useState<Mode>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  if (!isSupabaseConfigured) {
    return (
      <p className="rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
        Backup is not set up on this build, so everything stays on this device.
      </p>
    )
  }

  async function submit() {
    setBusy(true)
    setError(null)
    setNotice(null)

    if (mode === 'signin') {
      const { error } = await signInWithPassword(email.trim(), password)
      if (error) setError(error)
      // On success useAuth picks up the session and the screen moves on.
    } else if (mode === 'signup') {
      const { error, needsConfirmation } = await signUpWithPassword(
        email.trim(),
        password,
      )
      if (error) setError(error)
      else if (needsConfirmation)
        setNotice(
          `Almost there — open the confirmation link we sent to ${email.trim()}.`,
        )
    } else if (mode === 'reset') {
      const { error } = await sendPasswordReset(email.trim())
      if (error) setError(error)
      else
        setNotice(
          `If there is an account for ${email.trim()}, a reset link is on its way.`,
        )
    } else {
      const { error } = await sendMagicLink(email.trim())
      if (error) setError(error)
      else setNotice(`We sent a sign-in link to ${email.trim()}.`)
    }

    setBusy(false)
  }

  const needsPassword = mode === 'signin' || mode === 'signup'
  const canSubmit =
    email.includes('@') && (!needsPassword || password.length >= 8)

  const label =
    mode === 'signin'
      ? 'Sign in'
      : mode === 'signup'
        ? 'Create account'
        : mode === 'reset'
          ? 'Send reset link'
          : 'Send sign-in link'

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 bg-white p-4">
      {intro}

      {notice && (
        <p className="rounded-lg bg-calm-50 p-3 text-sm leading-relaxed text-ink-700">
          {notice}
        </p>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-700">
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
      </div>

      {needsPassword && (
        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSubmit && !busy) void submit()
            }}
            placeholder={mode === 'signup' ? 'At least 8 characters' : ''}
            className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                       placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
          />
          {mode === 'signup' && (
            <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
              This protects notes about your own symptoms. Please do not reuse a
              password from somewhere else.
            </p>
          )}
        </div>
      )}

      {error && <p className="text-sm leading-relaxed text-amber-800">{error}</p>}

      <Button full disabled={busy || !canSubmit} onClick={() => void submit()}>
        {busy ? 'One moment…' : label}
      </Button>

      <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
        {mode !== 'signin' && <Switch onClick={() => setMode('signin')}>Sign in</Switch>}
        {mode !== 'signup' && (
          <Switch onClick={() => setMode('signup')}>Create an account</Switch>
        )}
        {mode !== 'reset' && (
          <Switch onClick={() => setMode('reset')}>Forgot your password?</Switch>
        )}
        {mode !== 'link' && (
          <Switch onClick={() => setMode('link')}>Email me a link instead</Switch>
        )}
      </div>
    </div>
  )
}

function Switch({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap text-sm text-ink-500 underline decoration-ink-300
                 underline-offset-4 active:text-ink-800"
    >
      {children}
    </button>
  )
}
