/**
 * The contract between the UI and any backend. The mock adapter implements
 * it today; a Supabase adapter will implement the same interface.
 */
import type {
  Collection, Comment, FilamentView, Finish, Hex, ID, InventoryItem, Manufacturer, Material, MixingMethod,
  Notification, Photo, ProductLine, Profile, Recipe, RecipeSummary, Report, ReportReason, Reproduction,
  Stage, Substitution, TrustLevel,
} from '@/types'

export interface InventoryEntry extends InventoryItem {
  filament: FilamentView
}

export interface Page<T> {
  items: T[]
  total: number
}

// ---------------------------------------------------------------- Auth ---

export interface SignUpInput {
  email: string
  password: string
  username: string
  displayName: string
}

// ------------------------------------------------------------- Catalog ---

export interface FilamentQuery {
  text?: string
  manufacturerIds?: ID[]
  materials?: Material[]
  finishes?: Finish[]
  /** Sort by similarity to this color. */
  nearHex?: Hex
  limit?: number
}

export interface CustomFilamentInput {
  manufacturerName: string
  productLineName: string
  material: Material
  colorName: string
  hex: Hex
  finish: Finish
  notes?: string
}

// ------------------------------------------------------------- Recipes ---

export type RecipeSort = 'relevance' | 'closest' | 'trending' | 'newest' | 'most-reproduced' | 'most-favorited'

export interface RecipeQuery {
  text?: string
  targetHex?: Hex
  /** Only results within this ΔE00 of targetHex. */
  maxDeltaE?: number
  hueFamily?: string
  manufacturerIds?: ID[]
  materials?: Material[]
  minStages?: number
  maxStages?: number
  authorId?: ID
  trust?: TrustLevel[]
  /** When set, only recipes whose every filament is in this list. */
  canMakeWith?: ID[]
  /** Restrict to these ids (favorites, collections). */
  ids?: ID[]
  sort?: RecipeSort
  limit?: number
  offset?: number
}

export interface RecipeHit extends RecipeSummary {
  /** ΔE00 to the query target, if one was given. */
  deltaE?: number
}

export interface ReproductionView extends Reproduction {
  user: Profile
  deltaE: number
}

export interface CommentView extends Comment {
  user: Profile
}

export interface RecipeDetail extends RecipeSummary {
  reproductions: ReproductionView[]
  comments: CommentView[]
  /** Filaments for every id used, including substitutions. */
  filamentsById: Record<ID, FilamentView>
}

export interface RecipeDraftInput {
  id?: ID
  name: string
  description: string
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
  stages: Stage[]
  notes?: string
}

export interface ReproductionInput {
  recipeId: ID
  resultHex: Hex
  photos: Photo[]
  printer?: string
  material?: Material
  substitutions: Substitution[]
  notes?: string
  accuracyRating: number
}

// ------------------------------------------------------------ Profiles ---

export interface ProfileStats {
  recipes: number
  reproductions: number
  favoritesReceived: number
  reproductionsReceived: number
  followers: number
  following: number
}

export interface Achievement {
  id: string
  label: string
  description: string
  earned: boolean
}

export interface ProfileDetail {
  profile: Profile
  stats: ProfileStats
  achievements: Achievement[]
  isFollowing: boolean
}

export interface NotificationView extends Notification {
  actor: Profile
  recipe?: Pick<Recipe, 'id' | 'slug' | 'name' | 'resultHex'>
}

export interface MemberRow {
  profile: Profile
  /** Only ever returned to admins. */
  email: string | null
  recipeCount: number
  reproductionCount: number
  lastSignInAt: string | null
}

// ---------------------------------------------------------------- API ----

export interface SpoolShareApi {
  readonly backend: 'mock' | 'supabase'

  // auth
  getSession(): Promise<Profile | null>
  signIn(email: string, password: string): Promise<Profile>
  signInDemo(): Promise<Profile>
  signUp(input: SignUpInput): Promise<Profile>
  signOut(): Promise<void>
  /** Fires when the session changes outside the app (token refresh, other tab, email link). */
  onAuthChange(cb: () => void): () => void

  // catalog
  listManufacturers(): Promise<Manufacturer[]>
  listProductLines(): Promise<ProductLine[]>
  searchFilaments(q: FilamentQuery): Promise<FilamentView[]>
  getFilament(id: ID): Promise<FilamentView | null>
  getFilaments(ids: ID[]): Promise<FilamentView[]>
  createCustomFilament(input: CustomFilamentInput): Promise<FilamentView>

  // inventory
  getInventory(userId?: ID): Promise<InventoryEntry[]>
  addToInventory(filamentId: ID): Promise<InventoryEntry>
  updateInventoryItem(id: ID, patch: Partial<Pick<InventoryItem, 'spools' | 'remainingGrams' | 'notes' | 'photo'>>): Promise<InventoryItem>
  removeFromInventory(id: ID): Promise<void>

  // recipes
  searchRecipes(q: RecipeQuery): Promise<Page<RecipeHit>>
  getRecipe(slug: string): Promise<RecipeDetail | null>
  listDrafts(): Promise<Recipe[]>
  saveDraft(input: RecipeDraftInput): Promise<Recipe>
  publishRecipe(input: RecipeDraftInput): Promise<Recipe>
  deleteRecipe(id: ID): Promise<void>
  recordView(recipeId: ID): Promise<void>

  // reproductions
  addReproduction(input: ReproductionInput): Promise<Reproduction>
  listUserReproductions(userId: ID): Promise<(ReproductionView & { recipe: Recipe })[]>

  // favorites & collections
  listFavoriteIds(): Promise<ID[]>
  toggleFavorite(recipeId: ID): Promise<boolean>
  listCollections(userId?: ID): Promise<Collection[]>
  saveCollection(c: Partial<Collection> & { name: string }): Promise<Collection>
  deleteCollection(id: ID): Promise<void>
  toggleInCollection(collectionId: ID, recipeId: ID): Promise<Collection>

  // comments
  addComment(recipeId: ID, body: string, parentId?: ID): Promise<CommentView>
  deleteComment(id: ID): Promise<void>

  // social
  getProfile(username: string): Promise<ProfileDetail | null>
  updateProfile(patch: Partial<Omit<Profile, 'id' | 'joinedAt'>>): Promise<Profile>
  toggleFollow(userId: ID): Promise<boolean>
  listCreators(limit?: number): Promise<(Profile & { recipeCount: number; reproductionsReceived: number })[]>

  // moderation
  report(input: { targetType: Report['targetType']; targetId: ID; reason: ReportReason; details?: string }): Promise<Report>
  listReports(): Promise<Report[]>
  /** Admin only: everyone with an account. */
  listMembers(): Promise<MemberRow[]>

  // notifications
  listNotifications(): Promise<NotificationView[]>
  markNotificationsRead(): Promise<void>
}
