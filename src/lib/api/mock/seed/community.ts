/**
 * Seed community content: makers, recipes, reproductions, and comments.
 * Seed content: the official SpoolShare account and its example recipes only. No invented people or activity.
 */
import type {
  Collection, Comment, Finish, Follow, Material, Notification, Profile, Recipe, Reproduction, Stage,
} from '@/types'
import { predictMix } from '@/lib/color/mixing'
import { hueFamily } from '@/lib/color/names'
import { flattenComposition, formatRatio } from '@/lib/recipe/composition'
import { filaments } from './catalog'

const NOW = Date.parse('2026-10-01T12:00:00Z')
const daysAgo = (d: number) => new Date(NOW - d * 86400000).toISOString()

// ------------------------------------------------------------- Profiles --

/** The only built-in account: official example recipes. No invented community members. */
export const OFFICIAL_ID = 'u-spoolshare'

export const profiles: Profile[] = [
  {
    id: OFFICIAL_ID,
    username: 'spoolshare',
    displayName: 'SpoolShare',
    avatarHue: 145,
    bio: 'Official example recipes for the Multi-Color Filament Mixer. Colors are calculated previews until the community prints and reproduces them.',
    printers: [],
    inventoryVisibility: 'public',
    joinedAt: daysAgo(30),
  },
]

// ------------------------------------------------------------- Recipes ---

/** Shorthand filament keys: "<line id>:<color name>". */
const F = (key: string): string => {
  const [line, color] = key.split(':')
  const id = `${line}-${color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`
  if (!filaments.some((f) => f.id === id)) throw new Error(`Seed references unknown filament ${id}`)
  return id
}
const B = (c: string) => F(`bambu-pla-basic:${c}`)
const BM = (c: string) => F(`bambu-pla-matte:${c}`)

/** Input is [filamentId, parts] or ["@<stageIndex>", parts] for a previous stage's output. */
type In = [string, number]
interface StageDef {
  name: string
  output: string
  inputs: In[]
}
interface RecipeDef {
  /** Internal key only; the published name/slug comes from EXAMPLE_NAMES. */
  slug: string
  tags: string[]
  material?: Material
  finish?: Finish
  stages: StageDef[]
}

