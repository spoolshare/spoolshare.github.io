import { Compass, Target } from 'lucide-react'
import { ButtonLink } from '@/components/ui'

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <svg viewBox="0 0 220 140" className="w-64 max-w-full" role="img" aria-label="A tangled strand of filament">
        <circle cx="60" cy="70" r="46" fill="var(--surface-3)" stroke="var(--border-strong)" strokeWidth="2" />
        <circle cx="60" cy="70" r="34" fill="var(--accent)" opacity="0.85" />
        <circle cx="60" cy="70" r="14" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2" />
        <path
          d="M94 70c20 0 18-34 40-30s4 40 26 44 22-36 6-40-26 30-8 40 34-6 40-22"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path d="M150 52c-14 6-10 24 4 20s10-26-6-18" fill="none" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
      </svg>
      <p className="mt-6 font-mono text-sm text-fg-subtle">404</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">This page got tangled</h1>
      <p className="mt-2 text-fg-muted">We couldn’t find what you were looking for. It may have been moved, unpublished, or never printed.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink to="/" icon={<Compass className="size-4" />}>Explore recipes</ButtonLink>
        <ButtonLink to="/match" variant="outline" icon={<Target className="size-4" />}>Color Matcher</ButtonLink>
      </div>
    </div>
  )
}
