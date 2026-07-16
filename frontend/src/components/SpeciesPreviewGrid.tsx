import { useState } from 'react'
import type { SpeciesInfo } from '../types'
import { formatSpeciesName, speciesPhotoPosition } from '../utils'

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

interface SpeciesTileProps {
  item: SpeciesInfo
  colorClass: string
}

function SpeciesTile({ item, colorClass }: SpeciesTileProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const displayName = formatSpeciesName(item.species_name)

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {imageFailed ? (
        <div
          className={`flex h-28 items-center justify-center bg-gradient-to-br text-2xl font-semibold text-white/80 ${colorClass}`}
        >
          {displayName.charAt(0)}
        </div>
      ) : (
        <img
          src={`/species/${item.species_name}.jpg`}
          alt={displayName}
          className="h-28 w-full object-cover"
          style={{ objectPosition: speciesPhotoPosition(item.species_name) }}
          onError={() => setImageFailed(true)}
        />
      )}
      <div className="p-3">
        <p className="truncate text-sm font-medium text-white">{displayName}</p>
        <p className="truncate text-xs italic text-gray-400">{item.scientific_name}</p>
      </div>
    </div>
  )
}

export function SpeciesPreviewGrid({ species }: SpeciesPreviewGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {species.map((item, index) => (
        <SpeciesTile key={item.species_name} item={item} colorClass={TILE_COLORS[index % TILE_COLORS.length]} />
      ))}
    </div>
  )
}
