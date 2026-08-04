import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, nowIso, stamp, tombstone } from '@/db'
import { currentUserId } from '@/lib/session'
import { VALUE_SUGGESTIONS } from '@/data/valueSuggestions'
import { Screen } from '@/components/AppShell'
import { Teach } from '@/components/Teach'
import { Button } from '@/components/ui/Button'

/**
 * What the work is for.
 *
 * Not an exercise for its own sake: these are what a retired fear gets
 * attached to. "I can use a bathroom anywhere" means more when it points at
 * "travelling somewhere new" than when it floats on its own.
 *
 * Nothing here is scored or completed. There is no right number to pick and no
 * prompt to come back and review them.
 */
export function Values() {
  const values = useLiveQuery(
    () => db.values.filter((v) => !v.deletedAt).toArray(),
    [],
    [],
  )
  const [custom, setCustom] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  const chosen = new Map(values.map((v) => [v.label, v]))

  async function toggle(label: string) {
    const existing = chosen.get(label)
    if (existing) {
      await db.values.update(existing.id, tombstone())
      return
    }
    await db.values.add(
      stamp(currentUserId(), {
        label,
        whyItMatters: null,
        sortOrder: values.length,
      }),
    )
  }

  async function addCustom() {
    const label = custom.trim()
    if (!label || chosen.has(label)) return
    await db.values.add(
      stamp(currentUserId(), { label, whyItMatters: null, sortOrder: values.length }),
    )
    setCustom('')
  }

  async function setWhy(id: string, whyItMatters: string) {
    await db.values.update(id, {
      whyItMatters: whyItMatters.trim() || null,
      updatedAt: nowIso(),
      syncedAt: null,
    })
  }

  return (
    <Screen
      title="What this is for"
      intro="The parts of your life OCD has been taking up room in."
    >
      <div className="space-y-6">
        <Teach id="values" title="Why bother naming these">
          <p>
            Exposure work is unpleasant on purpose, and "because it is good for
            me" wears thin around week three. What holds up better is something
            concrete you want back.
          </p>
          <p>
            Pick whatever is true. There is no right number and nothing here is
            scored.
          </p>
        </Teach>

        <div className="flex flex-wrap gap-2">
          {VALUE_SUGGESTIONS.map((label) => {
            const selected = chosen.has(label)
            return (
              <button
                key={label}
                type="button"
                onClick={() => void toggle(label)}
                aria-pressed={selected}
                className={[
                  'tap rounded-full border px-3 py-2 text-sm transition-all duration-150',
                  selected
                    ? 'border-calm-700 bg-calm-50 text-calm-700'
                    : 'border-ink-200 bg-white text-ink-600 active:bg-ink-50',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="space-y-2 border-t border-ink-200 pt-6">
          <label
            htmlFor="custom-value"
            className="block text-sm font-medium text-ink-700"
          >
            Something not listed
          </label>
          <input
            id="custom-value"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void addCustom()
            }}
            placeholder="Singing in a choir again"
            className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                       placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
          />
          <Button
            full
            variant="secondary"
            disabled={custom.trim().length === 0}
            onClick={() => void addCustom()}
          >
            Add it
          </Button>
        </div>

        {values.length > 0 && (
          <section className="border-t border-ink-200 pt-6">
            <h2 className="mb-2 text-sm font-medium text-ink-500">
              Yours ({values.length})
            </h2>
            <ul className="space-y-2">
              {values.map((v) => (
                <li
                  key={v.id}
                  className="rounded-xl border border-ink-200 bg-white p-3 shadow-card"
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                    className="w-full text-left"
                  >
                    <span className="text-[15px] text-ink-800">{v.label}</span>
                    {v.whyItMatters && (
                      <span className="mt-0.5 block text-sm italic text-ink-500">
                        {v.whyItMatters}
                      </span>
                    )}
                  </button>

                  {expanded === v.id && (
                    <WhyField
                      key={v.id}
                      initial={v.whyItMatters ?? ''}
                      onSave={(text) => void setWhy(v.id, text)}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Screen>
  )
}

function WhyField({
  initial,
  onSave,
}: {
  initial: string
  onSave: (value: string) => void
}) {
  const [value, setValue] = useState(initial)

  // Saved on change rather than blur, for the same reason as everywhere else:
  // blur does not fire reliably when a thumb hits the bottom nav.
  function update(next: string) {
    setValue(next)
    onSave(next)
  }

  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
      <label className="mb-1.5 block text-sm text-ink-600">
        What does this look like when it is going well?
      </label>
      <input
        value={value}
        onChange={(e) => update(e.target.value)}
        placeholder="Saturday mornings out of the house, not cleaning"
        className="tap w-full rounded-lg border border-ink-300 px-3 py-2.5 text-[16px]
                   placeholder:text-ink-300 focus:border-calm-600 focus:outline-none"
      />
    </div>
  )
}
