import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import {
  DAY_LABELS,
  downloadIcs,
  loadReminder,
  saveReminder,
  type ReminderPreference,
} from '@/lib/reminders'

/**
 * Set a practice time in advance.
 *
 * No streak, no "you missed a day", nothing that fires because you have been
 * away. You choose when, ahead of time, and it goes into your own calendar.
 */
export function ReminderSettings() {
  const [pref, setPref] = useState<ReminderPreference | null>(() => loadReminder())
  const [days, setDays] = useState<number[]>(() => loadReminder()?.days ?? [1, 3, 5])
  const [time, setTime] = useState(() => loadReminder()?.time ?? '18:30')
  const [added, setAdded] = useState(false)

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    )
    setAdded(false)
  }

  function apply() {
    const next = { days, time }
    saveReminder(next)
    setPref(next)
    downloadIcs(next)
    setAdded(true)
  }

  function clear() {
    saveReminder(null)
    setPref(null)
    setAdded(false)
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      <p className="text-sm leading-relaxed text-ink-600">
        Pick a time to practise and we will add it to your calendar. Choosing it
        in advance is part of the method — it means the decision is already made
        when the moment arrives.
      </p>

      <div>
        <div className="mb-2 text-sm font-medium text-ink-700">Which days</div>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, i) => {
            const on = days.includes(i)
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleDay(i)}
                aria-pressed={on}
                className={[
                  'tap h-11 w-11 rounded-lg text-sm font-medium transition-all duration-150',
                  on
                    ? 'bg-calm-700 text-white shadow-card'
                    : 'bg-ink-100 text-ink-500 active:bg-ink-200',
                ].join(' ')}
              >
                {label.slice(0, 1)}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="reminder-time"
          className="mb-1.5 block text-sm font-medium text-ink-700"
        >
          What time
        </label>
        <input
          id="reminder-time"
          type="time"
          value={time}
          onChange={(e) => {
            setTime(e.target.value)
            setAdded(false)
          }}
          className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                     focus:border-calm-600 focus:outline-none"
        />
      </div>

      {added && (
        <p className="animate-fade-in rounded-lg bg-calm-50 p-3 text-sm leading-relaxed text-ink-700">
          Downloaded. Open the file to add it to your calendar — it repeats
          weekly and you can edit or delete it there like anything else.
        </p>
      )}

      <Button full disabled={days.length === 0} onClick={apply}>
        {pref ? 'Update the reminder' : 'Add to my calendar'}
      </Button>

      {pref && (
        <button
          type="button"
          onClick={clear}
          className="tap text-sm text-ink-500 underline decoration-ink-300
                     underline-offset-4 active:text-ink-800"
        >
          Stop reminding me
        </button>
      )}

      <p className="text-xs leading-relaxed text-ink-400">
        It goes to your calendar rather than as a notification from us, because
        a web app cannot wake itself reliably to remind you — and your calendar
        already does this well.
      </p>
    </div>
  )
}
