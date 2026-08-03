import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, stamp } from '@/db'
import type { CompulsionForm, OcdSubtype } from '@/db/types'
import { currentUserId } from '@/lib/session'
import {
  COMPULSION_FORM_OPTIONS,
  CORE_SECTIONS,
  SUBTYPE_SECTIONS,
  type ScreenerSection,
} from '@/data/screenerItems'

type Answers = Record<string, boolean>

const ALL_SECTIONS: ScreenerSection[] = [...CORE_SECTIONS, ...SUBTYPE_SECTIONS]

export function Screener() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [form, setForm] = useState<CompulsionForm | 'both' | null>(null)
  const [saving, setSaving] = useState(false)

  // sections, then the compulsion-form question, then the result
  const formStep = ALL_SECTIONS.length
  const resultStep = formStep + 1
  const totalSteps = resultStep + 1

  const scores = useMemo(() => {
    const out: Partial<Record<OcdSubtype, number>> = {}
    for (const section of SUBTYPE_SECTIONS) {
      out[section.key as OcdSubtype] = section.items.filter((i) => answers[i.id]).length
    }
    return out
  }, [answers])

  const coreScore = useMemo(
    () => ({
      obsessions: CORE_SECTIONS[0]!.items.filter((i) => answers[i.id]).length,
      compulsions: CORE_SECTIONS[1]!.items.filter((i) => answers[i.id]).length,
    }),
    [answers],
  )

  async function finish() {
    setSaving(true)
    const userId = currentUserId()
    const compulsionForm: CompulsionForm | null =
      form === 'both' ? 'behavioral' : form

    await db.screenings.add(
      stamp(userId, {
        takenAt: new Date().toISOString(),
        responses: answers,
        subtypeScores: scores,
        compulsionForm,
      }),
    )

    const existing = await db.profile.get(userId)
    if (existing) {
      await db.profile.update(userId, {
        primaryCompulsionForm: compulsionForm,
        updatedAt: new Date().toISOString(),
        syncedAt: null,
      })
    } else {
      await db.profile.add({ ...stamp(userId, { primaryCompulsionForm: compulsionForm }), id: userId })
    }

    navigate('/home')
  }

  if (step === resultStep) {
    return (
      <Result
        coreScore={coreScore}
        scores={scores}
        form={form}
        saving={saving}
        onFinish={finish}
      />
    )
  }

  if (step === formStep) {
    return (
      <Shell step={step} total={totalSteps} onBack={() => setStep(step - 1)}>
        <h2 className="text-xl font-semibold text-ink-900">
          When you respond to the thought, what does that look like?
        </h2>
        <p className="mt-2 text-sm text-ink-500">
          This shapes which tools will actually fit you.
        </p>

        <div className="mt-6 space-y-3">
          {COMPULSION_FORM_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setForm(opt.value)}
              aria-pressed={form === opt.value}
              className={[
                'w-full rounded-xl border p-4 text-left transition-colors',
                form === opt.value
                  ? 'border-ink-800 bg-ink-800 text-white'
                  : 'border-ink-200 bg-white active:bg-ink-50',
              ].join(' ')}
            >
              <div className="font-medium">{opt.title}</div>
              <div
                className={[
                  'mt-1 text-sm',
                  form === opt.value ? 'text-ink-200' : 'text-ink-500',
                ].join(' ')}
              >
                {opt.detail}
              </div>
            </button>
          ))}
        </div>

        <NextButton disabled={!form} onClick={() => setStep(step + 1)} />
      </Shell>
    )
  }

  const section = ALL_SECTIONS[step]!

  return (
    <Shell
      step={step}
      total={totalSteps}
      onBack={step > 0 ? () => setStep(step - 1) : undefined}
    >
      <h2 className="text-xl font-semibold text-ink-900">{section.title}</h2>
      {section.blurb && (
        <p className="mt-2 text-sm text-ink-500">{section.blurb}</p>
      )}

      <div className="mt-6 space-y-2">
        {section.items.map((item) => {
          const checked = answers[item.id] ?? false
          return (
            <button
              key={item.id}
              type="button"
              role="checkbox"
              aria-checked={checked}
              onClick={() =>
                setAnswers((a) => ({ ...a, [item.id]: !a[item.id] }))
              }
              className={[
                'flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                checked
                  ? 'border-calm-600 bg-calm-50'
                  : 'border-ink-200 bg-white active:bg-ink-50',
              ].join(' ')}
            >
              <span
                aria-hidden
                className={[
                  'mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded border text-xs',
                  checked
                    ? 'border-calm-600 bg-calm-600 text-white'
                    : 'border-ink-300 bg-white',
                ].join(' ')}
              >
                {checked ? '✓' : ''}
              </span>
              <span className="text-[15px] leading-snug text-ink-800">
                {item.text}
              </span>
            </button>
          )
        })}
      </div>

      <NextButton onClick={() => setStep(step + 1)} />
      <p className="mt-3 text-center text-xs text-ink-400">
        Leave anything blank that does not apply.
      </p>
    </Shell>
  )
}

