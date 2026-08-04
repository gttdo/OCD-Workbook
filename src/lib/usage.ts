import { db, nowIso, stamp } from '@/db'
import { currentUserId } from '@/lib/session'

/**
 * Over-use detection.
 *
 * For this product high engagement is a safety alarm rather than a success
 * metric. Repeatedly reopening or re-editing the same entry is a checking
 * pattern, and an app that quietly rewards it has become the compulsion.
 *
 * Two rules kept throughout: this never blocks anything, and it never scolds.
 * It says what it noticed and gets out of the way. Being told off by software
 * for a symptom of your disorder would be its own small harm.
 */

const WINDOW_MINUTES = 20

/** Anything more often than this in the window is a checking pattern. */
const REVISIT_THRESHOLD = 4
const EDIT_THRESHOLD = 5

export type UsageEventType = 'view' | 'edit' | 'session_start' | 'session_end'

export async function record(
  eventType: UsageEventType,
  entityType?: string,
  entityId?: string,
): Promise<void> {
  try {
    await db.usageEvents.add(
      stamp(currentUserId(), {
        occurredAt: nowIso(),
        eventType,
        entityType,
        entityId,
        metadata: {},
      }),
    )
  } catch {
    // Telemetry must never break a screen. If this fails, it fails silently.
  }
}

export interface UsagePattern {
  kind: 'revisiting' | 'editing'
  count: number
  entityType?: string
}

/**
 * Looks only at the recent window, and only at one entity at a time. A person
 * working steadily through several different fears is not doing anything
 * worth interrupting — returning to the *same* one repeatedly is the signal.
 */
export async function detectPattern(
  entityType: string,
  entityId: string,
): Promise<UsagePattern | null> {
  const cutoff = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString()

  const recent = await db.usageEvents
    .filter(
      (e) =>
        e.entityType === entityType &&
        e.entityId === entityId &&
        e.occurredAt >= cutoff,
    )
    .toArray()

  const edits = recent.filter((e) => e.eventType === 'edit').length
  if (edits >= EDIT_THRESHOLD) {
    return { kind: 'editing', count: edits, entityType }
  }

  const views = recent.filter((e) => e.eventType === 'view').length
  if (views >= REVISIT_THRESHOLD) {
    return { kind: 'revisiting', count: views, entityType }
  }

  return null
}

/**
 * How lopsided the work has been.
 *
 * Someone can log urges diligently for months — resisting, delaying,
 * reclaiming real time — and never deliberately approach anything. That feels
 * productive and is better than giving in, but it is symptom management. The
 * disorder shrinks when you go toward things.
 */
export async function isOnlyManagingUrges(): Promise<boolean> {
  const [urges, exposures] = await Promise.all([
    db.compulsionEvents.filter((e) => !e.deletedAt).count(),
    db.exposureSessions.filter((s) => !s.deletedAt && !!s.endedAt).count(),
  ])
  return urges >= 8 && exposures === 0
}
