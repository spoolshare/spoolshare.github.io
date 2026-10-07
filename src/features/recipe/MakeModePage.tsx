import { useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Check, CircleCheck, PartyPopper, RotateCcw, ShoppingBasket, AlertTriangle } from 'lucide-react'
import type { Hex } from '@/types'
import { useRecipe } from '@/lib/hooks/useRecipes'
import { useInventory } from '@/lib/hooks/useInventory'
import { useSession } from '@/lib/hooks/useSession'
import { useLocalStorage } from '@/lib/hooks/useLocalStorage'
import { planRecipe, type Plan } from '@/lib/recipe/composition'
import { cn } from '@/lib/utils/cn'
import { slotLayout } from '@/lib/recipe/composition'
import { SlotStrip } from '@/components/recipe/SlotStrip'
import { formatGrams, formatPercent } from '@/lib/utils/format'
import { readableOn } from '@/lib/color/convert'
import { ColorDot, HexChip } from '@/components/color/Swatch'
import { ButtonLink, Button, Card, EmptyState, Skeleton } from '@/components/ui'
import { BatchControls, describeInput } from './shared'
import type { FilamentView, ID, Stage } from '@/types'

interface MakeState {
  grams: number
  waste: number
  /** Checked step ids, keyed by batch signature so changing the batch starts fresh. */
  checked: Record<string, string[]>
}

interface Step {
  id: string
  kind: 'weigh' | 'load' | 'mix' | 'aside' | 'test'
  title: string
  body?: React.ReactNode
}

