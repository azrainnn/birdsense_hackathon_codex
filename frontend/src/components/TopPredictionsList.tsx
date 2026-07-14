import type { TopPrediction } from '../types'
import { formatConfidencePercent, formatSpeciesName } from '../utils'

interface TopPredictionsListProps {
  predictions: TopPrediction[]
}

export function TopPredictionsList({ predictions }: TopPredictionsListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-300">Other candidates</h3>
      <ul className="space-y-2">
        {predictions.map((prediction, index) => (
          <li key={prediction.species} className="flex items-center gap-3 text-sm">
            <span className="w-5 text-gray-500">#{index + 1}</span>
            <span className="w-40 shrink-0 truncate text-gray-200">
              {formatSpeciesName(prediction.species)}
            </span>
            <div className="h-1.5 flex-1 rounded-full bg-white/10">
              <div
                className="h-1.5 rounded-full bg-accent"
                style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
              />
            </div>
            <span className="w-12 shrink-0 text-right text-gray-400">
              {formatConfidencePercent(prediction.confidence)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
