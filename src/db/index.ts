import Dexie, { type EntityTable } from 'dexie'
import type {
  Commitment,
  Compulsion,
  CompulsionEvent,
  CycleLog,
  ExposurePrompt,
  ExposureSession,
  Obsession,
  Profile,
  ReclaimedAction,
  Screening,
  Trigger,
  TriggerStatusEvent,
  UsageEvent,
  Value,
} from './types'

/**
 * IndexedDB is the source of truth. Supabase is a sync target.
 *
 * This inversion is deliberate: exposures happen in public bathrooms, hospital
 * corridors and parking garages. If the app can't record a SUDS rating at
 * anxiety 8 because there's no signal, it has failed at the one moment it
 * exists for. Everything writes locally first and reconciles later.
 */
class WorkbookDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  screenings!: EntityTable<Screening, 'id'>
  values!: EntityTable<Value, 'id'>
  commitments!: EntityTable<Commitment, 'id'>
  triggers!: EntityTable<Trigger, 'id'>
  triggerStatusEvents!: EntityTable<TriggerStatusEvent, 'id'>
  obsessions!: EntityTable<Obsession, 'id'>
  compulsions!: EntityTable<Compulsion, 'id'>
  cycleLogs!: EntityTable<CycleLog, 'id'>
  exposurePrompts!: EntityTable<ExposurePrompt, 'id'>
  exposureSessions!: EntityTable<ExposureSession, 'id'>
  compulsionEvents!: EntityTable<CompulsionEvent, 'id'>
  reclaimedActions!: EntityTable<ReclaimedAction, 'id'>
  usageEvents!: EntityTable<UsageEvent, 'id'>

  constructor() {
    super('ocd-workbook')

    // `syncedAt` is indexed on every synced table so the push queue is a cheap
    // "where syncedAt is null" scan rather than a full table walk.
    this.version(1).stores({
      profile: 'id, syncedAt',
      screenings: 'id, takenAt, syncedAt',
      values: 'id, sortOrder, syncedAt',
      commitments: 'id, isActive, syncedAt',
      triggers: 'id, status, ladderRank, syncedAt',
      triggerStatusEvents: 'id, triggerId, occurredAt, syncedAt',
      obsessions: 'id, triggerId, syncedAt',
      compulsions: 'id, triggerId, isActive, syncedAt',
      cycleLogs: 'id, occurredAt, triggerId, syncedAt',
      exposurePrompts: 'id, difficulty',
      exposureSessions: 'id, triggerId, startedAt, syncedAt',
      compulsionEvents: 'id, compulsionId, occurredAt, syncedAt',
      reclaimedActions: 'id, occurredAt, triggerId, syncedAt',
      usageEvents: 'id, occurredAt, [entityType+entityId], syncedAt',
    })
  }
}

export const db = new WorkbookDB()

/** Client-generated so an offline write can never collide on sync. */
export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** Stamps a new record with sync bookkeeping. */
export function stamp<T extends object>(
  userId: string,
  record: T,
): T & { id: string; userId: string; createdAt: string; updatedAt: string; syncedAt: null } {
  const ts = nowIso()
  return { ...record, id: newId(), userId, createdAt: ts, updatedAt: ts, syncedAt: null }
}

/** Marks a record dirty so the sync queue picks it up. */
export function touch<T extends object>(patch: T): T & { updatedAt: string; syncedAt: null } {
  return { ...patch, updatedAt: nowIso(), syncedAt: null }
}

/**
 * Completed records are not editable, and that is a clinical decision rather
 * than a missing feature.
 *
 * "Redoing exposures until they feel just right" and "mentally reviewing
 * exposures for possible errors" are both named ERP compulsions. A finished
 * exposure or urge event is a record of what happened, not a draft — the
 * update calls in the exercise screens all belong to a session still in
 * progress. Please do not add an edit path for a completed one.
 */

/** Soft delete — tombstones must reach the server, so never hard-delete. */
export function tombstone(): { deletedAt: string; updatedAt: string; syncedAt: null } {
  const ts = nowIso()
  return { deletedAt: ts, updatedAt: ts, syncedAt: null }
}
