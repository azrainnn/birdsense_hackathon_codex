import { confidenceLevel, formatConfidencePercent, type ConfidenceLevel } from '../utils'

const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  high: 'bg-green-500/15 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-red-500/15 text-red-400 border-red-500/30',
}

const LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence — verify manually',
}

interface ConfidenceBadgeProps {
  confidence: number
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const level = confidenceLevel(confidence)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${LEVEL_STYLES[level]}`}
    >
      {formatConfidencePercent(confidence)} · {LEVEL_LABELS[level]}
    </span>
  )
}
