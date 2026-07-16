import type { TopPrediction } from '../types'
import { formatConfidencePercent, formatSpeciesName } from '../utils'

interface TopPredictionsListProps {
  predictions: TopPrediction[]
}

export function TopPredictionsList({ predictions }: TopPredictionsListProps) {
  return (
    <div className="rounded-2xl border border-forest/10 bg-canvas p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Candidate comparison</h3>
        <span className="text-xs text-muted">Review the alternatives</span>
      </div>
      <ul className="mt-4 space-y-3">
        {predictions.map((prediction, index) => (
          <li key={prediction.species} className="grid grid-cols-[24px_minmax(0,1fr)_48px] items-center gap-2 text-sm">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-paper text-xs font-bold text-sarawak-red">{index + 1}</span>
            <span className="min-w-0 truncate font-medium text-forest">
              {formatSpeciesName(prediction.species)}
            </span>
            <span className="text-right text-xs font-semibold text-forest">
              {formatConfidencePercent(prediction.confidence)}
            </span>
            <div className="col-span-3 h-1.5 overflow-hidden rounded-full bg-paper shadow-inner">
              <div
                className={`h-full rounded-full ${index === 0 ? 'bg-sarawak-red' : 'bg-forest/70'}`}
                style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
