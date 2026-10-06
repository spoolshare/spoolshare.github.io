import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, Check, LogIn, Replace, X } from 'lucide-react'
import type { FilamentView, Hex, ID, Material, Photo } from '@/types'
import { MATERIALS } from '@/types'
import { api } from '@/lib/api'
import { useRecipe } from '@/lib/hooks/useRecipes'
import { useSession } from '@/lib/hooks/useSession'
import { useInventory } from '@/lib/hooks/useInventory'
import { invalidate } from '@/lib/hooks/useQuery'
import { cn } from '@/lib/utils/cn'
import { ColorDot, HexChip } from '@/components/color/Swatch'
import { ColorPicker } from '@/components/color/ColorPicker'
import { CompareSlider, DeltaEMeter } from '@/components/color/Compare'
import { PhotoUploader } from '@/components/recipe/PhotoUploader'
import { FilamentPickerDialog } from '@/components/filament/FilamentPicker'
import { Button, ButtonLink, Card, EmptyState, Field, Input, Select, Skeleton, Textarea, useToast } from '@/components/ui'

type SubMode = 'exact' | 'catalog' | 'text'
interface SubState { mode: SubMode; filament?: FilamentView; label: string }

const RATINGS = [
  { value: 1, label: 'Very different' },
  { value: 2, label: 'Somewhat off' },
  { value: 3, label: 'Similar' },
  { value: 4, label: 'Close' },
  { value: 5, label: 'Identical' },
]

