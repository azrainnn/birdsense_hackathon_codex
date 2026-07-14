import { useEffect, useState } from 'react'
import { fetchSpecies } from '../api'
import type { SpeciesInfo } from '../types'
import { formatSpeciesName } from '../utils'

type Status = 'loading' | 'success' | 'error'

export function SpeciesPage() {
  const [species, setSpecies] = useState<SpeciesInfo[]>([])
  const [status, setStatus] = useState<Status>('loading')

  useEffect(() => {
    fetchSpecies()
      .then((data) => {
        setSpecies(data)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <div>
        <h1 className="text-lg font-semibold text-white">Species BirdSense recognizes</h1>
        <p className="text-sm text-gray-400">
          BirdSense currently classifies {species.length} Bornean bird species, trained on
          Xeno-canto field recordings.
        </p>
      </div>

      {status === 'loading' && <p className="text-sm text-gray-400">Loading…</p>}
      {status === 'error' && <p className="text-sm text-red-400">Could not load species list.</p>}

      <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
        {species.map((item) => (
          <li key={item.species_name} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium text-white">{formatSpeciesName(item.species_name)}</p>
              <p className="text-sm italic text-gray-400">{item.scientific_name}</p>
            </div>
            <span className="shrink-0 text-xs text-gray-500">
              {item.recording_count} training recordings
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
