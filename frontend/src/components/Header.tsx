import { NavLink } from 'react-router-dom'
import { BrandMark } from './BrandMark'

const NAV_LINKS = [
  { to: '/', label: 'Home', mobileLabel: 'Home', end: true },
  { to: '/identify', label: 'Identify', mobileLabel: 'Identify', end: false },
  { to: '/species', label: 'Species guide', mobileLabel: 'Guide', end: false },
  { to: '/field-log', label: 'Field log', mobileLabel: 'Log', end: false },
]

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-forest/10 bg-canvas/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-8">
        <NavLink to="/" className="group flex min-w-0 items-center gap-2 rounded-lg sm:gap-2.5" aria-label="BirdSense home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-paper shadow-sm transition group-hover:-rotate-6">
            <BrandMark className="h-7 w-7" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block font-semibold tracking-tight text-ink">BirdSense</span>
            <span className="mt-1 hidden truncate text-[10px] font-bold tracking-[0.13em] text-sarawak-red uppercase sm:block">Sarawak field guide</span>
          </span>
        </NavLink>
        <nav className="flex items-center gap-0.5 text-sm sm:gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-lg px-2 py-2 text-[13px] font-semibold transition sm:px-3 sm:text-sm ${
                  isActive ? 'bg-ink text-paper' : 'text-forest hover:bg-leaf/70'
                }`
              }
            >
              <span className="sm:hidden">{link.mobileLabel}</span><span className="hidden sm:inline">{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
