import type { TimelineEvent } from '../types'
import { formatConfidencePercent, formatSpeciesName } from '../utils'
import { Icon } from './Icon'

interface DetectionTimelineProps {
  events: TimelineEvent[]
}

export function DetectionTimeline({ events }: DetectionTimelineProps) {
  if (events.length === 0) return null

  const maxEnd = Math.max(...events.map((event) => event.end_seconds), 1)

  return (
    <section className="rounded-2xl border border-forest/10 bg-canvas p-4" aria-labelledby="timeline-title">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-forest text-sarawak-yellow"><Icon name="audio" className="h-4 w-4" /></span>
        <div>
          <h3 id="timeline-title" className="text-sm font-semibold text-ink">Approximate detection timeline</h3>
          <p className="mt-0.5 text-xs leading-5 text-muted">Each bar summarises an internal audio window; it does not localise an individual call precisely.</p>
        </div>
      </div>
      <ol className="mt-4 space-y-2" aria-label="Prediction windows">
        {events.map((event, index) => {
          const width = Math.max(22, (event.end_seconds - event.start_seconds) / maxEnd * 100)
          return (
            <li key={`${event.start_seconds}-${event.species}-${index}`} className="grid grid-cols-[48px_1fr_auto] items-center gap-2 text-xs">
              <span className="font-medium tabular-nums text-muted">{Math.round(event.start_seconds)}–{Math.round(event.end_seconds)}s</span>
              <div className="h-7 overflow-hidden rounded-lg bg-paper shadow-inner">
                <div className="flex h-full min-w-fit items-center rounded-lg bg-forest px-2 text-[11px] font-semibold text-paper" style={{ width: `${width}%` }}>
                  <span className="truncate">{formatSpeciesName(event.species)}</span>
                </div>
              </div>
              <span className="font-medium tabular-nums text-forest">{formatConfidencePercent(event.confidence)}</span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
