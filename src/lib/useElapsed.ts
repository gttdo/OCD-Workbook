import { useEffect, useState } from 'react'

/**
 * Seconds since a fixed instant, recomputed from wall-clock time rather than
 * accumulated from ticks.
 *
 * This matters more here than it looks. A phone screen locks, the tab is
 * backgrounded, and browsers throttle or suspend timers — an interval that
 * counts up by one each tick would quietly under-report, and this number is
 * the input to "time reclaimed". Anchoring to a timestamp means the count is
 * correct however long the app was asleep.
 */
export function useElapsedSeconds(startedAtIso: string | null): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!startedAtIso) {
      setSeconds(0)
      return
    }
    const start = new Date(startedAtIso).getTime()
    const compute = () =>
      setSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)))

    compute()
    const id = window.setInterval(compute, 500)
    // Recompute the instant we come back, before the next tick would fire.
    const onVisible = () => {
      if (document.visibilityState === 'visible') compute()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [startedAtIso])

  return seconds
}

/** "9:05" or "1:02:30". */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const hours = Math.floor(s / 3600)
  const minutes = Math.floor((s % 3600) / 60)
  const secs = s % 60
  const mm = hours > 0 ? String(minutes).padStart(2, '0') : String(minutes)
  return hours > 0
    ? `${hours}:${mm}:${String(secs).padStart(2, '0')}`
    : `${mm}:${String(secs).padStart(2, '0')}`
}
