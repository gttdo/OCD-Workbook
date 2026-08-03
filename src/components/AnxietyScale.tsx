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
 * The 1–10 distress rating — the most reused control in the app, and the only
 * place colour encodes intensity.
 *
 * Only the selected value is coloured. An earlier idea tinted every step up to
 * the choice, which turns the control into a progress bar: a 9 would read as
 * nearly-full, and "high score" is the last thing a distress rating should
 * suggest.
 *
 * The ramp is teal rather than red. Someone rating a 9 is already frightened;
 * the interface does not need to agree with them.
 */
function band(value: Anxiety): { fill: string; text: string } {
  if (value <= 2) return { fill: 'bg-level-slight', text: 'text-level-slight' }
  if (value <= 5) return { fill: 'bg-level-moderate', text: 'text-level-moderate' }
  if (value <= 8)
    return { fill: 'bg-level-substantial', text: 'text-level-substantial' }
  return { fill: 'bg-level-extreme', text: 'text-level-extreme' }
}

export function AnxietyScale({ value, onChange, label, inExposure }: Props) {
  return (
    <div>
      {label && (
        <div className="mb-2.5 text-sm font-medium text-ink-700">{label}</div>
      )}

      {/*
        Two rows of five, not ten across. Ten 44px targets plus gaps needs
        476px; a phone gives 375px, so a single row silently overflowed and
        clipped the 10. Five columns leaves targets comfortably above the
        minimum instead of trading accessibility for a straight line.
      */}
      <div
        className="grid grid-cols-5 gap-2"
        role="radiogroup"
        aria-label={label ?? 'Distress rating out of ten'}
      >
        {LEVELS.map((level) => {
          const selected = value === level
          return (
            <button
              key={level}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(level)}
              aria-label={`${level} out of 10, ${anxietyLabel(level)}`}
              className={[
                'tap flex h-11 items-center justify-center rounded-lg text-[15px] font-semibold',
                'transition-all duration-200 ease-out',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-calm-600 focus-visible:ring-offset-2',
                // Lifts rather than scales. At 375px the ten columns are
                // narrow enough that scaling the selected one overlaps its
                // neighbour and hides the 10 entirely.
                selected
                  ? `${band(level).fill} -translate-y-0.5 text-white shadow-lift`
                  : 'bg-ink-100 text-ink-500 active:bg-ink-200',
              ].join(' ')}
            >
              {level}
            </button>
          )
        })}
      </div>

      <div className="mt-2 flex justify-between text-[11px] text-ink-400">
        <span>Slight</span>
        <span>Extreme</span>
      </div>

      {/* Height reserved so picking a value never shifts what is under it. */}
      <div className="mt-3 min-h-[1.25rem]">
        {value != null && (
          <p key={value} className="animate-fade-in text-sm text-ink-600">
            <span className={`font-medium ${band(value).text}`}>
              {value} · {anxietyLabel(value)}
            </span>
            {inExposure && value >= 7 && (
              <span className="ml-1 text-ink-500">
                — that's high, and that's what makes this work.
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
