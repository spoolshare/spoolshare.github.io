/* ==========================================================================
   SpoolShare domain model.
   Mirrors supabase/schema.sql. IDs are opaque strings and timestamps are ISO-8601.
   ========================================================================== */

export type ID = string
export type ISODate = string
/** Always "#RRGGBB", upper-case. */
export type Hex = string

// ---------------------------------------------------------------- Catalog --

export const MATERIALS = ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'PC', 'Nylon', 'Other'] as const
export type Material = (typeof MATERIALS)[number]

export const FINISHES = [
  'basic',
  'matte',
  'silk',
  'metallic',
  'translucent',
  'glow',
  'wood',
  'marble',
  'sparkle',
  'carbon-fiber',
] as const
export type Finish = (typeof FINISHES)[number]

export type Transparency = 'opaque' | 'semi' | 'translucent' | 'clear'

export interface Manufacturer {
  id: ID
  name: string
  website?: string
}

export interface ProductLine {
  id: ID
  manufacturerId: ID
  name: string
  material: Material
  finish: Finish
}

export interface Filament {
  id: ID
  manufacturerId: ID
  productLineId: ID
  material: Material
  colorName: string
  /** Manufacturer SKU / color code, e.g. "10601". */
  colorCode?: string
  /** Display approximation only. Never a physical truth for mixing. */
  hex: Hex
  /** True when the hex was measured by the community rather than taken from marketing material. */
  hexVerified?: boolean
  finish: Finish
  transparency: Transparency
  notes?: string
  /** User-created filament that isn't in the shared catalog. */
  isCustom?: boolean
  ownerId?: ID
}

/** Filament joined with manufacturer + product line, for display. */
export interface FilamentView extends Filament {
  manufacturer: Manufacturer
  productLine: ProductLine
}

// -------------------------------------------------------------- Inventory --

export interface InventoryItem {
  id: ID
  userId: ID
  filamentId: ID
  spools?: number
  remainingGrams?: number
  photo?: Photo
  notes?: string
  addedAt: ISODate
}

// ----------------------------------------------------------------- Photos --

export interface Photo {
  id: ID
  /** data: URL (mock) or storage URL (Supabase). */
  url: string
  /** Required for accessibility. */
  alt: string
  width?: number
  height?: number
  /** HEX estimated from the photo at upload time. */
  sampledHex?: Hex
  caption?: string
}

// ---------------------------------------------------------------- Recipes --

export type StageSource = { kind: 'filament'; filamentId: ID } | { kind: 'stage'; stageId: ID }

export interface StageInput {
  id: ID
  source: StageSource
  /** Relative amount. Any positive number: 3 and 1 mean 3:1, and 75 and 25 mean 75%/25%. */
  parts: number
}

export interface Stage {
  id: ID
  name: string
  outputName: string
  inputs: StageInput[]
  /** How much the creator actually made in this stage, for reference. */
  batchGrams?: number
  instructions: string
  photos: Photo[]
  /** Optional measured color of the intermediate. */
  outputHex?: Hex
}

/** The Multi-Color Filament Mixer (by jetpad on MakerWorld) is the primary method SpoolShare is built around. */
export const MIXING_METHODS = ['Multi-Color Filament Mixer', 'Other'] as const

/** The mixer has 4 slots; every stage fills all 4. */
export const MIXER_SLOTS = 4

export const BAMBU_PRINTERS = ['Bambu Lab X1C', 'Bambu Lab X1E', 'Bambu Lab P1S', 'Bambu Lab P1P', 'Bambu Lab P2S', 'Bambu Lab A1', 'Bambu Lab A1 mini', 'Bambu Lab H2D', 'Bambu Lab H2S'] as const

/** Where suggestions and recommendations go. */
export const CONTACT_EMAIL = 'spoolshare.makerworld@gmail.com'

export const MIXER_URL = 'https://makerworld.com/en/models/460079-multi-color-filament-mixer'
export type MixingMethod = (typeof MIXING_METHODS)[number]

export type RecipeStatus = 'draft' | 'published' | 'hidden'

export interface Recipe {
  id: ID
  slug: string
  name: string
  description: string
  authorId: ID
  status: RecipeStatus
  createdAt: ISODate
  updatedAt: ISODate

  /** Color the creator measured on their printed swatch. */
  resultHex: Hex
  photos: Photo[]
  lightingNotes?: string

