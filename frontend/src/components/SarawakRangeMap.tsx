import { Icon } from './Icon'

interface SarawakRangeMapProps {
  regions: string[]
  sensitive: boolean
  className?: string
}

const REGION_POINTS: Record<string, { x: number; y: number; short: string }> = {
  'Kuching & western lowlands': { x: 124, y: 333, short: 'Kuching' },
  'Bintulu & central lowlands': { x: 262, y: 246, short: 'Bintulu' },
  'Rajang basin': { x: 200, y: 296, short: 'Rajang' },
  'Ulu Baram & Mulu': { x: 357, y: 207, short: 'Mulu' },
  'Usun Apau & Kelabit Highlands': { x: 371, y: 237, short: 'Highlands' },
}

// Natural Earth 1:10m land geometry, cropped to Borneo and lightly simplified for UI.
// Natural Earth data is public domain: naturalearthdata.com.
const BORNEO_COAST = 'M454.4 57.5 L451.6 76.4 L461.3 70.5 L464.2 59.1 L470.3 55.5 L475.7 58.8 L477.7 74.1 L486.0 78.6 L489.8 74.9 L499.6 83.5 L499.4 93.5 L493.2 96.4 L496.7 107.9 L486.5 113.2 L502.0 111.2 L514.4 103.4 L519.9 113.4 L509.5 116.2 L511.5 122.4 L532.1 116.0 L543.7 122.7 L542.3 130.6 L546.6 125.0 L561.0 137.3 L574.0 134.4 L578.3 139.0 L578.0 147.1 L572.3 152.0 L548.2 160.2 L538.9 160.9 L531.7 155.4 L520.5 163.4 L527.6 172.9 L537.8 177.7 L538.8 182.4 L544.0 181.8 L546.4 186.0 L541.8 189.8 L512.6 196.5 L496.0 186.7 L494.5 199.3 L489.0 202.0 L481.6 199.6 L497.7 212.3 L489.3 211.8 L502.2 218.5 L498.4 219.5 L504.8 222.4 L501.4 226.4 L490.4 225.4 L486.5 218.8 L488.6 228.2 L464.2 228.9 L472.8 227.8 L475.0 234.2 L485.4 237.0 L480.9 246.7 L476.4 247.2 L494.0 254.8 L491.4 260.0 L497.5 261.0 L490.3 263.1 L500.1 264.1 L494.2 268.0 L502.5 271.4 L504.7 279.1 L517.7 292.8 L516.4 298.8 L509.2 305.3 L504.7 304.6 L508.4 307.5 L500.8 308.4 L507.1 310.5 L506.5 315.8 L520.0 327.6 L550.6 348.0 L557.1 357.9 L564.4 358.5 L564.5 362.8 L554.1 370.8 L533.0 370.8 L518.4 365.5 L508.1 355.1 L515.2 371.1 L508.5 369.2 L500.4 374.1 L486.5 406.2 L489.6 413.4 L484.8 424.0 L487.9 429.6 L485.1 438.5 L494.7 433.1 L490.7 446.9 L487.2 447.4 L494.5 451.0 L479.9 457.6 L477.0 452.9 L460.5 474.9 L453.5 476.0 L449.6 463.9 L450.5 481.2 L440.6 485.4 L439.2 494.3 L423.1 502.8 L433.4 501.6 L435.5 508.8 L435.0 515.7 L426.2 522.2 L442.4 524.9 L438.1 541.7 L427.2 540.3 L426.9 544.5 L431.8 542.7 L426.4 563.8 L423.4 564.5 L418.8 555.4 L417.1 564.3 L425.2 571.4 L417.4 576.9 L410.1 595.4 L343.8 624.7 L340.9 622.0 L341.1 599.2 L336.6 590.8 L338.0 582.1 L334.3 589.9 L323.4 584.6 L328.6 575.2 L319.5 583.9 L315.5 582.1 L316.0 574.1 L312.1 582.5 L291.3 587.7 L290.2 573.3 L277.7 577.3 L274.5 572.7 L277.0 578.3 L260.9 560.5 L256.1 569.8 L260.2 572.7 L240.7 585.6 L218.6 581.2 L203.4 593.5 L198.5 591.5 L199.7 567.6 L195.7 551.1 L193.2 561.5 L186.4 565.2 L173.9 560.6 L154.4 569.1 L144.9 565.7 L155.1 558.3 L140.2 568.5 L134.4 557.7 L119.9 564.6 L114.5 545.1 L120.8 539.9 L114.6 535.7 L111.2 511.0 L101.6 504.7 L108.2 495.5 L108.7 478.2 L93.3 461.0 L94.5 456.1 L90.1 461.8 L82.4 455.7 L75.5 458.2 L69.5 455.2 L69.0 445.7 L81.4 448.2 L73.7 444.8 L76.0 442.2 L62.7 438.7 L62.5 430.1 L58.2 425.1 L67.1 423.8 L63.8 410.1 L70.9 411.2 L51.6 394.5 L48.3 369.4 L54.6 363.1 L51.8 352.6 L62.9 348.1 L69.2 340.8 L54.9 349.9 L59.3 333.7 L69.5 325.6 L73.0 313.3 L88.4 305.8 L90.9 316.5 L102.8 325.7 L121.3 326.6 L123.2 320.1 L126.3 325.3 L132.3 323.2 L130.2 329.3 L143.5 333.0 L141.0 338.1 L146.9 331.8 L164.6 342.0 L176.9 342.9 L160.7 337.4 L157.7 331.2 L162.2 325.9 L171.0 329.0 L162.3 321.5 L167.8 306.5 L176.6 301.8 L166.8 302.6 L168.6 288.8 L182.5 292.4 L178.0 285.4 L183.9 285.0 L178.9 282.6 L180.1 274.7 L191.4 267.1 L259.5 250.9 L281.2 220.8 L307.3 194.3 L308.8 178.0 L326.6 177.4 L363.8 154.6 L359.9 163.0 L363.3 167.5 L371.6 159.4 L379.7 161.9 L389.2 154.0 L391.7 146.6 L379.5 141.7 L380.9 136.3 L391.6 125.0 L391.6 130.9 L404.1 128.9 L408.2 118.6 L414.3 114.5 L417.1 100.1 L437.4 81.3 L449.7 55.1 L454.4 57.5 Z'

