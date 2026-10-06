import type { FilamentView, Hex } from '@/types'
import { cn } from '@/lib/utils/cn'
import { shade } from '@/lib/color/convert'
import { ColorDot } from '@/components/color/Swatch'

/** Front view of a spool: filament winding in the given color, neutral flange, hub. */
export function SpoolIcon({ hex, size = 40, className, fill = 1 }: { hex: Hex; size?: number; className?: string; fill?: number }) {
  const outer = 46
  const hub = 15
  const r = hub + (outer - hub) * Math.max(0.15, Math.min(1, fill))
  const dark = shade(hex, -14)
  const light = shade(hex, 10)
  const id = `g${hex.slice(1)}`
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <radialGradient id={id} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={light} />
          <stop offset="60%" stopColor={hex} />
          <stop offset="100%" stopColor={dark} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="49" fill="var(--surface-3)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r={r} fill={`url(#${id})`} />
      {/* winding texture */}
      {[0.35, 0.55, 0.75, 0.92].map((t) => (
        <circle key={t} cx="50" cy="50" r={hub + (r - hub) * t} fill="none" stroke="rgb(0 0 0 / 0.1)" strokeWidth="0.8" />
      ))}
      <circle cx="50" cy="50" r={hub} fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="5" fill="var(--surface-3)" />
      {[0, 120, 240].map((a) => (
        <circle key={a} cx={50 + 10 * Math.cos((a * Math.PI) / 180)} cy={50 + 10 * Math.sin((a * Math.PI) / 180)} r="2" fill="var(--surface-3)" />
      ))}
    </svg>
  )
}

export function filamentLabel(f: Pick<FilamentView, 'manufacturer' | 'productLine' | 'colorName'>, opts?: { short?: boolean }) {
  return opts?.short ? `${f.productLine.name} ${f.colorName}` : `${f.manufacturer.name} ${f.productLine.name} ${f.colorName}`
}

/** Stacked text label for a filament: color name, then brand and line. */
export function FilamentName({ filament, className, showHex = false }: { filament: FilamentView; className?: string; showHex?: boolean }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="truncate text-sm font-medium text-fg">{filament.colorName}</div>
      <div className="truncate text-xs text-fg-muted">
        {filament.manufacturer.name} · {filament.productLine.name}
        {showHex && <span className="font-mono"> · {filament.hex}</span>}
      </div>
    </div>
  )
}

/** Overlapping colored circles representing a recipe's ingredients. */
export function FilamentDots({
  filaments,
  size = 18,
  max = 6,
  owned,
  className,
}: {
  filaments: Pick<FilamentView, 'id' | 'hex' | 'colorName'>[]
  size?: number
  max?: number
  owned?: Set<string>
  className?: string
}) {
  const shown = filaments.slice(0, max)
  const extra = filaments.length - shown.length
  return (
    <div className={cn('flex items-center', className)} aria-label={`Ingredients: ${filaments.map((f) => f.colorName).join(', ')}`}>
      {shown.map((f, i) => (
        <span key={f.id} className="relative" style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: shown.length - i }}>
          <ColorDot hex={f.hex} size={size} ring label={f.colorName} />
          {owned && !owned.has(f.id) && (
            <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-warn ring-2 ring-surface" title={`Missing ${f.colorName}`} />
          )}
        </span>
      ))}
      {extra > 0 && <span className="ml-1 text-xs text-fg-muted">+{extra}</span>}
    </div>
  )
}
