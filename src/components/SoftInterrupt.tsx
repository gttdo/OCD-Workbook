import { useEffect, useState } from 'react'
import { detectPattern, type UsagePattern } from '@/lib/usage'

/**
 * The soft interrupt.
 *
 * Named for what it must not be. It does not block, does not disable
 * anything, and never says a version of "you are doing this wrong" — being
 * told off by software for a symptom of your disorder would be its own small
 * harm, and would teach people to hide the behaviour rather than notice it.
 *
 * It names the pattern, offers the alternative once, and can be dismissed.
 */
export function SoftInterrupt({
  entityType,
  entityId,
  /** Bump to re-check after the user does something. */
  trigger,
}: {
  entityType: string
  entityId: string
  trigger?: number
}) {
  const [pattern, setPattern] = useState<UsagePattern | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void detectPattern(entityType, entityId).then((p) => {
      if (!cancelled) setPattern(p)
    })
    return () => {
      cancelled = true
    }
  }, [entityType, entityId, trigger])

  if (!pattern || dismissed) return null

  const body =
    pattern.kind === 'editing'
      ? 'You have changed this a few times in a short stretch. Getting the wording exactly right is usually the disorder asking, not the work — what you first wrote is almost always good enough.'
      : 'You have come back to this a few times in a short stretch. Re-reading what you wrote tends to be checking rather than working, and checking is the thing that keeps a fear fed.'

  return (
    <div className="animate-fade-up rounded-xl border border-ink-200 bg-ink-50 p-4">
      <p className="text-[15px] leading-relaxed text-ink-700">{body}</p>
      <p className="mt-2 text-sm leading-relaxed text-ink-500">
        Nothing is wrong. You can carry on if you want to.
      </p>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="tap mt-2 text-sm text-ink-500 underline decoration-ink-300
                   underline-offset-4 active:text-ink-800"
      >
        Got it
      </button>
    </div>
  )
}
