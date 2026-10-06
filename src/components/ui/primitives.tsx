/**
 * Small presentational primitives: Card, Badge, Skeleton, Kbd, Divider,
 * EmptyState, Section headers, Spinner.
 */
import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export function Card({ className, interactive, ...rest }: HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface shadow-sm',
        interactive && 'transition-[box-shadow,border-color,transform] duration-200 hover:shadow-md hover:border-border-strong',
        className,
      )}
      {...rest}
    />
  )
}

export type BadgeTone = 'neutral' | 'accent' | 'warn' | 'danger' | 'info' | 'calc' | 'solid'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-fg-muted border-border',
  accent: 'bg-accent-soft text-accent-soft-fg border-transparent',
  warn: 'bg-warn-soft text-warn border-transparent',
  danger: 'bg-danger-soft text-danger border-transparent',
  info: 'bg-info-soft text-info border-transparent',
  calc: 'bg-calc-soft text-calc border-transparent',
  solid: 'bg-fg text-bg border-transparent',
}

export function Badge({
  tone = 'neutral',
  size = 'sm',
  icon,
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone; size?: 'xs' | 'sm' | 'md'; icon?: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap',
        size === 'xs' && 'h-5 px-1.5 text-[11px]',
        size === 'sm' && 'h-6 px-2 text-xs',
        size === 'md' && 'h-7 px-2.5 text-sm',
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  )
}

export function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('animate-pulse rounded-md bg-surface-3/70', className)} {...rest} />
}

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-surface-2 px-1 font-mono text-[10px] text-fg-subtle">
      {children}
    </kbd>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong px-6 py-12 text-center', className)}>
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-full bg-surface-2 text-fg-subtle">{icon}</div>}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-fg-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function SectionHeader({
  title,
  subtitle,
  action,
  icon,
  className,
  as: As = 'h2',
}: {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  className?: string
  as?: 'h1' | 'h2' | 'h3'
}) {
  return (
    <div className={cn('mb-4 flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <As className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          {icon && <span className="text-fg-subtle">{icon}</span>}
          {title}
        </As>
        {subtitle && <p className="mt-0.5 text-sm text-fg-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  eyebrow?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs font-semibold tracking-wider text-accent uppercase">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-fg-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

export function Divider({ className, label }: { className?: string; label?: string }) {
  if (!label) return <hr className={cn('border-border', className)} />
  return (
    <div className={cn('flex items-center gap-3 text-xs text-fg-subtle', className)}>
      <span className="h-px flex-1 bg-border" />
      {label}
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}

export function Stat({ label, value, hint, className }: { label: string; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <div className="text-xs font-medium text-fg-subtle">{label}</div>
      <div className="tabular mt-0.5 text-lg font-semibold tracking-tight">{value}</div>
      {hint && <div className="text-xs text-fg-muted">{hint}</div>}
    </div>
  )
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>
}
