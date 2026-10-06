import { useState } from 'react'
import { Link } from 'react-router'
import { Bookmark, Clock, FileEdit, FolderPlus, Globe, Heart, Lock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Collection } from '@/types'
import { api } from '@/lib/api'
import { invalidate, useQuery } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { useFavorites } from '@/lib/hooks/useFavorites'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { useRecentlyViewed } from '@/lib/hooks/usePreferences'
import { timeAgo } from '@/lib/utils/format'
import {
  Badge, Button, ButtonLink, Card, Dialog, EmptyState, Field, IconButton, Input, Menu, PageHeader, SectionHeader,
  SegmentedControl, Switch, Textarea, useToast,
} from '@/components/ui'
import { ColorDot } from '@/components/color/Swatch'
import { RecipeGrid } from '@/components/recipe/RecipeCard'

type Tab = 'favorites' | 'collections' | 'recent' | 'drafts'

export default function SavedPage() {
  const { user, loading } = useSession()
  const [tab, setTab] = useState<Tab>('favorites')
  const fav = useFavorites()

  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <EmptyState icon={<Bookmark className="size-5" />} title="Save colors you love" description="Sign in to keep favorites, organize collections and pick up drafts where you left off." action={<ButtonLink to="/signin?next=/saved">Sign in</ButtonLink>} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
      <PageHeader eyebrow="Library" title="Saved" description="Your favorites, collections, recently viewed colors, and recipe drafts." />
      <div className="mb-6 overflow-x-auto">
        <SegmentedControl
          label="Saved sections"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'favorites', label: `Favorites · ${fav.ids.size}`, icon: <Heart className="size-3.5" /> },
            { value: 'collections', label: 'Collections', icon: <Bookmark className="size-3.5" /> },
            { value: 'recent', label: 'Recently viewed', icon: <Clock className="size-3.5" /> },
            { value: 'drafts', label: 'Drafts', icon: <FileEdit className="size-3.5" /> },
          ]}
        />
      </div>
      {tab === 'favorites' && <Favorites />}
      {tab === 'collections' && <Collections />}
      {tab === 'recent' && <Recent />}
      {tab === 'drafts' && <Drafts />}
    </div>
  )
}

function Favorites() {
  const fav = useFavorites()
  const ids = [...fav.ids]
  const { data, loading } = useRecipeSearch(ids.length ? { ids, sort: 'newest', limit: 100 } : null)
  if (ids.length === 0) {
    return <EmptyState icon={<Heart className="size-5" />} title="No favorites yet" description="Tap the heart on any recipe card to save it here." action={<ButtonLink to="/">Explore recipes</ButtonLink>} />
  }
  return <RecipeGrid hits={data?.items} loading={loading} skeletons={Math.min(ids.length, 8)} />
}

function Collections() {
  const { user } = useSession()
  const toast = useToast()
  const { data } = useQuery(user ? `collections:${user.id}` : null, () => api.listCollections())
  const [editing, setEditing] = useState<Partial<Collection> | null>(null)
  const [deleting, setDeleting] = useState<Collection | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = data?.find((c) => c.id === openId)

  if (open) {
    return <CollectionView collection={open} onBack={() => setOpenId(null)} onEdit={() => setEditing(open)} />
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button icon={<FolderPlus className="size-4" />} onClick={() => setEditing({ name: '', isPublic: false })}>New collection</Button>
      </div>
      {data && data.length === 0 && (
        <EmptyState icon={<Bookmark className="size-5" />} title="No collections" description="Group recipes by project, like “Planter pastels” or “Terrain greens”." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((c) => (
          <CollectionTile
            key={c.id}
            collection={c}
            onOpen={() => setOpenId(c.id)}
            onEdit={() => setEditing(c)}
            onDelete={() => setDeleting(c)}
            onTogglePublic={async () => {
              await api.saveCollection({ ...c, isPublic: !c.isPublic })
              invalidate('collections')
              toast(c.isPublic ? 'Collection is now private' : 'Collection is now public', { tone: 'info' })
            }}
          />
        ))}
      </div>
      <CollectionDialog value={editing} onClose={() => setEditing(null)} />
      <Dialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete collection?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="danger" onClick={async () => {
              await api.deleteCollection(deleting!.id)
              invalidate('collections')
              toast(`Deleted “${deleting!.name}”`, { tone: 'info' })
              setDeleting(null)
            }}>Delete</Button>
          </>
        }
      >
        <p className="text-sm text-fg-muted">“{deleting?.name}” will be removed. The recipes themselves stay in your favorites.</p>
      </Dialog>
    </div>
  )
}

