/**
 * Color *prediction*. Everything in this file is an approximation and MUST be
 * presented in the UI as "Calculated / Untested".
 *
 * Melted, pigmented plastic does not mix like light, and it does not mix like a
 * HEX average either. As a better-than-naive first guess we use a single-constant
 * Kubelka–Munk model per linear-sRGB channel:
 *
 *   R  = reflectance (linear, 0..1)
 *   K/S = (1 - R)² / 2R          ← absorption/scattering ratio
 *   mixture K/S = Σ wᵢ · (K/S)ᵢ
 *   R_mix = 1 + K/S − √((K/S)² + 2·K/S)
 *
 * This reproduces the familiar "a little blue goes a long way in white" behavior
 * that RGB averaging misses. It ignores pigment loading differences between brands,
 * translucency, and finish, which is why real community swatches always win.
 */
import type { Filament, Hex } from '@/types'
import { hexToRgb, rgbToHex, srgbToLinear, linearToSrgb } from './convert'
import { deltaE } from './deltaE'

// Real black PLA still reflects ~3–4%. A lower floor makes black absurdly dominant.
const R_MIN = 0.035
const R_MAX = 0.998

function toKS(R: number) {
  const r = Math.min(R_MAX, Math.max(R_MIN, R))
  return ((1 - r) * (1 - r)) / (2 * r)
}

function fromKS(ks: number) {
  return 1 + ks - Math.sqrt(ks * ks + 2 * ks)
}

type KS = [number, number, number]

const ksCache = new Map<Hex, KS>()
function hexToKS(hex: Hex): KS {
  let ks = ksCache.get(hex)
  if (!ks) {
    const { r, g, b } = hexToRgb(hex)
    ks = [toKS(srgbToLinear(r)), toKS(srgbToLinear(g)), toKS(srgbToLinear(b))]
    ksCache.set(hex, ks)
  }
  return ks
}

/**
 * Pigment "strength" multiplier per filament. Translucent filaments have less
 * pigment per gram, so they tint less. This is a crude correction and is documented as such.
 */
function tintStrength(f?: Pick<Filament, 'transparency'>): number {
  switch (f?.transparency) {
    case 'clear': return 0.15
    case 'translucent': return 0.45
    case 'semi': return 0.75
    default: return 1
  }
}

export interface MixComponent {
  hex: Hex
  weight: number
  filament?: Pick<Filament, 'transparency'>
}

/** Predicts the color of a mixture. Weights need not sum to 1. */
export function predictMix(components: MixComponent[]): Hex {
  const total = components.reduce((s, c) => s + c.weight, 0)
  if (total <= 0) return '#000000'
  const mix: KS = [0, 0, 0]
  let strengthSum = 0
  for (const c of components) {
    const w = (c.weight / total) * tintStrength(c.filament)
    strengthSum += w
    const ks = hexToKS(c.hex)
    mix[0] += w * ks[0]
    mix[1] += w * ks[1]
    mix[2] += w * ks[2]
  }
  const norm = strengthSum || 1
  return rgbToHex({
    r: linearToSrgb(fromKS(mix[0] / norm)),
    g: linearToSrgb(fromKS(mix[1] / norm)),
    b: linearToSrgb(fromKS(mix[2] / norm)),
  })
}

/** The naive approach, shown only for educational comparison. */
export function naiveRgbAverage(components: MixComponent[]): Hex {
  const total = components.reduce((s, c) => s + c.weight, 0) || 1
  const acc = { r: 0, g: 0, b: 0 }
  for (const c of components) {
    const rgb = hexToRgb(c.hex)
    acc.r += (rgb.r * c.weight) / total
    acc.g += (rgb.g * c.weight) / total
    acc.b += (rgb.b * c.weight) / total
  }
  return rgbToHex(acc)
}

// ------------------------------------------------------ Inverse search ----

export interface PredictedRecipe {
  components: { filament: Filament; weight: number }[]
  predictedHex: Hex
  deltaE: number
}

