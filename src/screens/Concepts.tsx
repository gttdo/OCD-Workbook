import { useState } from 'react'
import { Screen } from '@/components/AppShell'
import { CONCEPTS } from '@/data/concepts'

/**
 * Reference, not a curriculum.
 *
 * Nothing tracks whether these have been read and nothing prompts anyone to
 * come back. It exists so that someone told they need to do "response
 * prevention" can find out what that means without asking something that will
 * reassure them on the way past.
 */
export function Concepts() {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <Screen
      title="The words"
      intro="Terms your therapist may use without stopping to explain them."
    >
      <ul className="space-y-2">
        {CONCEPTS.map((c) => {
          const isOpen = open === c.term
          return (
            <li
              key={c.term}
              className="rounded-xl border border-ink-200 bg-white shadow-card"
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : c.term)}
                aria-expanded={isOpen}
                className="tap flex w-full items-center justify-between gap-3 p-4 text-left"
              >
                <span className="text-[15px] font-medium text-ink-900">
                  {c.term}
                </span>
                <span aria-hidden className="flex-none text-ink-400">
                  {isOpen ? '−' : '+'}
                </span>
              </button>
              {isOpen && (
                <div className="animate-fade-in space-y-2 px-4 pb-4">
                  {c.body.map((p) => (
                    <p key={p} className="text-[15px] leading-relaxed text-ink-700">
                      {p}
                    </p>
                  ))}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </Screen>
  )
}
