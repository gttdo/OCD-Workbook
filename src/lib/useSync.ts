import { useEffect, useState } from 'react'
import { db } from '@/db'
import { isSupabaseConfigured } from './supabase'
import { startSync, sync, type SyncResult } from './sync'

export type SyncState =
  | { kind: 'local-only' }
  | { kind: 'signed-out'; pending: number }
  | { kind: 'syncing' }
  | { kind: 'synced'; at: string }
  | { kind: 'error'; message: string }

/**
 * Sync status, phrased for a person rather than a developer.
 *
 * This is deliberately quiet. A person mid-exposure does not need a spinner
 * telling them about network state, and an alarming sync error at the wrong
 * moment is worse than a silent retry.
 */
export function useSync(signedIn: boolean) {
  const [state, setState] = useState<SyncState>({ kind: 'local-only' })

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setState({ kind: 'local-only' })
      return
    }

    if (!signedIn) {
      void countPending().then((pending) =>
        setState({ kind: 'signed-out', pending }),
      )
      return
    }

    setState({ kind: 'syncing' })
    const stop = startSync()

    void sync().then((r: SyncResult) => {
      if (!r.ran) return
      setState(
        r.errors.length > 0
          ? { kind: 'error', message: r.errors[0]! }
          : { kind: 'synced', at: new Date().toISOString() },
      )
    })

    return stop
  }, [signedIn])

  return state
}

/** How much work is sitting on this device only. */
async function countPending(): Promise<number> {
  const counts = await Promise.all([
    db.screenings.filter((r) => r.syncedAt == null).count(),
    db.triggers.filter((r) => r.syncedAt == null).count(),
    db.exposureSessions.filter((r) => r.syncedAt == null).count(),
    db.compulsionEvents.filter((r) => r.syncedAt == null).count(),
    db.cycleLogs.filter((r) => r.syncedAt == null).count(),
  ])
  return counts.reduce((a, b) => a + b, 0)
}
