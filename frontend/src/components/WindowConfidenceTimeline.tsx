import type { WindowPrediction } from '../types'
import { confidenceLevel, formatConfidencePercent, type ConfidenceLevel } from '../utils'

const LEVEL_FILL: Record<ConfidenceLevel, string> = {
  high: 'bg-green-500',
  medium: 'bg-yellow-500',
  low: 'bg-red-500',
}

interface WindowConfidenceTimelineProps {
  windows: WindowPrediction[]
  hoveredIndex: number | null
  onHoverIndexChange: (index: number | null) => void
}

function formatTimecode(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export function WindowConfidenceTimeline({
  windows,
  hoveredIndex,
  onHoverIndexChange,
}: WindowConfidenceTimelineProps) {
  if (windows.length < 2) {
    return null
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-300">Confidence by window</h3>
      <div className="flex h-14 items-end gap-0.5 rounded-md bg-white/5 p-1">
        {windows.map((window, index) => {
          const level = confidenceLevel(window.confidence)
          const label = `${formatTimecode(window.start_time)}–${formatTimecode(window.end_time)} · ${formatConfidencePercent(window.confidence)}`
          return (
            <button
              key={window.start_time}
              type="button"
              className="flex h-full flex-1 items-end rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              style={{ flexGrow: Math.max(window.end_time - window.start_time, 0.1) }}
              title={label}
              aria-label={label}
              onMouseEnter={() => onHoverIndexChange(index)}
              onFocus={() => onHoverIndexChange(index)}
              onMouseLeave={() => onHoverIndexChange(null)}
              onBlur={() => onHoverIndexChange(null)}
            >
              <div
                className={`w-full rounded-sm transition-[filter] ${LEVEL_FILL[level]} ${
                  hoveredIndex === index ? 'brightness-125' : ''
                }`}
                style={{ height: `${Math.max(window.confidence * 100, 6)}%` }}
              />
            </button>
          )
        })}
      </div>
      <p className="text-xs text-gray-500">
        Each bar is one ~3s window BirdNET analyzed independently. The confidence badge above is
        their mean — hover a bar to see its own timecode, score, and matching stretch on the
        spectrogram.
      </p>
    </div>
  )
}
