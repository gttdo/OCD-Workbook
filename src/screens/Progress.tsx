import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Screen } from '@/components/AppShell'
import { Stat } from '@/components/ui/Card'
import { Teach } from '@/components/Teach'
import { HabituationChart } from '@/components/HabituationChart'
import { behaviourSummary, formatDuration } from '@/lib/behaviour'
import { triggerProgress, type TriggerProgress } from '@/lib/progress'

/**
 * Progress.
 *
 * What the person DID comes first and is stated in plain numbers; the distress
 * curve sits underneath, per trigger. That order is the whole point — leading
 * with symptom ratings is the pattern the trial literature associates with
 * app-induced harm.
 */
export function Progress() {
  const summary = useLiveQuery(() => behaviourSummary(), [], null)
  const perTrigger = useLiveQuery(() => triggerProgress(), [], null)

  if (summary == null || perTrigger == null) return null

  const nothingYet =
    summary.exposures === 0 &&
    summary.compulsionsResisted === 0 &&
    perTrigger.length === 0

  if (nothingYet) {
    return (
      <Screen title="Progress">
        <p className="rounded-xl bg-ink-100 p-4 text-sm leading-relaxed text-ink-600">
          Once you have faced an exposure or held off on a compulsion, what you
          have done shows up here.
        </p>
      </Screen>
    )
  }

  return (
    <Screen title="Progress">
      <div className="space-y-8">
        <section>
          <h2 className="mb-3 text-sm font-medium text-ink-500">
            What you have done
          </h2>
          <div className="grid grid-cols-2 gap-3">
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
        </section>

        {perTrigger.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-ink-500">
              Fear by fear
            </h2>
            <div className="space-y-3">
              {perTrigger.map((p) => (
                <TriggerCard key={p.trigger.id} progress={p} />
              ))}
            </div>
          </section>
        )}

        <Teach id="progress-early" title="If the numbers are going up">
          <p>
            Distress often rises for the first week or two. That is not the
            method failing — it usually means you have stopped avoiding, so you
            are meeting things you used to sidestep.
          </p>
          <p>
            The count of what you have done is the more honest measure early on.
            The curve catches up later.
          </p>
        </Teach>
      </div>
    </Screen>
  )
}

function TriggerCard({ progress }: { progress: TriggerProgress }) {
  const { trigger, points, totalSessions, resisted, predictionsMade, overestimated } =
    progress

  return (
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-medium text-ink-900">
          {trigger.label}
        </h3>
        {trigger.status === 'graduated' && (
          <span className="flex-none rounded-full bg-calm-50 px-2 py-0.5 text-xs text-calm-700">
            retired
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-ink-500">
        {totalSessions} {totalSessions === 1 ? 'exposure' : 'exposures'}
        {resisted > 0 && `, held off ${resisted} ${resisted === 1 ? 'time' : 'times'}`}
      </p>

      {/*
        The expectancy-violation line, stated rather than plotted. "You expected
        worse than it was, four times out of five" lands harder than any chart
        of the same numbers, and it is the mechanism modern ERP actually turns on.
      */}
      {predictionsMade > 0 && overestimated > 0 && (
        <p className="mt-3 text-[15px] leading-relaxed text-ink-800">
          It turned out easier than you expected{' '}
          <span className="font-medium">
            {overestimated} of {predictionsMade}
          </span>{' '}
          {predictionsMade === 1 ? 'time' : 'times'}.
        </p>
      )}

      {points.length >= 2 && (
        <div className="mt-3">
          <HabituationChart
            points={points}
            label={trigger.label}
            triggerId={trigger.id}
          />
        </div>
      )}

      {points.length < 2 && totalSessions > 0 && (
        <p className="mt-3 text-sm leading-relaxed text-ink-400">
          A couple more rated sessions and the pattern over time will show here.
        </p>
      )}

      {trigger.status !== 'graduated' && (
        <Link
          to={`/exposure/${trigger.id}`}
          className="tap mt-3 inline-block text-sm text-ink-500 underline
                     decoration-ink-300 underline-offset-4 active:text-ink-800"
        >
          Work on this one again
        </Link>
      )}
    </div>
  )
}
