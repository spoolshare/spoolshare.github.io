import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ArrowRight, Boxes, Pencil, Plus, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react'
import type { FilamentView, ID } from '@/types'
import { api } from '@/lib/api'
import { useInventory, type InventoryEntry } from '@/lib/hooks/useInventory'
import { useQuery } from '@/lib/hooks/useQuery'
import { checkCanMake } from '@/lib/recipe/canMake'
import { hueFamily, HUE_FAMILIES } from '@/lib/color/names'
import { hexToLab } from '@/lib/color/convert'
import { cn } from '@/lib/utils/cn'
import {
  Badge, Button, ButtonLink, Card, Dialog, EmptyState, Field, IconButton, Input, PageHeader, SearchInput,
  SegmentedControl, Select, Textarea, useToast,
} from '@/components/ui'
import { FilamentCatalog } from '@/components/filament/FilamentPicker'
import { FilamentName, SpoolIcon } from '@/components/filament/Spool'
import { ColorDot } from '@/components/color/Swatch'

type GroupBy = 'hue' | 'brand'
type SortBy = 'color' | 'name' | 'remaining' | 'added'

export default function MyFilamentsPage() {
  const inv = useInventory()
  const [params, setParams] = useSearchParams()
  const welcome = params.get('welcome') === '1'
  const [mobileTab, setMobileTab] = useState<'mine' | 'add'>(welcome ? 'add' : 'mine')

  if (!inv.signedIn) return <SignedOutGate />

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Inventory"
        title="My Filaments"
        description="The spools on your shelf. SpoolShare uses this to show which community recipes you can make right now."
      />

      {welcome && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4 text-accent-soft-fg">
          <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <div className="font-semibold">Welcome to SpoolShare! Start by adding the filament you own.</div>
            <p className="mt-0.5 text-sm opacity-90">Search the catalog on the right and press “Add”. Every recipe will then tell you whether you can make it.</p>
          </div>
          <IconButton label="Dismiss welcome" size="sm" onClick={() => { params.delete('welcome'); setParams(params, { replace: true }) }}>
            <X className="size-4" />
          </IconButton>
        </div>
      )}

      <Shelf items={inv.items} />
      <Stats />

      {/* mobile tabs */}
      <div className="mt-8 lg:hidden">
        <SegmentedControl
          label="Filament view"
          value={mobileTab}
          onChange={setMobileTab}
          className="mb-4 w-full"
          options={[
            { value: 'mine', label: `My spools (${inv.items.length})` },
            { value: 'add', label: 'Add from catalog', icon: <Plus className="size-3.5" /> },
          ]}
        />
        {mobileTab === 'mine' ? <OwnedList onAdd={() => setMobileTab('add')} /> : (
          <Card className="p-4"><FilamentCatalog mode="inventory" className="h-[70dvh]" /></Card>
        )}
      </div>

      {/* desktop two-pane */}
      <div className="mt-8 hidden gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="flex max-h-[calc(100dvh-7rem)] min-h-[520px] flex-col p-5 lg:sticky lg:top-20">
          <h2 className="mb-3 text-base font-semibold">My spools <span className="font-normal text-fg-subtle">· {inv.items.length}</span></h2>
          <OwnedList />
        </Card>
        <Card className="flex max-h-[calc(100dvh-7rem)] min-h-[520px] flex-col p-5 lg:sticky lg:top-20">
          <h2 className="mb-3 text-base font-semibold">Filament catalog</h2>
          <FilamentCatalog mode="inventory" className="min-h-0 flex-1" />
        </Card>
      </div>
    </div>
  )
}

function SignedOutGate() {
  const hexes = ['#FFFFFF', '#0056B8', '#C12E1F', '#F4EE2A', '#00AE42', '#5E43B7', '#F55A74', '#00B1B7', '#000000']
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex justify-center -space-x-3" aria-hidden>
        {hexes.map((h, i) => (
          <SpoolIcon key={h} hex={h} size={56} className="rounded-full bg-surface shadow-md" fill={1 - (i % 3) * 0.2} />
        ))}
      </div>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight">Your filament shelf, everywhere you browse</h1>
      <p className="mx-auto mt-3 max-w-xl text-fg-muted">
        Add the spools you own and every recipe on SpoolShare will tell you <b>“✓ You can make this”</b> or exactly which filament you’re missing.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink to="/signin?next=/filaments" size="lg">Sign in</ButtonLink>
        <ButtonLink to="/signup" size="lg" variant="outline">Create account</ButtonLink>
      </div>
    </div>
  )
}

