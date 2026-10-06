import type { CompositionEntry, FilamentView, ID } from '@/types'
import { deltaE } from '@/lib/color/deltaE'

export interface Substitute {
  missing: FilamentView
  candidate: FilamentView
  deltaE: number
}

export interface CanMakeResult {
  canMake: boolean
  ownedCount: number
  requiredCount: number
  missing: FilamentView[]
  /** Owned filaments that *might* stand in for missing ones. Untested suggestions. */
  substitutes: Substitute[]
}

/**
 * Checks a recipe's flattened composition against the user's inventory.
 * Substitutes are suggested only when the owned filament is the same material
 * and close in display color (ΔE00 ≤ 6). They are labeled as untested in the UI,
 * because two "whites" can tint very differently.
 */
export function checkCanMake(
  composition: CompositionEntry[],
  filamentsById: Map<ID, FilamentView> | Record<ID, FilamentView>,
  owned: Set<ID>,
  ownedFilaments: FilamentView[] = [],
): CanMakeResult {
  const get = (id: ID) => (filamentsById instanceof Map ? filamentsById.get(id) : filamentsById[id])
  const required = composition.map((c) => c.filamentId)
  const missingIds = required.filter((id) => !owned.has(id))
  const missing = missingIds.map(get).filter((f): f is FilamentView => !!f)

  const substitutes: Substitute[] = []
  for (const m of missing) {
    let best: Substitute | null = null
    for (const o of ownedFilaments) {
      if (o.material !== m.material && !(o.material.startsWith('PLA') && m.material.startsWith('PLA'))) continue
      const d = deltaE(o.hex, m.hex)
      if (d <= 6 && (!best || d < best.deltaE)) best = { missing: m, candidate: o, deltaE: d }
    }
    if (best) substitutes.push(best)
  }

  return {
    canMake: missingIds.length === 0 && required.length > 0,
    ownedCount: required.length - missingIds.length,
    requiredCount: required.length,
    missing,
    substitutes,
  }
}
