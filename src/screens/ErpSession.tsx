import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { db, nowIso, stamp } from '@/db'
import type { Anxiety } from '@/db/types'
import { currentUserId } from '@/lib/session'
import { isEligibleToRetire } from '@/lib/graduation'
import { RetireOffer } from '@/components/RetireOffer'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'
import { AnxietyScale } from '@/components/AnxietyScale'
import { Button } from '@/components/ui/Button'

/**
 * The ERP engine.
 *
 * Structured around expectancy violation rather than habituation. The person
 * writes down what they expect to happen before they start; afterwards they
 * write what actually happened, and the two are shown side by side. That
 * comparison — not a falling anxiety line — is the payoff.
 *
 * Ordering the prediction first is deliberate. If it were captured afterwards
 * it would be reconstructed, and a fear that has already been disconfirmed is
 * remembered as milder than it was.
 */
type Phase = 'plan' | 'during' | 'after' | 'result'

export function ErpSession() {
  const { triggerId } = useParams<{ triggerId: string }>()
  const navigate = useNavigate()

  const trigger = useLiveQuery(
    async () => (triggerId ? ((await db.triggers.get(triggerId)) ?? null) : null),
    [triggerId],
    undefined,
  )

  const [phase, setPhase] = useState<Phase>('plan')
  const [sessionId, setSessionId] = useState<string | null>(null)

  // plan
  const [step, setStep] = useState('')
  const [prediction, setPrediction] = useState('')
  const [predictedAnxiety, setPredictedAnxiety] = useState<Anxiety | null>(null)
  const [resisting, setResisting] = useState('')

  // after
  const [outcome, setOutcome] = useState('')
  const [peak, setPeak] = useState<Anxiety | null>(null)
  const [skipRating, setSkipRating] = useState(false)
  const [resisted, setResisted] = useState<boolean | null>(null)
  const [canRetire, setCanRetire] = useState(false)

  if (trigger === undefined) return null
  if (trigger === null) {
    return (
      <Screen title="Not found">
        <p className="text-[15px] text-ink-600">
          That rung is no longer on your ladder.
        </p>
      </Screen>
    )
  }

  async function begin() {
    const userId = currentUserId()

    let compulsionId: string | null = null
    if (resisting.trim()) {
      const existing = await db.compulsions
        .filter(
          (c) =>
            !c.deletedAt &&
            c.triggerId === trigger!.id &&
            c.label.toLowerCase() === resisting.trim().toLowerCase(),
        )
        .first()
      if (existing) {
        compulsionId = existing.id
      } else {
        const row = stamp(userId, {
          triggerId: trigger!.id,
          label: resisting.trim(),
          form: 'behavioral' as const,
          isActive: true,
        })
        await db.compulsions.add(row)
        compulsionId = row.id
      }
    }

    const session = stamp(userId, {
      triggerId: trigger!.id,
      kind: 'in_vivo' as const,
      startedAt: nowIso(),
      predictedAnxiety,
      predictedOutcome: prediction.trim() || null,
      compulsionId,
      notes: step.trim() || null,
    })
    await db.exposureSessions.add(session)

    if (trigger!.status !== 'in_progress') {
      await db.triggers.update(trigger!.id, {
        status: 'in_progress',
        updatedAt: nowIso(),
        syncedAt: null,
      })
    }

    setSessionId(session.id)
    setPhase('during')
  }

  async function complete() {
    if (!sessionId) return
    await db.exposureSessions.update(sessionId, {
      endedAt: nowIso(),
      actualOutcome: outcome.trim() || null,
      anxietyPeak: skipRating ? null : peak,
      responsePrevented: resisted,
      updatedAt: nowIso(),
      syncedAt: null,
    })
    // Checked after saving, so this session counts toward the run.
    setCanRetire(await isEligibleToRetire(trigger!.id))
    setPhase('result')
  }

  // ── plan ──────────────────────────────────────────────────────────────────
  if (phase === 'plan') {
    return (
      <Screen>
        <div className="space-y-6">
          <div>
            <div className="text-sm text-ink-500">From your ladder</div>
            <h1 className="mt-1 text-2xl font-semibold leading-snug text-ink-900">
              {trigger.label}
            </h1>
          </div>

          <Teach id="erp-plan" title="Why write the prediction down first">
            <p>
              The part that changes things is not the anxiety fading. It is
              finding out that what you expected did not happen.
            </p>
            <p>
              That only works if the expectation is on record beforehand.
              Afterwards, a fear that turned out to be wrong is remembered as
              milder than it was.
            </p>
          </Teach>

          <Field
            id="erp-step"
            label="What exactly are you going to do?"
            placeholder="Touch the bathroom door handle and not wash until lunch"
            value={step}
            onChange={setStep}
          />

          <Field
            id="erp-prediction"
            label="What do you think will happen?"
            placeholder="I will feel contaminated all day and end up washing anyway"
            value={prediction}
            onChange={setPrediction}
            multiline
          />

          <div className="rounded-xl border border-ink-200 bg-white p-4">
            <AnxietyScale
              label="How anxious do you expect to get?"
              value={predictedAnxiety}
              onChange={setPredictedAnxiety}
            />
          </div>

          <Field
            id="erp-resisting"
            label="What are you not going to do?"
            placeholder="Wash my hands"
            value={resisting}
            onChange={setResisting}
            hint="The compulsion you are holding off. This is the half that does the work."
          />

          <Button full disabled={step.trim().length === 0} onClick={() => void begin()}>
            Start
          </Button>
        </div>
      </Screen>
    )
  }

  // ── during ────────────────────────────────────────────────────────────────
  if (phase === 'during') {
    return (
      <Screen>
        <div className="space-y-6">
          <div>
            <div className="text-sm text-ink-500">Doing now</div>
            <h1 className="mt-1 text-2xl font-semibold leading-snug text-ink-900">
              {step || trigger.label}
            </h1>
          </div>

          {resisting && (
            <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
              <div className="text-sm text-ink-300">Not doing</div>
              <div className="mt-0.5 font-medium text-white">{resisting}</div>
            </div>
          )}

          {/* Their own words, shown at the moment it gets hard. */}
          {trigger.goalStatement && (
            <div className="rounded-xl bg-calm-50 p-4">
              <div className="text-sm text-calm-700">You said you wanted this</div>
              <div className="mt-0.5 text-[15px] text-ink-800">
                so I can {trigger.goalStatement}
              </div>
            </div>
          )}

          <p className="text-[15px] leading-relaxed text-ink-600">
            Stay with it as long as you can. The urge will rise and then level
            off on its own — you do not have to do anything to make that happen.
          </p>

          <Button full onClick={() => setPhase('after')}>
            I have finished this
          </Button>
        </div>
      </Screen>
    )
  }

  // ── after ─────────────────────────────────────────────────────────────────
  if (phase === 'after') {
    return (
      <Screen>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold leading-snug text-ink-900">
            How did it go?
          </h1>

          <Field
            id="erp-outcome"
            label="What actually happened?"
            placeholder="I was uncomfortable for about twenty minutes and then forgot about it"
            value={outcome}
            onChange={setOutcome}
            multiline
          />

          <div className="rounded-xl border border-ink-200 bg-white p-4">
            {skipRating ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-500">Not rating this one.</span>
                <button
                  type="button"
                  onClick={() => setSkipRating(false)}
                  className="tap text-sm text-ink-500 underline decoration-ink-300 underline-offset-4 active:text-ink-800"
                >
                  Undo
                </button>
              </div>
            ) : (
              <>
                <AnxietyScale
                  label="How high did it actually get?"
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
                  className="tap mt-3 text-sm text-ink-400 underline decoration-ink-300 underline-offset-4 active:text-ink-700"
                >
                  I would rather not rate this
                </button>
              </>
            )}
          </div>

          {resisting && (
            <div>
              <div className="mb-2 text-sm font-medium text-ink-700">
                Did you hold off on {resisting.toLowerCase()}?
              </div>
              <div className="flex gap-2">
                <Choice active={resisted === true} onClick={() => setResisted(true)}>
                  I held off
                </Choice>
                <Choice active={resisted === false} onClick={() => setResisted(false)}>
                  I did it
                </Choice>
              </div>
              {resisted === false && (
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  That happens, and it is worth recording rather than hiding.
                  Doing the exposure at all is the part that counts.
                </p>
              )}
            </div>
          )}

          <Button full onClick={() => void complete()}>
            Save
          </Button>
        </div>
      </Screen>
    )
  }

  // ── result: the expectancy violation ──────────────────────────────────────
  const overestimated =
    predictedAnxiety != null && peak != null && !skipRating && peak < predictedAnxiety

  return (
    <Screen>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold leading-snug text-ink-900">
          {overestimated ? 'It was smaller than you thought.' : 'Recorded.'}
        </h1>

        {(prediction || outcome) && (
          <div className="space-y-3">
            {prediction && (
              <div className="rounded-xl border border-ink-200 bg-white p-4">
                <div className="text-sm text-ink-500">You expected</div>
                <div className="mt-1 text-[15px] leading-relaxed text-ink-700">
                  {prediction}
                </div>
              </div>
            )}
            {outcome && (
              <div className="rounded-xl border border-calm-600 bg-calm-50 p-4">
                <div className="text-sm text-calm-700">What happened</div>
                <div className="mt-1 text-[15px] leading-relaxed text-ink-800">
                  {outcome}
                </div>
              </div>
            )}
          </div>
        )}

        {predictedAnxiety != null && peak != null && !skipRating && (
          <div className="flex items-center gap-4 rounded-xl bg-ink-100 p-4">
            <Number label="Expected" value={predictedAnxiety} />
            <span aria-hidden className="text-ink-300">
              →
            </span>
            <Number label="Actual" value={peak} />
          </div>
        )}

        {canRetire ? (
          <RetireOffer
            triggerId={trigger.id}
            label={trigger.label}
            onRetired={() => setCanRetire(false)}
          />
        ) : (
          <p className="text-[15px] leading-relaxed text-ink-600">
            Doing this one again is what makes it stick. The gap between what
            you expect and what happens is the thing that shrinks the fear.
          </p>
        )}

        <div className="space-y-3">
          <Button full onClick={() => navigate('/ladder')}>
            Back to the ladder
          </Button>
        </div>
      </div>
    </Screen>
  )
}

function Number({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-semibold tabular-nums text-ink-900">
        {value}
      </div>
      <div className="text-xs text-ink-500">{label}</div>
    </div>
  )
}

function Choice({
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
        'tap flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'border-ink-800 bg-ink-800 text-white'
          : 'border-ink-200 bg-white text-ink-700 active:bg-ink-50',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  hint,
  multiline,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  hint?: string
  multiline?: boolean
}) {
  const shared =
    'w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px] placeholder:text-ink-300 focus:border-calm-600 focus:outline-none'
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink-700">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={shared}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`tap ${shared}`}
        />
      )}
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{hint}</p>}
    </div>
  )
}