export default function MakeModePage() {
  const { slug } = useParams()
  const { data, loading } = useRecipe(slug)
  const inv = useInventory()
  const { user } = useSession()
  const [state, setState] = useLocalStorage<MakeState>(`spoolshare:make:${slug}`, { grams: 10, waste: 5, checked: {} })
  const sig = `${state.grams}g-${state.waste}`
  const checked = useMemo(() => new Set(state.checked[sig] ?? []), [state.checked, sig])

  const plan = useMemo(() => (data ? planRecipe(data.recipe.stages, state.grams, state.waste) : null), [data, state.grams, state.waste])
  const groups = useMemo(() => (data && plan ? buildSteps(plan, data.recipe.stages, data.filamentsById, data.recipe.resultHex) : []), [data, plan])
  const allSteps = groups.flatMap((g) => g.steps)
  const done = allSteps.filter((s) => checked.has(s.id)).length
  const pct = allSteps.length ? done / allSteps.length : 0

  useEffect(() => {
    if (data) document.title = `Make ${data.recipe.name} · SpoolShare`
  }, [data])

  const toggle = (id: string) =>
    setState((s) => {
      const cur = new Set(s.checked[sig] ?? [])
      if (cur.has(id)) cur.delete(id)
      else cur.add(id)
      return { ...s, checked: { ...s.checked, [sig]: [...cur] } }
    })

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:px-6">
        <Skeleton className="h-10 w-2/3" /><Skeleton className="h-24 w-full rounded-xl" /><Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }
  if (!data || !plan) {
    return <div className="mx-auto max-w-3xl px-4 py-16"><EmptyState title="Recipe not found" action={<ButtonLink to="/search">Browse recipes</ButtonLink>} /></div>
  }
  const { recipe } = data
  const isOwn = user?.id === recipe.authorId

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <Link to={`/r/${recipe.slug}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Back to recipe
      </Link>

      <header className="color-transition overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/5" style={{ background: recipe.resultHex, color: readableOn(recipe.resultHex) }}>
        <div className="p-5 sm:p-6">
          <div className="text-xs font-semibold tracking-widest uppercase opacity-75">Make this color</div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Make {formatGrams(state.grams)} of {recipe.name}
          </h1>
          <div className="mt-1 font-mono text-sm opacity-80">{recipe.resultHex}</div>
        </div>
        <div className="bg-surface p-4 text-fg sm:p-5">
          <BatchControls
            grams={state.grams}
            onGrams={(g) => setState((s) => ({ ...s, grams: g }))}
            waste={state.waste}
            onWaste={(w) => setState((s) => ({ ...s, waste: w }))}
            size="lg"
          />
        </div>
      </header>

      {/* progress */}
      <div className="sticky top-16 z-20 -mx-4 mt-4 bg-bg/90 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-medium tabular">{done} of {allSteps.length} steps</span>
          <Button size="sm" variant="ghost" icon={<RotateCcw className="size-3.5" />} onClick={() => setState((s) => ({ ...s, checked: { ...s.checked, [sig]: [] } }))} disabled={done === 0}>
            Reset
          </Button>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuemin={0} aria-valuemax={allSteps.length} aria-valuenow={done} aria-label="Progress">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${pct * 100}%` }} />
        </div>
      </div>

      {/* shopping list */}
      <Card className="mt-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-base font-semibold"><ShoppingBasket className="size-4 text-fg-subtle" aria-hidden /> Raw filament needed</h2>
        <ul className="mt-3 divide-y divide-border" role="list">
          {plan.totals.map((t) => {
            const f = data.filamentsById[t.filamentId]
            const owned = inv.signedIn ? inv.ownedIds.has(t.filamentId) : undefined
            return (
              <li key={t.filamentId} className="flex items-center gap-3 py-2.5">
                <ColorDot hex={f?.hex ?? '#999'} size={20} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{f?.colorName}</div>
                  <div className="truncate text-xs text-fg-muted">{f?.manufacturer.name} {f?.productLine.name}</div>
                </div>
                {owned === true && <span className="inline-flex items-center gap-1 text-xs font-medium text-accent"><CircleCheck className="size-3.5" aria-hidden />Owned</span>}
                {owned === false && <span className="inline-flex items-center gap-1 text-xs font-medium text-warn"><AlertTriangle className="size-3.5" aria-hidden />Missing</span>}
                <span className="w-20 text-right font-mono text-sm font-semibold tabular">{formatGrams(t.grams)}</span>
              </li>
            )
          })}
        </ul>
      </Card>

      {/* steps */}
      <div className="mt-8 space-y-8">
        {groups.map((g) => (
          <section key={g.key} aria-labelledby={`h-${g.key}`}>
            <div className="mb-3 flex items-center gap-3">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold', g.final ? 'bg-accent text-accent-fg' : 'bg-fg text-bg')}>{g.number}</span>
              <div className="min-w-0">
                <h2 id={`h-${g.key}`} className="text-lg font-semibold tracking-tight">{g.title}</h2>
                {g.subtitle && <p className="text-sm text-fg-muted">{g.subtitle}</p>}
              </div>
            </div>
            <ol className="space-y-2" role="list">
              {g.steps.map((s) => {
                const isDone = checked.has(s.id)
                return (
                  <li key={s.id}>
                    <label
                      className={cn(
                        'flex cursor-pointer gap-4 rounded-xl border p-4 transition-colors select-none',
                        isDone ? 'border-accent/30 bg-accent-soft/60' : 'border-border bg-surface hover:border-border-strong',
                      )}
                    >
                      <input type="checkbox" checked={isDone} onChange={() => toggle(s.id)} className="peer sr-only" />
                      <span
                        aria-hidden
                        className={cn(
                          'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent',
                          isDone ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong bg-surface',
                        )}
                      >
                        {isDone && <Check className="size-4" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn('block text-base font-medium', isDone && 'text-fg-muted line-through decoration-fg-subtle')}>{s.title}</span>
                        {s.body && <span className={cn('mt-1.5 block text-sm text-fg-muted', isDone && 'opacity-60')}>{s.body}</span>}
                      </span>
                    </label>
                  </li>
                )
              })}
            </ol>
          </section>
        ))}
      </div>

      {done === allSteps.length && allSteps.length > 0 ? (
        <Card className="mt-8 flex flex-col items-center gap-3 p-6 text-center">
          <PartyPopper className="size-8 text-accent" aria-hidden />
          <h2 className="text-lg font-semibold">All done! How did it turn out?</h2>
          <p className="max-w-md text-sm text-fg-muted">
            Upload a photo of your swatch. Every reproduction makes this recipe more trustworthy for the next maker.
          </p>
          {!isOwn && <ButtonLink to={`/r/${recipe.slug}/reproduce`} icon={<Check className="size-4" />}>I Made This</ButtonLink>}
        </Card>
      ) : (
        !isOwn && (
          <div className="mt-8 text-center">
            <ButtonLink to={`/r/${recipe.slug}/reproduce`} variant="outline" icon={<Check className="size-4" />}>Finished? Upload your result</ButtonLink>
          </div>
        )
      )}
    </div>
  )
}

