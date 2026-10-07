import type { Difficulty, Recipe, Reproduction, ReproductionStats, TrustLevel } from '@/types'
import { averageLab, CLOSE_MATCH_THRESHOLD, deltaE, deltaSpread } from '@/lib/color/deltaE'
import { recipeComposition } from './composition'

/**
 * Example recipes start from a CALCULATED color, never a printed one, so
 * their reference is the first physical reproduction instead, and the
 * calculated color is never averaged in as if it were a real result.
 */
export function referenceHex(recipe: Pick<Recipe, 'resultHex' | 'isExample'>, reproductions: Reproduction[]): string | null {
  if (!recipe.isExample) return recipe.resultHex
  const first = [...reproductions].sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))[0]
  return first?.resultHex ?? null
}

/** Human label for a recipe's own color, e.g. on the detail page. */
export function resultColorLabel(recipe: Pick<Recipe, 'isExample'>): string {
  return recipe.isExample ? 'Calculated preview' : 'Printed result'
}

export function reproductionStats(recipe: Pick<Recipe, 'resultHex' | 'isExample'>, reproductions: Reproduction[]): ReproductionStats {
  const ref = referenceHex(recipe, reproductions)
  if (reproductions.length === 0 || !ref) {
    return { count: reproductions.length, closeCount: 0, meanDeltaE: null, averageHex: null, spread: null, averageRating: null }
  }
  const physical = reproductions.map((r) => r.resultHex)
  // For examples the first reproduction IS the reference, so compare the others against it.
  const compared = recipe.isExample ? physical.slice(1) : physical
  const des = compared.map((h) => deltaE(h, ref))
  const all = recipe.isExample ? physical : [recipe.resultHex, ...physical]
  if (des.length === 0) {
    return { count: reproductions.length, closeCount: 0, meanDeltaE: null, averageHex: averageLab(all), spread: null, averageRating: reproductions.reduce((a, r) => a + r.accuracyRating, 0) / reproductions.length }
  }
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
  // An example becomes Tested once someone physically prints it, Reproduced once a second print agrees.
  if (recipe?.isExample && stats.count === 0) return 'calculated'
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
