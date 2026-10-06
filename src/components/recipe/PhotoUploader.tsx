import { useRef, useState } from 'react'
import { Camera, Download, ImagePlus, Lightbulb, Pipette, Star, Trash2 } from 'lucide-react'
import type { Hex, Photo } from '@/types'
import { cn } from '@/lib/utils/cn'
import { uid } from '@/lib/utils/id'
import { downscaleImage, estimateHexFromImage } from '@/lib/color/photo'
import { ColorDot } from '@/components/color/Swatch'
import { Button, IconButton, inputClass } from '@/components/ui'

/**
 * Multi-photo uploader with required alt text and on-image color sampling.
 * The first photo is the cover. Clicking a photo samples its color at that point;
 * `onSampled` lets the parent offer the sampled HEX as the result color.
 */
export function PhotoUploader({
  photos,
  onChange,
  onSampled,
  max = 6,
  className,
  defaultAlt = 'Printed swatch',
}: {
  photos: Photo[]
  onChange: (photos: Photo[]) => void
  onSampled?: (hex: Hex) => void
  max?: number
  className?: string
  defaultAlt?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  const addFiles = async (files: FileList | File[]) => {
    setError(null)
    const list = [...files].filter((f) => f.type.startsWith('image/')).slice(0, max - photos.length)
    if (list.length === 0) return
    setBusy(true)
    try {
      const added: Photo[] = []
      for (const file of list) {
        if (file.size > 25 * 1024 * 1024) throw new Error(`${file.name} is larger than 25 MB.`)
        const { url, width, height } = await downscaleImage(file)
        const sampledHex = await estimateHexFromImage(url)
        added.push({ id: uid('ph'), url, width, height, sampledHex, alt: `${defaultAlt} (${sampledHex})` })
      }
      const next = [...photos, ...added]
      onChange(next)
      if (photos.length === 0 && added[0]?.sampledHex) onSampled?.(added[0].sampledHex)
    } catch (e) {
      setError((e as Error).message || 'Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  const update = (id: string, patch: Partial<Photo>) => onChange(photos.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const sampleAt = async (photo: Photo, e: React.MouseEvent<HTMLImageElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    // object-cover: map the click to image coordinates
    const iw = photo.width ?? r.width
    const ih = photo.height ?? r.height
    const scale = Math.max(r.width / iw, r.height / ih)
    const dx = (iw * scale - r.width) / 2
    const dy = (ih * scale - r.height) / 2
    const x = (e.clientX - r.left + dx) / (iw * scale)
    const y = (e.clientY - r.top + dy) / (ih * scale)
    const hex = await estimateHexFromImage(photo.url, { x, y, radius: 0.06 })
    update(photo.id, { sampledHex: hex })
    onSampled?.(hex)
  }

  return (
    <div className={className}>
      <OfficialSwatchCard className="mb-3" />
      <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-info/20 bg-info-soft p-3 text-sm">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <p className="text-fg">
          For the most accurate result, photograph your swatch in <b>bright, neutral lighting without filters</b>. Daylight
          by a window is ideal; avoid flash and colored LEDs. Put a white sheet of paper in frame for reference.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <figure key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-surface">
            <div className="relative aspect-square">
              <img
                src={p.url}
                alt={p.alt}
                className="size-full cursor-crosshair object-cover"
                onClick={(e) => sampleAt(p, e)}
                title="Click to sample the color at this point"
              />
              {i === 0 && (
                <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white uppercase">
                  <Star className="size-3" aria-hidden /> Cover
                </span>
              )}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                {i > 0 && (
                  <IconButton label="Make cover photo" size="xs" variant="outline" onClick={() => onChange([p, ...photos.filter((x) => x.id !== p.id)])}>
                    <Star className="size-3.5" />
                  </IconButton>
                )}
                <IconButton label="Remove photo" size="xs" variant="outline" onClick={() => onChange(photos.filter((x) => x.id !== p.id))}>
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
              {p.sampledHex && (
                <button
                  type="button"
                  onClick={() => onSampled?.(p.sampledHex!)}
                  className="absolute bottom-2 left-2 inline-flex items-center gap-1.5 rounded-md bg-white/90 px-1.5 py-1 font-mono text-[11px] font-medium text-neutral-800 shadow-sm"
                  title="Use this sampled color as the result HEX"
                >
                  <Pipette className="size-3" aria-hidden />
                  <ColorDot hex={p.sampledHex} size={10} />
                  {p.sampledHex}
                </button>
              )}
            </div>
            <figcaption className="p-2">
              <label className="sr-only" htmlFor={`alt-${p.id}`}>Alt text for photo {i + 1}</label>
              <input
                id={`alt-${p.id}`}
                value={p.alt}
                onChange={(e) => update(p.id, { alt: e.target.value })}
                placeholder="Describe this photo (alt text)"
                className={cn(inputClass, 'h-8 text-xs', !p.alt.trim() && 'border-warn')}
                aria-invalid={!p.alt.trim()}
              />
            </figcaption>
          </figure>
        ))}

        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); void addFiles(e.dataTransfer.files) }}
            className={cn(
              'flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-sm text-fg-muted transition-colors',
              dragOver ? 'border-accent bg-accent-soft text-accent-soft-fg' : 'border-border-strong hover:border-fg-subtle hover:bg-surface-2',
            )}
          >
            {photos.length === 0 ? <Camera className="size-7" aria-hidden /> : <ImagePlus className="size-6" aria-hidden />}
            <span className="font-medium text-fg">{busy ? 'Processing…' : photos.length === 0 ? 'Add swatch photo' : 'Add another'}</span>
            <span className="text-xs">Drop or click · JPG, PNG, HEIC</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
      {photos.length > 0 && (
        <p className="mt-2 text-xs text-fg-muted">
          Tip: click anywhere on a photo to sample the color there. We take a glare-resistant median of the surrounding pixels.
        </p>
      )}
      {photos.length === 0 && onSampled && (
        <div className="mt-3">
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} icon={<Camera className="size-4" />}>Use camera or library</Button>
        </div>
      )}
    </div>
  )
}

const SWATCH_URL = `${import.meta.env.BASE_URL}downloads/SpoolShareSwatch.3mf`

/** Optional standardized test swatch, so everyone photographs the same flat surface. */
export function OfficialSwatchCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border border-border bg-surface-2 p-3 sm:flex-row sm:items-center', className)}>
      <svg viewBox="0 0 48 32" className="h-10 w-14 shrink-0" aria-hidden>
        <rect x="2" y="4" width="44" height="24" rx="4" className="fill-surface-3 stroke-border-strong" strokeWidth="1.5" />
        <rect x="6" y="8" width="16" height="16" rx="2" className="fill-accent" opacity="0.85" />
        <rect x="26" y="8" width="16" height="7" rx="1.5" className="fill-border-strong" />
        <rect x="26" y="17" width="10" height="7" rx="1.5" className="fill-border-strong" />
      </svg>
      <div className="min-w-0 flex-1 text-sm">
        <div className="font-semibold">Official SpoolShare Swatch</div>
        <p className="text-fg-muted">
          A standardized flat test print, so everyone’s photos compare the same surface. <span className="whitespace-nowrap">Optional: any flat print works.</span>
        </p>
      </div>
      <a
        href={SWATCH_URL}
        download="SpoolShareSwatch.3mf"
        className="inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md border border-border-strong bg-surface px-3 text-sm font-medium hover:bg-surface-3"
      >
        <Download className="size-4" aria-hidden /> Download 3MF
      </a>
    </div>
  )
}
