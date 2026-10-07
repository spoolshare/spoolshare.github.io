import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import {
  ArrowRight, Boxes, Calculator, ChevronDown, FlaskConical, Info, Layers, Plus, Sparkles,
} from 'lucide-react'
import type { Hex } from '@/types'
import type { RecipeHit } from '@/lib/api'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { useInventory } from '@/lib/hooks/useInventory'
import { useCanMakeFilter } from '@/lib/hooks/usePreferences'
import { checkCanMake } from '@/lib/recipe/canMake'
import { formatRatio } from '@/lib/recipe/composition'
import { naiveRgbAverage, predictMix, suggestMixes } from '@/lib/color/mixing'
import { CLOSE_MATCH_THRESHOLD, deltaE } from '@/lib/color/deltaE'
import { hexToRgb, normalizeHex, readableOn } from '@/lib/color/convert'
import { nearestColorName } from '@/lib/color/names'
import { plural } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { ColorPicker } from '@/components/color/ColorPicker'
import { ColorDot, HexChip } from '@/components/color/Swatch'
import { ColorPair, CompareSlider, DeltaEMeter } from '@/components/color/Compare'
import { FilamentDots } from '@/components/filament/Spool'
import { CanMakeLine, DifficultyMeter, TrustBadge } from '@/components/recipe/badges'
import { useInventoryPanel } from '@/components/filament/InventoryPanel'
import { Button, ButtonLink, EmptyState, PageHeader, Skeleton, Switch } from '@/components/ui'

const FALLBACK: Hex = '#C1AAD6'

