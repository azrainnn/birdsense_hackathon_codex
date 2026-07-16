type IconName =
  | 'arrow-right'
  | 'audio'
  | 'map'
  | 'shield'
  | 'check'
  | 'alert'
  | 'upload'
  | 'sparkle'
  | 'location'
  | 'clock'
  | 'close'

interface IconProps {
  name: IconName
  className?: string
  strokeWidth?: number
}

export function Icon({ name, className = '', strokeWidth = 1.8 }: IconProps) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  const paths: Record<IconName, React.ReactNode> = {
    'arrow-right': <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
    audio: <><path d="M4 14.5v-5a2 2 0 0 1 2-2h2l4-3v15l-4-3H6a2 2 0 0 1-2-2Z" /><path d="M16 9a4 4 0 0 1 0 6" /><path d="M19 6a8 8 0 0 1 0 12" /></>,
    map: <><path d="m9 18-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15" /><path d="M15 6v15" /></>,
    shield: <><path d="M12 3 4.8 6v5.4c0 4.4 3 8.5 7.2 9.6 4.2-1.1 7.2-5.2 7.2-9.6V6L12 3Z" /><path d="m9 12 2 2 4-4" /></>,
    check: <path d="m5 12 4.2 4L19 6.7" />,
    alert: <><path d="M12 3 2.8 20h18.4L12 3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    sparkle: <><path d="m12 3 1.5 5.2L19 10l-5.5 1.8L12 17l-1.5-5.2L5 10l5.5-1.8L12 3Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15Z" /></>,
    location: <><path d="M20 10.5c0 5.4-8 10.5-8 10.5S4 15.9 4 10.5a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10.5" r="2.5" /></>,
    clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.4 2" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
  }

  return <svg {...common}>{paths[name]}</svg>
}
