/**
 * In-browser mock database: seeded on first visit, persisted to localStorage.
 * Shaped like the relational schema in supabase/schema.sql.
 */
import type {
  Collection, Comment, Filament, Follow, InventoryItem, Manufacturer, Notification, ProductLine, Profile, Recipe,
  Report, Reproduction,
} from '@/types'
import { filaments, manufacturers, productLines } from './seed/catalog'
import {
  DEMO_USER_ID, comments, demoCollections, demoInventory, demoNotifications, follows, profiles, recipes, reproductions,
} from './seed/community'

export interface Account {
  email: string
  /** Mock only: not real security. Real auth lives in Supabase. */
  passwordDigest: string
  profileId: string
}

export interface DB {
  version: number
  manufacturers: Manufacturer[]
  productLines: ProductLine[]
  filaments: Filament[]
  profiles: Profile[]
  accounts: Account[]
  inventory: InventoryItem[]
  recipes: Recipe[]
  reproductions: Reproduction[]
  comments: Comment[]
  favorites: { userId: string; recipeId: string; createdAt: string }[]
  collections: Collection[]
  follows: Follow[]
  reports: Report[]
  notifications: Notification[]
  session: { profileId: string } | null
}

const KEY = 'spoolshare:db'
const VERSION = 4

export function digest(password: string): string {
  let h = 5381
  for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i)
  return `mock$${(h >>> 0).toString(36)}`
}

function seed(): DB {
  const now = new Date().toISOString()
  return {
    version: VERSION,
    manufacturers,
    productLines,
    filaments,
    profiles,
    accounts: [{ email: 'demo@spoolshare.app', passwordDigest: digest('demo'), profileId: DEMO_USER_ID }],
    inventory: demoInventory.map((filamentId, i) => ({
      id: `inv-${i}`,
      userId: DEMO_USER_ID,
      filamentId,
      spools: 1,
      remainingGrams: [1000, 820, 640, 900, 450, 1000, 700, 300, 950, 600, 880, 400][i % 12],
      addedAt: now,
    })),
    recipes,
    reproductions,
    comments,
    favorites: [
      { userId: DEMO_USER_ID, recipeId: 'r-dusty-lavender', createdAt: now },
      { userId: DEMO_USER_ID, recipeId: 'r-mint-chip', createdAt: now },
      { userId: DEMO_USER_ID, recipeId: 'r-sakura-milk', createdAt: now },
      { userId: DEMO_USER_ID, recipeId: 'r-storm-cloud', createdAt: now },
    ],
    collections: demoCollections,
    follows: [...follows, { followerId: DEMO_USER_ID, followeeId: 'u-kenji', createdAt: now }],
    reports: [],
    notifications: demoNotifications,
    // First visit: start in the demo account so the inventory-aware features are visible immediately.
    session: { profileId: DEMO_USER_ID },
  }
}

let db: DB | null = null

export function getDb(): DB {
  if (db) return db
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DB
      if (parsed.version === VERSION) {
        db = parsed
        return db
      }
    }
  } catch {
    /* corrupted or unavailable storage: fall through to a fresh seed */
  }
  db = seed()
  persist()
  return db
}

let persistTimer: ReturnType<typeof setTimeout> | null = null
export function persist() {
  if (persistTimer) clearTimeout(persistTimer)
  persistTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(db))
    } catch (e) {
      console.warn('[spoolshare] Could not persist mock DB (storage full?)', e)
    }
  }, 50)
}

export function resetDb() {
  db = seed()
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    /* ignore */
  }
}
