import type { Hex } from '@/types'

export interface RGB { r: number; g: number; b: number } // 0..255
export interface Lab { L: number; a: number; b: number }
export interface LCh { L: number; C: number; h: number }
export interface HSV { h: number; s: number; v: number } // h 0..360, s/v 0..1
export interface XYZ { x: number; y: number; z: number }

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

// ------------------------------------------------------------------ HEX ---

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

export function isHex(value: string): boolean {
  return HEX_RE.test(value.trim())
}

/** Normalizes "#abc", "abc", or "#aabbcc" to "#AABBCC". Returns null for invalid input. */
export function normalizeHex(value: string): Hex | null {
  const m = value.trim().match(HEX_RE)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  return `#${h.toUpperCase()}`
}

export function hexToRgb(hex: Hex): RGB {
  const h = (normalizeHex(hex) ?? '#000000').slice(1)
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): Hex {
  const to = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase()
}

// ----------------------------------------------------------- sRGB gamma ---

export function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function linearToSrgb(v: number): number {
  const c = v <= 0.0031308 ? v * 12.92 : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
  return clamp(c * 255, 0, 255)
}

// --------------------------------------------------------- XYZ / Lab ------

// D65 reference white
const Xn = 0.95047
const Yn = 1.0
const Zn = 1.08883

export function rgbToXyz({ r, g, b }: RGB): XYZ {
  const R = srgbToLinear(r)
  const G = srgbToLinear(g)
  const B = srgbToLinear(b)
  return {
    x: R * 0.4124564 + G * 0.3575761 + B * 0.1804375,
    y: R * 0.2126729 + G * 0.7151522 + B * 0.072175,
    z: R * 0.0193339 + G * 0.119192 + B * 0.9503041,
  }
}

export function xyzToRgb({ x, y, z }: XYZ): RGB {
  const R = x * 3.2404542 + y * -1.5371385 + z * -0.4985314
  const G = x * -0.969266 + y * 1.8760108 + z * 0.041556
  const B = x * 0.0556434 + y * -0.2040259 + z * 1.0572252
  return { r: linearToSrgb(R), g: linearToSrgb(G), b: linearToSrgb(B) }
}

const EPS = 216 / 24389
const KAPPA = 24389 / 27

function f(t: number) {
  return t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116
}
function fInv(t: number) {
  const t3 = t * t * t
  return t3 > EPS ? t3 : (116 * t - 16) / KAPPA
}

export function xyzToLab({ x, y, z }: XYZ): Lab {
  const fx = f(x / Xn)
  const fy = f(y / Yn)
  const fz = f(z / Zn)
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) }
}

export function labToXyz({ L, a, b }: Lab): XYZ {
  const fy = (L + 16) / 116
  const fx = fy + a / 500
  const fz = fy - b / 200
  return { x: fInv(fx) * Xn, y: fInv(fy) * Yn, z: fInv(fz) * Zn }
}

export const rgbToLab = (rgb: RGB): Lab => xyzToLab(rgbToXyz(rgb))
export const labToRgb = (lab: Lab): RGB => xyzToRgb(labToXyz(lab))

const labCache = new Map<string, Lab>()
export function hexToLab(hex: Hex): Lab {
  let lab = labCache.get(hex)
  if (!lab) {
    lab = rgbToLab(hexToRgb(hex))
    if (labCache.size > 5000) labCache.clear()
    labCache.set(hex, lab)
  }
  return lab
}
export const labToHex = (lab: Lab): Hex => rgbToHex(labToRgb(lab))

export function labToLch({ L, a, b }: Lab): LCh {
  const C = Math.hypot(a, b)
  let h = (Math.atan2(b, a) * 180) / Math.PI
  if (h < 0) h += 360
  return { L, C, h }
}

// ------------------------------------------------------------------ HSV ---

export function rgbToHsv({ r, g, b }: RGB): HSV {
  const R = r / 255, G = g / 255, B = b / 255
  const max = Math.max(R, G, B)
  const min = Math.min(R, G, B)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === R) h = ((G - B) / d) % 6
    else if (max === G) h = (B - R) / d + 2
    else h = (R - G) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

export function hsvToRgb({ h, s, v }: HSV): RGB {
  const c = v * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r = 0, g = 0, b = 0
  if (hp < 1) [r, g, b] = [c, x, 0]
  else if (hp < 2) [r, g, b] = [x, c, 0]
  else if (hp < 3) [r, g, b] = [0, c, x]
  else if (hp < 4) [r, g, b] = [0, x, c]
  else if (hp < 5) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const m = v - c
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }
}

export const hexToHsv = (hex: Hex) => rgbToHsv(hexToRgb(hex))
export const hsvToHex = (hsv: HSV) => rgbToHex(hsvToRgb(hsv))

// ------------------------------------------------------------ Utilities ---

/** WCAG relative luminance (0..1). */
export function luminance(hex: Hex): number {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

export function contrastRatio(a: Hex, b: Hex): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/** Picks black or white text for legibility on top of a color. */
export function readableOn(hex: Hex): '#000000' | '#FFFFFF' {
  return contrastRatio(hex, '#000000') >= contrastRatio(hex, '#FFFFFF') ? '#000000' : '#FFFFFF'
}

/** True when a color is so light it needs a visible border on light surfaces. */
export function isVeryLight(hex: Hex): boolean {
  return luminance(hex) > 0.8
}

export function shade(hex: Hex, amount: number): Hex {
  const lab = hexToLab(hex)
  return labToHex({ ...lab, L: clamp(lab.L + amount, 0, 100) })
}

export function hexToRgbString(hex: Hex): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${r}, ${g}, ${b})`
}
