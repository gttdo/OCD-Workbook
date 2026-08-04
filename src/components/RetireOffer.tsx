import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
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
  const values = useLiveQuery(
    () => db.values.filter((v) => !v.deletedAt).toArray(),
    [],
    [],
  )
  const [open, setOpen] = useState(false)
  const [reclaimed, setReclaimed] = useState('')
  const [tagged, setTagged] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  async function confirm() {
    setBusy(true)
    await retire(triggerId, reclaimed, tagged)
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
      {/* Only offered if there is something to point at. */}
      {values.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-ink-600">Which part of your life?</div>
          <div className="flex flex-wrap gap-2">
            {values.map((v) => {
              const on = tagged.includes(v.id)
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() =>
                    setTagged(
                      on ? tagged.filter((id) => id !== v.id) : [...tagged, v.id],
                    )
                  }
                  aria-pressed={on}
                  className={[
                    'tap rounded-full border px-3 py-1.5 text-sm transition-all duration-150',
                    on
                      ? 'border-calm-700 bg-calm-700 text-white'
                      : 'border-ink-300 bg-white text-ink-600',
                  ].join(' ')}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
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
