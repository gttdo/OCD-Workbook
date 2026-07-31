import type { SyncState } from '@/lib/useSync'

/**
 * Quiet by design. Sync state is plumbing; the only case worth a person's
 * attention is "this work exists in one place and could be lost".
 */
export function SyncNotice({ state }: { state: SyncState }) {
  if (state.kind === 'syncing' || state.kind === 'synced') return null

  const message =
    state.kind === 'local-only'
      ? 'Your work stays on this device.'
      : state.kind === 'signed-out'
        ? state.pending > 0
          ? `${state.pending} ${state.pending === 1 ? 'entry is' : 'entries are'} saved on this device only. Adding an email keeps a backup.`
          : 'Your work stays on this device. Adding an email keeps a backup.'
        : 'Backup is not up to date. Your work is safe on this device and will catch up.'

  return (
    <p className="mt-10 rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-500">
      {message}
    </p>
  )
}
