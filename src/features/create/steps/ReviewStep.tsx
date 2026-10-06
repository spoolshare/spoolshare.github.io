import { AlertCircle, AlertTriangle, CheckCircle2, Pencil } from 'lucide-react'
import { recipeDifficulty } from '@/lib/recipe/trust'
import { inputFractions } from '@/lib/recipe/composition'
import { formatPercent } from '@/lib/utils/format'
import { useSession } from '@/lib/hooks/useSession'
import { useInventory } from '@/lib/hooks/useInventory'
import { Avatar, Badge, Card } from '@/components/ui'
import { ColorDot, HexChip, SwatchVisual } from '@/components/color/Swatch'
import { StageFlow } from '@/components/recipe/StageFlow'
import { CompositionBar } from '@/components/recipe/CompositionBar'
import { DifficultyMeter, TrustBadge } from '@/components/recipe/badges'
import { nearestColorName } from '@/lib/color/names'
import { safeComposition } from '../draft'
import { useWizard } from '../context'
import { checkStep, STEPS } from '../validation'
import { StepIntro } from './StepIntro'

/** A faithful preview of the published recipe page, plus a checklist. */
export function ReviewStep() {
  const { state, filaments, goTo } = useWizard()
  const { user } = useSession()
  const inv = useInventory()
  const d = state.draft
  const comp = safeComposition(d.stages).filter((c) => filaments[c.filamentId])
  const checks = STEPS.slice(0, 6).map((s, i) => ({ step: s, index: i, ...checkStep(i, state) }))

  return (
    <div className="space-y-6">
      <StepIntro title="Review" description="This is how your recipe will look to the community. Fix anything flagged below before publishing." />

      <Card className="p-4">
        <h3 className="mb-3 text-sm font-semibold">Checklist</h3>
        <ul className="grid gap-2 sm:grid-cols-2" role="list">
          {checks.map((c) => {
            const status = c.errors.length ? 'error' : c.warnings.length ? 'warn' : 'ok'
            const Icon = status === 'error' ? AlertCircle : status === 'warn' ? AlertTriangle : CheckCircle2
            return (
              <li key={c.step.id} className="flex items-start gap-2.5 rounded-lg border border-border p-2.5">
                <Icon
                  className={`mt-0.5 size-4 shrink-0 ${status === 'error' ? 'text-danger' : status === 'warn' ? 'text-warn' : 'text-accent'}`}
                  aria-label={status === 'error' ? 'Needs fixing' : status === 'warn' ? 'Suggestion' : 'Done'}
                />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium">{c.step.title}</div>
                  {[...c.errors, ...c.warnings].map((m) => <div key={m} className="text-xs text-fg-muted">{m}</div>)}
                </div>
                <button type="button" onClick={() => goTo(c.index)} className="shrink-0 rounded-md p-1 text-fg-subtle hover:bg-surface-2 hover:text-fg" aria-label={`Edit ${c.step.title}`}>
                  <Pencil className="size-3.5" />
                </button>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* Preview */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-md">
        <div className="border-b border-border bg-surface-2 px-4 py-2 text-xs font-medium tracking-wide text-fg-subtle uppercase">Preview</div>
        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <SwatchVisual hex={d.resultHex} photo={d.photos[0]} finish={d.finish} className="aspect-[4/3] w-full" showPhotoState />
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              <TrustBadge level="tested" />
              <Badge>{d.material}</Badge>
              <Badge>{d.finish}</Badge>
              <DifficultyMeter difficulty={recipeDifficulty(d)} />
            </div>
            <div>
              <h3 className="text-3xl font-semibold tracking-tight">{d.name || 'Untitled recipe'}</h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <HexChip hex={d.resultHex} size="md" />
                <span className="text-sm text-fg-muted">≈ {nearestColorName(d.resultHex)}</span>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-2 text-sm">
                <Avatar profile={user} size="sm" /> <span className="font-medium">{user.displayName}</span>
                <span className="text-fg-muted">· publishing now</span>
              </div>
            )}
            {d.description && <p className="text-fg-muted">{d.description}</p>}
            <p className="text-xs text-fg-muted">🧪 Tested once published. It becomes <b>Reproduced</b> when other makers get a close match.</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
              {[
                ['Method', d.mixingMethod],
                ['Printer', d.printer],
                ['Nozzle', d.nozzle],
                ['Layer height', d.layerHeight],
                ['Stages', String(d.stages.length)],
                ['Photos', String(d.photos.length)],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><dt className="text-xs text-fg-subtle">{k}</dt><dd className="font-medium">{v}</dd></div>
              ))}
            </dl>
            {d.tags.length > 0 && <div className="flex flex-wrap gap-1.5">{d.tags.map((t) => <Badge key={t} size="xs">#{t}</Badge>)}</div>}
          </div>
        </div>

        <div className="grid gap-6 border-t border-border p-4 sm:p-6 lg:grid-cols-2">
          <section>
            <h4 className="mb-3 text-sm font-semibold">Final composition</h4>
            {comp.length ? <CompositionBar composition={comp} filamentsById={filaments} grams={100} owned={inv.signedIn ? inv.ownedIds : undefined} /> : <p className="text-sm text-fg-muted">No inputs.</p>}
            <p className="mt-2 text-xs text-fg-muted">Grams shown for a 100 g batch.</p>
          </section>
          <section className="min-w-0">
            <h4 className="mb-3 text-sm font-semibold">Mixing flow</h4>
            <StageFlow stages={d.stages} filamentsById={filaments} finalHex={d.resultHex} />
          </section>
        </div>

        <section className="border-t border-border p-4 sm:p-6">
          <h4 className="mb-3 text-sm font-semibold">Stages</h4>
          <ol className="space-y-3">
            {d.stages.map((s, i) => {
              const fr = inputFractions(s.inputs)
              return (
                <li key={s.id} className="rounded-xl border border-border p-3">
                  <div className="text-sm font-semibold">Stage {i + 1}: {s.name} {s.outputName && <span className="font-normal text-fg-muted">→ {s.outputName}</span>}</div>
                  <ul className="mt-2 space-y-1 text-sm">
                    {s.inputs.map((inp, k) => {
                      const f = inp.source.kind === 'filament' ? filaments[inp.source.filamentId] : undefined
                      const label = f ? `${f.manufacturer.name} ${f.productLine.name} ${f.colorName}` : d.stages.find((x) => inp.source.kind === 'stage' && x.id === inp.source.stageId)?.outputName ?? 'Unselected'
                      return (
                        <li key={inp.id} className="flex items-center gap-2">
                          {f && <ColorDot hex={f.hex} size={12} />}
                          <span className="w-16 font-mono text-xs tabular">{formatPercent(fr[k], 2)}</span>
                          <span>{label}</span>
                        </li>
                      )
                    })}
                  </ul>
                  {s.instructions && <p className="mt-2 text-sm whitespace-pre-line text-fg-muted">{s.instructions}</p>}
                </li>
              )
            })}
          </ol>
          {d.notes && (
            <div className="mt-4">
              <h4 className="mb-1 text-sm font-semibold">Notes</h4>
              <p className="text-sm whitespace-pre-line text-fg-muted">{d.notes}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
