import { NavLink } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Identify', end: true },
  { to: '/history', label: 'History', end: false },
  { to: '/species', label: 'About species', end: false },
]

export function Header() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-black">
            🔎
          </span>
          <span className="font-semibold tracking-tight text-white">BirdSense</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive ? 'font-semibold text-white' : 'text-gray-400 hover:text-gray-200'
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
