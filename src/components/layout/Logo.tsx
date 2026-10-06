import { Link } from 'react-router'
import { cn } from '@/lib/utils/cn'

/** SpoolShare mark: two filament colors winding into one spool. */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={cn('shrink-0', className)} aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <circle cx="16" cy="16" r="10" fill="white" fillOpacity="0.18" />
      <path d="M16 6a10 10 0 0 1 10 10" fill="none" stroke="#FCD34D" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M6 16A10 10 0 0 1 16 6" fill="none" stroke="#7DD3FC" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M26 16A10 10 0 0 1 6 16" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round" />
      <circle cx="16" cy="16" r="3.4" fill="white" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2 rounded-lg', className)} aria-label="SpoolShare home">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">
        Spool<span className="text-accent">Share</span>
      </span>
    </Link>
  )
}
