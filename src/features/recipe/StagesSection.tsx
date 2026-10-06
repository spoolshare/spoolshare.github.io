import { Calculator, CornerDownRight } from 'lucide-react'
import type { FilamentView, Hex, ID, Stage } from '@/types'
import { cn } from '@/lib/utils/cn'
import { formatGrams, formatPercent } from '@/lib/utils/format'
import { formatRatio, type Plan } from '@/lib/recipe/composition'
import { ColorDot } from '@/components/color/Swatch'
import { StageFlow } from '@/components/recipe/StageFlow'
import { Badge, Card } from '@/components/ui'
import { describeInput, stageColor } from './shared'

export function StagesSection({
  stages,
  filamentsById,
  finalHex,
  plan,
  owned,
}: {
  stages: Stage[]
  filamentsById: Record<ID, FilamentView>
  finalHex: Hex
  plan: Plan
  owned?: Set<ID>
}) {
  return (
    <div className="space-y-6">
      {stages.length > 1 && (
        <Card className="p-4 sm:p-5">
          <h3 className="mb-3 text-sm font-semibold">Flow</h3>
          <StageFlow stages={stages} filamentsById={filamentsById} finalHex={finalHex} />
        </Card>
      )}

      <ol className="relative space-y-4" role="list">
        {plan.stages.map((ps, i) => {
          const s = ps.stage
          const final = ps.isFinal
          const out = final ? { hex: finalHex, predicted: false } : stageColor(stages, s, filamentsById)
          const consumers = ps.consumedBy.map((id) => stages.findIndex((x) => x.id === id) + 1)
          return (
            <li key={s.id} className="relative pl-10 sm:pl-12">
              {/* timeline rail */}
              {i < stages.length - 1 && <span aria-hidden className="absolute top-10 bottom-[-1rem] left-[15px] w-0.5 bg-border sm:left-[19px]" />}
              <span
                aria-hidden
                className={cn(
                  'absolute top-3 left-0 grid size-8 place-items-center rounded-full text-sm font-semibold sm:size-10',
                  final ? 'bg-accent text-accent-fg' : 'border border-border-strong bg-surface text-fg',
                )}
              >
                {i + 1}
              </span>
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
                  <div className="min-w-0">
                    <div className="text-xs font-semibold tracking-wide text-fg-subtle uppercase">Stage {i + 1}{final && ' · Final'}</div>
                    <h3 className="mt-0.5 text-base font-semibold tracking-tight">{s.name || `Stage ${i + 1}`}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
                      <span>Ratio <b className="font-mono font-medium text-fg">{formatRatio(s.inputs.map((x) => x.parts))}</b></span>
                      <span>Make <b className="font-mono font-medium text-fg">{formatGrams(ps.grams)}</b></span>
                      {s.batchGrams != null && <span>Creator made {formatGrams(s.batchGrams)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-sm font-medium">{s.outputName}</div>
                      <div className="flex items-center justify-end gap-1 font-mono text-[11px] text-fg-muted">
                        {out.predicted && <Calculator className="size-3 text-calc" aria-label="Calculated preview" />}
                        {out.hex}
                      </div>
                    </div>
                    <span
                      className={cn('size-11 shrink-0 rounded-full border border-border', out.predicted && 'outline-2 outline-offset-2 outline-dashed outline-calc')}
                      style={{ background: out.hex }}
                      role="img"
                      aria-label={`${out.predicted ? 'Calculated preview' : 'Measured'} color of ${s.outputName}: ${out.hex}`}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm sm:table-fixed">
                    <colgroup><col /><col className="sm:w-20" /><col className="hidden sm:table-column sm:w-24" /><col className="sm:w-24" /></colgroup>
                    <caption className="sr-only">Inputs for stage {i + 1}</caption>
                    <thead>
                      <tr className="text-left text-xs text-fg-subtle">
                        <th scope="col" className="pl-4 pr-2 pt-3 pb-1 font-medium">Input</th>
                        <th scope="col" className="px-2 pt-3 pb-1 text-right font-medium">Share</th>
                        <th scope="col" className="hidden px-2 pt-3 pb-1 text-right font-medium sm:table-cell">Load units</th>
                        <th scope="col" className="px-4 pt-3 pb-1 text-right font-medium">Weight</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ps.inputs.map((pi) => {
                        const d = describeInput(pi.input, stages, filamentsById)
                        const isOwned = d.filament && owned ? owned.has(d.filament.id) : undefined
                        return (
                          <tr key={pi.input.id} className="border-t border-border/60 first:border-t-0">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2.5">
                                <ColorDot hex={d.hex} size={16} />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 font-medium">
                                    {d.stageIndex != null && <CornerDownRight className="size-3.5 text-fg-subtle" aria-hidden />}
                                    {d.name}
                                    {isOwned === false && <Badge tone="warn" size="xs">Missing</Badge>}
                                  </div>
                                  <div className="truncate text-xs text-fg-muted">{d.detail}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-2 py-2 text-right font-mono text-xs tabular">
                              {formatPercent(pi.fraction)}
                              {pi.units != null && <span className="block text-fg-subtle sm:hidden">{pi.units}×</span>}
                            </td>
                            <td className="hidden px-2 py-2 text-right font-mono text-xs text-fg-muted tabular sm:table-cell">{pi.units != null ? `${pi.units}×` : '—'}</td>
                            <td className="px-4 py-2 text-right font-mono text-xs font-medium tabular">{formatGrams(pi.grams)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {(s.instructions || consumers.length > 0) && (
                  <div className="space-y-2 border-t border-border bg-surface-2/50 p-4 text-sm">
                    {s.instructions && <p className="leading-relaxed whitespace-pre-line">{s.instructions}</p>}
                    {consumers.length > 0 && (
                      <p className="text-xs text-fg-muted">
                        Set aside: this intermediate is used in {consumers.map((c) => `Stage ${c}`).join(' and ')}.
                        {out.predicted && ' Its color shown here is a calculated preview.'}
                      </p>
                    )}
                  </div>
                )}

                {s.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto border-t border-border p-3">
                    {s.photos.map((p) => <img key={p.id} src={p.url} alt={p.alt} className="h-24 rounded-lg object-cover" />)}
                  </div>
                )}
              </Card>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
