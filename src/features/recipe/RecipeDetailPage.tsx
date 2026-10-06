import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ArrowLeft, Check, Columns2, Flag, FolderPlus, Heart, Info, MoreHorizontal, Play, Share2, SearchX, UserPlus, UserCheck,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useRecipe, useCanMake } from '@/lib/hooks/useRecipes'
import { useInventory } from '@/lib/hooks/useInventory'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useSession } from '@/lib/hooks/useSession'
import { useCompareTray, useRecentlyViewed } from '@/lib/hooks/usePreferences'
import { invalidate, useQuery } from '@/lib/hooks/useQuery'
import { planRecipe } from '@/lib/recipe/composition'
import { TRUST_META, DIFFICULTY_META } from '@/lib/recipe/trust'
import { nearestColorName } from '@/lib/color/names'
import { readableOn } from '@/lib/color/convert'
import { cn } from '@/lib/utils/cn'
import { formatCompact, formatDate, formatGrams, plural } from '@/lib/utils/format'
import { HexChip, SwatchVisual } from '@/components/color/Swatch'
import { CompositionBar } from '@/components/recipe/CompositionBar'
import { CanMakeBanner } from '@/components/recipe/CanMakeBanner'
import { DifficultyMeter, TrustBadge } from '@/components/recipe/badges'
import { Badge, Button, ButtonLink, Card, EmptyState, Menu, Skeleton, UserLink, useToast } from '@/components/ui'
import { BatchControls } from './shared'
import { StagesSection } from './StagesSection'
import { ResultsSection } from './ResultsSection'
import { CommentsSection } from './CommentsSection'
import { CollectionsDialog, ReportDialog } from './dialogs'

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'composition', label: 'Composition' },
  { id: 'stages', label: 'Stages' },
  { id: 'results', label: 'Results' },
  { id: 'comments', label: 'Comments' },
]

