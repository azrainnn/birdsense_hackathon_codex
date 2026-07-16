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

export interface PredictionResult {
  species: string
  confidence: number
  spectrogram_url: string
  spectrogram_duration_seconds: number
  spectrogram_plot_bounds: SpectrogramPlotBounds
  audio_url: string
  top_predictions: TopPrediction[]
  window_predictions: WindowPrediction[]
}

export interface HistoryEntry {
  id: string
  filename: string
  species: string
  confidence: number
  spectrogram_url: string
  audio_url: string
  created_at: string
}

export interface SpeciesInfo {
  species_name: string
  scientific_name: string
  recording_count: number
}
