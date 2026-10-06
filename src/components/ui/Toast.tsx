import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

type Tone = 'success' | 'error' | 'info'
interface ToastItem {
  id: number
  message: ReactNode
  tone: Tone
  action?: { label: string; onClick: () => void }
}

const Ctx = createContext<(message: ReactNode, opts?: { tone?: Tone; action?: ToastItem['action'] }) => void>(() => {})

export function useToast() {
  return useContext(Ctx)
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), [])
  const toast = useCallback(
    (message: ReactNode, opts?: { tone?: Tone; action?: ToastItem['action'] }) => {
      const id = ++counter
      setItems((xs) => [...xs.slice(-2), { id, message, tone: opts?.tone ?? 'success', action: opts?.action }])
      setTimeout(() => dismiss(id), 4200)
    },
    [dismiss],
  )
  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info }
  return (
    <Ctx.Provider value={toast}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[100] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {items.map((t) => {
          const I = Icon[t.tone]
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-slide-up items-center gap-3 rounded-xl border border-border bg-fg px-4 py-3 text-sm text-bg shadow-lg"
            >
              <I className={cn('size-4 shrink-0', t.tone === 'error' ? 'text-red-400' : t.tone === 'info' ? 'text-sky-400' : 'text-green-400')} aria-hidden />
              <div className="min-w-0 flex-1">{t.message}</div>
              {t.action && (
                <button
                  type="button"
                  className="shrink-0 font-semibold text-green-400 hover:underline"
                  onClick={() => {
                    t.action!.onClick()
                    dismiss(t.id)
                  }}
                >
                  {t.action.label}
                </button>
              )}
              <button type="button" aria-label="Dismiss" onClick={() => dismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
                <X className="size-4" />
              </button>
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
