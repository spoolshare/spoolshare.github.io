/**
 * Photo utilities: downscaling uploads and estimating a swatch's HEX.
 *
 * Estimation samples a region, converts each pixel to CIELAB, discards the
 * brightest and darkest 20% by L* (specular glare, shadows, background
 * leaking in at edges) and takes the per-channel median of what remains.
 * The user can always override the estimate.
 */
import type { Hex } from '@/types'
import { labToHex, rgbToLab } from './convert'

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Downscales an image file to a JPEG data URL (keeps mock storage small). */
export async function downscaleImage(
  file: File,
  maxSize = 1200,
  quality = 0.85,
): Promise<{ url: string; width: number; height: number }> {
  const src = await readFileAsDataUrl(file)
  const img = await loadImage(src)
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, width, height)
  return { url: canvas.toDataURL('image/jpeg', quality), width, height }
}

export interface SampleRegion {
  /** Center, as a fraction of width/height (0..1). */
  x: number
  y: number
  /** Radius, as a fraction of the shorter side. */
  radius: number
}

const DEFAULT_REGION: SampleRegion = { x: 0.5, y: 0.5, radius: 0.22 }

export async function estimateHexFromImage(src: string, region: SampleRegion = DEFAULT_REGION): Promise<Hex> {
  const img = await loadImage(src)
  const size = 160
  const scale = size / Math.max(img.width, img.height)
  const w = Math.max(1, Math.round(img.width * scale))
  const h = Math.max(1, Math.round(img.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const cx = region.x * w
  const cy = region.y * h
  const r = region.radius * Math.min(w, h)
  const labs: { L: number; a: number; b: number }[] = []
  for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(h, Math.ceil(cy + r)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(w, Math.ceil(cx + r)); x++) {
      if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) continue
      const i = (y * w + x) * 4
      if (data[i + 3] < 200) continue
      labs.push(rgbToLab({ r: data[i], g: data[i + 1], b: data[i + 2] }))
    }
  }
  if (labs.length === 0) return '#808080'

  labs.sort((p, q) => p.L - q.L)
  const trim = Math.floor(labs.length * 0.2)
  const kept = labs.slice(trim, labs.length - trim || undefined)
  const median = (arr: number[]) => {
    const s = [...arr].sort((a, b) => a - b)
    return s[Math.floor(s.length / 2)]
  }
  return labToHex({
    L: median(kept.map((l) => l.L)),
    a: median(kept.map((l) => l.a)),
    b: median(kept.map((l) => l.b)),
  })
}
