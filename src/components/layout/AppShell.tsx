import { Suspense, useEffect } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { Boxes, Columns2, Compass, PlusCircle, Search, Target } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCompareTray, useTheme } from '@/lib/hooks/usePreferences'
import { useQuery } from '@/lib/hooks/useQuery'
import { api } from '@/lib/api'
import { Button, Skeleton } from '@/components/ui'
import { ColorDot } from '@/components/color/Swatch'
import { useInventoryPanel } from '@/components/filament/InventoryPanel'
import { TopNav } from './TopNav'
import { CONTACT_EMAIL, MIXER_URL } from '@/types'
import { LogoMark } from './Logo'

export function AppShell() {
  const location = useLocation()
  useTheme() // keeps the page in sync with the saved/system appearance
  useEffect(() => {
    // Move focus to main content on navigation for screen-reader users.
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only z-50 rounded-md bg-accent px-3 py-2 text-accent-fg focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <TopNav />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<PageFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CompareTray />
      <MobileTabBar />
      <ScrollRestoration />
    </div>
  )
}

function PageFallback() {
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-3 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />)}
      </div>
    </div>
  )
}

/** Mobile bottom tab bar. "Filaments" opens the inventory bottom sheet. */
function MobileTabBar() {
  const panel = useInventoryPanel()
  const navigate = useNavigate()
  const tab = 'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium'
  const cls = ({ isActive }: { isActive: boolean }) => cn(tab, isActive ? 'text-accent' : 'text-fg-muted')
  return (
    <nav aria-label="Mobile" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-stretch px-2">
        <NavLink to="/" end className={cls}><Compass className="size-5" />Explore</NavLink>
        <NavLink to="/search" className={cls}><Search className="size-5" />Search</NavLink>
        <NavLink to="/create" className={({ isActive }) => cn(tab, isActive ? 'text-accent' : 'text-fg-muted')}>
          <span className="grid size-9 place-items-center rounded-full bg-accent text-accent-fg shadow-md"><PlusCircle className="size-5" /></span>
          <span className="sr-only">Create recipe</span>
        </NavLink>
        <NavLink to="/match" className={cls}><Target className="size-5" />Match</NavLink>
        <button
          type="button"
          className={cn(tab, 'text-fg-muted')}
          onClick={() => (window.matchMedia('(min-width: 768px)').matches ? navigate('/filaments') : panel.open())}
        >
          <Boxes className="size-5" />Filaments
        </button>
      </div>
    </nav>
  )
}

function CompareTray() {
  const compare = useCompareTray()
  const ids = compare.ids
  const { data } = useQuery(ids.length ? `recipes:compare:${ids.join(',')}` : null, () => api.searchRecipes({ ids, limit: 4 }))
  const location = useLocation()
  if (ids.length === 0 || location.pathname === '/compare') return null
  const hits = data?.items ?? []
  return (
    <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 lg:bottom-6">
      <div className="flex animate-slide-up items-center gap-3 rounded-2xl border border-border bg-surface p-2 pl-4 shadow-lg">
        <Columns2 className="size-4 text-fg-subtle" aria-hidden />
        <div className="flex items-center gap-1.5">
          {hits.map((h) => <ColorDot key={h.recipe.id} hex={h.recipe.resultHex} size={22} label={h.recipe.name} />)}
        </div>
        <span className="hidden text-sm text-fg-muted sm:inline">{ids.length} selected</span>
        <Button size="sm" variant="ghost" onClick={compare.clear}>Clear</Button>
        <Link to={`/compare?ids=${ids.join(',')}`} className="inline-flex h-8 items-center rounded-md bg-fg px-3 text-sm font-medium text-bg hover:opacity-90">
          Compare
        </Link>
      </div>
    </div>
  )
}

function Footer() {
  const links: [string, string][] = [['About & how it works', '/about'], ['Create a recipe', '/create'], ['Color Matcher', '/match'], ['Compare', '/compare']]
  return (
    <footer className="mt-10 border-t border-border bg-surface pb-20 lg:pb-0">
      <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 text-sm sm:px-6">
        <span className="flex items-center gap-2 font-semibold"><LogoMark size={20} /> SpoolShare</span>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1 text-fg-muted">
          {links.map(([label, to]) => <Link key={to} to={to} className="hover:text-fg">{label}</Link>)}
          <a href="https://github.com/spoolshare/spoolshare.github.io" target="_blank" rel="noreferrer" className="hover:text-fg">GitHub</a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-fg">Suggestions: {CONTACT_EMAIL}</a>
        </nav>
        <span className="text-xs text-fg-subtle sm:ml-auto">
          Made for the <a href={MIXER_URL} target="_blank" rel="noreferrer" className="underline hover:text-fg">Multi-Color Filament Mixer</a> by jetpad · Filament HEX values are approximate
        </span>
      </div>
    </footer>
  )
}
