/**
 * Supabase implementation of SpoolShareApi.
 *
 * Security: this runs in the browser with the public anon/publishable key.
 * Every read and write is checked by Row-Level Security (supabase/schema.sql),
 * and multi-table writes go through security-definer RPCs (migrations/002).
 *
 * Search: published recipes are loaded into a short-lived snapshot and ranked
 * client-side with the same code as the mock (../shared.ts). That's fine for
 * thousands of recipes; beyond that, move ranking into a Postgres function.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type {
  Collection, FilamentView, ID, InventoryItem, Manufacturer, Notification, Photo, ProductLine, Profile, Recipe, Report,
  Reproduction, Stage,
} from '@/types'
import type {
  CommentView, InventoryEntry, MemberRow, NotificationView, ProfileDetail, RecipeDetail, RecipeDraftInput, ReproductionView,
  SpoolShareApi,
} from '../types'
import { ACHIEVEMENTS, runRecipeSearch, summarize, type SummaryContext } from '../shared'
import { deltaE } from '@/lib/color/deltaE'
import { searchColorNames } from '@/lib/color/names'
import { recipeComposition } from '@/lib/recipe/composition'
import { slugify } from '@/lib/utils/id'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)

/** Unwraps a Supabase response, throwing a friendly error. */
function check(res: { data?: unknown; error: { message: string } | null }): Row & Row[] {
  if (res.error) throw new Error(friendly(res.error.message))
  return res.data as Row & Row[]
}

function friendly(msg: string): string {
  if (/Invalid login credentials/i.test(msg)) return 'That email and password don’t match an account.'
  if (/Email not confirmed/i.test(msg)) return 'Please confirm your email first. Check your inbox for the link.'
  if (/User already registered/i.test(msg)) return 'An account with that email already exists.'
  if (/row-level security/i.test(msg)) return 'You don’t have permission to do that.'
  if (/duplicate key.*username/i.test(msg)) return 'That username is taken.'
  return msg
}

// ------------------------------------------------------------- mappers ----

const toProfile = (r: Row): Profile => ({
  id: r.id,
  username: r.username,
  displayName: r.display_name,
  avatarUrl: r.avatar_url ?? undefined,
  avatarHue: r.avatar_hue ?? 145,
  bio: r.bio ?? undefined,
  location: r.location ?? undefined,
  printers: r.printers ?? [],
  inventoryVisibility: r.inventory_visibility ?? 'public',
  joinedAt: r.joined_at,
  role: r.role ?? 'member',
})

const toStage = (r: Row): Stage => ({
  id: r.id,
  name: r.name,
  outputName: r.output_name,
  batchGrams: r.batch_grams != null ? Number(r.batch_grams) : undefined,
  instructions: r.instructions ?? '',
  photos: r.photos ?? [],
  outputHex: r.output_hex ?? undefined,
  inputs: [...(r.stage_inputs ?? [])]
    .sort((a: Row, b: Row) => a.position - b.position)
    .map((i: Row) => ({
      id: i.id,
      parts: Number(i.parts),
      source: i.source_stage_id ? { kind: 'stage' as const, stageId: i.source_stage_id } : { kind: 'filament' as const, filamentId: i.filament_id },
    })),
})

const toRecipe = (r: Row): Recipe => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description ?? '',
  authorId: r.author_id,
  status: r.status,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
  resultHex: r.result_hex,
  photos: r.photos ?? [],
  lightingNotes: r.lighting_notes ?? undefined,
  material: r.material,
  finish: r.finish,
  mixingMethod: r.mixing_method,
  printer: r.printer ?? undefined,
  nozzle: r.nozzle ?? undefined,
  layerHeight: r.layer_height ?? undefined,
  tags: r.tags ?? [],
  notes: r.notes ?? undefined,
  isExample: r.is_example ?? false,
  favoriteCount: r.favorite_count ?? 0,
  viewCount: r.view_count ?? 0,
  stages: [...(r.recipe_stages ?? [])].sort((a: Row, b: Row) => a.position - b.position).map(toStage),
})

