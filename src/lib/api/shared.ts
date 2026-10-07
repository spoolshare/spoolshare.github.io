/**
 * Backend-independent recipe summarizing and searching. Both adapters use this,
 * so ranking (CIEDE2000, trending, text relevance) behaves identically.
 * The Supabase adapter feeds it a cached snapshot of published recipes; at
 * larger scale this moves into a Postgres function (see supabase/README).
 */
import type { FilamentView, ID, Profile, Recipe, RecipeSummary, Reproduction } from '@/types'
import type { Page, RecipeHit, RecipeQuery } from './types'
import { deltaE } from '@/lib/color/deltaE'
import { hueFamily, searchColorNames } from '@/lib/color/names'
import { recipeComposition } from '@/lib/recipe/composition'
import { recipeDifficulty, reproductionStats, trustLevel } from '@/lib/recipe/trust'

export interface SummaryContext {
  profile: (id: ID) => Profile | undefined
  reproductions: (recipeId: ID) => Reproduction[]
  filament: (id: ID) => FilamentView | undefined
}

const UNKNOWN_PROFILE: Profile = {
  id: 'unknown', username: 'unknown', displayName: 'Unknown maker', avatarHue: 0, printers: [], inventoryVisibility: 'private', joinedAt: new Date(0).toISOString(),
}

export function summarize(recipe: Recipe, ctx: SummaryContext): RecipeSummary {
  const composition = recipeComposition(recipe)
  const stats = reproductionStats(recipe, ctx.reproductions(recipe.id))
  return {
    recipe,
    author: ctx.profile(recipe.authorId) ?? UNKNOWN_PROFILE,
    composition,
    filaments: composition.map((c) => ctx.filament(c.filamentId)).filter((f): f is FilamentView => !!f),
    stats,
    trust: trustLevel(stats, recipe),
    difficulty: recipeDifficulty(recipe),
  }
}

function trendingScore(s: RecipeSummary, now: number) {
  const ageDays = (now - Date.parse(s.recipe.createdAt)) / 86400000
  const engagement = s.recipe.favoriteCount + s.stats.count * 12 + s.recipe.viewCount / 40
  return engagement / Math.pow(ageDays + 2, 0.9)
}

function textMatches(s: RecipeSummary, text: string): number {
  const q = text.toLowerCase().trim()
  if (!q) return 1
  const r = s.recipe
  let score = 0
  if (r.name.toLowerCase().includes(q)) score += 10
  if (r.name.toLowerCase().startsWith(q)) score += 5
  if (r.tags.some((t) => t.includes(q))) score += 4
  if (r.description.toLowerCase().includes(q)) score += 2
  if (s.author.username.includes(q) || s.author.displayName.toLowerCase().includes(q)) score += 3
  if (s.filaments.some((f) => `${f.manufacturer.name} ${f.productLine.name} ${f.colorName}`.toLowerCase().includes(q))) score += 2
  if (r.resultHex.toLowerCase() === q.replace(/^#?/, '#')) score += 20
  return score
}

/** Filters, scores, sorts and pages summaries according to a RecipeQuery. */
export function runRecipeSearch(all: RecipeSummary[], q: RecipeQuery): Page<RecipeHit> {
  const now = Date.now()
  let hits: RecipeHit[] = all.filter((s) => !q.ids || q.ids.includes(s.recipe.id)).map((s) => ({ ...s }))

  // A text query that is a color name ("lavender") also acts as a color target.
  let target = q.targetHex
  let textForMatch = q.text?.trim() ?? ''
  if (!target && textForMatch) {
    const named = searchColorNames(textForMatch, 1)[0]
    const direct = hits.some((h) => textMatches(h, textForMatch) > 0)
    if (named && named.name.toLowerCase().startsWith(textForMatch.toLowerCase())) {
      target = named.hex
      if (!direct) textForMatch = ''
    }
  }

  hits = hits.filter((h) => {
    const r = h.recipe
    if (q.authorId && r.authorId !== q.authorId) return false
    if (q.authorIds && !q.authorIds.includes(r.authorId)) return false
    if (q.materials?.length && !q.materials.includes(r.material)) return false
    if (q.manufacturerIds?.length && !h.filaments.some((f) => q.manufacturerIds!.includes(f.manufacturerId))) return false
    if (q.minStages && r.stages.length < q.minStages) return false
    if (q.maxStages && r.stages.length > q.maxStages) return false
    if (q.trust?.length && !q.trust.includes(h.trust)) return false
    if (q.hueFamily && hueFamily(r.resultHex) !== q.hueFamily) return false
    if (q.canMakeWith && !h.composition.every((c) => q.canMakeWith!.includes(c.filamentId))) return false
    return true
  })

  if (target) {
    hits.forEach((h) => (h.deltaE = deltaE(h.recipe.resultHex, target!)))
    if (q.maxDeltaE != null) hits = hits.filter((h) => h.deltaE! <= q.maxDeltaE!)
  }

  if (textForMatch) {
    const scored = hits.map((h) => ({ h, s: textMatches(h, textForMatch) }))
    hits = scored.filter((x) => x.s > 0 || (target && x.h.deltaE! < 15)).map((x) => x.h)
    if (!q.sort || q.sort === 'relevance') {
      const sMap = new Map(scored.map((x) => [x.h.recipe.id, x.s]))
      hits.sort((a, b) => (sMap.get(b.recipe.id)! - (b.deltaE ?? 30) / 3) - (sMap.get(a.recipe.id)! - (a.deltaE ?? 30) / 3))
    }
  }

  const sort = q.sort ?? (target ? 'closest' : textForMatch ? 'relevance' : 'trending')
  const sorters: Record<string, (a: RecipeHit, b: RecipeHit) => number> = {
    closest: (a, b) => (a.deltaE ?? 0) - (b.deltaE ?? 0),
    trending: (a, b) => trendingScore(b, now) - trendingScore(a, now),
    newest: (a, b) => Date.parse(b.recipe.createdAt) - Date.parse(a.recipe.createdAt),
    'most-reproduced': (a, b) => b.stats.count - a.stats.count || b.stats.closeCount - a.stats.closeCount,
    'most-favorited': (a, b) => b.recipe.favoriteCount - a.recipe.favoriteCount,
  }
  if (sort !== 'relevance') hits.sort(sorters[sort] ?? sorters.trending)
  else if (!textForMatch && target) hits.sort(sorters.closest)

  const offset = q.offset ?? 0
  const limit = q.limit ?? 24
  return { items: hits.slice(offset, offset + limit), total: hits.length }
}

export interface AchievementStats {
  recipes: number
  reproductions: number
  reproductionsReceived: number
  favoritesReceived: number
  followers: number
}

export const ACHIEVEMENTS: { id: string; label: string; description: string; test: (s: AchievementStats) => boolean }[] = [
  { id: 'first-recipe', label: 'First Mix', description: 'Published a first recipe', test: (s) => s.recipes >= 1 },
  { id: 'prolific', label: 'Color Chemist', description: 'Published 5 recipes', test: (s) => s.recipes >= 5 },
  { id: 'reproducer', label: 'Lab Partner', description: 'Reproduced someone else’s recipe', test: (s) => s.reproductions >= 1 },
  { id: 'peer-review', label: 'Peer Reviewed', description: 'Your recipes were reproduced 10+ times', test: (s) => s.reproductionsReceived >= 10 },
  { id: 'loved', label: 'Crowd Favorite', description: '250+ favorites across your recipes', test: (s) => s.favoritesReceived >= 250 },
  { id: 'following', label: 'Community Pillar', description: '3+ followers', test: (s) => s.followers >= 3 },
]
