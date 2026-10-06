import { useRef, useState, type ReactNode } from 'react'
import { MoveHorizontal } from 'lucide-react'
import type { Hex } from '@/types'
import { cn } from '@/lib/utils/cn'
import { DELTA_BAND_LABEL, deltaBand, deltaE, matchScore, type DeltaBand } from '@/lib/color/deltaE'
import { readableOn } from '@/lib/color/convert'

/** Draggable before/after slider between two colors (or any two nodes). */
export function CompareSlider({
  left,
  right,
  leftLabel,
  rightLabel,
  className,
  height = 220,
}: {
  left: Hex | ReactNode
  right: Hex | ReactNode
  leftLabel: string
  rightLabel: string
  className?: string
  height?: number
}) {
  const [pos, setPos] = useState(50)
  const ref = useRef<HTMLDivElement>(null)
  const fill = (v: Hex | ReactNode) =>
    typeof v === 'string' ? <div className="color-transition size-full" style={{ background: v }} /> : v
  const update = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect()
    setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  const labelStyle = (v: Hex | ReactNode) =>
    typeof v === 'string' ? { color: readableOn(v), background: readableOn(v) === '#000000' ? 'rgb(255 255 255 / .45)' : 'rgb(0 0 0 / .3)' } : { color: '#fff', background: 'rgb(0 0 0 / .4)' }

  return (
    <div
      ref={ref}
      className={cn('relative w-full touch-none overflow-hidden rounded-xl border border-border select-none', className)}
      style={{ height }}
      onPointerDown={(e) => {
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        update(e.clientX)
      }}
      onPointerMove={(e) => e.buttons === 1 && update(e.clientX)}
    >
      <div className="absolute inset-0">{fill(right)}</div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {fill(left)}
      </div>
      <span className="absolute top-2 left-2 rounded-md px-2 py-0.5 text-xs font-medium backdrop-blur-sm" style={labelStyle(left)}>{leftLabel}</span>
      <span className="absolute top-2 right-2 rounded-md px-2 py-0.5 text-xs font-medium backdrop-blur-sm" style={labelStyle(right)}>{rightLabel}</span>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" style={{ left: `${pos}%` }} />
      <button
        type="button"
        role="slider"
        aria-label={`Compare ${leftLabel} and ${rightLabel}`}
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') setPos((p) => Math.max(0, p - 5))
          if (e.key === 'ArrowRight') setPos((p) => Math.min(100, p + 5))
        }}
        className="absolute top-1/2 grid size-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-black/10 bg-white text-neutral-700 shadow-md"
        style={{ left: `${pos}%` }}
      >
        <MoveHorizontal className="size-4" />
      </button>
    </div>
  )
}

const bandTone: Record<DeltaBand, string> = {
  identical: 'text-accent',
  close: 'text-accent',
  noticeable: 'text-warn',
  different: 'text-danger',
}
const bandBar: Record<DeltaBand, string> = {
  identical: 'bg-accent',
  close: 'bg-accent',
  noticeable: 'bg-warn',
  different: 'bg-danger',
}

/** ΔE00 shown as a number, a text band, and a bar: never color alone. */
export function DeltaEMeter({ a, b, value, className, compact }: { a?: Hex; b?: Hex; value?: number; className?: string; compact?: boolean }) {
  const dE = value ?? deltaE(a!, b!)
  const band = deltaBand(dE)
  if (compact) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular', bandTone[band], className)} title={`${DELTA_BAND_LABEL[band]}: ΔE00 ${dE.toFixed(1)}`}>
        ΔE {dE.toFixed(1)}
      </span>
    )
  }
  return (
    <div className={cn('min-w-0', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn('text-sm font-semibold', bandTone[band])}>{DELTA_BAND_LABEL[band]}</span>
        <span className="font-mono text-xs text-fg-muted tabular">ΔE00 {dE.toFixed(2)}</span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3" aria-hidden>
        <div className={cn('h-full rounded-full transition-all duration-500', bandBar[band])} style={{ width: `${Math.max(4, matchScore(dE))}%` }} />
      </div>
    </div>
  )
}

/** Two colors side by side with labels and HEX. Used for target vs. actual. */
export function ColorPair({ a, b, aLabel, bLabel, className }: { a: Hex; b: Hex; aLabel: string; bLabel: string; className?: string }) {
  return (
    <div className={cn('flex overflow-hidden rounded-lg border border-border', className)}>
      {[{ hex: a, label: aLabel }, { hex: b, label: bLabel }].map((x) => (
        <div key={x.label} className="color-transition flex flex-1 flex-col justify-end p-2" style={{ background: x.hex, color: readableOn(x.hex) }}>
          <span className="text-[10px] font-semibold tracking-wide uppercase opacity-80">{x.label}</span>
          <span className="font-mono text-xs">{x.hex}</span>
        </div>
      ))}
    </div>
  )
}
