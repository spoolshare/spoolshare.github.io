import type { Hex } from '@/types'
import { cn } from '@/lib/utils/cn'
import { isVeryLight, readableOn } from '@/lib/color/convert'

export interface SlotItem {
  name: string
  hex: Hex
}

/**
 * The mixer's 4 AMS slots, left to right, each filled with a filament.
 * Every slot shows its number and name, so the color is never the only cue.
 */
export function SlotStrip({ slots, size = 'md', className }: { slots: SlotItem[]; size?: 'sm' | 'md'; className?: string }) {
  return (
    <ol className={cn('grid grid-cols-4 gap-1.5', className)} aria-label="AMS slots, in order">
      {slots.map((s, i) => (
        <li
          key={i}
          className={cn(
            'flex min-w-0 flex-col justify-between rounded-lg px-2 py-1.5',
            size === 'md' ? 'h-16' : 'h-11',
            isVeryLight(s.hex) && 'ring-1 ring-border-strong ring-inset',
          )}
          style={{ background: s.hex, color: readableOn(s.hex) }}
        >
          <span className="text-[10px] font-semibold tracking-wide uppercase opacity-70">Slot {i + 1}</span>
          <span className={cn('truncate font-medium', size === 'md' ? 'text-xs' : 'text-[11px]')} title={s.name}>{s.name}</span>
        </li>
      ))}
    </ol>
  )
}
