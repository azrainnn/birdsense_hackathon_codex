export interface TopPrediction {
  species: string
  confidence: number
}

export interface WindowPrediction {
  start_time: number
  end_time: number
  confidence: number
}

export interface SpectrogramPlotBounds {
  left: number
  right: number
  top: number
  bottom: number
}

export type QualityLabel = 'Suitable' | 'Review recommended' | 'Low confidence'

export interface PredictionQuality {
  label: QualityLabel
  message: string
}

export interface TimelineEvent {
  start_seconds: number
  end_seconds: number
  species: string
  confidence: number
}

export interface PredictionResult {
  species: string
  confidence: number
  spectrogram_url: string
  spectrogram_duration_seconds: number
  spectrogram_plot_bounds: SpectrogramPlotBounds
  audio_url: string
  top_predictions: TopPrediction[]
  window_predictions: WindowPrediction[]
  window_predictions: WindowPrediction[]
  id?: string
  quality?: PredictionQuality
  needs_review?: boolean
  timeline?: TimelineEvent[]
}

export interface HistoryEntry {
  id: string
  filename: string
  species: string
  confidence: number
  spectrogram_url: string
  audio_url: string
  created_at: string
  quality?: QualityLabel
  needs_review?: boolean
}

export interface SpeciesInfo {
  species_name: string
  scientific_name: string
  recording_count: number
}

export interface SpeciesProfile extends SpeciesInfo {
  common_name?: string
  summary: string
  habitat: string
  call_description: string
  identification_tips: string[]
  conservation_status: string
  conservation_note?: string
  distribution_summary: string
  range_regions: string[]
  sensitive_location: boolean
}

export interface FieldFeedback {
  prediction_id?: string
  species: string
  verdict: 'confirmed' | 'incorrect' | 'unsure'
  correct_species?: string
  notes?: string
}

export interface Observation {
  species: string
  region?: string
  observed_at?: string
  notes?: string
  confidence?: number
}

export interface AnalyticsSummary {
  prediction_count: number
  verified_count: number
  needs_review_count: number
  observation_count: number
  top_species: Array<{ species: string; count: number }>
}
