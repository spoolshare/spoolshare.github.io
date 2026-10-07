import { useState } from 'react'
import { Link } from 'react-router'
import { ExternalLink, Flag, Lock, Users } from 'lucide-react'
import type { Report } from '@/types'
import { api, type ReportView } from '@/lib/api'
import { invalidate, useQuery } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { cn } from '@/lib/utils/cn'
import { timeAgo } from '@/lib/utils/format'
import { Badge, Button, ButtonLink, EmptyState, PageHeader, SegmentedControl, Skeleton, Textarea, useToast } from '@/components/ui'

const REASON: Record<Report['reason'], string> = {
  inaccurate: 'Inaccurate or untested',
  spam: 'Spam',
  unsafe: 'Unsafe',
  stolen: 'Copied without credit',
  offensive: 'Offensive',
  other: 'Other',
}

type Filter = 'open' | 'all' | 'resolved'

/** Admin/moderator queue for reported recipes, comments, reproductions and users. */
export default function ReportsPage() {
  const { user, loading } = useSession()
  const allowed = user?.role === 'admin' || user?.role === 'moderator'
  const { data, error } = useQuery(allowed ? 'reports:queue' : null, () => api.listReportViews(), ['session'])
  const [filter, setFilter] = useState<Filter>('open')

  if (loading) return <Wrap><Skeleton className="h-40" /></Wrap>
  if (!allowed) {
    return (
      <Wrap>
        <EmptyState icon={<Lock className="size-5" />} title="Admins only" description="Reports are reviewed by SpoolShare admins and moderators." action={<ButtonLink to="/" variant="outline">Back to Explore</ButtonLink>} />
      </Wrap>
    )
  }

  const rows = (data ?? []).filter((r) => (filter === 'all' ? true : filter === 'open' ? r.status !== 'resolved' : r.status === 'resolved'))
  const openCount = (data ?? []).filter((r) => r.status !== 'resolved').length

  return (
    <Wrap>
      <PageHeader
        eyebrow="Admin"
        title="Reports"
        description="Review what members have flagged. Take action on the content if needed, then resolve the report with a short note."
        actions={<ButtonLink to="/admin/members" variant="outline" icon={<Users className="size-4" />}>Members</ButtonLink>}
      />
      <SegmentedControl
        label="Filter reports"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'open', label: `Open (${openCount})` },
          { value: 'resolved', label: 'Resolved' },
          { value: 'all', label: 'All' },
        ]}
        className="mb-4"
      />
      {error && <p role="alert" className="mb-4 text-sm text-danger">{error.message}</p>}
      {!data ? (
        <Skeleton className="h-32" />
      ) : rows.length === 0 ? (
        <p className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3 text-sm text-fg-muted">
          <Flag className="size-4" aria-hidden /> {filter === 'open' ? 'No open reports. Nice.' : 'Nothing here.'}
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {rows.map((r) => <ReportItem key={r.id} r={r} />)}
        </ul>
      )}
    </Wrap>
  )
}

function ReportItem({ r }: { r: ReportView }) {
  const toast = useToast()
  const [note, setNote] = useState(r.resolutionNote ?? '')
  const [busy, setBusy] = useState<string | null>(null)

  const act = async (key: string, fn: () => Promise<unknown>, message: string) => {
    setBusy(key)
    try {
      await fn()
      invalidate('reports', 'recipes', 'recipe')
      toast(message)
    } catch (e) {
      toast((e as Error).message, { tone: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <li className={cn('rounded-lg border bg-surface p-4', r.status === 'resolved' ? 'border-border opacity-80' : 'border-border-strong')}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge size="xs" tone={r.status === 'resolved' ? 'neutral' : r.status === 'reviewing' ? 'info' : 'warn'} className="capitalize">{r.status}</Badge>
            <span className="font-semibold">{REASON[r.reason]}</span>
            <span className="text-fg-muted">· {r.targetType}</span>
            <span className="text-fg-subtle">· {timeAgo(r.createdAt)}</span>
          </div>
          <div className="mt-1.5 text-[15px]">
            {r.target.href ? (
              <Link to={r.target.href} className="inline-flex items-center gap-1 font-medium hover:underline">
                {r.target.label} <ExternalLink className="size-3.5" aria-hidden />
              </Link>
            ) : (
              <span className="text-fg-muted">{r.target.label}</span>
            )}
            {r.target.hidden && <Badge size="xs" tone="danger" className="ml-2">Hidden</Badge>}
          </div>
          {r.details && <p className="mt-1.5 text-sm whitespace-pre-line text-fg-muted">“{r.details}”</p>}
          <p className="mt-1.5 text-xs text-fg-subtle">
            Reported by {r.reporter ? <Link to={`/u/${r.reporter.username}`} className="hover:underline">@{r.reporter.username}</Link> : 'a deleted account'}
          </p>
        </div>
      </div>

      {r.target.exists && r.status !== 'resolved' && (
        <div className="mt-3 flex flex-wrap gap-2">
          {r.targetType === 'recipe' && (
            <Button size="xs" variant="outline" loading={busy === 'hide'} onClick={() => act('hide', () => api.setRecipeHidden(r.targetId, !r.target.hidden), r.target.hidden ? 'Recipe restored' : 'Recipe hidden from everyone but its author')}>
              {r.target.hidden ? 'Unhide recipe' : 'Hide recipe'}
            </Button>
          )}
          {r.targetType === 'comment' && (
            <Button size="xs" variant="outline" className="text-danger" loading={busy === 'del'} onClick={() => act('del', () => api.deleteComment(r.targetId), 'Comment deleted')}>Delete comment</Button>
          )}
          {r.targetType === 'reproduction' && (
            <Button size="xs" variant="outline" className="text-danger" loading={busy === 'del'} onClick={() => act('del', () => api.deleteReproduction(r.targetId), 'Reproduction deleted')}>Delete reproduction</Button>
          )}
          {r.targetType === 'user' && (
            <ButtonLink size="xs" variant="outline" to="/admin/members">Manage on Members page</ButtonLink>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor={`note-${r.id}`} className="mb-1 block text-xs font-medium text-fg-muted">Resolution note (private)</label>
          <Textarea id={`note-${r.id}`} rows={1} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What did you decide, and why?" />
        </div>
        <div className="flex gap-2">
          {r.status === 'open' && (
            <Button size="sm" variant="outline" loading={busy === 'review'} onClick={() => act('review', () => api.updateReport(r.id, { status: 'reviewing', resolutionNote: note || undefined }), 'Marked as reviewing')}>Reviewing</Button>
          )}
          {r.status !== 'resolved' ? (
            <Button size="sm" loading={busy === 'resolve'} onClick={() => act('resolve', () => api.updateReport(r.id, { status: 'resolved', resolutionNote: note || undefined }), 'Report resolved')}>Resolve</Button>
          ) : (
            <Button size="sm" variant="outline" loading={busy === 'reopen'} onClick={() => act('reopen', () => api.updateReport(r.id, { status: 'open', resolutionNote: note || undefined }), 'Report reopened')}>Reopen</Button>
          )}
        </div>
      </div>
    </li>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">{children}</div>
}
