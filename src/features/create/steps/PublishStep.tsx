import { useState } from 'react'
import { Link } from 'react-router'
import { AlertCircle, Rocket } from 'lucide-react'
import type { Recipe } from '@/types'
import { api } from '@/lib/api'
import { invalidate } from '@/lib/hooks/useQuery'
import { readableOn, shade } from '@/lib/color/convert'
import { Button, ButtonLink, Card } from '@/components/ui'
import { HexChip, SwatchVisual } from '@/components/color/Swatch'
import { useWizard } from '../context'
import { firstBlocked, STEPS } from '../validation'
import { StepIntro } from './StepIntro'
import { sessionCache } from '../draft'

export function PublishStep({ onPublished }: { onPublished: (r: Recipe) => void }) {
  const { state, goTo } = useWizard()
  const d = state.draft
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const blocked = firstBlocked(state)
  const ready = blocked === STEPS.length - 1

  const publish = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await api.publishRecipe(d)
      invalidate('recipes', 'recipe', 'drafts')
      if (d.id) sessionCache.delete(d.id)
      onPublished(r)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <StepIntro title="Publish" description="Share your recipe with the community. You can edit it later, and other makers can upload their reproductions." />
      <Card className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
        <SwatchVisual hex={d.resultHex} photo={d.photos[0]} finish={d.finish} className="size-28 shrink-0" />
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-semibold tracking-tight">{d.name || 'Untitled recipe'}</h3>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <HexChip hex={d.resultHex} />
            <span className="text-sm text-fg-muted">
              {d.stages.length} {d.stages.length === 1 ? 'stage' : 'stages'} · {state.palette.length} filaments · {d.photos.length} photos
            </span>
          </div>
          <p className="mt-3 text-sm text-fg-muted">
            By publishing you confirm you physically mixed and printed this color. Predictions belong in the Color Matcher, not here.
          </p>
        </div>
      </Card>

      {!ready && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <p className="flex-1">
            <b>{STEPS[blocked].title}</b> still needs attention before you can publish.{' '}
            <button type="button" className="font-semibold underline" onClick={() => goTo(blocked)}>Go there</button>
          </p>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}

      <Button size="lg" className="w-full sm:w-auto" disabled={!ready} loading={busy} onClick={publish} icon={<Rocket className="size-5" />}>
        Publish recipe
      </Button>
    </div>
  )
}

/** Success state with a tasteful burst of the recipe's own color. */
export function PublishedSuccess({ recipe, onAnother }: { recipe: Recipe; onAnother: () => void }) {
  const hex = recipe.resultHex
  const tints = [shade(hex, 18), hex, shade(hex, -14), shade(hex, 30), shade(hex, 8)]
  return (
    <div className="relative mx-auto max-w-xl overflow-hidden py-10 text-center">
      <style>{`
        @keyframes ss-burst { from { transform: translate(0,0) scale(.4); opacity: 1 } to { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 0 } }
        @keyframes ss-rise { from { transform: scale(.6); opacity: 0 } to { transform: scale(1); opacity: 1 } }
      `}</style>
      <div className="relative mx-auto size-40">
        {Array.from({ length: 22 }, (_, i) => {
          const a = (i / 22) * Math.PI * 2
          const dist = 90 + (i % 4) * 22
          return (
            <span
              key={i}
              aria-hidden
              className="absolute top-1/2 left-1/2 rounded-full"
              style={{
                width: 8 + (i % 3) * 4,
                height: 8 + (i % 3) * 4,
                marginLeft: -6,
                marginTop: -6,
                background: tints[i % tints.length],
                ['--dx' as string]: `${Math.cos(a) * dist}px`,
                ['--dy' as string]: `${Math.sin(a) * dist}px`,
                animation: `ss-burst 1100ms cubic-bezier(.2,.8,.2,1) ${(i % 5) * 40}ms both`,
              }}
            />
          )
        })}
        <div
          className="relative grid size-40 place-items-center rounded-full shadow-lg"
          style={{ background: hex, color: readableOn(hex), animation: 'ss-rise 500ms cubic-bezier(.2,.8,.2,1) both' }}
        >
          <span className="font-mono text-sm font-semibold">{hex}</span>
        </div>
      </div>
      <h2 className="mt-8 text-2xl font-semibold tracking-tight">“{recipe.name}” is live!</h2>
      <p className="mt-2 text-fg-muted">
        Your recipe is published as <b>🧪 Tested</b>. Share it so others can reproduce it and confirm the color.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <ButtonLink to={`/r/${recipe.slug}`} size="lg">View recipe</ButtonLink>
        <Button variant="outline" size="lg" onClick={onAnother}>Make another</Button>
      </div>
      <p className="mt-4 text-xs text-fg-muted">
        Link: <Link to={`/r/${recipe.slug}`} className="font-mono underline">/r/{recipe.slug}</Link>
      </p>
    </div>
  )
}
