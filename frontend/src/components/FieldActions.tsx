import { useState } from 'react'
import { submitFeedback, submitObservation } from '../api'
import type { FieldFeedback, Observation, PredictionResult, SpeciesInfo, SpeciesProfile } from '../types'
import { formatSpeciesName } from '../utils'
import { Icon } from './Icon'

interface FieldActionsProps {
  result: PredictionResult
  profile?: SpeciesProfile
  species: SpeciesInfo[]
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function FieldActions({ result, profile, species }: FieldActionsProps) {
  const [feedbackState, setFeedbackState] = useState<SaveState>('idle')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [showCorrection, setShowCorrection] = useState(false)
  const [correctSpecies, setCorrectSpecies] = useState('')
  const [feedbackNotes, setFeedbackNotes] = useState('')
  const [showObservation, setShowObservation] = useState(false)
  const [observationState, setObservationState] = useState<SaveState>('idle')
  const [observationMessage, setObservationMessage] = useState('')
  const [region, setRegion] = useState('')
  const [observedAt, setObservedAt] = useState('')
  const [habitat, setHabitat] = useState('')
  const [weather, setWeather] = useState('')
  const [observationNotes, setObservationNotes] = useState('')

  async function saveFeedback(verdict: FieldFeedback['verdict']) {
    if (verdict === 'incorrect' && !correctSpecies) {
      setShowCorrection(true)
      return
    }
    setFeedbackState('saving')
    setFeedbackMessage('')
    try {
      await submitFeedback({
        prediction_id: result.id,
        species: result.species,
        verdict,
        correct_species: verdict === 'incorrect' ? correctSpecies : undefined,
        notes: feedbackNotes || undefined,
      })
      setFeedbackState('saved')
      setFeedbackMessage('Thanks — your verification has been saved for review.')
      setShowCorrection(false)
    } catch (error: unknown) {
      setFeedbackState('error')
      setFeedbackMessage(error instanceof Error ? error.message : 'Could not save feedback.')
    }
  }

  async function saveObservation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setObservationState('saving')
    setObservationMessage('')
    const observation: Observation = {
      species: result.species,
      region: region || undefined,
      observed_at: observedAt || undefined,
      habitat: habitat || undefined,
      weather: weather || undefined,
      notes: observationNotes || undefined,
      confidence: result.confidence,
    }
    try {
      await submitObservation(observation)
      setObservationState('saved')
      setObservationMessage('Saved as a broad-region field note. No exact coordinates were stored.')
    } catch (error: unknown) {
      setObservationState('error')
      setObservationMessage(error instanceof Error ? error.message : 'Could not save the field note.')
    }
  }

  return (
    <section className="rounded-2xl border border-forest/10 bg-paper p-5" aria-labelledby="field-actions-title">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sarawak-yellow text-ink"><Icon name="shield" className="h-5 w-5" /></span>
        <div>
          <h3 id="field-actions-title" className="text-base font-semibold text-ink">Make this result more useful</h3>
          <p className="mt-1 text-sm leading-5 text-muted">A model result becomes a field record only after human verification.</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => saveFeedback('confirmed')} disabled={feedbackState === 'saving'} className="inline-flex items-center gap-2 rounded-xl bg-forest px-3.5 py-2 text-sm font-semibold text-paper transition hover:bg-moss disabled:opacity-60">
          <Icon name="check" className="h-4 w-4" /> Confirm match
        </button>
        <button type="button" onClick={() => setShowCorrection((value) => !value)} disabled={feedbackState === 'saving'} className="inline-flex items-center gap-2 rounded-xl border border-sarawak-red/30 px-3.5 py-2 text-sm font-semibold text-sarawak-red transition hover:bg-sarawak-red/5 disabled:opacity-60">
          <Icon name="alert" className="h-4 w-4" /> Needs correction
        </button>
        <button type="button" onClick={() => saveFeedback('unsure')} disabled={feedbackState === 'saving'} className="rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-forest transition hover:bg-canvas disabled:opacity-60">
          I’m unsure
        </button>
      </div>