  material: Material
  finish: Finish
  mixingMethod: MixingMethod
  printer?: string
  nozzle?: string
  layerHeight?: string
  tags: string[]

  /** Ordered. The last stage is the final output. */
  stages: Stage[]
  /** General notes/tips beyond per-stage instructions. */
  notes?: string
  /** Optional "Looks great on" inspiration, often links to models on other sites. */
  printIdeas?: PrintIdea[]

  /**
   * Official example recipe whose color came from the prediction model, not a
   * printed swatch. It is shown as Calculated / Untested until someone reproduces it.
   */
  isExample?: boolean

  /** Denormalized counters (maintained server-side in production). */
  favoriteCount: number
  viewCount: number
}

// ------------------------------------------------------------- Community --

/**
 * A suggestion of what to print in a color. External models are links only:
 * SpoolShare never hosts or claims them.
 */
export interface PrintIdea {
  id: ID
  /** e.g. "Flowers", "Articulated dragon" */
  title: string
  note?: string
  url?: string
  /** Hostname-derived label, e.g. "MakerWorld", "Printables". */
  site?: string
}

export interface Profile {
  id: ID
  username: string
  displayName: string
  avatarUrl?: string
  /** Hue used for the generated avatar fallback. */
  avatarHue: number
  bio?: string
  location?: string
  printers: string[]
  inventoryVisibility: 'public' | 'private'
  joinedAt: ISODate
  role?: 'member' | 'moderator' | 'admin'
  /** Set by an admin: the account can't sign in. */
  disabled?: boolean
}

export interface Substitution {
  originalFilamentId: ID
  usedFilamentId?: ID
  /** Free text when the used filament isn't in the catalog. */
  usedLabel?: string
}

export interface Reproduction {
  id: ID
  recipeId: ID
  userId: ID
  resultHex: Hex
  photos: Photo[]
  printer?: string
  material?: Material
  substitutions: Substitution[]
  notes?: string
  /** "How close did yours look to the original?" 1–5 */
  accuracyRating: number
  /** Optional photos of real objects printed with the reproduced filament. */
  objectPhotos?: Photo[]
  createdAt: ISODate
}

export interface Comment {
  id: ID
  recipeId: ID
  userId: ID
  parentId?: ID
  body: string
  createdAt: ISODate
}

export interface Collection {
  id: ID
  userId: ID
  name: string
  description?: string
  isPublic: boolean
  recipeIds: ID[]
  createdAt: ISODate
}

export interface Follow {
  followerId: ID
  followeeId: ID
  createdAt: ISODate
}

export type ReportReason = 'inaccurate' | 'spam' | 'unsafe' | 'stolen' | 'offensive' | 'other'

export interface Report {
  id: ID
  reporterId: ID
  targetType: 'recipe' | 'comment' | 'reproduction' | 'user'
  targetId: ID
  reason: ReportReason
  details?: string
  status: 'open' | 'reviewing' | 'resolved'
  resolutionNote?: string
  resolvedAt?: ISODate
  createdAt: ISODate
}

export type NotificationKind = 'reproduced' | 'commented' | 'followed' | 'favorited' | 'mentioned'

export interface Notification {
  id: ID
  userId: ID
  kind: NotificationKind
  actorId: ID
  recipeId?: ID
  read: boolean
  createdAt: ISODate
}

// ------------------------------------------------------------- Derived ----

export type TrustLevel = 'calculated' | 'tested' | 'reproduced' | 'highly-reproduced'

export interface ReproductionStats {
  count: number
  closeCount: number
  /** Mean ΔE00 of reproductions vs. the original. */
  meanDeltaE: number | null
  /** Community average color (averaged in CIELAB). Includes the original. */
  averageHex: Hex | null
  /** Std-dev style spread of ΔE among all results. */
  spread: number | null
  averageRating: number | null
}

export interface CompositionEntry {
  filamentId: ID
  /** 0..1 */
  fraction: number
}

export type Difficulty = 'easy' | 'moderate' | 'advanced' | 'expert'

/** Recipe joined with the data most screens need. */
export interface RecipeSummary {
  recipe: Recipe
  author: Profile
  composition: CompositionEntry[]
  filaments: FilamentView[]
  stats: ReproductionStats
  trust: TrustLevel
  difficulty: Difficulty
}
