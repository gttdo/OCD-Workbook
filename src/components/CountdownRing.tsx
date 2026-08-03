import { formatClock } from '@/lib/useElapsed'

/**
 * The delay timer's ring.
 *
 * Informative rather than decorative: holding off is the hard part, and how
 * much is left is the thing a person actually wants to know while they do it.
 *
 * Once the target is passed the ring stays complete and the clock counts up.
 * It does not celebrate — no burst, no colour change to "success" — because
 * an urge you outlasted is not a score. It simply stops being the point.
 */
export function CountdownRing({
  elapsed,
  target,
}: {
  elapsed: number
  target: number
}) {
  const size = 208
  const stroke = 8
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r

  const reached = elapsed >= target
  const progress = reached ? 1 : Math.min(elapsed / target, 1)
  const remaining = Math.max(target - elapsed, 0)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#0d9488"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke-dashoffset 500ms linear' }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-5xl font-semibold text-ink-900">
          {formatClock(reached ? elapsed : remaining)}
        </div>
        <div className="mt-1 px-6 text-center text-sm text-ink-500">
          {reached ? 'past your target, and still going' : 'left to wait'}
        </div>
      </div>
    </div>
  )
}
