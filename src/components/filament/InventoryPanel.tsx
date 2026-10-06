import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Boxes, Plus, Trash2 } from 'lucide-react'
import { useInventory } from '@/lib/hooks/useInventory'
import { hueFamily, HUE_FAMILIES } from '@/lib/color/names'
import { hexToLab } from '@/lib/color/convert'
import { Sheet } from '@/components/ui/overlay'
import { Button, ButtonLink, IconButton } from '@/components/ui/Button'
import { EmptyState, SegmentedControl } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { FilamentCatalog } from './FilamentPicker'
import { FilamentName, SpoolIcon } from './Spool'

const Ctx = createContext<{ open: (tab?: 'mine' | 'add') => void }>({ open: () => {} })
export const useInventoryPanel = () => useContext(Ctx)

/**
 * The "My Filaments" panel, available from every page. A side panel on desktop
 * and a bottom sheet on mobile (the same component, responsive).
 */
export function InventoryPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ open: boolean; tab: 'mine' | 'add' }>({ open: false, tab: 'mine' })
  const value = useMemo(() => ({ open: (tab: 'mine' | 'add' = 'mine') => setState({ open: true, tab }) }), [])
  return (
    <Ctx.Provider value={value}>
      {children}
      <InventoryPanel
        open={state.open}
        tab={state.tab}
        onTab={(tab) => setState((s) => ({ ...s, tab }))}
        onClose={() => setState((s) => ({ ...s, open: false }))}
      />
    </Ctx.Provider>
  )
}

function InventoryPanel({ open, onClose, tab, onTab }: { open: boolean; onClose: () => void; tab: 'mine' | 'add'; onTab: (t: 'mine' | 'add') => void }) {
  const inv = useInventory()
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="My Filaments"
      description={inv.signedIn ? `${inv.items.length} spools in your collection` : 'Sign in to track what you own'}
      headerActions={
        <Link to="/filaments" onClick={onClose} className="mr-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-fg-muted hover:bg-surface-2 hover:text-fg">
          Full page <ArrowUpRight className="size-3.5" />
        </Link>
      }
    >
      <div className="flex h-full flex-col px-5 pt-4 pb-4">
        <SegmentedControl
          label="Inventory view"
          value={tab}
          onChange={onTab}
          options={[{ value: 'mine', label: 'My spools' }, { value: 'add', label: 'Add from catalog', icon: <Plus className="size-3.5" /> }]}
          className="mb-4 w-full"
        />
        {!inv.signedIn ? (
          <EmptyState
            icon={<Boxes className="size-5" />}
            title="Track your filament"
            description="Add the spools you own and SpoolShare will show you which recipes you can make right now."
            action={<ButtonLink to="/signin" onClick={onClose}>Sign in</ButtonLink>}
          />
        ) : tab === 'mine' ? (
          <InventoryList onAdd={() => onTab('add')} />
        ) : (
          <FilamentCatalog mode="inventory" autoFocus className="min-h-[50dvh] flex-1" />
        )}
      </div>
    </Sheet>
  )
}

/** Owned spools grouped by hue family. Also used on the My Filaments page. */
export function InventoryList({ onAdd, dense }: { onAdd?: () => void; dense?: boolean }) {
  const inv = useInventory()
  const toast = useToast()
  const groups = useMemo(() => {
    const byFam = new Map<string, typeof inv.items>()
    for (const item of inv.items) {
      const fam = hueFamily(item.filament.hex)
      byFam.set(fam, [...(byFam.get(fam) ?? []), item])
    }
    return HUE_FAMILIES.map((f) => ({ ...f, items: (byFam.get(f.id) ?? []).sort((a, b) => hexToLab(b.filament.hex).L - hexToLab(a.filament.hex).L) })).filter((g) => g.items.length)
  }, [inv.items])

  if (inv.items.length === 0) {
    return (
      <EmptyState
        icon={<Boxes className="size-5" />}
        title="No filaments yet"
        description="Add the spools on your shelf. Recipes will then show “You can make this.”"
        action={onAdd && <Button onClick={onAdd} icon={<Plus className="size-4" />}>Add filament</Button>}
      />
    )
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.id} aria-label={g.label}>
          <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase">{g.label} <span className="font-normal">· {g.items.length}</span></h3>
          <ul className="-mx-2" role="list">
            {g.items.map((item) => (
              <li key={item.id} className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <SpoolIcon hex={item.filament.hex} size={dense ? 32 : 38} fill={item.remainingGrams != null ? item.remainingGrams / 1000 : 1} />
                <Link to={`/filament/${item.filament.id}`} className="min-w-0 flex-1 hover:underline">
                  <FilamentName filament={item.filament} />
                </Link>
                {item.remainingGrams != null && (
                  <span className="text-xs text-fg-subtle tabular" title="Remaining on spool">{item.remainingGrams} g</span>
                )}
                <IconButton
                  label={`Remove ${item.filament.colorName}`}
                  size="xs"
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                  onClick={async () => {
                    const f = item.filament
                    await inv.remove(f.id)
                    toast(`Removed ${f.colorName}`, { tone: 'info', action: { label: 'Undo', onClick: () => inv.add(f) } })
                  }}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
