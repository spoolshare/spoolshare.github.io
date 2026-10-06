import { AlertCircle, AlertTriangle, Calculator, CheckCircle2 } from 'lucide-react'
import { predictMix } from '@/lib/color/mixing'
import { useInventory } from '@/lib/hooks/useInventory'
import { Card } from '@/components/ui'
import { ColorPair, DeltaEMeter } from '@/components/color/Compare'
import { StageFlow } from '@/components/recipe/StageFlow'
import { CompositionBar } from '@/components/recipe/CompositionBar'
import { safeComposition } from './draft'
import { useWizard } from './context'
import { stageIssues } from './validation'

/** Live feedback while editing stages: true composition, predicted vs. measured color, issues. */
export function LivePanel() {
  const { state, filaments } = useWizard()
  const inv = useInventory()
  const d = state.draft
  const comp = safeComposition(d.stages).filter((c) => filaments[c.filamentId])
  const predicted = comp.length
    ? predictMix(comp.map((c) => ({ hex: filaments[c.filamentId].hex, weight: c.fraction, filament: filaments[c.filamentId] })))
    : null
  const issues = stageIssues(state)

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="text-sm font-semibold">True final composition</h3>
        <p className="mb-3 text-xs text-fg-muted">Intermediates expanded into raw filament shares.</p>
        {comp.length ? (
          <CompositionBar composition={comp} filamentsById={filaments} owned={inv.signedIn ? inv.ownedIds : undefined} />
        ) : (
          <p className="text-sm text-fg-muted">Add inputs with ratios to see the composition.</p>
        )}
      </Card>

      {predicted && (
        <Card className="p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold">
            <Calculator className="size-4 text-calc" aria-hidden /> Your result vs. calculated
          </h3>
          <p className="mb-3 text-xs text-fg-muted">
            The <b className="text-calc">calculated / untested</b> color is a Kubelka–Munk estimate. Your measured swatch is the truth;
            a large gap is normal and useful data.
          </p>
          <ColorPair a={d.resultHex} b={predicted} aLabel="Your result" bLabel="Calculated" className="h-20" />
          <DeltaEMeter a={d.resultHex} b={predicted} className="mt-3" />
        </Card>
      )}

      <Card className="p-4" aria-live="polite">
        <h3 className="mb-2 text-sm font-semibold">Checks</h3>
        {issues.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-accent"><CheckCircle2 className="size-4" aria-hidden /> Stages look good.</p>
        ) : (
          <ul className="space-y-1.5" role="list">
            {issues.map((i, k) => (
              <li key={k} className="flex items-start gap-2 text-sm">
                {i.level === 'error' ? (
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-label="Error" />
                ) : (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-label="Warning" />
                )}
                <span>{i.message}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

/** Full-width flow diagram of the stages being edited. */
export function LiveFlow() {
  const { state, filaments } = useWizard()
  return (
    <Card className="p-4">
      <h3 className="mb-1 text-sm font-semibold">Mixing flow</h3>
      <p className="mb-3 text-xs text-fg-muted">Updates as you edit. Line thickness shows each input’s share.</p>
      <StageFlow stages={state.draft.stages} filamentsById={filaments} finalHex={state.draft.resultHex} />
    </Card>
  )
}
