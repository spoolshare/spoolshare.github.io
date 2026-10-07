import { Link } from 'react-router'
import { ExternalLink, Lightbulb } from 'lucide-react'
import type { PrintIdea } from '@/types'
import type { ReproductionView } from '@/lib/api'
import { Avatar } from '@/components/ui'

/**
 * "Made with this color": real objects people printed with their reproduced
 * filament, plus the creator's optional print ideas (often external links).
 */
export function MadeWithSection({
  reproductions,
  ideas,
  recipeSlug,
  isOwn,
}: {
  reproductions: ReproductionView[]
  ideas: PrintIdea[]
  recipeSlug: string
  isOwn: boolean
}) {
  const prints = reproductions.flatMap((r) => (r.objectPhotos ?? []).map((photo) => ({ photo, rep: r })))

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-3 text-sm font-semibold">Community prints</h3>
        {prints.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(calc(50%-0.5rem),180px),1fr))] gap-3" role="list">
            {prints.map(({ photo, rep }) => (
              <li key={photo.id} className="overflow-hidden rounded-lg border border-border bg-surface">
                <img src={photo.url} alt={photo.alt} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="flex items-center gap-1.5 p-2 text-xs">
                  <Avatar profile={rep.user} size="xs" />
                  <Link to={`/u/${rep.user.username}`} className="truncate font-medium hover:underline">{rep.user.displayName}</Link>
                  {photo.caption && <span className="truncate text-fg-muted">· {photo.caption}</span>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-fg-muted">
            No prints yet. {isOwn ? 'When others reproduce this color they can add photos of what they printed.' : (
              <>Made something with this color? <Link to={`/r/${recipeSlug}/reproduce`} className="font-medium text-accent hover:underline">Add your reproduction and print photos</Link>.</>
            )}
          </p>
        )}
      </div>

      {ideas.length > 0 && (
        <div>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold"><Lightbulb className="size-4 text-fg-subtle" aria-hidden /> Looks great on</h3>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface" role="list">
            {ideas.map((idea) => (
              <li key={idea.id} className="flex items-start gap-3 px-4 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{idea.title}</div>
                  {idea.note && <p className="text-fg-muted">{idea.note}</p>}
                </div>
                {idea.url && (
                  <a
                    href={idea.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex shrink-0 items-center gap-1 text-accent hover:underline"
                    title={`External link to ${idea.site ?? 'another site'}. Opens in a new tab.`}
                  >
                    View on {idea.site ?? siteFromUrl(idea.url)} <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                )}
              </li>
            ))}
          </ul>
          {ideas.some((i) => i.url) && (
            <p className="mt-2 text-xs text-fg-subtle">External models belong to their creators and are hosted on their own sites. SpoolShare only links to them.</p>
          )}
        </div>
      )}
    </div>
  )
}

export function siteFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host.includes('makerworld')) return 'MakerWorld'
    if (host.includes('printables')) return 'Printables'
    if (host.includes('thingiverse')) return 'Thingiverse'
    if (host.includes('cults3d')) return 'Cults3D'
    return host
  } catch {
    return 'external site'
  }
}
