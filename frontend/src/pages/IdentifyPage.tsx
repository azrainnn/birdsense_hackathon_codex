import { useEffect, useState } from 'react'
import { fetchSpecies, predictSpecies } from '../api'
import { ResultsPanel } from '../components/ResultsPanel'
import { SpeciesPreviewGrid } from '../components/SpeciesPreviewGrid'
import { UploadDropzone } from '../components/UploadDropzone'
import type { PredictionResult, SpeciesInfo } from '../types'

type Status = 'idle' | 'loading' | 'success' | 'error'

export function IdentifyPage() {
  const [species, setSpecies] = useState<SpeciesInfo[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<PredictionResult | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetchSpecies()
      .then(setSpecies)
      .catch(() => setSpecies([]))
  }, [])

  async function handleFileSelected(file: File) {
    setStatus('loading')
    setErrorMessage('')
    try {
      const prediction = await predictSpecies(file)
      setResult(prediction)
      setStatus('success')
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : 'Something went wrong')
      setStatus('error')
    }
  }

  function handleReset() {
    setResult(null)
    setStatus('idle')
    setErrorMessage('')
  }

  const scientificName = result
    ? species.find((item) => item.species_name === result.species)?.scientific_name
    : undefined

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
      <UploadDropzone onFileSelected={handleFileSelected} disabled={status === 'loading'} />

      {status === 'loading' && (
        <p className="text-center text-sm text-gray-400">Analyzing recording…</p>
      )}

      {status === 'error' && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
          {errorMessage}
        </p>
      )}

      {status === 'success' && result && (
        <ResultsPanel result={result} scientificName={scientificName} onReset={handleReset} />
      )}

      {status === 'idle' && (
        <>
          <p className="mx-auto max-w-2xl text-center text-sm text-gray-400">
            Upload a recording of a Bornean bird and BirdSense returns the most likely species, a
            confidence score, and a spectrogram of the sound — no expert knowledge needed.
          </p>
          <div className="space-y-4">
            <h2 className="text-center text-sm font-medium text-gray-400">
              Species BirdSense can recognize
            </h2>
            <SpeciesPreviewGrid species={species} />
          </div>
        </>
      )}
    </div>
  )
}
