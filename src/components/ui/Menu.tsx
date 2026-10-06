import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface MenuItem {
  label: ReactNode
  icon?: ReactNode
  onSelect?: () => void
  href?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

/** Accessible dropdown menu: arrow keys, Escape, Home/End, and click-outside. */
export function Menu({
  trigger,
  items,
  align = 'end',
  header,
  className,
  label,
}: {
  trigger: (props: { ref: React.Ref<HTMLButtonElement>; onClick: () => void; 'aria-expanded': boolean; 'aria-haspopup': 'menu'; 'aria-controls': string }) => ReactNode
  items: MenuItem[]
  align?: 'start' | 'end'
  header?: ReactNode
  className?: string
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const first = menuRef.current?.querySelector<HTMLElement>('[role=menuitem]:not([disabled])')
    first?.focus()
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node) && !btnRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const onKeyDown = (e: React.KeyboardEvent) => {
    const els = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role=menuitem]:not([disabled])') ?? [])]
    const i = els.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); els[(i + 1) % els.length]?.focus() }
    else if (e.key === 'ArrowUp') { e.preventDefault(); els[(i - 1 + els.length) % els.length]?.focus() }
    else if (e.key === 'Home') { e.preventDefault(); els[0]?.focus() }
    else if (e.key === 'End') { e.preventDefault(); els[els.length - 1]?.focus() }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); btnRef.current?.focus() }
  }

  return (
    <div className="relative">
      {trigger({ ref: btnRef, onClick: () => setOpen((o) => !o), 'aria-expanded': open, 'aria-haspopup': 'menu', 'aria-controls': id })}
      {open && (
        <div
          ref={menuRef}
          id={id}
          role="menu"
          aria-label={label}
          onKeyDown={onKeyDown}
          className={cn(
            'absolute z-50 mt-2 min-w-52 animate-pop overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg',
            align === 'end' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            className,
          )}
        >
          {header && <div className="border-b border-border px-3 py-2.5">{header}</div>}
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} role="separator" className="my-1 h-px bg-border" />
            ) : (
              <button
                key={i}
                role="menuitem"
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false)
                  item.onSelect?.()
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none',
                  'hover:bg-surface-2 focus-visible:bg-surface-2 disabled:opacity-50',
                  item.danger ? 'text-danger' : 'text-fg',
                )}
              >
                {item.icon && <span className="flex size-4 text-fg-subtle">{item.icon}</span>}
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  )
}
