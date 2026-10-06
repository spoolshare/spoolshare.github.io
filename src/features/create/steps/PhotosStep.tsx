import { AlertTriangle, FlaskConical } from 'lucide-react'
import { PhotoUploader } from '@/components/recipe/PhotoUploader'
import { useWizard } from '../context'
import { StepIntro } from './StepIntro'

export function PhotosStep({ showErrors }: { showErrors: boolean }) {
  const { state, dispatch } = useWizard()
  const d = state.draft
  const missingAlt = d.photos.some((p) => !p.alt.trim())
  return (
    <div className="space-y-6">
      <StepIntro
        title="Photos"
        description="Real printed swatches are what make SpoolShare different. Add a cover shot of the final swatch, and optionally close-ups or comparisons next to the source filaments."
      />

      {d.photos.length === 0 ? (
        <div className="flex gap-2.5 rounded-xl border border-warn/30 bg-warn-soft p-3 text-sm" role="note">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden />
          <p>
            <b>No photo yet.</b> You can still publish, but without a photographed swatch other makers can’t judge the color,
            and the recipe won’t carry the <b>🧪 Tested</b> badge until you add one.
          </p>
        </div>
      ) : (
        <div className="flex gap-2.5 rounded-xl border border-accent/30 bg-accent-soft p-3 text-sm text-accent-soft-fg" role="note">
          <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>Your recipe will publish as <b>Tested</b>. It becomes <b>Reproduced</b> when other makers match it.</p>
        </div>
      )}

      <PhotoUploader
        photos={d.photos}
        onChange={(photos) => dispatch({ type: 'patch', patch: { photos } })}
        onSampled={(resultHex) => dispatch({ type: 'patch', patch: { resultHex } })}
        defaultAlt={d.name ? `${d.name} printed swatch` : 'Printed swatch'}
      />
      {showErrors && missingAlt && <p role="alert" className="text-sm text-danger">Every photo needs alt text describing it.</p>}
      <p className="text-xs text-fg-muted">
        Clicking a photo here also updates your result HEX to the sampled color. You can fine-tune it again in the Result color step.
      </p>
    </div>
  )
}
