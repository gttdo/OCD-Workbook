import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db, nowIso, stamp } from '@/db'
import type { Anxiety } from '@/db/types'
import { currentUserId } from '@/lib/session'
import { cycleWeekState, summarise, WEEK_DAYS } from '@/lib/cycleWeek'
import { EMOTIONS, SENSATIONS } from '@/data/cycleOptions'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'
import { AnxietyScale } from '@/components/AnxietyScale'
import { Button } from '@/components/ui/Button'

/**
 * The cycle tracker — one week, then it stops.
 *
 * It teaches the vocabulary every other screen assumes: what a trigger is,
 * what the thought is, and what you did about it. A week is enough for that,
 * and longer turns it into symptom surveillance.
 */
export function CycleTracker() {
  const state = useLiveQuery(() => cycleWeekState(), [], null)

  const [triggerText, setTriggerText] = useState('')
  const [obsessionText, setObsessionText] = useState('')
  const [compulsionText, setCompulsionText] = useState('')
  const [anxiety, setAnxiety] = useState<Anxiety | null>(null)
  const [emotions, setEmotions] = useState<string[]>([])
  const [sensations, setSensations] = useState<string[]>([])
  const [showOptional, setShowOptional] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  if (!state) return null

  async function save() {
    await db.cycleLogs.add(
      stamp(currentUserId(), {
        occurredAt: nowIso(),
        triggerText: triggerText.trim() || null,
        obsessionText: obsessionText.trim() || null,
        compulsionText: compulsionText.trim() || null,
        emotions,
        sensations,
        anxiety,
        notes: null,
      }),
    )
    setTriggerText('')
    setObsessionText('')
    setCompulsionText('')
    setAnxiety(null)
    setEmotions([])
    setSensations([])
    setShowOptional(false)
    setJustSaved(true)
  }

  if (state.phase === 'not-started') {
    return (
      <Screen
        title="A week of noticing"
        intro="Before you change anything, it helps to see the shape of it."
      >
        <div className="space-y-6">
          <Teach id="cycle-intro" title="What this is and when it stops">
            <p>
              For one week, jot down what set something off, what the thought
              was, and what you did about it. Nothing else changes yet — you are
              not trying to resist anything.
            </p>
            <p>
              It ends after seven days on purpose. Watching your own symptoms
              closely is useful briefly and unhelpful as a habit, so this is not
              something the app will ask you to keep doing.
            </p>
          </Teach>

          <p className="rounded-xl bg-ink-100 p-4 text-[15px] leading-relaxed text-ink-600">
            Log whenever you notice one — a few times a day at most. Missing
            some is fine and there is nothing to catch up on. The week starts
            with your first entry, below.
          </p>

          <EntryForm
            triggerText={triggerText}
            setTriggerText={setTriggerText}
            obsessionText={obsessionText}
            setObsessionText={setObsessionText}
            compulsionText={compulsionText}
            setCompulsionText={setCompulsionText}
            anxiety={anxiety}
            setAnxiety={setAnxiety}
            emotions={emotions}
            setEmotions={setEmotions}
            sensations={sensations}
            setSensations={setSensations}
            showOptional={showOptional}
            setShowOptional={setShowOptional}
            onSave={() => void save()}
          />
        </div>
      </Screen>
    )
  }

  if (state.phase === 'finished') {
    const summary = summarise(state.entries)
    return (
      <Screen title="What the week showed">
        <div className="space-y-6">
          <p className="text-[15px] leading-relaxed text-ink-700">
            You logged {summary.entryCount}{' '}
            {summary.entryCount === 1 ? 'moment' : 'moments'} over seven days.
            That is the tracking done — it is not something to keep up.
          </p>

          {summary.triggers.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-ink-500">
                What set things off
              </h2>
              <ul className="space-y-2">
                {summary.triggers.slice(0, 6).map((t) => (
                  <li
                    key={t.text}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-card"
                  >
                    <span className="text-[15px] text-ink-800">{t.text}</span>
                    {t.count > 1 && (
                      <span className="flex-none text-xs text-ink-400">
                        {t.count} times
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.compulsions.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-medium text-ink-500">
                What you did about it
              </h2>
              <ul className="space-y-2">
                {summary.compulsions.slice(0, 6).map((c) => (
                  <li
                    key={c.text}
                    className="flex items-center justify-between gap-3 rounded-xl border border-ink-200 bg-white p-3 shadow-card"
                  >
                    <span className="text-[15px] text-ink-800">{c.text}</span>
                    {c.count > 1 && (
                      <span className="flex-none text-xs text-ink-400">
                        {c.count} times
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {summary.commonEmotions.length > 0 && (
            <p className="text-[15px] leading-relaxed text-ink-600">
              Mostly it felt like{' '}
              {summary.commonEmotions.join(', ').toLowerCase()}.
            </p>
          )}

          {/* The week's whole purpose: it feeds the ladder. */}
          <div className="rounded-xl border border-calm-600 bg-calm-50 p-4">
            <div className="font-medium text-ink-900">Where this goes next</div>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-700">
              The things that set you off are the raw material for your ladder.
              Add the ones you avoid, and you can start working on them.
            </p>
            <Link
              to="/avoidance"
              className="tap mt-3 block w-full rounded-xl bg-ink-900 px-4 py-3
                         text-center font-medium text-white active:bg-ink-800"
            >
              Add them to your list
            </Link>
          </div>
        </div>
      </Screen>
    )
  }

  return (
    <Screen title="A week of noticing">
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex gap-1">
              {Array.from({ length: WEEK_DAYS }, (_, i) => (
                <div
                  key={i}
                  className={[
                    'h-1 flex-1 rounded-full',
                    i < state.day ? 'bg-ink-800' : 'bg-ink-200',
                  ].join(' ')}
                />
              ))}
            </div>
            <div className="mt-1.5 text-sm text-ink-500">
              Day {state.day} of {WEEK_DAYS} · {state.entries.length}{' '}
              {state.entries.length === 1 ? 'entry' : 'entries'} so far
            </div>
          </div>
        </div>

        {justSaved && (
          <p className="animate-fade-in rounded-xl bg-calm-50 p-3 text-sm leading-relaxed text-ink-700">
            Saved. Close the app and get on with your day — you do not need to
            look back at these.
          </p>
        )}

        <EntryForm
          triggerText={triggerText}
          setTriggerText={setTriggerText}
          obsessionText={obsessionText}
          setObsessionText={setObsessionText}
          compulsionText={compulsionText}
          setCompulsionText={setCompulsionText}
          anxiety={anxiety}
          setAnxiety={setAnxiety}
          emotions={emotions}
          setEmotions={setEmotions}
          sensations={sensations}
          setSensations={setSensations}
          showOptional={showOptional}
          setShowOptional={setShowOptional}
          onSave={() => void save()}
        />
      </div>
    </Screen>
  )
}

interface FormProps {
  triggerText: string
  setTriggerText: (v: string) => void
  obsessionText: string
  setObsessionText: (v: string) => void
  compulsionText: string
  setCompulsionText: (v: string) => void
  anxiety: Anxiety | null
  setAnxiety: (v: Anxiety) => void
  emotions: string[]
  setEmotions: (v: string[]) => void
  sensations: string[]
  setSensations: (v: string[]) => void
  showOptional: boolean
  setShowOptional: (v: boolean) => void
  onSave: () => void
}

/**
 * Three questions, then everything else folded away. A quick note taken in the
 * moment should not open into a full inventory of what might be wrong.
 */
function EntryForm(p: FormProps) {
  const canSave =
    p.triggerText.trim().length > 0 || p.obsessionText.trim().length > 0

  function toggle(list: string[], set: (v: string[]) => void, item: string) {
    set(list.includes(item) ? list.filter((x) => x !== item) : [...list, item])
  }

  return (
    <div className="space-y-4 rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      <Field
        id="cycle-trigger"
        label="What set it off?"
        placeholder="Someone coughed on the bus"
        value={p.triggerText}
        onChange={p.setTriggerText}
      />
      <Field
        id="cycle-obsession"
        label="What was the thought?"
        placeholder="I will catch something and pass it to my daughter"
        value={p.obsessionText}
        onChange={p.setObsessionText}
        multiline
      />
      <Field
        id="cycle-compulsion"
        label="What did you do?"
        placeholder="Got off two stops early and washed at home"
        value={p.compulsionText}
        onChange={p.setCompulsionText}
      />

      {!p.showOptional ? (
        <button
          type="button"
          onClick={() => p.setShowOptional(true)}
          className="tap text-sm text-ink-500 underline decoration-ink-300
                     underline-offset-4 active:text-ink-800"
        >
          Add how it felt
        </button>
      ) : (
        <div className="space-y-4 border-t border-ink-100 pt-4">
          <AnxietyScale
            label="How bad did it get?"
            value={p.anxiety}
            onChange={p.setAnxiety}
          />
          <Chips
            label="Emotions"
            options={EMOTIONS}
            selected={p.emotions}
            onToggle={(item) => toggle(p.emotions, p.setEmotions, item)}
          />
          <Chips
            label="In your body"
            options={SENSATIONS}
            selected={p.sensations}
            onToggle={(item) => toggle(p.sensations, p.setSensations, item)}
          />
        </div>
      )}

      <Button full disabled={!canSave} onClick={p.onSave}>
        Save this one
      </Button>
    </div>
  )
}

function Chips({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (item: string) => void
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-ink-700">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o)
          return (
            <button
              key={o}
              type="button"
              onClick={() => onToggle(o)}
              aria-pressed={on}
              className={[
                'tap rounded-full border px-3 py-1.5 text-sm transition-all duration-150',
                on
                  ? 'border-calm-700 bg-calm-50 text-calm-700'
                  : 'border-ink-200 text-ink-600 active:bg-ink-50',
              ].join(' ')}
            >
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  placeholder,
  value,
  onChange,
  multiline,
}: {
  id: string
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
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
          rows={2}
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
    </div>
  )
}
