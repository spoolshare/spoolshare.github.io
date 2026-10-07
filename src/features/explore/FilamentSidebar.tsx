import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ChevronDown, Info, Plus } from 'lucide-react'
import { useInventory } from '@/lib/hooks/useInventory'
import { hexToLab } from '@/lib/color/convert'
import { cn } from '@/lib/utils/cn'
import { ColorDot } from '@/components/color/Swatch'
import { Switch } from '@/components/ui'
import { useInventoryPanel } from '@/components/filament/InventoryPanel'

const COLLAPSED = 12

/** Compact, always-visible inventory that drives the feed (desktop only). */
export function FilamentSidebar({ onlyCanMake, onOnlyCanMake }: { onlyCanMake: boolean; onOnlyCanMake: (v: boolean) => void }) {
  const inv = useInventory()
  const panel = useInventoryPanel()
  const [expanded, setExpanded] = useState(false)
  const items = useMemo(() => [...inv.items].sort((a, b) => hexToLab(b.filament.hex).L - hexToLab(a.filament.hex).L), [inv.items])
  const shown = expanded ? items : items.slice(0, COLLAPSED)

  return (
    <div className="text-sm">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="text-xs font-semibold tracking-wider text-fg-muted uppercase">My Filaments</h2>
        {inv.signedIn && (
          <Link to="/filaments" className="text-xs text-fg-muted hover:text-fg hover:underline">
            Manage{inv.items.length > 0 && <span className="tabular"> ({inv.items.length})</span>}
          </Link>
        )}
      </div>

      {!inv.signedIn ? (
        <p className="text-fg-muted">
          <Link to="/signin" className="font-medium text-accent hover:underline">Sign in</Link> and add the spools you own to see which colors you can make.
        </p>
      ) : (
        <>
          {items.length === 0 ? (
            <p className="mb-2 text-fg-muted">Add the filament on your shelf, and the feed will show what you can make.</p>
          ) : (
            <ul className={cn('-mx-1.5', expanded && 'max-h-[55vh] overflow-y-auto pr-1')} role="list">
              {shown.map((i) => (
                <li key={i.id}>
                  <Link to={`/filament/${i.filament.id}`} className="flex items-center gap-2.5 rounded px-1.5 py-1 hover:bg-surface-2">
                    <ColorDot hex={i.filament.hex} size={14} />
                    <span className="min-w-0 leading-tight">
                      <span className="block truncate font-medium">{i.filament.colorName}</span>
                      <span className="block truncate text-xs text-fg-muted">{i.filament.productLine.name}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {items.length > COLLAPSED && (
            <button type="button" onClick={() => setExpanded((e) => !e)} className="mt-1 inline-flex items-center gap-1 text-xs text-fg-muted hover:text-fg">
              <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} aria-hidden />
              {expanded ? 'Show fewer' : `Show all ${items.length}`}
            </button>
          )}
          <button
            type="button"
            onClick={() => panel.open('add')}
            className="mt-2 flex w-full items-center gap-2 rounded px-0 py-1 text-sm font-medium text-accent hover:underline"
          >
            <Plus className="size-4" aria-hidden /> Add filament
          </button>

          <div className="mt-4 border-t border-border pt-3">
            <Switch checked={onlyCanMake} onChange={onOnlyCanMake} size="sm" label={<span className="text-sm">Only show colors I can make</span>} />
          </div>
        </>
      )}

      <div className="mt-6 border-t border-border pt-3 text-xs text-fg-muted">
        <Link to="/about" className="inline-flex items-start gap-1.5 hover:text-fg">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>Why every color here is physically printed, and how reliability works</span>
        </Link>
      </div>
    </div>
  )
}
