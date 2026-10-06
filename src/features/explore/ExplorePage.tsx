import { useDeferredValue, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
  ArrowRight, Boxes, CircleCheck, Clock, FlaskConical, Flame, Repeat2, Sparkles, Target, Users,
} from 'lucide-react'
import type { Hex, TrustLevel } from '@/types'
import { TrustBadge } from '@/components/recipe/badges'
import { api } from '@/lib/api'
import { useQuery } from '@/lib/hooks/useQuery'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { useInventory } from '@/lib/hooks/useInventory'
import { useCanMakeFilter, useRecentlyViewed } from '@/lib/hooks/usePreferences'
import { HUE_FAMILIES, nearestColorName } from '@/lib/color/names'
import { readableOn, shade } from '@/lib/color/convert'
import { ColorPicker } from '@/components/color/ColorPicker'
import { ColorDot, HexChip } from '@/components/color/Swatch'
import { RecipeRail } from '@/components/recipe/RecipeCard'
import { Avatar, Button, ButtonLink, EmptyState, SectionHeader, Switch } from '@/components/ui'
import { useInventoryPanel } from '@/components/filament/InventoryPanel'

const DEFAULT_TARGET: Hex = '#C1AAD6'

export default function ExplorePage() {
  const [target, setTarget] = useState<Hex>(DEFAULT_TARGET)
  const deferredTarget = useDeferredValue(target)
  const inv = useInventory()
  const [onlyCanMake, setOnlyCanMake] = useCanMakeFilter()
  const canMakeWith = inv.signedIn && onlyCanMake ? [...inv.ownedIds] : undefined

  const closest = useRecipeSearch({ targetHex: deferredTarget, sort: 'closest', limit: 10, canMakeWith })
  const canMakeNow = useRecipeSearch(inv.signedIn && inv.ready ? { canMakeWith: [...inv.ownedIds], sort: 'trending', limit: 10 } : null)
  const trending = useRecipeSearch({ sort: 'trending', limit: 10, canMakeWith })
  const newest = useRecipeSearch({ sort: 'newest', limit: 10, canMakeWith })
  const reproduced = useRecipeSearch({ sort: 'most-reproduced', limit: 10, canMakeWith })

  return (
    <div>
      <Hero target={target} onTarget={setTarget} />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <HueStrip />

        {inv.signedIn && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-4 py-3">
            <Switch
              checked={onlyCanMake}
              onChange={setOnlyCanMake}
              label="Only show recipes I can make"
              description={`Filters every section using your ${inv.items.length} filaments`}
            />
            <InventoryButton />
          </div>
        )}

        <Section
          icon={<Target className="size-4" />}
          title={<>Closest to <span className="inline-flex translate-y-0.5 items-center gap-1.5"><ColorDot hex={deferredTarget} size={16} /> <span className="font-mono text-base">{deferredTarget}</span></span></>}
          subtitle={`Community-tested swatches ranked by CIEDE2000 (≈ ${nearestColorName(deferredTarget)})`}
          seeAll={`/match?hex=${encodeURIComponent(deferredTarget)}`}
          seeAllLabel="Open in Color Matcher"
        >
          <RailOrEmpty result={closest} target={deferredTarget} emptyText="No recipes you can make are near this color yet." />
        </Section>

        {inv.signedIn && !onlyCanMake && (
          <Section
            icon={<CircleCheck className="size-4" />}
            title="You can make right now"
            subtitle="Every filament in these recipes is already on your shelf"
            seeAll="/search?canmake=1"
          >
            {canMakeNow.data && canMakeNow.data.items.length === 0 ? (
              <EmptyState
                icon={<Boxes className="size-5" />}
                title="Nothing fully makeable yet"
                description="Add a few more filaments (a white, a black, and a primary or two) to unlock many recipes."
                action={<InventoryButton variant="primary" label="Add filaments" />}
              />
            ) : (
              <RecipeRail hits={canMakeNow.data?.items} loading={!canMakeNow.data} />
            )}
          </Section>
        )}

        <Section icon={<Flame className="size-4" />} title="Trending mixes" subtitle="Most saved and reproduced this month" seeAll="/search?sort=trending">
          <RailOrEmpty result={trending} />
        </Section>

        <Section icon={<Clock className="size-4" />} title="Recently tested" subtitle="Fresh swatches from the community" seeAll="/search?sort=newest">
          <RailOrEmpty result={newest} />
        </Section>

        <Section icon={<Repeat2 className="size-4" />} title="Most reproduced" subtitle="Recipes other makers have independently confirmed" seeAll="/search?sort=most-reproduced">
          <RailOrEmpty result={reproduced} />
        </Section>

        <RecentlyViewed />
        <TopCreators />
        <HowItWorks />
      </div>
    </div>
  )
}

