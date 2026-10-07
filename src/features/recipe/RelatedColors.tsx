import type { Hex, ID } from '@/types'
import { useRecipeSearch } from '@/lib/hooks/useRecipes'
import { RecipeRail } from '@/components/recipe/RecipeCard'

/** Similar community colors, by CIEDE2000 distance to this recipe's result. */
export function RelatedColors({ recipeId, hex }: { recipeId: ID; hex: Hex }) {
  const { data, loading } = useRecipeSearch({ targetHex: hex, sort: 'closest', limit: 9 })
  const hits = data?.items.filter((h) => h.recipe.id !== recipeId).slice(0, 8)
  if (hits && hits.length === 0) return <p className="text-sm text-fg-muted">No similar colors yet.</p>
  return <RecipeRail hits={hits} loading={loading} target={hex} />
}
