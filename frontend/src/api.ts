import type {
  AnalyticsSummary,
  FieldFeedback,
  HistoryEntry,
  Observation,
  PredictionResult,
  SpeciesInfo,
  SpeciesProfile,
} from './types'

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

export async function fetchSpeciesProfile(speciesName: string): Promise<SpeciesProfile> {
  const response = await fetch(`/species/${encodeURIComponent(speciesName)}`)
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return (await response.json()) as SpeciesProfile
}

async function postJson<T>(path: string, payload: T): Promise<void> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
}

export function submitFeedback(feedback: FieldFeedback): Promise<void> {
  return postJson('/feedback', feedback)
}

export function submitObservation(observation: Observation): Promise<void> {
  return postJson('/observations', observation)
}

export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  const response = await fetch('/analytics')
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response))
  }
  return (await response.json()) as AnalyticsSummary
}