export default function RecipeDetailPage() {
  const { slug } = useParams()
  const { data, loading } = useRecipe(slug)
  const { user } = useSession()
  const inv = useInventory()
  const fav = useFavorites()
  const compare = useCompareTray()
  const recent = useRecentlyViewed()
  const toast = useToast()
  const navigate = useNavigate()
  const canMake = useCanMake(data ?? undefined, data?.filamentsById)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [grams, setGrams] = useState(100)
  const [waste, setWaste] = useState(0)
  const [collectionsOpen, setCollectionsOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const viewed = useRef<string | null>(null)

  const recipe = data?.recipe
  useEffect(() => {
    if (!recipe || viewed.current === recipe.id) return
    viewed.current = recipe.id
    void api.recordView(recipe.id)
    recent.push({ id: recipe.id, slug: recipe.slug, name: recipe.name, hex: recipe.resultHex })
    document.title = `${recipe.name} · SpoolShare`
    return () => { document.title = 'SpoolShare — Mix a color. Share the recipe.' }
  }, [recipe]) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: authorProfile } = useQuery(data ? `profile:${data.author.username}` : null, () => api.getProfile(data!.author.username), ['follows'])
  const plan = useMemo(() => (recipe ? planRecipe(recipe.stages, grams, waste) : null), [recipe, grams, waste])

  if (loading) return <DetailSkeleton />
  if (!data || !recipe || !plan) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="Recipe not found"
          description="It may have been removed, or the link is mistyped."
          action={<ButtonLink to="/search">Browse recipes</ButtonLink>}
        />
      </div>
    )
  }

  const isOwn = user?.id === recipe.authorId
  const isFav = fav.isFavorite(recipe.id)
  const inCompare = compare.has(recipe.id)
  const photo = recipe.photos[photoIdx] ?? recipe.photos[0]

  const onFav = async () => {
    try {
      const on = await fav.toggle(recipe.id)
      toast(on ? <>Saved <b>{recipe.name}</b></> : 'Removed from saved', { tone: on ? 'success' : 'info' })
    } catch {
      toast('Sign in to save recipes', { tone: 'info', action: { label: 'Sign in', onClick: () => navigate('/signin') } })
    }
  }
  const onShare = async () => {
    const url = window.location.href.split('#')[0]
    if (navigator.share) {
      try { await navigator.share({ title: `${recipe.name} · SpoolShare`, text: `${recipe.name} (${recipe.resultHex}): a tested filament color recipe`, url }); return } catch { /* cancelled */ }
    }
    try { await navigator.clipboard.writeText(url); toast('Link copied to clipboard') } catch { toast(url, { tone: 'info' }) }
  }
  const onFollow = async () => {
    if (!user) return navigate('/signin')
    const on = await api.toggleFollow(recipe.authorId)
    invalidate('profile', 'follows')
    toast(on ? `Following ${data.author.displayName}` : `Unfollowed ${data.author.displayName}`, { tone: on ? 'success' : 'info' })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))} className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back
      </button>

      {/* ------------------------------------------------------------ hero */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-border shadow-sm">
            <SwatchVisual hex={recipe.resultHex} photo={photo} finish={recipe.finish} className="aspect-[4/3] w-full" rounded="" showPhotoState label={`${recipe.name} printed swatch, ${recipe.resultHex}`} />
            <div className="absolute top-3 left-3"><TrustBadge level={data.trust} overlay /></div>
          </div>
          {recipe.photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto" role="tablist" aria-label="Photos">
              {recipe.photos.map((p, i) => (
                <button key={p.id} type="button" role="tab" aria-selected={i === photoIdx} onClick={() => setPhotoIdx(i)} className={cn('size-16 shrink-0 overflow-hidden rounded-lg border-2', i === photoIdx ? 'border-accent' : 'border-transparent opacity-70 hover:opacity-100')}>
                  <img src={p.url} alt={p.alt} className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
          {recipe.lightingNotes && <p className="mt-2 text-xs text-fg-subtle">Photo lighting: {recipe.lightingNotes}</p>}
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{recipe.material}</Badge>
              <Badge tone="neutral">{recipe.stages.length} {recipe.stages.length === 1 ? 'stage' : 'stages'}</Badge>
              <DifficultyMeter difficulty={data.difficulty} />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{recipe.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <HexChip hex={recipe.resultHex} size="md" />
              <span className="text-sm text-fg-muted">≈ {nearestColorName(recipe.resultHex)}</span>
            </div>
          </div>

          {/* large actual color block */}
          <div className="color-transition flex h-24 items-end justify-between rounded-xl p-3 shadow-sm ring-1 ring-black/5" style={{ background: recipe.resultHex, color: readableOn(recipe.resultHex) }} role="img" aria-label={`Measured result color ${recipe.resultHex}`}>
            <span className="text-xs font-semibold tracking-wide uppercase opacity-80">Measured result</span>
            <span className="font-mono text-sm font-medium">{recipe.resultHex}</span>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2.5 text-sm">
            <Info className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
            <p><b className="font-semibold">{TRUST_META[data.trust].label}.</b> <span className="text-fg-muted">{TRUST_META[data.trust].description}</span></p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <UserLink profile={data.author} size="md" />
              <span className="text-xs text-fg-subtle">· {formatDate(recipe.createdAt)}</span>
            </div>
            {!isOwn && (
              <Button size="sm" variant={authorProfile?.isFollowing ? 'soft' : 'outline'} icon={authorProfile?.isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />} onClick={onFollow}>
                {authorProfile?.isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>

          {/* actions */}
          <div className="flex flex-wrap gap-2">
            <ButtonLink to={`/r/${recipe.slug}/make`} icon={<Play className="size-4" />} className="flex-1 sm:flex-none">Make This Color</ButtonLink>
            <Button variant="outline" onClick={onFav} aria-pressed={isFav} icon={<Heart className={cn('size-4', isFav && 'fill-rose-500 text-rose-500')} />}>
              {isFav ? 'Saved' : 'Save'} <span className="text-fg-subtle tabular">{formatCompact(recipe.favoriteCount)}</span>
            </Button>
            {isOwn ? (
              <Button variant="outline" disabled title="Reproductions must come from other makers" icon={<Check className="size-4" />}>I Made This</Button>
            ) : (
              <ButtonLink to={`/r/${recipe.slug}/reproduce`} variant="outline" icon={<Check className="size-4" />}>I Made This</ButtonLink>
            )}
            <Button variant="outline" onClick={onShare} icon={<Share2 className="size-4" />}>Share</Button>
            <Button variant={inCompare ? 'soft' : 'ghost'} onClick={() => compare.toggle(recipe.id)} aria-pressed={inCompare} icon={<Columns2 className="size-4" />}>
              {inCompare ? 'In compare' : 'Compare'}
            </Button>
            <Menu
              label="More actions"
              trigger={(p) => (
                <button {...p} type="button" aria-label="More actions" className="grid size-10 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg">
                  <MoreHorizontal className="size-5" />
                </button>
              )}
              items={[
                { label: 'Add to collection', icon: <FolderPlus className="size-4" />, onSelect: () => (user ? setCollectionsOpen(true) : navigate('/signin')) },
                { label: 'Report recipe', icon: <Flag className="size-4" />, danger: true, disabled: isOwn, onSelect: () => (user ? setReportOpen(true) : navigate('/signin')) },
              ]}
            />
          </div>
          {isOwn && <p className="-mt-2 text-xs text-fg-subtle">This is your recipe. “I Made This” is for other makers’ reproductions.</p>}

          {canMake ? <CanMakeBanner result={canMake} /> : <CanMakeBanner result={{ canMake: false, ownedCount: 0, requiredCount: data.composition.length, missing: [], substitutes: [] }} />}
        </div>
      </div>

      {/* --------------------------------------------------- section nav */}
      <nav aria-label="Recipe sections" className="sticky top-16 z-20 -mx-4 mt-10 border-b border-border bg-bg/90 px-4 backdrop-blur-md sm:-mx-6 sm:px-6">
        <ul className="scrollbar-none flex gap-1 overflow-x-auto" role="list">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); history.replaceState(null, '', `#${s.id}`) }} className="inline-flex h-11 items-center px-3 text-sm font-medium whitespace-nowrap text-fg-muted hover:text-fg">
                {s.label}
                {s.id === 'results' && <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 text-xs tabular">{data.stats.count}</span>}
                {s.id === 'comments' && <span className="ml-1.5 rounded-full bg-surface-2 px-1.5 text-xs tabular">{data.comments.length}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-14 pt-8">
        <Section id="overview" title="Overview">
          <div className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div>
              <p className="text-base leading-relaxed">{recipe.description || <span className="text-fg-muted">No description.</span>}</p>
              {recipe.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {recipe.tags.map((t) => <Link key={t} to={`/search?q=${encodeURIComponent(t)}`} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-fg-muted hover:border-border-strong hover:text-fg">#{t}</Link>)}
                </div>
              )}
            </div>
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold">Print & mixing details</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {([
                  ['Material', recipe.material],
                  ['Finish', recipe.finish[0].toUpperCase() + recipe.finish.slice(1)],
                  ['Mixing method', recipe.mixingMethod],
                  ['Printer', recipe.printer],
                  ['Nozzle', recipe.nozzle],
                  ['Layer height', recipe.layerHeight],
                  ['Difficulty', DIFFICULTY_META[data.difficulty].label],
                  ['Views', formatCompact(recipe.viewCount)],
                ] as const).filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-fg-muted">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>
        </Section>

        <Section id="composition" title="Final composition" subtitle="The true raw-filament makeup after flattening every intermediate stage.">
          <Card className="p-4 sm:p-5">
            <BatchControls grams={grams} onGrams={setGrams} waste={waste} onWaste={setWaste} className="mb-5" />
            <CompositionBar composition={data.composition} filamentsById={data.filamentsById} grams={plan.totals.reduce((a, t) => a + t.grams, 0)} owned={inv.signedIn ? inv.ownedIds : undefined} />
            <p className="mt-4 border-t border-border pt-3 text-xs text-fg-muted">
              Total raw filament: <b className="font-mono text-fg">{formatGrams(plan.totals.reduce((a, t) => a + t.grams, 0))}</b> for {formatGrams(grams)} of finished color
              {waste > 0 && ` (including ${waste}% purge allowance per stage)`}.
            </p>
          </Card>
        </Section>

        <Section
          id="stages"
          title="Mixing stages"
          subtitle={`${plural(recipe.stages.length, 'stage')}. Amounts below are for ${formatGrams(grams)} of finished color${waste ? ` + ${waste}% waste` : ''}.`}
          action={<ButtonLink to={`/r/${recipe.slug}/make`} size="sm" variant="soft" icon={<Play className="size-3.5" />}>Guided mode</ButtonLink>}
        >
          <StagesSection stages={recipe.stages} filamentsById={data.filamentsById} finalHex={recipe.resultHex} plan={plan} owned={inv.signedIn ? inv.ownedIds : undefined} />
          {recipe.notes && (
            <Card className="mt-6 border-l-4 border-l-accent p-4">
              <h3 className="text-sm font-semibold">Creator’s notes</h3>
              <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-fg-muted">{recipe.notes}</p>
            </Card>
          )}
        </Section>

        <Section id="results" title="Results" subtitle="The original swatch compared with what other makers actually got.">
          <ResultsSection recipe={recipe} stats={data.stats} reproductions={data.reproductions} filamentsById={data.filamentsById} isOwn={isOwn} />
        </Section>

        <Section id="comments" title={`Comments (${data.comments.length})`}>
          <CommentsSection recipeId={recipe.id} authorId={recipe.authorId} comments={data.comments} />
        </Section>
      </div>

      <CollectionsDialog open={collectionsOpen} onClose={() => setCollectionsOpen(false)} recipeId={recipe.id} recipeName={recipe.name} />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} targetId={recipe.id} />
    </div>
  )
}

function Section({ id, title, subtitle, action, children }: { id: string; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-32">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 id={`${id}-h`} className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading recipe">
      <div className="grid gap-8 lg:grid-cols-2">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
