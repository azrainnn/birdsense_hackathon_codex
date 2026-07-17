interface BrandMarkProps {
  className?: string
}

/** A small, original mark: a listening arc wrapped around a stylised wing. */
export function BrandMark({ className = '' }: BrandMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M9 24.2C9 15.8 15.8 9 24.2 9c3.6 0 6.9 1.2 9.4 3.3" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M4.5 24.2C4.5 13.3 13.3 4.5 24.2 4.5c5.5 0 10.5 2.2 14.1 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".45" />
      <path d="M35.8 17.2c-4.7.4-10.6 3.1-15.6 8.1-2.9 2.9-5.2 6.2-6.6 9.4 4.2-.4 9.4-2.8 13.9-7.3 4.7-4.7 7.3-9.4 8.3-13.2Z" fill="currentColor" />
      <path d="m18.1 34.5 5.1-9.6 8.3-6.1-6.1 8.4-7.3 7.3Z" fill="#F5C842" />
      <circle cx="36.7" cy="12.5" r="3.2" fill="#B42B32" />
    </svg>
  )
}
