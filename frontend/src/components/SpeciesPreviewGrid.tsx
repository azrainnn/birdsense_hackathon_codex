import type { SpeciesInfo } from '../types'
import { formatSpeciesName } from '../utils'

const TILE_COLORS = [
  'from-purple-500/40 to-purple-900/40',
  'from-emerald-500/40 to-emerald-900/40',
  'from-amber-500/40 to-amber-900/40',
  'from-sky-500/40 to-sky-900/40',
  'from-rose-500/40 to-rose-900/40',
]

interface SpeciesPreviewGridProps {
  species: SpeciesInfo[]
}

export function SpeciesPreviewGrid({ species }: SpeciesPreviewGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {species.map((item, index) => (
        <div
          key={item.species_name}
          className="overflow-hidden rounded-xl border border-border bg-surface"
        >
          <div
            className={`flex h-20 items-center justify-center bg-gradient-to-br text-2xl font-semibold text-white/80 ${
              TILE_COLORS[index % TILE_COLORS.length]
            }`}
          >
            {formatSpeciesName(item.species_name).charAt(0)}
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-medium text-white">
              {formatSpeciesName(item.species_name)}
            </p>
            <p className="truncate text-xs italic text-gray-400">{item.scientific_name}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
