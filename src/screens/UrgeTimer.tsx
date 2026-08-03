import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, nowIso, stamp } from '@/db'
import type { Anxiety, Compulsion } from '@/db/types'
import { currentUserId } from '@/lib/session'
import { formatClock, useElapsedSeconds } from '@/lib/useElapsed'
import { CountdownRing } from '@/components/CountdownRing'
import { formatDuration } from '@/lib/behaviour'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'
import { AnxietyScale } from '@/components/AnxietyScale'
import { Button } from '@/components/ui/Button'

/**
 * The compulsion timer.
 *
 * One tool covering what the source workbook splits into three separate
 * exercises — delaying a compulsion, slowing it down, and shortening it. They
 * are the same event with different optional dimensions, so they are one
 * screen and one row rather than three of each.
 *
 * This is also the only thing that can populate "time reclaimed", which is the
 * metric that leads the dashboard early on precisely because it moves straight
 * away, while the distress curve often rises before it falls.
 */
type Phase = 'pick' | 'method' | 'delaying' | 'doing' | 'done'

const DELAY_OPTIONS = [1, 5, 10, 20, 30]

export function UrgeTimer() {
  const navigate = useNavigate()
  const compulsions = useLiveQuery(
    () => db.compulsions.filter((c) => !c.deletedAt && c.isActive).toArray(),
    [],
    [],
  )

  const [phase, setPhase] = useState<Phase>('pick')
  const [chosen, setChosen] = useState<Compulsion | null>(null)
  const [newLabel, setNewLabel] = useState('')
  const [baselineMinutes, setBaselineMinutes] = useState('')
  const [urge, setUrge] = useState<Anxiety | null>(null)

  const [eventId, setEventId] = useState<string | null>(null)
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [delayTarget, setDelayTarget] = useState(10)
  const [summary, setSummary] = useState<{
    reclaimed: number
    resisted: boolean
    delayed: number
  } | null>(null)

  const elapsed = useElapsedSeconds(startedAt)

  async function chooseExisting(c: Compulsion) {
    setChosen(c)
    setPhase('method')
  }

  async function createAndChoose() {
    const minutes = Number(baselineMinutes)
    const row = stamp(currentUserId(), {
      label: newLabel.trim(),
      form: 'behavioral' as const,
      baselineDurationSeconds:
        Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : null,
      isActive: true,
    })
    await db.compulsions.add(row)
    setChosen(row as Compulsion)
    setNewLabel('')
    setBaselineMinutes('')
    setPhase('method')
  }

  async function saveBaseline() {
    if (!chosen) return
    const seconds = Math.round(Number(baselineMinutes) * 60)
    await db.compulsions.update(chosen.id, {
      baselineDurationSeconds: seconds,
      updatedAt: nowIso(),
      syncedAt: null,
    })
    setChosen({ ...chosen, baselineDurationSeconds: seconds })
    setBaselineMinutes('')
  }

  /** Written at the start so an abandoned attempt is still on the record. */
  async function openEvent(extra: Record<string, unknown>) {
    const now = nowIso()
    const row = stamp(currentUserId(), {
      compulsionId: chosen!.id,
      triggerId: chosen!.triggerId ?? null,
      occurredAt: now,
      urgeIntensity: urge,
      baselineDurationSeconds: chosen!.baselineDurationSeconds ?? null,
      mindfulSlowdown: false,
      resisted: false,
      ...extra,
    })
    await db.compulsionEvents.add(row)
    setEventId(row.id)
    setStartedAt(now)
    return row.id
  }

  /**
   * `id` may be passed explicitly. Opening and finishing an event in the same
   * tick — which is exactly what "skip it entirely" does — would otherwise read
   * a state value that React has not committed yet, silently leaving the row
   * open and the screen stuck.
   */
  async function finish(patch: Record<string, unknown>, id?: string) {
    const target = id ?? eventId
    if (!target) return
    await db.compulsionEvents.update(target, {
      ...patch,
      updatedAt: nowIso(),
      syncedAt: null,
    })
    const saved = await db.compulsionEvents.get(target)
    const baseline = saved?.baselineDurationSeconds ?? 0
    const spent = saved?.resisted ? 0 : (saved?.durationSeconds ?? 0)
    setSummary({
      reclaimed: Math.max(baseline - spent, 0),
      resisted: Boolean(saved?.resisted),
      delayed: saved?.delayAchievedSeconds ?? 0,
    })
    setStartedAt(null)
    setPhase('done')
  }

  // ── pick which compulsion ─────────────────────────────────────────────────
  if (phase === 'pick') {
    return (
      <Screen
        title="An urge just hit"
        intro="Which one is it? Nothing here judges what you choose to do next."
      >
        <div className="space-y-6">
          <Teach id="urge" title="Why delaying counts">
            <p>
              You do not have to win outright. Putting a compulsion off, doing
              it more slowly, or stopping it sooner all weaken the link between
              the urge and the act.
            </p>
            <p>
              Every minute you hold off is a minute the urge gets to fall on its
              own, without you doing anything to make it.
            </p>
          </Teach>

          {compulsions.length > 0 && (
            <ul className="space-y-2">
              {compulsions.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => void chooseExisting(c)}
                    className="tap flex w-full items-center justify-between gap-3 rounded-xl
                               border border-ink-200 bg-white p-4 text-left active:bg-ink-50"
                  >
                    <span className="text-[15px] text-ink-800">{c.label}</span>
                    {c.baselineDurationSeconds ? (
                      <span className="text-xs text-ink-400">
                        usually {formatDuration(c.baselineDurationSeconds)}
                      </span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-3 border-t border-ink-200 pt-6">
            <label
              htmlFor="new-compulsion"
              className="block text-sm font-medium text-ink-700"
            >
              Something else
            </label>
            <input
              id="new-compulsion"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Checking the front door"
              className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                         placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
            />
            <label
              htmlFor="baseline"
              className="block text-sm font-medium text-ink-700"
            >
              Roughly how long does it usually take?{' '}
              <span className="font-normal text-ink-400">Minutes</span>
            </label>
            <input
              id="baseline"
              inputMode="numeric"
              value={baselineMinutes}
              onChange={(e) =>
                setBaselineMinutes(e.target.value.replace(/[^0-9]/g, ''))
              }
              placeholder="10"
              className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                         placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
            />
            <p className="text-xs leading-relaxed text-ink-400">
              A rough guess is fine. It is only used to show you what you get
              back later.
            </p>
            <Button
              full
              variant="secondary"
              disabled={newLabel.trim().length === 0}
              onClick={() => void createAndChoose()}
            >
              Use this one
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  // ── choose an approach ────────────────────────────────────────────────────
  if (phase === 'method') {
    return (
      <Screen>
        <div className="space-y-6">
          <div>
            <div className="text-sm text-ink-500">The urge</div>
            <h1 className="mt-1 text-2xl font-semibold leading-snug text-ink-900">
              {chosen?.label}
            </h1>
          </div>

          <div className="rounded-xl border border-ink-200 bg-white p-4">
            <AnxietyScale
              label="How strong is it right now?"
              value={urge}
              onChange={setUrge}
            />
          </div>

          {/*
            Compulsions created during an ERP session never carry a baseline,
            because that flow has no reason to ask. Without one, every event
            for this compulsion silently reclaims zero time. Ask once, here.
          */}
          {chosen && chosen.baselineDurationSeconds == null && (
            <div className="space-y-2 rounded-xl border border-ink-200 bg-white p-4">
              <label
                htmlFor="set-baseline"
                className="block text-sm font-medium text-ink-700"
              >
                Roughly how long does this usually take?
              </label>
              <input
                id="set-baseline"
                inputMode="numeric"
                value={baselineMinutes}
                onChange={(e) =>
                  setBaselineMinutes(e.target.value.replace(/[^0-9]/g, ''))
                }
                placeholder="10"
                className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                           placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
              />
              <p className="text-xs leading-relaxed text-ink-400">
                Minutes, roughly. Without it we cannot show you what you get
                back — you can skip it and still use the timer.
              </p>
              <Button
                full
                variant="secondary"
                disabled={!Number(baselineMinutes)}
                onClick={() => void saveBaseline()}
              >
                Save
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <div className="mb-2 text-sm font-medium text-ink-700">
                Hold off for
              </div>
              <div className="flex flex-wrap gap-2">
                {DELAY_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDelayTarget(m)}
                    aria-pressed={delayTarget === m}
                    className={[
                      'tap rounded-full border px-3 py-1.5 text-sm transition-colors',
                      delayTarget === m
                        ? 'border-ink-800 bg-ink-800 text-white'
                        : 'border-ink-200 text-ink-600 active:bg-ink-50',
                    ].join(' ')}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            <Button
              full
              onClick={async () => {
                await openEvent({ delayTargetSeconds: delayTarget * 60 })
                setPhase('delaying')
              }}
            >
              Start waiting
            </Button>

            <Button
              full
              variant="secondary"
              onClick={async () => {
                await openEvent({ mindfulSlowdown: true })
                setPhase('doing')
              }}
            >
              Do it, but slower and shorter
            </Button>

            <Button
              full
              variant="secondary"
              onClick={async () => {
                const id = await openEvent({})
                await finish({ resisted: true, durationSeconds: 0 }, id)
              }}
            >
              Skip it entirely
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  // ── waiting it out ────────────────────────────────────────────────────────
  if (phase === 'delaying') {
    const target = delayTarget * 60

    return (
      <Screen>
        <div className="space-y-6 text-center">
          <div className="text-sm text-ink-500">Holding off on</div>
          <h1 className="text-xl font-semibold text-ink-900">{chosen?.label}</h1>

          <div className="py-4">
            <CountdownRing elapsed={elapsed} target={target} />
          </div>

          <p className="text-[15px] leading-relaxed text-ink-600">
            The urge will drop by itself if you leave it alone. You do not have
            to do anything to make that happen.
          </p>

          <div className="space-y-3 text-left">
            <Button
              full
              onClick={() =>
                void finish({
                  delayAchievedSeconds: elapsed,
                  resisted: true,
                  durationSeconds: 0,
                })
              }
            >
              The urge passed
            </Button>
            <Button
              full
              variant="secondary"
              onClick={() =>
                void finish({
                  delayAchievedSeconds: elapsed,
                  resisted: false,
                  durationSeconds: chosen?.baselineDurationSeconds ?? null,
                })
              }
            >
              I did it anyway
            </Button>
          </div>
        </div>
      </Screen>
    )
  }

  // ── doing it, timed ───────────────────────────────────────────────────────
  if (phase === 'doing') {
    const baseline = chosen?.baselineDurationSeconds ?? null
    const underBaseline = baseline != null && elapsed < baseline

    return (
      <Screen>
        <div className="space-y-6 text-center">
          <div className="text-sm text-ink-500">Timing</div>
          <h1 className="text-xl font-semibold text-ink-900">{chosen?.label}</h1>

          <div className="py-4">
            <div className="text-6xl font-semibold tabular-nums text-ink-900">
              {formatClock(elapsed)}
            </div>
            {baseline != null && (
              <div className="mt-2 text-sm text-ink-500">
                {underBaseline
                  ? `${formatDuration(baseline - elapsed)} under your usual`
                  : 'past your usual'}
              </div>
            )}
          </div>

          <p className="text-[15px] leading-relaxed text-ink-600">
            Stop as soon as you can rather than when it feels finished. Finished
            is the feeling the compulsion is chasing.
          </p>

          <Button
            full
            onClick={() =>
              void finish({ resisted: false, durationSeconds: elapsed })
            }
          >
            Stopped
          </Button>
        </div>
      </Screen>
    )
  }

  // ── result ────────────────────────────────────────────────────────────────
  return (
    <Screen>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold leading-snug text-ink-900">
          {summary && summary.reclaimed > 0
            ? `That is ${formatDuration(summary.reclaimed)} back.`
            : 'Recorded.'}
        </h1>

        {summary && summary.delayed > 0 && (
          <p className="text-[15px] leading-relaxed text-ink-700">
            You held off for {formatDuration(summary.delayed)}.
          </p>
        )}

        <p className="text-[15px] leading-relaxed text-ink-600">
          {summary?.resisted
            ? 'The urge came and went without you acting on it. That is the whole mechanism, and it gets easier from here.'
            : 'Doing it shorter still counts. The link between the urge and the act loosens either way.'}
        </p>

        <div className="space-y-3">
          <Button full onClick={() => navigate('/home')}>
            Done
          </Button>
        </div>
      </div>
    </Screen>
  )
}
