import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, nowIso } from '@/db'
import type { Trigger } from '@/db/types'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'
import { Button } from '@/components/ui/Button'
import { unretire } from '@/lib/graduation'

/**
 * The ladder.
 *
 * Structured around one question: what do I do now. An earlier version showed
 * a flat list with reorder arrows on every row and hid the actual action —
 * "work on this one" — behind a tap with nothing to suggest tapping. It read
 * as an inventory rather than a place to act, and people could not tell what
 * was being asked of them.
 *
 * So: one rung is in focus with the action on it, the rest are quiet and one
 * tap away, and reordering is a mode you enter rather than chrome you wade
 * through. Which rung is in focus is a default, not an instruction — any of
 * them can be picked up at any time, and the copy says so.
 */
export function FearLadder() {
  const all = useLiveQuery(
    () => db.triggers.filter((t) => !t.deletedAt).toArray(),
    [],
    [],
  )
  const sessions = useLiveQuery(
    () => db.exposureSessions.filter((s) => !s.deletedAt && !!s.endedAt).toArray(),
    [],
    [],
  )

  const [reordering, setReordering] = useState(false)
  const [focusId, setFocusId] = useState<string | null>(null)

  const active = [...all.filter((t) => t.status !== 'graduated')].sort((a, b) => {
    const ar = a.ladderRank, br = b.ladderRank
    if (ar != null && br != null) return ar - br
    if (ar != null) return -1
    if (br != null) return 1
    const byAnxiety = (a.baselineAnxiety ?? 0) - (b.baselineAnxiety ?? 0)
    return byAnxiety !== 0 ? byAnxiety : a.createdAt.localeCompare(b.createdAt)
  })

  const retired = all
    .filter((t) => t.status === 'graduated')
    .sort((a, b) => (b.graduatedAt ?? '').localeCompare(a.graduatedAt ?? ''))

  const sessionCount = (id: string) =>
    sessions.filter((s) => s.triggerId === id).length

  // A default, not a directive: the easiest rung not yet retired.
  const focus = active.find((t) => t.id === focusId) ?? active[0] ?? null
  const rest = active.filter((t) => t.id !== focus?.id)

  async function persist(list: Trigger[]) {
    const ts = nowIso()
    await db.triggers.bulkPut(
      list.map((t, i) => ({
        ...t,
        ladderRank: i,
        status: t.status === 'identified' ? ('laddered' as const) : t.status,
        updatedAt: ts,
        syncedAt: null,
      })),
    )
  }

  async function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= active.length) return
    const next = [...active]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    await persist(next)
  }

  async function setGoal(id: string, goalStatement: string) {
    await db.triggers.update(id, {
      goalStatement: goalStatement.trim() || null,
      updatedAt: nowIso(),
      syncedAt: null,
    })
  }

  if (all.length === 0) {
    return (
      <Screen title="Your ladder">
        <div className="space-y-4">
          <p className="rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
            Your ladder is the list of things you avoid, ordered from easiest to
            hardest. You work through it one at a time.
          </p>
          <Link
            to="/avoidance"
            className="tap block w-full rounded-xl bg-ink-900 px-4 py-3 text-center
                       font-medium text-white active:bg-ink-800"
          >
            List what you avoid
          </Link>
        </div>
      </Screen>
    )
  }

  if (active.length === 0) {
    return (
      <Screen title="Your ladder">
        <div className="space-y-6">
          <p className="rounded-xl border border-calm-600 bg-calm-50 p-4 text-[15px] leading-relaxed text-ink-800">
            Nothing left on the ladder — everything you listed is retired. If
            something new comes up, or one of these returns, you can add it back
            any time.
          </p>
          <Link
            to="/avoidance"
            className="tap block text-sm text-ink-500 underline decoration-ink-300 underline-offset-4"
          >
            Add something you avoid
          </Link>
          <Retired triggers={retired} />
        </div>
      </Screen>
    )
  }

  if (reordering) {
    return (
      <Screen title="Put them in order">
        <div className="space-y-6">
          <p className="text-[15px] leading-relaxed text-ink-600">
            Easiest at the top. We ordered these by the ratings you gave, but
            only you know what a 6 actually feels like — move anything that
            feels wrong.
          </p>

          <ol className="space-y-2">
            {active.map((t, i) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3"
              >
                <span className="flex-1 text-[15px] text-ink-800">{t.label}</span>
                <span className="flex-none text-xs text-ink-400">
                  {t.baselineAnxiety ?? '–'}/10
                </span>
                <div className="flex flex-none flex-col">
                  <button
                    type="button"
                    onClick={() => void move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move ${t.label} earlier`}
                    className="tap px-2 text-ink-400 disabled:opacity-20 active:text-ink-800"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => void move(i, 1)}
                    disabled={i === active.length - 1}
                    aria-label={`Move ${t.label} later`}
                    className="tap px-2 text-ink-400 disabled:opacity-20 active:text-ink-800"
                  >
                    ↓
                  </button>
                </div>
              </li>
            ))}
          </ol>

          <Button full onClick={() => setReordering(false)}>
            Done
          </Button>
        </div>
      </Screen>
    )
  }

  const done = focus ? sessionCount(focus.id) : 0

  return (
    <Screen title="Your ladder">
      <div className="space-y-6">
        <Teach id="ladder-what" title="What you do here">
          <p>
            Pick one thing and face it on purpose, without doing the compulsion
            that usually follows. Afterwards you record what actually happened.
          </p>
          <p>
            Most people repeat the same one several times before it starts to
            feel boring. Boring is the goal — it means the fear has stopped
            paying out.
          </p>
        </Teach>

        {focus && (
          <section>
            <h2 className="mb-2 text-sm font-medium text-ink-500">
              Working on now
            </h2>
            <div className="rounded-xl border border-ink-300 bg-white p-4">
              <div className="text-lg font-medium leading-snug text-ink-900">
                {focus.label}
              </div>

              <p className="mt-1 text-sm text-ink-500">
                {focus.baselineAnxiety != null &&
                  `You rated this ${focus.baselineAnxiety} out of 10`}
                {done > 0 &&
                  ` · ${done} ${done === 1 ? 'exposure' : 'exposures'} so far`}
              </p>


              <Link
                to={`/exposure/${focus.id}`}
                className="tap mt-4 block w-full rounded-xl bg-ink-900 px-4 py-3
                           text-center font-medium text-white active:bg-ink-800"
              >
                {done > 0 ? 'Do this one again' : 'Do an exposure'}
              </Link>

              {/*
                Shown as prose once written, editable on request. Rendering the
                statement and its input together showed the same sentence twice.
              */}
              <GoalField
                key={focus.id}
                initial={focus.goalStatement ?? ''}
                onSave={(v) => void setGoal(focus.id, v)}
              />
            </div>
          </section>
        )}

        {rest.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-medium text-ink-500">
              The rest of your list
            </h2>
            <p className="mb-2 text-sm leading-relaxed text-ink-500">
              Roughly in order of difficulty. Tap any of them to work on that
              one instead — you decide when to move on.
            </p>
            <ul className="space-y-2">
              {rest.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => setFocusId(t.id)}
                    className="tap flex w-full items-center gap-3 rounded-xl border
                               border-ink-200 bg-white p-3 text-left active:bg-ink-50"
                  >
                    <span className="flex-1 text-[15px] text-ink-700">
                      {t.label}
                    </span>
                    <span className="flex-none text-xs text-ink-400">
                      {t.baselineAnxiety ?? '–'}/10
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-ink-200 pt-6">
          <Link
            to="/avoidance"
            className="tap text-sm text-ink-500 underline decoration-ink-300 underline-offset-4 active:text-ink-800"
          >
            Add something you avoid
          </Link>
          {active.length > 1 && (
            <button
              type="button"
              onClick={() => setReordering(true)}
              className="tap text-sm text-ink-500 underline decoration-ink-300 underline-offset-4 active:text-ink-800"
            >
              Change the order
            </button>
          )}
        </div>

        {retired.length > 0 && <Retired triggers={retired} />}
      </div>
    </Screen>
  )
}

/**
 * Fears that are done.
 *
 * Kept visible rather than deleted: this is the only accumulating thing in the
 * app, and it accumulates finished work rather than consecutive days. Bringing
 * one back is offered plainly, because a fear returning is expected in this
 * work and should not feel like undoing an achievement.
 */
function Retired({ triggers }: { triggers: Trigger[] }) {
  return (
    <section className="border-t border-ink-200 pt-6">
      <h2 className="text-sm font-medium text-ink-500">
        Retired ({triggers.length})
      </h2>
      <ul className="mt-2 space-y-2">
        {triggers.map((t) => (
          <li key={t.id} className="rounded-xl border border-ink-200 bg-white p-3">
            <div className="text-[15px] text-ink-800">{t.label}</div>
            {t.graduatedAt && (
              <div className="mt-0.5 text-xs text-ink-400">
                since {new Date(t.graduatedAt).toLocaleDateString()}
              </div>
            )}
            <button
              type="button"
              onClick={() => void unretire(t.id)}
              className="tap mt-2 text-sm text-ink-400 underline decoration-ink-300
                         underline-offset-4 active:text-ink-700"
            >
              This one is back
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** The motivation, in the person's own words — shown later at bail-out moments. */
function GoalField({
  initial,
  onSave,
}: {
  initial: string
  onSave: (value: string) => void
}) {
  const [value, setValue] = useState(initial)
  const [editing, setEditing] = useState(initial.trim().length === 0)

  // Saved on every keystroke, not on blur. Blur does not reliably fire when
  // someone taps the bottom nav or hits back on a phone, and silently losing
  // what a person just wrote about why this matters to them is the worst
  // possible small bug in this app.
  function update(next: string) {
    setValue(next)
    onSave(next)
  }

  if (!editing) {
    return (
      <div className="mt-4 border-t border-ink-100 pt-3">
        <p className="text-sm italic leading-relaxed text-ink-600">
          so I can {value}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="tap mt-1 text-xs text-ink-400 underline decoration-ink-300
                     underline-offset-4 active:text-ink-700"
        >
          Change this
        </button>
      </div>
    )
  }

  return (
    <div className="mt-4 border-t border-ink-100 pt-3">
      <label className="mb-1.5 block text-sm text-ink-600">
        I want to get past this so I can…
      </label>
      <input
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="use a bathroom away from home"
        className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                   placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
      />
      <p className="mt-1.5 text-xs text-ink-400">
        We will show you this when it gets hard.
      </p>
    </div>
  )
}