      {showCorrection && (
        <div className="mt-4 rounded-xl border border-sarawak-red/20 bg-sarawak-red/5 p-4">
          <label className="block text-xs font-bold tracking-[0.12em] text-sarawak-red uppercase" htmlFor="correct-species">What is the better match?</label>
          <select id="correct-species" value={correctSpecies} onChange={(event) => setCorrectSpecies(event.target.value)} className="mt-2 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink">
            <option value="">Choose a BirdSense species</option>
            {species.filter((item) => item.species_name !== result.species).map((item) => <option key={item.species_name} value={item.species_name}>{formatSpeciesName(item.species_name)}</option>)}
          </select>
          <label className="mt-3 block text-xs font-semibold text-forest" htmlFor="feedback-notes">Optional note</label>
          <textarea id="feedback-notes" value={feedbackNotes} onChange={(event) => setFeedbackNotes(event.target.value)} rows={2} maxLength={1000} placeholder="What led you to the correction?" className="mt-1.5 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted/70" />
          <button type="button" onClick={() => saveFeedback('incorrect')} disabled={!correctSpecies || feedbackState === 'saving'} className="mt-3 rounded-lg bg-sarawak-red px-3 py-2 text-sm font-semibold text-white hover:bg-sarawak-red-dark disabled:cursor-not-allowed disabled:opacity-50">Save correction</button>
        </div>
      )}

      {feedbackMessage && <p role="status" className={`mt-3 text-sm ${feedbackState === 'error' ? 'text-sarawak-red' : 'text-signal'}`}>{feedbackMessage}</p>}

      <div className="mt-5 border-t border-line pt-5">
        <button type="button" onClick={() => setShowObservation((value) => !value)} className="inline-flex items-center gap-2 text-sm font-semibold text-forest hover:text-sarawak-red">
          <Icon name="location" className="h-4 w-4" />
          {showObservation ? 'Hide field note' : 'Add a privacy-safe field note'}
        </button>
        {showObservation && (
          <form className="mt-4 space-y-3" onSubmit={saveObservation}>
            <p className="text-xs leading-5 text-muted">BirdSense records only a broad Sarawak region; it never asks for exact coordinates.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-forest" htmlFor="observation-region">
                Broad region
                <select id="observation-region" value={region} onChange={(event) => setRegion(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal text-ink">
                  <option value="">Not specified</option>
                  {(profile?.range_regions ?? []).map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-forest" htmlFor="observed-at">
                Date and time (optional)
                <input id="observed-at" type="datetime-local" value={observedAt} onChange={(event) => setObservedAt(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal text-ink" />
              </label>
              <label className="text-xs font-semibold text-forest" htmlFor="observation-habitat">
                Habitat context
                <select id="observation-habitat" value={habitat} onChange={(event) => setHabitat(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal text-ink">
                  <option value="">Not specified</option>
                  {['Primary forest', 'Secondary forest', 'Forest edge', 'Riverine forest', 'Gardens or settlement', 'Unknown'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold text-forest" htmlFor="observation-weather">
                Weather
                <select id="observation-weather" value={weather} onChange={(event) => setWeather(event.target.value)} className="mt-1.5 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal text-ink">
                  <option value="">Not specified</option>
                  {['Clear', 'Overcast', 'Light rain', 'Heavy rain', 'Windy', 'Unknown'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
            </div>
            <label className="block text-xs font-semibold text-forest" htmlFor="observation-notes">
              Field note (optional)
              <textarea id="observation-notes" value={observationNotes} onChange={(event) => setObservationNotes(event.target.value)} rows={2} maxLength={1000} placeholder="Habitat, weather or other context — do not include exact locations." className="mt-1.5 w-full resize-y rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal text-ink placeholder:text-muted/70" />
            </label>
            <button type="submit" disabled={observationState === 'saving'} className="rounded-lg bg-sarawak-yellow px-3 py-2 text-sm font-semibold text-ink hover:bg-sarawak-yellow-deep hover:text-paper disabled:opacity-60">Save field note</button>
            {observationMessage && <p role="status" className={`text-sm ${observationState === 'error' ? 'text-sarawak-red' : 'text-signal'}`}>{observationMessage}</p>}
          </form>
        )}
      </div>
    </section>
  )
}
