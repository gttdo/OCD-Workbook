import { db } from '@/db'
import type { CycleLog } from '@/db/types'

/**
 * The cycle tracker's week.
 *
 * Deliberately bounded rather than a permanent diary. Wahl et al. (2021,
 * randomized, n=145 diagnosed OCD) found that ruminating about OC symptoms
 * increased severity and reduced positive affect at 24-hour follow-up — and an
 * open-ended log of triggers, thoughts and bodily sensations is functionally
 * prompted dwelling. The source workbook scopes this to a single week; the app
 * enforces that rather than offering it.
 *
 * The purpose is vocabulary, not surveillance. A week is enough to learn what
 * a trigger, an obsession and a compulsion look like in your own life, which
 * is what every other screen here assumes you already know.
 */
export const WEEK_DAYS = 7

export type CycleWeekState =
  | { phase: 'not-started' }
  | { phase: 'running'; day: number; startedAt: string; entries: CycleLog[] }
  | { phase: 'finished'; startedAt: string; entries: CycleLog[] }

function dayNumber(startedAt: string): number {
  const start = new Date(startedAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.floor((today.getTime() - start.getTime()) / 86_400_000) + 1
}

export async function cycleWeekState(): Promise<CycleWeekState> {
  const entries = (
    await db.cycleLogs.filter((l) => !l.deletedAt).toArray()
  ).sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))

  if (entries.length === 0) return { phase: 'not-started' }

  const startedAt = entries[0]!.occurredAt
  const day = dayNumber(startedAt)

  return day > WEEK_DAYS
    ? { phase: 'finished', startedAt, entries }
    : { phase: 'running', day, startedAt, entries }
}

export interface CycleSummary {
  entryCount: number
  /** Distinct triggers named, most frequent first. */
  triggers: { text: string; count: number }[]
  compulsions: { text: string; count: number }[]
  commonEmotions: string[]
}

function tally(values: string[]): { text: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const raw of values) {
    const key = raw.trim().toLowerCase()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * What the week showed. This is the point of doing it — a log nobody reads
 * back is just a week spent paying closer attention to your symptoms.
 */
export function summarise(entries: CycleLog[]): CycleSummary {
  const emotions = new Map<string, number>()
  for (const e of entries) {
    for (const label of e.emotions) {
      emotions.set(label, (emotions.get(label) ?? 0) + 1)
    }
  }

  return {
    entryCount: entries.length,
    triggers: tally(entries.map((e) => e.triggerText ?? '')),
    compulsions: tally(entries.map((e) => e.compulsionText ?? '')),
    commonEmotions: [...emotions.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([label]) => label),
  }
}
