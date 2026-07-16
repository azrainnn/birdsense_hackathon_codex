import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchSpecies, fetchSpeciesProfile } from '../api'
import { Icon } from '../components/Icon'
import { SpeciesProfileCard } from '../components/SpeciesProfileCard'
import { SpeciesPhoto } from '../components/SpeciesPhoto'
import type { SpeciesInfo, SpeciesProfile } from '../types'
import { formatSpeciesName } from '../utils'

type Status = 'loading' | 'success' | 'error'

export function SpeciesPage() {
  const [species, setSpecies] = useState<SpeciesInfo[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [selectedSpecies, setSelectedSpecies] = useState('')
  const [profile, setProfile] = useState<SpeciesProfile | undefined>()
  const [profileStatus, setProfileStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [query, setQuery] = useState('')
  const profileRef = useRef<HTMLElement>(null)

  function selectSpecies(speciesName: string) {
    setSelectedSpecies(speciesName)
    if (window.matchMedia('(max-width: 1023px)').matches) {
      window.setTimeout(() => profileRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0)
    }
  }

  useEffect(() => {
    fetchSpecies()
      .then((data) => {
        setSpecies(data)
        setSelectedSpecies(data[0]?.species_name ?? '')
        setStatus('success')
      })
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    if (!selectedSpecies) return
    setProfileStatus('loading')
    setProfile(undefined)
    fetchSpeciesProfile(selectedSpecies)
      .then((data) => {
        setProfile(data)
        setProfileStatus('idle')
      })
      .catch(() => setProfileStatus('error'))
  }, [selectedSpecies])

  const visibleSpecies = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return species
    return species.filter((item) => `${item.species_name} ${item.scientific_name}`.toLowerCase().includes(normalizedQuery))
  }, [query, species])

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="max-w-3xl">
        <p className="text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Bornean field guide</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-5xl">Explore species with the landscape in mind.</h1>
        <p className="mt-4 text-sm leading-6 text-forest/75 sm:text-base">Every BirdSense species comes with identification context, habitat notes and a privacy-safe Sarawak range guide.</p>
      </header>

      <div className="mt-9 grid gap-7 lg:grid-cols-[.8fr_1.2fr]">
        <aside className="order-2 rounded-3xl border border-forest/10 bg-paper p-4 shadow-[0_12px_40px_rgb(9_29_24/5%)] lg:order-1 lg:sticky lg:top-[5.5rem] lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
          <div className="px-2 pb-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-ink">Recognised species</h2>
              <span className="rounded-full bg-leaf px-2.5 py-1 text-xs font-bold text-forest">{species.length}</span>
            </div>
            <label className="relative mt-4 block" htmlFor="species-search">
              <span className="sr-only">Search species</span>
              <input id="species-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search common or scientific name" className="w-full rounded-xl border border-line bg-canvas px-3 py-2.5 pr-9 text-sm text-ink placeholder:text-muted/75" />
              <Icon name="sparkle" className="pointer-events-none absolute top-3 right-3 h-4 w-4 text-sarawak-red" />
            </label>
          </div>

          {status === 'loading' && <p className="px-2 py-6 text-sm text-muted">Loading the field guide…</p>}
          {status === 'error' && <p className="mx-2 rounded-xl bg-sarawak-red/10 p-3 text-sm text-sarawak-red">Could not load the local species list.</p>}
          {status === 'success' && (
            <ul className="space-y-1">
              {visibleSpecies.map((item) => {
                const isSelected = item.species_name === selectedSpecies
                return (
                  <li key={item.species_name}>
                    <button type="button" onClick={() => selectSpecies(item.species_name)} aria-pressed={isSelected} className={`w-full rounded-2xl p-3 text-left transition ${isSelected ? 'bg-ink text-paper shadow-md' : 'text-forest hover:bg-canvas'}`}>
                      <span className="flex items-center justify-between gap-3">
                        <SpeciesPhoto speciesName={item.species_name} scientificName={item.scientific_name} className="h-11 w-11 shrink-0 rounded-xl" />
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{formatSpeciesName(item.species_name)}</span><span className={`mt-0.5 block truncate text-xs italic ${isSelected ? 'text-paper/65' : 'text-muted'}`}>{item.scientific_name}</span></span>
                        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${isSelected ? 'bg-sarawak-yellow text-ink' : 'bg-leaf text-forest'}`}>{item.recording_count}</span>
                      </span>
                    </button>
                  </li>
                )
              })}
              {visibleSpecies.length === 0 && <li className="p-3 text-sm text-muted">No species match that search.</li>}
            </ul>
          )}
        </aside>

        <main ref={profileRef} className="order-1 lg:order-2">
          {profileStatus === 'loading' && <div className="rounded-3xl border border-forest/10 bg-paper p-8 text-sm text-muted">Loading species profile and map…</div>}
          {profileStatus === 'error' && <div className="rounded-3xl border border-sarawak-red/20 bg-sarawak-red/8 p-6 text-sm text-sarawak-red">The local profile could not be loaded. Please try a different species.</div>}
          {profile && <SpeciesProfileCard profile={profile} />}
        </main>
      </div>
    </div>
  )
}
