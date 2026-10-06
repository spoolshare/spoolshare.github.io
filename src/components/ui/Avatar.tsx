import { Link } from 'react-router'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils/cn'
import { BadgeCheck } from 'lucide-react'

const sizes = { xs: 'size-5 text-[9px]', sm: 'size-7 text-[11px]', md: 'size-9 text-sm', lg: 'size-14 text-lg', xl: 'size-24 text-3xl' }

/** Generated avatar: initials over a soft "filament swirl" gradient seeded by the profile hue. */
export function Avatar({ profile, size = 'md', className }: { profile: Pick<Profile, 'displayName' | 'avatarHue' | 'avatarUrl'>; size?: keyof typeof sizes; className?: string }) {
  const initials = profile.displayName
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const h = profile.avatarHue
  if (profile.avatarUrl) {
    return <img src={profile.avatarUrl} alt="" className={cn('shrink-0 rounded-full object-cover', sizes[size], className)} />
  }
  return (
    <span
      aria-hidden
      className={cn('inline-grid shrink-0 place-items-center rounded-full font-semibold text-white ring-1 ring-black/5', sizes[size], className)}
      style={{
        background: `conic-gradient(from 200deg, hsl(${h} 62% 52%), hsl(${(h + 40) % 360} 65% 60%), hsl(${(h + 300) % 360} 55% 45%), hsl(${h} 62% 52%))`,
        textShadow: '0 1px 2px rgb(0 0 0 / 0.25)',
      }}
    >
      {initials}
    </span>
  )
}

export function UserLink({ profile, size = 'sm', showAvatar = true, className }: { profile: Profile; size?: keyof typeof sizes; showAvatar?: boolean; className?: string }) {
  return (
    <Link
      to={`/u/${profile.username}`}
      className={cn('group inline-flex min-w-0 items-center gap-2 text-sm', className)}
      onClick={(e) => e.stopPropagation()}
    >
      {showAvatar && <Avatar profile={profile} size={size} />}
      <span className="truncate font-medium text-fg group-hover:underline">{profile.displayName}</span>
      {profile.role === 'moderator' && <BadgeCheck className="size-3.5 shrink-0 text-accent" aria-label="Moderator" />}
    </Link>
  )
}
