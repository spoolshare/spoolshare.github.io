import { useMemo } from 'react'
import type { FilamentView, ID, RecipeSummary } from '@/types'
import { api, type RecipeQuery } from '@/lib/api'
import { checkCanMake } from '@/lib/recipe/canMake'
import { useQuery } from './useQuery'
import { useInventory } from './useInventory'

/** Stable cache key for a query object (key order independent). */
export function queryKey(prefix: string, q: object) {
  const sorted = Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)).sort(([a], [b]) => a.localeCompare(b)))
  return `${prefix}:${JSON.stringify(sorted)}`
}

export function useRecipeSearch(q: RecipeQuery | null) {
  return useQuery(q ? queryKey('recipes:search', q) : null, () => api.searchRecipes(q!), ['favorites', 'reproductions'])
}

export function useRecipe(slug: string | undefined) {
  return useQuery(slug ? `recipe:${slug}` : null, () => api.getRecipe(slug!), ['recipes', 'reproductions', 'comments', 'favorites'])
}

/** Can-make status for a recipe summary against the signed-in user's inventory. */
export function useCanMake(summary: Pick<RecipeSummary, 'composition' | 'filaments'> | undefined, filamentsById?: Record<ID, FilamentView>) {
  const inv = useInventory()
  return useMemo(() => {
    if (!summary || !inv.signedIn) return null
    const map = filamentsById ?? Object.fromEntries(summary.filaments.map((f) => [f.id, f]))
    return checkCanMake(summary.composition, map, inv.ownedIds, inv.ownedFilaments)
  }, [summary, filamentsById, inv.signedIn, inv.ownedIds, inv.ownedFilaments])
}
