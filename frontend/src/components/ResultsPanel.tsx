import { useState } from 'react'
import type { PredictionResult, SpeciesInfo, SpeciesProfile } from '../types'
import { formatSpeciesName } from '../utils'
import { ConfidenceScore } from './ConfidenceScore'
import { DetectionTimeline } from './DetectionTimeline'
import { FieldActions } from './FieldActions'
import { Icon } from './Icon'
import { SpeciesProfileCard } from './SpeciesProfileCard'
import { SpeciesPhoto } from './SpeciesPhoto'
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
  'Unable to identify': 'border-sarawak-red/35 bg-sarawak-red/10 text-sarawak-red',
}

function NextSteps({ identified }: { identified: boolean }) {
  const steps = identified
    ? [['Listen again', 'Replay the recording and inspect the spectrogram.'], ['Compare context', 'Open candidate details and check habitat clues.'], ['Verify carefully', 'Confirm or save a broad field note only when the evidence fits.']]
    : [['Try another clip', 'Record 5 to 20 seconds with one clear, nearby call.'], ['Reduce competing sound', 'Move away from traffic, wind, insects or overlapping calls.'], ['Treat alternatives as clues', 'The listed candidates are not a species identification.']]
  return <section className="rounded-2xl border border-forest/10 bg-paper p-5" aria-labelledby="next-steps-title"><p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">What to do next</p><h3 id="next-steps-title" className="mt-1 text-base font-semibold text-ink">{identified ? 'Turn a result into a careful observation.' : 'Give the next recording a better chance.'}</h3><ol className="mt-4 space-y-3">{steps.map(([title, body], index) => <li key={title} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf text-[11px] font-bold text-forest">{index + 1}</span><div><p className="text-sm font-semibold text-forest">{title}</p><p className="mt-0.5 text-xs leading-5 text-muted">{body}</p></div></li>)}</ol></section>
}

export function ResultsPanel({ result, profile, species, onReset }: ResultsPanelProps) {
  const [hoveredWindowIndex, setHoveredWindowIndex] = useState<number | null>(null)
  const identified = result.is_identified ?? result.confidence > 0.4
  const quality = result.quality
  const qualityStyle = quality ? QUALITY_STYLE[quality.label] : 'border-forest/15 bg-canvas text-forest'
  const title = identified ? formatSpeciesName(result.species) : 'Unable to identify a bird species'
  const qualityLabel = quality?.label ?? (identified ? 'Review context' : 'Cannot identify')

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[2rem] border border-forest/10 bg-paper shadow-[0_20px_70px_rgb(9_29_24/9%)]" aria-labelledby="result-title">
        <div className={`relative overflow-hidden px-5 py-6 text-paper sm:px-8 sm:py-8 ${identified ? 'bg-ink' : 'bg-[linear-gradient(135deg,#42141a,#091d18)]'}`}>
          <div aria-hidden="true" className={`absolute -top-20 -right-12 h-56 w-56 rounded-full blur-3xl ${identified ? 'bg-sarawak-yellow/20' : 'bg-sarawak-red/30'}`} />
          <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-2xl"><p className={`text-xs font-bold tracking-[0.15em] uppercase ${identified ? 'text-sarawak-yellow' : 'text-sarawak-yellow/90'}`}>{identified ? 'Leading candidate' : 'No confident identification'}</p><h2 id="result-title" className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">{title}</h2>{identified && profile && <p className="mt-1 text-sm italic text-paper/65">{profile.scientific_name}</p>}<p className="mt-3 text-sm leading-6 text-paper/70">{identified ? 'Use the score as a review cue, then compare the sound, alternatives and field context.' : 'The top score did not clear BirdSense’s 40% identification threshold. No species has been identified from this recording.'}</p></div>
            <div className="flex flex-wrap items-start gap-3"><button type="button" onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border border-paper/25 bg-paper/8 px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-paper hover:text-ink">Analyse another recording <Icon name="arrow-right" className="h-4 w-4" /></button><ConfidenceScore confidence={result.confidence} identified={identified} label={qualityLabel} />{identified && profile && <SpeciesPhoto speciesName={result.species} scientificName={profile.scientific_name} className="hidden h-[5.6rem] w-32 rounded-2xl border border-paper/15 sm:block" />}</div>
          </div>
        </div>

        <div className="sticky top-[4.65rem] z-20 flex flex-col gap-3 border-b border-forest/10 bg-paper/95 px-5 py-3 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between sm:px-7"><div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-leaf text-forest"><Icon name="audio" className="h-4 w-4" /></span><div><p className="text-xs font-bold text-forest">Recording evidence</p><p className="text-[11px] text-muted">Keep listening as you compare.</p></div></div><audio controls src={result.audio_url} className="h-9 w-full accent-sarawak-red sm:w-80"><track kind="captions" /></audio></div>

        <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.08fr_.92fr]">
          <div className="space-y-5">
            {quality && <div className={`rounded-2xl border p-4 ${qualityStyle}`}><div className="flex gap-3"><Icon name={!identified || result.needs_review ? 'alert' : 'check'} className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="text-sm font-semibold">{quality.label}</p><p className="mt-1 text-sm leading-5 opacity-85">{quality.message}</p></div></div></div>}
            <div className="rounded-2xl border border-forest/10 bg-canvas p-4"><div className="flex items-center justify-between gap-3"><h3 className="text-sm font-semibold text-ink">Sound evidence</h3><span className="text-xs font-medium text-muted">Mel spectrogram</span></div><div className="mt-3"><SpectrogramView spectrogramUrl={result.spectrogram_url} alt="Mel spectrogram of the recording" windows={result.window_predictions} plotBounds={result.spectrogram_plot_bounds} durationSeconds={result.spectrogram_duration_seconds} hoveredIndex={hoveredWindowIndex} /></div><div className="mt-4"><WindowConfidenceTimeline windows={result.window_predictions} hoveredIndex={hoveredWindowIndex} onHoverIndexChange={setHoveredWindowIndex} /></div></div>
            {identified && <DetectionTimeline events={result.timeline ?? []} />}
          </div>
          <aside className="space-y-5"><TopPredictionsList predictions={result.top_predictions} species={species} identified={identified} /><NextSteps identified={identified} />{identified && <FieldActions result={result} profile={profile} species={species} />}</aside>
        </div>
      </section>
      {identified && (profile ? <SpeciesProfileCard profile={profile} /> : <div className="rounded-2xl border border-forest/10 bg-paper p-5 text-sm text-muted">Loading the Sarawak field guide...</div>)}
    </div>
  )
}
