import { useEffect, useState } from 'react'
import { fetchSpecies, fetchSpeciesProfile, predictSpecies } from '../api'
import { Icon } from '../components/Icon'
import { ProcessingPanel } from '../components/ProcessingPanel'
import { ResultsPanel } from '../components/ResultsPanel'
import { UploadDropzone } from '../components/UploadDropzone'
import type { PredictionResult, SpeciesInfo, SpeciesProfile } from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

const RECORDING_TIPS = [
  ['Keep it clear', 'A short clip with one dominant bird call produces the most interpretable result.'],
  ['Add context', 'Compare the candidate with habitat, elevation and time of day before treating it as a record.'],
  ['Review uncertainty', 'When BirdSense flags a result, use the alternative candidates or ask an expert.'],
]

export function IdentifyPage() {
  const [species, setSpecies] = useState<SpeciesInfo[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [profile, setProfile] = useState<SpeciesProfile | undefined>()
  const [errorMessage, setErrorMessage] = useState('')
  const [activeFile, setActiveFile] = useState<File | undefined>()

  useEffect(() => {
    fetchSpecies().then(setSpecies).catch(() => setSpecies([]))
  }, [])

  async function handleFileSelected(file: File) {
    setActiveFile(file)
    setStatus('loading')
    setErrorMessage('')
    setResult(null)
    setProfile(undefined)
    try {
      const prediction = await predictSpecies(file)
      setResult(prediction)
      setStatus('success')
      fetchSpeciesProfile(prediction.species).then(setProfile).catch(() => setProfile(undefined))
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong while analysing that recording.')
      setStatus('error')
    }
  }

  function handleReset() {
    setResult(null)
    setProfile(undefined)
    setActiveFile(undefined)
    setStatus('idle')
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-[2rem] border border-forest/10 bg-paper px-6 py-10 text-center shadow-[0_18px_60px_rgb(9_29_24/6%)] sm:px-10 sm:py-14">
        <div aria-hidden="true" className="absolute -top-20 left-1/2 h-48 w-[32rem] -translate-x-1/2 rounded-full bg-sarawak-yellow/20 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Audio identification workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-ink sm:text-5xl">Follow the sound, then verify the story.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-forest/75 sm:text-base">BirdSense compares your audio with its current Bornean bird classifier and gives you evidence to assess the result responsibly.</p>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-5xl">
        {status !== 'success' && status !== 'loading' && <UploadDropzone onFileSelected={handleFileSelected} disabled={false} />}
        {status === 'loading' && <ProcessingPanel fileName={activeFile?.name} fileSize={activeFile?.size} />}

        {status === 'error' && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-sarawak-red/25 bg-sarawak-red/8 p-4 text-sm text-sarawak-red" role="alert">
            <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {status === 'success' && result && <div className="mt-7"><ResultsPanel result={result} profile={profile} species={species} onReset={handleReset} /></div>}
      </div>

      {status !== 'success' && status !== 'loading' && (
        <section className="mx-auto mt-14 max-w-5xl" aria-labelledby="recording-tips-title">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sarawak-yellow text-ink"><Icon name="sparkle" className="h-4 w-4" /></span>
            <div><p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">Better input, better insight</p><h2 id="recording-tips-title" className="text-xl font-semibold text-ink">Make each recording count</h2></div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {RECORDING_TIPS.map(([title, body], index) => (
              <div key={title} className="rounded-2xl border border-forest/10 bg-paper p-5 shadow-[0_10px_28px_rgb(9_29_24/4%)]">
                <p className="text-xs font-bold text-sarawak-red">0{index + 1}</p>
                <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
