import { useEffect, useMemo } from 'react'
import { Link } from 'react-router'
import { AtSign, Bell, Heart, MessageCircle, Repeat2, UserPlus } from 'lucide-react'
import type { NotificationKind } from '@/types'
import { api, type NotificationView } from '@/lib/api'
import { invalidate, useQuery } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { timeAgo } from '@/lib/utils/format'
import { cn } from '@/lib/utils/cn'
import { Avatar, ButtonLink, EmptyState, PageHeader, Skeleton } from '@/components/ui'
import { ColorDot } from '@/components/color/Swatch'

const KIND: Record<NotificationKind, { icon: typeof Bell; verb: string; tone: string }> = {
  reproduced: { icon: Repeat2, verb: 'reproduced your', tone: 'bg-accent-soft text-accent-soft-fg' },
  commented: { icon: MessageCircle, verb: 'commented on your', tone: 'bg-info-soft text-info' },
  followed: { icon: UserPlus, verb: 'started following you', tone: 'bg-calc-soft text-calc' },
  favorited: { icon: Heart, verb: 'saved your', tone: 'bg-danger-soft text-danger' },
  mentioned: { icon: AtSign, verb: 'mentioned you on', tone: 'bg-warn-soft text-warn' },
}

export default function NotificationsPage() {
  const { user, loading: sessionLoading } = useSession()
  const { data, loading } = useQuery(user ? `notifications:${user.id}` : null, () => api.listNotifications())

  // Snapshot unread ids on first load so highlights survive marking as read.
  const unreadIds = useMemo(() => new Set(data?.filter((n) => !n.read).map((n) => n.id)), [!!data]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (data?.some((n) => !n.read)) {
      void api.markNotificationsRead().then(() => invalidate('notifications'))
    }
  }, [data])

  const groups = useMemo(() => {
    const now = Date.now()
    const out: { label: string; items: NotificationView[] }[] = [
      { label: 'Today', items: [] },
      { label: 'This week', items: [] },
      { label: 'Earlier', items: [] },
    ]
    data?.forEach((n) => {
      const age = (now - Date.parse(n.createdAt)) / 86400000
      out[age < 1 ? 0 : age < 7 ? 1 : 2].items.push(n)
    })
    return out.filter((g) => g.items.length)
  }, [data])

  if (!sessionLoading && !user) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <EmptyState icon={<Bell className="size-5" />} title="Sign in to see notifications" action={<ButtonLink to="/signin?next=/notifications">Sign in</ButtonLink>} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader title="Notifications" description="Reproductions, comments, follows and saves on your work." />
      {loading && <div className="space-y-3">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>}
      {data && data.length === 0 && (
        <EmptyState icon={<Bell className="size-5" />} title="All quiet" description="When someone reproduces, comments on, or saves your recipes, you’ll see it here." />
      )}
      <div className="space-y-8">
        {groups.map((g) => (
          <section key={g.label} aria-label={g.label}>
            <h2 className="mb-2 text-xs font-semibold tracking-wide text-fg-subtle uppercase">{g.label}</h2>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface" role="list">
              {g.items.map((n) => <Row key={n.id} n={n} unread={unreadIds.has(n.id)} />)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function Row({ n, unread }: { n: NotificationView; unread: boolean }) {
  const k = KIND[n.kind]
  const Icon = k.icon
  const href = n.recipe ? `/r/${n.recipe.slug}` : `/u/${n.actor.username}`
  return (
    <li className={cn('relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-2', unread && 'bg-accent-soft/40')}>
      <div className="relative">
        <Avatar profile={n.actor} size="md" />
        <span className={cn('absolute -right-1 -bottom-1 grid size-5 place-items-center rounded-full ring-2 ring-surface', k.tone)} aria-hidden>
          <Icon className="size-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1 text-sm">
        <Link to={href} className="after:absolute after:inset-0">
          <b className="font-semibold">{n.actor.displayName}</b> {k.verb}
          {n.recipe && <> <b className="font-semibold">{n.recipe.name}</b></>}
        </Link>
        <div className="text-xs text-fg-muted">{timeAgo(n.createdAt)}{unread && <span className="ml-2 font-semibold text-accent">New</span>}</div>
      </div>
      {n.recipe && <ColorDot hex={n.recipe.resultHex} size={28} label={`${n.recipe.name}, ${n.recipe.resultHex}`} className="rounded-lg!" />}
    </li>
  )
}
