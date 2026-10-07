/**
 * The recipe math. Pure functions, unit-tested in composition.test.ts.
 *
 * Stage inputs are stored as relative `parts`. A stage may consume the outputs of
 * EARLIER stages only, so the stage graph is a DAG in array order and the last stage
 * is the final product.
 */
import type { CompositionEntry, ID, Recipe, Stage, StageInput } from '@/types'

// ------------------------------------------------------------- Ratios -----

/** Fractions (0..1) for a stage's inputs, in input order. */
export function inputFractions(inputs: Pick<StageInput, 'parts'>[]): number[] {
  const total = inputs.reduce((s, i) => s + (i.parts > 0 ? i.parts : 0), 0)
  if (total <= 0) return inputs.map(() => 0)
  return inputs.map((i) => (i.parts > 0 ? i.parts / total : 0))
}

export function toPercentages(parts: number[]): number[] {
  const total = parts.reduce((s, p) => s + Math.max(0, p), 0)
  return total > 0 ? parts.map((p) => (Math.max(0, p) / total) * 100) : parts.map(() => 0)
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/**
 * Reduces parts to the smallest integer ratio when the fractions allow it
 * (to within `maxTotal` units). 75/25 → [3, 1], 50/25/25 → [2, 1, 1] and
 * 68.75/25/6.25 → [11, 4, 1]. Returns null if no clean ratio exists.
 */
export function simplestIntegerRatio(parts: number[], maxTotal = 24): number[] | null {
  const fr = inputFractions(parts.map((p) => ({ parts: p })))
  if (fr.every((f) => f === 0)) return null
  for (let total = 1; total <= maxTotal; total++) {
    const units = fr.map((f) => f * total)
    if (units.every((u) => Math.abs(u - Math.round(u)) < 1e-6) && units.every((u) => Math.round(u) > 0 || u === 0)) {
      const ints = units.map(Math.round)
      const g = ints.reduce((a, b) => gcd(a, b))
      return ints.map((i) => i / (g || 1))
    }
  }
  return null
}

/** "3:1" or "2:1:1"; falls back to rounded percentages "62:38". */
export function formatRatio(parts: number[]): string {
  const ints = simplestIntegerRatio(parts)
  if (ints) return ints.join(':')
  return toPercentages(parts).map((p) => Math.round(p)).join(':')
}

/**
 * Parses user ratio text. Accepts "3:1", "2:1:1", "75/25", "50% 25% 25%", or "1 : 1".
 * Returns null when the text isn't a valid list of positive numbers.
 */
export function parseRatio(text: string): number[] | null {
  const cleaned = text.replace(/%/g, ' ').trim()
  if (!cleaned) return null
  const nums = cleaned.split(/[\s:/,;]+/).filter(Boolean).map(Number)
  if (nums.length === 0 || nums.some((n) => !Number.isFinite(n) || n <= 0)) return null
  return nums
}

// --------------------------------------------------------- Flattening -----

export interface CompositionError {
  stageId: ID
  message: string
}

/**
 * Computes the true final composition by recursively expanding intermediates.
 *
 * Dusty Purple: S1 = 75 White + 25 Cobalt, S2 = 50 White + 25 Red + 25 S1
 *   → White 68.75%, Red 25%, Cobalt 6.25%
 */
export function flattenComposition(stages: Stage[], targetStageId?: ID): CompositionEntry[] {
  if (stages.length === 0) return []
  const index = new Map(stages.map((s, i) => [s.id, i]))
  const memo = new Map<ID, Map<ID, number>>()

  const expand = (stageId: ID, visiting: Set<ID>): Map<ID, number> => {
    const cached = memo.get(stageId)
    if (cached) return cached
    if (visiting.has(stageId)) throw new Error('Circular stage reference')
    const stage = stages[index.get(stageId)!]
    if (!stage) throw new Error(`Unknown stage ${stageId}`)
    visiting.add(stageId)
    const fr = inputFractions(stage.inputs)
    const out = new Map<ID, number>()
    stage.inputs.forEach((input, i) => {
      if (fr[i] === 0) return
      if (input.source.kind === 'filament') {
        out.set(input.source.filamentId, (out.get(input.source.filamentId) ?? 0) + fr[i])
      } else {
        const sub = expand(input.source.stageId, visiting)
        for (const [fid, f] of sub) out.set(fid, (out.get(fid) ?? 0) + f * fr[i])
      }
    })
    visiting.delete(stageId)
    memo.set(stageId, out)
    return out
  }

  const target = targetStageId ?? stages[stages.length - 1].id
  const map = expand(target, new Set())
  return [...map.entries()]
    .map(([filamentId, fraction]) => ({ filamentId, fraction }))
    .sort((a, b) => b.fraction - a.fraction)
}

export function recipeComposition(recipe: Pick<Recipe, 'stages'>): CompositionEntry[] {
  try {
    return flattenComposition(recipe.stages)
  } catch {
    return []
  }
}

/** Every distinct filament the recipe consumes (directly or via intermediates). */
export function requiredFilamentIds(recipe: Pick<Recipe, 'stages'>): ID[] {
  return recipeComposition(recipe).map((c) => c.filamentId)
}

// ------------------------------------------------------------ Planner -----

export interface PlannedInput {
  input: StageInput
  fraction: number
  grams: number
  /** Integer "load units" when the ratio is clean (e.g. 3 × White, 1 × Cobalt). */
  units: number | null
}

export interface PlannedStage {
  stage: Stage
  index: number
  /** Grams of this stage's output that must be produced. */
  grams: number
  inputs: PlannedInput[]
  /** Which later stages consume this one. */
  consumedBy: ID[]
  isFinal: boolean
}

export interface Plan {
  targetGrams: number
  wastePercent: number
  stages: PlannedStage[]
  /** Raw filament totals across the whole recipe (incl. waste). */
  totals: { filamentId: ID; grams: number; fraction: number }[]
}

/**
 * Works backwards from a desired final mass. Each intermediate is produced in
 * exactly the amount later stages consume, plus a waste/purge allowance.
 */
export function planRecipe(stages: Stage[], targetGrams: number, wastePercent = 0): Plan {
  const waste = 1 + Math.max(0, wastePercent) / 100
  const need = new Map<ID, number>()
  const consumedBy = new Map<ID, ID[]>()
  const n = stages.length
  if (n === 0) return { targetGrams, wastePercent, stages: [], totals: [] }

  need.set(stages[n - 1].id, targetGrams * waste)
  // Walk from the final stage backwards so each stage's need is known before its inputs.
  for (let i = n - 1; i >= 0; i--) {
    const s = stages[i]
    const g = need.get(s.id) ?? 0
    const fr = inputFractions(s.inputs)
    s.inputs.forEach((inp, k) => {
      if (inp.source.kind !== 'stage') return
      const src = inp.source.stageId
      // An intermediate is itself made with some waste.
      need.set(src, (need.get(src) ?? 0) + g * fr[k] * waste)
      consumedBy.set(src, [...(consumedBy.get(src) ?? []), s.id])
    })
  }

  const totals = new Map<ID, number>()
  const planned: PlannedStage[] = stages.map((stage, index) => {
    const grams = need.get(stage.id) ?? 0
    const fr = inputFractions(stage.inputs)
    const ints = simplestIntegerRatio(stage.inputs.map((i) => i.parts), 12)
    const inputs = stage.inputs.map((input, k) => {
      const g = grams * fr[k]
      if (input.source.kind === 'filament') {
        totals.set(input.source.filamentId, (totals.get(input.source.filamentId) ?? 0) + g)
      }
      return { input, fraction: fr[k], grams: g, units: ints ? ints[k] : null }
    })
    return { stage, index, grams, inputs, consumedBy: consumedBy.get(stage.id) ?? [], isFinal: index === n - 1 }
  })

  const totalRaw = [...totals.values()].reduce((a, b) => a + b, 0) || 1
  return {
    targetGrams,
    wastePercent,
    stages: planned,
    totals: [...totals.entries()]
      .map(([filamentId, grams]) => ({ filamentId, grams, fraction: grams / totalRaw }))
      .sort((a, b) => b.grams - a.grams),
  }
}

// --------------------------------------------------------- Validation -----

export interface RecipeIssue {
  stageId?: ID
  inputId?: ID
  level: 'error' | 'warning'
  message: string
}

export function validateStages(stages: Stage[]): RecipeIssue[] {
  const issues: RecipeIssue[] = []
  if (stages.length === 0) {
    issues.push({ level: 'error', message: 'Add at least one mixing stage.' })
    return issues
  }
  const seen = new Set<ID>()
  const used = new Set<ID>()
  stages.forEach((s, idx) => {
    if (!s.name.trim()) issues.push({ stageId: s.id, level: 'warning', message: `Stage ${idx + 1} needs a name.` })
    if (s.inputs.length === 0) {
      issues.push({ stageId: s.id, level: 'error', message: `Stage ${idx + 1} has no inputs.` })
    } else if (s.inputs.length === 1 && idx === stages.length - 1 && stages.length === 1) {
      issues.push({ stageId: s.id, level: 'warning', message: 'A single-ingredient recipe is just the original filament.' })
    }
    s.inputs.forEach((inp) => {
      if (!(inp.parts > 0)) issues.push({ stageId: s.id, inputId: inp.id, level: 'error', message: `Stage ${idx + 1} has an input without a ratio.` })
      if (inp.source.kind === 'stage') {
        if (!seen.has(inp.source.stageId)) {
          issues.push({ stageId: s.id, inputId: inp.id, level: 'error', message: `Stage ${idx + 1} uses an intermediate that isn't made before it.` })
        }
        used.add(inp.source.stageId)
      } else if (!inp.source.filamentId) {
        issues.push({ stageId: s.id, inputId: inp.id, level: 'error', message: `Stage ${idx + 1} has an input with no filament selected.` })
      }
    })
    if (s.inputs.length > 0 && s.inputs.every((i) => i.parts > 0) && !slotCounts(s.inputs.map((i) => i.parts))) {
      issues.push({ stageId: s.id, level: 'warning', message: `Stage ${idx + 1} doesn\u2019t fit the mixer\u2019s 4 slots. Use 1:1, 3:1, 2:1:1 or 1:1:1:1, or split it into two stages.` })
    }
    seen.add(s.id)
  })
  stages.slice(0, -1).forEach((s, idx) => {
    if (!used.has(s.id)) {
      issues.push({ stageId: s.id, level: 'warning', message: `Stage ${idx + 1} (“${s.outputName || s.name}”) is never used by a later stage.` })
    }
  })
  return issues
}

// ------------------------------------------------------------ Mixer slots --

/**
 * The Multi-Color Filament Mixer has 4 slots and every print fills all 4.
 * Returns how many slots each input gets (e.g. 75/25 → [3, 1], 50/50 → [2, 2]),
 * or null when the ratio can't be expressed in 4 equal slots.
 */
export function slotCounts(parts: number[], slots = 4): number[] | null {
  const ints = simplestIntegerRatio(parts, slots)
  if (!ints) return null
  const total = ints.reduce((a, b) => a + b, 0)
  if (total === 0 || slots % total !== 0) return null
  return ints.map((n) => n * (slots / total))
}

/**
 * Orders the slots so the same input is never next to itself when that's
 * possible (better mixing): e.g. 2:1:1 → A, B, A, C. Returns input indexes per slot.
 */
export function slotLayout(parts: number[], slots = 4): number[] | null {
  const counts = slotCounts(parts, slots)
  if (!counts) return null
  const order = counts.map((c, i) => ({ i, c })).filter((x) => x.c > 0).sort((a, b) => b.c - a.c)
  const seq: number[] = []
  for (const { i, c } of order) for (let k = 0; k < c; k++) seq.push(i)
  // Fill even positions first, then odd: spreads the most common input apart.
  const out = new Array<number>(slots)
  const positions = [...Array(slots).keys()].filter((p) => p % 2 === 0).concat([...Array(slots).keys()].filter((p) => p % 2 === 1))
  seq.forEach((inputIndex, k) => (out[positions[k]] = inputIndex))
  return out
}

/** The slot ratios the mixer can make in a single print. */
export const MIXER_RATIOS: { label: string; parts: number[] }[] = [
  { label: '1:1', parts: [1, 1] },
  { label: '3:1', parts: [3, 1] },
  { label: '2:1:1', parts: [2, 1, 1] },
  { label: '1:1:1:1', parts: [1, 1, 1, 1] },
]