function Hero({ target, onTarget }: { target: Hex; onTarget: (h: Hex) => void }) {
  const navigate = useNavigate()
  const fg = readableOn(target)
  return (
    <section className="relative overflow-hidden border-b border-border bg-surface">
      {/* animated color wash driven by the chosen target */}
      <div
        aria-hidden
        className="color-transition pointer-events-none absolute -top-40 -right-40 size-[620px] rounded-full opacity-35 blur-3xl dark:opacity-25"
        style={{ background: `radial-gradient(circle, ${target}, transparent 65%)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.25]"
        style={{
          backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 30% 40%, black, transparent 70%)',
        }}
      />
      <div className="relative mx-auto grid max-w-[1400px] items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.15fr_1fr] lg:py-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs font-medium text-fg-muted backdrop-blur">
            <FlaskConical className="size-3.5 text-accent" aria-hidden />
            Physically tested · community reproduced
          </div>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Mix a color.
            <br />
            <span className="relative">
              Share the{' '}
              <span className="color-transition relative inline-block" style={{ color: shade(target, -8) }}>
                recipe.
                <span aria-hidden className="color-transition absolute inset-x-0 -bottom-1 h-1.5 rounded-full" style={{ background: target }} />
              </span>
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-fg-muted text-pretty">
            Discover custom filament colors that real makers have physically mixed, printed and photographed, and
            filter them to the ones you can make from the spools already on your shelf.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink to="/search" size="lg" variant="secondary">Browse recipes</ButtonLink>
            <ButtonLink to="/create" size="lg" variant="outline" icon={<Sparkles className="size-4" />}>Share a recipe</ButtonLink>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 text-sm">
            {[['Tested', 'printed by the creator'], ['Reproduced', 'confirmed by others'], ['ΔE00', 'perceptual matching']].map(([t, d]) => (
              <div key={t}>
                <dt className="font-semibold">{t}</dt>
                <dd className="text-xs text-fg-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative rounded-2xl border border-border bg-surface/90 p-4 shadow-lg backdrop-blur sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">What color are you after?</h2>
              <p className="text-xs text-fg-muted">Pick visually, type a HEX, or search by name</p>
            </div>
            <HexChip hex={target} />
          </div>
          <div
            className="color-transition mb-4 flex h-20 items-end justify-between rounded-xl p-3 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]"
            style={{ background: target, color: fg }}
          >
            <span className="text-xs font-semibold tracking-wide uppercase opacity-80">Your target</span>
            <span className="text-sm font-medium">≈ {nearestColorName(target)}</span>
          </div>
          <ColorPicker value={target} onChange={onTarget} compact />
          <Button
            size="lg"
            className="mt-4 w-full"
            iconRight={<ArrowRight className="size-4" />}
            onClick={() => navigate(`/match?hex=${encodeURIComponent(target)}`)}
          >
            Find tested recipes
          </Button>
        </div>
      </div>
    </section>
  )
}

function HueStrip() {
  return (
    <nav aria-label="Browse by color family" className="scrollbar-none -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
      {HUE_FAMILIES.map((h) => (
        <Link
          key={h.id}
          to={`/search?hue=${h.id}`}
          className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border border-border bg-surface pr-3.5 pl-1.5 text-sm font-medium text-fg-muted transition-colors hover:border-border-strong hover:text-fg"
        >
          <ColorDot hex={h.hex} size={24} />
          {h.label}
        </Link>
      ))}
    </nav>
  )
}

function Section({
  title, subtitle, icon, seeAll, seeAllLabel = 'See all', children,
}: {
  title: React.ReactNode
  subtitle?: string
  icon?: React.ReactNode
  seeAll?: string
  seeAllLabel?: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-12">
      <SectionHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        action={
          seeAll && (
            <Link to={seeAll} className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              <span className="hidden sm:inline">{seeAllLabel}</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          )
        }
      />
      {children}
    </section>
  )
}

function RailOrEmpty({
  result, target, emptyText = 'No recipes match your filter yet.',
}: {
  result: ReturnType<typeof useRecipeSearch>
  target?: string
  emptyText?: string
}) {
  if (result.data && result.data.items.length === 0) {
    return <p className="rounded-xl border border-dashed border-border-strong px-4 py-8 text-center text-sm text-fg-muted">{emptyText}</p>
  }
  return <RecipeRail hits={result.data?.items} loading={!result.data} target={target} />
}

function InventoryButton({ variant = 'outline', label = 'Manage filaments' }: { variant?: 'outline' | 'primary'; label?: string }) {
  const panel = useInventoryPanel()
  return (
    <Button size="sm" variant={variant} icon={<Boxes className="size-4" />} onClick={() => panel.open(variant === 'primary' ? 'add' : 'mine')}>
      {label}
    </Button>
  )
}

function RecentlyViewed() {
  const recent = useRecentlyViewed()
  if (recent.items.length === 0) return null
  return (
    <section className="mt-12">
      <SectionHeader
        title="Recently viewed"
        icon={<Clock className="size-4" />}
        action={<button type="button" onClick={recent.clear} className="text-sm text-fg-muted hover:text-fg">Clear</button>}
      />
      <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {recent.items.map((r) => (
          <Link key={r.id} to={`/r/${r.slug}`} className="group w-32 shrink-0">
            <div
              className="color-transition aspect-square rounded-xl shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)] transition-transform group-hover:-translate-y-0.5"
              style={{ background: r.hex }}
            />
            <div className="mt-1.5 truncate text-sm font-medium group-hover:underline">{r.name}</div>
            <div className="font-mono text-xs text-fg-muted">{r.hex}</div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function TopCreators() {
  const { data } = useQuery('creators:top', () => api.listCreators(8))
  if (!data?.length) return null
  return (
    <section className="mt-12">
      <SectionHeader title="Top creators" subtitle="Makers whose recipes others reproduce most" icon={<Users className="size-4" />} />
      <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6">
        {data.map((c) => (
          <Link
            key={c.id}
            to={`/u/${c.username}`}
            className="flex w-56 shrink-0 items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:shadow-sm"
          >
            <Avatar profile={c} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{c.displayName}</div>
              <div className="truncate text-xs text-fg-muted">@{c.username}</div>
              <div className="mt-1 text-xs text-fg-muted tabular">
                {c.recipeCount} recipes · {c.reproductionsReceived} repros
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { n: '01', icon: Boxes, title: 'Own', body: 'Add the spools on your shelf. Every recipe then tells you whether you can make it, or what you’re missing.' },
    { n: '02', icon: FlaskConical, title: 'Mix', body: 'Follow exact multi-stage ratios with a gram calculator and a step-by-step “Make this color” mode.' },
    { n: '03', icon: Repeat2, title: 'Share & reproduce', body: 'Post your printed swatch. When others reproduce it and get a close match, the recipe earns trust.' },
  ]
  const ladder: { level: TrustLevel; note: string }[] = [
    { level: 'calculated', note: 'math only' },
    { level: 'tested', note: '1 printed swatch' },
    { level: 'reproduced', note: '≥1 close match' },
    { level: 'highly-reproduced', note: '5+ and 80% agree' },
  ]
  return (
    <section className="mt-16 rounded-2xl border border-border bg-surface p-6 sm:p-10">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold tracking-wider text-accent uppercase">How it works</div>
        <h2 className="mt-1.5 text-2xl font-semibold tracking-tight">Real filament beats math.</h2>
        <p className="mt-2 text-fg-muted">
          Melted plastic doesn’t mix like RGB values. SpoolShare is built on printed swatches, and confidence grows only as
          other makers reproduce them.
        </p>
      </div>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n} className="rounded-xl border border-border bg-bg p-5">
            <div className="flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-lg bg-accent-soft text-accent-soft-fg"><s.icon className="size-5" aria-hidden /></span>
              <span className="font-mono text-xs text-fg-subtle">{s.n}</span>
            </div>
            <h3 className="mt-4 font-semibold">{s.title}</h3>
            <p className="mt-1 text-sm text-fg-muted">{s.body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        <h3 className="text-sm font-semibold">The trust ladder</h3>
        <ol className="mt-3 flex flex-wrap items-center gap-2">
          {ladder.map((l, i) => (
            <li key={l.level} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5">
                <TrustBadge level={l.level} size="md" />
                <span className="text-xs text-fg-subtle">· {l.note}</span>
              </span>
              {i < ladder.length - 1 && <ArrowRight className="size-4 text-fg-subtle" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
