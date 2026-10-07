import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, Camera, Plus, Trash2, X } from 'lucide-react'
import type { FilamentView, ID, Stage, StageSource } from '@/types'
import { MIXER_RATIOS, formatRatio, inputFractions, parseRatio, simplestIntegerRatio, slotCounts, slotLayout, toPercentages } from '@/lib/recipe/composition'
import { SlotStrip } from '@/components/recipe/SlotStrip'
import { formatPercent } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { Button, Field, IconButton, Input, SegmentedControl, Select, Textarea, inputClass } from '@/components/ui'
import { ColorDot } from '@/components/color/Swatch'
import { FilamentPickerDialog } from '@/components/filament/FilamentPicker'
import { PhotoUploader } from '@/components/recipe/PhotoUploader'
import { predictStageHex } from './draft'
import { useWizard } from './context'

type RatioMode = 'ratio' | 'percent' | 'parts'

const encode = (s: StageSource) => (s.kind === 'filament' ? `f:${s.filamentId}` : `s:${s.stageId}`)
const decode = (v: string): StageSource => (v.startsWith('s:') ? { kind: 'stage', stageId: v.slice(2) } : { kind: 'filament', filamentId: v.slice(2) })

const round2 = (n: number) => Math.round(n * 100) / 100

export function StageEditor({
  stage,
  index,
  onMove,
  moveError,
}: {
  stage: Stage
  index: number
  onMove: (dir: -1 | 1) => void
  moveError?: string
}) {
  const { state, dispatch, filaments, rememberFilament } = useWizard()
  const stages = state.draft.stages
  const isFinal = index === stages.length - 1
  const earlier = stages.slice(0, index)
  const [mode, setMode] = useState<RatioMode>('ratio')
  const [pickerFor, setPickerFor] = useState<ID | 'new' | null>(null)
  const [showPhotos, setShowPhotos] = useState(stage.photos.length > 0)
  const fractions = inputFractions(stage.inputs)
  const ints = simplestIntegerRatio(stage.inputs.map((i) => i.parts), 24)
  const outputHex = predictStageHex(stages, stage.id, filaments)
  const patch = (p: Partial<Stage>) => dispatch({ type: 'patchStage', stageId: stage.id, patch: p })

  const switchMode = (m: RatioMode) => {
    if (m === 'percent' && stage.inputs.length) {
      dispatch({ type: 'setParts', stageId: stage.id, parts: toPercentages(stage.inputs.map((i) => i.parts)).map(round2) })
    } else if (m === 'parts' && ints) {
      dispatch({ type: 'setParts', stageId: stage.id, parts: ints })
    }
    setMode(m)
  }

  const percentTotal = stage.inputs.reduce((s, i) => s + (i.parts > 0 ? i.parts : 0), 0)
  const sourceHex = (src: StageSource) =>
    src.kind === 'filament' ? filaments[src.filamentId]?.hex : predictStageHex(stages, src.stageId, filaments) ?? undefined
  const sourceName = (src: StageSource) =>
    src.kind === 'filament'
      ? filaments[src.filamentId]?.colorName ?? 'Filament'
      : (() => { const i = stages.findIndex((x) => x.id === src.stageId); return stages[i]?.outputName || `Stage ${i + 1} output` })()
  const partsList = stage.inputs.map((i) => i.parts)
  const slots = slotCounts(partsList)
  const layout = slotLayout(partsList)
  const usedFilamentIds = stage.inputs.filter((i) => i.source.kind === 'filament').map((i) => (i.source as { filamentId: ID }).filamentId)
  const nextFilament = state.palette.find((id) => !usedFilamentIds.includes(id))

  const titleId = `stage-${stage.id}-title`

  return (
    <section aria-labelledby={titleId} className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm animate-pop">
      <header className="flex items-center gap-3 border-b border-border bg-surface-2/60 px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-fg text-sm font-semibold text-bg tabular" aria-hidden>{index + 1}</span>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="truncate text-sm font-semibold">
            Stage {index + 1}{stage.name ? ` · ${stage.name}` : ''}
          </h3>
          <p className="text-xs text-fg-muted">{isFinal ? 'Final stage: produces the finished color' : 'Produces an intermediate used later'}</p>
        </div>
        {outputHex && <ColorDot hex={outputHex} size={22} label={`Calculated output color ${outputHex}`} />}
        <div className="flex items-center">
          <IconButton label={`Move stage ${index + 1} up`} size="sm" disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="size-4" /></IconButton>
          <IconButton label={`Move stage ${index + 1} down`} size="sm" disabled={isFinal} onClick={() => onMove(1)}><ArrowDown className="size-4" /></IconButton>
          <IconButton
            label={`Delete stage ${index + 1}`}
            size="sm"
            disabled={stages.length === 1}
            onClick={() => dispatch({ type: 'removeStage', stageId: stage.id })}
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      </header>
      {moveError && <p role="alert" className="border-b border-border bg-danger-soft px-4 py-2 text-xs text-danger">{moveError}</p>}

      <div className="space-y-5 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Stage name" htmlFor={`${stage.id}-name`}>
            <Input id={`${stage.id}-name`} value={stage.name} onChange={(e) => patch({ name: e.target.value })} placeholder={isFinal ? 'Create Purple' : 'Create Light Blue'} />
          </Field>
          <Field label={isFinal ? 'Output (final color name)' : 'Output (intermediate name)'} htmlFor={`${stage.id}-out`}>
            <Input
              id={`${stage.id}-out`}
              value={stage.outputName}
              onChange={(e) => patch({ outputName: e.target.value })}
              placeholder={isFinal ? state.draft.name || 'Final Purple' : 'Light Blue Intermediate'}
            />
          </Field>
        </div>

        {/* inputs */}
        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-medium">Inputs &amp; ratio</h4>
            <SegmentedControl
              label={`Ratio entry mode for stage ${index + 1}`}
              size="sm"
              value={mode}
              onChange={switchMode}
              options={[
                { value: 'ratio', label: 'Ratio 3:1' },
                { value: 'percent', label: 'Percent' },
                { value: 'parts', label: 'Parts' },
              ]}
            />
          </div>

          {mode === 'ratio' && stage.inputs.length > 0 && <RatioText stage={stage} />}

          {stage.inputs.length >= 2 && stage.inputs.length <= 4 && (
            <div className="mb-3 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-fg-muted">Mixer ratios:</span>
              {MIXER_RATIOS.filter((r) => r.parts.length === stage.inputs.length).map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => dispatch({ type: 'setParts', stageId: stage.id, parts: r.parts })}
                  className="h-7 rounded-full border border-border bg-surface px-2.5 font-mono text-xs font-medium hover:border-border-strong"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}

          <ul className="space-y-2" role="list">
            {stage.inputs.map((inp, k) => {
              const hex = sourceHex(inp.source)
              const value = encode(inp.source)
              const missing = inp.source.kind === 'filament' && !inp.source.filamentId
              return (
                <li key={inp.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-bg/50 p-2 sm:flex-nowrap">
                  {hex ? <ColorDot hex={hex} size={26} /> : <span className="size-[26px] shrink-0 rounded-full border border-dashed border-border-strong" aria-hidden />}
                  <label className="sr-only" htmlFor={`${inp.id}-src`}>Input {k + 1} source</label>
                  <Select
                    id={`${inp.id}-src`}
                    value={missing ? '' : value}
                    aria-invalid={missing}
                    onChange={(e) => {
                      if (e.target.value === '__add__') setPickerFor(inp.id)
                      else if (e.target.value) dispatch({ type: 'patchInput', stageId: stage.id, inputId: inp.id, patch: { source: decode(e.target.value) } })
                    }}
                    className="min-w-0 flex-1 basis-48"
                  >
                    {missing && <option value="">Select a filament…</option>}
                    <optgroup label="Ingredients">
                      {state.palette.map((id) => (
                        <option key={id} value={`f:${id}`}>{filamentOptionLabel(filaments[id])}</option>
                      ))}
                      {inp.source.kind === 'filament' && inp.source.filamentId && !state.palette.includes(inp.source.filamentId) && (
                        <option value={value}>{filamentOptionLabel(filaments[inp.source.filamentId])}</option>
                      )}
                    </optgroup>
                    {earlier.length > 0 && (
                      <optgroup label="Intermediates from earlier stages">
                        {earlier.map((s, si) => (
                          <option key={s.id} value={`s:${s.id}`}>{s.outputName || s.name || `Stage ${si + 1} output`} (Stage {si + 1})</option>
                        ))}
                      </optgroup>
                    )}
                    <option value="__add__">+ Add a filament from the catalog…</option>
                  </Select>

                  {mode !== 'ratio' && (
                    <div className="relative w-24 shrink-0">
                      <label className="sr-only" htmlFor={`${inp.id}-parts`}>Input {k + 1} {mode === 'percent' ? 'percent' : 'parts'}</label>
                      <input
                        id={`${inp.id}-parts`}
                        type="number"
                        min={0}
                        step={mode === 'percent' ? 0.25 : 0.5}
                        value={Number.isFinite(inp.parts) ? inp.parts : ''}
                        aria-invalid={!(inp.parts > 0)}
                        onChange={(e) => dispatch({ type: 'patchInput', stageId: stage.id, inputId: inp.id, patch: { parts: e.target.value === '' ? 0 : Number(e.target.value) } })}
                        className={cn(inputClass, 'h-10 pr-12 font-mono tabular')}
                      />
                      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-fg-subtle">{mode === 'percent' ? '%' : 'parts'}</span>
                    </div>
                  )}

                  <span className="w-28 shrink-0 text-right text-xs text-fg-muted tabular" aria-label={`Share ${formatPercent(fractions[k])}`}>
                    <span className="font-mono text-sm font-semibold text-fg">{formatPercent(fractions[k], 2)}</span>
                    {slots ? <span className="block">{slots[k]} of 4 slots</span> : ints && <span className="block">{ints[k]} {ints[k] === 1 ? 'part' : 'parts'}</span>}
                  </span>
                  <IconButton label={`Remove input ${k + 1}`} size="sm" onClick={() => dispatch({ type: 'removeInput', stageId: stage.id, inputId: inp.id })}>
                    <X className="size-4" />
                  </IconButton>
                </li>
              )
            })}
          </ul>

          {layout && stage.inputs.every((i) => i.source.kind === 'stage' || i.source.filamentId) && (
            <div className="mt-3">
              <div className="mb-1.5 text-xs font-medium text-fg-muted">Mixer slots</div>
              <SlotStrip size="sm" slots={layout.map((k) => ({ name: sourceName(stage.inputs[k].source), hex: sourceHex(stage.inputs[k].source) ?? '#BBBBBB' }))} />
            </div>
          )}
          {!layout && stage.inputs.length > 0 && stage.inputs.every((i) => i.parts > 0) && (
            <p className="mt-3 text-xs text-warn" role="status">This ratio doesn’t fit the mixer’s 4 slots. Try 1:1, 3:1, 2:1:1 or 1:1:1:1, or split it across two stages.</p>
          )}

          {stage.inputs.length === 0 && (
            <p className="rounded-xl border border-dashed border-border-strong p-4 text-center text-sm text-fg-muted">
              No inputs yet. Add the filaments (or earlier intermediates) that go into this stage.
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<Plus className="size-4" />}
              onClick={() =>
                nextFilament
                  ? dispatch({ type: 'addInput', stageId: stage.id, source: { kind: 'filament', filamentId: nextFilament }, parts: mode === 'percent' ? Math.max(0, round2(100 - percentTotal)) || 25 : 1 })
                  : setPickerFor('new')
              }
            >
              Add input
            </Button>
            <div className="text-xs text-fg-muted" aria-live="polite">
              {mode === 'percent' && stage.inputs.length > 0 && Math.abs(percentTotal - 100) > 0.01 ? (
                <span className="inline-flex items-center gap-2">
                  <span className={percentTotal > 100 ? 'text-danger' : 'text-warn'}>
                    Total {round2(percentTotal)}% · {percentTotal > 100 ? `${round2(percentTotal - 100)}% over` : `${round2(100 - percentTotal)}% unassigned`}
                  </span>
                  <button
                    type="button"
                    className="font-medium text-accent hover:underline"
                    onClick={() => dispatch({ type: 'setParts', stageId: stage.id, parts: toPercentages(stage.inputs.map((i) => i.parts)).map(round2) })}
                  >
                    Normalize to 100%
                  </button>
                </span>
              ) : stage.inputs.length > 1 ? (
                <>Simplest ratio <b className="font-mono text-fg">{formatRatio(stage.inputs.map((i) => i.parts))}</b></>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <Field label="Batch made" optional htmlFor={`${stage.id}-batch`} hint="Grams you produced">
            <div className="relative">
              <Input
                id={`${stage.id}-batch`}
                type="number"
                min={0}
                step={0.5}
                value={stage.batchGrams ?? ''}
                onChange={(e) => patch({ batchGrams: e.target.value === '' ? undefined : Math.max(0, Number(e.target.value)) })}
                className="pr-8 font-mono"
              />
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-fg-subtle">g</span>
            </div>
          </Field>
          <Field label="Instructions" htmlFor={`${stage.id}-instr`} hint="Purge length, temperatures, how you judged it was mixed…">
            <Textarea
              id={`${stage.id}-instr`}
              rows={3}
              value={stage.instructions}
              onChange={(e) => patch({ instructions: e.target.value })}
              placeholder="Cut equal-length strands and feed 3 white : 1 blue. Purge until the extrudate has no streaks."
            />
          </Field>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowPhotos((v) => !v)}
            aria-expanded={showPhotos}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
          >
            <Camera className="size-4" aria-hidden />
            {showPhotos ? 'Hide stage photos' : `Stage photos${stage.photos.length ? ` (${stage.photos.length})` : ' (optional)'}`}
          </button>
          {showPhotos && (
            <PhotoUploader
              className="mt-3"
              photos={stage.photos}
              max={3}
              defaultAlt={`${stage.outputName || stage.name || `Stage ${index + 1}`} in progress`}
              onChange={(photos) => patch({ photos })}
            />
          )}
        </div>
      </div>

      <FilamentPickerDialog
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        title={`Add an input to stage ${index + 1}`}
        onSelect={(f) => {
          rememberFilament(f)
          const source = { kind: 'filament' as const, filamentId: f.id }
          if (pickerFor === 'new') dispatch({ type: 'addInput', stageId: stage.id, source })
          else if (pickerFor) dispatch({ type: 'patchInput', stageId: stage.id, inputId: pickerFor, patch: { source } })
        }}
      />
    </section>
  )
}

function filamentOptionLabel(f?: FilamentView) {
  return f ? `${f.colorName} · ${f.manufacturer.name} ${f.productLine.name}` : 'Loading…'
}

/** Free-text ratio entry: "3:1", "2:1:1", "75/25", "50% 25% 25%". */
function RatioText({ stage }: { stage: Stage }) {
  const { dispatch } = useWizard()
  const current = formatRatio(stage.inputs.map((i) => i.parts))
  const [text, setText] = useState(current)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => setText(current), [current])
  const n = stage.inputs.length

  const commit = () => {
    const parsed = parseRatio(text)
    if (!parsed) return setError('Enter positive numbers separated by colons, e.g. 2:1:1.')
    if (parsed.length !== n) return setError(`This stage has ${n} input${n === 1 ? '' : 's'}. Enter ${n} number${n === 1 ? '' : 's'}.`)
    setError(null)
    dispatch({ type: 'setParts', stageId: stage.id, parts: parsed })
  }

  return (
    <div className="mb-3">
      <label htmlFor={`${stage.id}-ratio`} className="mb-1 block text-xs font-medium text-fg-muted">
        Ratio in input order ({n} {n === 1 ? 'number' : 'numbers'}). Accepts 3:1, 2:1:1, 75/25 or 50% 25% 25%.
      </label>
      <input
        id={`${stage.id}-ratio`}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const p = parseRatio(e.target.value)
          if (p && p.length === n) {
            setError(null)
            dispatch({ type: 'setParts', stageId: stage.id, parts: p })
          }
        }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), commit())}
        aria-invalid={!!error}
        spellCheck={false}
        className={cn(inputClass, 'h-10 max-w-xs font-mono text-base tracking-wider')}
      />
      {error && <p role="alert" className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}
