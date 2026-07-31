import type { Anxiety } from '@/db/types'
import { anxietyLabel } from '@/lib/anxiety'

interface Props {
  value: Anxiety | null
  onChange: (value: Anxiety) => void
  label?: string
  /** Rendered inside an active exposure, where the tone shifts. */
  inExposure?: boolean
}

const LEVELS: Anxiety[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * The 1–10 SUDS rating. Reused in the avoidance inventory, the fear ladder,
 * every exposure session, and the compulsion timer — so it gets to be the one
 * genuinely polished control in the app.
 *
 * Colour carries intensity here and nowhere else in the UI. A high rating is
 * never styled as failure: during exposure work, high numbers are the point.
 */
export function AnxietyScale({ value, onChange, label, inExposure }: Props) {
  return (
    <div>
      {label && (
        <div className="mb-2 text-sm font-medium text-ink-700">{label}</div>
      )}

      <div className="grid grid-cols-10 gap-1">
        {LEVELS.map((level) => {
          const selected = value === level
          return (
            <button
              key={level}
              type="button"
              onClick={() => onChange(level)}
              aria-label={`${level} out of 10, ${anxietyLabel(level)}`}
              aria-pressed={selected}
              className={[
                'tap flex items-center justify-center rounded-md text-sm font-semibold',
                'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-calm-600',
                selected
                  ? 'bg-ink-800 text-white'
                  : 'bg-ink-100 text-ink-600 active:bg-ink-200',
              ].join(' ')}
            >
              {level}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-ink-400">
        <span>Slight</span>
        <span>Moderate</span>
        <span>Substantial</span>
        <span>Extreme</span>
      </div>

      {value != null && (
        <p className="mt-3 text-sm text-ink-600">
          <span className="font-medium text-ink-800">
            {value} · {anxietyLabel(value)}
          </span>
          {inExposure && value >= 7 && (
            <span className="ml-1 text-calm-700">
              — that's high, and that's what makes this work.
            </span>
          )}
        </p>
      )}
    </div>
  )
}
