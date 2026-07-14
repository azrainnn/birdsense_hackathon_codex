import { useEffect, useState } from 'react'
import { fetchHistory } from '../api'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import type { HistoryEntry } from '../types'
import { formatSpeciesName, formatTimestamp } from '../utils'

type Status = 'loading' | 'success' | 'error'

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    fetchHistory()
      .then((data) => {
        setEntries(data)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <h1 className="text-lg font-semibold text-white">Prediction history</h1>

      {status === 'loading' && <p className="text-sm text-gray-400">Loading…</p>}
      {status === 'error' && <p className="text-sm text-red-400">Could not load history.</p>}
      {status === 'success' && entries.length === 0 && (
        <p className="text-sm text-gray-400">No predictions yet — analyze a recording to get started.</p>
      )}

      <ul className="space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <img
              src={entry.spectrogram_url}
              alt={`Spectrogram for ${formatSpeciesName(entry.species)}`}
              className="h-16 w-24 shrink-0 rounded-md border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-white">{formatSpeciesName(entry.species)}</p>
              <p className="truncate text-xs text-gray-500">
                {entry.filename} · {formatTimestamp(entry.created_at)}
              </p>
            </div>
            <ConfidenceBadge confidence={entry.confidence} />
            <audio controls src={entry.audio_url} className="h-8 w-48">
              <track kind="captions" />
            </audio>
          </li>
        ))}
      </ul>
    </div>
  )
}
