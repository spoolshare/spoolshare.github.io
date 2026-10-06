/**
 * A compact color-name vocabulary used to
 *  1. turn searches like "lavender" into a target color, and
 *  2. give any HEX a friendly approximate name ("≈ Dusty Rose").
 */
import type { Hex } from '@/types'
import { deltaE } from './deltaE'
import { hexToLab, labToLch } from './convert'

export const COLOR_NAMES: [name: string, hex: Hex][] = [
  ['White', '#FFFFFF'], ['Ivory', '#FFFFF0'], ['Cream', '#FFF5D6'], ['Eggshell', '#F0EAD6'],
  ['Bone', '#E3DAC9'], ['Beige', '#E8D9BE'], ['Sand', '#D8C3A0'], ['Tan', '#C9A97A'],
  ['Khaki', '#B9A779'], ['Camel', '#B4874F'], ['Caramel', '#B06E2E'], ['Cinnamon', '#9B4F23'],
  ['Brown', '#7A4A2A'], ['Chocolate', '#5A3420'], ['Espresso', '#3C2518'], ['Coffee', '#6F4E37'],
  ['Mocha', '#8A6A55'], ['Taupe', '#8B7D70'], ['Mushroom', '#A89A8C'],
  ['Black', '#111111'], ['Charcoal', '#36393D'], ['Graphite', '#4A4E52'], ['Slate', '#5E6A75'],
  ['Gray', '#8E9196'], ['Silver', '#BFC3C7'], ['Light Gray', '#D5D8DB'], ['Ash', '#B2B0AA'],
  ['Red', '#C8252C'], ['Crimson', '#A3132D'], ['Cherry', '#B1182B'], ['Scarlet', '#E0261F'],
  ['Brick', '#9C3F2E'], ['Rust', '#A6481F'], ['Maroon', '#6E1A26'], ['Burgundy', '#7B1E34'],
  ['Wine', '#6A2238'], ['Oxblood', '#4E1A1E'],
  ['Pink', '#F4A6B9'], ['Blush', '#E9B7B5'], ['Rose', '#E07A8F'], ['Dusty Rose', '#C08A8F'],
  ['Hot Pink', '#F0468C'], ['Magenta', '#D3197F'], ['Fuchsia', '#C52AA8'], ['Bubblegum', '#F78FC0'],
  ['Salmon', '#F08A72'], ['Coral', '#F2705A'], ['Peach', '#F8B98E'], ['Apricot', '#F6A86A'],
  ['Orange', '#F26B1D'], ['Tangerine', '#F7891E'], ['Pumpkin', '#E3701B'], ['Terracotta', '#C45E3E'],
  ['Amber', '#F2A900'], ['Mustard', '#D4A12A'], ['Gold', '#D4AF37'], ['Honey', '#E4A43A'],
  ['Yellow', '#F5D90A'], ['Lemon', '#F7EA48'], ['Butter', '#F7E7A1'], ['Canary', '#FCE94F'],
  ['Lime', '#A7D129'], ['Chartreuse', '#B5D82A'], ['Pistachio', '#A9C98A'], ['Sage', '#9CAF88'],
  ['Mint', '#A8E6C1'], ['Seafoam', '#8FD3B6'], ['Green', '#2E9E4A'], ['Kelly Green', '#3BA34A'],
  ['Emerald', '#1F8A5B'], ['Forest Green', '#2C5E36'], ['Olive', '#6E6B2F'], ['Moss', '#6B7A3A'],
  ['Army Green', '#4B5320'], ['Hunter Green', '#355E3B'], ['Jade', '#3AA17E'],
  ['Teal', '#1C8C8C'], ['Turquoise', '#2CC4C0'], ['Aqua', '#4FD6E0'], ['Cyan', '#16A9D9'],
  ['Sky Blue', '#87C5EA'], ['Baby Blue', '#B6D8F2'], ['Powder Blue', '#B7CCE0'], ['Light Blue', '#9CC3E6'],
  ['Cornflower', '#6A93D8'], ['Blue', '#1E5CC6'], ['Cobalt', '#0050B5'], ['Royal Blue', '#2B4FBF'],
  ['Azure', '#2F7FE0'], ['Denim', '#3D5A80'], ['Steel Blue', '#4C7397'], ['Navy', '#1B2A55'],
  ['Midnight Blue', '#16213E'], ['Indigo', '#3B2A7A'], ['Periwinkle', '#9BA6E6'],
  ['Lavender', '#B9A6DB'], ['Dusty Lavender', '#C1AAD6'], ['Lilac', '#C7A5D9'], ['Mauve', '#B08497'],
  ['Wisteria', '#A68CC9'], ['Orchid', '#C578C8'], ['Violet', '#7F4AC2'], ['Purple', '#6A3BA0'],
  ['Plum', '#713B6C'], ['Grape', '#5B2C83'], ['Eggplant', '#4A2B4F'], ['Amethyst', '#8E62B8'],
  ['Dusty Purple', '#8C6E93'], ['Mulberry', '#7E3B62'],
]

