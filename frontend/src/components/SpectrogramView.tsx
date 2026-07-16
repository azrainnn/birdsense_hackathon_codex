import type { SpectrogramPlotBounds, WindowPrediction } from '../types'
import { confidenceLevel, type ConfidenceLevel } from '../utils'

const LEVEL_OVERLAY: Record<ConfidenceLevel, string> = {
  high: 'border-green-400 bg-green-400/20',
  medium: 'border-yellow-400 bg-yellow-400/20',
  low: 'border-red-400 bg-red-400/20',
}

interface SpectrogramViewProps {
  spectrogramUrl: string
  alt: string
  windows: WindowPrediction[]
  plotBounds: SpectrogramPlotBounds
  durationSeconds: number
  hoveredIndex: number | null
}

export function SpectrogramView({
  spectrogramUrl,
  alt,
  windows,
  plotBounds,
  durationSeconds,
  hoveredIndex,
}: SpectrogramViewProps) {
  const plotWidthPercent = 100 - plotBounds.left - plotBounds.right

  function timeToLeftPercent(seconds: number): number {
    if (durationSeconds <= 0) {
      return plotBounds.left
    }
    return plotBounds.left + (seconds / durationSeconds) * plotWidthPercent
  }

  const hoveredWindow = hoveredIndex !== null ? windows[hoveredIndex] : undefined

  return (
    <div className="relative overflow-hidden rounded-lg border border-border">
      <img src={spectrogramUrl} alt={alt} className="block w-full" />
      {hoveredWindow && (
        <div
          className={`pointer-events-none absolute rounded-sm border-2 ${LEVEL_OVERLAY[confidenceLevel(hoveredWindow.confidence)]}`}
          style={{
            left: `${timeToLeftPercent(hoveredWindow.start_time)}%`,
            width: `${timeToLeftPercent(hoveredWindow.end_time) - timeToLeftPercent(hoveredWindow.start_time)}%`,
            top: `${plotBounds.top}%`,
            bottom: `${plotBounds.bottom}%`,
          }}
        />
      )}
    </div>
  )
}