export function SarawakRangeMap({ regions, sensitive, className = '' }: SarawakRangeMapProps) {
  const knownRegions = regions.filter((region) => REGION_POINTS[region])
  return (
    <section className={`overflow-hidden rounded-3xl border border-forest/10 bg-paper shadow-[0_12px_36px_rgb(9_29_24/5%)] ${className}`} aria-labelledby="range-map-title">
      <div className="flex items-start justify-between gap-4 border-b border-line/80 px-5 py-4">
        <div><div className="flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-sarawak-red uppercase"><Icon name="map" className="h-4 w-4" />Borneo habitat guide</div><h3 id="range-map-title" className="mt-1 text-lg font-semibold text-ink">Sarawak in the Borneo landscape</h3></div>
        <span className="rounded-full bg-leaf px-2.5 py-1 text-[11px] font-semibold text-forest">Coastline reference</span>
      </div>
      <div className="relative overflow-hidden bg-[radial-gradient(circle_at_25%_15%,rgb(245_200_66/25%),transparent_24rem),linear-gradient(145deg,#dce9e3,#f7f3e8)] p-2 sm:p-5">
        <svg className="mx-auto h-auto w-full max-w-xl" viewBox="0 0 620 680" role="img" aria-label={`Borneo coastline with broad Sarawak habitat guide markers for ${knownRegions.join(', ') || 'general habitat regions'}`}>
          <title>Accurate Borneo coastline with broad Sarawak habitat-region markers</title>
          <defs><clipPath id="borneo-coast"><path d={BORNEO_COAST} /></clipPath><linearGradient id="borneo-land" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#dfead7" /><stop offset="1" stopColor="#b9d0bc" /></linearGradient><pattern id="map-grain" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".8" fill="#123d32" opacity=".13" /></pattern></defs>
          <path d={BORNEO_COAST} fill="url(#borneo-land)" stroke="#123d32" strokeWidth="3" strokeLinejoin="round" />
          <path d={BORNEO_COAST} fill="url(#map-grain)" clipPath="url(#borneo-coast)" />
          <g fill="#46695c" fontSize="12" fontWeight="700" letterSpacing="1.4"><text x="113" y="272">SARAWAK</text><text x="433" y="132">SABAH</text><text x="332" y="154" fontSize="9">BRUNEI</text><text x="305" y="462" fontSize="13">KALIMANTAN</text></g>
          <g fill="none" stroke="#2b5f4d" strokeDasharray="5 7" strokeWidth="1.5" opacity=".4"><path d="M101 329 C178 313 250 292 316 220" /><path d="M318 220 C356 212 398 190 429 164" /></g>
          {knownRegions.map((region) => { const point = REGION_POINTS[region]; return <g key={region} transform={`translate(${point.x} ${point.y})`}><circle className="pulse-ring" r="17" fill="#f5c842" opacity=".38" /><circle r="10" fill="#f5c842" stroke="#091d18" strokeWidth="3" /><circle r="3" fill="#b42b32" /><text x="16" y="4" fill="#091d18" fontSize="11" fontWeight="700">{point.short}</text></g> })}
        </svg>
      </div>
      <div className="space-y-3 px-5 py-4"><div className="flex flex-wrap gap-2">{regions.map((region) => <span key={region} className="rounded-full border border-forest/10 bg-canvas px-2.5 py-1 text-xs font-medium text-forest">{region}</span>)}</div><p className="text-xs leading-5 text-muted">{sensitive ? 'This species is sensitive. Markers show only broad habitat context; BirdSense never displays exact sightings, nests or access details.' : 'Borneo coastline uses Natural Earth public-domain data. Markers are broad habitat references, not species boundaries or live sightings.'}</p></div>
    </section>
  )
}
