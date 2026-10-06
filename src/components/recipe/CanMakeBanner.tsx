import { Link } from 'react-router'
import { AlertTriangle, CircleCheck, Plus, Replace } from 'lucide-react'
import type { CanMakeResult } from '@/lib/recipe/canMake'
import { useInventory } from '@/lib/hooks/useInventory'
import { cn } from '@/lib/utils/cn'
import { ColorDot } from '@/components/color/Swatch'
import { Button, useToast } from '@/components/ui'
import { plural } from '@/lib/utils/format'

/** Big status block on the recipe page: "You own everything needed" or "You're missing 1 filament". */
export function CanMakeBanner({ result, className }: { result: CanMakeResult; className?: string }) {
  const inv = useInventory()
  const toast = useToast()
  if (!inv.signedIn) {
    return (
      <div className={cn('rounded-xl border border-border bg-surface-2 p-4 text-sm text-fg-muted', className)}>
        <Link to="/signin" className="font-medium text-accent hover:underline">Sign in</Link> and add your filaments to see whether you can make this.
      </div>
    )
  }
  if (result.canMake) {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl border border-accent/30 bg-accent-soft p-4', className)}>
        <CircleCheck className="size-6 shrink-0 text-accent" aria-hidden />
        <div>
          <div className="text-sm font-bold tracking-wide text-accent-soft-fg uppercase">You own everything needed</div>
          <div className="text-sm text-accent-soft-fg/80">All {result.requiredCount} filaments are in your collection.</div>
        </div>
      </div>
    )
  }
  return (
    <div className={cn('rounded-xl border border-warn/30 bg-warn-soft p-4', className)}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="size-6 shrink-0 text-warn" aria-hidden />
        <div>
          <div className="text-sm font-bold tracking-wide text-warn uppercase">You’re missing {plural(result.missing.length, 'filament')}</div>
          <div className="text-sm text-fg-muted">You own {result.ownedCount} of {result.requiredCount}.</div>
        </div>
      </div>
      <ul className="mt-3 space-y-2" role="list">
        {result.missing.map((m) => {
          const sub = result.substitutes.find((s) => s.missing.id === m.id)
          return (
            <li key={m.id} className="rounded-lg bg-surface/70 p-2.5">
              <div className="flex items-center gap-2.5">
                <ColorDot hex={m.hex} size={18} />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="font-medium">{m.colorName}</span>
                  <span className="text-fg-muted"> · {m.manufacturer.name} {m.productLine.name}</span>
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  icon={<Plus className="size-3.5" />}
                  onClick={async () => {
                    await inv.add(m)
                    toast(<>Added <b>{m.colorName}</b> to My Filaments</>)
                  }}
                >
                  I own it
                </Button>
              </div>
              {sub && (
                <p className="mt-1.5 flex items-center gap-1.5 pl-7 text-xs text-fg-muted">
                  <Replace className="size-3.5 shrink-0" aria-hidden />
                  You might substitute <ColorDot hex={sub.candidate.hex} size={10} /> <b className="font-medium text-fg">{sub.candidate.manufacturer.name} {sub.candidate.colorName}</b>
                  <span className="whitespace-nowrap">(display ΔE {sub.deltaE.toFixed(1)}, untested)</span>
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
