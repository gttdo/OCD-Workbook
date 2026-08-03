import { NavLink, Outlet } from 'react-router-dom'

/**
 * The shell exists only on top-level destinations. Exercise flows and — above
 * all — live exposures render without it: navigation chrome during an exposure
 * is an invitation to escape, and escaping is the behaviour the whole method
 * is trying to interrupt.
 */

interface Destination {
  to: string
  label: string
  icon: JSX.Element
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const DESTINATIONS: Destination[] = [
  {
    to: '/home',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path {...stroke} d="M4 11l8-6 8 6M6 10v9h12v-9" />
      </svg>
    ),
  },
  {
    to: '/ladder',
    label: 'Ladder',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path {...stroke} d="M7 3v18M17 3v18M7 7h10M7 12h10M7 17h10" />
      </svg>
    ),
  },
  {
    to: '/progress',
    label: 'Progress',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path {...stroke} d="M4 19h16M7 16V9M12 16v-4M17 16V6" />
      </svg>
    ),
  },
  {
    to: '/more',
    label: 'More',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden>
        <path {...stroke} d="M5 12h.01M12 12h.01M19 12h.01" />
      </svg>
    ),
  },
]

export function AppShell() {
  return (
    <div className="min-h-screen sm:flex">
      {/* Desktop: a quiet rail. Mobile: nothing here. */}
      <nav
        aria-label="Main"
        className="hidden sm:flex sm:w-56 sm:flex-col sm:gap-1 sm:border-r sm:border-ink-200 sm:p-4"
      >
        <div className="mb-4 px-3 py-2 text-sm font-semibold text-ink-900">
          OCD Workbook
        </div>
        {DESTINATIONS.map((d) => (
          <NavLink
            key={d.to}
            to={d.to}
            end={d.to === '/home'}
            className={({ isActive }) =>
              [
                'tap flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-ink-100 font-medium text-ink-900'
                  : 'text-ink-500 hover:bg-ink-50',
              ].join(' ')
            }
          >
            {d.icon}
            {d.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1 pb-20 sm:pb-0">
        <Outlet />
      </main>

      {/* Mobile: bottom bar, thumb-reachable, clear of the home indicator. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-10 flex border-t border-ink-200 bg-white/95
                   pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        {DESTINATIONS.map((d) => (
          <NavLink
            key={d.to}
            to={d.to}
            end={d.to === '/home'}
            className={({ isActive }) =>
              [
                'tap flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors',
                isActive ? 'text-ink-900' : 'text-ink-400',
              ].join(' ')
            }
          >
            {d.icon}
            {d.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

/** Consistent page padding and reading width for every screen. */
export function Screen({
  title,
  intro,
  children,
}: {
  title?: string
  intro?: string
  children: React.ReactNode
}) {
  return (
    <div className="animate-fade-up mx-auto w-full max-w-xl px-4 pb-12 pt-8 sm:px-6 sm:pt-10">
      {title && (
        <h1 className="text-2xl font-semibold text-ink-900">{title}</h1>
      )}
      {intro && (
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">{intro}</p>
      )}
      <div className={title ? 'mt-8' : ''}>{children}</div>
    </div>
  )
}
