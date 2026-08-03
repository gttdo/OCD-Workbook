import type { SyncState } from '@/lib/useSync'

/**
 * Quiet by design. Sync state is plumbing — a person mid-exposure does not need
 * a spinner about network conditions, and an alarming error at the wrong moment
 * is worse than a silent retry.
 *
 * There is no signed-out case any more: the app is behind auth, so nobody
 * without a session ever reaches a screen that renders this.
 */
export function SyncNotice({ state }: { state: SyncState }) {
  if (state.kind === 'syncing' || state.kind === 'synced') return null
  if (state.kind === 'signed-out') return null

  return (
    <p className="mt-10 rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-500">
      {state.kind === 'local-only'
        ? 'Backup is not configured on this build, so your work stays on this device.'
        : 'Backup is not up to date. Your work is safe on this device and will catch up.'}
    </p>
  )
}
