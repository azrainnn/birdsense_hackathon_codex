import type { SpeciesInfo, TopPrediction } from '../types'
import { formatConfidencePercent, formatSpeciesName } from '../utils'
import { SpeciesPhoto } from './SpeciesPhoto'

interface TopPredictionsListProps {
  predictions: TopPrediction[]
  species: SpeciesInfo[]
}

export function TopPredictionsList({ predictions, species }: TopPredictionsListProps) {
  const speciesByName = new Map(species.map((item) => [item.species_name, item]))
  return (
    <section className="rounded-2xl border border-forest/10 bg-canvas p-4" aria-labelledby="candidate-comparison-title">
      <div className="flex items-center justify-between gap-3"><h3 id="candidate-comparison-title" className="text-sm font-semibold text-ink">Candidate comparison</h3><span className="text-xs text-muted">Review alternatives</span></div>
      <ul className="mt-4 space-y-3">
        {predictions.map((prediction, index) => {
          const info = speciesByName.get(prediction.species)
          return (
            <li key={prediction.species} className={`rounded-xl p-2.5 ${index === 0 ? 'bg-paper shadow-sm' : ''}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? 'bg-sarawak-red text-white' : 'bg-paper text-sarawak-red'}`}>{index + 1}</span>
                <SpeciesPhoto speciesName={prediction.species} scientificName={info?.scientific_name} className="h-11 w-11 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-forest">{formatSpeciesName(prediction.species)}</p>{info && <p className="mt-0.5 truncate text-xs italic text-muted">{info.scientific_name}</p>}</div>
                <span className="text-xs font-semibold text-forest">{formatConfidencePercent(prediction.confidence)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper shadow-inner"><div className={`h-full rounded-full ${index === 0 ? 'bg-sarawak-red' : 'bg-forest/70'}`} style={{ width: `${Math.round(prediction.confidence * 100)}%` }} /></div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
