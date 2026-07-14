import type { PredictionResult } from '../types'
import { formatSpeciesName } from '../utils'
import { ConfidenceBadge } from './ConfidenceBadge'
import { TopPredictionsList } from './TopPredictionsList'

interface ResultsPanelProps {
  result: PredictionResult
  scientificName?: string
  onReset: () => void
}

export function ResultsPanel({ result, scientificName, onReset }: ResultsPanelProps) {
  return (
    <div className="space-y-6 rounded-xl border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">{formatSpeciesName(result.species)}</h2>
          {scientificName && <p className="text-sm italic text-gray-400">{scientificName}</p>}
        </div>
        <ConfidenceBadge confidence={result.confidence} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-300">Spectrogram</h3>
          <img
            src={result.spectrogram_url}
            alt={`Mel-spectrogram of the uploaded recording, predicted as ${formatSpeciesName(result.species)}`}
            className="w-full rounded-lg border border-border"
          />
          <audio controls src={result.audio_url} className="w-full">
            <track kind="captions" />
          </audio>
        </div>

        <TopPredictionsList predictions={result.top_predictions} />
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-border px-4 py-2 text-sm font-medium text-gray-200 hover:bg-surface-hover"
      >
        Analyze another file
      </button>
    </div>
  )
}
