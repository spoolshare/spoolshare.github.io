import { useMemo } from 'react'
import type { ID } from '@/types'
import { api } from '@/lib/api'
import { invalidate, setQueryData, useQuery } from './useQuery'
import { useSession } from './useSession'

export function useFavorites() {
  const { user } = useSession()
  const key = user ? `favorites:${user.id}` : null
  const { data } = useQuery(key, () => api.listFavoriteIds())
  const ids = useMemo(() => new Set<ID>(data ?? []), [data])
  return {
    ids,
    isFavorite: (id: ID) => ids.has(id),
    toggle: async (recipeId: ID) => {
      if (!key) throw new Error('Sign in to save recipes.')
      setQueryData<ID[]>(key, (prev = []) => (prev.includes(recipeId) ? prev.filter((x) => x !== recipeId) : [...prev, recipeId]))
      const on = await api.toggleFavorite(recipeId)
      invalidate('favorites', 'recipes', 'recipe')
      return on
    },
  }
}
