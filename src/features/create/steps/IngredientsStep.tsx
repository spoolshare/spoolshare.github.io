import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { useInventory } from '@/lib/hooks/useInventory'
import { Button, EmptyState } from '@/components/ui'
import { FilamentPickerDialog } from '@/components/filament/FilamentPicker'
import { FilamentName, SpoolIcon } from '@/components/filament/Spool'
import { useWizard } from '../context'
import { StepIntro } from './StepIntro'

export function IngredientsStep({ showErrors }: { showErrors: boolean }) {
  const { state, dispatch, filaments, rememberFilament } = useWizard()
  const inv = useInventory()
  const [open, setOpen] = useState(false)
  const used = new Set<string>()
  state.draft.stages.forEach((s) => s.inputs.forEach((i) => i.source.kind === 'filament' && used.add(i.source.filamentId)))

  const quick = inv.ownedFilaments.filter((f) => !state.palette.includes(f.id)).slice(0, 12)

  return (
    <div className="space-y-6">
      <StepIntro
        title="Ingredients"
        description="Pick every raw filament that goes into this color, including ones used only in an intermediate stage. You’ll set the ratios in the next step."
        action={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>Add filament</Button>}
      />

      {state.palette.length === 0 ? (
        <EmptyState
          title="No ingredients yet"
          description="Search the catalog. Filaments you own are listed first."
          action={<Button onClick={() => setOpen(true)} icon={<Plus className="size-4" />}>Choose filaments</Button>}
        />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2" role="list" aria-label="Chosen ingredients">
          {state.palette.map((id) => {
            const f = filaments[id]
            return (
              <li key={id} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 pr-2 animate-pop">
                {f ? <SpoolIcon hex={f.hex} size={40} /> : <span className="size-10 rounded-full bg-surface-3" />}
                {f ? <FilamentName filament={f} showHex className="flex-1" /> : <span className="flex-1 text-sm text-fg-muted">Loading…</span>}
                <span className="flex flex-col items-end gap-0.5 text-[11px]">
                  {inv.owns(id) ? (
                    <span className="inline-flex items-center gap-0.5 font-medium text-accent"><Check className="size-3" aria-hidden />Owned</span>
                  ) : (
                    <span className="text-fg-subtle">Not in My Filaments</span>
                  )}
                  {used.has(id) && <span className="text-fg-subtle">Used in stages</span>}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'removePalette', id })}
                  aria-label={`Remove ${f?.colorName ?? 'filament'}${used.has(id) ? ' (also removes it from stages)' : ''}`}
                  className="grid size-8 place-items-center rounded-lg text-fg-subtle hover:bg-surface-2 hover:text-fg"
                >
                  <X className="size-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {showErrors && state.palette.length === 0 && <p role="alert" className="text-sm text-danger">Add at least one filament you used.</p>}

      {quick.length > 0 && (
        <section aria-label="Quick add from My Filaments">
          <h3 className="mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">Quick add from My Filaments</h3>
          <div className="flex flex-wrap gap-2">
            {quick.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  rememberFilament(f)
                  dispatch({ type: 'addPalette', id: f.id })
                }}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-surface pr-3 pl-1 text-sm font-medium hover:border-border-strong hover:bg-surface-2"
              >
                <SpoolIcon hex={f.hex} size={26} />
                {f.colorName}
                <Plus className="size-3.5 text-fg-subtle" aria-hidden />
              </button>
            ))}
          </div>
        </section>
      )}

      <FilamentPickerDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Add an ingredient"
        onSelect={(f) => {
          rememberFilament(f)
          dispatch({ type: 'addPalette', id: f.id })
        }}
      />
    </div>
  )
}
