import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { SpeciesPhoto } from '../components/SpeciesPhoto'

const HERO_BIRD_IMAGE = 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1800&q=90'
const HERO_FOREST_IMAGE = 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=2400&q=90'

const FEATURES = [
  ['audio', 'Listen first', 'Evidence, not a black box', 'Compare the recording, spectrogram and ranked alternatives before acting on a result.'],
  ['map', 'Find responsibly', 'Place every call in context', 'Read broad habitat guidance across Sarawak without exposing sensitive nesting or sighting locations.'],
  ['shield', 'Verify together', 'Keep the human in the loop', 'Confirm, correct or save a privacy-safe field note only when the evidence makes sense.'],
] as const

const GUIDE_PREVIEW = [
  ['rhinoceros_hornbill', 'Buceros rhinoceros', 'Canopy icon', 'Mature lowland forest'],
  ['black-crowned_pitta', 'Erythropitta ussheri', 'Forest floor', 'Intact rainforest'],
  ['blue-eared_barbet', 'Psilopogon duvaucelii', 'Fruiting canopy', 'Hill and lowland forest'],
] as const

function ScrollExpandHero() {
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)
  const touchY = useRef<number | null>(null)
  const setExpansion = (value: number) => { const next = Math.max(0, Math.min(1, value)); progressRef.current = next; setProgress(next) }

  useEffect(() => {
    const onWheel = (event: WheelEvent) => { const atTop = window.scrollY <= 4; const expanded = progressRef.current >= 0.995; if (!atTop || (expanded && event.deltaY > 0)) return; event.preventDefault(); setExpansion(expanded && event.deltaY < 0 ? 0.94 : progressRef.current + event.deltaY * 0.00115) }
    const onScroll = () => { if (progressRef.current < 0.995 && window.scrollY > 0) window.scrollTo(0, 0) }
    const onTouchStart = (event: TouchEvent) => { touchY.current = event.touches[0]?.clientY ?? null }
    const onTouchMove = (event: TouchEvent) => { const currentY = event.touches[0]?.clientY; if (touchY.current === null || currentY === undefined) return; const delta = touchY.current - currentY; const expanded = progressRef.current >= 0.995; if (window.scrollY <= 4 && (!expanded || delta < -16)) { event.preventDefault(); setExpansion(expanded && delta < -16 ? 0.94 : progressRef.current + delta * (delta < 0 ? 0.0075 : 0.0055)) }; touchY.current = currentY }
    const onTouchEnd = () => { touchY.current = null }
    window.addEventListener('wheel', onWheel, { passive: false }); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('touchstart', onTouchStart, { passive: true }); window.addEventListener('touchmove', onTouchMove, { passive: false }); window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => { window.removeEventListener('wheel', onWheel); window.removeEventListener('scroll', onScroll); window.removeEventListener('touchstart', onTouchStart); window.removeEventListener('touchmove', onTouchMove); window.removeEventListener('touchend', onTouchEnd) }
  }, [])

  const expanded = progress >= 0.995
  const width = 340 + progress * 1100
  const height = 320 + progress * 430
  const titleShift = progress * 16
  return (
    <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center justify-center overflow-hidden bg-ink px-5 py-10 sm:px-8">
      <img aria-hidden="true" src={HERO_FOREST_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150" style={{ opacity: 1 - progress }} />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgb(9_29_24_/_12%)_34%,rgb(9_29_24_/_82%)_100%)] transition-opacity duration-150" style={{ opacity: 1 - progress }} />
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center justify-center">
        <div className="relative overflow-hidden rounded-[2rem] border border-paper/30 bg-ink shadow-2xl shadow-ink/35 transition-[width,height] duration-150 ease-out" style={{ width: `min(${width}px, 95vw)`, height: `min(${height}px, 76svh)` }}>
          <img src={HERO_BIRD_IMAGE} alt="A bird perched in the forest canopy" className="h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-ink transition-opacity duration-150" style={{ opacity: 0.62 - progress * 0.4 }} />
          <div className="absolute top-5 left-5 rounded-full border border-paper/25 bg-ink/45 px-3 py-1.5 text-[10px] font-bold tracking-[0.14em] text-paper/85 uppercase backdrop-blur sm:top-7 sm:left-7">Borneo acoustic field guide</div>
          <p className="absolute right-5 bottom-5 left-5 max-w-56 text-[0.62rem] font-bold tracking-[0.16em] text-paper/85 uppercase sm:right-7 sm:bottom-7 sm:left-7 sm:max-w-none sm:text-xs">BirdSense · Field intelligence for living landscapes</p>
        </div>
        <h1 className="pointer-events-none relative z-20 -mt-2 flex flex-col items-center text-center text-5xl font-semibold leading-[0.86] tracking-[-0.06em] text-paper mix-blend-difference sm:text-7xl lg:text-8xl"><span className="transition-transform duration-150 ease-out" style={{ transform: `translateX(-${titleShift}vw)` }}>Hear the forest.</span><span className="transition-transform duration-150 ease-out" style={{ transform: `translateX(${titleShift}vw)` }}>Understand the signal.</span></h1>
        {expanded && <div className="relative z-30 mt-7 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500"><Link to="/identify" className="inline-flex items-center gap-2 rounded-xl bg-sarawak-yellow px-5 py-3 text-sm font-semibold text-ink shadow-lg shadow-ink/35 transition hover:bg-paper">Identify a recording <Icon name="arrow-right" className="h-4 w-4" /></Link><p className="text-xs font-medium text-paper/70">15 Bornean species · Evidence-first results</p></div>}
      </div>
      <p className="absolute bottom-5 z-20 text-xs font-bold tracking-[0.16em] text-paper/75 uppercase">{expanded ? 'Explore the field guide below' : 'Scroll or swipe to expand'}</p>
    </section>
  )
}

