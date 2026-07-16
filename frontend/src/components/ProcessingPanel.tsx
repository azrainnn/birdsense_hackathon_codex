import { useEffect, useState } from 'react'
import { Icon } from './Icon'

const STAGES = [
  ['Preparing your recording', 'Checking the clip is ready for a fair comparison.'],
  ['Reading the sound pattern', 'Extracting the acoustic features across the recording.'],
  ['Comparing Bornean calls', 'Ranking the most similar calls in the local guide.'],
] as const

interface ProcessingPanelProps {
  fileName?: string
  fileSize?: number
}

function formatSize(fileSize?: number) {
  if (!fileSize) return 'Audio recording'
  return `${(fileSize / 1024 / 1024).toFixed(fileSize > 1024 * 1024 ? 1 : 2)} MB audio recording`
}

export function ProcessingPanel({ fileName, fileSize }: ProcessingPanelProps) {
  const [activeStage, setActiveStage] = useState(0)

  useEffect(() => {
    const first = window.setTimeout(() => setActiveStage(1), 700)
    const second = window.setTimeout(() => setActiveStage(2), 1_850)
    return () => {
      window.clearTimeout(first)
      window.clearTimeout(second)
    }
  }, [])

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-forest/10 bg-ink p-5 text-paper shadow-[0_28px_80px_rgb(9_29_24/18%)] sm:p-8" aria-labelledby="processing-title" aria-live="polite">
      <div aria-hidden="true" className="absolute -top-28 -right-20 h-72 w-72 rounded-full bg-sarawak-yellow/18 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-signal/30 blur-3xl" />
      <div className="relative grid gap-8 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
        <div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-sarawak-yellow text-ink shadow-lg shadow-sarawak-yellow/15"><span className="pulse-ring absolute h-full w-full rounded-2xl border border-sarawak-yellow" /><Icon name="audio" className="relative h-5 w-5" /></span>
            <div><p className="text-xs font-bold tracking-[0.16em] text-sarawak-yellow uppercase">Analysis in progress</p><p className="mt-1 text-xs text-paper/60">{fileName ?? formatSize(fileSize)}</p></div>
          </div>
          <h2 id="processing-title" className="mt-6 max-w-md text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Listening for the pattern, not just a match.</h2>
          <p className="mt-4 max-w-lg text-sm leading-6 text-paper/70">BirdSense is preparing evidence you can review alongside the leading candidate. Please keep this page open.</p>
          <div className="mt-7 flex h-12 items-center gap-1.5 overflow-hidden" aria-hidden="true">
            {[18, 34, 25, 43, 29, 50, 36, 20, 38, 27, 46, 31, 17, 39, 24, 44, 28].map((height, index) => <span key={`${height}-${index}`} className="analysis-wave-bar w-1.5 rounded-full bg-sarawak-yellow" style={{ height, animationDelay: `${index * 75}ms` }} />)}
          </div>
        </div>
        <ol className="rounded-3xl border border-paper/12 bg-paper/6 p-3 backdrop-blur-sm sm:p-4">
          {STAGES.map(([title, description], index) => {
            const isActive = activeStage === index
            const isComplete = activeStage > index
            return (
              <li key={title} className={`relative flex gap-4 rounded-2xl px-3 py-4 transition duration-500 ${isActive ? 'bg-paper/10' : ''}`}>
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${isComplete ? 'border-signal bg-signal text-white' : isActive ? 'border-sarawak-yellow bg-sarawak-yellow text-ink' : 'border-paper/25 text-paper/45'}`}>
                  {isComplete ? <Icon name="check" className="h-4 w-4" /> : index + 1}
                </span>
                <div><p className={`text-sm font-semibold ${isActive || isComplete ? 'text-paper' : 'text-paper/60'}`}>{title}</p><p className="mt-1 text-xs leading-5 text-paper/55">{description}</p></div>
                {isActive && <span className="absolute top-5 right-4 h-2 w-2 rounded-full bg-sarawak-yellow shadow-[0_0_0_6px_rgb(245_200_66/14%)]" />}
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
