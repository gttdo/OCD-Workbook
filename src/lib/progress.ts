import { db } from '@/db'
import type { Anxiety, ExposureSession, Trigger } from '@/db/types'

export interface SessionPoint {
  sessionNumber: number
  peak: Anxiety
  predicted: Anxiety | null
  startedAt: string
}

export interface TriggerProgress {
  trigger: Trigger
  /** Only sessions that were completed and rated — the curve's x-axis. */
  points: SessionPoint[]
  totalSessions: number
  /** Sessions where the person held off on the compulsion. */
  resisted: number
  /** Sessions with both a prediction and an outcome. */
  predictionsMade: number
  /** …of those, how many turned out milder than expected. */
  overestimated: number
  /** Average distance between expected and actual, in scale points. */
  averageGap: number | null
}

export async function triggerProgress(): Promise<TriggerProgress[]> {
  const [triggers, sessions] = await Promise.all([
    db.triggers.filter((t) => !t.deletedAt).toArray(),
    db.exposureSessions.filter((s) => !s.deletedAt && !!s.endedAt).toArray(),
  ])

  const byTrigger = new Map<string, ExposureSession[]>()
  for (const s of sessions) {
    if (!s.triggerId) continue
    const list = byTrigger.get(s.triggerId) ?? []
    list.push(s)
    byTrigger.set(s.triggerId, list)
  }

  return triggers
    .map((trigger) => {
      const mine = (byTrigger.get(trigger.id) ?? []).sort((a, b) =>
        a.startedAt.localeCompare(b.startedAt),
      )

      // Session number counts every completed exposure, but only rated ones can
      // be plotted — ratings are optional by design, so the curve has gaps
      // rather than pretending an unrated session did not happen.
      const points: SessionPoint[] = []
      mine.forEach((s, i) => {
        if (s.anxietyPeak == null) return
        points.push({
          sessionNumber: i + 1,
          peak: s.anxietyPeak,
          predicted: s.predictedAnxiety ?? null,
          startedAt: s.startedAt,
        })
      })

      const withPrediction = mine.filter(
        (s) => s.predictedAnxiety != null && s.anxietyPeak != null,
      )
      const overestimated = withPrediction.filter(
        (s) => (s.anxietyPeak as number) < (s.predictedAnxiety as number),
      ).length
      const gaps = withPrediction.map(
        (s) => (s.predictedAnxiety as number) - (s.anxietyPeak as number),
      )

      return {
        trigger,
        points,
        totalSessions: mine.length,
        resisted: mine.filter((s) => s.responsePrevented === true).length,
        predictionsMade: withPrediction.length,
        overestimated,
        averageGap:
          gaps.length > 0
            ? gaps.reduce((a, b) => a + b, 0) / gaps.length
            : null,
      }
    })
    .filter((p) => p.totalSessions > 0)
    .sort((a, b) => b.totalSessions - a.totalSessions)
}
