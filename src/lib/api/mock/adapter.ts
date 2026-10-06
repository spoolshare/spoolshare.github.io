import type {
  Collection, FilamentView, ID, InventoryItem, Profile, Recipe, RecipeSummary, Report, Reproduction,
} from '@/types'
import type {
  Achievement, CommentView, FilamentQuery, InventoryEntry, NotificationView, Page, ProfileDetail, RecipeDetail, RecipeDraftInput,
  RecipeHit, RecipeQuery, ReproductionView, SpoolShareApi,
} from '../types'
import { deltaE } from '@/lib/color/deltaE'
import { searchColorNames } from '@/lib/color/names'
import { ACHIEVEMENTS, runRecipeSearch, summarize as summarizeShared, type SummaryContext } from '../shared'
import { slugify, uid } from '@/lib/utils/id'
import { digest, getDb, persist, type DB } from './db'

/** Simulated network latency so loading states get exercised. */
const LATENCY = 90
const delay = <T>(value: T, ms = LATENCY): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(value)), ms))

class ApiError extends Error {
  constructor(message: string, public code: 'unauthorized' | 'not_found' | 'invalid' | 'conflict') {
    super(message)
  }
}

function me(db: DB): Profile {
  const p = db.session && db.profiles.find((x) => x.id === db.session!.profileId)
  if (!p) throw new ApiError('Please sign in to do that.', 'unauthorized')
  return p
}

function filamentView(db: DB, id: ID): FilamentView | undefined {
  const f = db.filaments.find((x) => x.id === id)
  if (!f) return undefined
  return {
    ...f,
    manufacturer: db.manufacturers.find((m) => m.id === f.manufacturerId)!,
    productLine: db.productLines.find((l) => l.id === f.productLineId)!,
  }
}

function ctxFor(db: DB): SummaryContext {
  const reps = new Map<ID, Reproduction[]>()
  for (const r of db.reproductions) reps.set(r.recipeId, [...(reps.get(r.recipeId) ?? []), r])
  return {
    profile: (id) => db.profiles.find((p) => p.id === id),
    reproductions: (id) => reps.get(id) ?? [],
    filament: (id) => filamentView(db, id),
  }
}

function summarize(db: DB, recipe: Recipe): RecipeSummary {
  return summarizeShared(recipe, ctxFor(db))
}

