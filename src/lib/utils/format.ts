export function formatGrams(g: number): string {
  if (!Number.isFinite(g)) return '—'
  if (g >= 1000) return `${(g / 1000).toFixed(g >= 10000 ? 1 : 2)} kg`
  if (g >= 100) return `${Math.round(g)} g`
  if (g >= 10) return `${g.toFixed(1).replace(/\.0$/, '')} g`
  return `${g.toFixed(g < 1 ? 3 : 2).replace(/0+$/, '').replace(/\.$/, '')} g`
}

export function formatPercent(fraction: number, digits?: number): string {
  const p = fraction * 100
  const d = digits ?? (Math.abs(p - Math.round(p)) < 1e-9 ? 0 : 2)
  const s = p.toFixed(d)
  return `${s.includes('.') ? s.replace(/\.?0+$/, '') : s}%`
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
export function timeAgo(iso: string, now = Date.now()): string {
  const diff = (Date.parse(iso) - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return 'just now'
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return rtf.format(Math.round(diff / 86400), 'day')
  if (abs < 86400 * 365) return rtf.format(Math.round(diff / (86400 * 30)), 'month')
  return rtf.format(Math.round(diff / (86400 * 365)), 'year')
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}
