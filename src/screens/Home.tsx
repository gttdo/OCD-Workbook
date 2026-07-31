import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/db'
import { Screen } from '@/components/AppShell'
import { Card, Stat } from '@/components/ui/Card'
import { SyncNotice } from '@/components/SyncNotice'
import { behaviourSummary, formatDuration } from '@/lib/behaviour'
import type { SyncState } from '@/lib/useSync'

export function Home({ syncState }: { syncState: SyncState }) {
  const screenings = useLiveQuery(() => db.screenings.toArray(), [], [])
  const summary = useLiveQuery(() => behaviourSummary(), [], null)

  const hasScreened = screenings.length > 0
  const hasDoneAnything =
    summary != null &&
    (summary.exposures > 0 || summary.compulsionsResisted > 0)

  return (
    <Screen>
      <h1 className="text-2xl font-semibold text-ink-900">
        {hasScreened ? 'Where you are' : 'OCD Workbook'}
      </h1>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
        {hasScreened
          ? 'Practice between sessions. Everything here works offline.'
          : 'Structured homework between sessions. Everything works offline.'}
      </p>

      {/*
        Behaviour leads. What the person DID, never how anxious they are —
        symptom monitoring is the most frequently reported app-induced harm in
        the trial literature, so the anxiety curve lives one tap away under
        Progress rather than on the front page.
      */}
      {/*
        Only non-zero counts appear. A grid of zeros beside a single 1 reads as
        an empty scoreboard, and there is no version of this product where
        someone should open it and be shown everything they have not done.
      */}
      {hasDoneAnything && summary && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          {summary.exposures > 0 && (
            <Stat value={summary.exposures} label="Exposures faced" />
          )}
          {summary.compulsionsResisted > 0 && (
            <Stat
              value={summary.compulsionsResisted}
              label="Compulsions resisted"
            />
          )}
          {summary.secondsReclaimed > 0 && (
            <Stat
              value={formatDuration(summary.secondsReclaimed)}
              label="Time reclaimed"
              hint="vs. your own baseline"
            />
          )}
          {summary.triggersRetired > 0 && (
            <Stat value={summary.triggersRetired} label="Fears retired" />
          )}
        </div>
      )}

      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-ink-500">
          {hasScreened ? 'Pick up where you left off' : 'Start here'}
        </h2>

        {/*
          Practice sits above the ladder on purpose. Asking someone on day one
          to face the thing they are most afraid of is a wall; a small win in
          five minutes is a door.
        */}
        <Card to="/practice">
          <Row
            title="Something small"
            sub="A short experiment in letting things stay unresolved"
          />
        </Card>

        <Card to="/ladder">
          <Row
            title="Your ladder"
            sub="The things you avoid, in your own order"
          />
        </Card>

        <Card to="/screener">
          <Row
            title="Where things stand"
            sub={
              hasScreened
                ? `Last completed ${new Date(screenings.at(-1)!.takenAt).toLocaleDateString()}`
                : 'About five minutes'
            }
          />
        </Card>
      </div>

      <SyncNotice state={syncState} />
    </Screen>
  )
}

function Row({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="font-medium text-ink-900">{title}</div>
        <div className="mt-0.5 text-sm text-ink-500">{sub}</div>
      </div>
      <span aria-hidden className="text-ink-400">
        →
      </span>
    </div>
  )
}
