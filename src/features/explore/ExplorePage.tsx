/**
 * The homepage IS the color library: a browsable feed of community-made
 * filament colors, filtered by your own spools. No marketing hero.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Boxes, Palette, Plus, SlidersHorizontal, Target, X } from 'lucide-react'
import type { Hex, ID } from '@/types'
import { api, type RecipeHit, type RecipeQuery } from '@/lib/api'
import { useQuery } from '@/lib/hooks/useQuery'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSession } from '@/lib/hooks/useSession'
import { useCanMakeFilter } from '@/lib/hooks/usePreferences'
import { HUE_FAMILIES, nearestColorName } from '@/lib/color/names'
import { normalizeHex } from '@/lib/color/convert'
import { checkCanMake } from '@/lib/recipe/canMake'
import { cn } from '@/lib/utils/cn'
import { ColorPicker } from '@/components/color/ColorPicker'
import { ColorDot } from '@/components/color/Swatch'
import { RecipeGrid } from '@/components/recipe/RecipeCard'
import { Button, ButtonLink, Switch } from '@/components/ui'
import { useInventoryPanel } from '@/components/filament/InventoryPanel'
import { FilamentSidebar } from './FilamentSidebar'

type Tab = 'for-you' | 'trending' | 'newest' | 'reproduced' | 'tested'

const TABS: { id: Tab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'trending', label: 'Trending' },
  { id: 'newest', label: 'Newest' },
  { id: 'reproduced', label: 'Most Reproduced' },
  { id: 'tested', label: 'Tested' },
]

const PAGE = 30

export default function ExplorePage() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? 'for-you') as Tab
  const hue = params.get('hue') ?? ''
  const near = normalizeHex(params.get('near') ?? '') ?? undefined
  const [limit, setLimit] = useState(PAGE)
  useEffect(() => setLimit(PAGE), [tab, hue, near])

  const inv = useInventory()
  const { user } = useSession()
  const [onlyCanMake, setOnlyCanMake] = useCanMakeFilter()
  const canMakeWith = inv.signedIn && onlyCanMake ? [...inv.ownedIds] : undefined
  const following = useQuery(user ? `follows:mine:${user.id}` : null, () => api.listFollowingIds())

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const query: RecipeQuery = {
    hueFamily: hue || undefined,
    canMakeWith,
    targetHex: near,
    trust: tab === 'tested' ? ['tested', 'reproduced', 'highly-reproduced'] : undefined,
    sort: near ? 'closest' : tab === 'newest' || tab === 'tested' ? 'newest' : tab === 'reproduced' ? 'most-reproduced' : 'trending',
    // "For You" re-ranks a larger trending window client-side.
    limit: tab === 'for-you' && !near ? Math.max(200, limit) : limit,
  }
  const result = useRecipeSearch(query)

  const hits = useMemo(() => {
    const items = result.data?.items
    if (!items) return undefined
    if (tab !== 'for-you' || near) return items
    return rankForYou(items, inv.ownedIds, inv.ownedFilaments, new Set(following.data ?? [])).slice(0, limit)
  }, [result.data, tab, near, inv.ownedIds, inv.ownedFilaments, following.data, limit])

  const total = result.data?.total ?? 0
  const filtersActive = !!(hue || near || canMakeWith)

  return (
    <div className="mx-auto max-w-[1800px] px-4 pt-4 pb-10 sm:px-6 lg:grid lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
      <aside className="hidden lg:block" aria-label="My Filaments">
        <div className="sticky top-20">
          <FilamentSidebar onlyCanMake={onlyCanMake} onOnlyCanMake={setOnlyCanMake} />
        </div>
      </aside>

      <div className="min-w-0">
        <Toolbar near={near} onNear={(h) => setParam('near', h)} onlyCanMake={onlyCanMake} onOnlyCanMake={setOnlyCanMake} />

        {/* color families */}
        <div className="scrollbar-none -mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Browse by color family">
          <HueButton active={!hue} onClick={() => setParam('hue', null)}>All colors</HueButton>
          {HUE_FAMILIES.map((f) => (
            <HueButton key={f.id} active={hue === f.id} onClick={() => setParam('hue', hue === f.id ? null : f.id)} hex={f.hex}>
              {f.label}
            </HueButton>
          ))}
        </div>

        {/* feed tabs */}
        <div className="mt-4 flex items-end justify-between gap-4 border-b border-border">
          <div role="tablist" aria-label="Sort the feed" className="scrollbar-none -mb-px flex overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={tab === t.id && !near}
                onClick={() => {
                  const next = new URLSearchParams(params)
                  if (t.id === 'for-you') next.delete('tab')
                  else next.set('tab', t.id)
                  next.delete('near')
                  setParams(next, { replace: true })
                }}
                className={cn(
                  'shrink-0 border-b-2 px-3 py-2.5 text-[15px] font-medium whitespace-nowrap transition-colors',
                  tab === t.id && !near ? 'border-accent text-fg' : 'border-transparent text-fg-muted hover:text-fg',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <span className="hidden shrink-0 pb-2.5 text-sm text-fg-muted tabular sm:block">
            {result.data ? `${total} ${total === 1 ? 'color' : 'colors'}` : ''}
          </span>
        </div>

        {near && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-fg-muted">Closest tested colors to</span>
            <ColorDot hex={near} size={18} />
            <span className="font-mono">{near}</span>
            <span className="text-fg-muted">(≈ {nearestColorName(near)})</span>
            <button type="button" onClick={() => setParam('near', null)} className="inline-flex items-center gap-1 text-fg-muted hover:text-fg">
              <X className="size-4" aria-hidden /> Clear
            </button>
            <Link to={`/match?hex=${encodeURIComponent(near)}`} className="ml-auto font-medium text-accent hover:underline">Open in Color Matcher</Link>
          </div>
        )}

        <div className="mt-4">
          {hits && hits.length === 0 ? (
            <FeedEmpty filtersActive={filtersActive} onClear={() => { setParams(new URLSearchParams(), { replace: true }); setOnlyCanMake(false) }} onlyCanMake={!!canMakeWith} />
          ) : (
            <RecipeGrid hits={hits} loading={result.loading} target={near} />
          )}
        </div>

        {hits && total > hits.length && hits.length >= limit && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={() => setLimit((l) => l + PAGE)} loading={result.fetching}>Show more colors</Button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * "For You": trending order, nudged toward colors you can make (or are one
 * spool away from) and colors from makers you follow.
 */
function rankForYou(items: RecipeHit[], owned: Set<ID>, ownedFilaments: Parameters<typeof checkCanMake>[3], follows: Set<ID>): RecipeHit[] {
  if (owned.size === 0 && follows.size === 0) return items
  return items
    .map((h, i) => {
      const cm = checkCanMake(h.composition, new Map(h.filaments.map((f) => [f.id, f])), owned, ownedFilaments)
      const boost = (cm.canMake ? 12 : cm.missing.length === 1 ? 5 : 0) + (follows.has(h.recipe.authorId) ? 8 : 0)
      return { h, score: i - boost }
    })
    .sort((a, b) => a.score - b.score)
    .map((x) => x.h)
}

function Toolbar({ near, onNear, onlyCanMake, onOnlyCanMake }: { near?: Hex; onNear: (hex: string | null) => void; onlyCanMake: boolean; onOnlyCanMake: (v: boolean) => void }) {
  const navigate = useNavigate()
  const inv = useInventory()
  const panel = useInventoryPanel()
  const [q, setQ] = useState('')

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = q.trim()
    if (!text) return
    const hex = /^#?[0-9a-f]{6}$/i.test(text) ? normalizeHex(text) : null
    if (hex) onNear(hex)
    else navigate(`/search?q=${encodeURIComponent(text)}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form role="search" onSubmit={submit} className="relative min-w-0 flex-1 basis-full sm:basis-64">
        <label htmlFor="feed-search" className="sr-only">Search colors, HEX, filaments or makers</label>
        <input
          id="feed-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search colors: lavender, #C1AAD6, Cobalt Blue, a maker…"
          className="h-10 w-full rounded-md border border-border-strong bg-surface px-3 text-[15px] placeholder:text-fg-subtle focus:border-accent focus:ring-3 focus:ring-[var(--ring)] focus:outline-none"
        />
      </form>
      <ColorLookup near={near} onNear={onNear} />
      <button
        type="button"
        onClick={() => panel.open()}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-2 lg:hidden"
      >
        <Boxes className="size-4" aria-hidden /> <span className="sm:hidden">Filaments</span><span className="hidden sm:inline">My Filaments</span>{inv.signedIn && <span className="text-fg-muted tabular">{inv.items.length}</span>}
      </button>
      {inv.signedIn && (
        <div className="flex h-10 items-center rounded-md border border-border-strong bg-surface px-2.5 lg:hidden">
          <Switch size="sm" checked={onlyCanMake} onChange={onOnlyCanMake} label={<span className="text-sm">Can make</span>} />
        </div>
      )}
      <ButtonLink to="/create" icon={<Plus className="size-4" />} className="hidden h-10 rounded-md sm:inline-flex">Create Recipe</ButtonLink>
    </div>
  )
}

/** Compact "What color are you looking for?" entry point. The full tool lives on /match. */
function ColorLookup({ near, onNear }: { near?: Hex; onNear: (hex: string | null) => void }) {
  const [open, setOpen] = useState(false)
  const [hex, setHex] = useState<Hex>(near ?? '#C1AAD6')
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 text-sm font-medium hover:bg-surface-2 sm:px-3"
      >
        {near ? <ColorDot hex={near} size={16} /> : <Palette className="size-4" aria-hidden />}
        <span className="sm:hidden">Color</span><span className="hidden sm:inline">Find by color</span>
      </button>
      {open && (
        <div role="dialog" aria-label="Find colors by target" className="absolute right-0 z-30 mt-1.5 w-[300px] animate-pop rounded-lg border border-border bg-surface p-3 shadow-lg sm:left-0 sm:right-auto">
          <div className="mb-2 text-sm font-semibold">What color are you looking for?</div>
          <ColorPicker value={hex} onChange={setHex} compact />
          <div className="mt-3 flex gap-2">
            <Button
              className="flex-1"
              size="sm"
              onClick={() => {
                onNear(hex)
                setOpen(false)
              }}
            >
              Show closest colors
            </Button>
            <ButtonLink to={`/match?hex=${encodeURIComponent(hex)}`} size="sm" variant="outline" icon={<Target className="size-3.5" />}>Matcher</ButtonLink>
          </div>
        </div>
      )}
    </div>
  )
}

function HueButton({ active, onClick, hex, children }: { active: boolean; onClick: () => void; hex?: Hex; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors',
        active ? 'border-fg bg-fg text-bg' : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
      )}
    >
      {hex && <ColorDot hex={hex} size={12} />}
      {children}
    </button>
  )
}

function FeedEmpty({ filtersActive, onClear, onlyCanMake }: { filtersActive: boolean; onClear: () => void; onlyCanMake: boolean }) {
  if (filtersActive) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
        <SlidersHorizontal className="size-4 text-fg-subtle" aria-hidden />
        <span className="text-fg-muted">
          No colors match these filters{onlyCanMake ? ' with your current filaments' : ''}.
        </span>
        <button type="button" onClick={onClear} className="font-medium text-accent hover:underline">Clear filters</button>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm">
      <Palette className="size-4 text-fg-subtle" aria-hidden />
      <span className="text-fg-muted">No colors here yet. Be the first to share one.</span>
      <Link to="/create" className="font-medium text-accent hover:underline">Create a recipe</Link>
    </div>
  )
}
