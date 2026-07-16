const SPECIES_PHOTO_POSITION_OVERRIDES: Record<string, string> = {
  'blue-eared_barbet': '35% 45%',
  'greater_racket-tailed_drongo': '60% 22%',
  'bornean_treepie': '35% 30%',
  'rufous-crowned_babbler': '50% 30%',
  'rhinoceros_hornbill': '42% 35%',
}

export function speciesPhotoPosition(speciesName: string): string {
  return SPECIES_PHOTO_POSITION_OVERRIDES[speciesName] ?? 'center'
}

export function formatSpeciesName(speciesName: string): string {
  return speciesName
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatConfidencePercent(confidence: number): string {
  return `${Math.round(confidence * 100)}%`
}

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.8) return 'high'
  if (confidence >= 0.5) return 'medium'
  return 'low'
}

export function formatTimestamp(isoLikeSqlTimestamp: string): string {
  const isoString = isoLikeSqlTimestamp.replace(' ', 'T') + 'Z'
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}