function buildSteps(plan: Plan, stages: Stage[], byId: Record<ID, FilamentView>, finalHex: Hex) {
  const groups = plan.stages.map((ps) => {
    const s = ps.stage
    const n = ps.index + 1
    const steps: Step[] = []
    const described = ps.inputs.map((pi) => ({ pi, d: describeInput(pi.input, stages, byId) }))

    const layout = slotLayout(ps.inputs.map((pi) => pi.input.parts))
    if (layout) {
      steps.push({
        id: `${s.id}:load`,
        kind: 'load',
        title: 'Load the mixer’s 4 AMS slots',
        body: (
          <span className="mt-1 block">
            <SlotStrip slots={layout.map((k) => ({ name: described[k].d.name, hex: described[k].d.hex }))} />
            <span className="mt-1.5 block text-xs text-fg-muted">The same filament is kept out of neighboring slots where possible, for a more even blend.</span>
          </span>
        ),
      })
    } else {
      described.forEach(({ pi, d }) => {
        steps.push({
          id: `${s.id}:weigh:${pi.input.id}`,
          kind: 'weigh',
          title: `Weigh ${formatGrams(pi.grams)} of ${d.name}`,
          body: (
            <span className="inline-flex flex-wrap items-center gap-2">
              <ColorDot hex={d.hex} size={14} />
              {d.detail} · {formatPercent(pi.fraction)} of this stage
            </span>
          ),
        })
      })
      steps.push({
        id: `${s.id}:load`,
        kind: 'load',
        title: 'Combine the weighed filament',
        body: 'This ratio doesn’t fit the mixer’s 4 slots, so combine by weight instead.',
      })
    }

    steps.push({
      id: `${s.id}:mix`,
      kind: 'mix',
      title: layout ? `Print the mixer to make ${s.outputName || 'the final color'}` : `Mix into ${formatGrams(ps.grams)} of ${s.outputName || 'final color'}`,
      body: s.instructions || 'Print the Multi-Color Filament Mixer. Its output is your new single-color filament.',
    })

    if (!ps.isFinal) {
      const consumers = ps.consumedBy.map((id) => stages.findIndex((x) => x.id === id) + 1)
      steps.push({
        id: `${s.id}:aside`,
        kind: 'aside',
        title: `Label and set aside “${s.outputName}”`,
        body: consumers.length ? `You’ll need it in ${consumers.map((c) => `Stage ${c}`).join(' and ')}.` : undefined,
      })
    }

    return {
      key: s.id,
      number: n,
      final: ps.isFinal,
      title: `Stage ${n}: make ${formatGrams(ps.grams)} ${s.outputName || s.name}`,
      subtitle: s.name !== s.outputName ? s.name : undefined,
      steps,
    }
  })

  groups.push({
    key: 'test',
    number: groups.length + 1,
    final: true,
    title: 'Test & compare',
    subtitle: undefined,
    steps: [
      {
        id: 'test:print',
        kind: 'test',
        title: 'Print a test swatch and compare it to the original',
        body: (
          <span className="flex flex-wrap items-center gap-2">
            Target: <HexChip hex={finalHex} size="xs" /> Check it in bright, neutral daylight.
          </span>
        ),
      },
    ],
  })
  return groups
}
