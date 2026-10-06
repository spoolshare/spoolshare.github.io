import { describe, expect, it } from 'vitest'
import { hueFamily, resolveColorName, nearestColorName } from './names'
import { hexToLab, labToHex, normalizeHex } from './convert'
import { averageLab, deltaE } from './deltaE'
import { suggestMixes } from './mixing'
import type { Filament } from '@/types'

describe('names', () => {
  it('maps common colors to hue families', () => {
    const cases: [string, string][] = [
      ['#C12E1F', 'red'], ['#FF6A13', 'orange'], ['#F4EE2A', 'yellow'], ['#00AE42', 'green'],
      ['#00B1B7', 'teal'], ['#0056B8', 'blue'], ['#5E43B7', 'purple'], ['#C1AAD6', 'purple'],
      ['#F55A74', 'pink'], ['#9D432C', 'brown'], ['#8E9089', 'neutral'], ['#FFFFFF', 'neutral'],
    ]
    for (const [hex, fam] of cases) expect([hex, hueFamily(hex)]).toEqual([hex, fam])
  })
  it('resolves names', () => {
    expect(resolveColorName('lavender')?.name).toBe('Lavender')
    expect(nearestColorName('#C1AAD6')).toBe('Dusty Lavender')
  })
})

describe('convert', () => {
  it('round-trips through Lab', () => {
    for (const h of ['#C1AAD6', '#0056B8', '#000000', '#FFFFFF', '#F4EE2A']) expect(labToHex(hexToLab(h))).toBe(h)
    expect(normalizeHex('abc')).toBe('#AABBCC')
    expect(normalizeHex('zzz')).toBeNull()
  })
  it('averages in Lab', () => {
    expect(deltaE(averageLab(['#FFFFFF', '#000000'])!, '#777777')).toBeLessThan(2)
  })
})

describe('suggestMixes', () => {
  const f = (id: string, hex: string): Filament => ({ id, hex, manufacturerId: 'm', productLineId: 'l', material: 'PLA', colorName: id, finish: 'basic', transparency: 'opaque' })
  it('finds a blend closer than any single filament', () => {
    const palette = [f('white', '#FFFFFF'), f('blue', '#0056B8'), f('red', '#C12E1F'), f('black', '#000000')]
    const [best] = suggestMixes('#8FB2DE', palette)
    expect(best.components.length).toBeGreaterThan(1)
    expect(best.deltaE).toBeLessThan(Math.min(...palette.map((p) => deltaE(p.hex, '#8FB2DE'))))
    expect(best.components.reduce((s, c) => s + c.weight, 0)).toBeCloseTo(1)
  })
})
