import { db, nowIso, stamp } from '@/db'
import type { ExposureSession, Trigger } from '@/db/types'
import {
  GRADUATION_CONSECUTIVE_SESSIONS,
  GRADUATION_THRESHOLD,
  isGraduated,
} from './anxiety'
import { currentUserId } from './session'

export { GRADUATION_CONSECUTIVE_SESSIONS, GRADUATION_THRESHOLD }

/**
 * Whether a trigger now meets the retirement rule: three consecutive rated
 * sessions at peak distress 2 or below. "Boredom is the opposite of anxiety
 * and is therefore your friend."
 *
 * Meeting it is never acted on automatically. The app surfaces the pattern and
 * the person decides — software that performs patient-specific analysis and
 * then issues a directive is a regulated device, and being told by an app that
 * you are done with a fear is the wrong relationship to have with your own
 * treatment either way.
 */
export async function isEligibleToRetire(triggerId: string): Promise<boolean> {
  const trigger = await db.triggers.get(triggerId)
  if (!trigger || trigger.status === 'graduated' || trigger.deletedAt) return false

  const sessions = await db.exposureSessions
    .filter((s) => !s.deletedAt && s.triggerId === triggerId && !!s.endedAt)
    .toArray()

  return isGraduated(sessions as ExposureSession[])
}

async function recordStatus(
  trigger: Trigger,
  to: Trigger['status'],
  note?: string,
): Promise<void> {
  const userId = currentUserId()
  await db.triggerStatusEvents.add(
    stamp(userId, {
      triggerId: trigger.id,
      fromStatus: trigger.status,
      toStatus: to,
      occurredAt: nowIso(),
      note: note ?? null,
    }),
  )
}

/**
 * Retire a fear.
 *
 * `reclaimed` is what the person says this gives them back, in their own
 * words. It goes to the values ledger — the record of life returned, which is
 * the reward this app trades in rather than points.
 */
export async function retire(
  triggerId: string,
  reclaimed?: string,
): Promise<void> {
  const trigger = await db.triggers.get(triggerId)
  if (!trigger) return

  await recordStatus(trigger, 'graduated')
  await db.triggers.update(triggerId, {
    status: 'graduated',
    graduatedAt: nowIso(),
    updatedAt: nowIso(),
    syncedAt: null,
  })

  if (reclaimed?.trim()) {
    await db.reclaimedActions.add(
      stamp(currentUserId(), {
        occurredAt: nowIso(),
        description: reclaimed.trim(),
        triggerId,
        valueIds: [],
      }),
    )
  }
}

/**
 * Bring a retired fear back.
 *
 * Deliberately not framed as undoing a mistake. Lapses are expected in this
 * work, and a fear returning is information, not a failure — so the history is
 * kept as an arc rather than the graduation being erased.
 */
export async function unretire(triggerId: string, note?: string): Promise<void> {
  const trigger = await db.triggers.get(triggerId)
  if (!trigger) return

  await recordStatus(trigger, 'relapsed', note)
  await db.triggers.update(triggerId, {
    status: 'relapsed',
    graduatedAt: null,
    updatedAt: nowIso(),
    syncedAt: null,
  })
}
