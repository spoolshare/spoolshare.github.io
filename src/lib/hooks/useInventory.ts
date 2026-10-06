import { useMemo } from 'react'
import type { FilamentView, ID } from '@/types'
import { api, type InventoryEntry } from '@/lib/api'
import { invalidate, setQueryData, useQuery } from './useQuery'
import { useSession } from './useSession'

export type { InventoryEntry }

/**
 * The signed-in user's filament inventory. Most screens read this to decide
 * "✓ You can make this" vs. "Missing: …".
 */
export function useInventory() {
  const { user } = useSession()
  const key = user ? `inventory:${user.id}` : null
  const { data } = useQuery(key, () => api.getInventory())
  const items = useMemo(() => data ?? [], [data])
  const ownedIds = useMemo(() => new Set<ID>(items.map((i) => i.filamentId)), [items])
  const ownedFilaments = useMemo(() => items.map((e) => e.filament), [items])

  return {
    ready: !user || !!data,
    signedIn: !!user,
    items,
    ownedIds,
    ownedFilaments,
    owns: (filamentId: ID) => ownedIds.has(filamentId),
    add: async (filament: FilamentView) => {
      if (!key || !user) throw new Error('Sign in to save filaments.')
      setQueryData<InventoryEntry[]>(key, (prev = []) =>
        prev.some((p) => p.filamentId === filament.id)
          ? prev
          : [...prev, { id: `tmp-${filament.id}`, userId: user.id, filamentId: filament.id, addedAt: new Date().toISOString(), filament }],
      )
      await api.addToInventory(filament.id)
      invalidate('inventory')
    },
    remove: async (filamentId: ID) => {
      if (!key) return
      const item = items.find((i) => i.filamentId === filamentId)
      if (!item) return
      setQueryData<InventoryEntry[]>(key, (prev = []) => prev.filter((i) => i.filamentId !== filamentId))
      await api.removeFromInventory(item.id)
      invalidate('inventory')
    },
    update: async (itemId: ID, patch: Parameters<typeof api.updateInventoryItem>[1]) => {
      setQueryData<InventoryEntry[]>(key!, (prev = []) => prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i)))
      await api.updateInventoryItem(itemId, patch)
      invalidate('inventory')
    },
  }
}