/** Example mixes. Every stage fills the mixer's 4 slots (1:1, 3:1, 2:1:1, 1:1:1:1). */
const defs: RecipeDef[] = [
  {
    slug: 'dusty-purple', tags: ['muted', 'purple', 'two-stage'],
    stages: [
      { name: 'Create Light Blue', output: 'Light Blue Intermediate', inputs: [[B('Jade White'), 3], [B('Cobalt Blue'), 1]] },
      { name: 'Create Purple', output: 'Final Purple', inputs: [[B('Jade White'), 2], [B('Red'), 1], ['@0', 1]] },
    ],
  },
  {
    slug: 'dusty-lavender', tags: ['pastel', 'lavender', 'planters'],
    stages: [
      { name: 'Dilute Cobalt', output: 'Pale Cobalt', inputs: [[B('Jade White'), 3], [B('Cobalt Blue'), 1]] },
      { name: 'Mix Lavender', output: 'Dusty Lavender', inputs: [[B('Jade White'), 2], [B('Purple'), 1], ['@0', 1]] },
    ],
  },
  {
    slug: 'sage-mist', tags: ['green', 'muted', 'terrain'],
    stages: [
      { name: 'Mix Sage', output: 'Sage Mist', inputs: [[B('Jade White'), 2], [B('Mistletoe Green'), 1], [B('Gray'), 1]] },
    ],
  },
  {
    slug: 'terracotta-clay', tags: ['earthy', 'matte', 'pots'], material: 'PLA', finish: 'matte',
    stages: [
      { name: 'Blend Terracotta', output: 'Terracotta', inputs: [[BM('Mandarin Orange'), 2], [BM('Terracotta'), 1], [BM('Ivory White'), 1]] },
    ],
  },
  {
    slug: 'sea-glass', tags: ['teal', 'pastel'],
    stages: [
      { name: 'Teal Base', output: 'Light Teal', inputs: [[B('Jade White'), 3], [B('Turquoise'), 1]] },
      { name: 'Green Shift', output: 'Sea Glass', inputs: [['@0', 2], [B('Mistletoe Green'), 1], [B('Jade White'), 1]] },
    ],
  },
  {
    slug: 'blush-rose', tags: ['pink', 'cosplay', 'warm'],
    stages: [
      { name: 'Blend', output: 'Blush Rose', inputs: [[B('Jade White'), 2], [B('Pink'), 1], [B('Beige'), 1]] },
    ],
  },
  {
    slug: 'midnight-teal', tags: ['dark', 'teal'],
    stages: [
      { name: 'Blend', output: 'Midnight Teal', inputs: [[B('Turquoise'), 2], [B('Black'), 1], [B('Cobalt Blue'), 1]] },
    ],
  },
  {
    slug: 'butter-cream', tags: ['pastel', 'yellow', 'retro'],
    stages: [
      { name: 'Pale Yellow', output: 'Pale Yellow', inputs: [[B('Jade White'), 3], [B('Sunflower Yellow'), 1]] },
      { name: 'Cream', output: 'Butter Cream', inputs: [[B('Jade White'), 2], ['@0', 1], [B('Beige'), 1]] },
    ],
  },
  {
    slug: 'rusted-iron', tags: ['terrain', 'brown', 'weathered'],
    stages: [
      { name: 'Rust Base', output: 'Rust Base', inputs: [[B('Orange'), 1], [B('Brown'), 1]] },
      { name: 'Grit', output: 'Rusted Iron', inputs: [['@0', 3], [B('Gray'), 1]] },
    ],
  },
  {
    slug: 'mint-chip', tags: ['easy', 'pastel', 'green'],
    stages: [
      { name: 'Blend', output: 'Mint', inputs: [[B('Jade White'), 3], [B('Bambu Green'), 1]] },
    ],
  },
  {
    slug: 'storm-cloud', tags: ['gray', 'blue', 'precise'],
    stages: [
      { name: 'Dark Gray', output: 'Dark Gray', inputs: [[B('Light Gray'), 3], [B('Black'), 1]] },
      { name: 'Blue Slate', output: 'Storm Cloud', inputs: [[B('Blue Grey'), 2], ['@0', 1], [B('Light Gray'), 1]] },
    ],
  },
  {
    slug: 'coral-reef', tags: ['coral', 'warm'],
    stages: [
      { name: 'Blend', output: 'Coral', inputs: [[B('Jade White'), 2], [B('Pink'), 1], [B('Orange'), 1]] },
    ],
  },
  {
    slug: 'olive-drab', tags: ['green', 'military', 'terrain'],
    stages: [
      { name: 'Khaki Base', output: 'Khaki Base', inputs: [[B('Mistletoe Green'), 2], [B('Yellow'), 1], [B('Brown'), 1]] },
      { name: 'Darken', output: 'Olive Drab', inputs: [['@0', 3], [B('Black'), 1]] },
    ],
  },
  {
    slug: 'peach-fuzz', tags: ['peach', 'pastel', 'matte'], finish: 'matte',
    stages: [
      { name: 'Blend', output: 'Peach Fuzz', inputs: [[BM('Ivory White'), 2], [BM('Mandarin Orange'), 1], [BM('Sakura Pink'), 1]] },
    ],
  },
  {
    slug: 'ocean-depth', tags: ['blue', 'teal', 'multi-stage'],
    stages: [
      { name: 'Teal Concentrate', output: 'Teal Concentrate', inputs: [[B('Turquoise'), 1], [B('Bambu Green'), 1]] },
      { name: 'Deepen', output: 'Deep Teal', inputs: [['@0', 1], [B('Cobalt Blue'), 1]] },
      { name: 'Tone Down', output: 'Ocean Depth', inputs: [['@1', 2], [B('Black'), 1], [B('Jade White'), 1]] },
    ],
  },
  {
    slug: 'sakura-milk', tags: ['pink', 'pastel', 'matte'], finish: 'matte',
    stages: [
      { name: 'Blend', output: 'Sakura Milk', inputs: [[BM('Sakura Pink'), 1], [BM('Ivory White'), 1]] },
    ],
  },
  {
    slug: 'honey-amber', tags: ['yellow', 'warm', 'gold'],
    stages: [
      { name: 'Blend', output: 'Honey', inputs: [[B('Sunflower Yellow'), 2], [B('Orange'), 1], [B('Brown'), 1]] },
    ],
  },
  {
    slug: 'denim-wash', tags: ['blue', 'muted'],
    stages: [
      { name: 'Blend', output: 'Denim', inputs: [[B('Blue Grey'), 2], [B('Jade White'), 1], [B('Cobalt Blue'), 1]] },
    ],
  },
  {
    slug: 'plum-wine', tags: ['purple', 'dark', 'measured'],
    stages: [
      { name: 'Blend', output: 'Plum Wine', inputs: [[B('Indigo Purple'), 2], [B('Maroon Red'), 1], [B('Magenta'), 1]] },
    ],
  },
  {
    slug: 'lilac-haze', tags: ['lavender', 'cross-brand'],
    stages: [
      { name: 'Blend', output: 'Lilac Haze', inputs: [[BM('Lilac Purple'), 2], [B('Jade White'), 1], [B('Purple'), 1]] },
    ],
  },
  {
    slug: 'golden-hour', tags: ['orange', 'warm'],
    stages: [
      { name: 'Blend', output: 'Golden Hour', inputs: [[B('Orange'), 1], [B('Sunflower Yellow'), 1], [B('Pink'), 1], [B('Jade White'), 1]] },
    ],
  },
  {
    slug: 'moss-stone', tags: ['terrain', 'green', 'gray'],
    stages: [
      { name: 'Blend', output: 'Moss Stone', inputs: [[B('Gray'), 2], [B('Mistletoe Green'), 1], [B('Jade White'), 1]] },
    ],
  },
  {
    slug: 'cocoa-latte', tags: ['brown', 'neutral'],
    stages: [
      { name: 'Blend', output: 'Cocoa Latte', inputs: [[B('Beige'), 2], [B('Cocoa Brown'), 1], [B('Jade White'), 1]] },
    ],
  },
  {
    slug: 'electric-violet', tags: ['purple', 'vivid', 'cosplay'],
    stages: [
      { name: 'Blend', output: 'Electric Violet', inputs: [[B('Purple'), 3], [B('Magenta'), 1]] },
    ],
  },
  {
    slug: 'arctic-ice', tags: ['blue', 'pastel', 'cool'],
    stages: [
      { name: 'Cyan Blend', output: 'Cyan Blend', inputs: [[B('Cyan'), 1], [B('Turquoise'), 1]] },
      { name: 'Ice', output: 'Arctic Ice', inputs: [[B('Jade White'), 3], ['@0', 1]] },
    ],
  },
  {
    slug: 'brick-red', tags: ['red', 'earthy', 'architecture'],
    stages: [
      { name: 'Blend', output: 'Old Brick', inputs: [[B('Red'), 2], [B('Brown'), 1], [B('Gray'), 1]] },
    ],
  },
  {
    slug: 'pistachio-cream', tags: ['green', 'pastel'],
    stages: [
      { name: 'Yellow-Green Base', output: 'Lime Base', inputs: [[B('Bambu Green'), 1], [B('Yellow'), 1]] },
      { name: 'Cream', output: 'Pistachio Cream', inputs: [[B('Jade White'), 2], ['@0', 1], [B('Beige'), 1]] },
    ],
  },
  {
    slug: 'graphite-blue', tags: ['dark', 'blue', 'functional'], material: 'PETG',
    stages: [
      { name: 'Blend', output: 'Graphite Blue', inputs: [[F('bambu-petg-hf:Black'), 3], [F('bambu-petg-hf:Blue'), 1]] },
    ],
  },
  {
    slug: 'flamingo', tags: ['pink', 'vivid'],
    stages: [
      { name: 'Blend', output: 'Flamingo', inputs: [[B('Pink'), 2], [B('Magenta'), 1], [B('Jade White'), 1]] },
    ],
  },
  {
    slug: 'wisteria-dream', tags: ['lavender', 'purple', 'pastel'],
    stages: [
      { name: 'Blend', output: 'Wisteria', inputs: [[BM('Lilac Purple'), 2], [B('Purple'), 1], [B('Jade White'), 1]] },
    ],
  },
]

