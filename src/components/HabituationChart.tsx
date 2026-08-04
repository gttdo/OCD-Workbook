import { useState } from 'react'
import { record } from '@/lib/usage'
import { SoftInterrupt } from '@/components/SoftInterrupt'
import type { SessionPoint } from '@/lib/progress'

/**
 * Peak distress across repeated exposures to one trigger.
 *
 * A single series, so there is no legend — the heading names it. Colour is
 * carried by the mark alone; every number and label stays in text tokens.
 *
 * Deliberately secondary on the page. Symptom monitoring is the most
 * frequently reported app-induced harm in the mental-health-app trial
 * literature, so what the person DID leads and this sits underneath.
 */

const SERIES = '#0d9488' // calm-600 — validated against the light surface
const W = 300
const H = 96
const PAD = { top: 10, right: 10, bottom: 18, left: 22 }

export function HabituationChart({
  points,
  label,
  triggerId,
}: {
  points: SessionPoint[]
  label: string
  triggerId?: string
}) {
  const [active, setActive] = useState<number | null>(null)
  const [opened, setOpened] = useState(0)

  if (points.length < 2) return null

  const innerW = W - PAD.left - PAD.right
  const innerH = H - PAD.top - PAD.bottom
  const maxSession = Math.max(...points.map((p) => p.sessionNumber))

  const x = (n: number) =>
    PAD.left + (maxSession === 1 ? innerW / 2 : ((n - 1) / (maxSession - 1)) * innerW)
  // 1 at the bottom, 10 at the top: higher on the page means more distress.
  const y = (v: number) => PAD.top + innerH - ((v - 1) / 9) * innerH

  const path = points.map((p) => `${x(p.sessionNumber)},${y(p.peak)}`).join(' ')
  const first = points[0]!
  const last = points[points.length - 1]!
  const shown = active != null ? points[active] : null

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Peak distress for ${label} across ${points.length} rated sessions, from ${first.peak} to ${last.peak} out of 10.`}
      >
        {/* Recessive reference lines only — no full grid. */}
        {[1, 5, 10].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="#e2e8f0"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y(v) + 3}
              textAnchor="end"
              fontSize={8}
              fill="#94a3b8"
            >
              {v}
            </text>
          </g>
        ))}

        <polyline
          points={path}
          fill="none"
          stroke={SERIES}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((p, i) => (
          <circle
            key={`mark-${p.startedAt}`}
            cx={x(p.sessionNumber)}
            cy={y(p.peak)}
            r={active === i ? 5 : 4}
            fill={SERIES}
            stroke="#ffffff"
            strokeWidth={2}
            pointerEvents="none"
          />
        ))}

        {/*
          Hit targets, drawn last and invisible. An 8px dot you have to land on
          dead-centre is unusable with a thumb, so the tappable area is far
          larger than the mark it selects.
        */}
        {points.map((p, i) => (
          <circle
            key={`hit-${p.startedAt}`}
            cx={x(p.sessionNumber)}
            cy={y(p.peak)}
            r={14}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => setActive(active === i ? null : i)}
            role="button"
            tabIndex={0}
            aria-label={`Session ${p.sessionNumber}, peaked at ${p.peak} out of 10`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setActive(active === i ? null : i)
              }
            }}
          />
        ))}

        {/*
          Selective direct labels: the ends, never every point. The first is
          nudged right of its mark so it does not sit against the axis label
          and read as one number.
        */}
        <text
          x={x(first.sessionNumber) + 7}
          y={y(first.peak) - 7}
          textAnchor="start"
          fontSize={9}
          fill="#475569"
        >
          {first.peak}
        </text>
        <text
          x={x(last.sessionNumber)}
          y={y(last.peak) - 8}
          textAnchor="end"
          fontSize={9}
          fill="#475569"
        >
          {last.peak}
        </text>
      </svg>

      <figcaption className="mt-1 text-xs text-ink-400">
        {shown
          ? `Session ${shown.sessionNumber}: peaked at ${shown.peak}${
              shown.predicted != null ? `, you expected ${shown.predicted}` : ''
            }`
          : 'Peak distress, session by session. Tap a point for detail.'}
      </figcaption>

      {/*
        The table twin. Tapping a mark must never be the only way to read a
        value — the middle points carry no direct label, so without this they
        would be unreachable by keyboard, screen reader, or print.
      */}
      {/*
        The table has to stay — it is the accessible equivalent of the plot and
        the only way to reach the middle values without tapping. But re-reading
        your own past ratings is structurally a checking paradigm, and repeated
        checking measurably erodes confidence in your own memory. So access is
        kept and the pattern is noticed instead.
      */}
      <details
        className="mt-2"
        onToggle={(e) => {
          if (!(e.currentTarget as HTMLDetailsElement).open || !triggerId) return
          void record('view', 'trigger-numbers', triggerId)
          setOpened((n) => n + 1)
        }}
      >
        <summary className="tap cursor-pointer text-xs text-ink-400 underline decoration-ink-300 underline-offset-4">
          See the numbers
        </summary>

        {triggerId && (
          <div className="mt-2">
            <SoftInterrupt
              entityType="trigger-numbers"
              entityId={triggerId}
              trigger={opened}
            />
          </div>
        )}
        <table className="mt-2 w-full text-left text-xs">
          <thead>
            <tr className="text-ink-400">
              <th scope="col" className="py-1 font-medium">Session</th>
              <th scope="col" className="py-1 font-medium">Expected</th>
              <th scope="col" className="py-1 font-medium">Peaked at</th>
            </tr>
          </thead>
          <tbody className="text-ink-700">
            {points.map((p) => (
              <tr key={`row-${p.startedAt}`} className="border-t border-ink-100">
                <td className="py-1 tabular-nums">{p.sessionNumber}</td>
                <td className="py-1 tabular-nums">{p.predicted ?? '—'}</td>
                <td className="py-1 tabular-nums">{p.peak}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
