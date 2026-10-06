import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Award, CalendarDays, Lock, MapPin, Pencil, Printer, UserCheck, UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import { invalidate, useQuery } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { formatDate, timeAgo } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import {
  Avatar, Badge, Button, ButtonLink, Card, EmptyState, SegmentedControl, Skeleton, useToast,
} from '@/components/ui'
import { ColorPair, DeltaEMeter } from '@/components/color/Compare'
import { ColorDot } from '@/components/color/Swatch'
import { RecipeGrid } from '@/components/recipe/RecipeCard'
import { FilamentName, SpoolIcon } from '@/components/filament/Spool'

type Tab = 'recipes' | 'reproductions' | 'collections' | 'filaments'

export default function ProfilePage() {
  const { username } = useParams()
  const { user } = useSession()
  const { data, loading } = useQuery(username ? `profile:${username}` : null, () => api.getProfile(username!), ['session', 'follows'])
  const [tab, setTab] = useState<Tab>('recipes')
  const toast = useToast()
  const navigate = useNavigate()
  const [following, setFollowing] = useState<boolean | null>(null)

  if (loading) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">
        <div className="flex items-center gap-5"><Skeleton className="size-24 rounded-full" /><div className="space-y-2"><Skeleton className="h-7 w-56" /><Skeleton className="h-4 w-40" /></div></div>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <EmptyState title="Maker not found" description={`There’s no one called @${username} on SpoolShare.`} action={<ButtonLink to="/">Back to Explore</ButtonLink>} />
      </div>
    )
  }

  const { profile, stats, achievements } = data
  const isMe = user?.id === profile.id
  const isFollowing = following ?? data.isFollowing

  const toggleFollow = async () => {
    if (!user) return navigate(`/signin?next=/u/${profile.username}`)
    setFollowing(!isFollowing)
    try {
      const on = await api.toggleFollow(profile.id)
      setFollowing(on)
      invalidate('profile')
      toast(on ? `Following ${profile.displayName}` : `Unfollowed ${profile.displayName}`, { tone: on ? 'success' : 'info' })
    } catch (e) {
      setFollowing(null)
      toast((e as Error).message, { tone: 'error' })
    }
  }

  const statItems: [string, number][] = [
    ['Recipes', stats.recipes],
    ['Reproductions made', stats.reproductions],
    ['Favorites received', stats.favoritesReceived],
    ['Times reproduced', stats.reproductionsReceived],
    ['Followers', stats.followers + (following != null && following !== data.isFollowing ? (following ? 1 : -1) : 0)],
    ['Following', stats.following],
  ]

  return (
    <div>
      <div className="relative h-28 overflow-hidden border-b border-border sm:h-36" aria-hidden
        style={{ background: `linear-gradient(120deg, hsl(${profile.avatarHue} 55% 82%), hsl(${(profile.avatarHue + 50) % 360} 60% 88%), hsl(${(profile.avatarHue + 300) % 360} 45% 80%))` }}>
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgb(0 0 0 / .6) 0 1px, transparent 1px 4px)' }} />
      </div>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        <div className="relative -mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <Avatar profile={profile} size="xl" className="ring-4 ring-bg" />
            <div className="min-w-0 pb-1 sm:pt-14">
              <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {profile.displayName}
                {profile.role === 'moderator' && <Badge tone="accent" size="xs">Moderator</Badge>}
              </h1>
              <div className="text-sm text-fg-muted">@{profile.username}</div>
            </div>
          </div>
          <div className="flex gap-2 sm:pb-1">
            {isMe ? (
              <ButtonLink to="/settings" variant="outline" icon={<Pencil className="size-4" />}>Edit profile</ButtonLink>
            ) : (
              <Button variant={isFollowing ? 'outline' : 'primary'} onClick={toggleFollow} aria-pressed={isFollowing} icon={isFollowing ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        {profile.bio && <p className="mt-4 max-w-2xl text-fg">{profile.bio}</p>}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-fg-muted">
          {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" aria-hidden />{profile.location}</span>}
          {profile.printers.length > 0 && <span className="inline-flex items-center gap-1.5"><Printer className="size-4" aria-hidden />{profile.printers.join(', ')}</span>}
          <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" aria-hidden />Joined {formatDate(profile.joinedAt)}</span>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-6">
          {statItems.map(([label, value]) => (
            <div key={label} className="bg-surface px-4 py-3">
              <dt className="text-xs text-fg-subtle">{label}</dt>
              <dd className="text-xl font-semibold tabular">{value}</dd>
            </div>
          ))}
        </dl>

        <section aria-label="Achievements" className="mt-5 flex flex-wrap gap-2">
          {achievements.map((a) => (
            <span
              key={a.id}
              title={`${a.description}${a.earned ? '' : ' (locked)'}`}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium',
                a.earned ? 'border-accent/30 bg-accent-soft text-accent-soft-fg' : 'border-dashed border-border-strong text-fg-subtle',
              )}
            >
              {a.earned ? <Award className="size-3.5" aria-hidden /> : <Lock className="size-3.5" aria-hidden />}
              {a.label}
              <span className="sr-only">{a.earned ? '(earned)' : '(locked)'}: {a.description}</span>
            </span>
          ))}
        </section>

        <div className="mt-8 overflow-x-auto">
          <SegmentedControl
            label="Profile sections"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'recipes', label: `Recipes · ${stats.recipes}` },
              { value: 'reproductions', label: `Reproductions · ${stats.reproductions}` },
              { value: 'collections', label: 'Collections' },
              { value: 'filaments', label: 'Filaments' },
            ]}
          />
        </div>

        <div className="mt-6">
          {tab === 'recipes' && <RecipesTab authorId={profile.id} isMe={isMe} />}
          {tab === 'reproductions' && <ReproductionsTab userId={profile.id} />}
          {tab === 'collections' && <CollectionsTab userId={profile.id} isMe={isMe} />}
          {tab === 'filaments' && <FilamentsTab userId={profile.id} isPrivate={profile.inventoryVisibility === 'private'} isMe={isMe} />}
        </div>
      </div>
    </div>
  )
}

