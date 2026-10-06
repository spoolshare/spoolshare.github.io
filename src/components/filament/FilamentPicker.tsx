import { useMemo, useState } from 'react'
import { Check, Plus, PackagePlus } from 'lucide-react'
import type { FilamentView, ID, Material } from '@/types'
import { MATERIALS } from '@/types'
import { api } from '@/lib/api'
import { useQuery } from '@/lib/hooks/useQuery'
import { useInventory } from '@/lib/hooks/useInventory'
import { cn } from '@/lib/utils/cn'
import { Dialog } from '@/components/ui/overlay'
import { Chip, SearchInput, Select } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { FilamentName, SpoolIcon } from './Spool'
import { CustomFilamentDialog } from './CustomFilamentDialog'

/**
 * Catalog browser. Two modes:
 *  - mode="inventory": "+ Add to My Filaments" toggles
 *  - mode="select": pick one filament for a recipe input (owned ones are listed first)
 */
export function FilamentCatalog({
  mode = 'inventory',
  onSelect,
  selectedId,
  className,
  autoFocus,
  ownedFirst,
}: {
  mode?: 'inventory' | 'select'
  onSelect?: (f: FilamentView) => void
  selectedId?: ID
  className?: string
  autoFocus?: boolean
  ownedFirst?: boolean
}) {
  const [text, setText] = useState('')
  const [mfr, setMfr] = useState<string>('')
  const [material, setMaterial] = useState<Material | ''>('')
  const [onlyOwned, setOnlyOwned] = useState(mode === 'select' && !!ownedFirst)
  const [customOpen, setCustomOpen] = useState(false)
  const inv = useInventory()
  const toast = useToast()

  const { data: mfrs } = useQuery('catalog:manufacturers', () => api.listManufacturers())
  const q = { text, manufacturerIds: mfr ? [mfr] : undefined, materials: material ? [material] : undefined, limit: 300 }
  const { data, loading } = useQuery(`catalog:search:${JSON.stringify(q)}`, () => api.searchFilaments(q))

  const rows = useMemo(() => {
    let r = data ?? []
    if (onlyOwned) r = r.filter((f) => inv.ownedIds.has(f.id))
    if (ownedFirst) r = [...r].sort((a, b) => Number(inv.ownedIds.has(b.id)) - Number(inv.ownedIds.has(a.id)))
    return r
  }, [data, onlyOwned, ownedFirst, inv.ownedIds])

  const toggleOwned = async (f: FilamentView) => {
    try {
      if (inv.owns(f.id)) {
        await inv.remove(f.id)
        toast(`Removed ${f.colorName} from My Filaments`, { tone: 'info', action: { label: 'Undo', onClick: () => inv.add(f) } })
      } else {
        await inv.add(f)
        toast(<>Added <b>{f.colorName}</b> to My Filaments</>)
      }
    } catch (e) {
      toast((e as Error).message, { tone: 'error' })
    }
  }

  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      <div className="flex flex-col gap-2">
        <SearchInput value={text} onChange={setText} placeholder="Search brand, line, color, code or HEX…" autoFocus={autoFocus} label="Search filament catalog" />
        <div className="flex flex-wrap items-center gap-2">
          <Select value={mfr} onChange={(e) => setMfr(e.target.value)} aria-label="Manufacturer" className="min-w-36 flex-1">
            <option value="">All brands</option>
            {mfrs?.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
          <Select value={material} onChange={(e) => setMaterial(e.target.value as Material)} aria-label="Material" className="min-w-28 flex-1">
            <option value="">All materials</option>
            {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
          {inv.signedIn && (
            <Chip active={onlyOwned} onClick={() => setOnlyOwned((v) => !v)} icon={<Check className="size-3.5" />}>
              Owned
            </Chip>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-fg-subtle">
        <span>{loading ? 'Searching…' : `${rows.length} filaments`}</span>
        {inv.signedIn && (
          <button type="button" onClick={() => setCustomOpen(true)} className="inline-flex items-center gap-1 font-medium text-accent hover:underline">
            <PackagePlus className="size-3.5" /> Not listed? Add a custom filament
          </button>
        )}
      </div>

      <ul className="mt-2 -mx-2 min-h-0 flex-1 overflow-y-auto" role="list">
        {loading && !data &&
          Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton className="size-9 rounded-full" />
              <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-48" /></div>
            </li>
          ))}
        {rows.map((f) => {
          const owned = inv.owns(f.id)
          const selected = selectedId === f.id
          return (
            <li key={f.id}>
              <div
                className={cn(
                  'group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors',
                  mode === 'select' && 'cursor-pointer hover:bg-surface-2',
                  selected && 'bg-accent-soft',
                )}
                onClick={mode === 'select' ? () => onSelect?.(f) : undefined}
              >
                <SpoolIcon hex={f.hex} size={36} />
                <FilamentName filament={f} className="flex-1" />
                <span className="hidden font-mono text-xs text-fg-subtle sm:block">{f.hex}</span>
                {f.material !== 'PLA' && <span className="hidden rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted sm:inline">{f.material}</span>}
                {mode === 'inventory' ? (
                  <Button
                    size="xs"
                    variant={owned ? 'soft' : 'outline'}
                    icon={owned ? <Check className="size-3.5" /> : <Plus className="size-3.5" />}
                    onClick={() => toggleOwned(f)}
                    aria-pressed={owned}
                    aria-label={owned ? `Remove ${f.colorName} from My Filaments` : `Add ${f.colorName} to My Filaments`}
                    disabled={!inv.signedIn}
                  >
                    {owned ? 'Owned' : 'Add'}
                  </Button>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onSelect?.(f) }}
                    className={cn('rounded-md px-2 py-1 text-xs font-medium', owned ? 'text-accent' : 'text-fg-subtle')}
                    aria-label={`Use ${f.colorName}`}
                  >
                    {owned ? '✓ Owned' : 'Select'}
                  </button>
                )}
              </div>
            </li>
          )
        })}
        {!loading && rows.length === 0 && (
          <li className="px-2 py-8 text-center text-sm text-fg-muted">No filaments match. Try another search, or add a custom filament.</li>
        )}
      </ul>
      <CustomFilamentDialog
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        onCreated={(f) => {
          setCustomOpen(false)
          if (mode === 'select') onSelect?.(f)
          else void inv.add(f)
        }}
      />
    </div>
  )
}

export function FilamentPickerDialog({
  open,
  onClose,
  onSelect,
  selectedId,
  title = 'Choose a filament',
}: {
  open: boolean
  onClose: () => void
  onSelect: (f: FilamentView) => void
  selectedId?: ID
  title?: string
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description="Filaments you own are listed first." size="lg">
      <FilamentCatalog
        mode="select"
        ownedFirst
        autoFocus
        selectedId={selectedId}
        onSelect={(f) => {
          onSelect(f)
          onClose()
        }}
        className="h-[60dvh]"
      />
    </Dialog>
  )
}
