/**
 * Backend selection. The app runs on the mock adapter unless Supabase
 * credentials are configured (see .env.example and supabase/README.md).
 *
 * Only *public* configuration belongs in VITE_ variables. The Supabase anon
 * key is public by design; Row-Level Security policies protect the data.
 */
import type { SpoolShareApi } from './types'
import { createMockApi } from './mock/adapter'
import { createSupabaseApi } from './supabase/adapter'

export * from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

function createApi(): SpoolShareApi {
  // `?backend=mock` forces the local demo (handy for testing without touching real data).
  let forceMock = false
  try {
    const param = new URLSearchParams(window.location.search).get('backend')
    if (param) sessionStorage.setItem('spoolshare:backend', param)
    forceMock = sessionStorage.getItem('spoolshare:backend') === 'mock'
  } catch {
    /* no window/storage */
  }
  if (SUPABASE_URL && SUPABASE_ANON_KEY && !forceMock) {
    return createSupabaseApi({ url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY })
  }
  return createMockApi()
}

export const api: SpoolShareApi = createApi()
