import { useState } from 'react'
import type { PredictionResult, SpeciesInfo, SpeciesProfile } from '../types'
import { formatSpeciesName } from '../utils'
import { ConfidenceBadge } from './ConfidenceBadge'
import { DetectionTimeline } from './DetectionTimeline'
import { FieldActions } from './FieldActions'
import { Icon } from './Icon'
import { SpeciesProfileCard } from './SpeciesProfileCard'
import { SpectrogramView } from './SpectrogramView'
import { TopPredictionsList } from './TopPredictionsList'
import { WindowConfidenceTimeline } from './WindowConfidenceTimeline'

interface ResultsPanelProps {
  result: PredictionResult
  profile?: SpeciesProfile
  species: SpeciesInfo[]
  onReset: () => void
}

const QUALITY_STYLE = {
  Suitable: 'border-signal/30 bg-signal/10 text-signal',
  'Review recommended': 'border-sarawak-yellow-deep/25 bg-sarawak-yellow/20 text-forest',
  'Low confidence': 'border-sarawak-red/25 bg-sarawak-red/10 text-sarawak-red',
}

export function ResultsPanel({ result, profile, species, onReset }: ResultsPanelProps) {
  const [hoveredWindowIndex, setHoveredWindowIndex] = useState<number | null>(null)
  const quality = result.quality
  const qualityStyle = quality ? QUALITY_STYLE[quality.label] : 'border-forest/15 bg-canvas text-forest'

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-3xl border border-forest/10 bg-paper shadow-[0_18px_60px_rgb(9_29_24/8%)]" aria-labelledby="result-title">
        <div className="relative overflow-hidden bg-ink px-6 py-7 text-paper sm:px-8 sm:py-9">
          <div className="relative flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold tracking-[0.15em] text-sarawak-yellow uppercase">Leading candidate</p>
              <h2 id="result-title" className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{formatSpeciesName(result.species)}</h2>
              {profile && <p className="mt-1 text-sm italic text-paper/65">{profile.scientific_name}</p>}
            </div>
            <ConfidenceBadge confidence={result.confidence} />
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.08fr_.92fr]">
          <div className="space-y-5">
            {quality && <div className={`rounded-2xl border p-4 ${qualityStyle}`}><div className="flex gap-3"><Icon name={result.needs_review ? 'alert' : 'check'} className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-semibold">{quality.label}</p><p className="mt-1 text-sm leading-5 opacity-85">{quality.message}</p></div></div></div>}
            <div className="rounded-2xl border border-forest/10 bg-canvas p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-ink">Sound evidence</h3><span className="text-xs font-medium text-muted">Mel spectrogram</span></div>
              <div className="mt-3"><SpectrogramView spectrogramUrl={result.spectrogram_url} alt={`Mel-spectrogram of the uploaded recording, predicted as ${formatSpeciesName(result.species)}`} windows={result.window_predictions} plotBounds={result.spectrogram_plot_bounds} durationSeconds={result.spectrogram_duration_seconds} hoveredIndex={hoveredWindowIndex} /></div>
              <audio controls src={result.audio_url} className="mt-3 h-10 w-full accent-sarawak-red"><track kind="captions" /></audio>
              <div className="mt-4"><WindowConfidenceTimeline windows={result.window_predictions} hoveredIndex={hoveredWindowIndex} onHoverIndexChange={setHoveredWindowIndex} /></div>
            </div>
            <DetectionTimeline events={result.timeline ?? []} />
          </div>
          <div className="space-y-5"><TopPredictionsList predictions={result.top_predictions} /><FieldActions result={result} profile={profile} species={species} /></div>
        </div>
      </section>
      {profile ? <SpeciesProfileCard profile={profile} /> : <div className="rounded-2xl border border-forest/10 bg-paper p-5 text-sm text-muted">Loading the Sarawak field guide…</div>}
      <button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border border-forest/20 bg-paper px-4 py-2.5 text-sm font-semibold text-forest transition hover:border-sarawak-red/40 hover:bg-leaf/50">Analyse another recording <Icon name="arrow-right" className="h-4 w-4" /></button>
    </div>
  )
}
