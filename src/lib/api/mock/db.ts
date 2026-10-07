/**
 * In-browser mock database: seeded on first visit, persisted to localStorage.
 * Shaped like the relational schema in supabase/schema.sql.
 */
import type {
  Collection, Comment, Filament, Follow, InventoryItem, Manufacturer, Notification, ProductLine, Profile, Recipe,
  Report, Reproduction,
} from '@/types'
import { filaments, manufacturers, productLines } from './seed/catalog'
import { collections, comments, follows, notifications, profiles, recipes, reproductions } from './seed/community'

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
const VERSION = 7

export function digest(password: string): string {
  let h = 5381
  for (let i = 0; i < password.length; i++) h = (h * 33) ^ password.charCodeAt(i)
  return `mock$${(h >>> 0).toString(36)}`
}

function seed(): DB {
  return {
    version: VERSION,
    manufacturers,
    productLines,
    filaments,
    profiles,
    accounts: [],
    inventory: [],
    recipes,
    reproductions,
    comments,
    favorites: [],
    collections,
    follows,
    reports: [],
    notifications,
    // Signed out: create an account (stored only in this browser) to try signed-in features.
    session: null,
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
