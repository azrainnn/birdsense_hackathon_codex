import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { Icon } from '../components/Icon'

const FEATURES = [
  {
    icon: 'audio' as const,
    eyebrow: 'Listen first',
    title: 'Identify with context',
    body: 'Upload a recording and compare the leading candidates, spectrogram and approximate detection windows—not just one percentage.',
  },
  {
    icon: 'map' as const,
    eyebrow: 'Find responsibly',
    title: 'Learn the habitat range',
    body: 'Each species has a broad Sarawak habitat guide. Sensitive records never reveal exact sightings or nest locations.',
  },
  {
    icon: 'shield' as const,
    eyebrow: 'Verify together',
    title: 'Turn matches into knowledge',
    body: 'Confirm, correct or flag uncertain matches. Add optional broad-region notes that can support future review.',
  },
]

function SoundscapeArtwork() {
  return (
    <div className="grain relative isolate min-h-80 overflow-hidden rounded-3xl border border-paper/15 bg-[#0b2a22] p-5 shadow-2xl shadow-ink/20 sm:min-h-[420px]">
      <div className="absolute -top-24 -right-10 h-64 w-64 animate-drift rounded-full border-[42px] border-sarawak-yellow/20 motion-reduce:animate-none" />
      <div className="absolute top-8 right-10 h-28 w-28 animate-drift rounded-full bg-sarawak-red/30 blur-2xl motion-reduce:animate-none" style={{ animationDelay: '-3.5s' }} />
      <div className="absolute bottom-0 left-0 h-48 w-full bg-[radial-gradient(ellipse_at_center_bottom,_rgb(34_103_77/80%),_transparent_70%)]" />
      <svg className="absolute inset-x-0 bottom-0 h-64 w-full" viewBox="0 0 530 280" aria-hidden="true" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 227C55 185 85 222 130 190c31-22 48-62 87-46 33 14 44 50 83 35 47-18 56-75 102-66 45 9 48 49 128 10v157H0V227Z" fill="#1c5945" />
        <path d="M0 251c51-35 95-13 140-39 38-22 59-64 97-52 36 12 58 43 96 25 46-21 63-83 112-76 42 6 56 45 85 32v139H0v-29Z" fill="#123d32" />
        <path className="animate-drift motion-reduce:animate-none" d="M378 187c15-18 28-40 33-66 5-31-3-52-19-65 16 2 29 13 37 30 9 21 9 46 2 73-8 29-25 51-46 63-11 6-23 10-35 12 10-15 19-31 28-47Z" fill="#f5c842" />
        <path d="M363 173c13-9 30-13 45-9 13 3 22 12 30 23-16 6-35 8-52 2-15-5-25-13-23-16Z" fill="#f7f3e8" />
        <path d="M348 184c10-16 22-24 38-26-11 12-17 27-19 46-3 23 5 38 20 46-21 2-38-7-48-24-10-18-7-31 9-42Z" fill="#091d18" />
        <circle cx="374" cy="176" r="3" fill="#f7f3e8" />
        <path d="M65 132c17-11 31-11 48 0-17 11-31 11-48 0Zm65-34c12-8 22-8 33 0-11 8-21 8-33 0Zm-4 79c20-14 38-14 58 0-20 14-38 14-58 0Z" fill="#dfead7" opacity=".5" />
        <g stroke="#f5c842" strokeLinecap="round" opacity=".9">
          <path d="M58 66v42" strokeWidth="4" />
          <path d="M70 54v66" strokeWidth="4" />
          <path d="M82 72v30" strokeWidth="4" />
          <path d="M94 43v89" strokeWidth="4" />
          <path d="M106 61v54" strokeWidth="4" />
          <path d="M118 75v27" strokeWidth="4" />
          <path d="M130 51v71" strokeWidth="4" />
          <path d="M142 68v37" strokeWidth="4" />
        </g>
      </svg>
      <div className="relative flex items-center justify-between gap-4 text-paper">
        <div className="flex items-center gap-2 rounded-full border border-paper/15 bg-ink/25 px-3 py-1.5 text-xs font-semibold backdrop-blur">
          <span className="relative flex h-2 w-2"><span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-sarawak-yellow" /><span className="relative inline-flex h-2 w-2 rounded-full bg-sarawak-yellow" /></span>
          Listening for a living Sarawak
        </div>
        <BrandMark className="h-10 w-10 text-paper" />
      </div>
      <div className="absolute right-5 bottom-5 left-5 rounded-2xl border border-paper/12 bg-ink/45 p-4 text-paper backdrop-blur-sm">
        <p className="text-[10px] font-bold tracking-[0.17em] text-sarawak-yellow uppercase">BirdSense signal</p>
        <p className="mt-1 max-w-xs text-sm font-medium leading-5">Audio is a starting point. Habitat, behaviour and human review complete the story.</p>
      </div>
    </div>
  )
}

