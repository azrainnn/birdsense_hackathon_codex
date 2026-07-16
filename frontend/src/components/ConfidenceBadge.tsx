import { confidenceLevel, formatConfidencePercent, type ConfidenceLevel } from '../utils'

const LEVEL_STYLES: Record<ConfidenceLevel, string> = {
  high: 'border-signal/25 bg-signal/10 text-signal',
  medium: 'border-sarawak-yellow-deep/25 bg-sarawak-yellow/20 text-forest',
  low: 'border-sarawak-red/25 bg-sarawak-red/10 text-sarawak-red',
}

const LEVEL_LABELS: Record<ConfidenceLevel, string> = {
  high: 'Strong signal',
  medium: 'Review context',
  low: 'Verify manually',
}

interface ConfidenceBadgeProps {
  confidence: number
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const level = confidenceLevel(confidence)

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${LEVEL_STYLES[level]}`}
    >
      {formatConfidencePercent(confidence)} · {LEVEL_LABELS[level]}
    </span>
  )
}
