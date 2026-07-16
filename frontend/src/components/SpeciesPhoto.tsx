import { SPECIES_PHOTOS } from '../speciesMedia'
import { formatSpeciesName, speciesPhotoPosition } from '../utils'

interface SpeciesPhotoProps {
  speciesName: string
  scientificName?: string
  className?: string
  priority?: boolean
  showAttribution?: boolean
}

export function SpeciesPhoto({ speciesName, className = '', priority = false, showAttribution = false }: SpeciesPhotoProps) {
  const photo = SPECIES_PHOTOS[speciesName]
  const displayName = formatSpeciesName(speciesName)

  if (!photo) {
    return <div className={`relative overflow-hidden bg-[radial-gradient(circle_at_65%_35%,rgb(245_200_66/70%),transparent_22%),linear-gradient(135deg,#123d32,#091d18)] ${className}`} role="img" aria-label={`${displayName} image placeholder`}><span aria-hidden="true" className="absolute right-5 bottom-[-0.25em] text-7xl font-semibold tracking-[-0.12em] text-paper/85">{displayName.charAt(0)}</span></div>
  }

  return (
    <div className={`relative overflow-hidden bg-forest ${className}`}>
      <img src={photo.src} alt={displayName} className="h-full w-full object-cover transition duration-700 hover:scale-105" style={{ objectPosition: speciesPhotoPosition(speciesName) }} loading={priority ? 'eager' : 'lazy'} />
      {showAttribution && <a href={photo.source} target="_blank" rel="noreferrer" className="absolute right-2 bottom-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-ink/70 px-2 py-1 text-[10px] font-semibold text-paper/90 backdrop-blur hover:bg-ink">Photo: {photo.credit} · {photo.license}</a>}
    </div>
  )
}
