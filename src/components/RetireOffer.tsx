import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { retire } from '@/lib/graduation'

/**
 * The one terminal celebration in this app.
 *
 * Everything else here refuses to congratulate — no streaks, no scores, no
 * affirmations — because those mechanics are symptom-shaped for this
 * population. This is the exception, and it earns it by being terminal: you
 * finish a fear and you leave, rather than being handed a fresh counter.
 *
 * It offers rather than declares. "Three quiet sessions in a row" is an
 * observation; whether the fear is done is the person's call and their
 * therapist's.
 */
export function RetireOffer({
  triggerId,
  label,
  onRetired,
}: {
  triggerId: string
  label: string
  onRetired?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [reclaimed, setReclaimed] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function confirm() {
    setBusy(true)
    await retire(triggerId, reclaimed)
    setBusy(false)
    setDone(true)
    onRetired?.()
  }

  if (done) {
    return (
      <div className="rounded-xl border border-calm-600 bg-calm-50 p-4">
        <div className="font-medium text-ink-900">Retired.</div>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-700">
          {label} is off your ladder. If it ever comes back, that is normal and
          you can pick it up again — it will not have undone this.
        </p>
      </div>
    )
  }

  if (!open) {
    return (
      <div className="rounded-xl border border-calm-600 bg-calm-50 p-4">
        <div className="font-medium text-ink-900">
          Three quiet sessions in a row.
        </div>
        <p className="mt-1 text-[15px] leading-relaxed text-ink-700">
          This one has stopped producing much. That is what finishing looks like
          — not the thought never arriving, but it no longer deciding what you
          do.
        </p>
        <div className="mt-3 space-y-2">
          <Button full onClick={() => setOpen(true)}>
            Retire this fear
          </Button>
          <Button full variant="quiet" onClick={onRetired}>
            Not yet
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-calm-600 bg-calm-50 p-4">
      <div className="font-medium text-ink-900">What does this give you back?</div>
      <p className="mt-1 text-sm leading-relaxed text-ink-600">
        Optional, and in your own words. This is the part worth keeping — not
        the number.
      </p>
      <input
        value={reclaimed}
        onChange={(e) => setReclaimed(e.target.value)}
        placeholder="I can use a bathroom anywhere now"
        className="tap mt-3 w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5
                   text-[16px] placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
      />
      <div className="mt-3 space-y-2">
        <Button full disabled={busy} onClick={() => void confirm()}>
          {busy ? 'One moment…' : 'Retire it'}
        </Button>
        <Button full variant="quiet" onClick={() => setOpen(false)}>
          Back
        </Button>
      </div>
    </div>
  )
}
