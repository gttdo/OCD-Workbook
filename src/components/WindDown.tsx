import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button } from '@/components/ui/Button'
import { buildRecord, downloadRecord, windDownState } from '@/lib/windDown'
import { saveReminder } from '@/lib/reminders'

/**
 * Winding down.
 *
 * The one place an app is supposed to help you stop using it. Offered rather
 * than announced, and framed so that coming back is expected rather than a
 * relapse into failure — because it is, and because an ending that shames the
 * return is worse than no ending at all.
 */
export function WindDown({ compact }: { compact?: boolean }) {
  const state = useLiveQuery(() => windDownState(), [], null)
  const [record, setRecord] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (!state) return null

  // Only surfaced when it is actually true — suggesting someone wind down with
  // work still in front of them would be worse than saying nothing.
  const relevant = state.allRetired || state.quiet
  if (compact && !relevant) return null

  async function makeRecord() {
    setBusy(true)
    const text = await buildRecord()
    setBusy(false)
    setRecord(text)
    downloadRecord(text)
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      {state.allRetired ? (
        <>
          <div className="font-medium text-ink-900">
            You have retired everything on your list.
          </div>
          <p className="text-[15px] leading-relaxed text-ink-700">
            That is the point at which this app has done its job. You do not
            need to keep opening it to hold onto what changed.
          </p>
        </>
      ) : state.quiet ? (
        <>
          <div className="font-medium text-ink-900">It has been a while.</div>
          <p className="text-[15px] leading-relaxed text-ink-700">
            That is not a problem. If things are steady, using this less is what
            progress looks like.
          </p>
        </>
      ) : (
        <>
          <div className="font-medium text-ink-900">Finishing up</div>
          <p className="text-[15px] leading-relaxed text-ink-700">
            Whenever you are ready to stop, you can take your record with you.
            Nothing here is worth keeping an app installed for.
          </p>
        </>
      )}

      <p className="text-sm leading-relaxed text-ink-600">
        If a fear comes back later, that is normal and it does not undo any of
        this. What worked before works again.
      </p>

      <div className="space-y-2">
        <Button full variant="secondary" disabled={busy} onClick={() => void makeRecord()}>
          {busy ? 'Putting it together…' : 'Download my record'}
        </Button>
        {relevant && (
          <button
            type="button"
            onClick={() => saveReminder(null)}
            className="tap text-sm text-ink-500 underline decoration-ink-300
                       underline-offset-4 active:text-ink-800"
          >
            Turn off practice reminders
          </button>
        )}
      </div>

      {record && (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-ink-50 p-3 text-xs leading-relaxed text-ink-600">
          {record}
        </pre>
      )}
    </div>
  )
}
