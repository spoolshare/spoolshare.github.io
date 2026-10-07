import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { AlertTriangle, Check, CircleCheck, Columns2, Heart, Repeat2, X } from 'lucide-react'
import type { RecipeHit } from '@/lib/api'
import { cn } from '@/lib/utils/cn'
import { formatCompact } from '@/lib/utils/format'
import { checkCanMake, type CanMakeResult } from '@/lib/recipe/canMake'
import { formatRatio } from '@/lib/recipe/composition'
import { useInventory } from '@/lib/hooks/useInventory'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useCompareTray } from '@/lib/hooks/usePreferences'
import { ColorDot, SwatchVisual } from '@/components/color/Swatch'
import { DeltaEMeter } from '@/components/color/Compare'
import { FilamentDots } from '@/components/filament/Spool'
import { Avatar, Skeleton, useToast } from '@/components/ui'
import { TrustBadge } from './badges'

/**
 * A color listing. The printed result dominates; everything else is compact,
 * scannable text so a grid of dozens of colors reads as a color library.
 */
export const RecipeCard = memo(function RecipeCard({ hit, target, className }: { hit: RecipeHit; target?: string; className?: string }) {
  const { recipe, author, filaments, stats, trust, composition } = hit
  const inv = useInventory()
  const fav = useFavorites()
  const compare = useCompareTray()
  const toast = useToast()
  const navigate = useNavigate()
  const isFav = fav.isFavorite(recipe.id)
  const canMake = useMemo(
    () => (inv.signedIn ? checkCanMake(composition, new Map(filaments.map((f) => [f.id, f])), inv.ownedIds, inv.ownedFilaments) : null),
    [composition, filaments, inv.ownedIds, inv.ownedFilaments, inv.signedIn],
  )
  const ratio = recipe.stages.length === 1 ? formatRatio(recipe.stages[0].inputs.map((i) => i.parts)) : `${recipe.stages.length} stages`

  const onFav = async () => {
    try {
      const on = await fav.toggle(recipe.id)
      toast(on ? <>Saved <b>{recipe.name}</b></> : 'Removed from saved', { tone: on ? 'success' : 'info' })
    } catch {
      toast('Sign in to save colors', { tone: 'info', action: { label: 'Sign in', onClick: () => navigate('/signin') } })
    }
  }
  const inCompare = compare.has(recipe.id)

  return (
    <article
      className={cn(
        'group @container relative flex min-w-0 flex-col rounded-lg border border-border bg-surface transition-colors hover:border-fg-subtle focus-within:border-accent',
        className,
      )}
    >
      <div className="relative aspect-square overflow-hidden rounded-t-[7px] bg-surface-2">
        <SwatchVisual
          hex={recipe.resultHex}
          photo={recipe.photos[0]}
          finish={recipe.finish}
          rounded=""
          className="size-full transition-transform duration-500 group-hover:scale-[1.02]"
          label={`${recipe.name}, ${recipe.resultHex}`}
        />
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <OverlayButton
            label={inCompare ? `Remove ${recipe.name} from comparison` : `Compare ${recipe.name}`}
            pressed={inCompare}
            onClick={() => compare.toggle(recipe.id)}
            className={inCompare ? 'bg-neutral-900 text-white hover:bg-neutral-800' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}
          >
            <Columns2 className="size-4" />
          </OverlayButton>
          <OverlayButton label={isFav ? `Unsave ${recipe.name}` : `Save ${recipe.name}`} pressed={isFav} onClick={onFav}>
            <Heart className={cn('size-4', isFav && 'fill-rose-500 text-rose-500')} />
          </OverlayButton>
        </div>
        {target && hit.deltaE != null && (
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1 rounded bg-white/90 py-0.5 pr-1.5 pl-0.5 text-neutral-800">
            <ColorDot hex={target} size={16} label="Your target color" />
            <DeltaEMeter value={hit.deltaE} compact className="text-neutral-800!" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="min-w-0 truncate text-[15px] leading-snug font-semibold">
            <Link to={`/r/${recipe.slug}`} className="outline-none after:absolute after:inset-0 after:content-['']">
              {recipe.name}
            </Link>
          </h3>
          <span className="hidden shrink-0 font-mono text-xs text-fg-muted tabular @[200px]:inline">{recipe.resultHex}</span>
        </div>

        <div className="flex min-w-0 items-center gap-1.5 text-[13px] text-fg-muted">
          <Link to={`/u/${author.username}`} className="relative z-10 inline-flex min-w-0 items-center gap-1.5 hover:text-fg hover:underline">
            <Avatar profile={author} size="xs" />
            <span className="truncate">{author.displayName}</span>
          </Link>
          <span aria-hidden>·</span>
          <span className="shrink-0">{recipe.material}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <FilamentDots filaments={filaments} size={16} owned={inv.signedIn ? inv.ownedIds : undefined} />
          <span className="font-mono text-xs text-fg-muted tabular" title={recipe.stages.length === 1 ? 'Mixing ratio' : 'Multi-stage recipe'}>{ratio}</span>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-fg-muted">
          <TrustBadge level={trust} size="xs" className="min-w-0" />
          <span className="ml-auto inline-flex items-center gap-0.5" title={`${stats.count} reproductions, ${stats.closeCount} close matches`}>
            <Repeat2 className="size-3.5" aria-hidden />{stats.count}<span className="sr-only"> reproductions</span>
          </span>
          <span className="inline-flex items-center gap-0.5" title="Saves">
            <Heart className="size-3.5" aria-hidden />{formatCompact(recipe.favoriteCount)}<span className="sr-only"> saves</span>
          </span>
        </div>

        {canMake && <CanMakeToggle result={canMake} />}
      </div>
    </article>
  )
})

function OverlayButton({ label, pressed, onClick, className, children }: { label: string; pressed?: boolean; onClick: () => void; className?: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onClick()
      }}
      className={cn('grid size-8 place-items-center rounded-md bg-white/90 text-neutral-700 transition-opacity hover:bg-white', className)}
    >
      {children}
    </button>
  )
}

