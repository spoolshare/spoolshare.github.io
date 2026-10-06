import { useState, type CSSProperties } from 'react'
import { Check, Copy } from 'lucide-react'
import type { Finish, Hex, Photo } from '@/types'
import { cn } from '@/lib/utils/cn'
import { isVeryLight, readableOn, shade } from '@/lib/color/convert'

/** A filled color circle. Light colors get a hairline border so they never vanish on white. */
export function ColorDot({
  hex,
  size = 16,
  className,
  label,
  ring,
}: {
  hex: Hex
  size?: number
  className?: string
  label?: string
  ring?: boolean
}) {
  return (
    <span
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label ?? hex}
      className={cn(
        'color-transition inline-block shrink-0 rounded-full',
        isVeryLight(hex) ? 'shadow-[inset_0_0_0_1px_var(--border-strong)]' : 'shadow-[inset_0_0_0_1px_rgb(0_0_0/0.08)]',
        ring && 'ring-2 ring-surface',
        className,
      )}
      style={{ background: hex, width: size, height: size }}
    />
  )
}

/** HEX code in mono type with a copy-to-clipboard button. */
export function HexChip({ hex, className, size = 'sm', showDot = true }: { hex: Hex; className?: string; size?: 'xs' | 'sm' | 'md'; showDot?: boolean }) {
  const [copied, setCopied] = useState(false)
  const copy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(hex)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${hex}`}
      aria-label={copied ? `Copied ${hex}` : `Copy HEX ${hex}`}
      className={cn(
        'group/hex inline-flex items-center gap-1.5 rounded-md border border-border bg-surface font-mono font-medium text-fg tabular transition-colors hover:border-border-strong hover:bg-surface-2',
        size === 'xs' && 'h-6 px-1.5 text-[11px]',
        size === 'sm' && 'h-7 px-2 text-xs',
        size === 'md' && 'h-9 px-3 text-sm',
        className,
      )}
    >
      {showDot && <ColorDot hex={hex} size={size === 'md' ? 14 : 10} />}
      {hex}
      {copied ? (
        <Check className="size-3 text-accent" aria-hidden />
      ) : (
        <Copy className="size-3 text-fg-subtle opacity-60 group-hover/hex:opacity-100" aria-hidden />
      )}
    </button>
  )
}

/**
 * The swatch "photograph". If a real photo exists we show it. Otherwise we
 * render a stylized printed test plaque: layer lines, soft studio lighting,
 * and a finish-dependent sheen. The badge always says when no photo exists,
 * so a rendering is never passed off as a real photo.
 */
export function SwatchVisual({
  hex,
  photo,
  finish = 'basic',
  className,
  label,
  showPhotoState = false,
  rounded = 'rounded-xl',
  style,
}: {
  hex: Hex
  photo?: Photo
  finish?: Finish
  className?: string
  label?: string
  showPhotoState?: boolean
  rounded?: string
  style?: CSSProperties
}) {
  if (photo) {
    return (
      <div className={cn('relative overflow-hidden bg-surface-2', rounded, className)} style={style}>
        <img src={photo.url} alt={photo.alt} className="size-full object-cover" loading="lazy" />
      </div>
    )
  }
  const hi = shade(hex, 9)
  const lo = shade(hex, -12)
  const sheen =
    finish === 'silk' || finish === 'metallic'
      ? `linear-gradient(115deg, transparent 20%, rgb(255 255 255 / 0.38) 42%, transparent 55%, rgb(255 255 255 / 0.18) 70%, transparent 82%)`
      : finish === 'matte'
        ? `linear-gradient(160deg, rgb(255 255 255 / 0.06), transparent 60%)`
        : `linear-gradient(150deg, rgb(255 255 255 / 0.22), transparent 45%)`
  const text = readableOn(hex)
  return (
    <div
      role="img"
      aria-label={label ?? `Rendered swatch, color ${hex}`}
      className={cn('color-transition relative isolate overflow-hidden', rounded, className)}
      style={{ background: `radial-gradient(120% 90% at 30% 20%, ${hi}, ${hex} 45%, ${lo})`, ...style }}
    >
      {/* layer lines */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.14] mix-blend-multiply"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgb(0 0 0 / 0.55) 0 1px, transparent 1px 3px)' }}
      />
      {/* finish sheen */}
      <div aria-hidden className="absolute inset-0" style={{ backgroundImage: sheen }} />
      {finish === 'sparkle' || finish === 'metallic' ? (
        <div
          aria-hidden
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 0.5px, transparent 1px), radial-gradient(circle at 70% 60%, white 0.5px, transparent 1px), radial-gradient(circle at 40% 80%, white 0.5px, transparent 1px)',
            backgroundSize: '23px 19px, 31px 27px, 17px 29px',
          }}
        />
      ) : null}
      {/* edge vignette */}
      <div aria-hidden className="absolute inset-0 shadow-[inset_0_0_40px_rgb(0_0_0/0.18)]" />
      {showPhotoState && (
        <span
          className="absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase backdrop-blur-sm"
          style={{ color: text, background: text === '#000000' ? 'rgb(255 255 255 / 0.35)' : 'rgb(0 0 0 / 0.25)' }}
        >
          Color render · no photo yet
        </span>
      )}
    </div>
  )
}
