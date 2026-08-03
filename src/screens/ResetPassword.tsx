import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Screen } from '@/components/AppShell'
import { Button } from '@/components/ui/Button'
import { setPassword } from '@/lib/supabase'
import type { AuthState } from '@/lib/useAuth'

/**
 * Where a reset link lands. Supabase turns the token in the URL into a session
 * on load, so by the time this renders the person is authenticated and can set
 * a new password directly.
 */
export function ResetPassword({ auth }: { auth: AuthState }) {
  const navigate = useNavigate()
  const [password, setPasswordValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    setBusy(true)
    setError(null)
    const { error } = await setPassword(password)
    setBusy(false)
    if (error) setError(error)
    else navigate('/home', { replace: true })
  }

  if (!auth.loading && !auth.signedIn) {
    return (
      <Screen title="That link has expired">
        <p className="text-[15px] leading-relaxed text-ink-600">
          Reset links only work once and do not last long. Ask for a new one
          from the sign-in screen and it will work.
        </p>
      </Screen>
    )
  }

  return (
    <Screen title="Choose a new password">
      <div className="space-y-3 rounded-xl border border-ink-200 bg-white p-4">
        <label
          htmlFor="new-password"
          className="block text-sm font-medium text-ink-700"
        >
          New password
        </label>
        <input
          id="new-password"
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
        {error && <p className="text-sm leading-relaxed text-amber-800">{error}</p>}
        <Button
          full
          disabled={busy || password.length < 8}
          onClick={() => void save()}
        >
          {busy ? 'Saving…' : 'Save and continue'}
        </Button>
      </div>
    </Screen>
  )
}
