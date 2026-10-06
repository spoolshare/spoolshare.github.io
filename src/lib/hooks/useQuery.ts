/**
 * Minimal async data cache (react-query-style) shared by all screens.
 *
 *  - Entries are keyed by string. The key's first ":" segment is its tag
 *    ("recipes:search:{…}" → "recipes").
 *  - Mutations call `invalidate("recipes")` and every mounted query with that tag refetches.
 *  - Stale data stays visible while refetching, so the UI doesn't flash.
 */
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

interface Entry<T = unknown> {
  data?: T
  error?: Error
  status: 'idle' | 'loading' | 'success' | 'error'
  stale: boolean
  tags: string[]
  fetching: boolean
}

const cache = new Map<string, Entry>()
const listeners = new Set<() => void>()
const fetchers = new Map<string, () => Promise<unknown>>()

function emit() {
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

function set(key: string, patch: Partial<Entry>) {
  const prev = cache.get(key) ?? { status: 'idle', stale: true, tags: [], fetching: false }
  cache.set(key, { ...prev, ...patch } as Entry)
}

async function run(key: string) {
  const fetcher = fetchers.get(key)
  const entry = cache.get(key)
  if (!fetcher || entry?.fetching) return
  set(key, { fetching: true, status: entry?.data !== undefined ? 'success' : 'loading' })
  emit()
  try {
    const data = await fetcher()
    set(key, { data, error: undefined, status: 'success', stale: false, fetching: false })
  } catch (e) {
    set(key, { error: e as Error, status: 'error', stale: false, fetching: false })
  }
  emit()
}

export function invalidate(...tags: string[]) {
  const all = tags.length === 0
  for (const [key, entry] of cache) {
    if (all || entry.tags.some((t) => tags.includes(t))) {
      cache.set(key, { ...entry, stale: true })
      if (fetchers.has(key)) void run(key)
    }
  }
  emit()
}

export function setQueryData<T>(key: string, updater: (prev: T | undefined) => T) {
  const prev = cache.get(key) as Entry<T> | undefined
  set(key, { data: updater(prev?.data), status: 'success' })
  emit()
}

export function getQueryData<T>(key: string): T | undefined {
  return cache.get(key)?.data as T | undefined
}

export interface QueryResult<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  /** True while refetching with stale data on screen. */
  fetching: boolean
  refetch: () => void
}

const EMPTY: Entry = { status: 'idle', stale: true, tags: [], fetching: false }

export function useQuery<T>(key: string | null, fetcher: () => Promise<T>, extraTags: string[] = []): QueryResult<T> {
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const entry = useSyncExternalStore(
    subscribe,
    () => (key ? cache.get(key) ?? EMPTY : EMPTY),
    () => EMPTY,
  ) as Entry<T>

  const tagsKey = extraTags.join(',')
  useEffect(() => {
    if (!key) return
    fetchers.set(key, () => fetcherRef.current())
    const tags = [key.split(':')[0], ...(tagsKey ? tagsKey.split(',') : [])]
    const e = cache.get(key)
    if (!e) set(key, { tags, stale: true, status: 'idle', fetching: false })
    else if (e.tags.length === 0) set(key, { tags })
    if (!e || e.stale) void run(key)
  }, [key, tagsKey])

  const refetch = useCallback(() => {
    if (key) void run(key)
  }, [key])

  return {
    data: entry.data,
    error: entry.error,
    loading: !!key && entry.data === undefined && entry.status !== 'error',
    fetching: entry.fetching,
    refetch,
  }
}

/** Wraps an async action with pending/error state. */
export function useMutation<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const fnRef = useRef(fn)
  fnRef.current = fn
  const mutate = useCallback(async (...args: A): Promise<R> => {
    setPending(true)
    setError(null)
    try {
      return await fnRef.current(...args)
    } catch (e) {
      setError(e as Error)
      throw e
    } finally {
      setPending(false)
    }
  }, [])
  return { mutate, pending, error, reset: () => setError(null) }
}
