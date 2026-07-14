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
