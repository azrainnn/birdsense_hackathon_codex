import type { SpeciesProfile } from '../types'
import { formatSpeciesName } from '../utils'
import { Icon } from './Icon'
import { SarawakRangeMap } from './SarawakRangeMap'

interface SpeciesProfileCardProps {
  profile: SpeciesProfile
  showMap?: boolean
}

export function SpeciesProfileCard({ profile, showMap = true }: SpeciesProfileCardProps) {
  return (
    <section className="overflow-hidden rounded-3xl border border-forest/10 bg-paper shadow-[0_16px_48px_rgb(9_29_24/7%)]" aria-labelledby={`profile-${profile.species_name}`}>
      <div className="relative overflow-hidden bg-ink px-6 py-7 text-paper sm:px-8">
        <div className="absolute top-0 right-12 h-32 w-32 rounded-full border-[20px] border-sarawak-yellow/15" />
        <div className="relative max-w-2xl">
          <p className="text-xs font-bold tracking-[0.16em] text-sarawak-yellow uppercase">Field guide</p>
          <h2 id={`profile-${profile.species_name}`} className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            {formatSpeciesName(profile.species_name)}
          </h2>
          <p className="mt-1 text-sm italic text-paper/65">{profile.scientific_name}</p>
          <p className="mt-4 max-w-xl text-sm leading-6 text-paper/85">{profile.summary}</p>
        </div>
      </div>

      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">
              <Icon name="audio" className="h-4 w-4" />
              Listen for
            </div>
            <p className="mt-2 text-sm leading-6 text-forest">{profile.call_description}</p>
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">
              <Icon name="location" className="h-4 w-4" />
              Habitat
            </div>
            <p className="mt-2 text-sm leading-6 text-forest">{profile.habitat}</p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">Verification tips</p>
            <ul className="mt-3 space-y-2">
              {profile.identification_tips.map((tip) => (
                <li key={tip} className="flex gap-2 text-sm leading-5 text-forest">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf text-signal"><Icon name="check" className="h-3.5 w-3.5" /></span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-sarawak-yellow/35 bg-sarawak-yellow/15 p-4">
            <p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">Conservation context</p>
            <p className="mt-1 text-sm font-semibold text-ink">{profile.conservation_status}</p>
            {profile.conservation_note && <p className="mt-2 text-xs leading-5 text-forest/75">{profile.conservation_note}</p>}
          </div>
          <div className="rounded-2xl bg-leaf/60 p-4">
            <p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">Range note</p>
            <p className="mt-2 text-sm leading-6 text-forest">{profile.distribution_summary}</p>
          </div>
          <p className="text-xs text-muted">Model training reference: {profile.recording_count} selected Xeno-canto recordings.</p>
        </div>
      </div>

      {showMap && <SarawakRangeMap regions={profile.range_regions} sensitive={profile.sensitive_location} className="mx-6 mb-6 sm:mx-8 sm:mb-8" />}
    </section>
  )
}
