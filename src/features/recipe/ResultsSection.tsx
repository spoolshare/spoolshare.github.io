import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { FlaskConical, Repeat2, Replace } from 'lucide-react'
import type { FilamentView, Hex, ID, Recipe, ReproductionStats } from '@/types'
import type { ReproductionView } from '@/lib/api'
import { formatDate, plural, timeAgo } from '@/lib/utils/format'
import { hexToLab, isVeryLight } from '@/lib/color/convert'
import { CLOSE_MATCH_THRESHOLD, deltaE } from '@/lib/color/deltaE'
import { HexChip, SwatchVisual } from '@/components/color/Swatch'
import { CompareSlider, DeltaEMeter } from '@/components/color/Compare'
import { Avatar, Button, ButtonLink, Card, EmptyState, Stat } from '@/components/ui'
import { RatingStars } from './shared'

export function ResultsSection({
  recipe,
  stats,
  reproductions,
  filamentsById,
  isOwn,
}: {
  recipe: Recipe
  stats: ReproductionStats
  reproductions: ReproductionView[]
  filamentsById: Record<ID, FilamentView>
  isOwn: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? reproductions : reproductions.slice(0, 6)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
            <FlaskConical className="size-3.5" aria-hidden /> Original result
          </div>
          <div className="flex items-center gap-4 p-4">
            <SwatchVisual hex={recipe.resultHex} photo={recipe.photos[0]} finish={recipe.finish} className="size-20 shrink-0" rounded="rounded-lg" />
            <div className="min-w-0">
              <HexChip hex={recipe.resultHex} size="sm" />
              <p className="mt-1.5 text-sm text-fg-muted">Measured by the creator from their printed swatch.</p>
            </div>
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
            <Repeat2 className="size-3.5" aria-hidden /> Community reproductions
          </div>
          {stats.count > 0 && stats.averageHex ? (
            <div className="flex items-center gap-4 p-4">
              <div className="color-transition size-20 shrink-0 rounded-lg border border-border" style={{ background: stats.averageHex }} role="img" aria-label={`Community average ${stats.averageHex}`} />
              <div className="min-w-0">
                <HexChip hex={stats.averageHex} size="sm" />
                <p className="mt-1.5 text-sm text-fg-muted">Average of {plural(stats.count + 1, 'result')} (original included), averaged in CIELAB.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-sm text-fg-muted">No one has reproduced this yet. The first reproduction is what turns a single test into evidence.</div>
          )}
        </Card>
      </div>

      {stats.count === 0 ? (
        <EmptyState
          icon={<Repeat2 className="size-5" />}
          title="Be the first to reproduce it"
          description="Mix this recipe with your own filament, photograph the swatch, and upload it. Reproductions are how the community knows a recipe is reliable."
          action={!isOwn && <ButtonLink to={`/r/${recipe.slug}/reproduce`}>✓ I Made This</ButtonLink>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3 lg:grid-cols-5">
            <Stat label="Reproductions" value={stats.count} />
            <Stat label="Close matches" value={`${stats.closeCount} / ${stats.count}`} hint={`ΔE00 ≤ ${CLOSE_MATCH_THRESHOLD}`} />
            <Stat label="Mean ΔE00" value={stats.meanDeltaE?.toFixed(2) ?? '—'} hint="vs. original" />
            <Stat label="Consistency" value={stats.spread != null ? `±${stats.spread.toFixed(1)}` : '—'} hint={consistencyLabel(stats.spread)} />
            <Stat label="Avg. accuracy rating" value={stats.averageRating != null ? <RatingStars value={stats.averageRating} className="text-base" /> : '—'} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
            <Card className="p-4">
              <h3 className="text-sm font-semibold">Where results landed</h3>
              <p className="mb-2 text-xs text-fg-muted">Distance from center is ΔE00; direction shows the shift in hue.</p>
              <ColorScatter original={recipe.resultHex} reproductions={reproductions} average={stats.averageHex} />
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-semibold">Original vs. community average</h3>
              <p className="mb-3 text-xs text-fg-muted">Drag the handle to compare.</p>
              <CompareSlider left={recipe.resultHex} right={stats.averageHex!} leftLabel="Original" rightLabel="Community avg." height={200} />
              <DeltaEMeter a={recipe.resultHex} b={stats.averageHex!} className="mt-3" />
            </Card>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">{plural(reproductions.length, 'reproduction')}</h3>
              {!isOwn && <ButtonLink to={`/r/${recipe.slug}/reproduce`} size="sm" variant="outline">✓ Add yours</ButtonLink>}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
              {shown.map((r) => (
                <li key={r.id}>
                  <ReproductionCard rep={r} original={recipe.resultHex} filamentsById={filamentsById} />
                </li>
              ))}
            </ul>
            {reproductions.length > 6 && (
              <div className="mt-4 text-center">
                <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>
                  {showAll ? 'Show fewer' : `Show all ${reproductions.length}`}
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function consistencyLabel(spread: number | null) {
  if (spread == null) return undefined
  if (spread <= 2) return 'Very consistent'
  if (spread <= 4) return 'Consistent'
  if (spread <= 7) return 'Some variation'
  return 'High variation'
}

function ReproductionCard({ rep, original, filamentsById }: { rep: ReproductionView; original: Hex; filamentsById: Record<ID, FilamentView> }) {
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex h-20">
        <div className="flex-1" style={{ background: original }} title={`Original ${original}`} />
        {rep.photos[0] ? (
          <img src={rep.photos[0].url} alt={rep.photos[0].alt} className="h-full w-2/3 object-cover" />
        ) : (
          <div className="color-transition w-2/3" style={{ background: rep.resultHex }} role="img" aria-label={`Reproduced color ${rep.resultHex}`} />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="flex items-center justify-between gap-2">
          <Link to={`/u/${rep.user.username}`} className="inline-flex min-w-0 items-center gap-2 text-sm font-medium hover:underline">
            <Avatar profile={rep.user} size="sm" />
            <span className="truncate">{rep.user.displayName}</span>
          </Link>
          <HexChip hex={rep.resultHex} size="xs" />
        </div>
        <DeltaEMeter a={original} b={rep.resultHex} />
        {rep.notes && <p className="text-sm text-fg-muted">“{rep.notes}”</p>}
        {rep.substitutions.length > 0 && (
          <ul className="space-y-1 text-xs text-fg-muted" role="list">
            {rep.substitutions.map((s, i) => {
              const orig = filamentsById[s.originalFilamentId]
              const used = s.usedFilamentId ? filamentsById[s.usedFilamentId] : undefined
              return (
                <li key={i} className="flex items-center gap-1.5">
                  <Replace className="size-3 shrink-0" aria-hidden />
                  <span>
                    {orig?.colorName ?? 'Filament'} → <b className="font-medium text-fg">{used ? `${used.manufacturer.name} ${used.colorName}` : s.usedLabel}</b>
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2 text-xs text-fg-subtle">
          <RatingStars value={rep.accuracyRating} />
          <span title={formatDate(rep.createdAt)}>{rep.printer ? `${rep.printer} · ` : ''}{timeAgo(rep.createdAt)}</span>
        </div>
      </div>
    </Card>
  )
}

/**
 * Polar plot: each reproduction sits at radius = ΔE00 from the original, in the
 * direction of its a*b* (hue/chroma) shift. Rings mark ΔE 2, 5 and 10.
 */
function ColorScatter({ original, reproductions, average }: { original: Hex; reproductions: ReproductionView[]; average: Hex | null }) {
  const size = 260
  const c = size / 2
  const maxDe = Math.max(12, ...reproductions.map((r) => r.deltaE)) * 1.08
  const scale = (c - 22) / maxDe
  const o = hexToLab(original)

  const pos = (hex: Hex, dE: number) => {
    const lab = hexToLab(hex)
    const da = lab.a - o.a
    const db = lab.b - o.b
    const len = Math.hypot(da, db)
    // Pure lightness shifts have no direction: place them straight up (lighter) or down (darker).
    const angle = len < 0.4 ? (lab.L >= o.L ? -Math.PI / 2 : Math.PI / 2) : Math.atan2(-db, da)
    return { x: c + Math.cos(angle) * dE * scale, y: c + Math.sin(angle) * dE * scale }
  }

  const points = useMemo(() => reproductions.map((r) => ({ r, ...pos(r.resultHex, r.deltaE) })), [reproductions]) // eslint-disable-line react-hooks/exhaustive-deps
  const avgPos = average ? pos(average, deltaE(average, original)) : null

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[300px]" role="img" aria-label={`Scatter of ${reproductions.length} reproductions around the original. ${reproductions.filter((r) => r.deltaE <= CLOSE_MATCH_THRESHOLD).length} fall inside the close-match ring.`}>
        {[10, 5, 2].map((d) => (
          <g key={d}>
            <circle cx={c} cy={c} r={d * scale} fill={d === 5 ? 'var(--accent-soft)' : 'none'} fillOpacity={d === 5 ? 0.6 : 0} stroke={d === 5 ? 'var(--accent)' : 'var(--border-strong)'} strokeDasharray={d === 5 ? undefined : '3 3'} strokeOpacity={d === 5 ? 0.5 : 1} />
            <text x={c + d * scale * 0.7071 + 3} y={c - d * scale * 0.7071 - 2} className="fill-fg-subtle text-[9px]">ΔE {d}</text>
          </g>
        ))}
        <line x1={c} y1={8} x2={c} y2={size - 8} stroke="var(--border)" />
        <line x1={8} y1={c} x2={size - 8} y2={c} stroke="var(--border)" />
        <text x={size - 6} y={c - 4} textAnchor="end" className="fill-fg-subtle text-[9px]">redder</text>
        <text x={6} y={c - 4} className="fill-fg-subtle text-[9px]">greener</text>
        <text x={c + 4} y={14} className="fill-fg-subtle text-[9px]">yellower</text>
        <text x={c + 4} y={size - 8} className="fill-fg-subtle text-[9px]">bluer</text>
        {points.map(({ r, x, y }) => (
          <circle key={r.id} cx={x} cy={y} r={6.5} fill={r.resultHex} stroke={isVeryLight(r.resultHex) ? 'var(--border-strong)' : 'var(--surface)'} strokeWidth={1.5}>
            <title>{`${r.user.displayName}: ${r.resultHex}, ΔE00 ${r.deltaE.toFixed(1)}`}</title>
          </circle>
        ))}
        {avgPos && (
          <g>
            <circle cx={avgPos.x} cy={avgPos.y} r={5} fill="none" stroke="var(--fg)" strokeWidth={1.5} strokeDasharray="2 2" />
            <title>Community average</title>
          </g>
        )}
        <circle cx={c} cy={c} r={10} fill={original} stroke="var(--fg)" strokeWidth={2} />
        <text x={c} y={c + 24} textAnchor="middle" className="fill-fg text-[10px] font-semibold">Original</text>
      </svg>
    </div>
  )
}
