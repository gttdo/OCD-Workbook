import { Screen } from '@/components/AppShell'

/**
 * Honest placeholders. An empty destination that says what will live there
 * beats one that pretends to be finished.
 */
export function Progress() {
  return (
    <Screen
      title="Progress"
      intro="What you have done, and what has changed because of it."
    >
      <Empty>
        Once you have logged a few exposures, this is where the detail lives —
        including how your distress has moved across repetitions.
      </Empty>
    </Screen>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-500">
      {children}
    </p>
  )
}
