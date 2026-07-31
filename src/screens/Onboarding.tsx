import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, nowIso, stamp } from '@/db'
import { getLocalUserId, markOnboardedLocally } from '@/lib/session'
import { Button } from '@/components/ui/Button'

/**
 * Onboarding — five screens, about ninety seconds, ending in action.
 *
 * Deliberately short. The book has psychoeducation attached to all 39
 * exercises; front-loading it would build a wall of text and lose people
 * before their first win. Everything else is taught just-in-time, at the
 * moment it becomes relevant.
 *
 * Tone is plain and flat throughout. The upbeat wellness-app register reads as
 * dismissive to someone whose disorder has cost them a job or a marriage.
 */

const CYCLE_STAGES = [
  {
    label: 'Something sets it off',
    body: 'A door handle. A knife on the counter. A thought that arrives on its own.',
  },
  {
    label: 'The thought sticks',
    body: 'It does not pass the way other thoughts pass. It demands an answer.',
  },
  {
    label: 'Anxiety climbs',
    body: 'This part is real and physical. It is not something you are imagining.',
  },
  {
    label: 'You do something to make it stop',
    body: 'Wash. Check. Rearrange. Ask. Replay it until it feels settled.',
  },
  {
    label: 'It works',
    body: 'The anxiety drops. Relief arrives. This is the part nobody tells you about.',
  },
  {
    label: 'And that is the problem',
    body: 'The relief teaches your brain the danger was real and you escaped it. So next time the thought arrives, it arrives louder.',
  },
]