/** "✓ You can make this" / "Missing: …" which expands to the full owned/missing list. */
function CanMakeToggle({ result }: { result: CanMakeResult }) {
  const [open, setOpen] = useState(false)
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
  const missingIds = new Set(result.missing.map((m) => m.id))
  const all = [...result.missing, ...result.owned]

  return (
    <div ref={ref} className="relative z-10 mt-auto border-t border-border pt-2">
      <button
        type="button"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className="flex w-full min-w-0 items-center gap-1.5 text-left text-xs hover:underline"
      >
        {result.canMake ? (
          <><CircleCheck className="size-3.5 shrink-0 text-accent" aria-hidden /><span className="font-medium text-accent">You can make this</span></>
        ) : (
          <>
            <AlertTriangle className="size-3.5 shrink-0 text-warn" aria-hidden />
            <span className="truncate text-fg-muted">
              Missing: <span className="text-fg">{result.missing.map((m) => m.colorName).join(', ')}</span>
            </span>
          </>
        )}
      </button>
      {open && (
        <div className="absolute bottom-full left-0 z-20 mb-1 w-full min-w-56 animate-pop rounded-md border border-border bg-surface p-2.5 text-xs shadow-lg" role="dialog" aria-label="Filaments needed">
          <div className="mb-1.5 font-semibold">Filaments needed</div>
          <ul className="space-y-1">
            {all.map((f) => {
              const missing = missingIds.has(f.id)
              return (
                <li key={f.id} className="flex items-center gap-1.5">
                  <ColorDot hex={f.hex} size={12} />
                  <span className="min-w-0 flex-1 truncate">{f.colorName} <span className="text-fg-subtle">· {f.productLine.name}</span></span>
                  {missing
                    ? <span className="inline-flex items-center gap-0.5 text-warn"><X className="size-3" aria-hidden />Missing</span>
                    : <span className="inline-flex items-center gap-0.5 text-accent"><Check className="size-3" aria-hidden />Owned</span>}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

/** Dense, responsive color grid: as many ~210px columns as fit, never fewer than 2. */
export function RecipeGrid({ hits, loading, target, skeletons = 10, className }: { hits?: RecipeHit[]; loading?: boolean; target?: string; skeletons?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-[repeat(auto-fill,minmax(min(calc(50%-0.5rem),210px),1fr))] gap-3 sm:gap-4', className)}>
      {loading && !hits
        ? Array.from({ length: skeletons }, (_, i) => <RecipeCardSkeleton key={i} />)
        : hits?.map((h) => <RecipeCard key={h.recipe.id} hit={h} target={target} />)}
    </div>
  )
}

/** Horizontally scrolling row of cards (detail pages, profiles). */
export function RecipeRail({ hits, loading, target }: { hits?: RecipeHit[]; loading?: boolean; target?: string }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {loading && !hits
        ? Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="w-[220px] shrink-0 snap-start"><RecipeCardSkeleton /></div>
          ))
        : hits?.map((h) => (
            <div key={h.recipe.id} className="w-[220px] shrink-0 snap-start">
              <RecipeCard hit={h} target={target} className="h-full" />
            </div>
          ))}
    </div>
  )
}
