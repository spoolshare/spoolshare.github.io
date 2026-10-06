import { useState } from 'react'
import { Link } from 'react-router'
import { MessageSquare, Trash2 } from 'lucide-react'
import type { ID } from '@/types'
import { api, type CommentView } from '@/lib/api'
import { invalidate } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { formatDate, timeAgo } from '@/lib/utils/format'
import { Avatar, Button, EmptyState, IconButton, Textarea, useToast } from '@/components/ui'

export function CommentsSection({ recipeId, authorId, comments }: { recipeId: ID; authorId: ID; comments: CommentView[] }) {
  const { user } = useSession()
  const toast = useToast()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSending(true)
    try {
      await api.addComment(recipeId, body)
      setBody('')
      invalidate('recipe', 'comments')
    } catch (err) {
      toast((err as Error).message, { tone: 'error' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-5">
      {comments.length === 0 ? (
        <EmptyState icon={<MessageSquare className="size-5" />} title="No comments yet" description="Ask about purge lengths, share tips, or say thanks." className="py-8" />
      ) : (
        <ul className="space-y-4" role="list">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Link to={`/u/${c.user.username}`} aria-hidden tabIndex={-1}><Avatar profile={c.user} size="md" /></Link>
              <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <Link to={`/u/${c.user.username}`} className="truncate font-medium hover:underline">{c.user.displayName}</Link>
                    {c.userId === authorId && <span className="rounded bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold text-accent-soft-fg uppercase">Creator</span>}
                    <time className="text-xs text-fg-subtle" dateTime={c.createdAt} title={formatDate(c.createdAt)}>{timeAgo(c.createdAt)}</time>
                  </div>
                  {(user?.id === c.userId || user?.role === 'moderator') && (
                    <IconButton
                      label="Delete comment"
                      size="xs"
                      onClick={async () => {
                        await api.deleteComment(c.id)
                        invalidate('recipe', 'comments')
                        toast('Comment deleted', { tone: 'info' })
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </IconButton>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form onSubmit={submit} className="flex gap-3">
          <Avatar profile={user} size="md" />
          <div className="flex-1">
            <label htmlFor="comment-body" className="sr-only">Add a comment</label>
            <Textarea id="comment-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share a tip or ask a question…" maxLength={2000} />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-fg-subtle tabular">{body.length}/2000</span>
              <Button type="submit" size="sm" loading={sending} disabled={!body.trim()}>Post comment</Button>
            </div>
          </div>
        </form>
      ) : (
        <p className="rounded-xl border border-border bg-surface-2 p-4 text-sm text-fg-muted">
          <Link to="/signin" className="font-medium text-accent hover:underline">Sign in</Link> to join the conversation.
        </p>
      )}
    </div>
  )
}
