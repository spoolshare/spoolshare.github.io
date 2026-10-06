import { twMerge } from 'tailwind-merge'

type ClassValue = string | number | bigint | boolean | null | undefined | ClassValue[] | Record<string, boolean | undefined>

/**
 * className joiner (clsx-style) with Tailwind conflict resolution, so a
 * `className` prop can reliably override a component's defaults (last wins).
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = []
  const walk = (v: ClassValue) => {
    if (!v || v === true) return
    if (typeof v === 'string' || typeof v === 'number' || typeof v === 'bigint') out.push(String(v))
    else if (Array.isArray(v)) v.forEach(walk)
    else for (const [k, on] of Object.entries(v)) if (on) out.push(k)
  }
  values.forEach(walk)
  return twMerge(out.join(' '))
}
