import { BAMBU_PRINTERS } from '@/types'
import { useState } from 'react'
import { X } from 'lucide-react'
import { FINISHES, MATERIALS, MIXING_METHODS, type Finish, type Material, type MixingMethod } from '@/types'
import { useSession } from '@/lib/hooks/useSession'
import { Field, Input, Select, Textarea, inputClass } from '@/components/ui'
import { cn } from '@/lib/utils/cn'
import { useWizard } from '../context'
import { StepIntro } from './StepIntro'

const cap = (s: string) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')

export function BasicsStep({ showErrors }: { showErrors: boolean }) {
  const { state, dispatch } = useWizard()
  const { user } = useSession()
  const d = state.draft
  const patch = (p: Partial<typeof d>) => dispatch({ type: 'patch', patch: p })
  const nameError = showErrors && !d.name.trim() ? 'Give your recipe a name.' : undefined

  return (
    <div className="space-y-6">
      <StepIntro title="Basic information" description="Name your color and describe how it was printed. You can change all of this later." />

      <Field label="Recipe name" htmlFor="r-name" error={nameError} hint="Short and descriptive, e.g. “Dusty Lavender”.">
        <Input
          id="r-name"
          value={d.name}
          maxLength={60}
          autoFocus
          aria-invalid={!!nameError}
          onChange={(e) => patch({ name: e.target.value })}
          placeholder="Dusty Lavender"
          className="text-base"
        />
      </Field>

      <Field label="Description" htmlFor="r-desc" hint={`${d.description.length}/400 · What makes this color special? Any context people should know?`}>
        <Textarea
          id="r-desc"
          rows={3}
          maxLength={400}
          value={d.description}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="A soft lavender made using a diluted cobalt-blue intermediate."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Material" htmlFor="r-mat">
          <Select id="r-mat" value={d.material} onChange={(e) => patch({ material: e.target.value as Material })}>
            {MATERIALS.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Finish" htmlFor="r-fin">
          <Select id="r-fin" value={d.finish} onChange={(e) => patch({ finish: e.target.value as Finish })}>
            {FINISHES.map((f) => <option key={f} value={f}>{cap(f)}</option>)}
          </Select>
        </Field>
        <Field label="Mixing method" htmlFor="r-method">
          <Select id="r-method" value={d.mixingMethod} onChange={(e) => patch({ mixingMethod: e.target.value as MixingMethod })}>
            {MIXING_METHODS.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Printer" optional htmlFor="r-printer">
          <Select id="r-printer" value={d.printer ?? ''} onChange={(e) => patch({ printer: e.target.value || undefined })}>
            <option value="">Not specified</option>
            {BAMBU_PRINTERS.map((p) => <option key={p} value={p}>{p}{user?.printers.includes(p) ? ' (yours)' : ''}</option>)}
            {d.printer && !(BAMBU_PRINTERS as readonly string[]).includes(d.printer) && <option value={d.printer}>{d.printer}</option>}
          </Select>
        </Field>
        <Field label="Nozzle" optional htmlFor="r-nozzle">
          <Input id="r-nozzle" value={d.nozzle ?? ''} onChange={(e) => patch({ nozzle: e.target.value || undefined })} placeholder="0.4 mm hardened steel" />
        </Field>
        <Field label="Layer height" optional htmlFor="r-layer">
          <Input id="r-layer" value={d.layerHeight ?? ''} onChange={(e) => patch({ layerHeight: e.target.value || undefined })} placeholder="0.20 mm" />
        </Field>
      </div>
      {user && user.printers.length > 0 && !d.printer && (
        <div className="-mt-3 flex flex-wrap items-center gap-1.5 text-xs text-fg-muted">
          Your printers:
          {user.printers.map((p) => (
            <button key={p} type="button" onClick={() => patch({ printer: p })} className="rounded-full border border-border px-2 py-0.5 font-medium text-fg hover:border-border-strong">
              {p}
            </button>
          ))}
        </div>
      )}

      <TagInput tags={d.tags} onChange={(tags) => patch({ tags })} />
    </div>
  )
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [text, setText] = useState('')
  const add = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/^#/, '').slice(0, 24)
    if (t && !tags.includes(t) && tags.length < 8) onChange([...tags, t])
    setText('')
  }
  return (
    <Field label="Tags" optional htmlFor="r-tags" hint="Press Enter or comma to add. Up to 8 tags, e.g. pastel, terrain, planters.">
      <div className={cn(inputClass, 'flex min-h-10 flex-wrap items-center gap-1.5 py-1.5 focus-within:border-accent focus-within:ring-3 focus-within:ring-[var(--ring)]')}>
        {tags.map((t) => (
          <span key={t} className="inline-flex h-6 items-center gap-1 rounded-full bg-surface-2 pr-1 pl-2.5 text-xs font-medium">
            {t}
            <button type="button" onClick={() => onChange(tags.filter((x) => x !== t))} aria-label={`Remove tag ${t}`} className="grid size-4 place-items-center rounded-full text-fg-subtle hover:bg-surface-3 hover:text-fg">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id="r-tags"
          value={text}
          onChange={(e) => (e.target.value.endsWith(',') ? add(e.target.value.slice(0, -1)) : setText(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add(text) }
            else if (e.key === 'Backspace' && !text && tags.length) onChange(tags.slice(0, -1))
          }}
          onBlur={() => text && add(text)}
          placeholder={tags.length ? '' : 'pastel, purple…'}
          disabled={tags.length >= 8}
          className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-fg-subtle"
        />
      </div>
    </Field>
  )
}
