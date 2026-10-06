import { useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, BadgeCheck, Check, Info, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { useQuery } from '@/lib/hooks/useQuery'
import { useInventory } from '@/lib/hooks/useInventory'
import { deltaE } from '@/lib/color/deltaE'
import { nearestColorName } from '@/lib/color/names'
import { Badge, Button, ButtonLink, Card, EmptyState, SectionHeader, Skeleton, useToast } from '@/components/ui'
import { HexChip, SwatchVisual } from '@/components/color/Swatch'
import { DeltaEMeter } from '@/components/color/Compare'
import { FilamentName, SpoolIcon } from '@/components/filament/Spool'
import { RecipeGrid } from '@/components/recipe/RecipeCard'

export default function FilamentDetailPage() {
  const { id } = useParams()
  const { data: f, loading } = useQuery(id ? `catalog:filament:${id}` : null, () => api.getFilament(id!))
  const inv = useInventory()
  const toast = useToast()
  const all = useQuery('recipes:all200', () => api.searchRecipes({ limit: 200 }))
  const usedIn = useMemo(() => all.data?.items.filter((h) => h.composition.some((c) => c.filamentId === id)), [all.data, id])
  const similar = useQuery(f ? `catalog:similar:${f.id}` : null, () => api.searchFilaments({ nearHex: f!.hex, limit: 10 }))

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    )
  }
  if (!f) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <EmptyState title="Filament not found" description="It may have been removed from the catalog." action={<ButtonLink to="/filaments">Back to My Filaments</ButtonLink>} />
      </div>
    )
  }

  const owned = inv.owns(f.id)
  const props: [string, string | undefined][] = [
    ['Manufacturer', f.manufacturer.name],
    ['Product line', f.productLine.name],
    ['Material', f.material],
    ['Finish', f.finish[0].toUpperCase() + f.finish.slice(1)],
    ['Transparency', f.transparency[0].toUpperCase() + f.transparency.slice(1)],
    ['Color code', f.colorCode],
    ['Nearest color name', nearestColorName(f.hex)],
  ]

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <Link to="/filaments" className="mb-4 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> My Filaments
      </Link>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="relative">
          <SwatchVisual hex={f.hex} finish={f.finish} className="aspect-[4/3] w-full rounded-2xl" label={`${f.colorName} display color ${f.hex}`} rounded="rounded-2xl" />
          <div className="absolute -bottom-6 left-6 rounded-full bg-surface p-1.5 shadow-lg">
            <SpoolIcon hex={f.hex} size={88} />
          </div>
        </div>

        <div className="pt-6 lg:pt-0">
          <div className="text-sm font-medium text-fg-muted">{f.manufacturer.name} · {f.productLine.name}</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{f.colorName}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <HexChip hex={f.hex} size="md" />
            {f.hexVerified ? (
              <Badge tone="accent" icon={<BadgeCheck className="size-3.5" />}>Community-measured HEX</Badge>
            ) : (
              <Badge tone="neutral">Manufacturer HEX</Badge>
            )}
            {f.isCustom && <Badge tone="info">Custom (private)</Badge>}
          </div>
          <p className="mt-3 flex items-start gap-2 text-sm text-fg-muted">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
            Display approximation — not a physical measurement. Real prints vary by batch, lighting and layer height, and mixing behavior can’t be predicted from HEX alone.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant={owned ? 'soft' : 'primary'}
              icon={owned ? <Check className="size-4" /> : <Plus className="size-4" />}
              disabled={!inv.signedIn}
              aria-pressed={owned}
              onClick={async () => {
                if (owned) {
                  await inv.remove(f.id)
                  toast(`Removed ${f.colorName}`, { tone: 'info', action: { label: 'Undo', onClick: () => inv.add(f) } })
                } else {
                  await inv.add(f)
                  toast(<>Added <b>{f.colorName}</b> to My Filaments</>)
                }
              }}
            >
              {owned ? 'In My Filaments' : 'Add to My Filaments'}
            </Button>
            <ButtonLink to={`/match?hex=${encodeURIComponent(f.hex)}`} variant="outline">Find recipes near this color</ButtonLink>
          </div>

          <Card className="mt-6 overflow-hidden">
            <dl className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0">
              {props.filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 px-4 py-2.5 text-sm sm:border-b sm:border-border">
                  <dt className="text-fg-muted">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            {f.notes && <p className="border-t border-border px-4 py-3 text-sm">{f.notes}</p>}
          </Card>
        </div>
      </div>

      <section className="mt-14">
        <SectionHeader title="Recipes using this filament" subtitle={usedIn ? `${usedIn.length} community recipes, directly or via an intermediate` : undefined} />
        {usedIn && usedIn.length === 0 ? (
          <EmptyState title="No recipes yet" description={`Be the first to publish a recipe with ${f.colorName}.`} action={<ButtonLink to="/create">Create a recipe</ButtonLink>} />
        ) : (
          <RecipeGrid hits={usedIn} loading={all.loading} skeletons={4} />
        )}
      </section>

      <section className="mt-14">
        <SectionHeader title="Similar filaments" subtitle="Closest display colors across brands (ΔE00). Similar HEX does not guarantee similar mixing behavior." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {similar.data?.filter((s) => s.id !== f.id).slice(0, 9).map((s) => (
            <Link key={s.id} to={`/filament/${s.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-shadow hover:shadow-md">
              <SpoolIcon hex={s.hex} size={44} />
              <FilamentName filament={s} className="flex-1" showHex />
              <DeltaEMeter value={deltaE(s.hex, f.hex)} compact />
            </Link>
          ))}
          {similar.loading && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[70px] rounded-xl" />)}
        </div>
      </section>
    </div>
  )
}
