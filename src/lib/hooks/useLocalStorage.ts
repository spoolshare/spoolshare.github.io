import { useCallback, useEffect, useState } from 'react'

const EVENT = 'spoolshare:storage'

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }))
}

/** localStorage-backed state, synced across components and tabs. */
export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStorage(key, fallback))

  useEffect(() => {
    const onChange = (e: Event) => {
      const k = e instanceof StorageEvent ? e.key : (e as CustomEvent).detail
      if (k === key) setValue(readStorage(key, fallback))
    }
    window.addEventListener(EVENT, onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener(EVENT, onChange)
      window.removeEventListener('storage', onChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(readStorage(key, fallback)) : next
      writeStorage(key, resolved)
      setValue(resolved)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  return [value, update] as const
}
