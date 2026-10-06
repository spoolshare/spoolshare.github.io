import { useState } from 'react'
import { Calculator, ChevronDown, Pipette } from 'lucide-react'
import { Field, Textarea } from '@/components/ui'
import { ColorPicker } from '@/components/color/ColorPicker'
import { ColorDot, HexChip, SwatchVisual } from '@/components/color/Swatch'
import { PhotoUploader } from '@/components/recipe/PhotoUploader'
import { nearestColorName } from '@/lib/color/names'
import { hexToLab } from '@/lib/color/convert'
import { cn } from '@/lib/utils/cn'
import { useWizard } from '../context'
import { StepIntro } from './StepIntro'

export function ColorStep() {
  const { state, dispatch } = useWizard()
  const d = state.draft
  const [showUpload, setShowUpload] = useState(d.photos.length === 0)
  const setHex = (resultHex: string) => dispatch({ type: 'patch', patch: { resultHex } })
  const lab = hexToLab(d.resultHex)
  const sampled = d.photos.filter((p) => p.sampledHex)

  return (
    <div className="space-y-6">
      <StepIntro
        title="Result color"
        description="The color of your actual printed swatch. Estimate it from a photo, then correct it by eye. Photos and screens are never perfect, so you have the final say."
      />

      {state.prefilled && (
        <div className="flex gap-2.5 rounded-xl border border-calc/30 bg-calc-soft p-3 text-sm" role="note">
          <Calculator className="mt-0.5 size-4 shrink-0 text-calc" aria-hidden />
          <p>
            This color came from the Color Matcher’s <b>calculated / untested</b> prediction. Once you’ve printed the mix,
            replace it with the color you actually measured.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="order-2 rounded-2xl border border-border bg-surface p-4 lg:order-1">
          <ColorPicker value={d.resultHex} onChange={setHex} />
        </div>

        <div className="order-1 space-y-3 lg:order-2">
          <SwatchVisual hex={d.resultHex} photo={undefined} finish={d.finish} className="aspect-[4/3] w-full shadow-md" label={`Preview of ${d.resultHex}`} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-semibold">≈ {nearestColorName(d.resultHex)}</div>
              <div className="font-mono text-xs text-fg-muted tabular">
                L* {lab.L.toFixed(1)} · a* {lab.a.toFixed(1)} · b* {lab.b.toFixed(1)}
              </div>
            </div>
            <HexChip hex={d.resultHex} size="md" />
          </div>

          {sampled.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-3">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-fg-subtle uppercase">
                <Pipette className="size-3.5" aria-hidden /> Estimated from your photos
              </div>
              <div className="flex flex-wrap gap-2">
                {sampled.map((p, i) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setHex(p.sampledHex!)}
                    aria-pressed={d.resultHex === p.sampledHex}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs font-medium',
                      d.resultHex === p.sampledHex ? 'border-accent bg-accent-soft' : 'border-border hover:border-border-strong',
                    )}
                  >
                    <img src={p.url} alt="" className="size-6 rounded object-cover" />
                    <ColorDot hex={p.sampledHex!} size={14} />
                    <span className="font-mono">{p.sampledHex}</span>
                    <span className="sr-only">from photo {i + 1}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-fg-muted">Click a photo below to sample a different spot.</p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface">
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          aria-expanded={showUpload}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-semibold">Estimate from a photo</span>
            <span className="block text-xs text-fg-muted">{d.photos.length ? `${d.photos.length} photo${d.photos.length > 1 ? 's' : ''} uploaded` : 'Upload your swatch photo and we’ll suggest a HEX'}</span>
          </span>
          <ChevronDown className={cn('size-4 text-fg-subtle transition-transform', showUpload && 'rotate-180')} aria-hidden />
        </button>
        {showUpload && (
          <div className="border-t border-border p-4">
            <PhotoUploader
              photos={d.photos}
              onChange={(photos) => dispatch({ type: 'patch', patch: { photos } })}
              onSampled={setHex}
              defaultAlt={d.name ? `${d.name} printed swatch` : 'Printed swatch'}
            />
          </div>
        )}
      </div>

      <Field label="Lighting notes" optional htmlFor="r-light" hint="How was the photo or measurement taken? This helps others judge the color.">
        <Textarea
          id="r-light"
          rows={2}
          value={d.lightingNotes ?? ''}
          onChange={(e) => dispatch({ type: 'patch', patch: { lightingNotes: e.target.value || undefined } })}
          placeholder="Daylight by a north window, no flash. Phone white balance locked."
        />
      </Field>
    </div>
  )
}
