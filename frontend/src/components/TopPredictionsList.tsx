import { useState } from 'react'
import type { TopPrediction } from '../types'
import { formatConfidencePercent, formatSpeciesName, speciesPhotoPosition } from '../utils'

interface TopPredictionsListProps {
  predictions: TopPrediction[]
}

interface TopPredictionRowProps {
  prediction: TopPrediction
  rank: number
  showPhoto: boolean
}

function TopPredictionRow({ prediction, rank, showPhoto }: TopPredictionRowProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const displayName = formatSpeciesName(prediction.species)

  return (
    <li className="space-y-4 text-sm">
      <div className="flex items-center gap-3">
        <span className="w-5 text-gray-500">#{rank}</span>
        <span className="w-40 shrink-0 truncate text-gray-200">{displayName}</span>
        <div className="h-1.5 flex-1 rounded-full bg-white/10">
          <div
            className="h-1.5 rounded-full bg-accent"
            style={{ width: `${Math.round(prediction.confidence * 100)}%` }}
          />
        </div>
        <span className="w-12 shrink-0 text-right text-gray-400">
          {formatConfidencePercent(prediction.confidence)}
        </span>
      </div>
      {showPhoto && !imageFailed && (
        <img
          src={`/species/${prediction.species}.jpg`}
          alt={displayName}
          className="w-full rounded-lg"
          onError={() => setImageFailed(true)}
        />
      )}
    </li>
  )
}

export function TopPredictionsList({ predictions }: TopPredictionsListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-300">Other candidates</h3>
      <ul className="space-y-4">
        {predictions.map((prediction, index) => (
          <TopPredictionRow
            key={prediction.species}
            prediction={prediction}
            rank={index + 1}
            showPhoto={index === 0}
          />
        ))}
      </ul>
    </div>
  )
}
