import { useEffect } from 'react'
import type { Hex, ID } from '@/types'
import { useLocalStorage } from './useLocalStorage'

export type ThemePref = 'light' | 'dark' | 'system'

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<ThemePref>('spoolshare:theme', 'system')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  const resolved: 'light' | 'dark' =
    theme === 'system' ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme
  return { theme, resolved, setTheme }
}

/** "Only show recipes I can make" is a global preference, shared across pages. */
export function useCanMakeFilter() {
  return useLocalStorage<boolean>('spoolshare:onlyCanMake', false)
}

export interface RecentItem {
  id: ID
  slug: string
  name: string
  hex: Hex
}

export function useRecentlyViewed() {
  const [items, setItems] = useLocalStorage<RecentItem[]>('spoolshare:recent', [])
  return {
    items,
    push: (item: RecentItem) => setItems((prev) => [item, ...prev.filter((p) => p.id !== item.id)].slice(0, 12)),
    clear: () => setItems([]),
  }
}

/** Recipes picked for side-by-side comparison (max 4). */
export function useCompareTray() {
  const [ids, setIds] = useLocalStorage<ID[]>('spoolshare:compare', [])
  return {
    ids,
    has: (id: ID) => ids.includes(id),
    toggle: (id: ID) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id].slice(-4))),
    clear: () => setIds([]),
  }
}

export function useRecentColors() {
  const [colors, setColors] = useLocalStorage<Hex[]>('spoolshare:recentColors', [])
  return {
    colors,
    push: (hex: Hex) => setColors((prev) => [hex, ...prev.filter((c) => c !== hex)].slice(0, 10)),
  }
}