/** Snaps weights to "friendly" percentages (multiples of `step`) that still sum to 100. */
function snap(weights: number[], step = 5): number[] {
  const scaled = weights.map((w) => (w * 100) / step)
  const floored = scaled.map(Math.floor)
  let remainder = 100 / step - floored.reduce((a, b) => a + b, 0)
  const order = scaled
    .map((v, i) => ({ i, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac)
  for (const { i } of order) {
    if (remainder <= 0) break
    floored[i] += 1
    remainder -= 1
  }
  return floored.map((v) => (v * step) / 100)
}

/**
 * Suggests mixes of 1–3 filaments from `palette` that approximate `target`.
 * A coarse grid finds candidates, then a local refinement snaps them to 5% steps.
 */
export function suggestMixes(target: Hex, palette: Filament[], limit = 3): PredictedRecipe[] {
  const unique = dedupeByHex(palette)
  if (unique.length === 0) return []

  // Prune to the most relevant colors: closest to the target plus the lightest and darkest.
  const byDistance = [...unique].sort((a, b) => deltaE(a.hex, target) - deltaE(b.hex, target))
  const lightest = [...unique].sort((a, b) => lum(b.hex) - lum(a.hex))[0]
  const darkest = [...unique].sort((a, b) => lum(a.hex) - lum(b.hex))[0]
  const pool = dedupeById([...byDistance.slice(0, 9), lightest, darkest])

  const results: PredictedRecipe[] = []
  const evaluate = (fils: Filament[], weights: number[]) => {
    const hex = predictMix(fils.map((f, i) => ({ hex: f.hex, weight: weights[i], filament: f })))
    return { hex, dE: deltaE(hex, target) }
  }

  // singles
  for (const f of pool) {
    results.push({ components: [{ filament: f, weight: 1 }], predictedHex: f.hex, deltaE: deltaE(f.hex, target) })
  }

  // pairs, 5% grid
  for (let i = 0; i < pool.length; i++) {
    for (let j = i + 1; j < pool.length; j++) {
      let best = { w: 0, hex: '', dE: Infinity }
      for (let w = 0.05; w < 0.999; w += 0.05) {
        const r = evaluate([pool[i], pool[j]], [w, 1 - w])
        if (r.dE < best.dE) best = { w, hex: r.hex, dE: r.dE }
      }
      const [wa, wb] = snap([best.w, 1 - best.w])
      results.push({
        components: [{ filament: pool[i], weight: wa }, { filament: pool[j], weight: wb }],
        predictedHex: best.hex,
        deltaE: best.dE,
      })
    }
  }

  // triples, 10% grid then 5% refinement, restricted to the top pool members
  const triPool = pool.slice(0, 8)
  for (let i = 0; i < triPool.length; i++) {
    for (let j = i + 1; j < triPool.length; j++) {
      for (let k = j + 1; k < triPool.length; k++) {
        const fils = [triPool[i], triPool[j], triPool[k]]
        let best = { w: [0, 0, 0], hex: '', dE: Infinity }
        for (let a = 0.1; a <= 0.8001; a += 0.1) {
          for (let b = 0.1; a + b <= 0.9001; b += 0.1) {
            const w = [a, b, 1 - a - b]
            const r = evaluate(fils, w)
            if (r.dE < best.dE) best = { w, hex: r.hex, dE: r.dE }
          }
        }
        // local refinement
        for (let da = -0.05; da <= 0.05001; da += 0.05) {
          for (let db = -0.05; db <= 0.05001; db += 0.05) {
            const w = [best.w[0] + da, best.w[1] + db, 1 - best.w[0] - da - best.w[1] - db]
            if (w.some((x) => x < 0.03)) continue
            const r = evaluate(fils, w)
            if (r.dE < best.dE) best = { w, hex: r.hex, dE: r.dE }
          }
        }
        const snapped = snap(best.w)
        if (snapped.some((x) => x === 0)) continue
        results.push({
          components: fils.map((f, idx) => ({ filament: f, weight: snapped[idx] })),
          predictedHex: best.hex,
          deltaE: best.dE,
        })
      }
    }
  }

  // Prefer simpler recipes: a third ingredient must earn its place (≥ 1.5 ΔE better).
  const scored = results.map((r) => ({ r, score: r.deltaE + (r.components.length - 1) * 0.75 }))
  scored.sort((a, b) => a.score - b.score)

  const out: PredictedRecipe[] = []
  const seen = new Set<string>()
  for (const { r } of scored) {
    const key = r.components.map((c) => c.filament.id).sort().join('|')
    if (seen.has(key)) continue
    seen.add(key)
    // Recompute predicted hex with the snapped weights for honesty.
    const snappedHex = predictMix(r.components.map((c) => ({ hex: c.filament.hex, weight: c.weight, filament: c.filament })))
    out.push({ ...r, predictedHex: snappedHex, deltaE: deltaE(snappedHex, target) })
    if (out.length >= limit) break
  }
  return out.sort((a, b) => a.deltaE - b.deltaE)
}

function lum(hex: Hex) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function dedupeByHex(fils: Filament[]) {
  const m = new Map<string, Filament>()
  for (const f of fils) if (!m.has(f.hex)) m.set(f.hex, f)
  return [...m.values()]
}
function dedupeById(fils: Filament[]) {
  const m = new Map<string, Filament>()
  for (const f of fils) m.set(f.id, f)
  return [...m.values()]
}
