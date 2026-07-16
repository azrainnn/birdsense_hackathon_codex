import { NavLink } from 'react-router-dom'
import { BrandMark } from './BrandMark'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/identify', label: 'Identify', end: false },
  { to: '/species', label: 'Species guide', end: false },
  { to: '/field-log', label: 'Field log', end: false },
]

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest/10 bg-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <NavLink to="/" className="group flex min-w-0 items-center gap-2.5 rounded-lg" aria-label="BirdSense home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-paper shadow-sm transition group-hover:-rotate-6">
            <BrandMark className="h-7 w-7" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block font-semibold tracking-tight text-ink">BirdSense</span>
            <span className="mt-1 block truncate text-[10px] font-bold tracking-[0.13em] text-sarawak-red uppercase">Sarawak field guide</span>
          </span>
        </NavLink>
        <nav className="-mr-1 flex items-center gap-1 overflow-x-auto text-sm" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-2.5 py-2 font-semibold transition sm:px-3 ${
                  isActive ? 'bg-ink text-paper' : 'text-forest hover:bg-leaf/70'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
