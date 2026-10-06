import { useEffect, useMemo, useRef, useState } from 'react'
import { Pipette, Search } from 'lucide-react'
import type { Hex } from '@/types'
import { cn } from '@/lib/utils/cn'
import { hexToHsv, hexToRgb, hsvToHex, normalizeHex, rgbToHex, type HSV } from '@/lib/color/convert'
import { nearestColorName, searchColorNames } from '@/lib/color/names'
import { useRecentColors } from '@/lib/hooks/usePreferences'
import { ColorDot } from './Swatch'
import { inputClass, SegmentedControl } from '@/components/ui/form'

type Mode = 'hex' | 'rgb' | 'name'

/**
 * Full-featured target-color picker: saturation/value plane, hue rail,
 * HEX / RGB / name entry, the EyeDropper API where supported, and recent colors.
 */
export function ColorPicker({
  value,
  onChange,
  className,
  compact,
  showModes = true,
}: {
  value: Hex
  onChange: (hex: Hex) => void
  className?: string
  compact?: boolean
  showModes?: boolean
}) {
  const [hsv, setHsv] = useState<HSV>(() => hexToHsv(value))
  const lastEmitted = useRef(value)
  const [mode, setMode] = useState<Mode>('hex')
  const recent = useRecentColors()

  // Sync from outside without losing hue when saturation hits 0.
  useEffect(() => {
    if (value !== lastEmitted.current) {
      const next = hexToHsv(value)
      setHsv((prev) => ({ ...next, h: next.s === 0 ? prev.h : next.h }))
      lastEmitted.current = value
    }
  }, [value])

  const emit = (next: HSV) => {
    setHsv(next)
    const hex = hsvToHex(next)
    lastEmitted.current = hex
    onChange(hex)
  }

  const commit = (hex: Hex) => {
    recent.push(hex)
  }

  const eyedropper = typeof window !== 'undefined' && 'EyeDropper' in window
  const pickFromScreen = async () => {
    try {
      // @ts-expect-error EyeDropper is not yet in lib.dom
      const res = await new window.EyeDropper().open()
      const hex = normalizeHex(res.sRGBHex)
      if (hex) {
        onChange(hex)
        commit(hex)
      }
    } catch {
      /* cancelled */
    }
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <SVPlane hsv={hsv} onChange={emit} onCommit={() => commit(hsvToHex(hsv))} height={compact ? 140 : 180} />
      <HueRail hue={hsv.h} onChange={(h) => emit({ ...hsv, h })} onCommit={() => commit(hsvToHex(hsv))} />

      {showModes && (
        <div className="flex items-center gap-2">
          <SegmentedControl
            label="Color input mode"
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'hex', label: 'HEX' },
              { value: 'rgb', label: 'RGB' },
              { value: 'name', label: 'Name' },
            ]}
            className="flex-1"
          />
          {eyedropper && (
            <button
              type="button"
              onClick={pickFromScreen}
              className="grid size-8 place-items-center rounded-lg border border-border text-fg-muted hover:bg-surface-2 hover:text-fg"
              aria-label="Pick a color from the screen"
              title="Pick from screen"
            >
              <Pipette className="size-4" />
            </button>
          )}
        </div>
      )}

      {mode === 'hex' && <HexInput value={value} onChange={(h) => { onChange(h); commit(h) }} />}
      {mode === 'rgb' && <RgbInputs value={value} onChange={(h) => { onChange(h); commit(h) }} />}
      {mode === 'name' && <NameSearch onPick={(h) => { onChange(h); commit(h) }} />}

      {recent.colors.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Recent colors">
          <span className="mr-1 text-xs text-fg-subtle">Recent</span>
          {recent.colors.slice(0, 8).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange(c)}
              className="rounded-full transition-transform hover:scale-110 focus-visible:scale-110"
              aria-label={`Use recent color ${c}`}
            >
              <ColorDot hex={c} size={20} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function useDrag(onMove: (x: number, y: number) => void, onEnd?: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  const handle = (e: React.PointerEvent) => {
    const el = ref.current!
    el.setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent | React.PointerEvent) => {
      const r = el.getBoundingClientRect()
      onMove(Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (ev.clientY - r.top) / r.height)))
    }
    move(e)
    const up = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      onEnd?.()
    }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
  }
  return { ref, onPointerDown: handle }
}

