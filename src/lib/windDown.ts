import { db } from '@/db'

/**
 * Winding down.
 *
 * This app is supposed to end. Success looks like sessions getting shorter and
 * visits getting rarer, and app dependency shows up as a documented adverse
 * event in the mental-health-app trial literature — so leaving needs to be a
 * designed state rather than something that happens by drifting away.
 *
 * The signal is deliberately conservative. Suggesting someone wind down while
 * they still have work in front of them would be worse than saying nothing.
 */

const QUIET_DAYS = 21

export interface WindDownState {
  /** Everything they listed has been retired. */
  allRetired: boolean
  /** Retired something, and nothing since. */
  quiet: boolean
  retiredCount: number
  daysSinceLastExposure: number | null
}

export async function windDownState(): Promise<WindDownState> {
  const [triggers, sessions] = await Promise.all([
    db.triggers.filter((t) => !t.deletedAt).toArray(),
    db.exposureSessions.filter((s) => !s.deletedAt && !!s.endedAt).toArray(),
  ])

  const retired = triggers.filter((t) => t.status === 'graduated')
  const active = triggers.filter((t) => t.status !== 'graduated')

  const latest = sessions
    .map((s) => s.endedAt!)
    .sort()
    .at(-1)

  const daysSince = latest
    ? Math.floor((Date.now() - new Date(latest).getTime()) / 86_400_000)
    : null

  return {
    allRetired: retired.length > 0 && active.length === 0,
    quiet:
      retired.length > 0 && daysSince != null && daysSince >= QUIET_DAYS,
    retiredCount: retired.length,
    daysSinceLastExposure: daysSince,
  }
}

/**
 * Everything worth keeping, as plain text.
 *
 * The point of an ending is that you can walk away with the record rather than
 * having to keep the app installed to hold onto it.
 */
export async function buildRecord(): Promise<string> {
  const [triggers, sessions, events, reclaimed] = await Promise.all([
    db.triggers.filter((t) => !t.deletedAt).toArray(),
    db.exposureSessions.filter((s) => !s.deletedAt && !!s.endedAt).toArray(),
    db.compulsionEvents.filter((e) => !e.deletedAt).toArray(),
    db.reclaimedActions.filter((r) => !r.deletedAt).toArray(),
  ])

  const retired = triggers.filter((t) => t.status === 'graduated')
  const lines: string[] = []

  lines.push('WHAT YOU DID', '')
  lines.push(`Exposures faced: ${sessions.length}`)
  lines.push(`Compulsions resisted: ${events.filter((e) => e.resisted).length}`)
  lines.push(`Fears retired: ${retired.length}`, '')

  if (retired.length > 0) {
    lines.push('FEARS YOU RETIRED', '')
    for (const t of retired) {
      // Sorted before slicing. IndexedDB returns rows in key order and the
      // keys are random UUIDs, so "first" and "last" were arbitrary — the
      // record was reporting a start and end distress picked at random.
      const mine = sessions
        .filter((s) => s.triggerId === t.id)
        .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
      const peaks = mine
        .map((s) => s.anxietyPeak)
        .filter((p) => p != null)
      lines.push(`- ${t.label}`)
      if (peaks.length >= 2) {
        lines.push(`  distress went from ${peaks[0]} to ${peaks.at(-1)} out of 10`)
      }
      lines.push(`  ${mine.length} exposure${mine.length === 1 ? '' : 's'}`)
    }
    lines.push('')
  }

  if (reclaimed.length > 0) {
    lines.push('WHAT YOU GOT BACK', '')
    for (const r of reclaimed) lines.push(`- ${r.description}`)
    lines.push('')
  }

  lines.push('IF IT COMES BACK', '')
  lines.push(
    'A fear returning is normal and does not undo any of the above. What',
    'worked before is what works again: go toward it on purpose, and do not',
    'do the thing that makes the feeling stop. Start smaller than you think',
    'you need to.',
    '',
    'This is not a medical record. Bring it to your therapist if it helps.',
  )

  return lines.join('\n')
}

export function downloadRecord(text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-record.txt'
  a.click()
  URL.revokeObjectURL(url)
}
