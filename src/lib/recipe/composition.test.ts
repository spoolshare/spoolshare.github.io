import { describe, expect, it } from 'vitest'
import type { Stage } from '@/types'
import {
  flattenComposition,
  formatRatio,
  parseRatio,
  planRecipe,
  simplestIntegerRatio,
  validateStages,
} from './composition'
import { deltaE2000 } from '@/lib/color/deltaE'
import { predictMix } from '@/lib/color/mixing'

const fil = (filamentId: string, parts: number, id = filamentId) => ({ id, source: { kind: 'filament' as const, filamentId }, parts })
const stg = (stageId: string, parts: number, id = stageId) => ({ id: `in-${id}`, source: { kind: 'stage' as const, stageId }, parts })

const dustyPurple: Stage[] = [
  { id: 's1', name: 'Create Light Blue', outputName: 'Light Blue', inputs: [fil('white', 75), fil('cobalt', 25)], instructions: '', photos: [] },
  { id: 's2', name: 'Create Purple', outputName: 'Final Purple', inputs: [fil('white', 50, 'w2'), fil('red', 25), stg('s1', 25)], instructions: '', photos: [] },
]

describe('flattenComposition', () => {
  it('computes the true final composition of a two-stage recipe', () => {
    const comp = Object.fromEntries(flattenComposition(dustyPurple).map((c) => [c.filamentId, c.fraction]))
    expect(comp.white).toBeCloseTo(0.6875)
    expect(comp.red).toBeCloseTo(0.25)
    expect(comp.cobalt).toBeCloseTo(0.0625)
  })

  it('handles ratios expressed as parts', () => {
    const comp = flattenComposition([{ ...dustyPurple[0], inputs: [fil('white', 3), fil('cobalt', 1)] }])
    expect(comp[0]).toEqual({ filamentId: 'white', fraction: 0.75 })
  })
})

describe('planRecipe', () => {
  it('works backwards from a target mass', () => {
    const plan = planRecipe(dustyPurple, 10)
    expect(plan.stages[0].grams).toBeCloseTo(2.5)
    expect(plan.stages[1].grams).toBeCloseTo(10)
    const totals = Object.fromEntries(plan.totals.map((t) => [t.filamentId, t.grams]))
    expect(totals.white).toBeCloseTo(6.875)
    expect(totals.red).toBeCloseTo(2.5)
    expect(totals.cobalt).toBeCloseTo(0.625)
    expect(plan.stages[0].inputs.map((i) => i.units)).toEqual([3, 1])
    expect(plan.stages[1].inputs.map((i) => i.units)).toEqual([2, 1, 1])
  })

  it('applies a waste allowance to every stage', () => {
    const plan = planRecipe(dustyPurple, 10, 10)
    expect(plan.stages[1].grams).toBeCloseTo(11)
    expect(plan.stages[0].grams).toBeCloseTo(11 * 0.25 * 1.1)
  })
})

describe('ratios', () => {
  it('simplifies to integers', () => {
    expect(simplestIntegerRatio([75, 25])).toEqual([3, 1])
    expect(simplestIntegerRatio([50, 25, 25])).toEqual([2, 1, 1])
    expect(simplestIntegerRatio([68.75, 25, 6.25])).toEqual([11, 4, 1])
    expect(simplestIntegerRatio([1, Math.PI])).toBeNull()
  })
  it('formats and parses', () => {
    expect(formatRatio([75, 25])).toBe('3:1')
    expect(parseRatio('2:1:1')).toEqual([2, 1, 1])
    expect(parseRatio('50% 25% 25%')).toEqual([50, 25, 25])
    expect(parseRatio('3/1')).toEqual([3, 1])
    expect(parseRatio('a:1')).toBeNull()
  })
})

describe('validateStages', () => {
  it('flags forward references', () => {
    const bad: Stage[] = [{ ...dustyPurple[1], id: 's2' }, { ...dustyPurple[0], id: 's1' }]
    expect(validateStages(bad).some((i) => i.level === 'error')).toBe(true)
    expect(validateStages(dustyPurple).filter((i) => i.level === 'error')).toHaveLength(0)
  })
})

describe('color science', () => {
  it('matches the Sharma CIEDE2000 reference pairs', () => {
    expect(deltaE2000({ L: 50, a: 2.6772, b: -79.7751 }, { L: 50, a: 0, b: -82.7485 })).toBeCloseTo(2.0425, 3)
    expect(deltaE2000({ L: 50, a: 2.5, b: 0 }, { L: 73, a: 25, b: -18 })).toBeCloseTo(27.1492, 3)
    expect(deltaE2000({ L: 2.0776, a: 0.0795, b: -1.135 }, { L: 0.9033, a: -0.0636, b: -0.5514 })).toBeCloseTo(0.9082, 3)
  })
  it('Kubelka–Munk tints white more than RGB averaging predicts darkness', () => {
    const km = predictMix([{ hex: '#FFFFFF', weight: 0.9 }, { hex: '#0056B8', weight: 0.1 }])
    expect(km).not.toBe('#FFFFFF')
  })
})

describe('mixer slots', () => {
  it('maps ratios onto 4 slots', async () => {
    const { slotCounts, slotLayout } = await import('./composition')
    expect(slotCounts([75, 25])).toEqual([3, 1])
    expect(slotCounts([1, 1])).toEqual([2, 2])
    expect(slotCounts([2, 1, 1])).toEqual([2, 1, 1])
    expect(slotCounts([6, 2, 1])).toBeNull()
    expect(slotLayout([2, 1, 1])).toEqual([0, 1, 0, 2])
    expect(slotLayout([1, 1])).toEqual([0, 1, 0, 1])
    expect(slotLayout([3, 1])).toEqual([0, 0, 0, 1])
  })
})
