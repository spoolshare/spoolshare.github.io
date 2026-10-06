import { useState } from 'react'
import { Check, FolderPlus, Lock, Globe } from 'lucide-react'
import type { ID, ReportReason } from '@/types'
import { api } from '@/lib/api'
import { invalidate, useQuery } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { cn } from '@/lib/utils/cn'
import { Button, Dialog, Field, Input, Switch, Textarea, useToast } from '@/components/ui'

export function CollectionsDialog({ open, onClose, recipeId, recipeName }: { open: boolean; onClose: () => void; recipeId: ID; recipeName: string }) {
  const { user } = useSession()
  const toast = useToast()
  const { data: collections } = useQuery(user && open ? `collections:${user.id}` : null, () => api.listCollections())
  const [name, setName] = useState('')
  const [isPublic, setPublic] = useState(false)
  const [creating, setCreating] = useState(false)

  const toggle = async (id: ID) => {
    await api.toggleInCollection(id, recipeId)
    invalidate('collections')
  }

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      await api.saveCollection({ name: name.trim(), isPublic, recipeIds: [recipeId] })
      invalidate('collections')
      toast(<>Added to <b>{name.trim()}</b></>)
      setName('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Add to collection" description={`Organize “${recipeName}” into your collections.`} size="sm">
      <ul className="-mx-1 space-y-1" role="list">
        {collections?.length === 0 && <li className="px-1 py-2 text-sm text-fg-muted">No collections yet. Create one below.</li>}
        {collections?.map((c) => {
          const inIt = c.recipeIds.includes(recipeId)
          return (
            <li key={c.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={inIt}
                onClick={() => toggle(c.id)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-2"
              >
                <span className={cn('grid size-5 place-items-center rounded border', inIt ? 'border-accent bg-accent text-accent-fg' : 'border-border-strong')}>
                  {inIt && <Check className="size-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="text-xs text-fg-muted">{c.recipeIds.length} recipes</span>
                </span>
                {c.isPublic ? <Globe className="size-3.5 text-fg-subtle" aria-label="Public" /> : <Lock className="size-3.5 text-fg-subtle" aria-label="Private" />}
              </button>
            </li>
          )
        })}
      </ul>
      <form onSubmit={create} className="mt-4 space-y-3 border-t border-border pt-4">
        <Field label="New collection" htmlFor="new-col">
          <Input id="new-col" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Planter colors" />
        </Field>
        <div className="flex items-center justify-between">
          <Switch checked={isPublic} onChange={setPublic} label="Public" size="sm" />
          <Button type="submit" size="sm" icon={<FolderPlus className="size-4" />} loading={creating} disabled={!name.trim()}>Create & add</Button>
        </div>
      </form>
    </Dialog>
  )
}

const REASONS: { value: ReportReason; label: string; hint: string }[] = [
  { value: 'inaccurate', label: 'Inaccurate or misleading', hint: 'The recipe doesn’t produce the shown color, or the photo is edited.' },
  { value: 'stolen', label: 'Copied without credit', hint: 'Someone else’s recipe or photo posted as their own.' },
  { value: 'unsafe', label: 'Unsafe instructions', hint: 'E.g. dangerous temperatures or mixing incompatible materials.' },
  { value: 'spam', label: 'Spam or advertising', hint: '' },
  { value: 'offensive', label: 'Offensive content', hint: '' },
  { value: 'other', label: 'Something else', hint: '' },
]

export function ReportDialog({ open, onClose, targetId, targetType = 'recipe' }: { open: boolean; onClose: () => void; targetId: ID; targetType?: 'recipe' | 'comment' | 'reproduction' | 'user' }) {
  const toast = useToast()
  const [reason, setReason] = useState<ReportReason>('inaccurate')
  const [details, setDetails] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    try {
      await api.report({ targetType, targetId, reason, details: details.trim() || undefined })
      toast('Thanks. A moderator will review this report.')
      setDetails('')
      onClose()
    } catch (err) {
      toast((err as Error).message, { tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Report this recipe"
      description="Reports are private and reviewed by community moderators."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="report-form" variant="danger" loading={sending}>Submit report</Button>
        </>
      }
    >
      <form id="report-form" onSubmit={submit} className="space-y-4">
        <fieldset className="space-y-1.5">
          <legend className="mb-2 text-sm font-medium">Reason</legend>
          {REASONS.map((r) => (
            <label key={r.value} className={cn('flex cursor-pointer gap-3 rounded-lg border p-3', reason === r.value ? 'border-accent bg-accent-soft/50' : 'border-border hover:bg-surface-2')}>
              <input type="radio" name="reason" value={r.value} checked={reason === r.value} onChange={() => setReason(r.value)} className="mt-0.5 accent-[var(--accent)]" />
              <span>
                <span className="block text-sm font-medium">{r.label}</span>
                {r.hint && <span className="block text-xs text-fg-muted">{r.hint}</span>}
              </span>
            </label>
          ))}
        </fieldset>
        <Field label="Details" optional htmlFor="report-details">
          <Textarea id="report-details" rows={3} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Anything that helps moderators understand the problem" />
        </Field>
      </form>
    </Dialog>
  )
}