function CollectionTile({ collection: c, onOpen, onEdit, onDelete, onTogglePublic }: { collection: Collection; onOpen: () => void; onEdit: () => void; onDelete: () => void; onTogglePublic: () => void }) {
  const { data } = useRecipeSearch(c.recipeIds.length ? { ids: c.recipeIds, limit: 8 } : null)
  return (
    <Card interactive className="group relative overflow-hidden">
      <button type="button" onClick={onOpen} className="block w-full text-left" aria-label={`Open collection ${c.name}`}>
        <div className="flex h-24">
          {(data?.items ?? []).slice(0, 6).map((h) => <div key={h.recipe.id} className="color-transition flex-1" style={{ background: h.recipe.resultHex }} />)}
          {c.recipeIds.length === 0 && <div className="grid flex-1 place-items-center bg-surface-2 text-xs text-fg-subtle">Empty</div>}
        </div>
        <div className="p-4 pr-12">
          <div className="flex items-center gap-2 font-medium">
            {c.name}
            <Badge size="xs" icon={c.isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}>{c.isPublic ? 'Public' : 'Private'}</Badge>
          </div>
          <div className="mt-0.5 text-sm text-fg-muted">{c.recipeIds.length} recipes{c.description && ` · ${c.description}`}</div>
        </div>
      </button>
      <div className="absolute right-3 bottom-4">
        <Menu
          label={`${c.name} options`}
          trigger={(p) => <IconButton {...p} label={`Options for ${c.name}`} size="sm"><MoreHorizontal className="size-4" /></IconButton>}
          items={[
            { label: 'Rename / edit', icon: <Pencil className="size-4" />, onSelect: onEdit },
            { label: c.isPublic ? 'Make private' : 'Make public', icon: c.isPublic ? <Lock className="size-4" /> : <Globe className="size-4" />, onSelect: onTogglePublic },
            { divider: true, label: '' },
            { label: 'Delete', icon: <Trash2 className="size-4" />, danger: true, onSelect: onDelete },
          ]}
        />
      </div>
    </Card>
  )
}

function CollectionView({ collection: c, onBack, onEdit }: { collection: Collection; onBack: () => void; onEdit: () => void }) {
  const { data, loading } = useRecipeSearch(c.recipeIds.length ? { ids: c.recipeIds, limit: 100 } : null)
  return (
    <div>
      <button type="button" onClick={onBack} className="mb-3 text-sm text-fg-muted hover:text-fg">← All collections</button>
      <SectionHeader
        title={<>{c.name} <Badge size="xs" icon={c.isPublic ? <Globe className="size-3" /> : <Lock className="size-3" />}>{c.isPublic ? 'Public' : 'Private'}</Badge></>}
        subtitle={c.description}
        action={<Button variant="outline" size="sm" icon={<Pencil className="size-4" />} onClick={onEdit}>Edit</Button>}
      />
      {c.recipeIds.length === 0 ? (
        <EmptyState title="This collection is empty" description="Add recipes from a recipe page using “Save”." />
      ) : (
        <RecipeGrid hits={data?.items} loading={loading} />
      )}
    </div>
  )
}

function CollectionDialog({ value, onClose }: { value: Partial<Collection> | null; onClose: () => void }) {
  const toast = useToast()
  const [form, setForm] = useState({ name: '', description: '', isPublic: false })
  const [lastKey, setLastKey] = useState<string | null>(null)
  const key = value ? value.id ?? 'new' : null
  if (key !== lastKey) {
    setLastKey(key)
    if (value) setForm({ name: value.name ?? '', description: value.description ?? '', isPublic: value.isPublic ?? false })
  }
  const [saving, setSaving] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await api.saveCollection({ ...value, name: form.name.trim(), description: form.description.trim() || undefined, isPublic: form.isPublic })
    invalidate('collections')
    setSaving(false)
    toast(value?.id ? 'Collection updated' : `Created “${form.name.trim()}”`)
    onClose()
  }
  return (
    <Dialog
      open={!!value}
      onClose={onClose}
      title={value?.id ? 'Edit collection' : 'New collection'}
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button type="submit" form="collection-form" loading={saving} disabled={!form.name.trim()}>Save</Button></>}
    >
      <form id="collection-form" onSubmit={submit} className="space-y-4">
        <Field label="Name" htmlFor="col-name"><Input id="col-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Planter pastels" required autoFocus /></Field>
        <Field label="Description" optional htmlFor="col-desc"><Textarea id="col-desc" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Switch checked={form.isPublic} onChange={(v) => setForm({ ...form, isPublic: v })} label="Public" description="Show this collection on your profile." />
      </form>
    </Dialog>
  )
}

function Recent() {
  const recent = useRecentlyViewed()
  if (recent.items.length === 0) {
    return <EmptyState icon={<Clock className="size-5" />} title="Nothing viewed yet" description="Recipes you open will show up here so you can find them again." />
  }
  return (
    <div>
      <div className="mb-3 flex justify-end"><Button variant="ghost" size="sm" onClick={recent.clear}>Clear history</Button></div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="list">
        {recent.items.map((r) => (
          <li key={r.id}>
            <Link to={`/r/${r.slug}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-shadow hover:shadow-md">
              <ColorDot hex={r.hex} size={40} className="rounded-lg!" />
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name}</div>
                <div className="font-mono text-xs text-fg-muted">{r.hex}</div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Drafts() {
  const { user } = useSession()
  const { data, loading } = useQuery(user ? `recipes:drafts:${user.id}` : null, () => api.listDrafts())
  if (!loading && !data?.length) {
    return <EmptyState icon={<FileEdit className="size-5" />} title="No drafts" description="Recipes you start but don’t publish are saved here automatically." action={<ButtonLink to="/create">Start a recipe</ButtonLink>} />
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="list">
      {data?.map((d) => (
        <li key={d.id}>
          <Link to={`/create/${d.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-shadow hover:shadow-md">
            <ColorDot hex={d.resultHex} size={44} className="rounded-lg!" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{d.name || 'Untitled recipe'}</div>
              <div className="text-xs text-fg-muted">{d.stages.length} stages · edited {timeAgo(d.updatedAt)}</div>
            </div>
            <Badge tone="warn" size="xs">Draft</Badge>
          </Link>
        </li>
      ))}
    </ul>
  )
}