function SVPlane({ hsv, onChange, onCommit, height }: { hsv: HSV; onChange: (h: HSV) => void; onCommit: () => void; height: number }) {
  const drag = useDrag((x, y) => onChange({ ...hsv, s: x, v: 1 - y }), onCommit)
  const onKey = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02
    const m: Record<string, Partial<HSV>> = {
      ArrowRight: { s: Math.min(1, hsv.s + step) },
      ArrowLeft: { s: Math.max(0, hsv.s - step) },
      ArrowUp: { v: Math.min(1, hsv.v + step) },
      ArrowDown: { v: Math.max(0, hsv.v - step) },
    }
    if (m[e.key]) {
      e.preventDefault()
      onChange({ ...hsv, ...m[e.key] })
    }
  }
  return (
    <div
      {...drag}
      role="slider"
      tabIndex={0}
      aria-label="Saturation and brightness"
      aria-valuetext={`Saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`}
      onKeyDown={onKey}
      onKeyUp={onCommit}
      className="relative w-full cursor-crosshair touch-none rounded-lg"
      style={{
        height,
        background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, hsl(${hsv.h} 100% 50%))`,
      }}
    >
      <span
        className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.3)]"
        style={{ left: `${hsv.s * 100}%`, top: `${(1 - hsv.v) * 100}%`, background: hsvToHex(hsv) }}
      />
    </div>
  )
}

function HueRail({ hue, onChange, onCommit }: { hue: number; onChange: (h: number) => void; onCommit: () => void }) {
  const drag = useDrag((x) => onChange(x * 359.9), onCommit)
  return (
    <div
      {...drag}
      role="slider"
      tabIndex={0}
      aria-label="Hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={Math.round(hue)}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 15 : 3
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); onChange((hue + step) % 360) }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); onChange((hue - step + 360) % 360) }
      }}
      onKeyUp={onCommit}
      className="relative h-3.5 w-full cursor-pointer touch-none rounded-full"
      style={{ background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)' }}
    >
      <span
        className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1px_rgb(0_0_0/0.3),0_2px_6px_rgb(0_0_0/0.3)]"
        style={{ left: `${(hue / 360) * 100}%`, background: `hsl(${hue} 100% 50%)` }}
      />
    </div>
  )
}

export function HexInput({ value, onChange, className, id }: { value: Hex; onChange: (h: Hex) => void; className?: string; id?: string }) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  const valid = !!normalizeHex(text)
  const apply = () => {
    const h = normalizeHex(text)
    if (h) onChange(h)
    else setText(value)
  }
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <ColorDot hex={valid ? normalizeHex(text)! : value} size={36} className="rounded-lg!" />
      <div className="relative flex-1">
        <input
          id={id}
          aria-label="HEX color code"
          aria-invalid={!valid}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            const h = normalizeHex(e.target.value)
            if (h && e.target.value.replace('#', '').length === 6) onChange(h)
          }}
          onBlur={apply}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
          spellCheck={false}
          className={cn(inputClass, 'h-9 font-mono uppercase tabular')}
          placeholder="#C1AAD6"
        />
      </div>
      <span className="hidden max-w-28 truncate text-xs text-fg-muted sm:block" title="Nearest color name">
        ≈ {nearestColorName(value)}
      </span>
    </div>
  )
}

function RgbInputs({ value, onChange }: { value: Hex; onChange: (h: Hex) => void }) {
  const rgb = hexToRgb(value)
  const set = (k: 'r' | 'g' | 'b', v: string) => {
    const n = Math.max(0, Math.min(255, Math.round(Number(v) || 0)))
    onChange(rgbToHex({ ...rgb, [k]: n }))
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {(['r', 'g', 'b'] as const).map((k) => (
        <label key={k} className="relative">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 font-mono text-xs font-semibold text-fg-subtle uppercase">{k}</span>
          <input
            type="number"
            min={0}
            max={255}
            aria-label={{ r: 'Red', g: 'Green', b: 'Blue' }[k]}
            value={rgb[k]}
            onChange={(e) => set(k, e.target.value)}
            className={cn(inputClass, 'h-9 pl-7 font-mono tabular')}
          />
        </label>
      ))}
    </div>
  )
}

function NameSearch({ onPick }: { onPick: (h: Hex) => void }) {
  const [q, setQ] = useState('')
  const results = useMemo(() => searchColorNames(q, 12), [q])
  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="lavender, sage, terracotta…"
          aria-label="Search color names"
          className={cn(inputClass, 'h-9 pl-9')}
          onKeyDown={(e) => e.key === 'Enter' && results[0] && onPick(results[0].hex)}
        />
      </div>
      {q && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {results.length === 0 && <p className="text-xs text-fg-muted">No named colors match “{q}”.</p>}
          {results.map((r) => (
            <button
              key={r.name}
              type="button"
              onClick={() => onPick(r.hex)}
              className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 text-xs font-medium hover:border-border-strong"
            >
              <ColorDot hex={r.hex} size={12} />
              {r.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
