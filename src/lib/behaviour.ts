import { db } from '@/db'

/**
 * The headline numbers.
 *
 * Deliberately all behavioural — what the person DID. Symptom monitoring is
 * the most frequently reported app-induced adverse effect in the trial
 * literature (Linardon et al. 2024), and therapist interviews recommend
 * tracking exposure practice rather than anxiety levels. The anxiety curve
 * still exists; it just does not lead.
 */
export interface BehaviourSummary {
  exposures: number
  compulsionsResisted: number
  secondsReclaimed: number
  triggersRetired: number
}

export async function behaviourSummary(): Promise<BehaviourSummary> {
  const [sessions, events, triggers] = await Promise.all([
    db.exposureSessions.filter((s) => !s.deletedAt).toArray(),
    db.compulsionEvents.filter((e) => !e.deletedAt).toArray(),
    db.triggers.filter((t) => !t.deletedAt).toArray(),
  ])

  const secondsReclaimed = events.reduce((total, e) => {
    const baseline = e.baselineDurationSeconds ?? 0
    const actual = e.resisted ? 0 : (e.durationSeconds ?? 0)
    return total + Math.max(baseline - actual, 0)
  }, 0)

  return {
    exposures: sessions.filter((s) => s.endedAt).length,
    compulsionsResisted: events.filter((e) => e.resisted).length,
    secondsReclaimed,
    triggersRetired: triggers.filter((t) => t.status === 'graduated').length,
  }
}

/** "3h 40m" — hours and minutes, never a decimal. */
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours === 0) return `${minutes}m`
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}