// ------------------------------------------------------------ Builders ---

/**
 * Example names describe each recipe's CALCULATED preview color. They are not
 * claims about a physical result. (The old defs' names/descriptions are unused.)
 */
const EXAMPLE_NAMES: Record<string, string> = {
  'dusty-purple': 'Rosewood', 'dusty-lavender': 'Blue Violet', 'sage-mist': 'Leaf Green', 'terracotta-clay': 'Terracotta',
  'sea-glass': 'Spring Green', 'blush-rose': 'Rose Pink', 'midnight-teal': 'Deep Teal Gray', 'butter-cream': 'Butter Yellow',
  'rusted-iron': 'Rust Brown', 'mint-chip': 'Light Green', 'storm-cloud': 'Slate Gray', 'coral-reef': 'Coral',
  'olive-drab': 'Olive Drab', 'peach-fuzz': 'Peach', 'ocean-depth': 'Deep Sea Gray', 'sakura-milk': 'Pale Pink',
  'honey-amber': 'Burnt Orange', 'denim-wash': 'Denim Blue', 'plum-wine': 'Plum', 'lilac-haze': 'Amethyst',
  'golden-hour': 'Tangerine', 'moss-stone': 'Sage Green', 'cocoa-latte': 'Camel', 'electric-violet': 'Royal Purple',
  'arctic-ice': 'Sky Blue', 'brick-red': 'Brick Red', 'pistachio-cream': 'Lime Green', 'graphite-blue': 'Graphite',
  'flamingo': 'Hot Pink',
}

