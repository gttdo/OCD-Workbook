import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import { db, stamp, tombstone } from '@/db'
import type { Anxiety, TriggerCategory } from '@/db/types'
import { getLocalUserId } from '@/lib/session'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'
import { AnxietyScale } from '@/components/AnxietyScale'
import { Button } from '@/components/ui/Button'

const CATEGORIES: { value: TriggerCategory; label: string }[] = [
  { value: 'place', label: 'A place' },
  { value: 'object', label: 'An object' },
  { value: 'situation', label: 'A situation' },
  { value: 'person_or_animal', label: 'A person or animal' },
  { value: 'thought_or_image', label: 'A thought or image' },
]

/**
 * The avoidance inventory. Produces the trigger records the fear ladder then
 * orders — one exercise feeding directly into the next, which on paper is two
 * separate tables you have to copy between by hand.
 */
export function AvoidanceInventory() {
  const navigate = useNavigate()
  const triggers = useLiveQuery(
    () => db.triggers.filter((t) => !t.deletedAt).toArray(),
    [],
    [],
  )

  const [label, setLabel] = useState('')
  const [category, setCategory] = useState<TriggerCategory | null>(null)
  const [anxiety, setAnxiety] = useState<Anxiety | null>(null)

  const canAdd = label.trim().length > 0 && anxiety != null

  async function add() {
    if (!canAdd) return
    await db.triggers.add(
      stamp(getLocalUserId(), {
        label: label.trim(),
        category,
        baselineAnxiety: anxiety,
        status: 'identified' as const,
      }),
    )
    setLabel('')
    setCategory(null)
    setAnxiety(null)
  }

  async function remove(id: string) {
    await db.triggers.update(id, tombstone())
  }

  return (
    <Screen
      title="What are you avoiding?"
      intro="Anything you stay away from, or get through only by doing something to make it bearable."
    >
      <div className="space-y-6">
        <Teach id="avoidance" title="Why start here">
          <p>
            Avoidance is what keeps a fear intact. If you never touch the door
            handle, you never find out what happens when you do — so the fear
            never gets the chance to be wrong.
          </p>
          <p>
            Nothing on this list commits you to anything. You are making an
            inventory, not a plan.
          </p>
        </Teach>

        {/* add form */}
        <div className="space-y-4 rounded-xl border border-ink-200 bg-white p-4">
          <div>
            <label
              htmlFor="trigger-label"
              className="mb-1.5 block text-sm font-medium text-ink-700"
            >
              What is it?
            </label>
            <input
              id="trigger-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Public bathroom door handles"
              className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                         placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
            />
          </div>

          <div>
            <div className="mb-1.5 text-sm font-medium text-ink-700">
              What kind of thing is it?{' '}
              <span className="font-normal text-ink-400">Optional</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() =>
                    setCategory(category === c.value ? null : c.value)
                  }
                  aria-pressed={category === c.value}
                  className={[
                    'tap rounded-full border px-3 py-1.5 text-sm transition-colors',
                    category === c.value
                      ? 'border-ink-800 bg-ink-800 text-white'
                      : 'border-ink-200 text-ink-600 active:bg-ink-50',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <AnxietyScale
            label="How much distress does it cause right now?"
            value={anxiety}
            onChange={setAnxiety}
          />

          <Button full disabled={!canAdd} onClick={() => void add()}>
            Add to the list
          </Button>
        </div>

        {/* the list */}
        {triggers.length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-medium text-ink-500">
              {triggers.length} {triggers.length === 1 ? 'thing' : 'things'} so far
            </h2>
            <ul className="space-y-2">
              {[...triggers]
                .sort((a, b) => (b.baselineAnxiety ?? 0) - (a.baselineAnxiety ?? 0))
                .map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 rounded-xl border border-ink-200 bg-white p-3"
                  >
                    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-ink-100 text-sm font-semibold tabular-nums text-ink-700">
                      {t.baselineAnxiety}
                    </span>
                    <span className="flex-1 text-[15px] text-ink-800">
                      {t.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => void remove(t.id)}
                      aria-label={`Remove ${t.label}`}
                      className="tap flex-none px-2 text-ink-300 active:text-ink-700"
                    >
                      ×
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        )}

        {triggers.length >= 2 && (
          <div className="space-y-3 border-t border-ink-200 pt-6">
            <p className="text-sm leading-relaxed text-ink-500">
              You can always come back and add more. Nothing here is final.
            </p>
            <Button full onClick={() => navigate('/ladder')}>
              Put these in order
            </Button>
          </div>
        )}
      </div>
    </Screen>
  )
}