function RecipesTab({ authorId, isMe }: { authorId: string; isMe: boolean }) {
  const { data, loading } = useRecipeSearch({ authorId, sort: 'newest', limit: 60 })
  if (data && data.items.length === 0) {
    return <EmptyState title="No recipes yet" description={isMe ? 'Share your first tested color with the community.' : 'This maker hasn’t published a recipe yet.'} action={isMe && <ButtonLink to="/create">Create a recipe</ButtonLink>} />
  }
  return <RecipeGrid hits={data?.items} loading={loading} skeletons={4} />
}

function ReproductionsTab({ userId }: { userId: string }) {
  const { data, loading } = useQuery(`reproductions:user:${userId}`, () => api.listUserReproductions(userId))
  if (loading) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}</div>
  if (!data?.length) return <EmptyState title="No reproductions yet" description="Reproductions are how the community verifies recipes. Make someone’s color and click “I Made This”." />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((r) => (
        <Link key={r.id} to={`/r/${r.recipe.slug}`} className="group">
          <Card interactive className="p-3">
            <ColorPair a={r.recipe.resultHex} b={r.resultHex} aLabel="Original" bLabel="Their result" className="h-24" />
            <div className="mt-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="truncate font-medium group-hover:underline">{r.recipe.name}</div>
                <div className="text-xs text-fg-muted">{timeAgo(r.createdAt)}{r.printer && ` · ${r.printer}`}</div>
              </div>
              <span className="text-xs text-fg-muted" aria-label={`Rated ${r.accuracyRating} of 5`}>{'★'.repeat(r.accuracyRating)}<span className="opacity-30">{'★'.repeat(5 - r.accuracyRating)}</span></span>
            </div>
            <DeltaEMeter value={r.deltaE} className="mt-2" />
            {r.notes && <p className="mt-2 line-clamp-2 text-sm text-fg-muted">“{r.notes}”</p>}
          </Card>
        </Link>
      ))}
    </div>
  )
}

function CollectionsTab({ userId, isMe }: { userId: string; isMe: boolean }) {
  const { data, loading } = useQuery(`collections:user:${userId}`, () => api.listCollections(userId))
  const shown = data?.filter((c) => isMe || c.isPublic)
  if (loading) return <Skeleton className="h-32 rounded-xl" />
  if (!shown?.length) return <EmptyState title="No public collections" description={isMe ? 'Group saved recipes into collections from your Saved page.' : 'This maker hasn’t shared any collections.'} action={isMe && <ButtonLink to="/saved">Go to Saved</ButtonLink>} />
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {shown.map((c) => <CollectionCard key={c.id} name={c.name} description={c.description} ids={c.recipeIds} isPublic={c.isPublic} />)}
    </div>
  )
}

function CollectionCard({ name, description, ids, isPublic }: { name: string; description?: string; ids: string[]; isPublic: boolean }) {
  const { data } = useRecipeSearch(ids.length ? { ids, limit: 8 } : null)
  return (
    <Card className="overflow-hidden">
      <div className="flex h-20">
        {(data?.items ?? []).slice(0, 6).map((h) => <div key={h.recipe.id} className="flex-1" style={{ background: h.recipe.resultHex }} title={h.recipe.name} />)}
        {ids.length === 0 && <div className="flex-1 bg-surface-2" />}
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 font-medium">{name}{!isPublic && <Badge size="xs" icon={<Lock className="size-3" />}>Private</Badge>}</div>
        {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {data?.items.map((h) => (
            <Link key={h.recipe.id} to={`/r/${h.recipe.slug}`} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs hover:border-border-strong">
              <ColorDot hex={h.recipe.resultHex} size={10} />{h.recipe.name}
            </Link>
          ))}
        </div>
      </div>
    </Card>
  )
}

function FilamentsTab({ userId, isPrivate, isMe }: { userId: string; isPrivate: boolean; isMe: boolean }) {
  const { data, loading } = useQuery(`inventory:public:${userId}`, () => api.getInventory(userId))
  if (isPrivate && !isMe) {
    return <EmptyState icon={<Lock className="size-5" />} title="Filament collection is private" description="This maker has chosen to keep their inventory private." />
  }
  if (loading) return <Skeleton className="h-32 rounded-xl" />
  if (!data?.length) return <EmptyState title="No filaments listed" description={isMe ? 'Add spools to your collection.' : 'Nothing on this shelf yet.'} action={isMe && <ButtonLink to="/filaments">My Filaments</ButtonLink>} />
  return (
    <div>
      {isMe && isPrivate && <p className="mb-3 flex items-center gap-1.5 text-sm text-fg-muted"><Lock className="size-4" /> Only you can see this. Change it in Settings.</p>}
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {data.map((i) => (
          <li key={i.id}>
            <Link to={`/filament/${i.filament.id}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 hover:shadow-sm">
              <SpoolIcon hex={i.filament.hex} size={38} />
              <FilamentName filament={i.filament} showHex />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
