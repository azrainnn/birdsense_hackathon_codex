import { Icon } from './Icon'

interface SarawakRangeMapProps {
  regions: string[]
  sensitive: boolean
  className?: string
}

const REGION_POINTS: Record<string, { x: number; y: number; short: string }> = {
  'Kuching & western lowlands': { x: 132, y: 233, short: 'West' },
  'Bintulu & central lowlands': { x: 282, y: 190, short: 'Central' },
  'Rajang basin': { x: 244, y: 222, short: 'Rajang' },
  'Ulu Baram & Mulu': { x: 397, y: 118, short: 'North' },
  'Usun Apau & Kelabit Highlands': { x: 362, y: 204, short: 'Highlands' },
}

/**
 * A deliberately schematic regional guide. It does not show sightings or
 * precise distribution boundaries, which protects sensitive species.
 */
export function SarawakRangeMap({ regions, sensitive, className = '' }: SarawakRangeMapProps) {
  const knownRegions = regions.filter((region) => REGION_POINTS[region])

  return (
    <section className={`overflow-hidden rounded-2xl border border-forest/10 bg-paper ${className}`} aria-labelledby="range-map-title">
      <div className="flex items-start justify-between gap-4 border-b border-line/80 px-5 py-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase">
            <Icon name="map" className="h-4 w-4" />
            Sarawak range guide
          </div>
          <h3 id="range-map-title" className="mt-1 text-lg font-semibold text-ink">
            Typical habitat regions
          </h3>
        </div>
        <span className="rounded-full bg-leaf px-2.5 py-1 text-[11px] font-semibold text-forest">Generalised</span>
      </div>

      <div className="relative bg-skywash/45 px-3 pt-4 pb-2">
        <svg
          className="h-auto w-full"
          viewBox="0 0 540 330"
          role="img"
          aria-label={`Schematic Sarawak map showing ${knownRegions.join(', ') || 'general habitat regions'}`}
        >
          <title>Sarawak habitat-region guide</title>
          <path
            d="M58 118c31-29 77-44 121-31 30 9 49 2 74-12 42-23 95-24 132-3 33 19 62 10 95 35 20 15 30 43 21 69-9 27-41 39-58 61-20 25-22 66-51 77-34 13-61-23-93-29-31-5-61 24-91 16-28-7-37-46-66-57-26-10-66 2-85-20-21-24-16-66 1-86Z"
            fill="#dfead7"
            stroke="#2b5f4d"
            strokeWidth="3"
          />
          <path d="M91 145c47-20 88-12 124 7 45 24 92 16 135-4 35-17 74-14 108 8" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 7" opacity=".75" />
          <path d="M110 232c51-14 95-4 135 16 35 17 86 4 117-20" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 7" opacity=".75" />
          <text x="73" y="93" fill="#46695c" fontSize="12" fontWeight="700" letterSpacing="1.7">SARAWAK</text>

          {knownRegions.map((region) => {
            const point = REGION_POINTS[region]
            return (
              <g key={region} transform={`translate(${point.x} ${point.y})`}>
                <circle className="pulse-ring" r="16" fill="#f5c842" opacity=".32" />
                <circle r="10" fill="#f5c842" stroke="#091d18" strokeWidth="3" />
                <circle r="3" fill="#b42b32" />
                <text x="15" y="4" fill="#091d18" fontSize="12" fontWeight="700">{point.short}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="space-y-3 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {regions.map((region) => (
            <span key={region} className="rounded-full border border-forest/10 bg-canvas px-2.5 py-1 text-xs font-medium text-forest">
              {region}
            </span>
          ))}
        </div>
        <p className="text-xs leading-5 text-muted">
          {sensitive
            ? 'This species is sensitive. BirdSense never displays exact sightings, nests or access details.'
            : 'This is a broad habitat guide, not a record of where an individual bird is currently present.'}
        </p>
      </div>
    </section>
  )
}