export function LandingPage() {
  return (
    <div>
      <ScrollExpandHero />
      <section className="relative z-10 border-y border-forest/10 bg-paper"><div className="mx-auto grid max-w-7xl divide-y divide-forest/10 px-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-8"><div className="py-5 sm:pr-7"><p className="text-2xl font-semibold tracking-tight text-ink">15</p><p className="mt-1 text-xs font-bold tracking-[0.13em] text-sarawak-red uppercase">Bornean species guide</p></div><div className="py-5 sm:px-7"><p className="text-2xl font-semibold tracking-tight text-ink">40%</p><p className="mt-1 text-xs font-bold tracking-[0.13em] text-sarawak-red uppercase">Minimum identify threshold</p></div><div className="py-5 sm:pl-7"><p className="text-2xl font-semibold tracking-tight text-ink">0</p><p className="mt-1 text-xs font-bold tracking-[0.13em] text-sarawak-red uppercase">Exact public locations shared</p></div></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"><div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end"><div><p className="text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Designed for meaningful observations</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-5xl">A result is more than a label.</h2><p className="mt-5 max-w-xl leading-7 text-forest/75">BirdSense pairs acoustic recognition with the evidence and context needed to make a careful field decision.</p><Link to="/identify" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest">Open the recorder <Icon name="arrow-right" className="h-4 w-4" /></Link></div><div className="grid gap-4 sm:grid-cols-3">{FEATURES.map(([icon, eyebrow, title, body], index) => <article key={title} className={`group min-h-64 rounded-3xl border p-5 shadow-[0_14px_36px_rgb(9_29_24/5%)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgb(9_29_24/10%)] ${index === 1 ? 'border-sarawak-yellow/45 bg-sarawak-yellow/15' : 'border-forest/10 bg-paper'}`}><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index === 1 ? 'bg-ink text-sarawak-yellow' : index === 2 ? 'bg-sarawak-red text-white' : 'bg-forest text-sarawak-yellow'}`}><Icon name={icon} className="h-5 w-5" /></div><p className="mt-8 text-[10px] font-bold tracking-[0.14em] text-sarawak-red uppercase">{eyebrow}</p><h3 className="mt-2 text-lg font-semibold leading-5 text-ink">{title}</h3><p className="mt-3 text-sm leading-6 text-forest/75">{body}</p></article>)}</div></div></section>

      <section className="overflow-hidden bg-ink text-paper"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[.75fr_1.25fr] lg:items-center"><div><p className="text-xs font-bold tracking-[0.15em] text-sarawak-yellow uppercase">A careful workflow</p><h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">From a sound in the forest to a decision you can stand behind.</h2><p className="mt-4 max-w-md text-sm leading-6 text-paper/68">The experience is built to slow the right moments down: audio first, evidence second, human judgement last.</p></div><ol className="relative grid gap-4 sm:grid-cols-3">{[['Record', 'Capture a clear call from your device or upload a clip.'], ['Compare', 'Review the confidence, sound evidence and alternatives.'], ['Verify', 'Log only what the evidence and context support.']].map(([title, body], index) => <li key={title} className="relative rounded-3xl border border-paper/12 bg-paper/6 p-5 backdrop-blur-sm"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-sarawak-yellow text-xs font-bold text-ink">0{index + 1}</span><p className="mt-7 text-lg font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-paper/62">{body}</p></li>)}</ol></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><p className="text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Meet the guide</p><h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">Learn each sound with its habitat.</h2></div><Link to="/species" className="inline-flex items-center gap-2 text-sm font-semibold text-forest transition hover:text-sarawak-red">Explore all species <Icon name="arrow-right" className="h-4 w-4" /></Link></div><div className="mt-8 grid gap-4 md:grid-cols-3">{GUIDE_PREVIEW.map(([name, scientificName, cue, habitat]) => <article key={name} className="group overflow-hidden rounded-3xl border border-forest/10 bg-paper shadow-[0_12px_36px_rgb(9_29_24/5%)]"><SpeciesPhoto speciesName={name} scientificName={scientificName} className="h-52 w-full" /><div className="p-5"><p className="text-[10px] font-bold tracking-[0.14em] text-sarawak-red uppercase">{cue}</p><h3 className="mt-2 text-xl font-semibold text-ink">{name.split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')}</h3><p className="mt-2 text-sm text-muted">{habitat}</p></div></article>)}</div></section>

      <section className="mx-auto max-w-7xl px-5 pb-16 sm:px-8 sm:pb-20"><div className="relative overflow-hidden rounded-[2rem] bg-sarawak-yellow p-7 sm:p-10"><div aria-hidden="true" className="absolute -right-14 -bottom-20 h-64 w-64 rounded-full border-[32px] border-ink/10" /><div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center"><div className="max-w-xl"><p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">Ready when you are</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-ink sm:text-3xl">Bring a recording. Leave with a better question.</h2><p className="mt-3 text-sm leading-6 text-forest/75">BirdSense will tell you when it cannot identify a call with enough confidence.</p></div><Link to="/identify" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest">Start identifying <Icon name="arrow-right" className="h-4 w-4" /></Link></div></div></section>
    </div>
  )
}