export function createMockApi(): SpoolShareApi {
  return {
    backend: 'mock',

    // ------------------------------------------------------------ auth --
    async getSession() {
      const db = getDb()
      const p = db.session ? db.profiles.find((x) => x.id === db.session!.profileId) ?? null : null
      return delay(p, 0)
    },
    async signIn(email, password) {
      const db = getDb()
      const acc = db.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase().trim())
      if (!acc || acc.passwordDigest !== digest(password)) {
        await delay(null, 400)
        throw new ApiError('That email and password don’t match an account.', 'unauthorized')
      }
      db.session = { profileId: acc.profileId }
      persist()
      return delay(db.profiles.find((p) => p.id === acc.profileId)!)
    },
    async signInDemo() {
      const db = getDb()
      db.session = { profileId: 'u-demo' }
      persist()
      return delay(db.profiles.find((p) => p.id === 'u-demo')!)
    },
    async signUp({ email, password, username, displayName }) {
      const db = getDb()
      const uname = username.toLowerCase().trim()
      if (!/^[a-z0-9._-]{3,24}$/.test(uname)) throw new ApiError('Usernames are 3–24 characters: letters, numbers, . _ -', 'invalid')
      if (db.profiles.some((p) => p.username === uname)) throw new ApiError('That username is taken.', 'conflict')
      if (db.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) throw new ApiError('An account with that email already exists.', 'conflict')
      if (password.length < 8) throw new ApiError('Use at least 8 characters for your password.', 'invalid')
      const profile: Profile = {
        id: uid('u'),
        username: uname,
        displayName: displayName.trim() || uname,
        avatarHue: Math.floor(Math.random() * 360),
        printers: [],
        inventoryVisibility: 'public',
        joinedAt: new Date().toISOString(),
      }
      db.profiles.push(profile)
      db.accounts.push({ email: email.trim(), passwordDigest: digest(password), profileId: profile.id })
      db.session = { profileId: profile.id }
      persist()
      return delay(profile, 300)
    },
    onAuthChange() {
      return () => {}
    },
    async signOut() {
      const db = getDb()
      db.session = null
      persist()
      return delay(undefined, 0)
    },

    // --------------------------------------------------------- catalog --
    async listManufacturers() {
      return delay(getDb().manufacturers, 0)
    },
    async listProductLines() {
      return delay(getDb().productLines, 0)
    },
    async searchFilaments(q: FilamentQuery) {
      const db = getDb()
      const viewerId = db.session?.profileId
      const text = q.text?.toLowerCase().trim() ?? ''
      const nameHits = text ? searchColorNames(text, 1) : []
      let rows = db.filaments
        .filter((f) => !f.isCustom || f.ownerId === viewerId)
        .map((f) => filamentView(db, f.id)!)
        .filter((f) => {
          if (q.manufacturerIds?.length && !q.manufacturerIds.includes(f.manufacturerId)) return false
          if (q.materials?.length && !q.materials.includes(f.material)) return false
          if (q.finishes?.length && !q.finishes.includes(f.finish)) return false
          if (!text) return true
          const hay = `${f.manufacturer.name} ${f.productLine.name} ${f.colorName} ${f.colorCode ?? ''} ${f.hex} ${f.material}`.toLowerCase()
          return text.split(/\s+/).every((t) => hay.includes(t)) || (nameHits[0] && deltaE(nameHits[0].hex, f.hex) < 12)
        })
      if (q.nearHex) rows = rows.sort((a, b) => deltaE(a.hex, q.nearHex!) - deltaE(b.hex, q.nearHex!))
      return delay(rows.slice(0, q.limit ?? 500), 40)
    },
    async getFilament(id) {
      return delay(filamentView(getDb(), id) ?? null, 0)
    },
    async getFilaments(ids) {
      const db = getDb()
      return delay(ids.map((id) => filamentView(db, id)).filter((f): f is FilamentView => !!f), 0)
    },
    async createCustomFilament(input) {
      const db = getDb()
      const user = me(db)
      let mfr = db.manufacturers.find((m) => m.name.toLowerCase() === input.manufacturerName.toLowerCase().trim())
      if (!mfr) {
        mfr = { id: uid('mfr'), name: input.manufacturerName.trim() }
        db.manufacturers.push(mfr)
      }
      let line = db.productLines.find((l) => l.manufacturerId === mfr!.id && l.name.toLowerCase() === input.productLineName.toLowerCase().trim())
      if (!line) {
        line = { id: uid('line'), manufacturerId: mfr.id, name: input.productLineName.trim(), material: input.material, finish: input.finish }
        db.productLines.push(line)
      }
      const f = {
        id: uid('fil'),
        manufacturerId: mfr.id,
        productLineId: line.id,
        material: input.material,
        colorName: input.colorName.trim(),
        hex: input.hex,
        finish: input.finish,
        transparency: 'opaque' as const,
        notes: input.notes,
        isCustom: true,
        ownerId: user.id,
      }
      db.filaments.push(f)
      persist()
      return delay(filamentView(db, f.id)!)
    },

    // ------------------------------------------------------- inventory --
    async getInventory(userId) {
      const db = getDb()
      const id = userId ?? db.session?.profileId
      if (!id) return delay([] as InventoryEntry[], 0)
      const owner = db.profiles.find((p) => p.id === id)
      if (userId && userId !== db.session?.profileId && owner?.inventoryVisibility === 'private') return delay([], 0)
      const rows = db.inventory
        .filter((i) => i.userId === id)
        .map((i) => ({ ...i, filament: filamentView(db, i.filamentId)! }))
        .filter((i) => i.filament)
      return delay(rows, 20)
    },
    async addToInventory(filamentId) {
      const db = getDb()
      const user = me(db)
      const existing = db.inventory.find((i) => i.userId === user.id && i.filamentId === filamentId)
      if (existing) return delay({ ...existing, filament: filamentView(db, filamentId)! }, 0)
      const filament = filamentView(db, filamentId)
      if (!filament) throw new ApiError('Filament not found.', 'not_found')
      const item: InventoryItem = { id: uid('inv'), userId: user.id, filamentId, spools: 1, addedAt: new Date().toISOString() }
      db.inventory.push(item)
      persist()
      return delay({ ...item, filament }, 60)
    },
    async updateInventoryItem(id, patch) {
      const db = getDb()
      const user = me(db)
      const item = db.inventory.find((i) => i.id === id && i.userId === user.id)
      if (!item) throw new ApiError('Inventory item not found.', 'not_found')
      Object.assign(item, patch)
      persist()
      return delay(item, 40)
    },
    async removeFromInventory(id) {
      const db = getDb()
      const user = me(db)
      db.inventory = db.inventory.filter((i) => !(i.id === id && i.userId === user.id))
      persist()
      return delay(undefined, 40)
    },

    // --------------------------------------------------------- recipes --
    async searchRecipes(q: RecipeQuery): Promise<Page<RecipeHit>> {
      const db = getDb()
      const ctx = ctxFor(db)
      const all = db.recipes.filter((r) => r.status === 'published').map((r) => summarizeShared(r, ctx))
      return delay(runRecipeSearch(all, q))
    },

    async getRecipe(slug) {
      const db = getDb()
      const r = db.recipes.find((x) => x.slug === slug || x.id === slug)
      const viewerId = db.session?.profileId
      if (!r || (r.status !== 'published' && r.authorId !== viewerId)) return delay(null)
      const summary = summarize(db, r)
      const userOf = (id: ID) => db.profiles.find((p) => p.id === id)!
      const reproductions: ReproductionView[] = db.reproductions
        .filter((x) => x.recipeId === r.id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map((x) => ({ ...x, user: userOf(x.userId), deltaE: deltaE(x.resultHex, r.resultHex) }))
      const comments: CommentView[] = db.comments
        .filter((c) => c.recipeId === r.id)
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
        .map((c) => ({ ...c, user: userOf(c.userId) }))
      const ids = new Set<ID>(summary.composition.map((c) => c.filamentId))
      r.stages.forEach((s) => s.inputs.forEach((i) => i.source.kind === 'filament' && ids.add(i.source.filamentId)))
      reproductions.forEach((x) => x.substitutions.forEach((s) => { ids.add(s.originalFilamentId); if (s.usedFilamentId) ids.add(s.usedFilamentId) }))
      const filamentsById: Record<ID, FilamentView> = {}
      ids.forEach((id) => { const f = filamentView(db, id); if (f) filamentsById[id] = f })
      const detail: RecipeDetail = { ...summary, reproductions, comments, filamentsById }
      return delay(detail)
    },

    async listDrafts() {
      const db = getDb()
      const user = me(db)
      return delay(db.recipes.filter((r) => r.authorId === user.id && r.status === 'draft').sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)), 30)
    },

    async saveDraft(input) {
      return delay(upsertRecipe(input, 'draft'), 60)
    },

    async publishRecipe(input) {
      if (!input.name.trim()) throw new ApiError('Give your recipe a name.', 'invalid')
      if (input.stages.length === 0) throw new ApiError('Add at least one mixing stage.', 'invalid')
      return delay(upsertRecipe(input, 'published'), 300)
    },

    async deleteRecipe(id) {
      const db = getDb()
      const user = me(db)
      db.recipes = db.recipes.filter((r) => !(r.id === id && r.authorId === user.id))
      persist()
      return delay(undefined)
    },

    async recordView(recipeId) {
      const db = getDb()
      const r = db.recipes.find((x) => x.id === recipeId)
      if (r) { r.viewCount += 1; persist() }
      return delay(undefined, 0)
    },

    // -------------------------------------------------- reproductions --
    async addReproduction(input) {
      const db = getDb()
      const user = me(db)
      const recipe = db.recipes.find((r) => r.id === input.recipeId)
      if (!recipe) throw new ApiError('Recipe not found.', 'not_found')
      if (recipe.authorId === user.id) throw new ApiError('Reproductions must come from other makers. Add more photos to your own recipe instead.', 'invalid')
      const rep: Reproduction = { ...input, id: uid('rep'), userId: user.id, createdAt: new Date().toISOString() }
      db.reproductions.push(rep)
      db.notifications.push({ id: uid('n'), userId: recipe.authorId, kind: 'reproduced', actorId: user.id, recipeId: recipe.id, read: false, createdAt: rep.createdAt })
      persist()
      return delay(rep, 300)
    },
    async listUserReproductions(userId) {
      const db = getDb()
      const user = db.profiles.find((p) => p.id === userId)!
      return delay(
        db.reproductions
          .filter((r) => r.userId === userId)
          .map((r) => {
            const recipe = db.recipes.find((x) => x.id === r.recipeId)!
            return { ...r, user, recipe, deltaE: deltaE(r.resultHex, recipe.resultHex) }
          })
          .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
      )
    },

    // ----------------------------------------------------- favorites --
    async listFavoriteIds() {
      const db = getDb()
      const id = db.session?.profileId
      return delay(id ? db.favorites.filter((f) => f.userId === id).map((f) => f.recipeId) : [], 0)
    },
    async toggleFavorite(recipeId) {
      const db = getDb()
      const user = me(db)
      const recipe = db.recipes.find((r) => r.id === recipeId)
      const idx = db.favorites.findIndex((f) => f.userId === user.id && f.recipeId === recipeId)
      let on: boolean
      if (idx >= 0) {
        db.favorites.splice(idx, 1)
        if (recipe) recipe.favoriteCount = Math.max(0, recipe.favoriteCount - 1)
        on = false
      } else {
        db.favorites.push({ userId: user.id, recipeId, createdAt: new Date().toISOString() })
        if (recipe) recipe.favoriteCount += 1
        on = true
        if (recipe && recipe.authorId !== user.id) {
          db.notifications.push({ id: uid('n'), userId: recipe.authorId, kind: 'favorited', actorId: user.id, recipeId, read: false, createdAt: new Date().toISOString() })
        }
      }
      persist()
      return delay(on, 30)
    },
    async listCollections(userId) {
      const db = getDb()
      const id = userId ?? db.session?.profileId
      const viewer = db.session?.profileId
      return delay(db.collections.filter((c) => c.userId === id && (c.isPublic || c.userId === viewer)), 20)
    },
    async saveCollection(input) {
      const db = getDb()
      const user = me(db)
      let c = input.id ? db.collections.find((x) => x.id === input.id && x.userId === user.id) : undefined
      if (c) Object.assign(c, input)
      else {
        c = { id: uid('col'), userId: user.id, name: input.name, description: input.description, isPublic: input.isPublic ?? false, recipeIds: input.recipeIds ?? [], createdAt: new Date().toISOString() }
        db.collections.push(c)
      }
      persist()
      return delay(c)
    },
    async deleteCollection(id) {
      const db = getDb()
      const user = me(db)
      db.collections = db.collections.filter((c) => !(c.id === id && c.userId === user.id))
      persist()
      return delay(undefined)
    },
    async toggleInCollection(collectionId, recipeId) {
      const db = getDb()
      const user = me(db)
      const c = db.collections.find((x) => x.id === collectionId && x.userId === user.id)
      if (!c) throw new ApiError('Collection not found.', 'not_found')
      c.recipeIds = c.recipeIds.includes(recipeId) ? c.recipeIds.filter((r) => r !== recipeId) : [...c.recipeIds, recipeId]
      persist()
      return delay(c as Collection, 30)
    },

    // ------------------------------------------------------- comments --
    async addComment(recipeId, body, parentId) {
      const db = getDb()
      const user = me(db)
      const text = body.trim()
      if (!text) throw new ApiError('Comment is empty.', 'invalid')
      if (text.length > 2000) throw new ApiError('Comments are limited to 2000 characters.', 'invalid')
      const c = { id: uid('c'), recipeId, userId: user.id, parentId, body: text, createdAt: new Date().toISOString() }
      db.comments.push(c)
      const recipe = db.recipes.find((r) => r.id === recipeId)
      if (recipe && recipe.authorId !== user.id) {
        db.notifications.push({ id: uid('n'), userId: recipe.authorId, kind: 'commented', actorId: user.id, recipeId, read: false, createdAt: c.createdAt })
      }
      persist()
      return delay({ ...c, user })
    },
    async deleteComment(id) {
      const db = getDb()
      const user = me(db)
      db.comments = db.comments.filter((c) => !(c.id === id && (c.userId === user.id || user.role === 'moderator')))
      persist()
      return delay(undefined)
    },

    // --------------------------------------------------------- social --
    async getProfile(username) {
      const db = getDb()
      const profile = db.profiles.find((p) => p.username === username)
      if (!profile) return delay(null)
      const mine = db.recipes.filter((r) => r.authorId === profile.id && r.status === 'published')
      const mineIds = new Set(mine.map((r) => r.id))
      const stats = {
        recipes: mine.length,
        reproductions: db.reproductions.filter((r) => r.userId === profile.id).length,
        favoritesReceived: mine.reduce((a, r) => a + r.favoriteCount, 0),
        reproductionsReceived: db.reproductions.filter((r) => mineIds.has(r.recipeId)).length,
        followers: db.follows.filter((f) => f.followeeId === profile.id).length,
        following: db.follows.filter((f) => f.followerId === profile.id).length,
      }
      const achievements: Achievement[] = ACHIEVEMENTS.map((a) => ({ id: a.id, label: a.label, description: a.description, earned: a.test(stats) }))
      const viewer = db.session?.profileId
      const detail: ProfileDetail = {
        profile,
        stats,
        achievements,
        isFollowing: !!viewer && db.follows.some((f) => f.followerId === viewer && f.followeeId === profile.id),
      }
      return delay(detail)
    },
    async updateProfile(patch) {
      const db = getDb()
      const user = me(db)
      if (patch.username && patch.username !== user.username) {
        const u = patch.username.toLowerCase()
        if (!/^[a-z0-9._-]{3,24}$/.test(u)) throw new ApiError('Usernames are 3–24 characters: letters, numbers, . _ -', 'invalid')
        if (db.profiles.some((p) => p.username === u)) throw new ApiError('That username is taken.', 'conflict')
        patch.username = u
      }
      Object.assign(user, patch)
      persist()
      return delay(user, 120)
    },
    async toggleFollow(userId) {
      const db = getDb()
      const user = me(db)
      if (user.id === userId) throw new ApiError('You can’t follow yourself.', 'invalid')
      const idx = db.follows.findIndex((f) => f.followerId === user.id && f.followeeId === userId)
      if (idx >= 0) {
        db.follows.splice(idx, 1)
        persist()
        return delay(false, 30)
      }
      db.follows.push({ followerId: user.id, followeeId: userId, createdAt: new Date().toISOString() })
      db.notifications.push({ id: uid('n'), userId, kind: 'followed', actorId: user.id, read: false, createdAt: new Date().toISOString() })
      persist()
      return delay(true, 30)
    },
    async listCreators(limit = 8) {
      const db = getDb()
      const rows = db.profiles
        .filter((p) => p.id !== 'u-demo')
        .map((p) => {
          const ids = new Set(db.recipes.filter((r) => r.authorId === p.id && r.status === 'published').map((r) => r.id))
          return { ...p, recipeCount: ids.size, reproductionsReceived: db.reproductions.filter((r) => ids.has(r.recipeId)).length }
        })
        .filter((p) => p.recipeCount > 0)
        .sort((a, b) => b.reproductionsReceived - a.reproductionsReceived)
      return delay(rows.slice(0, limit))
    },

    // ----------------------------------------------------- moderation --
    async report(input) {
      const db = getDb()
      const user = me(db)
      const r: Report = { ...input, id: uid('rpt'), reporterId: user.id, status: 'open', createdAt: new Date().toISOString() }
      db.reports.push(r)
      persist()
      return delay(r, 200)
    },
    async listMembers() {
      const db = getDb()
      const user = me(db)
      if (user.role !== 'admin') throw new ApiError('Admins only.', 'unauthorized')
      const rows = db.profiles.map((profile) => ({
        profile,
        email: db.accounts.find((a) => a.profileId === profile.id)?.email ?? null,
        recipeCount: db.recipes.filter((r) => r.authorId === profile.id && r.status === 'published').length,
        reproductionCount: db.reproductions.filter((r) => r.userId === profile.id).length,
        lastSignInAt: null,
      }))
      return delay(rows)
    },
    async listReports() {
      const db = getDb()
      const user = me(db)
      if (user.role !== 'moderator' && user.role !== 'admin') throw new ApiError('Moderators only.', 'unauthorized')
      return delay(db.reports)
    },

    // -------------------------------------------------- notifications --
    async listNotifications() {
      const db = getDb()
      const id = db.session?.profileId
      if (!id) return delay([] as NotificationView[], 0)
      const rows: NotificationView[] = db.notifications
        .filter((n) => n.userId === id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map((n) => {
          const recipe = n.recipeId ? db.recipes.find((r) => r.id === n.recipeId) : undefined
          return {
            ...n,
            actor: db.profiles.find((p) => p.id === n.actorId)!,
            recipe: recipe && { id: recipe.id, slug: recipe.slug, name: recipe.name, resultHex: recipe.resultHex },
          }
        })
      return delay(rows, 30)
    },
    async markNotificationsRead() {
      const db = getDb()
      const id = db.session?.profileId
      db.notifications.forEach((n) => { if (n.userId === id) n.read = true })
      persist()
      return delay(undefined, 0)
    },
  }
}

