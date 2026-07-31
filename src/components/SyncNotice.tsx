import { Link } from 'react-router-dom'
import type { SyncState } from '@/lib/useSync'

/**
 * Quiet by design. Sync state is plumbing; the only case worth a person's
 * attention is "this work exists in one place and could be lost".
 *
 * When there is something to do about it, the notice is a link rather than a
 * statement — otherwise it tells someone their work is at risk and leaves them
 * to go hunting for the fix.
 */
export function SyncNotice({ state }: { state: SyncState }) {
  if (state.kind === 'syncing' || state.kind === 'synced') return null

  if (state.kind === 'signed-out') {
    const message =
      state.pending > 0
        ? `${state.pending} ${state.pending === 1 ? 'entry is' : 'entries are'} saved on this device only.`
        : 'Your work is saved on this device only.'

    return (
      <Link
        to="/signin"
        className="tap mt-10 block rounded-xl bg-ink-100 p-4 text-sm leading-relaxed
                   text-ink-500 active:bg-ink-200"
      >
        {message}{' '}
        <span className="underline decoration-ink-300 underline-offset-4">
          Keep a backup
        </span>
      </Link>
    )
  }

  return (
    <p className="mt-10 rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-500">
      {state.kind === 'local-only'
        ? 'Your work stays on this device.'
        : 'Backup is not up to date. Your work is safe on this device and will catch up.'}
    </p>
  )
}
