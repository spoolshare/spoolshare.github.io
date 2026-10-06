/**
 * Seed community content: makers, recipes, reproductions, and comments.
 * Generated deterministically, so every visitor sees the same demo world.
 */
import type {
  Collection, Comment, Finish, Follow, Material, MixingMethod, Notification, Profile, Recipe, Reproduction, Stage,
} from '@/types'
import { predictMix } from '@/lib/color/mixing'
import { hexToLab, labToHex } from '@/lib/color/convert'
import { flattenComposition } from '@/lib/recipe/composition'
import { mulberry32 } from '@/lib/utils/prng'
import { filaments } from './catalog'

const NOW = Date.parse('2026-10-01T12:00:00Z')
const daysAgo = (d: number) => new Date(NOW - d * 86400000).toISOString()

// ------------------------------------------------------------- Profiles --

export const DEMO_USER_ID = 'u-demo'

export const profiles: Profile[] = [
  { id: DEMO_USER_ID, username: 'you', displayName: 'Demo Maker', avatarHue: 145, bio: 'Exploring SpoolShare. This is the demo account.', printers: ['Bambu Lab P1S'], inventoryVisibility: 'public', joinedAt: daysAgo(3) },
  { id: 'u-mira', username: 'mira.mixes', displayName: 'Mira Okafor', avatarHue: 280, bio: 'Pastel obsessive. If it can be lavender, it will be lavender.', location: 'Portland, OR', printers: ['Bambu Lab X1C', 'Prusa MK4'], inventoryVisibility: 'public', joinedAt: daysAgo(420), role: 'moderator' },
  { id: 'u-tomas', username: 'tomas_extrudes', displayName: 'Tomás Reyes', avatarHue: 20, bio: 'Earth tones, terracotta, and anything that looks like fired clay.', location: 'Valencia, ES', printers: ['Prusa MK4S'], inventoryVisibility: 'public', joinedAt: daysAgo(310) },
  { id: 'u-kenji', username: 'kenji.layer', displayName: 'Kenji Watanabe', avatarHue: 200, bio: 'Process engineer. I weigh to 0.01 g and I log humidity.', location: 'Osaka, JP', printers: ['Bambu Lab X1C'], inventoryVisibility: 'public', joinedAt: daysAgo(500) },
  { id: 'u-ava', username: 'avaprints', displayName: 'Ava Lindqvist', avatarHue: 330, bio: 'Cosplay props. Skin tones and blush pinks are my thing.', location: 'Malmö, SE', printers: ['Bambu Lab P1S', 'Voron 2.4'], inventoryVisibility: 'private', joinedAt: daysAgo(260) },
  { id: 'u-dev', username: 'devon.makes', displayName: 'Devon Brooks', avatarHue: 100, bio: 'Tabletop terrain. Moss, stone, rust: the grimier the better.', location: 'Leeds, UK', printers: ['Prusa MK3S+'], inventoryVisibility: 'public', joinedAt: daysAgo(190) },
  { id: 'u-sana', username: 'sana.spools', displayName: 'Sana Iqbal', avatarHue: 170, bio: 'Teal is a lifestyle.', location: 'Toronto, CA', printers: ['Bambu Lab A1'], inventoryVisibility: 'public', joinedAt: daysAgo(140) },
  { id: 'u-felix', username: 'felix_fdm', displayName: 'Felix Bauer', avatarHue: 45, bio: 'Recycling scraps into new colors with a desktop extruder.', location: 'Munich, DE', printers: ['Bambu Lab X1C', 'Filastruder'], inventoryVisibility: 'public', joinedAt: daysAgo(610) },
  { id: 'u-noor', username: 'noor.hue', displayName: 'Noor Haddad', avatarHue: 240, bio: 'Color scientist by day. Here to make ΔE jokes.', location: 'Amman, JO', printers: ['Prusa XL'], inventoryVisibility: 'public', joinedAt: daysAgo(90) },
  { id: 'u-lee', username: 'lee.prints', displayName: 'Jordan Lee', avatarHue: 0, bio: 'Weekend printer, weekday spreadsheet person.', location: 'Austin, TX', printers: ['Bambu Lab A1 mini'], inventoryVisibility: 'public', joinedAt: daysAgo(45) },
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
const PT = (c: string) => F(`polymaker-polyterra:${c}`)
const PR = (c: string) => F(`prusament-pla:${c}`)

/** Input is [filamentId, parts] or ["@<stageIndex>", parts] for a previous stage's output. */
type In = [string, number]
interface StageDef {
  name: string
  output: string
  inputs: In[]
  text: string
  batch?: number
}
interface RecipeDef {
  slug: string
  name: string
  author: string
  description: string
  material?: Material
  finish?: Finish
  method?: MixingMethod
  printer?: string
  nozzle?: string
  tags: string[]
  age: number
  favs: number
  views: number
  /** Measured result. If omitted, a deterministic "real-world" deviation from the prediction is used. */
  hex?: string
  repro: number
  /** Reproduction noise in ΔE-ish units. */
  noise?: number
  stages: StageDef[]
  notes?: string
}

const defs: RecipeDef[] = [
  {
    slug: 'dusty-purple', name: 'Dusty Purple', author: 'u-mira', age: 12, favs: 214, views: 4810, repro: 9, hex: '#A87F96',
    description: 'A muted, grown-up purple built on a light-blue intermediate. The small cobalt share is what keeps it from turning pink.',
    printer: 'Bambu Lab X1C', nozzle: '0.4 mm hardened steel', tags: ['muted', 'purple', 'two-stage'],
    stages: [
      { name: 'Create Light Blue', output: 'Light Blue Intermediate', inputs: [[B('Jade White'), 75], [B('Cobalt Blue'), 25]], batch: 20,
        text: 'Cut equal-length strands (I use 10 cm) and feed 3 Jade White : 1 Cobalt Blue. Purge until the extrudate is a uniform sky blue with no streaks, then spool or chop it.' },
      { name: 'Create Purple', output: 'Final Purple', inputs: [[B('Jade White'), 50], [B('Red'), 25], ['@0', 25]],
        text: 'Feed 2 Jade White : 1 Red : 1 Light Blue. The red takes about 40 mm of purge to fully disperse. Do not judge the color until it stops looking streaky.' },
    ],
    notes: 'Different white brands change the result a lot. Jade White is quite cool. With a warm white you will get a dusty mauve instead.',
  },
  {
    slug: 'dusty-lavender', name: 'Dusty Lavender', author: 'u-mira', age: 30, favs: 389, views: 9020, repro: 14, hex: '#C1AAD6',
    description: 'A soft lavender made using a diluted cobalt-blue intermediate. My most-printed color for planters.',
    printer: 'Bambu Lab X1C', nozzle: '0.4 mm', tags: ['pastel', 'lavender', 'planters'],
    stages: [
      { name: 'Dilute Cobalt', output: 'Pale Cobalt', inputs: [[B('Jade White'), 7], [B('Cobalt Blue'), 1]], batch: 16,
        text: 'Cobalt is extremely strong, so we pre-dilute it. Feed 7 white : 1 cobalt and purge well.' },
      { name: 'Mix Lavender', output: 'Dusty Lavender', inputs: [[B('Jade White'), 2], [B('Purple'), 1], ['@0', 1]],
        text: 'Feed 2 white : 1 purple : 1 pale cobalt. Print a 2 mm swatch and compare it in daylight.' },
    ],
  },
  {
    slug: 'sage-mist', name: 'Sage Mist', author: 'u-dev', age: 5, favs: 96, views: 1520, repro: 3,
    description: 'A desaturated, grayish green for terrain bases and botanical prints.',
    printer: 'Prusa MK3S+', nozzle: '0.4 mm brass', tags: ['green', 'muted', 'terrain'],
    stages: [
      { name: 'Mix Sage', output: 'Sage Mist', inputs: [[B('Jade White'), 6], [B('Mistletoe Green'), 2], [B('Gray'), 1]],
        text: 'Single stage. Feed 6 white : 2 mistletoe : 1 gray. Gray does the desaturating, so don’t skip it.' },
    ],
  },
  {
    slug: 'terracotta-clay', name: 'Terracotta Clay', author: 'u-tomas', age: 22, favs: 302, views: 6100, repro: 11, hex: '#B4613F',
    description: 'Looks like a fired clay pot, especially with PolyTerra’s matte surface.',
    material: 'PLA', finish: 'matte', printer: 'Prusa MK4S', nozzle: '0.6 mm', tags: ['earthy', 'matte', 'pots'],
    stages: [
      { name: 'Blend Terracotta', output: 'Terracotta', inputs: [[PT('Sunrise Orange'), 2], [PT('Muted Red'), 1], [PT('Cotton White'), 1]],
        text: '2 orange : 1 muted red : 1 white. PolyTerra mixes very evenly. A single pass is enough.' },
    ],
  },
  {
    slug: 'sea-glass', name: 'Sea Glass', author: 'u-sana', age: 8, favs: 177, views: 2930, repro: 6,
    description: 'A milky green-teal like a tumbled bottle shard. Best on silk or matte.',
    printer: 'Bambu Lab A1', tags: ['teal', 'pastel'],
    stages: [
      { name: 'Teal Base', output: 'Light Teal', inputs: [[B('Turquoise'), 1], [B('Jade White'), 3]], batch: 12, text: 'Make a light teal base at 1:3.' },
      { name: 'Green Shift', output: 'Sea Glass', inputs: [['@0', 3], [B('Mistletoe Green'), 1], [B('Jade White'), 2]], text: 'Add the green slowly. Too much and it reads as mint.' },
    ],
  },
  {
    slug: 'blush-rose', name: 'Blush Rose', author: 'u-ava', age: 40, favs: 251, views: 5400, repro: 8,
    description: 'A warm, skin-adjacent pink for cosplay accents and makeup props.',
    printer: 'Bambu Lab P1S', tags: ['pink', 'cosplay', 'warm'],
    stages: [
      { name: 'Blend', output: 'Blush Rose', inputs: [[B('Jade White'), 5], [B('Pink'), 2], [B('Beige'), 2]],
        text: 'Beige warms the pink, so it reads less "candy." Purge 30 mm.' },
    ],
  },
  {
    slug: 'midnight-teal', name: 'Midnight Teal', author: 'u-sana', age: 2, favs: 41, views: 640, repro: 0,
    description: 'Deep, inky teal. Pairs beautifully with gold silk accents.',
    printer: 'Bambu Lab A1', tags: ['dark', 'teal'],
    stages: [
      { name: 'Blend', output: 'Midnight Teal', inputs: [[B('Turquoise'), 2], [B('Black'), 1], [B('Cobalt Blue'), 1]],
        text: 'Black overwhelms fast. Start at 2:1:1 and print a test before committing.' },
    ],
  },
  {
    slug: 'butter-cream', name: 'Butter Cream', author: 'u-lee', age: 1, favs: 12, views: 180, repro: 0,
    description: 'A soft cream-yellow. Basically a pale vintage kitchen appliance.',
    tags: ['pastel', 'yellow', 'retro'], printer: 'Bambu Lab A1 mini',
    stages: [
      { name: 'Blend', output: 'Butter Cream', inputs: [[B('Jade White'), 8], [B('Sunflower Yellow'), 1], [B('Beige'), 1]], text: '8 white : 1 sunflower : 1 beige.' },
    ],
  },
  {
    slug: 'rusted-iron', name: 'Rusted Iron', author: 'u-dev', age: 60, favs: 188, views: 3700, repro: 7,
    description: 'Oxidized-metal brown-orange for grimdark terrain. Looks great dry-brushed.',
    printer: 'Prusa MK3S+', tags: ['terrain', 'brown', 'weathered'],
    stages: [
      { name: 'Rust Base', output: 'Rust Base', inputs: [[B('Orange'), 2], [B('Brown'), 2], [B('Black'), 1]], batch: 30, text: 'Feed 2 orange : 2 brown : 1 black.' },
      { name: 'Grit', output: 'Rusted Iron', inputs: [['@0', 4], [B('Gray'), 1]], text: 'A little gray dulls the orange and makes it read as oxidized.' },
    ],
  },
  {
    slug: 'mint-chip', name: 'Mint Chip', author: 'u-felix', age: 15, favs: 133, views: 2100, repro: 5,
    description: 'The ice-cream green. Fresh, bright, and super easy.',
    method: 'Filament re-extruder', printer: 'Bambu Lab X1C', tags: ['easy', 'pastel', 'green'],
    stages: [
      { name: 'Blend', output: 'Mint', inputs: [[B('Jade White'), 4], [B('Bambu Green'), 1]], text: 'Classic 4:1. Run it through the extruder twice for even color.' },
    ],
  },
  {
    slug: 'storm-cloud', name: 'Storm Cloud', author: 'u-kenji', age: 70, favs: 145, views: 2800, repro: 12, noise: 1.6,
    description: 'Blue-leaning slate gray. Precise ratios, very repeatable.',
    printer: 'Bambu Lab X1C', nozzle: '0.4 mm', tags: ['gray', 'blue', 'precise'],
    stages: [
      { name: 'Blend', output: 'Storm Cloud', inputs: [[B('Light Gray'), 6], [B('Blue Grey'), 3], [B('Black'), 1]],
        text: 'Weighed by mass to 0.01 g. 23 °C and 40% RH. Drying the filament first improves consistency.' },
    ],
  },
  {
    slug: 'coral-reef', name: 'Coral Reef', author: 'u-ava', age: 18, favs: 160, views: 2600, repro: 4,
    description: 'A juicy coral, between salmon and watermelon.',
    printer: 'Voron 2.4', tags: ['coral', 'warm'],
    stages: [
      { name: 'Blend', output: 'Coral', inputs: [[B('Pink'), 2], [B('Orange'), 1], [B('Jade White'), 2]], text: 'Even 2:1:2 split.' },
    ],
  },
  {
    slug: 'olive-drab', name: 'Olive Drab', author: 'u-dev', age: 100, favs: 120, views: 2400, repro: 6,
    description: 'Military olive for vehicle models.',
    printer: 'Prusa MK3S+', tags: ['green', 'military', 'terrain'],
    stages: [
      { name: 'Blend', output: 'Olive Drab', inputs: [[B('Mistletoe Green'), 3], [B('Brown'), 1], [B('Yellow'), 1], [B('Black'), 1]], text: 'Black last. Add it gradually.' },
    ],
  },
  {
    slug: 'peach-fuzz', name: 'Peach Fuzz', author: 'u-tomas', age: 26, favs: 98, views: 1800, repro: 3,
    description: 'Velvety peach. Lovely in matte.',
    finish: 'matte', tags: ['peach', 'pastel', 'matte'],
    stages: [
      { name: 'Blend', output: 'Peach Fuzz', inputs: [[BM('Mandarin Orange'), 1], [BM('Ivory White'), 2], [BM('Sakura Pink'), 1]], text: 'Matte line, equal-length strands.' },
    ],
  },
  {
    slug: 'ocean-depth', name: 'Ocean Depth', author: 'u-kenji', age: 9, favs: 87, views: 1300, repro: 2,
    description: 'Deep blue-green. Three stages, built for tight control over the green.',
    printer: 'Bambu Lab X1C', tags: ['blue', 'teal', 'multi-stage'],
    stages: [
      { name: 'Teal Concentrate', output: 'Teal Concentrate', inputs: [[B('Turquoise'), 1], [B('Bambu Green'), 1]], batch: 6, text: '1:1 concentrate.' },
      { name: 'Deepen', output: 'Deep Teal', inputs: [['@0', 1], [B('Cobalt Blue'), 1]], batch: 10, text: 'Combine 1:1 with cobalt.' },
      { name: 'Tone Down', output: 'Ocean Depth', inputs: [['@1', 3], [B('Black'), 1], [B('Jade White'), 1]], text: '3 deep teal : 1 black : 1 white. The white keeps it from going muddy.' },
    ],
  },
  {
    slug: 'sakura-milk', name: 'Sakura Milk', author: 'u-mira', age: 4, favs: 75, views: 1100, repro: 2,
    description: 'Strawberry milk. Gentle, warm, matte.',
    finish: 'matte', tags: ['pink', 'pastel', 'matte'],
    stages: [
      { name: 'Blend', output: 'Sakura Milk', inputs: [[BM('Sakura Pink'), 1], [BM('Ivory White'), 1]], text: '1:1 matte. As easy as it gets.' },
    ],
  },
  {
    slug: 'honey-amber', name: 'Honey Amber', author: 'u-felix', age: 33, favs: 110, views: 1950, repro: 5,
    description: 'Golden honey with a hint of brown.',
    method: 'Filament re-extruder', tags: ['yellow', 'warm', 'gold'],
    stages: [
      { name: 'Blend', output: 'Honey', inputs: [[B('Sunflower Yellow'), 4], [B('Orange'), 1], [B('Brown'), 1]], text: '4:1:1.' },
    ],
  },
  {
    slug: 'denim-wash', name: 'Denim Wash', author: 'u-lee', age: 6, favs: 54, views: 820, repro: 1,
    description: 'Faded jeans blue.',
    tags: ['blue', 'muted'],
    stages: [
      { name: 'Blend', output: 'Denim', inputs: [[B('Cobalt Blue'), 1], [B('Jade White'), 2], [B('Blue Grey'), 2]], text: 'Even 1:2:2.' },
    ],
  },
  {
    slug: 'plum-wine', name: 'Plum Wine', author: 'u-noor', age: 11, favs: 92, views: 1400, repro: 3,
    description: 'Dark, rich red-violet. Measured under D65 with a colorimeter.',
    printer: 'Prusa XL', tags: ['purple', 'dark', 'measured'],
    stages: [
      { name: 'Blend', output: 'Plum Wine', inputs: [[B('Maroon Red'), 2], [B('Indigo Purple'), 2], [B('Magenta'), 1]], text: '2:2:1. Measured L*a*b* is in the notes.' },
    ],
    notes: 'Colorimeter reading (D65/10°): L* 31.2, a* 34.8, b* -6.1. Phone photos make it look redder.',
  },
  {
    slug: 'lilac-haze', name: 'Lilac Haze', author: 'u-noor', age: 3, favs: 61, views: 900, repro: 1,
    description: 'Cross-brand lilac. Prusament base with Bambu purple for punch.',
    printer: 'Prusa XL', tags: ['lavender', 'cross-brand'],
    stages: [
      { name: 'Blend', output: 'Lilac Haze', inputs: [[PR('Lilac Purple'), 3], [PR('Vanilla White'), 2], [B('Purple'), 1]], text: '3:2:1.' },
    ],
  },
  {
    slug: 'golden-hour', name: 'Golden Hour', author: 'u-tomas', age: 45, favs: 140, views: 2300, repro: 4,
    description: 'Warm apricot sunset. Glows in direct light.',
    tags: ['orange', 'warm'],
    stages: [
      { name: 'Blend', output: 'Golden Hour', inputs: [[B('Orange'), 2], [B('Sunflower Yellow'), 2], [B('Pink'), 1], [B('Jade White'), 1]], text: '2:2:1:1.' },
    ],
  },
  {
    slug: 'moss-stone', name: 'Moss Stone', author: 'u-dev', age: 14, favs: 66, views: 1000, repro: 2,
    description: 'Gray-green, like lichen on rock.',
    tags: ['terrain', 'green', 'gray'],
    stages: [
      { name: 'Blend', output: 'Moss Stone', inputs: [[B('Gray'), 3], [B('Mistletoe Green'), 2], [B('Jade White'), 1]], text: '3:2:1.' },
    ],
  },
  {
    slug: 'cocoa-latte', name: 'Cocoa Latte', author: 'u-kenji', age: 50, favs: 101, views: 1700, repro: 8, noise: 1.8,
    description: 'Milky coffee. Very repeatable.',
    tags: ['brown', 'neutral'],
    stages: [
      { name: 'Blend', output: 'Cocoa Latte', inputs: [[B('Cocoa Brown'), 1], [B('Beige'), 2], [B('Jade White'), 1]], text: '1:2:1 by mass.' },
    ],
  },
  {
    slug: 'electric-violet', name: 'Electric Violet', author: 'u-ava', age: 20, favs: 118, views: 2000, repro: 4,
    description: 'Punchy violet that pops under stage lights.',
    tags: ['purple', 'vivid', 'cosplay'],
    stages: [
      { name: 'Blend', output: 'Electric Violet', inputs: [[B('Purple'), 3], [B('Magenta'), 1]], text: '3:1.' },
    ],
  },
  {
    slug: 'arctic-ice', name: 'Arctic Ice', author: 'u-sana', age: 16, favs: 72, views: 1150, repro: 3,
    description: 'Icy pale blue with a touch of teal.',
    tags: ['blue', 'pastel', 'cool'],
    stages: [
      { name: 'Blend', output: 'Arctic Ice', inputs: [[B('Jade White'), 10], [B('Cyan'), 1], [B('Turquoise'), 1]], text: '10:1:1. Tiny shares, so weigh carefully.' },
    ],
  },
  {
    slug: 'brick-red', name: 'Old Brick', author: 'u-tomas', age: 80, favs: 90, views: 1600, repro: 5,
    description: 'Weathered red brick for architectural models.',
    tags: ['red', 'earthy', 'architecture'],
    stages: [
      { name: 'Blend', output: 'Old Brick', inputs: [[B('Red'), 3], [B('Brown'), 2], [B('Gray'), 1]], text: '3:2:1.' },
    ],
  },
  {
    slug: 'pistachio-cream', name: 'Pistachio Cream', author: 'u-felix', age: 7, favs: 58, views: 870, repro: 1,
    description: 'Nutty pale green.',
    method: 'Filament re-extruder', tags: ['green', 'pastel'],
    stages: [
      { name: 'Yellow-Green Base', output: 'Lime Base', inputs: [[B('Bambu Green'), 1], [B('Yellow'), 1]], batch: 8, text: '1:1 lime base.' },
      { name: 'Cream', output: 'Pistachio Cream', inputs: [['@0', 1], [B('Jade White'), 3], [B('Beige'), 1]], text: 'Beige gives it the nutty warmth.' },
    ],
  },
  {
    slug: 'graphite-blue', name: 'Graphite Blue', author: 'u-kenji', age: 120, favs: 77, views: 1300, repro: 6, noise: 1.5,
    description: 'Almost-black navy for enclosures and tools.',
    tags: ['dark', 'blue', 'functional'],
    material: 'PETG',
    stages: [
      { name: 'Blend', output: 'Graphite Blue', inputs: [[F('bambu-petg-hf:Black'), 3], [F('bambu-petg-hf:Blue'), 1]], text: 'PETG HF. 3:1.' },
    ],
  },
  {
    slug: 'flamingo', name: 'Flamingo', author: 'u-lee', age: 2, favs: 19, views: 260, repro: 0,
    description: 'Bright tropical pink. First recipe, so be gentle!',
    tags: ['pink', 'vivid'],
    stages: [
      { name: 'Blend', output: 'Flamingo', inputs: [[B('Pink'), 2], [B('Magenta'), 1], [B('Jade White'), 1]], text: '2:1:1.' },
    ],
  },
  {
    slug: 'wisteria-dream', name: 'Wisteria Dream', author: 'u-mira', age: 55, favs: 230, views: 4400, repro: 10,
    description: 'Cool blue-violet, a touch deeper than Dusty Lavender.',
    tags: ['lavender', 'purple', 'pastel'],
    stages: [
      { name: 'Blend', output: 'Wisteria', inputs: [[BM('Lilac Purple'), 3], [B('Purple'), 1], [B('Jade White'), 1]], text: '3:1:1. Matte lilac base.' },
    ],
  },
]

// ------------------------------------------------------------ Builders ---

const rand = mulberry32(20261006)
const gauss = () => {
  const u = 1 - rand()
  const v = rand()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** Shifts a color in Lab space. Used to simulate real-world deviations. */
function jitter(hex: string, sd: number, bias = { L: 0, a: 0, b: 0 }) {
  const lab = hexToLab(hex)
  return labToHex({ L: lab.L + bias.L + gauss() * sd, a: lab.a + bias.a + gauss() * sd, b: lab.b + bias.b + gauss() * sd })
}

const byId = new Map(filaments.map((f) => [f.id, f]))

function buildStages(slug: string, defs: StageDef[]): Stage[] {
  const ids = defs.map((_, i) => `${slug}-s${i + 1}`)
  return defs.map((d, i) => ({
    id: ids[i],
    name: d.name,
    outputName: d.output,
    batchGrams: d.batch,
    instructions: d.text,
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

export const recipes: Recipe[] = defs.map((d, i) => {
  const stages = buildStages(d.slug, d.stages)
  const comp = flattenComposition(stages)
  const predicted = predictMix(comp.map((c) => ({ hex: byId.get(c.filamentId)!.hex, weight: c.fraction, filament: byId.get(c.filamentId) })))
  // Real plastic tends to come out slightly darker and less saturated than predicted.
  const measured = d.hex ?? jitter(predicted, 2.2, { L: -3, a: 0, b: 0 })
  const firstFil = byId.get(comp[0]?.filamentId)
  return {
    id: `r-${d.slug}`,
    slug: d.slug,
    name: d.name,
    description: d.description,
    authorId: d.author,
    status: 'published',
    createdAt: daysAgo(d.age),
    updatedAt: daysAgo(Math.max(0, d.age - 1)),
    resultHex: measured,
    photos: [],
    lightingNotes: i % 3 === 0 ? 'Daylight by a north window, no flash.' : undefined,
    material: d.material ?? firstFil?.material ?? 'PLA',
    finish: d.finish ?? 'basic',
    mixingMethod: d.method ?? (i % 4 === 0 ? 'Shred & re-extrude' : 'Filament re-extruder'),
    printer: d.printer,
    nozzle: d.nozzle,
    layerHeight: i % 2 === 0 ? '0.20 mm' : undefined,
    tags: d.tags,
    stages,
    notes: d.notes,
    favoriteCount: d.favs,
    viewCount: d.views,
  }
})

const reproducers = profiles.filter((p) => p.id !== DEMO_USER_ID)
const reproNotes = [
  'Came out almost exactly like the photo.',
  'Slightly lighter than the original. My white is warmer.',
  'Used a different brand of white and it still matched well.',
  'Mine is a touch more saturated. Might be my lighting.',
  'Perfect. Printed a whole vase with it.',
  'Needed extra purge to get rid of streaks, but the final color matches.',
  'Close! I think my red spool is from an older batch.',
  'Matches nicely in daylight, a bit off under LED.',
]

export const reproductions: Reproduction[] = defs.flatMap((d) => {
  const recipe = recipes.find((r) => r.slug === d.slug)!
  const pool = reproducers.filter((p) => p.id !== d.author)
  return Array.from({ length: d.repro }, (_, k) => {
    const outlier = rand() < 0.12
    const sd = outlier ? 5 : (d.noise ?? 2.4)
    const hex = jitter(recipe.resultHex, sd, outlier ? { L: 4, a: 0, b: 3 } : undefined)
    const user = pool[(k * 3 + d.slug.length) % pool.length]
    return {
      id: `rep-${d.slug}-${k}`,
      recipeId: recipe.id,
      userId: user.id,
      resultHex: hex,
      photos: [],
      printer: user.printers[0],
      material: recipe.material,
      substitutions: [],
      notes: reproNotes[(k + d.slug.length) % reproNotes.length],
      accuracyRating: outlier ? 3 : rand() < 0.6 ? 5 : 4,
      createdAt: daysAgo(Math.max(0, d.age - 1 - Math.floor(rand() * Math.max(1, d.age - 1)))),
    }
  })
})

// --------------------------------------------------------------- Social --

const commentBodies = [
  'This is gorgeous. Adding it to my next batch.',
  'What purge length did you use for stage 2?',
  'Tried it with Polymaker white and it came out slightly warmer, still lovely.',
  'The flow diagram made this so easy to follow, thanks!',
  'Any tips for avoiding streaks with the re-extruder?',
  'Printed a planter with this and everyone asked what filament it was 😄',
]

export const comments: Comment[] = recipes.slice(0, 14).flatMap((r, i) =>
  Array.from({ length: (i % 3) + 1 }, (_, k) => ({
    id: `c-${r.slug}-${k}`,
    recipeId: r.id,
    userId: reproducers[(i + k * 2) % reproducers.length].id,
    body: commentBodies[(i + k) % commentBodies.length],
    createdAt: daysAgo(Math.max(0, Math.floor((Date.parse(r.createdAt) - NOW) / -86400000) - k - 1)),
  })),
)

export const follows: Follow[] = [
  { followerId: 'u-lee', followeeId: 'u-mira', createdAt: daysAgo(20) },
  { followerId: 'u-sana', followeeId: 'u-mira', createdAt: daysAgo(60) },
  { followerId: 'u-ava', followeeId: 'u-mira', createdAt: daysAgo(100) },
  { followerId: 'u-dev', followeeId: 'u-kenji', createdAt: daysAgo(80) },
  { followerId: 'u-mira', followeeId: 'u-kenji', createdAt: daysAgo(200) },
  { followerId: 'u-noor', followeeId: 'u-kenji', createdAt: daysAgo(40) },
  { followerId: 'u-tomas', followeeId: 'u-dev', createdAt: daysAgo(150) },
]

/** Demo user's starter inventory: a typical new Bambu owner. */
export const demoInventory: string[] = [
  B('Jade White'), B('Black'), B('Cobalt Blue'), B('Red'), B('Yellow'), B('Bambu Green'),
  B('Gray'), B('Mistletoe Green'), B('Purple'), B('Pink'), B('Beige'), B('Orange'),
]

export const demoCollections: Collection[] = [
  { id: 'col-pastels', userId: DEMO_USER_ID, name: 'Pastels to try', description: 'Soft colors for planters', isPublic: true, recipeIds: ['r-dusty-lavender', 'r-mint-chip', 'r-sakura-milk'], createdAt: daysAgo(2) },
]

export const demoNotifications: Notification[] = [
  { id: 'n1', userId: DEMO_USER_ID, kind: 'followed', actorId: 'u-mira', read: false, createdAt: daysAgo(0.2) },
  { id: 'n2', userId: DEMO_USER_ID, kind: 'mentioned', actorId: 'u-kenji', recipeId: 'r-dusty-purple', read: false, createdAt: daysAgo(1) },
  { id: 'n3', userId: DEMO_USER_ID, kind: 'followed', actorId: 'u-sana', read: true, createdAt: daysAgo(2) },
]