export function LandingPage() {
  return (
    <div>
      <section className="page-grid border-b border-forest/10 bg-canvas">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[1.04fr_.96fr] lg:items-center lg:gap-14">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-sarawak-yellow/60 bg-sarawak-yellow/15 px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-forest uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-sarawak-red" />
              Bornean bird acoustics · Sarawak
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.04em] text-ink sm:text-6xl sm:leading-[1.02]">
              Hear the forest.<br />
              <span className="text-sarawak-red">Understand</span> the signal.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-forest/80 sm:text-lg">
              BirdSense helps researchers, conservationists and curious listeners explore Bornean bird calls with an AI-assisted, privacy-aware field guide.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/identify" className="inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-lg shadow-forest/15 transition hover:-translate-y-0.5 hover:bg-forest">
                Identify a recording <Icon name="arrow-right" className="h-4 w-4" />
              </Link>
              <Link to="/species" className="inline-flex items-center gap-2 rounded-xl border border-forest/20 bg-paper px-5 py-3 text-sm font-semibold text-forest transition hover:border-sarawak-red/50 hover:bg-leaf/50">
                Browse species guide <Icon name="map" className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-10 grid max-w-lg grid-cols-3 gap-5 border-t border-forest/10 pt-6">
              <div><p className="text-2xl font-semibold text-ink">15</p><p className="mt-1 text-xs leading-4 text-muted">Current Bornean species</p></div>
              <div><p className="text-2xl font-semibold text-ink">90.5%</p><p className="mt-1 text-xs leading-4 text-muted">Held-out macro F1</p></div>
              <div><p className="text-2xl font-semibold text-ink">0</p><p className="mt-1 text-xs leading-4 text-muted">Exact locations stored</p></div>
            </div>
          </div>
          <SoundscapeArtwork />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Designed for meaningful observations</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">A result is more than a label.</h2>
          <p className="mt-4 leading-7 text-forest/75">BirdSense pairs machine learning with the context that makes ecological observations more responsible and useful.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <article key={feature.title} className="group rounded-3xl border border-forest/10 bg-paper p-6 shadow-[0_12px_36px_rgb(9_29_24/5%)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgb(9_29_24/10%)]">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index === 1 ? 'bg-sarawak-yellow text-ink' : index === 2 ? 'bg-sarawak-red text-white' : 'bg-forest text-sarawak-yellow'}`}><Icon name={feature.icon} className="h-5 w-5" /></div>
              <p className="mt-6 text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">{feature.eyebrow}</p>
              <h3 className="mt-2 text-xl font-semibold text-ink">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-forest/75">{feature.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-ink text-paper">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs font-bold tracking-[0.15em] text-sarawak-yellow uppercase">A careful workflow</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Useful in the field, honest about uncertainty.</h2>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {['Upload a clear recording', 'Review audio and alternatives', 'Verify and log responsibly'].map((step, index) => (
              <li key={step} className="rounded-2xl border border-paper/12 bg-paper/5 p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sarawak-yellow text-xs font-bold text-ink">0{index + 1}</span>
                <p className="mt-4 text-sm font-semibold leading-5">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-sarawak-yellow p-7 sm:flex-row sm:items-center sm:p-10">
          <div className="max-w-xl">
            <p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">Ready when you are</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Bring a recording. Leave with a better question.</h2>
          </div>
          <Link to="/identify" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest">Start identifying <Icon name="arrow-right" className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  )
}
