import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, nowIso } from '@/db'
import type { Trigger } from '@/db/types'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'

/**
 * The fear ladder.
 *
 * Order is the person's, not ours. We seed it from the distress ratings they
 * already gave — least first, because that is where you start — but every
 * position is theirs to change and nothing here tells anyone what to face
 * next. That is a deliberate line: software that performs patient-specific
 * analysis and issues directives is a regulated device, and more importantly,
 * being told what to face by an app is the wrong relationship to have with
 * your own treatment.
 */
export function FearLadder() {
  const triggers = useLiveQuery(
    () =>
      db.triggers
        .filter((t) => !t.deletedAt && t.status !== 'graduated')
        .toArray(),
    [],
    [],
  )

  const [expanded, setExpanded] = useState<string | null>(null)

  // Seed from baseline distress; once ranked, rank wins. created_at breaks ties.
  const ordered = [...triggers].sort((a, b) => {
    const ar = a.ladderRank, br = b.ladderRank
    if (ar != null && br != null) return ar - br
    if (ar != null) return -1
    if (br != null) return 1
    const byAnxiety = (a.baselineAnxiety ?? 0) - (b.baselineAnxiety ?? 0)
    return byAnxiety !== 0 ? byAnxiety : a.createdAt.localeCompare(b.createdAt)
  })

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
    if (target < 0 || target >= ordered.length) return
    const next = [...ordered]
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

  if (triggers.length === 0) {
    return (
      <Screen title="Your ladder">
        <div className="space-y-4">
          <p className="rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
            Your ladder is built from the things you avoid. Once you have listed
            a few, you can put them in order here.
          </p>
          <Link
            to="/avoidance"
            className="tap block w-full rounded-xl bg-ink-900 px-4 py-3 text-center
                       font-medium text-white active:bg-ink-800"
          >
            Start the list
          </Link>
        </div>
      </Screen>
    )
  }

  return (
    <Screen
      title="Your ladder"
      intro="Least difficult first. That is where you start, and you work down the list over time."
    >
      <div className="space-y-6">
        <Teach id="ladder" title="Why order matters">
          <p>
            Working upward means each step is hard but survivable, and each one
            you get through makes the next look smaller.
          </p>
          <p>
            This is your order, not ours. We put them in the order your ratings
            suggested — move anything that feels wrong. Only you know what a 6
            actually feels like.
          </p>
        </Teach>

        <ol className="space-y-2">
          {ordered.map((t, i) => (
            <li
              key={t.id}
              className="rounded-xl border border-ink-200 bg-white p-3"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-ink-100 text-sm font-semibold tabular-nums text-ink-700">
                  {t.baselineAnxiety ?? '–'}
                </span>

                <button
                  type="button"
                  onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                  className="flex-1 text-left"
                >
                  <span className="block text-[15px] text-ink-800">
                    {t.label}
                  </span>
                  {i === 0 && (
                    <span className="mt-0.5 block text-xs text-calm-700">
                      Start here
                    </span>
                  )}
                  {t.goalStatement && (
                    <span className="mt-0.5 block text-xs italic text-ink-400">
                      so I can {t.goalStatement}
                    </span>
                  )}
                </button>

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
                    disabled={i === ordered.length - 1}
                    aria-label={`Move ${t.label} later`}
                    className="tap px-2 text-ink-400 disabled:opacity-20 active:text-ink-800"
                  >
                    ↓
                  </button>
                </div>
              </div>

              {expanded === t.id && (
                <>
                  <GoalField
                    initial={t.goalStatement ?? ''}
                    onSave={(v) => void setGoal(t.id, v)}
                  />
                  {/*
                    An offer on every rung, not just the first. Which one you
                    are ready for is your call and your therapist's, not ours.
                  */}
                  <Link
                    to={`/exposure/${t.id}`}
                    className="tap mt-3 block w-full rounded-xl bg-ink-900 px-4 py-3
                               text-center font-medium text-white active:bg-ink-800"
                  >
                    Work on this one
                  </Link>
                </>
              )}
            </li>
          ))}
        </ol>

        <Link
          to="/avoidance"
          className="tap block text-sm text-ink-400 underline decoration-ink-300 underline-offset-4 active:text-ink-700"
        >
          Add something else to the list
        </Link>
      </div>
    </Screen>
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

  // Saved on every keystroke, not on blur. Blur does not reliably fire when
  // someone taps the bottom nav or hits back on a phone, and silently losing
  // what a person just wrote about why this matters to them is the worst
  // possible small bug in this app. Local writes are cheap and the row simply
  // stays dirty until the next push.
  function update(next: string) {
    setValue(next)
    onSave(next)
  }

  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
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
