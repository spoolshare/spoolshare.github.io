import type { FilamentView, Hex, ID, Stage, StageInput } from '@/types'
import { cn } from '@/lib/utils/cn'
import { flattenComposition } from '@/lib/recipe/composition'
import { predictMix } from '@/lib/color/mixing'
import { inputClass } from '@/components/ui'

export const BATCH_PRESETS = [10, 25, 50, 100, 250]

/** "Make __ g" control with presets + waste/purge allowance. */
export function BatchControls({
  grams,
  onGrams,
  waste,
  onWaste,
  className,
  size = 'md',
}: {
  grams: number
  onGrams: (g: number) => void
  waste: number
  onWaste: (w: number) => void
  className?: string
  size?: 'md' | 'lg'
}) {
  return (
    <div className={cn('flex flex-wrap items-end gap-x-4 gap-y-3', className)}>
      <div>
        <label htmlFor="batch-grams" className="mb-1.5 block text-xs font-medium text-fg-subtle">Make</label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              id="batch-grams"
              type="number"
              min={1}
              max={10000}
              step="any"
              value={grams}
              onChange={(e) => onGrams(Math.max(0, Number(e.target.value) || 0))}
              className={cn(inputClass, 'pr-7 font-mono tabular', size === 'lg' ? 'h-12 w-28 text-lg' : 'h-9 w-24')}
            />
            <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-fg-subtle">g</span>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Batch size presets">
            {BATCH_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onGrams(p)}
                aria-pressed={grams === p}
                className={cn(
                  'rounded-md border px-2 font-mono text-xs font-medium tabular transition-colors',
                  size === 'lg' ? 'h-12 min-w-12' : 'h-9 min-w-10',
                  grams === p ? 'border-fg bg-fg text-bg' : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="batch-waste" className="mb-1.5 block text-xs font-medium text-fg-subtle">Purge / waste allowance</label>
        <div className="relative">
          <input
            id="batch-waste"
            type="number"
            min={0}
            max={100}
            value={waste}
            onChange={(e) => onWaste(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
            className={cn(inputClass, 'pr-7 font-mono tabular', size === 'lg' ? 'h-12 w-24 text-lg' : 'h-9 w-20')}
          />
          <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-sm text-fg-subtle">%</span>
        </div>
      </div>
    </div>
  )
}

type ById = Record<ID, FilamentView> | Map<ID, FilamentView>
const getF = (byId: ById, id: ID) => (byId instanceof Map ? byId.get(id) : byId[id])

/** Display name + color for one stage input (filament or earlier intermediate). */
export function describeInput(input: StageInput, stages: Stage[], byId: ById): { name: string; detail: string; hex: Hex; filament?: FilamentView; stageIndex?: number } {
  if (input.source.kind === 'filament') {
    const f = getF(byId, input.source.filamentId)
    return {
      name: f?.colorName ?? 'Unknown filament',
      detail: f ? `${f.manufacturer.name} ${f.productLine.name}` : '',
      hex: f?.hex ?? '#999999',
      filament: f,
    }
  }
  const stageId = input.source.stageId
  const idx = stages.findIndex((s) => s.id === stageId)
  const s = stages[idx]
  return {
    name: s?.outputName || s?.name || 'Intermediate',
    detail: `From Stage ${idx + 1}`,
    hex: s ? stageColor(stages, s, byId).hex : '#999999',
    stageIndex: idx,
  }
}

/** Measured output color if provided, else a calculated (untested) prediction. */
export function stageColor(stages: Stage[], stage: Stage, byId: ById): { hex: Hex; predicted: boolean } {
  if (stage.outputHex) return { hex: stage.outputHex, predicted: false }
  try {
    const comp = flattenComposition(stages, stage.id)
    return {
      hex: predictMix(comp.map((c) => ({ hex: getF(byId, c.filamentId)?.hex ?? '#888888', weight: c.fraction, filament: getF(byId, c.filamentId) }))),
      predicted: true,
    }
  } catch {
    return { hex: '#888888', predicted: true }
  }
}

export function RatingStars({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value)
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs text-fg-muted', className)} aria-label={`Accuracy rating ${value.toFixed(1)} out of 5`}>
      <span aria-hidden className="tracking-tight text-amber-500">
        {'★'.repeat(rounded)}
        <span className="text-surface-3">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span className="tabular">{value.toFixed(value % 1 === 0 ? 0 : 1)}/5</span>
    </span>
  )
}
