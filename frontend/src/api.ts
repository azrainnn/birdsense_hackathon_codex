import type { HistoryEntry, PredictionResult, SpeciesInfo } from './types'

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string }
    return body.error ?? `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

export async function predictSpecies(file: File): Promise<PredictionResult> {
  const formData = new FormData()
  formData.append('audio', file)

  const response = await fetch('/predict', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }

  return (await response.json()) as PredictionResult
}

export async function fetchHistory(): Promise<HistoryEntry[]> {
  const response = await fetch('/history')
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return (await response.json()) as HistoryEntry[]
}

export async function fetchSpecies(): Promise<SpeciesInfo[]> {
  const response = await fetch('/species')
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return (await response.json()) as SpeciesInfo[]
}
