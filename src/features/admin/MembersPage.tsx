import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Lock, Users } from 'lucide-react'
import { api, type MemberRow } from '@/lib/api'
import { useQuery } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { formatDate, timeAgo } from '@/lib/utils/format'
import { Avatar, Badge, ButtonLink, EmptyState, PageHeader, SearchInput, Skeleton, Stat } from '@/components/ui'

/** Admin-only list of everyone with an account. Emails are only ever returned to admins (enforced in SQL). */
export default function MembersPage() {
  const { user, loading } = useSession()
  const isAdmin = user?.role === 'admin'
  const { data, error, loading: loadingRows } = useQuery(isAdmin ? 'members:list' : null, () => api.listMembers(), ['session'])
  const [q, setQ] = useState('')

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase()
    return (data ?? []).filter((m) => !t || `${m.profile.displayName} ${m.profile.username} ${m.email ?? ''}`.toLowerCase().includes(t))
  }, [data, q])

  if (loading) return <Wrap><Skeleton className="h-40" /></Wrap>
  if (!isAdmin) {
    return (
      <Wrap>
        <EmptyState
          icon={<Lock className="size-5" />}
          title="Admins only"
          description="This page lists every member’s account details, so only SpoolShare admins can open it."
          action={<ButtonLink to="/" variant="outline">Back to Explore</ButtonLink>}
        />
      </Wrap>
    )
  }

  const all = data ?? []
  const weekAgo = Date.now() - 7 * 86400000
  return (
    <Wrap>
      <PageHeader eyebrow="Admin" title="Members" description="Everyone with a SpoolShare account. Email addresses are private and visible only to admins." />

      <div className="mb-6 grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
        <Stat label="Members" value={all.length} />
        <Stat label="Joined this week" value={all.filter((m) => Date.parse(m.profile.joinedAt) > weekAgo).length} />
        <Stat label="Have published" value={all.filter((m) => m.recipeCount > 0).length} />
        <Stat label="Have reproduced" value={all.filter((m) => m.reproductionCount > 0).length} />
      </div>

      <SearchInput value={q} onChange={setQ} placeholder="Search name, username, or email…" className="mb-4 max-w-md" label="Search members" />

      {error && <p role="alert" className="mb-4 text-sm text-danger">{error.message}</p>}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-surface-2 text-left text-xs font-semibold tracking-wide text-fg-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-2.5">Member</th>
              <th scope="col" className="px-4 py-2.5">Email</th>
              <th scope="col" className="px-4 py-2.5">Joined</th>
              <th scope="col" className="px-4 py-2.5">Last sign-in</th>
              <th scope="col" className="px-4 py-2.5 text-right">Recipes</th>
              <th scope="col" className="px-4 py-2.5 text-right">Reproductions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loadingRows && !data && (
              <tr><td colSpan={6} className="px-4 py-6"><Skeleton className="h-6" /></td></tr>
            )}
            {rows.map((m) => <MemberTr key={m.profile.id} m={m} />)}
            {data && rows.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-fg-muted"><Users className="mx-auto mb-2 size-5" />No members match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Wrap>
  )
}

function MemberTr({ m }: { m: MemberRow }) {
  const p = m.profile
  return (
    <tr className="hover:bg-surface-2">
      <td className="px-4 py-2.5">
        <Link to={`/u/${p.username}`} className="flex items-center gap-2.5 hover:underline">
          <Avatar profile={p} size="sm" />
          <span className="min-w-0">
            <span className="block font-medium">{p.displayName}</span>
            <span className="block text-xs text-fg-muted">@{p.username}</span>
          </span>
          {p.role && p.role !== 'member' && <Badge size="xs" tone="accent" className="ml-1 capitalize">{p.role}</Badge>}
        </Link>
      </td>
      <td className="px-4 py-2.5 font-mono text-xs">{m.email ?? '—'}</td>
      <td className="px-4 py-2.5 whitespace-nowrap" title={p.joinedAt}>{formatDate(p.joinedAt)}</td>
      <td className="px-4 py-2.5 whitespace-nowrap text-fg-muted">{m.lastSignInAt ? timeAgo(m.lastSignInAt) : '—'}</td>
      <td className="px-4 py-2.5 text-right tabular">{m.recipeCount}</td>
      <td className="px-4 py-2.5 text-right tabular">{m.reproductionCount}</td>
    </tr>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">{children}</div>
}
