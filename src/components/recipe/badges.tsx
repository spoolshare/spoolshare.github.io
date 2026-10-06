import { Calculator, CheckCheck, CircleCheck, FlaskConical, AlertTriangle } from 'lucide-react'
import type { Difficulty, TrustLevel } from '@/types'
import { cn } from '@/lib/utils/cn'
import { DIFFICULTY_META, TRUST_META } from '@/lib/recipe/trust'
import type { CanMakeResult } from '@/lib/recipe/canMake'

const TRUST_ICON: Record<TrustLevel, typeof FlaskConical> = {
  calculated: Calculator,
  tested: FlaskConical,
  reproduced: CircleCheck,
  'highly-reproduced': CheckCheck,
}

const TRUST_ICON_COLOR: Record<TrustLevel, string> = {
  calculated: 'text-calc',
  tested: 'text-fg-subtle',
  reproduced: 'text-accent',
  'highly-reproduced': 'text-accent',
}

/**
 * Quiet trust label: an icon plus text, with no colored pill. "Calculated"
 * stays violet so a prediction is never mistaken for a community result.
 * `overlay` is for use on top of a swatch image: a small neutral scrim with white text.
 */
export function TrustBadge({ level, size = 'sm', className, overlay }: { level: TrustLevel; size?: 'xs' | 'sm' | 'md'; className?: string; overlay?: boolean }) {
  const Icon = TRUST_ICON[level]
  const meta = TRUST_META[level]
  return (
    <span
      title={meta.description}
      className={cn(
        'inline-flex items-center gap-1 font-medium whitespace-nowrap',
        size === 'xs' && 'text-[11px]',
        size === 'sm' && 'text-xs',
        size === 'md' && 'text-sm',
        overlay
          ? 'rounded-md bg-black/45 px-1.5 py-0.5 text-white backdrop-blur-sm'
          : level === 'calculated' ? 'text-calc' : 'text-fg-muted',
        className,
      )}
    >
      <Icon className={cn(size === 'md' ? 'size-4' : 'size-3.5', !overlay && TRUST_ICON_COLOR[level])} aria-hidden />
      {meta.label}
    </span>
  )
}

/** Difficulty as dots plus a label (not color alone). */
export function DifficultyMeter({ difficulty, className, showLabel = true }: { difficulty: Difficulty; className?: string; showLabel?: boolean }) {
  const { label, level } = DIFFICULTY_META[difficulty]
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-xs text-fg-muted', className)} title={`Difficulty: ${label}`}>
      <span className="flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn('h-2.5 w-1.5 rounded-sm', i <= level ? 'bg-fg-muted' : 'bg-surface-3')} />
        ))}
      </span>
      {showLabel ? label : <span className="sr-only">Difficulty: {label}</span>}
    </span>
  )
}

/** One-line "can make" status for cards. */
export function CanMakeLine({ result, signedIn, className }: { result: CanMakeResult | null; signedIn: boolean; className?: string }) {
  if (!signedIn || !result) return null
  if (result.canMake) {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent uppercase', className)}>
        <CircleCheck className="size-3.5" aria-hidden /> You can make this
      </div>
    )
  }
  return (
    <div className={cn('flex min-w-0 items-start gap-1.5 text-xs text-fg-muted', className)}>
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warn" aria-hidden />
      <span className="min-w-0">
        <span className="font-medium text-fg">Missing: </span>
        <span className="line-clamp-1">{result.missing.map((m) => `${m.productLine.name} ${m.colorName}`).join(', ')}</span>
      </span>
    </div>
  )
}
