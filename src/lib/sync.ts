import { db } from '@/db'
import { keysToCamel, keysToSnake } from './caseMap'
import { supabase } from './supabase'

/**
 * Sync engine.
 *
 * IndexedDB is authoritative for the *user's* writes. Supabase is durable
 * storage and the bridge between devices. Nothing here is ever allowed to
 * block the UI or lose a local write: if sync fails, the record simply stays
 * dirty and is retried later.
 *
 * Conflict policy is last-write-wins on `updatedAt`. That is acceptable here
 * because this is single-user data — the realistic conflict is the same person
 * on a phone and a laptop, not concurrent editors.
 */

interface TableSpec {
  /** Dexie store name. */
  local: keyof typeof db & string
  /** Postgres table name. */
  remote: string
  /** Append-only tables are never updated, so they push but do not pull. */
  appendOnly?: boolean
  /**
   * Which column carries ownership remotely. Everything is `user_id` except
   * `profile`, which is keyed by the auth user id itself and has no separate
   * owner column — pushing one there fails with "column user_id does not
   * exist", and filtering a pull by it fails the same way.
   */
  ownerColumn?: 'user_id' | 'id'
  /** Local-only fields with no remote column. */
  localOnly?: string[]
}

const TABLES: TableSpec[] = [
  {
    local: 'profile',
    remote: 'profile',
    ownerColumn: 'id',
    // `profile` has neither of these remotely.
    localOnly: ['userId', 'deletedAt'],
  },
  { local: 'screenings', remote: 'screening' },
  { local: 'values', remote: 'value' },
  { local: 'commitments', remote: 'commitment' },
  { local: 'triggers', remote: 'trigger' },
  { local: 'triggerStatusEvents', remote: 'trigger_status_event' },
  { local: 'obsessions', remote: 'obsession' },
  { local: 'compulsions', remote: 'compulsion' },
  { local: 'cycleLogs', remote: 'cycle_log' },
  { local: 'exposureSessions', remote: 'exposure_session' },
  { local: 'compulsionEvents', remote: 'compulsion_event' },
  { local: 'reclaimedActions', remote: 'reclaimed_action' },
  { local: 'usageEvents', remote: 'usage_event', appendOnly: true },
]

const CURSOR_KEY = 'ocd-workbook.sync-cursor'

function getCursor(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(CURSOR_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function setCursor(table: string, iso: string): void {
  localStorage.setItem(
    CURSOR_KEY,
    JSON.stringify({ ...getCursor(), [table]: iso }),
  )
}

export interface SyncResult {
  ran: boolean
  pushed: number
  pulled: number
  errors: string[]
}

/**
 * Supabase rejects with a PostgrestError — a plain object, not an Error — so
 * `String(err)` renders it as "[object Object]". That is exactly how a real
 * schema mismatch stayed invisible on the settings screen while reporting
 * itself as a failure.
 */
function describeError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object') {
    const e = err as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }
    const parts = [e.message, e.details, e.hint, e.code && `[${e.code}]`]
      .filter(Boolean)
      .join(' — ')
    return parts || JSON.stringify(err)
  }
  return String(err)
}

let inFlight: Promise<SyncResult> | null = null

/** Serialised so overlapping triggers (focus, reconnect, timer) can't race. */
export function sync(): Promise<SyncResult> {
  if (!inFlight) {
    inFlight = runSync().finally(() => {
      inFlight = null
    })
  }
  return inFlight
}

async function runSync(): Promise<SyncResult> {
  const result: SyncResult = { ran: false, pushed: 0, pulled: 0, errors: [] }

  if (!supabase || !navigator.onLine) return result

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return result

  result.ran = true
  const userId = session.user.id

  for (const spec of TABLES) {
    try {
      result.pushed += await push(spec, userId)
      if (!spec.appendOnly) result.pulled += await pull(spec, userId)
    } catch (err) {
      result.errors.push(`${spec.remote}: ${describeError(err)}`)
    }
  }

  // Global content catalogue — pull only, no ownership.
  try {
    result.pulled += await pullPrompts()
  } catch (err) {
    result.errors.push(`exposure_prompt: ${describeError(err)}`)
  }

  return result
}

