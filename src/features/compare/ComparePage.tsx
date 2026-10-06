import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Columns2, Plus, X } from 'lucide-react'
import type { ID } from '@/types'
import { api, type RecipeHit } from '@/lib/api'
import { useQuery } from '@/lib/hooks/useQuery'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { useInventory } from '@/lib/hooks/useInventory'
import { useCompareTray } from '@/lib/hooks/usePreferences'
import { checkCanMake } from '@/lib/recipe/canMake'
import { deltaE, deltaBand, DELTA_BAND_LABEL } from '@/lib/color/deltaE'
import { readableOn } from '@/lib/color/convert'
import { cn } from '@/lib/utils/cn'
import { HexChip, SwatchVisual } from '@/components/color/Swatch'
import { CompareSlider, DeltaEMeter } from '@/components/color/Compare'
import { CompositionBar } from '@/components/recipe/CompositionBar'
import { CanMakeLine, DifficultyMeter, TrustBadge } from '@/components/recipe/badges'
import { ColorDot } from '@/components/color/Swatch'
import { EmptyState, IconButton, PageHeader, SearchInput, Select, Skeleton, Card } from '@/components/ui'

export default function ComparePage() {
  const [params, setParams] = useSearchParams()
  const tray = useCompareTray()
  const inv = useInventory()
  const ids = useMemo(() => {
    const p = params.get('ids')
    return (p ? p.split(',') : tray.ids).filter(Boolean).slice(0, 4)
  }, [params, tray.ids])

  const setIds = (next: ID[]) => {
    setParams(next.length ? { ids: next.join(',') } : {}, { replace: true })
    // keep the floating tray in sync
    tray.clear()
    next.forEach((id) => tray.toggle(id))
  }

  const { data, loading } = useQuery(ids.length ? `recipes:compare-page:${ids.join(',')}` : null, () => api.searchRecipes({ ids, limit: 4 }), ['favorites'])
  const hits = useMemo(() => {
    const byId = new Map((data?.items ?? []).map((h) => [h.recipe.id, h]))
    return ids.map((id) => byId.get(id)).filter((h): h is RecipeHit => !!h)
  }, [data, ids])

  const [leftId, setLeftId] = useState<ID>('')
  const [rightId, setRightId] = useState<ID>('')
  useEffect(() => {
    if (hits.length >= 2) {
      if (!hits.some((h) => h.recipe.id === leftId)) setLeftId(hits[0].recipe.id)
      if (!hits.some((h) => h.recipe.id === rightId) || rightId === leftId) setRightId(hits.find((h) => h.recipe.id !== (hits.some((x) => x.recipe.id === leftId) ? leftId : hits[0].recipe.id))!.recipe.id)
    }
  }, [hits]) // eslint-disable-line react-hooks/exhaustive-deps

  const left = hits.find((h) => h.recipe.id === leftId)
  const right = hits.find((h) => h.recipe.id === rightId)

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Compare" title="Side-by-side colors" description="Compare up to four recipes: measured color, ΔE00 between each pair, ingredients, and reliability." />

      <AddRecipe ids={ids} onAdd={(id) => setIds([...ids, id].slice(0, 4))} />

      {ids.length < 2 && !loading && (
        <EmptyState
          className="mt-6"
          icon={<Columns2 className="size-5" />}
          title={ids.length === 0 ? 'Nothing to compare yet' : 'Add one more recipe'}
          description="Search above, or tap the compare icon on any recipe card to collect recipes here."
          action={<Link to="/search" className="text-sm font-medium text-accent hover:underline">Browse recipes</Link>}
        />
      )}

      {loading && !data && ids.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{ids.map((id) => <Skeleton key={id} className="aspect-[3/4] rounded-2xl" />)}</div>
      )}

      {hits.length > 0 && (
        <>
          {/* columns */}
          <div className="mt-6 snap-x overflow-x-auto pb-2">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${hits.length}, minmax(250px, 1fr))` }}>
              {hits.map((h) => {
                const cm = inv.signedIn ? checkCanMake(h.composition, new Map(h.filaments.map((f) => [f.id, f])), inv.ownedIds, inv.ownedFilaments) : null
                return (
                  <Card key={h.recipe.id} className="flex snap-start flex-col overflow-hidden">
                    <div className="relative">
                      <SwatchVisual hex={h.recipe.resultHex} photo={h.recipe.photos[0]} finish={h.recipe.finish} className="aspect-[4/3] w-full" rounded="" label={`${h.recipe.name}, ${h.recipe.resultHex}`} />
                      <IconButton label={`Remove ${h.recipe.name}`} size="sm" variant="outline" className="absolute top-2 right-2 bg-white/90! text-neutral-700!" onClick={() => setIds(ids.filter((x) => x !== h.recipe.id))}>
                        <X className="size-4" />
                      </IconButton>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <div>
                        <Link to={`/r/${h.recipe.slug}`} className="text-base font-semibold tracking-tight hover:underline">{h.recipe.name}</Link>
                        <div className="text-xs text-fg-muted">by {h.author.displayName}</div>
                      </div>
                      <HexChip hex={h.recipe.resultHex} size="sm" className="self-start" />
                      <TrustBadge level={h.trust} size="xs" className="self-start" />
                      <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
                        <dt className="text-fg-muted">Stages</dt><dd className="text-right font-medium tabular">{h.recipe.stages.length}</dd>
                        <dt className="text-fg-muted">Difficulty</dt><dd className="text-right"><DifficultyMeter difficulty={h.difficulty} /></dd>
                        <dt className="text-fg-muted">Material</dt><dd className="text-right font-medium">{h.recipe.material}</dd>
                        <dt className="text-fg-muted">Reproductions</dt><dd className="text-right font-medium tabular">{h.stats.closeCount}/{h.stats.count} close</dd>
                        <dt className="text-fg-muted">Mean ΔE00</dt><dd className="text-right font-mono text-xs tabular">{h.stats.meanDeltaE?.toFixed(2) ?? '—'}</dd>
                      </dl>
                      <CompositionBar composition={h.composition} filamentsById={new Map(h.filaments.map((f) => [f.id, f]))} owned={inv.signedIn ? inv.ownedIds : undefined} />
                      {cm && <div className="mt-auto border-t border-border pt-3"><CanMakeLine result={cm} signedIn={inv.signedIn} /></div>}
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          {hits.length >= 2 && (
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <Card className="min-w-0 p-5">
                <h2 className="text-base font-semibold">Slide to compare</h2>
                <div className="mt-3 mb-4 flex flex-wrap items-center gap-2">
                  <Select aria-label="Left recipe" value={leftId} onChange={(e) => setLeftId(e.target.value)} className="min-w-36 flex-1">
                    {hits.map((h) => <option key={h.recipe.id} value={h.recipe.id}>{h.recipe.name}</option>)}
                  </Select>
                  <span className="text-xs text-fg-subtle">vs</span>
                  <Select aria-label="Right recipe" value={rightId} onChange={(e) => setRightId(e.target.value)} className="min-w-36 flex-1">
                    {hits.map((h) => <option key={h.recipe.id} value={h.recipe.id}>{h.recipe.name}</option>)}
                  </Select>
                </div>
                {left && right && (
                  <>
                    <CompareSlider left={left.recipe.resultHex} right={right.recipe.resultHex} leftLabel={left.recipe.name} rightLabel={right.recipe.name} height={240} />
                    <DeltaEMeter a={left.recipe.resultHex} b={right.recipe.resultHex} className="mt-4" />
                  </>
                )}
              </Card>

              <Card className="min-w-0 p-5">
                <h2 className="text-base font-semibold">ΔE00 between each pair</h2>
                <p className="mb-4 text-xs text-fg-muted">≤ 2 near-identical · ≤ 5 close · ≤ 10 noticeable · &gt; 10 different</p>
                <div className="overflow-x-auto">
                  <table className="w-full border-separate border-spacing-1 text-sm">
                    <caption className="sr-only">Pairwise color difference matrix</caption>
                    <thead>
                      <tr>
                        <th scope="col" className="sr-only">Recipe</th>
                        {hits.map((h) => (
                          <th key={h.recipe.id} scope="col" className="p-1 text-center">
                            <span className="inline-flex flex-col items-center gap-1">
                              <ColorDot hex={h.recipe.resultHex} size={22} />
                              <span className="max-w-20 truncate text-[11px] font-medium text-fg-muted">{h.recipe.name}</span>
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {hits.map((a) => (
                        <tr key={a.recipe.id}>
                          <th scope="row" className="p-1 text-left">
                            <span className="inline-flex items-center gap-2">
                              <ColorDot hex={a.recipe.resultHex} size={18} />
                              <span className="max-w-28 truncate text-xs font-medium">{a.recipe.name}</span>
                            </span>
                          </th>
                          {hits.map((b) => {
                            if (a === b) return <td key={b.recipe.id} className="rounded-md bg-surface-2 p-2 text-center text-fg-subtle">—</td>
                            const d = deltaE(a.recipe.resultHex, b.recipe.resultHex)
                            const band = deltaBand(d)
                            return (
                              <td key={b.recipe.id} title={DELTA_BAND_LABEL[band]} className={cn(
                                'rounded-md p-2 text-center font-mono text-xs font-medium tabular',
                                band === 'identical' || band === 'close' ? 'bg-accent-soft text-accent-soft-fg' : band === 'noticeable' ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-fg-muted',
                              )}>
                                {d.toFixed(1)}
                                <span className="sr-only"> ({DELTA_BAND_LABEL[band]})</span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-5 flex h-16 overflow-hidden rounded-lg border border-border" aria-hidden>
                  {hits.map((h) => (
                    <div key={h.recipe.id} className="flex flex-1 items-end p-1.5 font-mono text-[10px]" style={{ background: h.recipe.resultHex, color: readableOn(h.recipe.resultHex) }}>{h.recipe.resultHex}</div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AddRecipe({ ids, onAdd }: { ids: ID[]; onAdd: (id: ID) => void }) {
  const [text, setText] = useState('')
  const { data } = useRecipeSearch(text.trim().length >= 2 ? { text: text.trim(), limit: 6 } : null)
  const full = ids.length >= 4
  return (
    <div className="relative max-w-xl">
      <SearchInput value={text} onChange={setText} placeholder={full ? 'Comparing the maximum of 4 recipes' : 'Add a recipe: search by name, color, or creator…'} disabled={full} label="Add recipe to comparison" />
      {text.trim().length >= 2 && !full && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-border bg-surface shadow-lg" role="listbox">
          {data?.items.length === 0 && <li className="px-3 py-3 text-sm text-fg-muted">No recipes match.</li>}
          {data?.items.map((h) => {
            const added = ids.includes(h.recipe.id)
            return (
              <li key={h.recipe.id} role="option" aria-selected={added}>
                <button
                  type="button"
                  disabled={added}
                  onClick={() => { onAdd(h.recipe.id); setText('') }}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-surface-2 disabled:opacity-50"
                >
                  <ColorDot hex={h.recipe.resultHex} size={22} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{h.recipe.name}</span>
                    <span className="block text-xs text-fg-muted">{h.author.displayName} · <span className="font-mono">{h.recipe.resultHex}</span></span>
                  </span>
                  {added ? <span className="text-xs text-fg-subtle">Added</span> : <Plus className="size-4 text-fg-subtle" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
