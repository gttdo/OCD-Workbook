import type { Anxiety, ExposureSession } from '@/db/types'

/** The book's own anchors for the 1–10 scale. */
export function anxietyLabel(value: Anxiety): string {
  if (value <= 2) return 'Slight'
  if (value <= 5) return 'Moderate'
  if (value <= 8) return 'Substantial'
  return 'Extreme'
}

/**
 * Graduation: three consecutive sessions with peak anxiety at or below 2.
 *
 * "Boredom is the opposite of anxiety and is therefore your friend." Retiring a
 * fear is the only terminal celebration in the app — there are no streaks, no
 * completion percentages, and nothing to farm.
 */
export const GRADUATION_THRESHOLD: Anxiety = 2
export const GRADUATION_CONSECUTIVE_SESSIONS = 3

export function isGraduated(sessions: ExposureSession[]): boolean {
  const rated = sessions
    .filter((s) => !s.deletedAt && s.anxietyPeak != null)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))

  if (rated.length < GRADUATION_CONSECUTIVE_SESSIONS) return false

  return rated
    .slice(-GRADUATION_CONSECUTIVE_SESSIONS)
    .every((s) => (s.anxietyPeak as Anxiety) <= GRADUATION_THRESHOLD)
}

/**
 * Peak anxiety per session, ordered. This is the hero visual.
 *
 * Note for the UI layer: this curve commonly RISES before it falls. Presenting
 * a rising line as failure in weeks 1–2 would drive people out at exactly the
 * moment they're most fragile — early sessions should be framed as "you're
 * facing it", with time-reclaimed leading the dashboard instead.
 */
export function habituationCurve(
  sessions: ExposureSession[],
): { sessionNumber: number; peak: Anxiety; startedAt: string }[] {
  return sessions
    .filter((s) => !s.deletedAt && s.anxietyPeak != null)
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((s, i) => ({
      sessionNumber: i + 1,
      peak: s.anxietyPeak as Anxiety,
      startedAt: s.startedAt,
    }))
}
