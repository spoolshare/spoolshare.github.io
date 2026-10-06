import { memo, useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { Heart, Layers, Repeat2, Columns2 } from 'lucide-react'
import type { RecipeHit } from '@/lib/api'
import { cn } from '@/lib/utils/cn'
import { formatCompact } from '@/lib/utils/format'
import { checkCanMake } from '@/lib/recipe/canMake'
import { useInventory } from '@/lib/hooks/useInventory'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useCompareTray } from '@/lib/hooks/usePreferences'
import { readableOn } from '@/lib/color/convert'
import { ColorDot, HexChip, SwatchVisual } from '@/components/color/Swatch'
import { DeltaEMeter } from '@/components/color/Compare'
import { FilamentDots } from '@/components/filament/Spool'
import { Avatar, Skeleton, useToast } from '@/components/ui'
import { CanMakeLine, DifficultyMeter, TrustBadge } from './badges'

export const RecipeCard = memo(function RecipeCard({ hit, target, className }: { hit: RecipeHit; target?: string; className?: string }) {
  const { recipe, author, filaments, stats, trust, difficulty, composition } = hit
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
  const href = `/r/${recipe.slug}`

  const onFav = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const on = await fav.toggle(recipe.id)
      toast(on ? <>Saved <b>{recipe.name}</b></> : `Removed from saved`, { tone: on ? 'success' : 'info' })
    } catch {
      toast('Sign in to save recipes', { tone: 'info', action: { label: 'Sign in', onClick: () => navigate('/signin') } })
    }
  }

  const inCompare = compare.has(recipe.id)

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md focus-within:ring-2 focus-within:ring-[var(--ring)]',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <SwatchVisual
          hex={recipe.resultHex}
          photo={recipe.photos[0]}
          finish={recipe.finish}
          rounded=""
          className="size-full transition-transform duration-500 group-hover:scale-[1.03]"
          label={`${recipe.name} swatch, ${recipe.resultHex}`}
        />
        <div className="absolute top-2 right-2 z-10 flex gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              compare.toggle(recipe.id)
            }}
            aria-pressed={inCompare}
            aria-label={inCompare ? `Remove ${recipe.name} from comparison` : `Add ${recipe.name} to comparison`}
            title="Compare"
            className={cn(
              'grid size-8 place-items-center rounded-full border border-white/40 shadow-sm backdrop-blur-sm transition-all',
              inCompare ? 'bg-neutral-900 text-white opacity-100' : 'bg-white/85 text-neutral-700 opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
            )}
          >
            <Columns2 className="size-4" />
          </button>
          <button
            type="button"
            onClick={onFav}
            aria-pressed={isFav}
            aria-label={isFav ? `Unsave ${recipe.name}` : `Save ${recipe.name}`}
            className="grid size-8 place-items-center rounded-full border border-white/40 bg-white/85 text-neutral-700 shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
          >
            <Heart className={cn('size-4 transition-colors', isFav && 'fill-rose-500 text-rose-500')} />
          </button>
        </div>
        {target && (
          <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1 rounded-full bg-white/85 py-0.5 pr-2 pl-0.5 shadow-sm backdrop-blur-sm">
            <ColorDot hex={target} size={18} label="Your target" />
            <DeltaEMeter value={hit.deltaE} compact className="text-neutral-800!" />
          </div>
        )}
        <span
          className="pointer-events-none absolute bottom-2.5 left-2.5 font-mono text-xs font-medium opacity-0 transition-opacity group-hover:opacity-90"
          style={{ color: readableOn(recipe.resultHex) }}
          aria-hidden
        >
          {recipe.resultHex}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 text-base leading-tight font-semibold tracking-tight">
            <Link to={href} className="outline-none after:absolute after:inset-0 after:content-['']">
              {recipe.name}
            </Link>
          </h3>
          <HexChip hex={recipe.resultHex} size="xs" className="relative z-10 shrink-0" />
        </div>
        <TrustBadge level={trust} size="xs" className="-mt-2" />

        <div className="flex items-center justify-between gap-2">
          <Link to={`/u/${author.username}`} className="relative z-10 inline-flex min-w-0 items-center gap-1.5 text-xs text-fg-muted hover:text-fg">
            <Avatar profile={author} size="xs" />
            <span className="truncate">{author.displayName}</span>
          </Link>
          <FilamentDots filaments={filaments} size={18} owned={inv.signedIn ? inv.ownedIds : undefined} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
          <span className="inline-flex items-center gap-1" title="Mixing stages">
            <Layers className="size-3.5" aria-hidden />
            {recipe.stages.length} {recipe.stages.length === 1 ? 'stage' : 'stages'}
          </span>
          <span className="inline-flex items-center gap-1" title={`${stats.closeCount} of ${stats.count} reproductions were close matches`}>
            <Repeat2 className="size-3.5" aria-hidden />
            {stats.count} <span className="sr-only">reproductions</span>
          </span>
          <span className="inline-flex items-center gap-1" title="Favorites">
            <Heart className="size-3.5" aria-hidden />
            {formatCompact(recipe.favoriteCount)} <span className="sr-only">favorites</span>
          </span>
          <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[10px] font-semibold text-fg-muted">{recipe.material}</span>
          <DifficultyMeter difficulty={difficulty} showLabel={false} className="ml-auto" />
        </div>

        {inv.signedIn && <div className="mt-auto border-t border-border pt-3"><CanMakeLine result={canMake} signedIn={inv.signedIn} /></div>}
      </div>
    </article>
  )
})

export function RecipeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}

export function RecipeGrid({ hits, loading, target, skeletons = 8, className }: { hits?: RecipeHit[]; loading?: boolean; target?: string; skeletons?: number; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4', className)}>
      {loading && !hits
        ? Array.from({ length: skeletons }, (_, i) => <RecipeCardSkeleton key={i} />)
        : hits?.map((h) => <RecipeCard key={h.recipe.id} hit={h} target={target} />)}
    </div>
  )
}

/** Horizontally scrolling rail of cards (Explore sections). */
export function RecipeRail({ hits, loading, target }: { hits?: RecipeHit[]; loading?: boolean; target?: string }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
      {loading && !hits
        ? Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="w-[260px] shrink-0 snap-start sm:w-[280px]"><RecipeCardSkeleton /></div>
          ))
        : hits?.map((h) => (
            <div key={h.recipe.id} className="w-[260px] shrink-0 snap-start sm:w-[280px]">
              <RecipeCard hit={h} target={target} className="h-full" />
            </div>
          ))}
    </div>
  )
}
