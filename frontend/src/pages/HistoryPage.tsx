import { useEffect, useMemo, useState } from 'react'
import { fetchAnalytics, fetchHistory } from '../api'
import { ConfidenceBadge } from '../components/ConfidenceBadge'
import { Icon } from '../components/Icon'
import type { AnalyticsSummary, HistoryEntry } from '../types'
import { formatSpeciesName, formatTimestamp } from '../utils'

type Status = 'loading' | 'success' | 'error'
type Filter = 'all' | 'review'

function Metric({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'border-sarawak-yellow/50 bg-sarawak-yellow/20' : 'border-forest/10 bg-paper'}`}>
      <p className="text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-xs font-medium text-muted">{label}</p>
    </div>
  )
}

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsSummary | undefined>()
  const [status, setStatus] = useState<Status>('loading')
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    Promise.all([fetchHistory(), fetchAnalytics()])
      .then(([history, summary]) => {
        setEntries(history)
        setAnalytics(summary)
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [])

  const filteredEntries = useMemo(() => filter === 'review' ? entries.filter((entry) => entry.needs_review) : entries, [entries, filter])
  const maximumTopSpecies = Math.max(...(analytics?.top_species.map((item) => item.count) ?? [1]), 1)

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Local observation workspace</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">Field log</h1>
          <p className="mt-4 text-sm leading-6 text-forest/75 sm:text-base">Review recent analyses, identify results that need a second look and see the broad local pattern. Counts are stored only on this BirdSense instance.</p>
        </div>
        <div className="inline-flex rounded-xl border border-forest/15 bg-paper p-1 text-sm font-semibold">
          <button type="button" onClick={() => setFilter('all')} className={`rounded-lg px-3 py-2 ${filter === 'all' ? 'bg-ink text-paper' : 'text-forest hover:bg-canvas'}`}>All analyses</button>
          <button type="button" onClick={() => setFilter('review')} className={`rounded-lg px-3 py-2 ${filter === 'review' ? 'bg-sarawak-red text-white' : 'text-forest hover:bg-canvas'}`}>Needs review</button>
        </div>
      </header>

      {status === 'loading' && <div className="mt-8 rounded-3xl border border-forest/10 bg-paper p-8 text-sm text-muted">Loading your local field log…</div>}
      {status === 'error' && <div className="mt-8 rounded-3xl border border-sarawak-red/20 bg-sarawak-red/8 p-5 text-sm text-sarawak-red">Could not load the local history and analytics. Check that the BirdSense backend is running.</div>}

      {status === 'success' && (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Field log totals">
            <Metric label="Audio analyses" value={analytics?.prediction_count ?? 0} />
            <Metric label="Human confirmations" value={analytics?.verified_count ?? 0} />
            <Metric label="Saved field notes" value={analytics?.observation_count ?? 0} />
            <Metric label="Results to review" value={analytics?.needs_review_count ?? 0} accent />
          </section>

          <section className="mt-8 grid gap-7 lg:grid-cols-[1.35fr_.65fr]">
            <div>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink">Recent analyses</h2>
                <span className="text-sm text-muted">{filteredEntries.length} shown</span>
              </div>
              {filteredEntries.length === 0 ? (
                <div className="mt-4 rounded-3xl border border-dashed border-forest/20 bg-paper p-8 text-center text-sm text-muted">No analyses match this view yet. Return to Identify to analyse a recording.</div>
              ) : (
                <ul className="mt-4 space-y-3">
                  {filteredEntries.map((entry) => (
                    <li key={entry.id} className="rounded-2xl border border-forest/10 bg-paper p-4 shadow-[0_8px_24px_rgb(9_29_24/4%)]">
                      <div className="flex flex-wrap items-center gap-4">
                        <img src={entry.spectrogram_url} alt={`Spectrogram for ${formatSpeciesName(entry.species)}`} className="h-[4.25rem] w-[6.75rem] shrink-0 rounded-xl border border-forest/10 object-cover" />
                        <div className="min-w-[10.5rem] flex-1">
                          <div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-ink">{formatSpeciesName(entry.species)}</p>{entry.needs_review && <span className="rounded-full bg-sarawak-red/10 px-2 py-1 text-[10px] font-bold text-sarawak-red">Review</span>}</div>
                          <p className="mt-1 truncate text-xs text-muted">{entry.filename} · {formatTimestamp(entry.created_at)}</p>
                        </div>
                        <ConfidenceBadge confidence={entry.confidence} />
                        <audio controls src={entry.audio_url} className="h-9 min-w-48 max-w-full accent-sarawak-red"><track kind="captions" /></audio>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <aside className="rounded-3xl border border-forest/10 bg-paper p-5 shadow-[0_8px_24px_rgb(9_29_24/4%)]">
              <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-leaf text-forest"><Icon name="sparkle" className="h-4 w-4" /></span><div><p className="text-xs font-bold tracking-[0.13em] text-sarawak-red uppercase">Local pattern</p><h2 className="font-semibold text-ink">Most common candidates</h2></div></div>
              {analytics?.top_species.length ? (
                <ol className="mt-6 space-y-4">
                  {analytics.top_species.map((item, index) => (
                    <li key={item.species}>
                      <div className="flex justify-between gap-3 text-sm"><span className="font-medium text-forest">{index + 1}. {formatSpeciesName(item.species)}</span><span className="font-semibold text-ink">{item.count}</span></div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-canvas"><div className="h-full rounded-full bg-sarawak-red" style={{ width: `${item.count / maximumTopSpecies * 100}%` }} /></div>
                    </li>
                  ))}
                </ol>
              ) : <p className="mt-6 text-sm leading-6 text-muted">Your most common candidates will appear after the first analysis.</p>}
              <div className="mt-7 rounded-2xl bg-canvas p-4 text-xs leading-5 text-muted">These are model candidates, not verified biodiversity records. Confirm results before interpreting a trend.</div>
            </aside>
          </section>
        </>
      )}
    </div>
  )
}