function useDebounced<T>(value: T, ms: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

export default function MatcherPage() {
  const [params, setParams] = useSearchParams()
  const urlHex = normalizeHex(params.get('hex') ?? '') ?? FALLBACK
  const [target, setTarget] = useState<Hex>(urlHex)
  const debounced = useDebounced(target, 200)
  const inv = useInventory()
  const [onlyCanMake, setOnlyCanMake] = useCanMakeFilter()

  // URL → state (back/forward, header search)
  useEffect(() => setTarget(urlHex), [urlHex])
  // state → URL (replace, so dragging the picker doesn't spam history)
  useEffect(() => {
    if (debounced !== urlHex) setParams((p) => { p.set('hex', debounced); return p }, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const canMakeWith = inv.signedIn && onlyCanMake ? [...inv.ownedIds] : undefined
  const waiting = !!canMakeWith && !inv.ready
  const { data, loading } = useRecipeSearch(waiting ? null : { targetHex: debounced, sort: 'closest', limit: 12, canMakeWith })
  const hits = data?.items ?? []
  const best = hits[0]?.deltaE
  const noExact = data && (hits.length === 0 || (best ?? 99) > CLOSE_MATCH_THRESHOLD)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Color Matcher"
        title="Find a tested recipe for any color"
        description="Pick a target. We rank community colors by CIEDE2000, a perceptual color difference, not raw RGB distance."
      />

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            <div
              className="color-transition mb-4 flex aspect-[16/9] flex-col justify-between rounded-xl p-4 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]"
              style={{ background: target, color: readableOn(target) }}
            >
              <span className="text-xs font-semibold tracking-wider uppercase opacity-80">Target</span>
              <div>
                <div className="font-mono text-2xl font-semibold tracking-tight">{target}</div>
                <div className="text-sm opacity-80">≈ {nearestColorName(target)} · rgb({Object.values(hexToRgb(target)).join(', ')})</div>
              </div>
            </div>
            <ColorPicker value={target} onChange={setTarget} />
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <HexChip hex={target} />
              <Link to={`/search?hex=${encodeURIComponent(target)}`} className="text-sm font-medium text-accent hover:underline">Browse with filters</Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 space-y-10">
          <section aria-labelledby="tested-heading">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="tested-heading" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <FlaskConical className="size-4 text-accent" aria-hidden />
                  {noExact && hits.length > 0 ? 'No exact match yet — closest tested matches' : 'Community-tested matches'}
                </h2>
                <p className="mt-0.5 text-sm text-fg-muted">
                  Printed results are estimated from photos, so treat ΔE below ~2 as identical. Official examples show a calculated preview until someone prints them.
                </p>
              </div>
              {inv.signedIn && <Switch checked={onlyCanMake} onChange={setOnlyCanMake} label="Only recipes I can make" size="sm" />}
            </div>

            {noExact && (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-4 sm:flex-row sm:items-center">
                <Sparkles className="size-5 shrink-0 text-accent" aria-hidden />
                <p className="flex-1 text-sm">
                  {hits.length === 0
                    ? 'No community recipes match your filters yet.'
                    : <>Nothing within <b>ΔE {CLOSE_MATCH_THRESHOLD}</b> yet. If you mix this color, you’ll be the first to publish it.</>}
                </p>
                <ButtonLink to={`/create?prefill=${encodeURIComponent(JSON.stringify({ resultHex: target, components: [] }))}`} size="sm" icon={<Plus className="size-4" />}>
                  Create this recipe
                </ButtonLink>
              </div>
            )}

            <ol className="space-y-3">
              {(loading || waiting) && !data
                ? Array.from({ length: 4 }, (_, i) => <li key={i}><Skeleton className="h-36 rounded-xl" /></li>)
                : hits.map((h, i) => <MatchRow key={h.recipe.id} hit={h} target={debounced} rank={i + 1} />)}
            </ol>
            {data && hits.length === 0 && onlyCanMake && (
              <div className="mt-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => setOnlyCanMake(false)}>Include recipes I can’t make</Button>
              </div>
            )}
          </section>

          <CalculatedSection target={debounced} />
        </div>
      </div>
    </div>
  )
}

function MatchRow({ hit, target, rank }: { hit: RecipeHit; target: Hex; rank: number }) {
  const [open, setOpen] = useState(false)
  const inv = useInventory()
  const { recipe, filaments, composition, trust, difficulty, stats } = hit
  const canMake = useMemo(
    () => (inv.signedIn ? checkCanMake(composition, new Map(filaments.map((f) => [f.id, f])), inv.ownedIds, inv.ownedFilaments) : null),
    [inv.signedIn, composition, filaments, inv.ownedIds, inv.ownedFilaments],
  )
  const dE = hit.deltaE ?? deltaE(recipe.resultHex, target)
  const a = hexToRgb(target)
  const b = hexToRgb(recipe.resultHex)
  const diff = `R ${sign(b.r - a.r)} · G ${sign(b.g - a.g)} · B ${sign(b.b - a.b)}`

  return (
    <li className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md">
      <div className="grid gap-4 p-4 sm:grid-cols-[180px_1fr] md:grid-cols-[220px_1fr_auto]">
        <div className="relative">
          <ColorPair a={target} b={recipe.resultHex} aLabel="Target" bLabel={recipe.isExample ? "Calculated" : "Printed"} className="h-24 sm:h-full sm:min-h-24" />
          <span className="absolute -top-2 -left-2 grid size-6 place-items-center rounded-full bg-fg text-[11px] font-bold text-bg tabular">{rank}</span>
        </div>

        <div className="min-w-0 space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/r/${recipe.slug}`} className="text-base font-semibold tracking-tight hover:underline">{recipe.name}</Link>
            <TrustBadge level={trust} size="xs" />
          </div>
          <DeltaEMeter value={dE} className="max-w-sm" />
          <p className="font-mono text-[11px] text-fg-subtle" title="Result minus target, per sRGB channel">
            {target} → {recipe.resultHex} · {diff}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-fg-muted">
            <span className="inline-flex items-center gap-1.5">
              <FilamentDots filaments={filaments} size={16} owned={inv.signedIn ? inv.ownedIds : undefined} />
              <span className="line-clamp-1 max-w-56">{filaments.map((f) => f.colorName).join(' + ')}</span>
            </span>
            <span className="inline-flex items-center gap-1"><Layers className="size-3.5" aria-hidden />{plural(recipe.stages.length, 'stage')}</span>
            <DifficultyMeter difficulty={difficulty} />
            <span>{plural(stats.count, 'reproduction')}</span>
          </div>
          <CanMakeLine result={canMake} signedIn={inv.signedIn} />
        </div>

        <div className="flex items-center gap-2 sm:col-span-2 md:col-span-1 md:flex-col md:items-end md:justify-between">
          <ButtonLink to={`/r/${recipe.slug}`} size="sm" variant="outline" iconRight={<ArrowRight className="size-3.5" />}>View recipe</ButtonLink>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 text-xs font-medium text-fg-muted hover:text-fg"
          >
            Compare <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border bg-bg p-4">
          <CompareSlider left={target} right={recipe.resultHex} leftLabel={`Target ${target}`} rightLabel={`${recipe.name} ${recipe.resultHex}`} height={160} />
          {stats.averageHex && stats.count > 0 && (
            <p className="mt-2 flex items-center gap-2 text-xs text-fg-muted">
              <ColorDot hex={stats.averageHex} size={14} /> Community average of {stats.count + 1} results: <span className="font-mono">{stats.averageHex}</span>
              (ΔE {deltaE(stats.averageHex, target).toFixed(1)} to your target)
            </p>
          )}
        </div>
      )}
    </li>
  )
}

function sign(n: number) {
  return n > 0 ? `+${n}` : String(n)
}

function CalculatedSection({ target }: { target: Hex }) {
  const inv = useInventory()
  const panel = useInventoryPanel()
  const palette = inv.ownedFilaments
  const suggestions = useMemo(() => (palette.length ? suggestMixes(target, palette, 3) : []), [target, palette])
  const [why, setWhy] = useState(false)
  const byId = useMemo(() => new Map(palette.map((f) => [f.id, f])), [palette])

  return (
    <section aria-labelledby="calc-heading" className="rounded-2xl border-2 border-dashed border-calc/50 bg-calc-soft/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="size-5 text-calc" aria-hidden />
            <h2 id="calc-heading" className="text-sm font-bold tracking-widest text-calc uppercase">Calculated / Untested</h2>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-fg-muted">
            A starting point predicted from the filaments you own. Nobody has printed these yet.
          </p>
        </div>
        <TrustBadge level="calculated" />
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-calc/30 bg-surface p-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-calc" aria-hidden />
        <p>
          <b>Melted plastic does not mix like math.</b> Pigment loading, translucency and brand differences make real results drift,
          often by a lot. We use a Kubelka–Munk pigment model (better than averaging HEX), but community-tested swatches above always
          win. Print a small test before committing a spool.
        </p>
      </div>

      {!inv.signedIn ? (
        <EmptyState
          className="mt-4 bg-surface"
          icon={<Boxes className="size-5" />}
          title="Sign in to get predictions"
          description="Predictions only use filaments you actually own."
          action={<ButtonLink to="/signin">Sign in</ButtonLink>}
        />
      ) : palette.length === 0 ? (
        <EmptyState
          className="mt-4 bg-surface"
          icon={<Boxes className="size-5" />}
          title="Add your filaments first"
          description="We’ll predict mixes using only the spools on your shelf."
          action={<Button onClick={() => panel.open('add')} icon={<Plus className="size-4" />}>Add filaments</Button>}
        />
      ) : (
        <>
          <ol className="mt-4 grid gap-3 xl:grid-cols-3">
            {suggestions.map((s, i) => {
              const parts = s.components.map((c) => c.weight * 100)
              const prefill = {
                name: `${nearestColorName(target)} (test)`,
                resultHex: target,
                components: s.components.map((c) => ({ filamentId: c.filament.id, parts: Math.round(c.weight * 100) })),
              }
              return (
                <li key={i} className="flex flex-col rounded-xl border border-dashed border-calc/40 bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold tracking-wide text-calc uppercase">Prediction {i + 1}</span>
                    <span className="font-mono text-xs text-fg-muted">ratio {formatRatio(parts)}</span>
                  </div>
                  <ColorPair a={target} b={s.predictedHex} aLabel="Target" bLabel="Predicted" className="mt-3 h-20" />
                  <DeltaEMeter value={s.deltaE} className="mt-3" />
                  <ul className="mt-3 space-y-1.5" role="list">
                    {s.components.map((c) => (
                      <li key={c.filament.id} className="flex items-center gap-2 text-sm">
                        <ColorDot hex={c.filament.hex} size={14} />
                        <span className="min-w-0 flex-1 truncate">{c.filament.colorName}<span className="text-fg-muted"> · {byId.get(c.filament.id)?.manufacturer.name} {byId.get(c.filament.id)?.productLine.name}</span></span>
                        <span className="font-mono text-xs font-medium tabular">{Math.round(c.weight * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                  <ButtonLink
                    to={`/create?prefill=${encodeURIComponent(JSON.stringify(prefill))}`}
                    variant="outline"
                    size="sm"
                    className="mt-4 border-calc/40 text-calc hover:bg-calc-soft"
                    icon={<FlaskConical className="size-4" />}
                  >
                    Test this mix
                  </ButtonLink>
                </li>
              )
            })}
          </ol>

          {suggestions[0] && (
            <div className="mt-4">
              <button type="button" onClick={() => setWhy((w) => !w)} aria-expanded={why} className="inline-flex items-center gap-1 text-sm font-medium text-calc hover:underline">
                Why not just average RGB? <ChevronDown className={cn('size-4 transition-transform', why && 'rotate-180')} aria-hidden />
              </button>
              {why && <WhyNotRgb target={target} comps={suggestions[0].components.map((c) => ({ hex: c.filament.hex, weight: c.weight, filament: c.filament }))} />}
            </div>
          )}
        </>
      )}
    </section>
  )
}

function WhyNotRgb({ target, comps }: { target: Hex; comps: { hex: Hex; weight: number; filament: { transparency: 'opaque' | 'semi' | 'translucent' | 'clear' } }[] }) {
  const rgb = naiveRgbAverage(comps)
  const km = predictMix(comps)
  const cells = [
    { label: 'Your target', hex: target, note: '' },
    { label: 'RGB average', hex: rgb, note: `ΔE ${deltaE(rgb, target).toFixed(1)}` },
    { label: 'Pigment model', hex: km, note: `ΔE ${deltaE(km, target).toFixed(1)}` },
  ]
  return (
    <div className="mt-3 rounded-xl border border-border bg-surface p-4 text-sm">
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.label}>
            <div className="color-transition h-14 rounded-lg shadow-[inset_0_0_0_1px_rgb(0_0_0/0.06)]" style={{ background: c.hex }} />
            <div className="mt-1.5 text-xs font-medium">{c.label}</div>
            <div className="font-mono text-[11px] text-fg-muted">{c.hex} {c.note && `· ${c.note}`}</div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-fg-muted">
        Averaging RGB treats plastic like light. Pigments absorb, so a small amount of a strong color tints a lot of white, and
        dark colors dominate quickly. The Kubelka–Munk model captures that, but only a printed swatch tells the truth.
      </p>
    </div>
  )
}
