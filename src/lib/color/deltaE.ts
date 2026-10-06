import type { Hex } from '@/types'
import { hexToLab, labToHex, type Lab } from './convert'

const rad = (deg: number) => (deg * Math.PI) / 180
const deg = (r: number) => (r * 180) / Math.PI

/**
 * CIEDE2000 color difference (Sharma, Wu & Dalal 2005 reference implementation).
 * Perceptually uniform enough to rank "closest color" results. ΔE ≈ 1 is a just-noticeable difference.
 */
export function deltaE2000(lab1: Lab, lab2: Lab): number {
  const { L: L1, a: a1, b: b1 } = lab1
  const { L: L2, a: a2, b: b2 } = lab2

  const C1 = Math.hypot(a1, b1)
  const C2 = Math.hypot(a2, b2)
  const Cbar = (C1 + C2) / 2
  const Cbar7 = Math.pow(Cbar, 7)
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + Math.pow(25, 7))))

  const a1p = (1 + G) * a1
  const a2p = (1 + G) * a2
  const C1p = Math.hypot(a1p, b1)
  const C2p = Math.hypot(a2p, b2)

  const h1p = C1p === 0 ? 0 : (deg(Math.atan2(b1, a1p)) + 360) % 360
  const h2p = C2p === 0 ? 0 : (deg(Math.atan2(b2, a2p)) + 360) % 360

  const dLp = L2 - L1
  const dCp = C2p - C1p

  let dhp = 0
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p
    if (dhp > 180) dhp -= 360
    else if (dhp < -180) dhp += 360
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(rad(dhp / 2))

  const Lbarp = (L1 + L2) / 2
  const Cbarp = (C1p + C2p) / 2

  let hbarp = h1p + h2p
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2
    else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2
    else hbarp = (h1p + h2p - 360) / 2
  }

  const T =
    1 -
    0.17 * Math.cos(rad(hbarp - 30)) +
    0.24 * Math.cos(rad(2 * hbarp)) +
    0.32 * Math.cos(rad(3 * hbarp + 6)) -
    0.2 * Math.cos(rad(4 * hbarp - 63))

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2))
  const Cbarp7 = Math.pow(Cbarp, 7)
  const Rc = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + Math.pow(25, 7)))
  const Lm50 = Math.pow(Lbarp - 50, 2)
  const Sl = 1 + (0.015 * Lm50) / Math.sqrt(20 + Lm50)
  const Sc = 1 + 0.045 * Cbarp
  const Sh = 1 + 0.015 * Cbarp * T
  const Rt = -Math.sin(rad(2 * dTheta)) * Rc

  return Math.sqrt(
    Math.pow(dLp / Sl, 2) +
      Math.pow(dCp / Sc, 2) +
      Math.pow(dHp / Sh, 2) +
      Rt * (dCp / Sc) * (dHp / Sh),
  )
}

export function deltaE(hexA: Hex, hexB: Hex): number {
  return deltaE2000(hexToLab(hexA), hexToLab(hexB))
}

// ---------------------------------------------------------------- Bands ---

export type DeltaBand = 'identical' | 'close' | 'noticeable' | 'different'

export const CLOSE_MATCH_THRESHOLD = 5

export function deltaBand(dE: number): DeltaBand {
  if (dE <= 2) return 'identical'
  if (dE <= CLOSE_MATCH_THRESHOLD) return 'close'
  if (dE <= 10) return 'noticeable'
  return 'different'
}

export const DELTA_BAND_LABEL: Record<DeltaBand, string> = {
  identical: 'Near-identical',
  close: 'Close match',
  noticeable: 'Noticeable difference',
  different: 'Different color',
}

/** 0..100 "match" score, handy for UI meters. ΔE 0 → 100 and ΔE ≥ 25 → 0. */
export function matchScore(dE: number): number {
  return Math.max(0, Math.round(100 - dE * 4))
}

// ------------------------------------------------------- Lab averaging ---

/** Averages colors in CIELAB (perceptual space) rather than RGB. */
export function averageLab(hexes: Hex[], weights?: number[]): Hex | null {
  if (hexes.length === 0) return null
  let L = 0, a = 0, b = 0, w = 0
  hexes.forEach((h, i) => {
    const lab = hexToLab(h)
    const wi = weights?.[i] ?? 1
    L += lab.L * wi
    a += lab.a * wi
    b += lab.b * wi
    w += wi
  })
  return labToHex({ L: L / w, a: a / w, b: b / w })
}

/** RMS ΔE of every color vs. their Lab mean: a consistency/spread figure. */
export function deltaSpread(hexes: Hex[]): number | null {
  if (hexes.length < 2) return null
  const mean = averageLab(hexes)!
  const sq = hexes.reduce((acc, h) => acc + Math.pow(deltaE(h, mean), 2), 0)
  return Math.sqrt(sq / hexes.length)
}
