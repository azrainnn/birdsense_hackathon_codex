import { useState } from 'react'
import { fetchSpeciesProfile } from '../api'
import type { SpeciesInfo, SpeciesProfile, TopPrediction } from '../types'
import { formatConfidencePercent, formatSpeciesName } from '../utils'
import { Icon } from './Icon'
import { SpeciesPhoto } from './SpeciesPhoto'

interface TopPredictionsListProps {
  predictions: TopPrediction[]
  species: SpeciesInfo[]
  identified?: boolean
}

export function TopPredictionsList({ predictions, species, identified = true }: TopPredictionsListProps) {
  const [expandedSpecies, setExpandedSpecies] = useState<string | null>(null)
  const [profiles, setProfiles] = useState<Record<string, SpeciesProfile>>({})
  const [loadingSpecies, setLoadingSpecies] = useState<string | null>(null)
  const speciesByName = new Map(species.map((item) => [item.species_name, item]))

  async function toggleDetails(speciesName: string) {
    if (expandedSpecies === speciesName) {
      setExpandedSpecies(null)
      return
    }
    setExpandedSpecies(speciesName)
    if (profiles[speciesName]) return
    setLoadingSpecies(speciesName)
    try {
      const profile = await fetchSpeciesProfile(speciesName)
      setProfiles((current) => ({ ...current, [speciesName]: profile }))
    } finally {
      setLoadingSpecies(null)
    }
  }

  return (
    <section className="rounded-2xl border border-forest/10 bg-canvas p-4" aria-labelledby="candidate-comparison-title">
      <div className="flex items-center justify-between gap-3"><div><h3 id="candidate-comparison-title" className="text-sm font-semibold text-ink">{identified ? 'Candidate comparison' : 'Closest low-confidence candidates'}</h3><p className="mt-0.5 text-xs text-muted">{identified ? 'Compare before confirming' : 'These are clues, not identifications.'}</p></div><span className="rounded-full bg-paper px-2 py-1 text-[10px] font-bold text-sarawak-red">{predictions.length} options</span></div>
      <ul className="mt-4 space-y-3">
        {predictions.map((prediction, index) => {
          const info = speciesByName.get(prediction.species)
          const isExpanded = expandedSpecies === prediction.species
          const profile = profiles[prediction.species]
          const isLoading = loadingSpecies === prediction.species
          return (
            <li key={prediction.species} className={`overflow-hidden rounded-2xl border transition ${isExpanded ? 'border-sarawak-yellow/60 bg-paper shadow-sm' : 'border-transparent bg-paper/60'}`}>
              <div className="p-2.5">
                <div className="flex items-center gap-3">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${index === 0 ? identified ? 'bg-sarawak-red text-white' : 'bg-sarawak-red/15 text-sarawak-red' : 'bg-canvas text-sarawak-red'}`}>{index + 1}</span>
                  <SpeciesPhoto speciesName={prediction.species} scientificName={info?.scientific_name} className="h-11 w-11 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-forest">{formatSpeciesName(prediction.species)}</p>{info && <p className="mt-0.5 truncate text-xs italic text-muted">{info.scientific_name}</p>}</div>
                  <span className="text-xs font-semibold text-forest">{formatConfidencePercent(prediction.confidence)}</span>
                </div>
                <div className="mt-2 flex items-center gap-2"><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-canvas shadow-inner"><div className={`h-full rounded-full ${index === 0 && identified ? 'bg-sarawak-red' : 'bg-forest/70'}`} style={{ width: `${Math.round(prediction.confidence * 100)}%` }} /></div><button type="button" onClick={() => void toggleDetails(prediction.species)} aria-expanded={isExpanded} className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-[11px] font-semibold text-forest hover:bg-leaf">{isExpanded ? 'Hide' : 'Details'} <Icon name="arrow-right" className={`h-3 w-3 transition ${isExpanded ? 'rotate-90' : ''}`} /></button></div>
              </div>
              {isExpanded && <div className="grid gap-3 border-t border-forest/10 bg-leaf/40 p-3 text-xs leading-5 text-forest sm:grid-cols-2"><div><p className="font-bold tracking-[0.12em] text-sarawak-red uppercase">Listen for</p><p className="mt-1">{isLoading ? 'Loading field-guide clues...' : profile?.call_description ?? 'Field-guide details are unavailable for this candidate.'}</p></div><div><p className="font-bold tracking-[0.12em] text-sarawak-red uppercase">Habitat clue</p><p className="mt-1">{isLoading ? 'Loading field-guide clues...' : profile?.habitat ?? 'Use habitat context before treating this as a match.'}</p></div></div>}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
