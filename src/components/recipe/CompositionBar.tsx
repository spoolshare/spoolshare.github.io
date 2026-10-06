import type { CompositionEntry, FilamentView, ID } from '@/types'
import { cn } from '@/lib/utils/cn'
import { formatGrams, formatPercent } from '@/lib/utils/format'
import { isVeryLight } from '@/lib/color/convert'
import { ColorDot } from '@/components/color/Swatch'
import { Check, X } from 'lucide-react'

/** The TRUE final composition: a stacked bar plus a labeled legend with percentages and grams. */
export function CompositionBar({
  composition,
  filamentsById,
  grams,
  owned,
  className,
  showLegend = true,
}: {
  composition: CompositionEntry[]
  filamentsById: Record<ID, FilamentView> | Map<ID, FilamentView>
  grams?: number
  owned?: Set<ID>
  className?: string
  showLegend?: boolean
}) {
  const get = (id: ID) => (filamentsById instanceof Map ? filamentsById.get(id) : filamentsById[id])
  return (
    <div className={className}>
      <div className="flex h-4 w-full overflow-hidden rounded-full border border-border" role="img" aria-label={composition.map((c) => `${formatPercent(c.fraction)} ${get(c.filamentId)?.colorName}`).join(', ')}>
        {composition.map((c, i) => {
          const f = get(c.filamentId)
          return (
            <div
              key={c.filamentId}
              className={cn('h-full transition-[width] duration-500', i > 0 && 'border-l border-white/60', f && isVeryLight(f.hex) && 'bg-[repeating-linear-gradient(45deg,transparent_0_3px,rgb(0_0_0/0.05)_3px_6px)]')}
              style={{ width: `${c.fraction * 100}%`, backgroundColor: f?.hex ?? '#999' }}
              title={`${f?.colorName}: ${formatPercent(c.fraction)}`}
            />
          )
        })}
      </div>
      {showLegend && (
        <ul className="mt-3 space-y-1.5" role="list">
          {composition.map((c) => {
            const f = get(c.filamentId)
            const has = owned?.has(c.filamentId)
            return (
              <li key={c.filamentId} className="flex items-center gap-2.5 text-sm">
                <ColorDot hex={f?.hex ?? '#999'} size={14} />
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{f?.colorName ?? 'Unknown filament'}</span>
                  <span className="text-fg-muted"> · {f?.manufacturer.name} {f?.productLine.name}</span>
                </span>
                {owned && (
                  has ? <Check className="size-4 text-accent" aria-label="You own this" /> : <X className="size-4 text-warn" aria-label="You don't own this" />
                )}
                <span className="w-16 text-right font-mono text-xs font-medium tabular">{formatPercent(c.fraction)}</span>
                {grams != null && <span className="w-16 text-right font-mono text-xs text-fg-muted tabular">{formatGrams(c.fraction * grams)}</span>}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
