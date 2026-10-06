import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Palette, SearchX, SlidersHorizontal, X } from 'lucide-react'
import type { Hex, Material, TrustLevel } from '@/types'
import { MATERIALS } from '@/types'
import { api, type RecipeHit, type RecipeQuery, type RecipeSort } from '@/lib/api'
import { useQuery } from '@/lib/hooks/useQuery'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { useInventory } from '@/lib/hooks/useInventory'
import { HUE_FAMILIES, nearestColorName, searchColorNames } from '@/lib/color/names'
import { normalizeHex } from '@/lib/color/convert'
import { TRUST_META } from '@/lib/recipe/trust'
import { cn } from '@/lib/utils/cn'
import { ColorPicker } from '@/components/color/ColorPicker'
import { ColorDot } from '@/components/color/Swatch'
import { RecipeGrid } from '@/components/recipe/RecipeCard'
import {
  Button, Checkbox, Chip, EmptyState, Field, Input, SearchInput, Select, Sheet, Switch,
} from '@/components/ui'

const PAGE = 24

const SORTS: { value: RecipeSort; label: string }[] = [
  { value: 'relevance', label: 'Best match' },
  { value: 'closest', label: 'Closest color' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Recently added' },
  { value: 'most-reproduced', label: 'Most reproduced' },
  { value: 'most-favorited', label: 'Most favorited' },
]

const TRUSTS: TrustLevel[] = ['tested', 'reproduced', 'highly-reproduced']

const STAGE_OPTS = [
  { value: '1', label: '1 stage', min: 1, max: 1 },
  { value: '2', label: '2 stages', min: 2, max: 2 },
  { value: '3', label: '3+ stages', min: 3, max: undefined },
] as const

interface Filters {
  q: string
  hex: Hex | null
  maxde: number | null
  hue: string
  sort: RecipeSort | ''
  material: Material[]
  brand: string[]
  stages: string
  trust: TrustLevel[]
  canmake: boolean
  creator: string
}

function readFilters(p: URLSearchParams): Filters {
  const list = (k: string) => (p.get(k) ?? '').split(',').filter(Boolean)
  return {
    q: p.get('q') ?? '',
    hex: p.get('hex') ? normalizeHex(p.get('hex')!) : null,
    maxde: p.get('maxde') ? Number(p.get('maxde')) : null,
    hue: p.get('hue') ?? '',
    sort: (p.get('sort') as RecipeSort) ?? '',
    material: list('material') as Material[],
    brand: list('brand'),
    stages: p.get('stages') ?? '',
    trust: list('trust') as TrustLevel[],
    canmake: p.get('canmake') === '1',
    creator: p.get('creator') ?? '',
  }
}

function writeFilters(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.hex) p.set('hex', f.hex)
  if (f.hex && f.maxde != null) p.set('maxde', String(f.maxde))
  if (f.hue) p.set('hue', f.hue)
  if (f.sort) p.set('sort', f.sort)
  if (f.material.length) p.set('material', f.material.join(','))
  if (f.brand.length) p.set('brand', f.brand.join(','))
  if (f.stages) p.set('stages', f.stages)
  if (f.trust.length) p.set('trust', f.trust.join(','))
  if (f.canmake) p.set('canmake', '1')
  if (f.creator) p.set('creator', f.creator)
  return p
}

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => readFilters(params), [params])
  const inv = useInventory()
  const [limit, setLimit] = useState(PAGE)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [text, setText] = useState(filters.q)

  useEffect(() => setText(filters.q), [filters.q])
  // Reset pagination whenever the filters change.
  useEffect(() => setLimit(PAGE), [params])

  const update = (patch: Partial<Filters>) => setParams(writeFilters({ ...filters, ...patch }), { replace: true })

  // Debounce the text box into the URL.
  useEffect(() => {
    if (text === filters.q) return
    const t = setTimeout(() => update({ q: text.trim() }), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text])

  const { data: creators } = useQuery('creators:all', () => api.listCreators(50))
  const creatorId = filters.creator
    ? creators?.find((c) => c.username === filters.creator.toLowerCase() || c.displayName.toLowerCase().includes(filters.creator.toLowerCase()))?.id ?? '__none__'
    : undefined

  const stage = STAGE_OPTS.find((s) => s.value === filters.stages)
  const query: RecipeQuery = {
    text: filters.q || undefined,
    targetHex: filters.hex ?? undefined,
    maxDeltaE: filters.hex && filters.maxde != null ? filters.maxde : undefined,
    hueFamily: filters.hue || undefined,
    sort: filters.sort || undefined,
    materials: filters.material,
    manufacturerIds: filters.brand,
    minStages: stage?.min,
    maxStages: stage?.max,
    trust: filters.trust,
    canMakeWith: filters.canmake && inv.signedIn ? [...inv.ownedIds] : undefined,
    authorId: creatorId,
    limit,
  }
  const waitingForInventory = filters.canmake && inv.signedIn && !inv.ready
  const { data, loading, fetching } = useRecipeSearch(waitingForInventory ? null : query)

  // When a text query reads as a color name, the API also uses it as a color target.
  const namedColor = !filters.hex && filters.q ? searchColorNames(filters.q, 1)[0] : undefined
  const effectiveTarget = filters.hex ?? (namedColor && namedColor.name.toLowerCase().startsWith(filters.q.toLowerCase()) ? namedColor.hex : undefined)

  const { data: mfrs } = useQuery('catalog:manufacturers', () => api.listManufacturers())
  const active = activeChips(filters, update, (id) => mfrs?.find((m) => m.id === id)?.name ?? id)

  const filterPanel = <FilterPanel filters={filters} update={update} signedIn={inv.signedIn} />

  const title = filters.q ? `Results for “${filters.q}”` : filters.hue ? `${HUE_FAMILIES.find((h) => h.id === filters.hue)?.label ?? 'Colors'}` : 'All recipes'

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <div className="mb-1.5 text-xs font-semibold tracking-wider text-accent uppercase">Search</div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        </div>
        <SearchInput
          value={text}
          onChange={setText}
          size="lg"
          placeholder="Try “lavender”, “terracotta”, a creator, a brand or a HEX…"
          label="Search recipes"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const hex = /^#?[0-9a-f]{6}$/i.test(text.trim()) ? normalizeHex(text.trim()) : null
              if (hex) {
                setText('')
                update({ q: '', hex, sort: 'closest' })
              } else update({ q: text.trim() })
            }
          }}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[264px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto pr-1 pb-6">{filterPanel}</div>
        </aside>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              icon={<SlidersHorizontal className="size-4" />}
              onClick={() => setSheetOpen(true)}
            >
              Filters
              {active.length > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-fg">{active.length}</span>
              )}
            </Button>
            <p className="text-sm text-fg-muted" aria-live="polite">
              {data ? (
                <><b className="font-semibold text-fg tabular">{data.total}</b> {data.total === 1 ? 'recipe' : 'recipes'}</>
              ) : 'Searching…'}
              {fetching && data && <span className="ml-2 text-fg-subtle">Updating…</span>}
            </p>
            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="sort" className="hidden text-sm text-fg-muted sm:block">Sort</label>
              <Select
                id="sort"
                value={filters.sort || (effectiveTarget ? 'closest' : filters.q ? 'relevance' : 'trending')}
                onChange={(e) => update({ sort: e.target.value as RecipeSort })}
                className="w-44"
              >
                {SORTS.filter((s) => (s.value === 'closest' ? !!effectiveTarget : s.value === 'relevance' ? !!filters.q : true)).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </Select>
            </div>
          </div>

          {active.length > 0 && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {active.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={c.remove}
                  className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface pr-2 pl-2.5 text-xs font-medium hover:border-border-strong"
                  aria-label={`Remove filter: ${c.label}`}
                >
                  {c.hex && <ColorDot hex={c.hex} size={12} />}
                  {c.label}
                  <X className="size-3 text-fg-subtle" aria-hidden />
                </button>
              ))}
              <button type="button" className="text-xs font-medium text-fg-muted hover:text-fg hover:underline" onClick={() => { setText(''); setParams(new URLSearchParams(), { replace: true }) }}>
                Clear all
              </button>
            </div>
          )}

          {namedColor && effectiveTarget && !filters.hex && (
            <p className="mb-4 flex items-center gap-2 text-sm text-fg-muted">
              <ColorDot hex={namedColor.hex} size={16} />
              Also matching colors near <b className="font-medium text-fg">{namedColor.name}</b>
              <span className="font-mono text-xs">{namedColor.hex}</span>
            </p>
          )}

          {data && data.items.length === 0 ? (
            <NoResults
              hasCanMake={filters.canmake}
              onClear={() => { setText(''); setParams(new URLSearchParams(), { replace: true }) }}
              onDropCanMake={() => update({ canmake: false })}
              onTry={(q) => { setText(q); update({ q, hex: null, hue: '' }) }}
            />
          ) : (
            <>
              <RecipeGrid hits={data?.items as RecipeHit[] | undefined} loading={loading || waitingForInventory} target={effectiveTarget} className="lg:grid-cols-2 xl:grid-cols-3" />
              {data && data.items.length < data.total && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" loading={fetching} onClick={() => setLimit((l) => l + PAGE)}>
                    Load more · {data.total - data.items.length} remaining
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        side="bottom"
        title="Filters"
        description={data ? `${data.total} recipes match` : undefined}
        footer={<Button className="w-full" onClick={() => setSheetOpen(false)}>Show {data?.total ?? ''} results</Button>}
      >
        <div className="px-5 py-4">{filterPanel}</div>
      </Sheet>
    </div>
  )
}

function FilterPanel({ filters, update, signedIn }: { filters: Filters; update: (p: Partial<Filters>) => void; signedIn: boolean }) {
  const { data: mfrs } = useQuery('catalog:manufacturers', () => api.listManufacturers())
  const [colorOpen, setColorOpen] = useState(false)
  const [creator, setCreator] = useState(filters.creator)
  useEffect(() => setCreator(filters.creator), [filters.creator])

  const toggle = <T extends string>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

  return (
    <div className="space-y-6">
      {signedIn && (
        <div className="rounded-xl border border-border bg-surface p-3">
          <Switch
            checked={filters.canmake}
            onChange={(v) => update({ canmake: v })}
            label="Only recipes I can make"
            description="Uses My Filaments"
            size="sm"
          />
        </div>
      )}

      <FilterGroup title="Target color">
        {filters.hex ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setColorOpen((o) => !o)}
                className="flex flex-1 items-center gap-2.5 rounded-lg border border-border bg-surface p-1.5 text-left hover:border-border-strong"
                aria-expanded={colorOpen}
              >
                <ColorDot hex={filters.hex} size={28} className="rounded-md!" />
                <span className="min-w-0">
                  <span className="block font-mono text-sm font-medium">{filters.hex}</span>
                  <span className="block truncate text-xs text-fg-muted">≈ {nearestColorName(filters.hex)}</span>
                </span>
              </button>
              <Button size="xs" variant="ghost" onClick={() => update({ hex: null, maxde: null, sort: filters.sort === 'closest' ? '' : filters.sort })}>Clear</Button>
            </div>
            <div>
              <label htmlFor="maxde" className="flex justify-between text-xs text-fg-muted">
                <span>Max color difference</span>
                <span className="font-mono tabular">{filters.maxde == null ? 'Any' : `ΔE ≤ ${filters.maxde}`}</span>
              </label>
              <input
                id="maxde"
                type="range"
                min={2}
                max={31}
                step={1}
                value={filters.maxde ?? 31}
                onChange={(e) => update({ maxde: Number(e.target.value) >= 31 ? null : Number(e.target.value) })}
                className="mt-1.5 w-full accent-[var(--accent)]"
              />
              <div className="flex justify-between text-[10px] text-fg-subtle"><span>Near-identical</span><span>Any</span></div>
            </div>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="w-full" icon={<Palette className="size-4" />} onClick={() => setColorOpen((o) => !o)} aria-expanded={colorOpen}>
            Pick a target color
          </Button>
        )}
        {colorOpen && (
          <div className="mt-3 rounded-xl border border-border bg-surface p-3">
            <ColorPicker value={filters.hex ?? '#C1AAD6'} onChange={(h) => update({ hex: h, sort: filters.sort || 'closest' })} compact />
            <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => setColorOpen(false)}>Done</Button>
          </div>
        )}
      </FilterGroup>

      <FilterGroup title="Color family">
        <div className="flex flex-wrap gap-1.5">
          {HUE_FAMILIES.map((h) => (
            <button
              key={h.id}
              type="button"
              aria-pressed={filters.hue === h.id}
              onClick={() => update({ hue: filters.hue === h.id ? '' : h.id })}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-full border pr-2.5 pl-1 text-xs font-medium transition-colors',
                filters.hue === h.id ? 'border-fg bg-fg text-bg' : 'border-border bg-surface text-fg-muted hover:text-fg',
              )}
            >
              <ColorDot hex={h.hex} size={18} />
              {h.label}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Trust">
        <div className="space-y-2">
          {TRUSTS.map((t) => (
            <div key={t}><Checkbox checked={filters.trust.includes(t)} onChange={() => update({ trust: toggle(filters.trust, t) })} label={TRUST_META[t].label} /></div>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Mixing stages">
        <div className="flex flex-wrap gap-1.5">
          {STAGE_OPTS.map((s) => (
            <Chip key={s.value} active={filters.stages === s.value} onClick={() => update({ stages: filters.stages === s.value ? '' : s.value })}>
              {s.label}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Material">
        <div className="flex flex-wrap gap-1.5">
          {MATERIALS.filter((m) => !['Other'].includes(m)).map((m) => (
            <Chip key={m} active={filters.material.includes(m)} onClick={() => update({ material: toggle(filters.material, m) })}>{m}</Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Filament brand">
        <div className="space-y-2">
          {mfrs?.map((m) => (
            <div key={m.id}><Checkbox checked={filters.brand.includes(m.id)} onChange={() => update({ brand: toggle(filters.brand, m.id) })} label={m.name} /></div>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Creator">
        <Field label={<span className="sr-only">Creator username</span>}>
          <Input
            value={creator}
            onChange={(e) => setCreator(e.target.value)}
            onBlur={() => update({ creator: creator.trim() })}
            onKeyDown={(e) => e.key === 'Enter' && update({ creator: creator.trim() })}
            placeholder="username or name"
          />
        </Field>
      </FilterGroup>
    </div>
  )
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-2.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase">{title}</legend>
      {children}
    </fieldset>
  )
}

function activeChips(f: Filters, update: (p: Partial<Filters>) => void, brandName: (id: string) => string) {
  const chips: { key: string; label: string; hex?: Hex; remove: () => void }[] = []
  if (f.hex) chips.push({ key: 'hex', label: f.maxde != null ? `${f.hex} · ΔE ≤ ${f.maxde}` : f.hex, hex: f.hex, remove: () => update({ hex: null, maxde: null }) })
  if (f.hue) {
    const h = HUE_FAMILIES.find((x) => x.id === f.hue)
    chips.push({ key: 'hue', label: h?.label ?? f.hue, hex: h?.hex, remove: () => update({ hue: '' }) })
  }
  if (f.canmake) chips.push({ key: 'canmake', label: 'Can make', remove: () => update({ canmake: false }) })
  f.trust.forEach((t) => chips.push({ key: `t-${t}`, label: TRUST_META[t].label, remove: () => update({ trust: f.trust.filter((x) => x !== t) }) }))
  if (f.stages) chips.push({ key: 'stages', label: STAGE_OPTS.find((s) => s.value === f.stages)?.label ?? '', remove: () => update({ stages: '' }) })
  f.material.forEach((m) => chips.push({ key: `m-${m}`, label: m, remove: () => update({ material: f.material.filter((x) => x !== m) }) }))
  f.brand.forEach((b) => chips.push({ key: `b-${b}`, label: brandName(b), remove: () => update({ brand: f.brand.filter((x) => x !== b) }) }))
  if (f.creator) chips.push({ key: 'creator', label: `by ${f.creator}`, remove: () => update({ creator: '' }) })
  return chips
}


function NoResults({ hasCanMake, onClear, onDropCanMake, onTry }: { hasCanMake: boolean; onClear: () => void; onDropCanMake: () => void; onTry: (q: string) => void }) {
  return (
    <EmptyState
      icon={<SearchX className="size-5" />}
      title="No recipes match these filters"
      description={
        <>
          {hasCanMake ? 'You might not own every filament these recipes need. ' : ''}
          Try a broader color, fewer filters, or one of these:
          <span className="mt-3 flex flex-wrap justify-center gap-1.5">
            {['lavender', 'sage', 'terracotta', 'teal', 'blush'].map((q) => (
              <button key={q} type="button" onClick={() => onTry(q)} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-fg hover:border-border-strong">{q}</button>
            ))}
          </span>
        </>
      }
      action={
        <div className="flex flex-wrap justify-center gap-2">
          {hasCanMake && <Button variant="outline" onClick={onDropCanMake}>Include recipes I can’t make</Button>}
          <Button variant="ghost" onClick={onClear}>Clear all filters</Button>
        </div>
      }
    />
  )
}