const NAME_INDEX = COLOR_NAMES.map(([name, hex]) => ({ name, hex, lower: name.toLowerCase() }))

/** Finds named colors that match a text query, best match first. */
export function searchColorNames(query: string, limit = 8): { name: string; hex: Hex }[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return NAME_INDEX
    .map((n) => {
      let score = -1
      if (n.lower === q) score = 100
      else if (n.lower.startsWith(q)) score = 80
      else if (n.lower.split(' ').some((w) => w.startsWith(q))) score = 60
      else if (n.lower.includes(q)) score = 40
      return { ...n, score }
    })
    .filter((n) => n.score >= 0)
    .sort((a, b) => b.score - a.score || a.name.length - b.name.length)
    .slice(0, limit)
    .map(({ name, hex }) => ({ name, hex }))
}

/** Resolves a query to one color if it's an exact or leading name match. */
export function resolveColorName(query: string): { name: string; hex: Hex } | null {
  return searchColorNames(query, 1)[0] ?? null
}

/** The nearest vocabulary name for an arbitrary color. */
export function nearestColorName(hex: Hex): string {
  let best = NAME_INDEX[0]
  let bestDe = Infinity
  for (const n of NAME_INDEX) {
    const d = deltaE(hex, n.hex)
    if (d < bestDe) {
      bestDe = d
      best = n
    }
  }
  return best.name
}

/** Coarse hue family used for browsing chips. */
export type HueFamily =
  | 'neutral' | 'red' | 'orange' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink' | 'brown'

export function hueFamily(hex: Hex): HueFamily {
  const { L, C, h } = labToLch(hexToLab(hex))
  if (C < 9) return 'neutral'
  // CIELAB hue angles: red ≈ 40°, orange ≈ 65°, yellow ≈ 100°, green ≈ 135°,
  // cyan ≈ 200°, blue ≈ 280–306°, purple ≈ 310–330°.
  if (h >= 30 && h < 90 && L < 52 && C < 55) return 'brown'
  if (h < 25) return L > 55 ? 'pink' : 'red'
  if (h < 47) return L > 80 && C < 35 ? 'pink' : 'red'
  if (h < 75) return 'orange'
  if (h < 112) return 'yellow'
  if (h < 175) return 'green'
  if (h < 240) return 'teal'
  if (h < 298) return 'blue'
  if (h < 335) return 'purple'
  return L > 40 ? 'pink' : 'purple'
}

export const HUE_FAMILIES: { id: HueFamily; label: string; hex: Hex }[] = [
  { id: 'red', label: 'Reds', hex: '#C8252C' },
  { id: 'orange', label: 'Oranges', hex: '#F26B1D' },
  { id: 'yellow', label: 'Yellows', hex: '#F5D90A' },
  { id: 'green', label: 'Greens', hex: '#2E9E4A' },
  { id: 'teal', label: 'Teals', hex: '#1C8C8C' },
  { id: 'blue', label: 'Blues', hex: '#1E5CC6' },
  { id: 'purple', label: 'Purples', hex: '#7F4AC2' },
  { id: 'pink', label: 'Pinks', hex: '#F4A6B9' },
  { id: 'brown', label: 'Browns', hex: '#7A4A2A' },
  { id: 'neutral', label: 'Neutrals', hex: '#8E9196' },
]