const toReproduction = (r: Row): Reproduction => ({
  id: r.id,
  recipeId: r.recipe_id,
  userId: r.user_id,
  resultHex: r.result_hex,
  photos: r.photos ?? [],
  printer: r.printer ?? undefined,
  material: r.material ?? undefined,
  substitutions: r.substitutions ?? [],
  notes: r.notes ?? undefined,
  accuracyRating: r.accuracy_rating,
  createdAt: r.created_at,
})

const toInventory = (r: Row): InventoryItem => ({
  id: r.id,
  userId: r.user_id,
  filamentId: r.filament_id,
  spools: r.spools ?? undefined,
  remainingGrams: r.remaining_grams ?? undefined,
  photo: r.photo ?? undefined,
  notes: r.notes ?? undefined,
  addedAt: r.added_at,
})

const RECIPE_SELECT = '*, recipe_stages(*, stage_inputs!stage_inputs_stage_id_fkey(*))'

export function createSupabaseApi({ url, anonKey }: { url: string; anonKey: string }): SpoolShareApi {
  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  })

  // ------------------------------------------------------------ caches ---
  let catalog: Promise<{ manufacturers: Manufacturer[]; lines: ProductLine[]; filaments: Map<ID, FilamentView> }> | null = null
  const loadCatalog = () =>
    (catalog ??= (async () => {
      const [m, l, f] = await Promise.all([
        sb.from('manufacturers').select('*').order('name'),
        sb.from('product_lines').select('*'),
        sb.from('filaments').select('*').limit(5000),
      ])
      const manufacturers: Manufacturer[] = check(m).map((r: Row) => ({ id: r.id, name: r.name, website: r.website ?? undefined }))
      const lines: ProductLine[] = check(l).map((r: Row) => ({ id: r.id, manufacturerId: r.manufacturer_id, name: r.name, material: r.material, finish: r.finish }))
      const mById = new Map(manufacturers.map((x) => [x.id, x]))
      const lById = new Map(lines.map((x) => [x.id, x]))
      const filaments = new Map<ID, FilamentView>()
      for (const r of check(f) as Row[]) {
        filaments.set(r.id, {
          id: r.id,
          manufacturerId: r.manufacturer_id,
          productLineId: r.product_line_id,
          material: r.material,
          colorName: r.color_name,
          colorCode: r.color_code ?? undefined,
          hex: r.hex,
          hexVerified: r.hex_verified,
          finish: r.finish,
          transparency: r.transparency,
          notes: r.notes ?? undefined,
          isCustom: r.is_custom,
          ownerId: r.owner_id ?? undefined,
          manufacturer: mById.get(r.manufacturer_id)!,
          productLine: lById.get(r.product_line_id)!,
        })
      }
      return { manufacturers, lines, filaments }
    })().catch((e) => {
      catalog = null
      throw e
    }))

  const profileCache = new Map<ID, Profile>()
  async function profilesFor(ids: ID[]): Promise<Map<ID, Profile>> {
    const missing = [...new Set(ids)].filter((id) => id && !profileCache.has(id))
    if (missing.length) {
      const rows = check(await sb.from('profiles').select('*').in('id', missing))
      for (const r of rows as Row[]) profileCache.set(r.id, toProfile(r))
    }
    return profileCache
  }

  let snapshot: { at: number; promise: Promise<{ recipes: Recipe[]; reps: Map<ID, Reproduction[]> }> } | null = null
  const SNAPSHOT_TTL = 20_000
  const loadSnapshot = () => {
    if (snapshot && Date.now() - snapshot.at < SNAPSHOT_TTL) return snapshot.promise
    const promise = (async () => {
      const [r, x] = await Promise.all([
        sb.from('recipes').select(RECIPE_SELECT).eq('status', 'published').order('created_at', { ascending: false }).limit(5000),
        sb.from('reproductions').select('*').limit(50000),
      ])
      const recipes = (check(r) as Row[]).map(toRecipe)
      const reps = new Map<ID, Reproduction[]>()
      for (const row of check(x) as Row[]) {
        const rep = toReproduction(row)
        reps.set(rep.recipeId, [...(reps.get(rep.recipeId) ?? []), rep])
      }
      await profilesFor(recipes.map((rr) => rr.authorId))
      return { recipes, reps }
    })()
    snapshot = { at: Date.now(), promise }
    promise.catch(() => (snapshot = null))
    return promise
  }
  const dirty = () => {
    snapshot = null
  }

  async function ctx(reps: Map<ID, Reproduction[]>): Promise<SummaryContext> {
    const cat = await loadCatalog()
    return { profile: (id) => profileCache.get(id), reproductions: (id) => reps.get(id) ?? [], filament: (id) => cat.filaments.get(id) }
  }

  async function uid(): Promise<ID> {
    const { data } = await sb.auth.getSession()
    const id = data.session?.user.id
    if (!id) throw new Error('Please sign in to do that.')
    return id
  }

  async function myProfile(): Promise<Profile | null> {
    const { data } = await sb.auth.getSession()
    const id = data.session?.user.id
    if (!id) return null
    // The profile row is created by a trigger at sign-up; retry briefly in case it lags.
    for (let i = 0; i < 3; i++) {
      const { data: row } = await sb.from('profiles').select('*').eq('id', id).maybeSingle()
      if (row) {
        const p = toProfile(row)
        profileCache.set(p.id, p)
        return p
      }
      await new Promise((r) => setTimeout(r, 400))
    }
    return null
  }

  /** Uploads any data: URL photos to Storage and returns them with public URLs. */
  async function persistPhotos(photos: Photo[], userId: ID): Promise<Photo[]> {
    return Promise.all(
      photos.map(async (p) => {
        if (!p.url.startsWith('data:')) return p
        const blob = await (await fetch(p.url)).blob()
        const path = `${userId}/${p.id}.jpg`
        check(await sb.storage.from('swatches').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: true }))
        const { data } = sb.storage.from('swatches').getPublicUrl(path)
        return { ...p, url: data.publicUrl }
      }),
    )
  }

  async function fetchRecipe(idOrSlug: string): Promise<Recipe | null> {
    const q = sb.from('recipes').select(RECIPE_SELECT)
    const { data, error } = await (isUuid(idOrSlug) ? q.eq('id', idOrSlug) : q.eq('slug', idOrSlug)).maybeSingle()
    if (error) throw new Error(friendly(error.message))
    return data ? toRecipe(data) : null
  }

  async function save(input: RecipeDraftInput, publish: boolean): Promise<Recipe> {
    const me = await uid()
    const photos = await persistPhotos(input.photos, me)
    const stages = await Promise.all(input.stages.map(async (s) => ({ ...s, photos: await persistPhotos(s.photos, me) })))
    const composition = recipeComposition({ stages }).map((c) => ({ filamentId: c.filamentId, fraction: c.fraction }))
    const payload = {
      ...input,
      id: input.id && isUuid(input.id) ? input.id : undefined,
      photos,
      slugBase: slugify(input.name),
      composition,
      stages: stages.map((s) => ({
        ...s,
        inputs: s.inputs.map((i) => ({
          id: i.id,
          parts: i.parts,
          filamentId: i.source.kind === 'filament' ? i.source.filamentId : undefined,
          stageId: i.source.kind === 'stage' ? i.source.stageId : undefined,
        })),
      })),
    }
    const res = check(await sb.rpc('save_recipe', { p: payload, p_publish: publish })) as unknown as { id: ID; slug: string }
    dirty()
    const r = await fetchRecipe(res.id)
    if (!r) throw new Error('Saved, but the recipe could not be reloaded.')
    return r
  }

  return {
    backend: 'supabase',

    // ------------------------------------------------------------ auth --
    async getSession() {
      return myProfile()
    },
    async signIn(email, password) {
      check(await sb.auth.signInWithPassword({ email: email.trim(), password }))
      const p = await myProfile()
      if (!p) throw new Error('Signed in, but your profile is missing. Please contact support.')
      return p
    },
    async signInDemo() {
      throw new Error('The demo account is only available in demo mode.')
    },
    async signUp({ email, password, username, displayName }) {
      const uname = username.toLowerCase().trim()
      if (!/^[a-z0-9._-]{3,24}$/.test(uname)) throw new Error('Usernames are 3–24 characters: letters, numbers, . _ -')
      if (password.length < 8) throw new Error('Use at least 8 characters for your password.')
      const { data: taken } = await sb.from('profiles').select('id').eq('username', uname).maybeSingle()
      if (taken) throw new Error('That username is taken.')
      const res = check(
        await sb.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { username: uname, display_name: displayName.trim() || uname },
            emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}`,
          },
        }),
      )
      if (!res.session) throw new Error('Almost there! Check your email and click the confirmation link, then sign in.')
      const p = await myProfile()
      if (!p) throw new Error('Account created, but the profile is still being set up. Try signing in again in a moment.')
      return p
    },
    async signOut() {
      const { error } = await sb.auth.signOut()
      if (error) throw new Error(friendly(error.message))
      profileCache.clear()
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') cb()
      })
      return () => data.subscription.unsubscribe()
    },

    // --------------------------------------------------------- catalog --
    async listManufacturers() {
      return (await loadCatalog()).manufacturers
    },
    async listProductLines() {
      return (await loadCatalog()).lines
    },
    async searchFilaments(q) {
      const cat = await loadCatalog()
      const text = q.text?.toLowerCase().trim() ?? ''
      const named = text ? searchColorNames(text, 1)[0] : undefined
      let rows = [...cat.filaments.values()].filter((f) => {
        if (q.manufacturerIds?.length && !q.manufacturerIds.includes(f.manufacturerId)) return false
        if (q.materials?.length && !q.materials.includes(f.material)) return false
        if (q.finishes?.length && !q.finishes.includes(f.finish)) return false
        if (!text) return true
        const hay = `${f.manufacturer.name} ${f.productLine.name} ${f.colorName} ${f.colorCode ?? ''} ${f.hex} ${f.material}`.toLowerCase()
        return text.split(/\s+/).every((t) => hay.includes(t)) || (named && deltaE(named.hex, f.hex) < 12)
      })
      rows = q.nearHex ? rows.sort((a, b) => deltaE(a.hex, q.nearHex!) - deltaE(b.hex, q.nearHex!)) : rows.sort((a, b) => a.manufacturer.name.localeCompare(b.manufacturer.name) || a.productLine.name.localeCompare(b.productLine.name))
      return rows.slice(0, q.limit ?? 500)
    },
    async getFilament(id) {
      return (await loadCatalog()).filaments.get(id) ?? null
    },
    async getFilaments(ids) {
      const cat = await loadCatalog()
      return ids.map((id) => cat.filaments.get(id)).filter((f): f is FilamentView => !!f)
    },
    async createCustomFilament(input) {
      const me = await uid()
      const cat = await loadCatalog()
      // Custom filaments live under user-scoped manufacturer/line ids so they never collide with the shared catalog.
      const mfrId = cat.manufacturers.find((m) => m.name.toLowerCase() === input.manufacturerName.toLowerCase().trim())?.id
      if (!mfrId) throw new Error('That manufacturer isn’t in the catalog yet. Pick an existing brand, or ask a moderator to add it.')
      let line = cat.lines.find((l) => l.manufacturerId === mfrId && l.name.toLowerCase() === input.productLineName.toLowerCase().trim())
      if (!line) {
        line = cat.lines.find((l) => l.manufacturerId === mfrId)
        if (!line) throw new Error('No product lines for that brand yet.')
      }
      const row = check(
        await sb
          .from('filaments')
          .insert({
            manufacturer_id: mfrId,
            product_line_id: line.id,
            material: input.material,
            color_name: input.colorName.trim(),
            hex: input.hex.toUpperCase(),
            finish: input.finish,
            notes: [input.productLineName !== line.name ? `Product line: ${input.productLineName}` : '', input.notes ?? ''].filter(Boolean).join('\n') || null,
            is_custom: true,
            owner_id: me,
          })
          .select('id')
          .single(),
      ) as Row
      catalog = null
      return (await loadCatalog()).filaments.get(row.id)!
    },

    // ------------------------------------------------------- inventory --
    async getInventory(userId) {
      const id = userId ?? (await sb.auth.getSession()).data.session?.user.id
      if (!id) return []
      const cat = await loadCatalog()
      const rows = check(await sb.from('inventory_items').select('*').eq('user_id', id).order('added_at')) as Row[]
      return rows.map(toInventory).map((i) => ({ ...i, filament: cat.filaments.get(i.filamentId)! })).filter((i) => i.filament)
    },
    async addToInventory(filamentId) {
      const me = await uid()
      const cat = await loadCatalog()
      const row = check(await sb.from('inventory_items').upsert({ user_id: me, filament_id: filamentId, spools: 1 }, { onConflict: 'user_id,filament_id' }).select('*').single())
      return { ...toInventory(row), filament: cat.filaments.get(filamentId)! } as InventoryEntry
    },
    async updateInventoryItem(id, patch) {
      const row = check(
        await sb
          .from('inventory_items')
          .update({
            ...(patch.spools !== undefined && { spools: patch.spools }),
            ...(patch.remainingGrams !== undefined && { remaining_grams: patch.remainingGrams }),
            ...(patch.notes !== undefined && { notes: patch.notes }),
            ...(patch.photo !== undefined && { photo: patch.photo }),
          })
          .eq('id', id)
          .select('*')
          .single(),
      )
      return toInventory(row)
    },
    async removeFromInventory(id) {
      check(await sb.from('inventory_items').delete().eq('id', id))
    },

    // --------------------------------------------------------- recipes --
    async searchRecipes(q) {
      const snap = await loadSnapshot()
      const c = await ctx(snap.reps)
      return runRecipeSearch(snap.recipes.map((r) => summarize(r, c)), q)
    },
    async getRecipe(slug) {
      const recipe = await fetchRecipe(slug)
      if (!recipe) return null
      const [repRows, comRows] = await Promise.all([
        sb.from('reproductions').select('*').eq('recipe_id', recipe.id).order('created_at', { ascending: false }),
        sb.from('comments').select('*').eq('recipe_id', recipe.id).order('created_at'),
      ])
      const reps = (check(repRows) as Row[]).map(toReproduction)
      const comments = check(comRows) as Row[]
      const profiles = await profilesFor([recipe.authorId, ...reps.map((r) => r.userId), ...comments.map((c) => c.user_id)])
      const c = await ctx(new Map([[recipe.id, reps]]))
      const summary = summarize(recipe, c)
      const cat = await loadCatalog()
      const ids = new Set<ID>(summary.composition.map((x) => x.filamentId))
      recipe.stages.forEach((s) => s.inputs.forEach((i) => i.source.kind === 'filament' && ids.add(i.source.filamentId)))
      reps.forEach((x) => x.substitutions.forEach((s) => { ids.add(s.originalFilamentId); if (s.usedFilamentId) ids.add(s.usedFilamentId) }))
      const filamentsById: Record<ID, FilamentView> = {}
      ids.forEach((id) => { const f = cat.filaments.get(id); if (f) filamentsById[id] = f })
      const detail: RecipeDetail = {
        ...summary,
        reproductions: reps.map((r) => ({ ...r, user: profiles.get(r.userId)!, deltaE: deltaE(r.resultHex, recipe.resultHex) })),
        comments: comments.map((row) => ({ id: row.id, recipeId: row.recipe_id, userId: row.user_id, parentId: row.parent_id ?? undefined, body: row.body, createdAt: row.created_at, user: profiles.get(row.user_id)! })),
        filamentsById,
      }
      return detail
    },
    async listDrafts() {
      const me = await uid()
      const rows = check(await sb.from('recipes').select(RECIPE_SELECT).eq('author_id', me).eq('status', 'draft').order('updated_at', { ascending: false }))
      return (rows as Row[]).map(toRecipe)
    },
    async saveDraft(input) {
      return save(input, false)
    },
    async publishRecipe(input) {
      return save(input, true)
    },
    async deleteRecipe(id) {
      check(await sb.from('recipes').delete().eq('id', id))
      dirty()
    },
    async recordView(recipeId) {
      if (isUuid(recipeId)) await sb.rpc('increment_view', { p_recipe: recipeId })
    },

    // -------------------------------------------------- reproductions --
    async addReproduction(input) {
      const me = await uid()
      const photos = await persistPhotos(input.photos, me)
      const row = check(
        await sb
          .from('reproductions')
          .insert({
            recipe_id: input.recipeId,
            user_id: me,
            result_hex: input.resultHex.toUpperCase(),
            photos,
            printer: input.printer || null,
            material: input.material ?? null,
            substitutions: input.substitutions,
            notes: input.notes || null,
            accuracy_rating: input.accuracyRating,
          })
          .select('*')
          .single(),
      )
      dirty()
      return toReproduction(row)
    },
    async listUserReproductions(userId) {
      const rows = check(await sb.from('reproductions').select(`*, recipe:recipes(${RECIPE_SELECT})`).eq('user_id', userId).order('created_at', { ascending: false })) as Row[]
      const profiles = await profilesFor([userId])
      return rows
        .filter((r) => r.recipe)
        .map((r) => {
          const recipe = toRecipe(r.recipe)
          const rep = toReproduction(r)
          return { ...rep, user: profiles.get(userId)!, recipe, deltaE: deltaE(rep.resultHex, recipe.resultHex) }
        })
    },

    // ----------------------------------------------------- favorites --
    async listFavoriteIds() {
      const { data } = await sb.auth.getSession()
      if (!data.session) return []
      const rows = check(await sb.from('favorites').select('recipe_id').eq('user_id', data.session.user.id)) as Row[]
      return rows.map((r) => r.recipe_id)
    },
    async toggleFavorite(recipeId) {
      const me = await uid()
      const { data: existing } = await sb.from('favorites').select('recipe_id').eq('user_id', me).eq('recipe_id', recipeId).maybeSingle()
      dirty()
      if (existing) {
        check(await sb.from('favorites').delete().eq('user_id', me).eq('recipe_id', recipeId))
        return false
      }
      check(await sb.from('favorites').insert({ user_id: me, recipe_id: recipeId }))
      return true
    },
    async listCollections(userId) {
      const id = userId ?? (await sb.auth.getSession()).data.session?.user.id
      if (!id) return []
      const rows = check(await sb.from('collections').select('*, collection_items(recipe_id)').eq('user_id', id).order('created_at')) as Row[]
      return rows.map(toCollection)
    },
    async saveCollection(input) {
      const me = await uid()
      const fields = { name: input.name, description: input.description ?? null, is_public: input.isPublic ?? false }
      const row = (input.id
        ? check(await sb.from('collections').update(fields).eq('id', input.id).select('*').single())
        : check(await sb.from('collections').insert({ ...fields, user_id: me }).select('*').single())) as Row
      if (input.recipeIds) {
        check(await sb.from('collection_items').delete().eq('collection_id', row.id))
        if (input.recipeIds.length) check(await sb.from('collection_items').insert(input.recipeIds.map((r) => ({ collection_id: row.id, recipe_id: r }))))
      }
      const full = check(await sb.from('collections').select('*, collection_items(recipe_id)').eq('id', row.id).single())
      return toCollection(full)
    },
    async deleteCollection(id) {
      check(await sb.from('collections').delete().eq('id', id))
    },
    async toggleInCollection(collectionId, recipeId) {
      const { data: existing } = await sb.from('collection_items').select('recipe_id').eq('collection_id', collectionId).eq('recipe_id', recipeId).maybeSingle()
      if (existing) check(await sb.from('collection_items').delete().eq('collection_id', collectionId).eq('recipe_id', recipeId))
      else check(await sb.from('collection_items').insert({ collection_id: collectionId, recipe_id: recipeId }))
      return toCollection(check(await sb.from('collections').select('*, collection_items(recipe_id)').eq('id', collectionId).single()))
    },

    // ------------------------------------------------------- comments --
    async addComment(recipeId, body, parentId) {
      const me = await uid()
      const text = body.trim()
      if (!text) throw new Error('Comment is empty.')
      const row = check(await sb.from('comments').insert({ recipe_id: recipeId, user_id: me, body: text, parent_id: parentId ?? null }).select('*').single()) as Row
      const profiles = await profilesFor([me])
      const view: CommentView = { id: row.id, recipeId: row.recipe_id, userId: row.user_id, parentId: row.parent_id ?? undefined, body: row.body, createdAt: row.created_at, user: profiles.get(me)! }
      return view
    },
    async deleteComment(id) {
      check(await sb.from('comments').delete().eq('id', id))
    },

    // --------------------------------------------------------- social --
    async getProfile(username) {
      const row = check(await sb.from('profiles').select('*').eq('username', username).maybeSingle())
      if (!row) return null
      const profile = toProfile(row)
      profileCache.set(profile.id, profile)
      const viewer = (await sb.auth.getSession()).data.session?.user.id
      const [mine, made, followers, following, isF] = await Promise.all([
        sb.from('recipes').select('id, favorite_count').eq('author_id', profile.id).eq('status', 'published'),
        sb.from('reproductions').select('id', { count: 'exact', head: true }).eq('user_id', profile.id),
        sb.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followee_id', profile.id),
        sb.from('follows').select('followee_id', { count: 'exact', head: true }).eq('follower_id', profile.id),
        viewer ? sb.from('follows').select('follower_id').eq('follower_id', viewer).eq('followee_id', profile.id).maybeSingle() : Promise.resolve({ data: null }),
      ])
      const mineRows = (check(mine) as Row[]) ?? []
      const ids = mineRows.map((r) => r.id)
      const received = ids.length ? (await sb.from('reproductions').select('id', { count: 'exact', head: true }).in('recipe_id', ids)).count ?? 0 : 0
      const stats = {
        recipes: mineRows.length,
        reproductions: made.count ?? 0,
        favoritesReceived: mineRows.reduce((a, r) => a + (r.favorite_count ?? 0), 0),
        reproductionsReceived: received,
        followers: followers.count ?? 0,
        following: following.count ?? 0,
      }
      const detail: ProfileDetail = {
        profile,
        stats,
        achievements: ACHIEVEMENTS.map((a) => ({ id: a.id, label: a.label, description: a.description, earned: a.test(stats) })),
        isFollowing: !!isF.data,
      }
      return detail
    },
    async updateProfile(patch) {
      const me = await uid()
      const row = check(
        await sb
          .from('profiles')
          .update({
            ...(patch.username !== undefined && { username: patch.username.toLowerCase() }),
            ...(patch.displayName !== undefined && { display_name: patch.displayName }),
            ...(patch.bio !== undefined && { bio: patch.bio }),
            ...(patch.location !== undefined && { location: patch.location }),
            ...(patch.printers !== undefined && { printers: patch.printers }),
            ...(patch.inventoryVisibility !== undefined && { inventory_visibility: patch.inventoryVisibility }),
            ...(patch.avatarHue !== undefined && { avatar_hue: patch.avatarHue }),
          })
          .eq('id', me)
          .select('*')
          .single(),
      )
      const p = toProfile(row)
      profileCache.set(p.id, p)
      dirty()
      return p
    },
    async toggleFollow(userId) {
      const me = await uid()
      const { data: existing } = await sb.from('follows').select('follower_id').eq('follower_id', me).eq('followee_id', userId).maybeSingle()
      if (existing) {
        check(await sb.from('follows').delete().eq('follower_id', me).eq('followee_id', userId))
        return false
      }
      check(await sb.from('follows').insert({ follower_id: me, followee_id: userId }))
      return true
    },
    async listCreators(limit = 8) {
      const snap = await loadSnapshot()
      const byAuthor = new Map<ID, { recipeCount: number; reproductionsReceived: number }>()
      for (const r of snap.recipes) {
        const e = byAuthor.get(r.authorId) ?? { recipeCount: 0, reproductionsReceived: 0 }
        e.recipeCount += 1
        e.reproductionsReceived += snap.reps.get(r.id)?.length ?? 0
        byAuthor.set(r.authorId, e)
      }
      return [...byAuthor.entries()]
        .map(([id, e]) => ({ ...profileCache.get(id)!, ...e }))
        .filter((p) => p.id && p.username !== 'spoolshare')
        .sort((a, b) => b.reproductionsReceived - a.reproductionsReceived || b.recipeCount - a.recipeCount)
        .slice(0, limit)
    },

    // ----------------------------------------------------- moderation --
    async report(input) {
      const me = await uid()
      const row = check(await sb.from('reports').insert({ reporter_id: me, target_type: input.targetType, target_id: input.targetId, reason: input.reason, details: input.details ?? null }).select('*').single()) as Row
      const r: Report = { id: row.id, reporterId: row.reporter_id, targetType: row.target_type, targetId: row.target_id, reason: row.reason, details: row.details ?? undefined, status: row.status, createdAt: row.created_at }
      return r
    },
    async listReports() {
      const rows = check(await sb.from('reports').select('*').order('created_at', { ascending: false })) as Row[]
      return rows.map((row) => ({ id: row.id, reporterId: row.reporter_id, targetType: row.target_type, targetId: row.target_id, reason: row.reason, details: row.details ?? undefined, status: row.status, createdAt: row.created_at }))
    },
    async listMembers() {
      const rows = check(await sb.rpc('admin_list_members')) as Row[]
      const me = await myProfile()
      if (me?.role !== 'admin') throw new Error('Admins only.')
      return rows.map((r): MemberRow => ({
        profile: toProfile(r.profile),
        email: r.email ?? null,
        recipeCount: Number(r.recipe_count),
        reproductionCount: Number(r.reproduction_count),
        lastSignInAt: r.last_sign_in_at ?? null,
      }))
    },

    // -------------------------------------------------- notifications --
    async listNotifications() {
      const { data } = await sb.auth.getSession()
      if (!data.session) return []
      const rows = check(await sb.from('notifications').select('*, recipe:recipes(id, slug, name, result_hex)').eq('user_id', data.session.user.id).order('created_at', { ascending: false }).limit(100)) as Row[]
      const profiles = await profilesFor(rows.map((r) => r.actor_id))
      return rows
        .filter((r) => profiles.get(r.actor_id))
        .map((r): NotificationView => {
          const n: Notification = { id: r.id, userId: r.user_id, kind: r.kind, actorId: r.actor_id, recipeId: r.recipe_id ?? undefined, read: r.read, createdAt: r.created_at }
          return {
            ...n,
            actor: profiles.get(r.actor_id)!,
            recipe: r.recipe ? { id: r.recipe.id, slug: r.recipe.slug, name: r.recipe.name, resultHex: r.recipe.result_hex } : undefined,
          }
        })
    },
    async markNotificationsRead() {
      const me = await uid()
      check(await sb.from('notifications').update({ read: true }).eq('user_id', me).eq('read', false))
    },
  }
}

function toCollection(r: Row): Collection {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    description: r.description ?? undefined,
    isPublic: r.is_public,
    recipeIds: (r.collection_items ?? []).map((i: Row) => i.recipe_id),
    createdAt: r.created_at,
  }
}

export type { ReproductionView }
