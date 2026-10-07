import { Plus, Trash2 } from 'lucide-react'
import type { PrintIdea } from '@/types'
import { uid } from '@/lib/utils/id'
import { siteFromUrl } from '@/features/recipe/MadeWithSection'
import { Button, IconButton, Input } from '@/components/ui'

const SUGGESTIONS = ['Flowers', 'Planters', 'Vases', 'Articulated dragons', 'Desk accessories', 'Tabletop terrain', 'Cosplay props', 'Trinket boxes']
const MAX = 12

/** Optional "Looks great on" list. Links are external and only ever linked, never hosted. */
export function PrintIdeasEditor({ ideas, onChange }: { ideas: PrintIdea[]; onChange: (ideas: PrintIdea[]) => void }) {
  const update = (id: string, patch: Partial<PrintIdea>) => onChange(ideas.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  const add = (title = '') => ideas.length < MAX && onChange([...ideas, { id: uid('idea'), title }])

  return (
    <section aria-labelledby="ideas-title">
      <h3 id="ideas-title" className="text-sm font-semibold">Looks great on <span className="font-normal text-fg-subtle">(optional)</span></h3>
      <p className="mt-0.5 mb-3 text-sm text-fg-muted">
        What would you print in this color? Add ideas, optionally linking to a model on MakerWorld, Printables or another site.
        Linked models stay credited to, and hosted by, their creators.
      </p>

      {ideas.length > 0 && (
        <ul className="mb-3 space-y-2" role="list">
          {ideas.map((idea, k) => {
            const badUrl = !!idea.url && !/^https?:\/\/\S+\.\S+/i.test(idea.url)
            return (
              <li key={idea.id} className="grid gap-2 rounded-lg border border-border bg-surface p-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto]">
                <div>
                  <label className="sr-only" htmlFor={`${idea.id}-t`}>Idea {k + 1} title</label>
                  <Input id={`${idea.id}-t`} value={idea.title} onChange={(e) => update(idea.id, { title: e.target.value })} placeholder="e.g. Flowers" maxLength={60} aria-invalid={!idea.title.trim()} />
                </div>
                <div>
                  <label className="sr-only" htmlFor={`${idea.id}-u`}>Idea {k + 1} link (optional)</label>
                  <Input
                    id={`${idea.id}-u`}
                    type="url"
                    inputMode="url"
                    value={idea.url ?? ''}
                    onChange={(e) => {
                      const url = e.target.value.trim()
                      update(idea.id, { url: url || undefined, site: url ? siteFromUrl(url) : undefined })
                    }}
                    placeholder="https://makerworld.com/… (optional)"
                    aria-invalid={badUrl}
                  />
                  {badUrl && <p role="alert" className="mt-1 text-xs text-danger">Links must start with https://</p>}
                </div>
                <IconButton label={`Remove idea ${k + 1}`} size="md" onClick={() => onChange(ideas.filter((i) => i.id !== idea.id))}>
                  <Trash2 className="size-4" />
                </IconButton>
                <div className="sm:col-span-3">
                  <label className="sr-only" htmlFor={`${idea.id}-n`}>Idea {k + 1} note</label>
                  <Input id={`${idea.id}-n`} value={idea.note ?? ''} onChange={(e) => update(idea.id, { note: e.target.value || undefined })} placeholder="Why it works (optional), e.g. “petals look soft and natural”" maxLength={160} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="outline" icon={<Plus className="size-4" />} onClick={() => add()} disabled={ideas.length >= MAX}>Add idea</Button>
        {ideas.length === 0 &&
          SUGGESTIONS.slice(0, 5).map((t) => (
            <button key={t} type="button" onClick={() => add(t)} className="h-8 rounded-md border border-border px-2.5 text-sm text-fg-muted hover:border-border-strong hover:text-fg">
              + {t}
            </button>
          ))}
      </div>
    </section>
  )
}
