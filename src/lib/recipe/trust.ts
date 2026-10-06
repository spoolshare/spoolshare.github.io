import type { Difficulty, Recipe, Reproduction, ReproductionStats, TrustLevel } from '@/types'
import { averageLab, CLOSE_MATCH_THRESHOLD, deltaE, deltaSpread } from '@/lib/color/deltaE'
import { recipeComposition } from './composition'

export function reproductionStats(recipe: Pick<Recipe, 'resultHex'>, reproductions: Reproduction[]): ReproductionStats {
  if (reproductions.length === 0) {
    return { count: 0, closeCount: 0, meanDeltaE: null, averageHex: null, spread: null, averageRating: null }
  }
  const des = reproductions.map((r) => deltaE(r.resultHex, recipe.resultHex))
  const all = [recipe.resultHex, ...reproductions.map((r) => r.resultHex)]
  return {
    count: reproductions.length,
    closeCount: des.filter((d) => d <= CLOSE_MATCH_THRESHOLD).length,
    meanDeltaE: des.reduce((a, b) => a + b, 0) / des.length,
    averageHex: averageLab(all),
    spread: deltaSpread(all),
    averageRating: reproductions.reduce((a, r) => a + r.accuracyRating, 0) / reproductions.length,
  }
}

/**
 * Trust ladder. One upload is a test, never "verified". Confidence comes only
 * from independent reproductions that land close to the original.
 */
export function trustLevel(stats: ReproductionStats, recipe?: Pick<Recipe, 'isExample'>): TrustLevel {
  if (recipe?.isExample && stats.closeCount === 0) return 'calculated'
  if (stats.closeCount >= 5 && stats.closeCount / stats.count >= 0.8) return 'highly-reproduced'
  if (stats.closeCount >= 1) return 'reproduced'
  return 'tested'
}

export const TRUST_META: Record<TrustLevel, { label: string; short: string; description: string }> = {
  calculated: {
    label: 'Calculated / Untested',
    short: 'Calculated',
    description: 'A mathematical prediction. No one has printed this yet. Real plastic may look quite different.',
  },
  tested: {
    label: 'Tested',
    short: 'Tested',
    description: 'Physically mixed and photographed by the creator. One data point, not yet reproduced.',
  },
  reproduced: {
    label: 'Reproduced',
    short: 'Reproduced',
    description: 'At least one other maker followed this recipe and got a close match (ΔE00 ≤ 5).',
  },
  'highly-reproduced': {
    label: 'Highly Reproduced',
    short: 'Highly Reproduced',
    description: '5+ independent close matches and at least 80% of reproductions agree. Very reliable.',
  },
}

/**
 * Difficulty heuristic: number of stages, ingredient count, and how small the
 * smallest share is (tiny percentages are hard to weigh and mix evenly).
 */
export function recipeDifficulty(recipe: Pick<Recipe, 'stages'>): Difficulty {
  const comp = recipeComposition(recipe)
  const stages = recipe.stages.length
  const minShare = comp.length ? Math.min(...comp.map((c) => c.fraction)) : 1
  let score = 0
  score += (stages - 1) * 2
  score += Math.max(0, comp.length - 2)
  if (minShare < 0.1) score += 1
  if (minShare < 0.04) score += 1
  if (score <= 1) return 'easy'
  if (score <= 3) return 'moderate'
  if (score <= 5) return 'advanced'
  return 'expert'
}

export const DIFFICULTY_META: Record<Difficulty, { label: string; level: number }> = {
  easy: { label: 'Easy', level: 1 },
  moderate: { label: 'Moderate', level: 2 },
  advanced: { label: 'Advanced', level: 3 },
  expert: { label: 'Expert', level: 4 },
}
