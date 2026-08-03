import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
  to?: string
  className?: string
}

export function Card({ children, to, className = '' }: Props) {
  const base = `rounded-xl border border-ink-200 bg-white p-4 shadow-card transition-shadow ${className}`
  if (to) {
    return (
      <Link to={to} className={`tap block ${base} hover:shadow-lift active:bg-ink-50`}>
        {children}
      </Link>
    )
  }
  return <div className={base}>{children}</div>
}

/**
 * A single number with a label. Deliberately unadorned — no trend arrows, no
 * percentage deltas, no colour coding. These count what a person did, and
 * dressing them up would turn them into a score.
 */
export function Stat({
  value,
  label,
  hint,
}: {
  value: string | number
  label: string
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card">
      {/*
        Proportional figures, not tabular. Equal-width digits make a large
        standalone number look loose; tabular belongs where numbers align
        vertically, like table rows and axis ticks.
      */}
      <div className="text-2xl font-semibold text-ink-900">{value}</div>
      <div className="mt-0.5 text-sm text-ink-600">{label}</div>
      {hint && <div className="mt-1 text-xs text-ink-400">{hint}</div>}
    </div>
  )
}
