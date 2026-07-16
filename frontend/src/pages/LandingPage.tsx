import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../components/Icon'

const HERO_BIRD_IMAGE = 'https://images.unsplash.com/photo-1444464666168-49d633b86797?auto=format&fit=crop&w=1800&q=90'
const HERO_FOREST_IMAGE = 'https://images.unsplash.com/photo-1497250681960-ef046c08a56e?auto=format&fit=crop&w=2400&q=90'

const FEATURES = [
  ['audio', 'Listen first', 'Identify with context', 'Upload a recording and compare the leading candidates, spectrogram and approximate detection windows—not just one percentage.'],
  ['map', 'Find responsibly', 'Learn the habitat range', 'Each species has a broad Sarawak habitat guide. Sensitive records never reveal exact sightings or nest locations.'],
  ['shield', 'Verify together', 'Turn matches into knowledge', 'Confirm, correct or flag uncertain matches. Add optional broad-region notes that can support future review.'],
] as const

function ScrollExpandHero() {
  const [progress, setProgress] = useState(0)
  const progressRef = useRef(0)
  const touchY = useRef<number | null>(null)

  const setExpansion = (value: number) => {
    const next = Math.max(0, Math.min(1, value))
    progressRef.current = next
    setProgress(next)
  }

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const atTop = window.scrollY <= 4
      const expanded = progressRef.current >= 0.995
      if (!atTop || (expanded && event.deltaY > 0)) return
      event.preventDefault()
      setExpansion(expanded && event.deltaY < 0 ? 0.94 : progressRef.current + event.deltaY * 0.00115)
    }
    const onScroll = () => {
      if (progressRef.current < 0.995 && window.scrollY > 0) window.scrollTo(0, 0)
    }
    const onTouchStart = (event: TouchEvent) => { touchY.current = event.touches[0]?.clientY ?? null }
    const onTouchMove = (event: TouchEvent) => {
      const currentY = event.touches[0]?.clientY
      if (touchY.current === null || currentY === undefined) return
      const delta = touchY.current - currentY
      const expanded = progressRef.current >= 0.995
      if (window.scrollY <= 4 && (!expanded || delta < -16)) {
        event.preventDefault()
        setExpansion(expanded && delta < -16 ? 0.94 : progressRef.current + delta * (delta < 0 ? 0.0075 : 0.0055))
      }
      touchY.current = currentY
    }
    const onTouchEnd = () => { touchY.current = null }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const expanded = progress >= 0.995
  const width = 340 + progress * 1100
  const height = 320 + progress * 430
  const titleShift = progress * 16

  return (
    <section className="relative flex min-h-[calc(100svh-4.5rem)] items-center justify-center overflow-hidden bg-ink px-5 py-10 sm:px-8">
      <img aria-hidden="true" src={HERO_FOREST_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-150" style={{ opacity: 1 - progress }} />
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_0%,rgb(9_29_24_/_15%)_35%,rgb(9_29_24_/_78%)_100%)] transition-opacity duration-150" style={{ opacity: 1 - progress }} />
      <div className="relative z-10 flex w-full max-w-7xl flex-col items-center justify-center">
        <div className="relative overflow-hidden rounded-3xl border border-paper/30 bg-ink shadow-2xl shadow-ink/35 transition-[width,height] duration-150 ease-out" style={{ width: `min(${width}px, 95vw)`, height: `min(${height}px, 76svh)` }}>
          <img src={HERO_BIRD_IMAGE} alt="A bird perched in the forest canopy" className="h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-ink transition-opacity duration-150" style={{ opacity: 0.62 - progress * 0.4 }} />
          <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-4 text-paper sm:right-7 sm:bottom-7 sm:left-7">
            <p className="max-w-48 text-[0.62rem] font-bold tracking-[0.16em] text-paper/85 uppercase sm:max-w-none sm:text-xs">BirdSense · Field intelligence for living landscapes</p>
          </div>
        </div>
        <h1 className="pointer-events-none relative z-20 -mt-2 flex flex-col items-center text-center text-5xl font-semibold leading-[0.86] tracking-[-0.06em] text-paper mix-blend-difference sm:text-7xl lg:text-8xl">
          <span className="transition-transform duration-150 ease-out" style={{ transform: `translateX(-${titleShift}vw)` }}>Hear the forest.</span>
          <span className="transition-transform duration-150 ease-out" style={{ transform: `translateX(${titleShift}vw)` }}>Understand the signal.</span>
        </h1>
      </div>
      <p className="absolute bottom-5 z-20 text-xs font-bold tracking-[0.16em] text-paper/75 uppercase">{expanded ? 'Explore the field guide below' : 'Scroll or swipe to expand'}</p>
    </section>
  )
}

export function LandingPage() {
  return (
    <div>
      <ScrollExpandHero />

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl"><p className="text-xs font-bold tracking-[0.15em] text-sarawak-red uppercase">Designed for meaningful observations</p><h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">A result is more than a label.</h2><p className="mt-4 leading-7 text-forest/75">BirdSense pairs machine learning with the context that makes ecological observations more responsible and useful.</p></div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {FEATURES.map(([icon, eyebrow, title, body], index) => <article key={title} className="group rounded-3xl border border-forest/10 bg-paper p-6 shadow-[0_12px_36px_rgb(9_29_24/5%)] transition hover:-translate-y-1 hover:shadow-[0_18px_42px_rgb(9_29_24/10%)]"><div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${index === 1 ? 'bg-sarawak-yellow text-ink' : index === 2 ? 'bg-sarawak-red text-white' : 'bg-forest text-sarawak-yellow'}`}><Icon name={icon} className="h-5 w-5" /></div><p className="mt-6 text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">{eyebrow}</p><h3 className="mt-2 text-xl font-semibold text-ink">{title}</h3><p className="mt-3 text-sm leading-6 text-forest/75">{body}</p></article>)}
        </div>
      </section>

      <section className="bg-ink text-paper"><div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div><p className="text-xs font-bold tracking-[0.15em] text-sarawak-yellow uppercase">A careful workflow</p><h2 className="mt-3 text-3xl font-semibold tracking-tight">Useful in the field, honest about uncertainty.</h2></div><ol className="grid gap-4 sm:grid-cols-3">{['Upload a clear recording', 'Review audio and alternatives', 'Verify and log responsibly'].map((step, index) => <li key={step} className="rounded-2xl border border-paper/12 bg-paper/5 p-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-sarawak-yellow text-xs font-bold text-ink">0{index + 1}</span><p className="mt-4 text-sm font-semibold leading-5">{step}</p></li>)}</ol></div></section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20"><div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-sarawak-yellow p-7 sm:flex-row sm:items-center sm:p-10"><div className="max-w-xl"><p className="text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">Ready when you are</p><h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Bring a recording. Leave with a better question.</h2></div><Link to="/identify" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-paper transition hover:bg-forest">Start identifying <Icon name="arrow-right" className="h-4 w-4" /></Link></div></section>
    </div>
  )
}