/** Suggested uses: opinions from the official account, not reports of real prints. */
const IDEAS: Record<string, string[]> = {
  'Blue Violet': ['Flowers', 'Decorative planters', 'Articulated dragons'],
  'Amethyst': ['Trinket boxes', 'Flowers'],
  'Terracotta': ['Planters', 'Pots and saucers'],
  'Sage Green': ['Plant pots', 'Tabletop terrain'],
  'Leaf Green': ['Leaf ornaments', 'Tabletop terrain'],
  'Slate Gray': ['Tool holders', 'Phone stands'],
  'Rose Pink': ['Jewelry dishes', 'Cosplay accents'],
  'Rust Brown': ['Tabletop terrain', 'Steampunk props'],
  'Light Green': ['Desk organizers'],
}

const byId = new Map(filaments.map((f) => [f.id, f]))
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function buildStages(prefix: string, defs: StageDef[]): Stage[] {
  const ids = defs.map((_, i) => `${prefix}-s${i + 1}`)
  return defs.map((d, i) => ({
    id: ids[i],
    name: d.name,
    outputName: d.output,
    instructions: '',
    photos: [],
    inputs: d.inputs.map(([ref, parts], k) => ({
      id: `${ids[i]}-in${k}`,
      parts,
      source: ref.startsWith('@')
        ? { kind: 'stage' as const, stageId: ids[Number(ref.slice(1))] }
        : { kind: 'filament' as const, filamentId: ref },
    })),
  }))
}

export const recipes: Recipe[] = defs
  .filter((d) => EXAMPLE_NAMES[d.slug])
  .map((d, i) => {
    const name = EXAMPLE_NAMES[d.slug]
    const id = slug(name)
    const stages = buildStages(id, d.stages)
    stages.forEach((s) => (s.instructions = `Load the mixer’s 4 slots as shown (${formatRatio(s.inputs.map((x) => x.parts))}) and print it.`))
    stages[stages.length - 1].outputName = name
    stages[stages.length - 1].name = `Mix ${name}`
    const comp = flattenComposition(stages)
    const predicted = predictMix(comp.map((c) => ({ hex: byId.get(c.filamentId)!.hex, weight: c.fraction, filament: byId.get(c.filamentId) })))
    const first = byId.get(comp[0]?.filamentId)
    return {
      id: `r-${id}`,
      slug: id,
      name,
      description: `An example starting point on the Multi-Color Filament Mixer. The color shown is a calculated preview, not a printed result. Print it and post your result to make it a tested recipe.`,
      authorId: OFFICIAL_ID,
      status: 'published' as const,
      createdAt: daysAgo(i * 0.2),
      updatedAt: daysAgo(i * 0.2),
      resultHex: predicted,
      photos: [],
      material: d.material ?? first?.material ?? 'PLA',
      finish: d.finish ?? 'basic',
      mixingMethod: 'Multi-Color Filament Mixer' as const,
      // Tags describe the calculated color, not the old (unrelated) example names.
      tags: [hueFamily(predicted), stages.length > 1 ? 'multi-stage' : 'single-print', 'example'],
      stages,
      isExample: true,
      printIdeas: IDEAS[name]?.map((title, k) => ({ id: `${id}-idea${k}`, title })),
      favoriteCount: 0,
      viewCount: 0,
    }
  })

// No invented community activity: everything below starts empty.
export const reproductions: Reproduction[] = []
export const comments: Comment[] = []
export const follows: Follow[] = []
export const collections: Collection[] = []
export const notifications: Notification[] = []
