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
      {hasDoneAnything && summary && (
        <div className="mt-8 grid grid-cols-2 gap-3">
          <Stat value={summary.exposures} label="Exposures faced" />
          <Stat
            value={summary.compulsionsResisted}
            label="Compulsions resisted"
          />
          <Stat
            value={formatDuration(summary.secondsReclaimed)}
            label="Time reclaimed"
            hint="vs. your own baseline"
          />
          <Stat value={summary.triggersRetired} label="Fears retired" />
        </div>
      )}

      <div className="mt-8 space-y-3">
        <h2 className="text-sm font-medium text-ink-500">
          {hasScreened ? 'Pick up where you left off' : 'Start here'}
        </h2>

        <Card to="/screener">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium text-ink-900">Where things stand</div>
              <div className="mt-0.5 text-sm text-ink-500">
                {hasScreened
                  ? `Last completed ${new Date(screenings.at(-1)!.takenAt).toLocaleDateString()}`
                  : 'About five minutes'}
              </div>
            </div>
            <span aria-hidden className="text-ink-400">
              →
            </span>
          </div>
        </Card>
      </div>

      <SyncNotice state={syncState} />
    </Screen>
  )
}