function Shelf({ items }: { items: InventoryEntry[] }) {
  const sorted = useMemo(() => [...items].sort((a, b) => hexToLab(a.filament.hex).L - hexToLab(b.filament.hex).L), [items])
  if (items.length === 0) return null
  return (
    <section aria-label="Your spool shelf" className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-surface to-surface-2">
      <div className="scrollbar-none flex gap-1 overflow-x-auto px-5 pt-5 pb-3">
        {sorted.map((i) => (
          <Link
            key={i.id}
            to={`/filament/${i.filament.id}`}
            className="group flex shrink-0 flex-col items-center gap-1 rounded-xl px-1.5 pt-1 pb-1.5 transition-transform hover:-translate-y-1"
            title={`${i.filament.manufacturer.name} ${i.filament.productLine.name} ${i.filament.colorName}`}
          >
            <SpoolIcon hex={i.filament.hex} size={58} fill={i.remainingGrams != null ? i.remainingGrams / 1000 : 1} className="drop-shadow-sm" />
            <span className="max-w-16 truncate text-[10px] font-medium text-fg-muted group-hover:text-fg">{i.filament.colorName}</span>
          </Link>
        ))}
      </div>
      <div aria-hidden className="mx-3 mb-3 h-1.5 rounded-full bg-gradient-to-b from-border-strong to-border" />
    </section>
  )
}