function Shell({
  children,
  step,
  total,
  onBack,
}: {
  children: React.ReactNode
  step: number
  total: number
  onBack?: () => void
}) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-4 pb-16 pt-6 sm:px-6">
      <div className="mb-6">
        <div className="h-1 w-full rounded-full bg-ink-200">
          <div
            className="h-1 rounded-full bg-ink-800 transition-all"
            style={{ width: `${((step + 1) / total) * 100}%` }}
          />
        </div>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="tap mt-3 text-sm text-ink-500 active:text-ink-800"
          >
            ← Back
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

function NextButton({
  onClick,
  disabled,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="tap mt-8 w-full rounded-xl bg-ink-900 px-4 py-3 font-medium text-white
                 transition-opacity disabled:opacity-40"
    >
      Continue
    </button>
  )
}

function Result({
  coreScore,
  scores,
  form,
  saving,
  onFinish,
}: {
  coreScore: { obsessions: number; compulsions: number }
  scores: Partial<Record<OcdSubtype, number>>
  form: CompulsionForm | 'both' | null
  saving: boolean
  onFinish: () => void
}) {
  const suggestive = coreScore.obsessions >= 2 && coreScore.compulsions >= 2

  const top = Object.entries(scores)
    .filter(([, n]) => (n ?? 0) >= 2)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([k]) => k as OcdSubtype)

  const mentalOnly = form === 'mental'

  return (
    <div className="mx-auto min-h-screen w-full max-w-xl px-4 pb-16 pt-8 sm:px-6">
      <h2 className="text-2xl font-semibold text-ink-900">What you told us</h2>

      <p className="mt-4 text-[15px] leading-relaxed text-ink-700">
        {suggestive
          ? 'Your answers line up with the pattern that OCD tends to follow — a thought that will not leave, and something you do to make it quieter.'
          : 'Your answers do not show the full pattern OCD usually follows. That does not mean nothing is going on, and it does not mean this workbook is not useful to you.'}
      </p>

      {top.length > 0 && (
        <div className="mt-6 rounded-xl border border-ink-200 bg-white p-4">
          <div className="text-sm font-medium text-ink-700">
            Where it seems to land
          </div>
          <ul className="mt-2 space-y-1 text-[15px] text-ink-800">
            {top.map((k) => (
              <li key={k}>
                {SUBTYPE_SECTIONS.find((s) => s.key === k)?.title ?? k}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/*
        The honest disclosure. Someone with purely mental rituals cannot use the
        v1 engine, and finding that out three screens into building a fear
        ladder would be worse than being told now.
      */}
      {mentalOnly && (
        <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="font-medium text-amber-900">
            Worth knowing before you start
          </div>
          <p className="mt-2 text-[15px] leading-relaxed text-amber-900">
            You said your rituals happen entirely in your head. The exercises in
            this version work by exposing you to something and helping you not
            act on the urge — which needs an action there is something to
            interrupt. Mental rituals need a different approach, and it is not
            built yet.
          </p>
          <p className="mt-2 text-[15px] leading-relaxed text-amber-900">
            You are welcome to keep going, and some of it will still help. But we
            would rather say this now than let you find out later.
          </p>
        </div>
      )}

      <div className="mt-6 rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
        This is not a diagnosis. It is a starting point for work you do with a
        professional. If you are in crisis, contact your local emergency services
        or a crisis line now.
      </div>

      <button
        type="button"
        onClick={onFinish}
        disabled={saving}
        className="tap mt-8 w-full rounded-xl bg-ink-900 px-4 py-3 font-medium text-white disabled:opacity-40"
      >
        {saving ? 'Saving…' : 'Save and continue'}
      </button>
    </div>
  )
}
