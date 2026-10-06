/**
 * Dialog and Sheet are built on the native <dialog> element, which gives us a
 * focus trap, Escape-to-close, inert background, and correct a11y semantics for free.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { IconButton } from './Button'

interface BaseProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  className?: string
  /** Hide the visible title (still announced to screen readers). */
  hideTitle?: boolean
}

function useNativeDialog(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) {
      d.showModal()
      document.documentElement.style.overflow = 'hidden'
    } else if (!open && d.open) {
      d.close()
    }
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [open])
  useEffect(() => {
    const d = ref.current
    if (!d) return
    const onCancel = (e: Event) => {
      e.preventDefault()
      onClose()
    }
    const onClick = (e: MouseEvent) => {
      if (e.target === d) onClose() // backdrop click
    }
    d.addEventListener('cancel', onCancel)
    d.addEventListener('click', onClick)
    return () => {
      d.removeEventListener('cancel', onCancel)
      d.removeEventListener('click', onClick)
    }
  }, [onClose])
  return ref
}

export function Dialog({ open, onClose, title, description, children, footer, className, hideTitle, size = 'md' }: BaseProps & { size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const ref = useNativeDialog(open, onClose)
  return (
    <dialog
      ref={ref}
      aria-labelledby="dialog-title"
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-2xl border border-border bg-surface p-0 text-fg shadow-lg backdrop:bg-black/40 backdrop:backdrop-blur-[2px] open:animate-pop',
        size === 'sm' && 'max-w-sm',
        size === 'md' && 'max-w-lg',
        size === 'lg' && 'max-w-2xl',
        size === 'xl' && 'max-w-4xl',
        className,
      )}
    >
      {open && (
        <div className="flex max-h-[85dvh] flex-col">
          {(title || !hideTitle) && (
            <div className={cn('flex items-start justify-between gap-4 px-5 pt-5 pb-3', hideTitle && 'sr-only')}>
              <div>
                <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">{title}</h2>
                {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
              </div>
              <IconButton label="Close" size="sm" onClick={onClose} className="-mt-1 -mr-1">
                <X className="size-4" />
              </IconButton>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

/**
 * Side panel on desktop and bottom sheet on mobile, from one component.
 * `side="responsive"` slides from the right at ≥ md and from the bottom below.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  side = 'responsive',
  headerActions,
}: BaseProps & { side?: 'right' | 'bottom' | 'responsive'; headerActions?: ReactNode }) {
  const ref = useNativeDialog(open, onClose)
  const [isDesktop, setDesktop] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const on = () => setDesktop(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  const effective = side === 'responsive' ? (isDesktop ? 'right' : 'bottom') : side

  return (
    <dialog
      ref={ref}
      aria-labelledby="sheet-title"
      className={cn(
        'fixed m-0 max-h-none max-w-none border-border bg-surface p-0 text-fg shadow-lg backdrop:bg-black/30',
        effective === 'right' && 'top-0 right-0 left-auto h-dvh w-full max-w-md border-l open:animate-slide-left',
        effective === 'bottom' && 'top-auto bottom-0 h-auto max-h-[88dvh] w-full rounded-t-2xl border-t open:animate-slide-up',
        className,
      )}
    >
      {open && (
        <div className={cn('flex flex-col', effective === 'right' ? 'h-full' : 'max-h-[88dvh]')}>
          {effective === 'bottom' && <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong" aria-hidden />}
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0">
              <h2 id="sheet-title" className="text-base font-semibold tracking-tight">{title}</h2>
              {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
            </div>
            <div className="flex items-center gap-1">
              {headerActions}
              <IconButton label="Close" size="sm" onClick={onClose}>
                <X className="size-4" />
              </IconButton>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="pb-safe border-t border-border px-5 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
