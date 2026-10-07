import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router'
import {
  Bell, Bookmark, Boxes, Compass, Flag, LogOut, Monitor, Moon, PlusCircle, Settings, Sun, Target, User, Users,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useSession } from '@/lib/hooks/useSession'
import { useInventory } from '@/lib/hooks/useInventory'
import { useTheme } from '@/lib/hooks/usePreferences'
import { useQuery } from '@/lib/hooks/useQuery'
import { api } from '@/lib/api'
import { normalizeHex } from '@/lib/color/convert'
import { Avatar, ButtonLink, Kbd, Menu } from '@/components/ui'
import { useInventoryPanel } from '@/components/filament/InventoryPanel'
import { Logo } from './Logo'
import { Search } from 'lucide-react'

export const NAV = [
  { to: '/', label: 'Explore', icon: Compass, end: true },
  { to: '/filaments', label: 'My Filaments', icon: Boxes },
  { to: '/match', label: 'Color Matcher', icon: Target },
  { to: '/create', label: 'Create Recipe', icon: PlusCircle },
]

export function TopNav() {
  const { user } = useSession()
  const inv = useInventory()
  const panel = useInventoryPanel()
  const { data: notes } = useQuery(user ? `notifications:${user.id}` : null, () => api.listNotifications())
  const unread = notes?.filter((n) => !n.read).length ?? 0

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75">
      <div className="mx-auto flex h-16 max-w-[1800px] items-center gap-3 px-4 sm:px-6">
        <Logo className="mr-2" />

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                cn(
                  'relative rounded-md px-3 py-2 text-[15px] font-medium transition-colors',
                  isActive ? 'text-fg' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {n.label}
                  {isActive && <span className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-accent" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <GlobalSearch className="ml-auto max-w-md flex-1" />

        <div className="flex items-center gap-1">
          {user && (
            <button
              type="button"
              onClick={() => panel.open()}
              className="hidden h-10 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg md:inline-flex"
              aria-label={`Open My Filaments panel, ${inv.items.length} spools`}
              title="My Filaments"
            >
              <span className="flex -space-x-1.5">
                {inv.items.slice(0, 4).map((i) => (
                  <span key={i.id} className="size-4 rounded-full ring-2 ring-surface" style={{ background: i.filament.hex, boxShadow: 'inset 0 0 0 1px rgb(0 0 0 / .1)' }} />
                ))}
                {inv.items.length === 0 && <Boxes className="size-4" />}
              </span>
              <span className="tabular">{inv.items.length}</span>
            </button>
          )}

          {user && (
            <NavLink to="/notifications" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
              {({ isActive }) => (
                <span className={cn('grid size-10 place-items-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg', isActive && 'text-fg')}>
                  <Bell className="size-5" />
                  {unread > 0 && (
                    <span className="absolute top-1.5 right-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg tabular">
                      {unread}
                    </span>
                  )}
                </span>
              )}
            </NavLink>
          )}

          {user ? <UserMenu /> : (
            <ButtonLink to="/signin" size="sm" variant="secondary" className="ml-1">Sign in</ButtonLink>
          )}
        </div>
      </div>
    </header>
  )
}

function UserMenu() {
  const { user, signOut } = useSession()
  const navigate = useNavigate()
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
  const ThemeIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor
  if (!user) return null
  return (
    <Menu
      label="Account"
      trigger={(p) => (
        <button {...p} type="button" className="ml-1 rounded-full ring-offset-2 ring-offset-surface focus-visible:ring-2 focus-visible:ring-accent" aria-label="Account menu">
          <Avatar profile={user} size="md" />
        </button>
      )}
      header={
        <div className="flex items-center gap-2.5">
          <Avatar profile={user} size="md" />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{user.displayName}</div>
            <div className="truncate text-xs text-fg-muted">@{user.username}</div>
          </div>
        </div>
      }
      items={[
        { label: 'Profile', icon: <User className="size-4" />, onSelect: () => navigate(`/u/${user.username}`) },
        { label: 'Saved recipes', icon: <Bookmark className="size-4" />, onSelect: () => navigate('/saved') },
        { label: 'My Filaments', icon: <Boxes className="size-4" />, onSelect: () => navigate('/filaments') },
        { label: 'Settings', icon: <Settings className="size-4" />, onSelect: () => navigate('/settings') },
        { label: `Appearance: ${theme[0].toUpperCase() + theme.slice(1)}`, icon: <ThemeIcon className="size-4" />, onSelect: () => setTheme(nextTheme) },
        ...(user.role === 'admin' ? [{ label: 'Members (admin)', icon: <Users className="size-4" />, onSelect: () => navigate('/admin/members') }] : []),
        ...(user.role === 'admin' || user.role === 'moderator' ? [{ label: 'Reports (admin)', icon: <Flag className="size-4" />, onSelect: () => navigate('/admin/reports') }] : []),
        { divider: true, label: '' },
        { label: 'Sign out', icon: <LogOut className="size-4" />, onSelect: async () => { await signOut(); navigate('/') } },
      ]}
    />
  )
}

/** Header search: text goes to /search?q=, a HEX goes straight to the Color Matcher. Press "/" to focus it. */
function GlobalSearch({ className }: { className?: string }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (location.pathname !== '/search') setQ('')
  }, [location.pathname])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = q.trim()
    if (!text) return
    const hex = /^#?[0-9a-f]{6}$/i.test(text) ? normalizeHex(text) : null
    if (hex) navigate(`/match?hex=${encodeURIComponent(hex)}`)
    else navigate(`/search?q=${encodeURIComponent(text)}`)
    ref.current?.blur()
  }

  return (
    <form role="search" onSubmit={submit} className={cn('relative hidden sm:block', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
      <input
        ref={ref}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search recipes, colors, HEX, brands"
        placeholder="Search colors, #C1AAD6, Bambu filaments, makers…"
        className="h-10 w-full rounded-md border border-border bg-surface-2 pr-10 pl-9 text-[15px] placeholder:text-fg-subtle focus:border-accent focus:bg-surface focus:ring-3 focus:ring-[var(--ring)] focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2">
        <Kbd>/</Kbd>
      </span>
    </form>
  )
}
