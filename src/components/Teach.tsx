import { useState } from 'react'

/**
 * Just-in-time psychoeducation — our replacement for the book's "You Should
 * Know" blocks.
 *
 * Two or three sentences, at the moment an exercise becomes relevant, never
 * front-loaded. The book attaches explanation to all 39 exercises; delivering
 * that up front would build a wall of text and lose people before their first
 * win.
 *
 * Dismissal is remembered, but the panel never disappears entirely — it
 * collapses to a quiet "why am I doing this?" line. People forget, and having
 * to hunt for the reason is its own small cruelty.
 */

interface Props {
  /** Stable key for remembering dismissal. Change it and the panel returns. */
  id: string
  title: string
  children: React.ReactNode
}

function storageKey(id: string) {
  return `ocd-workbook.teach.${id}`
}

export function Teach({ id, title, children }: Props) {
  const [open, setOpen] = useState(
    () => localStorage.getItem(storageKey(id)) !== 'dismissed',
  )

  function dismiss() {
    localStorage.setItem(storageKey(id), 'dismissed')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="tap -mx-1 px-1 text-left text-sm text-ink-400 underline
                   decoration-ink-300 underline-offset-4 active:text-ink-700"
      >
        Why am I doing this?
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="font-medium text-ink-900">{title}</div>
      <div className="mt-1.5 space-y-2 text-sm leading-relaxed text-ink-600">
        {children}
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="tap mt-2 -mx-1 px-1 text-sm text-ink-400 active:text-ink-700"
      >
        Got it
      </button>
    </div>
  )
}