function upsertRecipe(input: RecipeDraftInput, status: Recipe['status']): Recipe {
  const db = getDb()
  const user = me(db)
  const now = new Date().toISOString()
  const existing = input.id ? db.recipes.find((r) => r.id === input.id && r.authorId === user.id) : undefined
  if (existing) {
    const wasDraft = existing.status === 'draft'
    Object.assign(existing, input, { status, updatedAt: now })
    if (status === 'published' && wasDraft) {
      existing.slug = uniqueSlug(db, input.name, existing.id)
      existing.createdAt = now
    }
    persist()
    return existing
  }
  const id = input.id ?? uid('r')
  const recipe: Recipe = {
    ...input,
    id,
    slug: status === 'published' ? uniqueSlug(db, input.name, id) : `draft-${id}`,
    authorId: user.id,
    status,
    createdAt: now,
    updatedAt: now,
    favoriteCount: 0,
    viewCount: 0,
  }
  db.recipes.push(recipe)
  persist()
  return recipe
}

function uniqueSlug(db: DB, name: string, selfId: ID): string {
  const base = slugify(name) || 'recipe'
  let slug = base
  let n = 2
  while (db.recipes.some((r) => r.slug === slug && r.id !== selfId)) slug = `${base}-${n++}`
  return slug
}
