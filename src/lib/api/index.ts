/**
 * Backend selection. The app runs on the mock adapter unless Supabase
 * credentials are configured (see .env.example and supabase/README.md).
 *
 * Only *public* configuration belongs in VITE_ variables. The Supabase anon
 * key is public by design; Row-Level Security policies protect the data.
 */
import type { SpoolShareApi } from './types'
import { createMockApi } from './mock/adapter'

export * from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function createApi(): SpoolShareApi {
  if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    // TODO(supabase): return createSupabaseApi({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY })
    console.info('[spoolshare] Supabase env vars detected, but the Supabase adapter is not wired up yet. Using mock data.')
  }
  return createMockApi()
}

export const api: SpoolShareApi = createApi()
