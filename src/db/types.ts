/**
 * Domain types, mirroring supabase/migrations/0001_initial_schema.sql.
 *
 * These are the *local* shapes. Every record carries sync bookkeeping because
 * IndexedDB is the source of truth and Supabase is a sync target, not the
 * other way round.
 */

export type OcdSubtype =
  | 'contamination'
  | 'checking'
  | 'symmetry'
  | 'harm'
  | 'perfection'
  | 'magical_thinking'

/**
 * The routing decision that actually matters. v1's engine handles behavioral
 * compulsions; mental-only compulsions (rumination, mental review, silent
 * prayer or counting) need imaginal exposure, which is v2.
 */
export type CompulsionForm = 'behavioral' | 'mental'

export type TriggerCategory =
  | 'place'
  | 'person_or_animal'
  | 'object'
  | 'situation'
  | 'thought_or_image'

export type TriggerStatus =
  | 'identified'
  | 'laddered'
  | 'in_progress'
  | 'graduated'
  | 'paused'
  | 'relapsed'

export type ExposureKind = 'in_vivo' | 'uncertainty_starter' | 'imaginal'

/** 1–10 SUDS. The single most reused value in the app. */
export type Anxiety = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

/** Bookkeeping every synced record carries. */
export interface SyncMeta {
  id: string
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
  /** Set once the row has been accepted by Supabase. Absent = pending push. */
  syncedAt?: string | null
}

export interface Profile extends SyncMeta {
  ocdName?: string | null
  ocdMetaphor?: string | null
  primaryCompulsionForm?: CompulsionForm | null
  onboardedAt?: string | null
}

export interface Screening extends SyncMeta {
  takenAt: string
  responses: Record<string, boolean>
  subtypeScores: Partial<Record<OcdSubtype, number>>
  compulsionForm?: CompulsionForm | null
}

export interface Value extends SyncMeta {
  label: string
  whyItMatters?: string | null
  sortOrder: number
}

export interface Commitment extends SyncMeta {
  statement: string
  isActive: boolean
}

/** The spine. Everything else hangs off a trigger. */
export interface Trigger extends SyncMeta {
  label: string
  category?: TriggerCategory | null
  subtype?: OcdSubtype | null
  baselineAnxiety?: Anxiety | null
  ladderRank?: number | null
  status: TriggerStatus
  /** "overcome fear of X *so that I can* Y" — shown at bail-out moments. */
  goalStatement?: string | null
  graduatedAt?: string | null
  notes?: string | null
}

export interface TriggerStatusEvent extends SyncMeta {
  triggerId: string
  fromStatus?: TriggerStatus | null
  toStatus: TriggerStatus
  occurredAt: string
  note?: string | null
}

export interface Obsession extends SyncMeta {
  triggerId?: string | null
  /** SENSITIVE: intrusive thought content. Stored plainly in v1 by decision. */
  content: string
}

export interface Compulsion extends SyncMeta {
  triggerId?: string | null
  label: string
  form: CompulsionForm
  baselineDurationSeconds?: number | null
  baselineFrequencyPerDay?: number | null
  isActive: boolean
}

export interface CycleLog extends SyncMeta {
  occurredAt: string
  triggerId?: string | null
  triggerText?: string | null
  obsessionText?: string | null
  compulsionId?: string | null
  compulsionText?: string | null
  emotions: string[]
  sensations: string[]
  anxiety?: Anxiety | null
  notes?: string | null
}

/** Global seed content, not user data — no sync bookkeeping needed. */
export interface ExposurePrompt {
  id: string
  text: string
  category?: string
  difficulty?: number
  subtypeTags: OcdSubtype[]
  isActive: boolean
}

export interface ExposureSession extends SyncMeta {
  triggerId?: string | null
  promptId?: string | null
  kind: ExposureKind
  plannedFor?: string | null
  startedAt: string
  endedAt?: string | null
  /**
   * Expectancy violation. The active ingredient in modern ERP is a prediction
   * being disconfirmed, not anxiety decaying. Captured before the exposure so
   * it cannot be quietly revised into something less wrong afterwards.
   */
  predictedAnxiety?: Anxiety | null
  predictedOutcome?: string | null
  actualOutcome?: string | null
  anxietyBefore?: Anxiety | null
  anxietyPeak?: Anxiety | null
  anxietyAfter?: Anxiety | null
  compulsionId?: string | null
  responsePrevented?: boolean | null
  notes?: string | null
}

/**
 * Unifies the book's three separate compulsion exercises — slowing down,
 * delaying, and shortening — as optional dimensions of one event.
 */
export interface CompulsionEvent extends SyncMeta {
  compulsionId: string
  triggerId?: string | null
  occurredAt: string
  urgeIntensity?: Anxiety | null
  delayTargetSeconds?: number | null
  delayAchievedSeconds?: number | null
  durationSeconds?: number | null
  /** Snapshotted per event so re-measuring a baseline can't rewrite history. */
  baselineDurationSeconds?: number | null
  mindfulSlowdown: boolean
  resisted: boolean
  notes?: string | null
}

/** The values ledger: life got back, never "tasks completed". */
export interface ReclaimedAction extends SyncMeta {
  occurredAt: string
  description: string
  triggerId?: string | null
  exposureSessionId?: string | null
  valueIds: string[]
}

/**
 * Over-use detection. High engagement is a safety alarm for this product, so
 * this exists from day one rather than being retrofitted.
 */
export interface UsageEvent {
  id: string
  userId: string
  occurredAt: string
  eventType: 'view' | 'edit' | 'session_start' | 'session_end'
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  syncedAt?: string | null
}
