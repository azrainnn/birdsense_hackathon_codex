import { formatConfidencePercent } from '../utils'

interface ConfidenceScoreProps {
  confidence: number
  identified: boolean
  label?: string
}

const TONE = {
  strong: { ring: '#167b69', glow: 'bg-signal/14', text: 'text-signal', label: 'Strong signal' },
  review: { ring: '#f5c842', glow: 'bg-sarawak-yellow/18', text: 'text-sarawak-yellow', label: 'Review context' },
  low: { ring: '#b42b32', glow: 'bg-sarawak-red/14', text: 'text-sarawak-red', label: 'Cannot identify' },
}

export function ConfidenceScore({ confidence, identified, label }: ConfidenceScoreProps) {
  const percentage = Math.round(confidence * 100)
  const tone = !identified ? TONE.low : confidence >= 0.75 ? TONE.strong : TONE.review
  const circumference = 2 * Math.PI * 44
  const strokeOffset = circumference - Math.max(0.03, confidence) * circumference

  return (
    <div className={`flex items-center gap-3 rounded-2xl border border-paper/15 p-2.5 pr-4 backdrop-blur-sm ${tone.glow}`} aria-label={`${formatConfidencePercent(confidence)} confidence. ${label ?? tone.label}.`}>
      <div className="relative h-[4.6rem] w-[4.6rem] shrink-0">
        <svg viewBox="0 0 104 104" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="52" cy="52" r="44" fill="none" stroke="rgb(255 253 247 / 18%)" strokeWidth="8" /><circle cx="52" cy="52" r="44" fill="none" stroke={tone.ring} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={strokeOffset} className="transition-[stroke-dashoffset] duration-700" /></svg>
        <span className="absolute inset-0 flex items-center justify-center text-base font-semibold tracking-tight text-paper">{percentage}%</span>
      </div>
      <div><p className={`text-[10px] font-bold tracking-[0.14em] uppercase ${tone.text}`}>Confidence</p><p className="mt-1 text-sm font-semibold text-paper">{label ?? tone.label}</p></div>
    </div>
  )
}