export function Onboarding() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const TOTAL = 5

  async function finish() {
    setSaving(true)
    const userId = getLocalUserId()
    // Set before navigating: the gate reads this synchronously during render.
    markOnboardedLocally()
    const existing = await db.profile.get(userId)
    if (existing) {
      await db.profile.update(userId, { onboardedAt: nowIso(), updatedAt: nowIso(), syncedAt: null })
    } else {
      await db.profile.add({
        ...stamp(userId, { onboardedAt: nowIso() }),
        id: userId,
      })
    }
    navigate('/screener')
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col px-4 pb-10 pt-6 sm:px-6">
      <Dots current={step} total={TOTAL} />

      <div className="flex-1 pt-6">
        {step === 0 && <WhatThisIs />}
        {step === 1 && <TheCycle />}
        {step === 2 && <TheDeal />}
        {step === 3 && <WhatWeWontDo />}
        {step === 4 && <Safety />}
      </div>

      <div className="space-y-3 pt-8">
        <Button
          full
          disabled={saving}
          onClick={() => (step === TOTAL - 1 ? void finish() : setStep(step + 1))}
        >
          {step === TOTAL - 1 ? (saving ? 'One moment…' : 'Start') : 'Next'}
        </Button>
        {step > 0 && (
          <Button full variant="quiet" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
      </div>
    </div>
  )
}

function Dots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={[
            'h-1 flex-1 rounded-full transition-colors',
            i <= current ? 'bg-ink-800' : 'bg-ink-200',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-semibold leading-snug text-ink-900">{children}</h1>
  )
}

function Body({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 text-[15px] leading-relaxed text-ink-700">{children}</p>
  )
}

function WhatThisIs() {
  return (
    <div>
      <Title>This is the homework, not the therapy.</Title>
      <Body>
        Your therapist gives you things to practise between sessions. This is
        somewhere to do them, instead of on paper.
      </Body>
      <Body>
        It works with no signal, because the moments where it matters happen in
        bathrooms, kitchens, car parks and at three in the morning — not
        wherever the wifi is good.
      </Body>
    </div>
  )
}

/**
 * The single most important idea in the app. Revealed a beat at a time rather
 * than as a paragraph, because the turn — "it works, and that is the problem"
 * — only lands if it arrives on its own.
 */
function TheCycle() {
  const [shown, setShown] = useState(1)
  const complete = shown >= CYCLE_STAGES.length

  return (
    <div>
      <Title>Here is what keeps it going.</Title>

      <ol className="mt-6 space-y-3">
        {CYCLE_STAGES.slice(0, shown).map((stage, i) => {
          const isTurn = i === CYCLE_STAGES.length - 1
          return (
            <li
              key={stage.label}
              className={[
                'rounded-xl border p-4',
                isTurn
                  ? 'border-ink-800 bg-ink-900 text-white'
                  : 'border-ink-200 bg-white',
              ].join(' ')}
            >
              <div className="font-medium">{stage.label}</div>
              <div
                className={[
                  'mt-1 text-sm leading-relaxed',
                  isTurn ? 'text-ink-200' : 'text-ink-600',
                ].join(' ')}
              >
                {stage.body}
              </div>
            </li>
          )
        })}
      </ol>

      {!complete && (
        <Button
          full
          variant="secondary"
          className="mt-4"
          onClick={() => setShown(shown + 1)}
        >
          Then what?
        </Button>
      )}

      {complete && (
        <Body>
          Every exercise here works by breaking that loop in one place: you meet
          the thing that sets it off, and you do not do the thing that makes it
          stop.
        </Body>
      )}
    </div>
  )
}

/**
 * The consent moment. ERP is counterintuitive enough that people who are not
 * told this quit at the first spike and conclude they failed, rather than that
 * we under-explained.
 */
function TheDeal() {
  return (
    <div>
      <Title>This gets harder before it gets easier.</Title>
      <Body>
        You should know what you are agreeing to. The method asks you to go
        towards what frightens you and then not do the thing that brings relief.
        Your anxiety will go up. For the first couple of weeks it may sit higher
        than it does now.
      </Body>
      <Body>
        That is not a sign it is going wrong. It is the part that does the work.
        What changes is not that the thoughts stop — it is that they stop
        deciding what you do.
      </Body>
      <div className="mt-6 rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
        Go at the pace you and your therapist agreed. Nothing here will push you
        up the ladder before you are ready, and nothing here decides for you
        what to face next.
      </div>
    </div>
  )
}

/**
 * Unusual, and load-bearing. Saying this out loud builds trust immediately and
 * inoculates against the app itself becoming a compulsion — which is the
 * specific failure mode this whole product is designed against.
 */
function WhatWeWontDo() {
  const promises = [
    ['No streaks.', 'Missing a day means you missed a day. Nothing breaks.'],
    ['No scores, no percentages.', 'There is no way to do this neatly, and nothing here rewards trying.'],
    [
      'No reminders unless you set them.',
      'And you choose when, in advance — never a surprise nudge to think about it.',
    ],
    [
      'Nothing designed to keep you here.',
      'If this is working, you should be opening it less over time, not more.',
    ],
  ]

  return (
    <div>
      <Title>What this app will not do.</Title>
      <Body>
        Most apps are built to be hard to put down. For obsessive-compulsive
        disorder that is the wrong goal, so we have left those parts out on
        purpose.
      </Body>
      <ul className="mt-6 space-y-3">
        {promises.map(([head, sub]) => (
          <li key={head} className="rounded-xl border border-ink-200 bg-white p-4">
            <div className="font-medium text-ink-900">{head}</div>
            <div className="mt-1 text-sm leading-relaxed text-ink-600">{sub}</div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Safety() {
  return (
    <div>
      <Title>Before you start.</Title>
      <Body>
        This is not treatment and it is not a diagnosis. It is a place to
        practise work you are doing with a professional. It does not replace
        them, and it cannot tell you what is wrong.
      </Body>
      <div className="mt-6 rounded-xl border border-ink-200 bg-white p-4">
        <div className="font-medium text-ink-900">If you are in crisis</div>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          Contact your local emergency services. In the US you can call or text
          988 for the Suicide &amp; Crisis Lifeline. In the UK, call 116 123 for
          Samaritans. Please do not wait to work through this on your own.
        </p>
      </div>
      <Body>
        Next we will ask some questions about what you have been experiencing —
        about five minutes. It stays on this device.
      </Body>
    </div>
  )
}
