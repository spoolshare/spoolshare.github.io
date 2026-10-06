import {
  forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export const inputClass =
  'w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle shadow-sm transition-colors hover:border-fg-subtle focus:border-accent focus:outline-none focus:ring-3 focus:ring-[var(--ring)] disabled:opacity-60 aria-[invalid=true]:border-danger'

export function Field({
  label,
  hint,
  error,
  children,
  optional,
  className,
  htmlFor,
}: {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  optional?: boolean
  children: ReactNode
  className?: string
  htmlFor?: string
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="flex items-baseline justify-between gap-2 text-sm font-medium">
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-fg-subtle">Optional</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-fg-muted">{hint}</p>
      ) : null}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode }>(
  function Input({ className, leading, trailing, ...rest }, ref) {
    if (!leading && !trailing) return <input ref={ref} className={cn(inputClass, 'h-10', className)} {...rest} />
    return (
      <div className={cn('relative flex items-center', className)}>
        {leading && <span className="pointer-events-none absolute left-3 flex text-fg-subtle">{leading}</span>}
        <input ref={ref} className={cn(inputClass, 'h-10', leading && 'pl-9', trailing && 'pr-10')} {...rest} />
        {trailing && <span className="absolute right-2 flex">{trailing}</span>}
      </div>
    )
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, rows = 4, ...rest },
  ref,
) {
  return <textarea ref={ref} rows={rows} className={cn(inputClass, 'py-2.5 leading-relaxed', className)} {...rest} />
})

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className, children, ...rest },
  ref,
) {
  return (
    <div className={cn('relative', className)}>
      <select ref={ref} className={cn(inputClass, 'h-10 appearance-none pr-9')} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
    </div>
  )
})

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
  autoFocus,
  size = 'md',
  label = 'Search',
  ...rest
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
  autoFocus?: boolean
  size?: 'sm' | 'md' | 'lg'
  label?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'size'>) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className={cn('pointer-events-none absolute left-3 text-fg-subtle', size === 'lg' ? 'size-5' : 'size-4')} aria-hidden />
      <input
        type="search"
        aria-label={label}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          inputClass,
          '[&::-webkit-search-cancel-button]:hidden',
          size === 'sm' && 'h-8 pl-8 text-sm',
          size === 'md' && 'h-10 pl-9',
          size === 'lg' && 'h-12 pl-11 text-base',
          value && 'pr-9',
        )}
        {...rest}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2 grid size-6 place-items-center rounded-md text-fg-subtle hover:bg-surface-2 hover:text-fg"
          aria-label="Clear search"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  description,
  className,
  size = 'md',
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: ReactNode
  description?: ReactNode
  className?: string
  size?: 'sm' | 'md'
}) {
  const id = useId()
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-2.5 select-none', className)}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 items-center rounded-full border transition-colors duration-200',
          size === 'md' ? 'h-6 w-10' : 'h-5 w-8',
          checked ? 'border-accent bg-accent' : 'border-border-strong bg-surface-3',
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transition-transform duration-200',
            size === 'md' ? 'size-4.5' : 'size-3.5',
            checked ? (size === 'md' ? 'translate-x-[18px]' : 'translate-x-[14px]') : 'translate-x-[3px]',
          )}
        />
      </button>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm font-medium">{label}</span>}
          {description && <span className="text-xs text-fg-muted">{description}</span>}
        </span>
      )}
    </label>
  )
}

export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  className?: string
}) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-sm select-none', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border-strong accent-[var(--accent)]"
      />
      {label}
    </label>
  )
}

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; icon?: ReactNode }[]
  className?: string
  size?: 'sm' | 'md'
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('inline-flex rounded-lg border border-border bg-surface-2 p-0.5', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all',
              size === 'md' ? 'h-8 px-3 text-sm' : 'h-7 px-2.5 text-xs',
              active ? 'bg-surface text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
            )}
          >
            {o.icon}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Chip({
  active,
  onClick,
  children,
  icon,
  className,
  count,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  icon?: ReactNode
  className?: string
  count?: number
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors',
        active
          ? 'border-fg bg-fg text-bg'
          : 'border-border bg-surface text-fg-muted hover:border-border-strong hover:text-fg',
        className,
      )}
    >
      {icon}
      {children}
      {count != null && <span className={cn('tabular text-xs', active ? 'opacity-70' : 'text-fg-subtle')}>{count}</span>}
    </button>
  )
}