/** Upserts every locally-dirty row. Tombstones ride along as normal rows. */
async function push(spec: TableSpec, userId: string): Promise<number> {
  const table = db[spec.local] as unknown as {
    filter: (fn: (r: Record<string, unknown>) => boolean) => {
      toArray: () => Promise<Record<string, unknown>[]>
    }
    bulkPut: (rows: unknown[]) => Promise<unknown>
  }

  const dirty = await table.filter((r) => r.syncedAt == null).toArray()
  if (dirty.length === 0) return 0

  const owner = spec.ownerColumn ?? 'user_id'

  const rows = dirty.map((r) => {
    const clean: Record<string, unknown> = { ...r }
    delete clean.syncedAt
    for (const field of spec.localOnly ?? []) delete clean[field]

    if (owner === 'user_id') clean.userId = userId
    else clean.id = userId

    return keysToSnake(clean)
  })

  const { error } = await supabase!.from(spec.remote).upsert(rows, {
    onConflict: 'id',
  })
  if (error) throw error

  const syncedAt = new Date().toISOString()
  await table.bulkPut(dirty.map((r) => ({ ...r, userId, syncedAt })))

  return dirty.length
}

/**
 * Pulls rows changed since our cursor. Local edits that are still dirty always
 * win — a pending write must never be clobbered by a stale server copy.
 */
async function pull(spec: TableSpec, userId: string): Promise<number> {
  const since = getCursor()[spec.remote] ?? '1970-01-01T00:00:00Z'
  const owner = spec.ownerColumn ?? 'user_id'

  const { data, error } = await supabase!
    .from(spec.remote)
    .select('*')
    .eq(owner, userId)
    .gt('updated_at', since)
    .order('updated_at', { ascending: true })
    .limit(1000)

  if (error) throw error
  if (!data || data.length === 0) return 0

  const table = db[spec.local] as unknown as {
    get: (id: string) => Promise<Record<string, unknown> | undefined>
    bulkPut: (rows: unknown[]) => Promise<unknown>
  }

  const toWrite: Record<string, unknown>[] = []
  let newest = since

  for (const raw of data) {
    const remote = keysToCamel(raw as Record<string, unknown>)
    // `profile` has no remote owner column, but the local model carries one.
    if (owner === 'id') remote.userId = userId
    const id = remote.id as string
    const remoteUpdated = remote.updatedAt as string
    if (remoteUpdated > newest) newest = remoteUpdated

    const local = await table.get(id)

    // A dirty local row has an unpushed edit; leave it alone and let the next
    // push resolve it.
    if (local && local.syncedAt == null) continue

    if (!local || (local.updatedAt as string) < remoteUpdated) {
      toWrite.push({ ...remote, syncedAt: new Date().toISOString() })
    }
  }

  if (toWrite.length > 0) await table.bulkPut(toWrite)
  setCursor(spec.remote, newest)

  return toWrite.length
}

async function pullPrompts(): Promise<number> {
  const { data, error } = await supabase!
    .from('exposure_prompt')
    .select('*')
    .eq('is_active', true)

  if (error) throw error
  if (!data || data.length === 0) return 0

  await db.exposurePrompts.bulkPut(
    data.map((r) => keysToCamel(r as Record<string, unknown>)) as never[],
  )
  return data.length
}

/**
 * Sync on the events that actually matter: coming back online, and returning
 * to the app. Deliberately not on an interval — a background poll would drain
 * battery for a single-user dataset that changes a few times a day.
 */
export function startSync(): () => void {
  const run = () => void sync()

  run()
  window.addEventListener('online', run)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run()
  })

  return () => {
    window.removeEventListener('online', run)
  }
}