export default function ReproducePage() {
  const { slug } = useParams()
  const { data, loading } = useRecipe(slug)
  const { user, loading: sessionLoading } = useSession()
  const inv = useInventory()
  const toast = useToast()
  const navigate = useNavigate()

  const [photos, setPhotos] = useState<Photo[]>([])
  const [hex, setHex] = useState<Hex | null>(null)
  const [printer, setPrinter] = useState('')
  const [material, setMaterial] = useState<Material>('PLA')
  const [subs, setSubs] = useState<Record<ID, SubState>>({})
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [pickerFor, setPickerFor] = useState<ID | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data && hex === null) {
      setHex(data.recipe.resultHex)
      setMaterial(data.recipe.material)
    }
  }, [data]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (user?.printers[0] && !printer) setPrinter(user.printers[0])
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const required = useMemo(() => data?.composition.map((c) => data.filamentsById[c.filamentId]).filter(Boolean) ?? [], [data])

  if (loading || sessionLoading) {
    return <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6"><Skeleton className="h-10 w-1/2" /><Skeleton className="h-72 w-full rounded-xl" /></div>
  }
  if (!data) return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Recipe not found" action={<ButtonLink to="/search">Browse recipes</ButtonLink>} /></div>

  const { recipe } = data
  const back = (
    <Link to={`/r/${recipe.slug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
      <ArrowLeft className="size-4" /> Back to {recipe.name}
    </Link>
  )

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {back}
        <EmptyState icon={<LogIn className="size-5" />} title="Sign in to share your result" description="Reproductions are tied to your profile so the community can trust them." action={<ButtonLink to="/signin">Sign in</ButtonLink>} />
      </div>
    )
  }
  if (user.id === recipe.authorId) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {back}
        <EmptyState title="This is your own recipe" description="Reproductions must come from other makers, which is what makes them independent evidence. You can add more photos by editing your recipe." action={<ButtonLink to={`/r/${recipe.slug}`} variant="outline">Back to recipe</ButtonLink>} />
      </div>
    )
  }

  const current = hex ?? recipe.resultHex
  const missingAlt = photos.some((p) => !p.alt.trim())
  const canSubmit = rating > 0 && !missingAlt && !submitting

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) {
      setError(rating === 0 ? 'Please rate how close your result was.' : 'Every photo needs alt text.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await api.addReproduction({
        recipeId: recipe.id,
        resultHex: current,
        photos,
        printer: printer.trim() || undefined,
        material,
        substitutions: Object.entries(subs)
          .filter(([, s]) => (s.mode === 'catalog' && s.filament) || (s.mode === 'text' && s.label.trim()))
          .map(([originalFilamentId, s]) => ({ originalFilamentId, usedFilamentId: s.mode === 'catalog' ? s.filament!.id : undefined, usedLabel: s.mode === 'text' ? s.label.trim() : undefined })),
        notes: notes.trim() || undefined,
        accuracyRating: rating,
      })
      invalidate('reproductions', 'recipe', 'recipes')
      toast(<>Thanks! Your reproduction of <b>{recipe.name}</b> is live.</>)
      navigate(`/r/${recipe.slug}#results`)
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' }), 300)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  const setSub = (id: ID, patch: Partial<SubState>) => setSubs((s) => ({ ...s, [id]: { ...(s[id] ?? { mode: 'exact', label: '' }), ...patch } }))

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      {back}
      <header className="mb-8 flex items-center gap-4">
        <span className="size-14 shrink-0 rounded-xl shadow-sm ring-1 ring-black/5" style={{ background: recipe.resultHex }} aria-hidden />
        <div>
          <div className="text-xs font-semibold tracking-wider text-accent uppercase">I made this</div>
          <h1 className="text-2xl font-semibold tracking-tight">Share your {recipe.name}</h1>
          <p className="text-sm text-fg-muted">by {data.author.displayName} · original <span className="font-mono">{recipe.resultHex}</span></p>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-8">
        <FormSection n={1} title="Photo of your swatch" subtitle="Optional but strongly recommended. Photos make reproductions far more useful.">
          <PhotoUploader photos={photos} onChange={setPhotos} onSampled={setHex} defaultAlt={`My reproduction of ${recipe.name}`} />
        </FormSection>

        <FormSection n={2} title="Your result color" subtitle="Sampled from your photo when you add one. Adjust it to match what you see in daylight.">
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-4"><ColorPicker value={current} onChange={setHex} compact /></Card>
            <div className="space-y-3">
              <CompareSlider left={recipe.resultHex} right={current} leftLabel="Original" rightLabel="Yours" height={180} />
              <div className="flex items-center justify-between gap-2">
                <HexChip hex={recipe.resultHex} size="xs" />
                <HexChip hex={current} size="xs" />
              </div>
              <DeltaEMeter a={recipe.resultHex} b={current} />
            </div>
          </div>
        </FormSection>

        <FormSection n={3} title="Filament you used" subtitle="Did you use exactly the listed filaments? Note any substitutions. They help others understand differences.">
          <ul className="space-y-2" role="list">
            {required.map((f) => {
              const s = subs[f.id] ?? { mode: 'exact' as SubMode, label: '' }
              const owned = inv.ownedIds.has(f.id)
              return (
                <li key={f.id} className="rounded-xl border border-border bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <ColorDot hex={f.hex} size={20} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{f.colorName}</div>
                      <div className="text-xs text-fg-muted">{f.manufacturer.name} {f.productLine.name}{!owned && ' · not in your inventory'}</div>
                    </div>
                    <Select aria-label={`What did you use instead of ${f.colorName}?`} value={s.mode} onChange={(e) => setSub(f.id, { mode: e.target.value as SubMode })} className="w-full sm:w-52">
                      <option value="exact">Used this exact filament</option>
                      <option value="catalog">Substituted from catalog</option>
                      <option value="text">Substituted (describe)</option>
                    </Select>
                  </div>
                  {s.mode === 'catalog' && (
                    <div className="mt-3 flex items-center gap-2 pl-8">
                      <Replace className="size-4 text-fg-subtle" aria-hidden />
                      {s.filament ? (
                        <span className="inline-flex items-center gap-2 text-sm">
                          <ColorDot hex={s.filament.hex} size={14} />
                          {s.filament.manufacturer.name} {s.filament.productLine.name} {s.filament.colorName}
                          <button type="button" aria-label="Clear substitution" onClick={() => setSub(f.id, { filament: undefined })} className="rounded p-0.5 text-fg-subtle hover:text-fg"><X className="size-3.5" /></button>
                        </span>
                      ) : (
                        <Button size="xs" variant="outline" onClick={() => setPickerFor(f.id)}>Choose filament…</Button>
                      )}
                    </div>
                  )}
                  {s.mode === 'text' && (
                    <div className="mt-3 pl-8">
                      <Input aria-label={`Describe the substitute for ${f.colorName}`} value={s.label} onChange={(e) => setSub(f.id, { label: e.target.value })} placeholder="e.g. Sunlu PLA+ White (older batch)" />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </FormSection>

        <FormSection n={4} title="Print details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Printer" optional htmlFor="rep-printer">
              <Input id="rep-printer" value={printer} onChange={(e) => setPrinter(e.target.value)} placeholder="e.g. Bambu Lab P1S" list="rep-printers" />
              <datalist id="rep-printers">{user.printers.map((p) => <option key={p} value={p} />)}</datalist>
            </Field>
            <Field label="Material" htmlFor="rep-material">
              <Select id="rep-material" value={material} onChange={(e) => setMaterial(e.target.value as Material)}>
                {MATERIALS.map((m) => <option key={m}>{m}</option>)}
              </Select>
            </Field>
          </div>
        </FormSection>

        <FormSection n={5} title="How close did yours look to the original?">
          <div role="radiogroup" aria-label="Accuracy rating" aria-required="true" className="grid grid-cols-5 gap-2">
            {RATINGS.map((r) => {
              const active = rating === r.value
              return (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRating(r.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setRating(Math.min(5, (rating || 0) + 1)) }
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setRating(Math.max(1, (rating || 2) - 1)) }
                  }}
                  tabIndex={active || (rating === 0 && r.value === 1) ? 0 : -1}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-center transition-colors',
                    active ? 'border-accent bg-accent-soft text-accent-soft-fg' : 'border-border bg-surface hover:border-border-strong',
                  )}
                >
                  <span className={cn('text-xl', r.value <= rating ? 'text-amber-500' : 'text-surface-3')} aria-hidden>★</span>
                  <span className="text-sm font-semibold tabular">{r.value}</span>
                  <span className="text-[11px] leading-tight text-fg-muted">{r.label}</span>
                </button>
              )
            })}
          </div>
        </FormSection>

        <FormSection n={6} title="Notes">
          <Textarea aria-label="Notes" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Purge length, drying, lighting, anything that might explain differences…" />
        </FormSection>

        {error && <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-5">
          <ButtonLink to={`/r/${recipe.slug}`} variant="ghost">Cancel</ButtonLink>
          <Button type="submit" size="lg" loading={submitting} icon={<Check className="size-4" />}>Publish reproduction</Button>
        </div>
      </form>

      <FilamentPickerDialog
        open={!!pickerFor}
        onClose={() => setPickerFor(null)}
        title="Which filament did you use?"
        onSelect={(f) => pickerFor && setSub(pickerFor, { filament: f, mode: 'catalog' })}
      />
    </div>
  )
}

function FormSection({ n, title, subtitle, children }: { n: number; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`fs-${n}`}>
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-3 text-xs font-semibold" aria-hidden>{n}</span>
        <div>
          <h2 id={`fs-${n}`} className="text-base font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-fg-muted">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}
