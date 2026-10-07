import type { ReactNode } from 'react'
import { api } from '@/lib/api'
import { SpoolIcon } from '@/components/filament/Spool'
import { LogoMark } from '@/components/layout/Logo'

const SPOOLS: { hex: string; x: number; y: number; s: number; d: number }[] = [
  { hex: '#C1AAD6', x: 10, y: 10, s: 96, d: 0 },
  { hex: '#0056B8', x: 58, y: 6, s: 70, d: 1.2 },
  { hex: '#B4613F', x: 72, y: 30, s: 110, d: 0.6 },
  { hex: '#9CAF88', x: 26, y: 40, s: 80, d: 1.8 },
  { hex: '#F55A74', x: 44, y: 24, s: 60, d: 2.4 },
  { hex: '#FFFFFF', x: 52, y: 46, s: 64, d: 0.9 },
  { hex: '#00B1B7', x: 84, y: 8, s: 52, d: 1.5 },
  { hex: '#FEC600', x: 6, y: 44, s: 48, d: 2.1 },
]

/** Split layout: form card on the left, a floating-spool showcase on the right (desktop only). */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-10 sm:px-6 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-2 lg:items-center lg:py-12">
      <div className="mx-auto w-full max-w-md">
        <LogoMark size={40} />
        <h1 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1.5 text-fg-muted">{subtitle}</p>
        <div className="mt-8">{children}</div>
        {api.backend === 'mock' && (
          <p className="mt-6 rounded-lg border border-dashed border-border-strong px-3 py-2 text-xs text-fg-muted">
            Mock mode: accounts live in this browser only. No data leaves your device.
          </p>
        )}
      </div>

      <div aria-hidden className="relative hidden h-[560px] overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface-2 to-accent-soft lg:block">
        <style>{`@keyframes ss-float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(8deg)}}`}</style>
        {SPOOLS.map((s) => (
          <div key={s.hex} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%`, animation: `ss-float ${6 + s.d}s ease-in-out ${s.d}s infinite` }}>
            <SpoolIcon hex={s.hex} size={s.s} className="drop-shadow-xl" />
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-surface via-surface/90 to-transparent p-8 pt-20">
          <p className="max-w-sm text-fg-muted">Community-made filament colors and their recipes, for the Multi-Color Filament Mixer.</p>
        </div>
      </div>
    </div>
  )
}
