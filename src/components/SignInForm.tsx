import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { isSupabaseConfigured, sendMagicLink } from '@/lib/supabase'

/**
 * Shared by the settings panel and the standalone sign-in screen, so the two
 * cannot drift apart.
 */
export function SignInForm({ intro }: { intro?: React.ReactNode }) {
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
          We sent a link to {email}. Open it on this device and you will be
          brought straight back here. Nothing is lost if you ignore it.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 bg-white p-4">
      {intro}

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

      {error && <p className="text-sm leading-relaxed text-amber-800">{error}</p>}

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
