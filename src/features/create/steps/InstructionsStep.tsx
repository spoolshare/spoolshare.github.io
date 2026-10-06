import { inputFractions } from '@/lib/recipe/composition'
import { formatPercent } from '@/lib/utils/format'
import { Field, Textarea } from '@/components/ui'
import { ColorDot } from '@/components/color/Swatch'
import { useWizard } from '../context'
import { StepIntro } from './StepIntro'

export function InstructionsStep() {
  const { state, dispatch, filaments } = useWizard()
  const d = state.draft
  return (
    <div className="space-y-6">
      <StepIntro
        title="Instructions"
        description="Write what someone needs to reproduce your color, and what tripped you up. Good instructions get more successful reproductions."
      />

      <Field
        label="General notes & tips"
        optional
        htmlFor="r-notes"
        hint="Plain text with light formatting: blank lines separate paragraphs, and lines starting with “- ” become bullets."
      >
        <Textarea
          id="r-notes"
          rows={6}
          value={d.notes ?? ''}
          onChange={(e) => dispatch({ type: 'patch', patch: { notes: e.target.value } })}
          placeholder={'- Dry all filament first (4 h at 50 °C)\n- Different white brands shift the result a lot\n- Judge the color in daylight, not under LEDs'}
        />
      </Field>

      <section aria-labelledby="stage-instr-title">
        <h3 id="stage-instr-title" className="mb-3 text-sm font-semibold">Per-stage instructions</h3>
        <ol className="relative space-y-4 border-l border-border pl-6">
          {d.stages.map((s, i) => {
            const fr = inputFractions(s.inputs)
            return (
              <li key={s.id} className="relative">
                <span className="absolute top-0 -left-[37px] grid size-6 place-items-center rounded-full bg-fg text-xs font-semibold text-bg tabular" aria-hidden>{i + 1}</span>
                <div className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-2 text-sm font-semibold">{s.name || `Stage ${i + 1}`} {s.outputName && <span className="font-normal text-fg-muted">→ {s.outputName}</span>}</div>
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {s.inputs.map((inp, k) => {
                      const label = inp.source.kind === 'filament'
                        ? filaments[inp.source.filamentId]?.colorName ?? 'Unselected'
                        : d.stages.find((x) => x.id === (inp.source as { stageId: string }).stageId)?.outputName || 'Intermediate'
                      const hex = inp.source.kind === 'filament' ? filaments[inp.source.filamentId]?.hex : undefined
                      return (
                        <span key={inp.id} className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface-2 px-2 text-xs">
                          {hex && <ColorDot hex={hex} size={10} />}
                          {label} <b className="font-mono font-medium">{formatPercent(fr[k], 1)}</b>
                        </span>
                      )
                    })}
                  </div>
                  <label htmlFor={`instr-${s.id}`} className="sr-only">Instructions for stage {i + 1}</label>
                  <Textarea
                    id={`instr-${s.id}`}
                    rows={3}
                    value={s.instructions}
                    onChange={(e) => dispatch({ type: 'patchStage', stageId: s.id, patch: { instructions: e.target.value } })}
                    placeholder="How to load, purge, and check this stage…"
                  />
                </div>
              </li>
            )
          })}
        </ol>
      </section>
    </div>
  )
}
