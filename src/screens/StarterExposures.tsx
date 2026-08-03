import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, nowIso, stamp } from '@/db'
import type { Anxiety, ExposurePrompt } from '@/db/types'
import { currentUserId } from '@/lib/session'
import { STARTER_CATEGORIES, STARTER_EXPOSURES } from '@/data/starterExposures'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'
import { AnxietyScale } from '@/components/AnxietyScale'
import { Button } from '@/components/ui/Button'

/**
 * Starter exposures.
 *
 * The person chooses; nothing here picks for them. The session row is written
 * when they start, not when they finish, so an exposure abandoned halfway —
 * or an app closed mid-way through one — is not silently lost.
 *
 * Note what is deliberately absent from the active screen: any breathing,
 * grounding or calming tool. Anxiety reduction during an exposure becomes a
 * safety behaviour and blocks the learning the exposure exists to produce.
 */
export function StarterExposures() {
  const [category, setCategory] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [ownText, setOwnText] = useState('')

  const done = useLiveQuery(
    () =>
      db.exposureSessions
        .filter((s) => !s.deletedAt && s.kind === 'uncertainty_starter')
        .toArray(),
    [],
    [],
  )

  const donePromptIds = useMemo(
    () => new Set(done.filter((s) => s.endedAt).map((s) => s.promptId)),
    [done],
  )

  const visible = category
    ? STARTER_EXPOSURES.filter((p) => p.category === category)
    : STARTER_EXPOSURES

  if (activeId) {
    return (
      <ActiveExposure
        sessionId={activeId}
        onDone={() => setActiveId(null)}
      />
    )
  }

  async function begin(prompt: ExposurePrompt | null, text?: string) {
    const row = stamp(currentUserId(), {
      promptId: prompt?.id ?? null,
      kind: 'uncertainty_starter' as const,
      startedAt: nowIso(),
      notes: prompt ? null : (text?.trim() ?? null),
    })
    await db.exposureSessions.add(row)
    setActiveId(row.id)
    setOwnText('')
  }

  return (
    <Screen
      title="Small experiments"
      intro="Not from your ladder. These are practice at letting something stay unresolved."
    >
      <div className="space-y-6">
        <Teach id="starter" title="Why bother with the small ones">
          <p>
            Every one of these practises the same thing your ladder will ask for
            later: leaving a question open and finding out that nothing happens.
          </p>
          <p>
            They are meant to be mildly uncomfortable, not distressing. If one
            of these frightens you badly, it belongs on your ladder instead.
          </p>
        </Teach>

        {done.filter((s) => s.endedAt).length > 0 && (
          <p className="text-sm text-ink-500">
            You have finished {done.filter((s) => s.endedAt).length} of these.
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={category === null}
            onClick={() => setCategory(null)}
          >
            All
          </FilterChip>
          {STARTER_CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              active={category === c}
              onClick={() => setCategory(c)}
            >
              {c}
            </FilterChip>
          ))}
        </div>

        <ul className="space-y-2">
          {visible.map((p) => {
            const alreadyDone = donePromptIds.has(p.id)
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => void begin(p)}
                  className="tap flex w-full items-center gap-3 rounded-xl border border-ink-200
                             bg-white p-4 text-left active:bg-ink-50"
                >
                  <span className="flex-1 text-[15px] text-ink-800">
                    {p.text}
                  </span>
                  {alreadyDone && (
                    <span
                      className="flex-none text-xs text-calm-700"
                      title="You have done this one before"
                    >
                      done before
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>

        <div className="space-y-2 border-t border-ink-200 pt-6">
          <label
            htmlFor="own-exposure"
            className="block text-sm font-medium text-ink-700"
          >
            Or something of your own
          </label>
          <input
            id="own-exposure"
            value={ownText}
            onChange={(e) => setOwnText(e.target.value)}
            placeholder="Leave the last email of the day unsent until morning"
            className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                       placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
          />
          <Button
            full
            variant="secondary"
            disabled={ownText.trim().length === 0}
            onClick={() => void begin(null, ownText)}
          >
            Start that one
          </Button>
        </div>
      </div>
    </Screen>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        'tap rounded-full border px-3 py-1.5 text-sm transition-colors',
        active
          ? 'border-ink-800 bg-ink-800 text-white'
          : 'border-ink-200 text-ink-600 active:bg-ink-50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

/** In progress, then reflecting. Rendered without nav chrome by the shell. */
function ActiveExposure({
  sessionId,
  onDone,
}: {
  sessionId: string
  onDone: () => void
}) {
  const session = useLiveQuery(
    () => db.exposureSessions.get(sessionId),
    [sessionId],
    undefined,
  )
  const [phase, setPhase] = useState<'doing' | 'reflecting'>('doing')
  const [peak, setPeak] = useState<Anxiety | null>(null)
  const [skipRating, setSkipRating] = useState(false)
  const [note, setNote] = useState('')

  const promptText =
    STARTER_EXPOSURES.find((p) => p.id === session?.promptId)?.text ??
    session?.notes ??
    ''

  async function finish() {
    await db.exposureSessions.update(sessionId, {
      endedAt: nowIso(),
      anxietyPeak: skipRating ? null : peak,
      notes: note.trim() || session?.notes || null,
      updatedAt: nowIso(),
      syncedAt: null,
    })
    onDone()
  }

  async function abandon() {
    // Not a failure and not deleted — an unfinished attempt is still data, and
    // quietly erasing it would teach that stopping is something to hide.
    await db.exposureSessions.update(sessionId, {
      updatedAt: nowIso(),
      syncedAt: null,
    })
    onDone()
  }

  if (session === undefined) return null

  if (phase === 'doing') {
    return (
      <Screen>
        <div className="space-y-6">
          <div>
            <div className="text-sm text-ink-500">Right now</div>
            <h1 className="mt-1 text-2xl font-semibold leading-snug text-ink-900">
              {promptText}
            </h1>
          </div>

          <p className="text-[15px] leading-relaxed text-ink-600">
            Go and do it. Come back when you have, or when you have decided not
            to. Nothing is being timed.
          </p>

          <div className="space-y-3 pt-2">
            <Button full onClick={() => setPhase('reflecting')}>
              I did it
            </Button>
            <Button full variant="secondary" onClick={() => void abandon()}>
              Not this time
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-ink-400">
            Stopping is allowed and it is not a failure. It stays on the record
            as an attempt, because it was one.
          </p>
        </div>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold leading-snug text-ink-900">
            You did it.
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
            {promptText}
          </p>
        </div>

        {/*
          Ratings are genuinely optional. Over-precise distress scoring is named
          by ERP clinicians as a compulsion in its own right, and for some people
          the right advice is to skip measurement altogether.
        */}
        <div className="rounded-xl border border-ink-200 bg-white p-4">
          {skipRating ? (
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink-500">
                Not rating this one.
              </span>
              <button
                type="button"
                onClick={() => setSkipRating(false)}
                className="tap text-sm text-ink-500 underline decoration-ink-300
                           underline-offset-4 active:text-ink-800"
              >
                Undo
              </button>
            </div>
          ) : (
            <>
              <AnxietyScale
                label="How high did it get?"
                value={peak}
                onChange={setPeak}
                inExposure
              />
              <button
                type="button"
                onClick={() => {
                  setPeak(null)
                  setSkipRating(true)
                }}
                className="tap mt-3 text-sm text-ink-400 underline decoration-ink-300
                           underline-offset-4 active:text-ink-700"
              >
                I would rather not rate this
              </button>
            </>
          )}
        </div>

        <div>
          <label
            htmlFor="reflect-note"
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            What actually happened?{' '}
            <span className="font-normal text-ink-400">Optional</span>
          </label>
          <textarea
            id="reflect-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Nothing. I forgot about it by lunchtime."
            className="w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                       placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
          />
        </div>

        <Button full onClick={() => void finish()}>
          Save
        </Button>
      </div>
    </Screen>
  )
}
