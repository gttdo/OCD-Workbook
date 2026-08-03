/**
 * The OCD cycle, drawn as a loop that closes.
 *
 * This is the single most important idea in the app, and it was six text
 * cards. The turn — relief is what makes the fear louder — only really lands
 * when you can see the arrow go back to the start, so the diagram builds one
 * step at a time alongside the prose and closes on the last beat.
 *
 * SVG and CSS rather than a Lottie runtime: about 2kB instead of ~250kB on an
 * app someone opens mid-distress, and the existing prefers-reduced-motion rule
 * already flattens every transition here for free.
 */

const NODES = [
  { short: 'Trigger' },
  { short: 'Thought' },
  { short: 'Anxiety' },
  { short: 'Compulsion' },
  { short: 'Relief' },
]

const SIZE = 260
const C = SIZE / 2
const R = 88
const NODE_R = 26

/** Evenly spaced from the top, clockwise. */
function pointAt(index: number, radius = R) {
  const angle = (-90 + index * (360 / NODES.length)) * (Math.PI / 180)
  return { x: C + radius * Math.cos(angle), y: C + radius * Math.sin(angle) }
}

/** An arc hugging the circle, inset at both ends so it never touches a node. */
function arcBetween(from: number, to: number) {
  const step = 360 / NODES.length
  const inset = 17
  const a1 = (-90 + from * step + inset) * (Math.PI / 180)
  const a2 = (-90 + to * step - inset) * (Math.PI / 180)
  const p1 = { x: C + R * Math.cos(a1), y: C + R * Math.sin(a1) }
  const p2 = { x: C + R * Math.cos(a2), y: C + R * Math.sin(a2) }
  return `M ${p1.x} ${p1.y} A ${R} ${R} 0 0 1 ${p2.x} ${p2.y}`
}

export function CycleDiagram({ shown }: { shown: number }) {
  // `shown` counts revealed prose stages, 1–6. The sixth is the closing arrow.
  const closed = shown >= NODES.length + 1

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto w-full max-w-[260px]"
      role="img"
      aria-label={
        closed
          ? 'A closed loop: trigger, thought, anxiety, compulsion, relief, and back to trigger — louder each time.'
          : `The cycle so far: ${NODES.slice(0, shown).map((n) => n.short).join(', ')}.`
      }
    >
      <defs>
        <marker
          id="cycle-arrow"
          viewBox="0 0 8 8"
          refX="6"
          refY="4"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 1 L6 4 L0 7 z" fill="currentColor" />
        </marker>
      </defs>

      {NODES.map((_, i) => {
        const next = (i + 1) % NODES.length
        const isClosing = i === NODES.length - 1
        // Arcs between revealed nodes; the closing one waits for the last beat.
        const visible = isClosing ? closed : shown > i + 1
        return (
          <path
            key={`arc-${i}`}
            d={arcBetween(i, next === 0 ? NODES.length : next)}
            fill="none"
            stroke={isClosing ? '#0f172a' : '#cbd5e1'}
            strokeWidth={isClosing ? 2.5 : 1.75}
            markerEnd="url(#cycle-arrow)"
            className={[
              'transition-opacity duration-500 ease-out',
              isClosing ? 'text-ink-900' : 'text-ink-300',
              visible ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
          />
        )
      })}

      {NODES.map((node, i) => {
        const p = pointAt(i)
        const revealed = shown > i
        const isRelief = i === NODES.length - 1
        return (
          <g
            key={node.short}
            className={[
              'transition-all duration-500 ease-out',
              revealed ? 'opacity-100' : 'opacity-0',
            ].join(' ')}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={NODE_R}
              fill={isRelief && closed ? '#0f172a' : '#ffffff'}
              stroke={isRelief && closed ? '#0f172a' : '#cbd5e1'}
              strokeWidth={1.5}
            />
            <text
              x={p.x}
              y={p.y + 3}
              textAnchor="middle"
              fontSize={9}
              fontWeight={500}
              fill={isRelief && closed ? '#ffffff' : '#334155'}
            >
              {node.short}
            </text>
          </g>
        )
      })}

      {/* The point of the whole diagram, and it only appears once it closes. */}
      <text
        x={C}
        y={C - 4}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#0f172a"
        className={[
          'transition-opacity duration-700 ease-out',
          closed ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        louder
      </text>
      <text
        x={C}
        y={C + 10}
        textAnchor="middle"
        fontSize={11}
        fontWeight={600}
        fill="#0f172a"
        className={[
          'transition-opacity duration-700 ease-out',
          closed ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
      >
        every time
      </text>
    </svg>
  )
}