function Stats() {
  const inv = useInventory()
  const ownedIds = useMemo(() => [...inv.ownedIds].sort(), [inv.ownedIds])
  const canMake = useQuery(inv.ready ? `recipes:canMakeCount:${ownedIds.join(',')}` : null, () => api.searchRecipes({ canMakeWith: ownedIds, limit: 1 }), ['inventory'])
  const all = useQuery('recipes:all200', () => api.searchRecipes({ limit: 200 }))

  const buyNext = useMemo(() => {
    if (!all.data) return []
    const unlocks = new Map<ID, { filament: FilamentView; count: number }>()
    for (const hit of all.data.items) {
      const r = checkCanMake(hit.composition, new Map(hit.filaments.map((f) => [f.id, f])), inv.ownedIds)
      if (r.missing.length === 1) {
        const m = r.missing[0]
        const e = unlocks.get(m.id) ?? { filament: m, count: 0 }
        e.count++
        unlocks.set(m.id, e)
      }
    }
    return [...unlocks.values()].sort((a, b) => b.count - a.count).slice(0, 4)
  }, [all.data, inv.ownedIds])

  const brands = new Set(inv.items.map((i) => i.filament.manufacturerId)).size
  const materials = new Set(inv.items.map((i) => i.filament.material)).size

  return (
    <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="grid content-start grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Spools owned" value={inv.items.reduce((a, i) => a + (i.spools ?? 1), 0)} />
        <StatTile label="Brands" value={brands} />
        <StatTile label="Materials" value={materials} />
        <Link to="/search?canmake=1" className="group rounded-xl border border-accent/30 bg-accent-soft p-4 transition-shadow hover:shadow-md">
          <div className="text-xs font-medium text-accent-soft-fg/80">Recipes you can make</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-2xl font-semibold text-accent-soft-fg tabular">
            {canMake.data?.total ?? '–'}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </div>
        </Link>
      </div>
      <Card className="p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingBag className="size-4 text-fg-subtle" aria-hidden /> Buy next
        </div>
        <p className="mt-0.5 text-xs text-fg-muted">Each of these is the only filament missing from some recipes.</p>
        {buyNext.length === 0 ? (
          <p className="mt-2 text-sm text-fg-muted">{all.loading ? 'Crunching recipes…' : 'No single filament unlocks new recipes right now.'}</p>
        ) : (
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2" role="list">
            {buyNext.map(({ filament, count }) => (
              <li key={filament.id}>
                <BuyNextRow filament={filament} count={count} />
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

function BuyNextRow({ filament, count }: { filament: FilamentView; count: number }) {
  const inv = useInventory()
  const toast = useToast()
  return (
    <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1 hover:bg-surface-2">
      <SpoolIcon hex={filament.hex} size={30} />
      <Link to={`/filament/${filament.id}`} className="min-w-0 flex-1 hover:underline">
        <FilamentName filament={filament} />
      </Link>
      <Badge tone="accent" size="xs" className="shrink-0">+{count} {count === 1 ? 'recipe' : 'recipes'}</Badge>
      <IconButton
        label={`I own ${filament.colorName}`}
        size="xs"
        variant="outline"
        className="shrink-0"
        onClick={async () => { await inv.add(filament); toast(<>Added <b>{filament.colorName}</b></>) }}
      >
        <Plus className="size-3.5" />
      </IconButton>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <div className="text-xs font-medium text-fg-subtle">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold tabular">{value}</div>
    </div>
  )
}

function OwnedList({ onAdd }: { onAdd?: () => void }) {
  const inv = useInventory()
  const toast = useToast()
  const [groupBy, setGroupBy] = useState<GroupBy>('hue')
  const [sortBy, setSortBy] = useState<SortBy>('color')
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<InventoryEntry | null>(null)

  const groups = useMemo(() => {
    const text = q.trim().toLowerCase()
    const items = inv.items.filter((i) => {
      if (!text) return true
      const f = i.filament
      return `${f.manufacturer.name} ${f.productLine.name} ${f.colorName} ${f.hex} ${f.material}`.toLowerCase().includes(text)
    })
    const sorter: Record<SortBy, (a: InventoryEntry, b: InventoryEntry) => number> = {
      color: (a, b) => hexToLab(b.filament.hex).L - hexToLab(a.filament.hex).L,
      name: (a, b) => a.filament.colorName.localeCompare(b.filament.colorName),
      remaining: (a, b) => (a.remainingGrams ?? 1000) - (b.remainingGrams ?? 1000),
      added: (a, b) => Date.parse(b.addedAt) - Date.parse(a.addedAt),
    }
    if (groupBy === 'hue') {
      return HUE_FAMILIES.map((fam) => ({
        id: fam.id,
        label: fam.label,
        items: items.filter((i) => hueFamily(i.filament.hex) === fam.id).sort(sorter[sortBy]),
      })).filter((g) => g.items.length)
    }
    const byBrand = new Map<string, InventoryEntry[]>()
    items.forEach((i) => byBrand.set(i.filament.manufacturer.name, [...(byBrand.get(i.filament.manufacturer.name) ?? []), i]))
    return [...byBrand.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([label, xs]) => ({ id: label, label, items: xs.sort(sorter[sortBy]) }))
  }, [inv.items, q, groupBy, sortBy])

  if (inv.items.length === 0) {
    return (
      <EmptyState
        icon={<Boxes className="size-5" />}
        title="No filaments yet"
        description="Add the spools on your shelf from the catalog. Recipes will then show “You can make this.”"
        action={onAdd && <Button onClick={onAdd} icon={<Plus className="size-4" />}>Add filament</Button>}
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search your spools…" size="sm" className="min-w-40 flex-1" label="Search your spools" />
        <SegmentedControl label="Group by" size="sm" value={groupBy} onChange={setGroupBy} options={[{ value: 'hue', label: 'Color' }, { value: 'brand', label: 'Brand' }]} />
        <Select aria-label="Sort spools" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="w-36 [&_select]:h-8">
          <option value="color">Light → dark</option>
          <option value="name">Name A–Z</option>
          <option value="remaining">Lowest stock</option>
          <option value="added">Recently added</option>
        </Select>
      </div>

      <div className="mt-4 -mx-2 min-h-0 flex-1 space-y-5 overflow-y-auto px-2">
        {groups.length === 0 && <p className="py-8 text-center text-sm text-fg-muted">No spools match “{q}”.</p>}
        {groups.map((g) => (
          <section key={g.id} aria-label={g.label}>
            <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
              {g.label} <span className="font-normal">· {g.items.length}</span>
            </h3>
            <ul className="-mx-2" role="list">
              {g.items.map((item) => (
                <li key={item.id} className="group flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                  <SpoolIcon hex={item.filament.hex} size={42} fill={item.remainingGrams != null ? item.remainingGrams / 1000 : 1} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/filament/${item.filament.id}`} className="block truncate text-sm font-medium hover:underline">
                      {item.filament.colorName}
                    </Link>
                    <div className="truncate text-xs text-fg-muted">
                      {item.filament.manufacturer.name} · {item.filament.productLine.name} · {item.filament.material}
                      {item.filament.finish !== 'basic' && ` · ${item.filament.finish}`}
                    </div>
                    <div className="text-xs text-fg-subtle tabular sm:hidden">
                      {item.remainingGrams != null ? `${item.remainingGrams} g left` : 'Full spool'} · <span className="font-mono">{item.filament.hex}</span>
                    </div>
                    {item.notes && <div className="mt-0.5 truncate text-xs text-fg-subtle italic">“{item.notes}”</div>}
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="font-mono text-[11px] text-fg-subtle">{item.filament.hex}</div>
                    <div className={cn('text-xs tabular', item.remainingGrams != null && item.remainingGrams < 250 ? 'font-semibold text-warn' : 'text-fg-muted')}>
                      {item.remainingGrams != null ? `${item.remainingGrams} g left` : 'Full spool'}
                      {(item.spools ?? 1) > 1 && ` · ×${item.spools}`}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    <IconButton label={`Edit ${item.filament.colorName}`} size="xs" onClick={() => setEditing(item)}>
                      <Pencil className="size-3.5" />
                    </IconButton>
                    <IconButton
                      label={`Remove ${item.filament.colorName}`}
                      size="xs"
                      onClick={async () => {
                        const f = item.filament
                        await inv.remove(f.id)
                        toast(`Removed ${f.colorName}`, { tone: 'info', action: { label: 'Undo', onClick: () => inv.add(f) } })
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </IconButton>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <EditSpoolDialog item={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function EditSpoolDialog({ item, onClose }: { item: InventoryEntry | null; onClose: () => void }) {
  const inv = useInventory()
  const toast = useToast()
  const [form, setForm] = useState({ grams: '', spools: '1', notes: '' })
  const [lastId, setLastId] = useState<string | null>(null)
  if (item && item.id !== lastId) {
    setLastId(item.id)
    setForm({ grams: item.remainingGrams != null ? String(item.remainingGrams) : '', spools: String(item.spools ?? 1), notes: item.notes ?? '' })
  }
  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return
    const grams = form.grams.trim() === '' ? undefined : Math.max(0, Math.round(Number(form.grams)))
    await inv.update(item.id, { remainingGrams: grams, spools: Math.max(1, Math.round(Number(form.spools) || 1)), notes: form.notes.trim() || undefined })
    toast('Spool updated')
    onClose()
  }
  return (
    <Dialog
      open={!!item}
      onClose={onClose}
      title={item ? item.filament.colorName : ''}
      description={item ? `${item.filament.manufacturer.name} · ${item.filament.productLine.name}` : undefined}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="edit-spool">Save</Button></>}
    >
      {item && (
        <form id="edit-spool" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 sm:col-span-2">
            <SpoolIcon hex={item.filament.hex} size={56} fill={form.grams === '' ? 1 : Number(form.grams) / 1000} />
            <div className="text-sm text-fg-muted">
              <div className="flex items-center gap-1.5"><ColorDot hex={item.filament.hex} size={12} /><span className="font-mono">{item.filament.hex}</span></div>
              <div>{item.filament.material} · {item.filament.finish}</div>
            </div>
          </div>
          <Field label="Remaining on spool" hint="Grams. Leave empty for a full spool." htmlFor="sp-grams">
            <Input id="sp-grams" type="number" min={0} max={5000} inputMode="numeric" value={form.grams} onChange={(e) => setForm({ ...form, grams: e.target.value })} placeholder="1000" />
          </Field>
          <Field label="Spools" htmlFor="sp-count">
            <Input id="sp-count" type="number" min={1} max={99} value={form.spools} onChange={(e) => setForm({ ...form, spools: e.target.value })} />
          </Field>
          <Field label="Notes" optional className="sm:col-span-2" htmlFor="sp-notes">
            <Textarea id="sp-notes" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Batch number, drying notes, where it's stored…" />
          </Field>
        </form>
      )}
    </Dialog>
  )
}
