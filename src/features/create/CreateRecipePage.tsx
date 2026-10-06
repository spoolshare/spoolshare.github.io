import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router'
import { AlertCircle, ArrowLeft, ArrowRight, Check, CloudOff, FileClock, FlaskConical, Loader2, Save, Trash2 } from 'lucide-react'
import type { FilamentView, ID, Recipe } from '@/types'
import { api } from '@/lib/api'
import { invalidate, useQuery } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { cn } from '@/lib/utils/cn'
import { timeAgo } from '@/lib/utils/format'
import { Button, ButtonLink, Card, EmptyState, IconButton, Skeleton, useToast } from '@/components/ui'
import { ColorDot } from '@/components/color/Swatch'
import {
  adoptedKeys, emptyState, parsePrefill, reducer, sessionCache, stageFilamentIds, stateFromPrefill, stateFromRecipe, type WizardState,
} from './draft'
import { Ctx, type WizardCtx } from './context'
import { checkStep, firstBlocked, STEPS } from './validation'
import { BasicsStep } from './steps/BasicsStep'
import { ColorStep } from './steps/ColorStep'
import { IngredientsStep } from './steps/IngredientsStep'
import { StagesStep } from './steps/StagesStep'
import { InstructionsStep } from './steps/InstructionsStep'
import { PhotosStep } from './steps/PhotosStep'
import { ReviewStep } from './steps/ReviewStep'
import { PublishStep, PublishedSuccess } from './steps/PublishStep'

export default function CreateRecipePage() {
  const { draftId } = useParams()
  const [params] = useSearchParams()
  const location = useLocation()
  const { user, loading } = useSession()
  const prefillRaw = params.get('prefill')
  const nonce = (location.state as { nonce?: number } | null)?.nonce ?? 0

  if (loading) return <PageSkeleton />
  if (!user) return <SignInGate />

  if (draftId) {
    const adopted = adoptedKeys.get(draftId)
    const cached = sessionCache.get(draftId)
    if (cached) return <Wizard key={adopted ?? `d-${draftId}`} instanceKey={adopted ?? `d-${draftId}`} initial={cached.state} initialStep={cached.step} />
    return <DraftLoader key={draftId} draftId={draftId} />
  }

  const prefill = parsePrefill(prefillRaw)
  const key = `new-${nonce}-${prefillRaw ?? ''}`
  return (
    <Wizard
      key={key}
      instanceKey={key}
      initial={prefill ? stateFromPrefill(prefill) : emptyState()}
      initialStep={0}
      showDrafts={!prefill}
    />
  )
}

function DraftLoader({ draftId }: { draftId: ID }) {
  const { data, loading, error } = useQuery('drafts:list', () => api.listDrafts())
  if (loading) return <PageSkeleton />
  const draft = data?.find((r) => r.id === draftId)
  if (error || !draft) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<CloudOff className="size-5" />}
          title="Draft not found"
          description="It may have been published or deleted."
          action={<ButtonLink to="/create">Start a new recipe</ButtonLink>}
        />
      </div>
    )
  }
  return <Wizard key={`d-${draftId}`} instanceKey={`d-${draftId}`} initial={stateFromRecipe(draft)} initialStep={0} />
}

function Wizard({ initial, initialStep, showDrafts, instanceKey }: { initial: WizardState; initialStep: number; showDrafts?: boolean; instanceKey: string }) {
  const [state, dispatch] = useReducer(reducer, initial)
  const [step, setStep] = useState(initialStep)
  const [showErrors, setShowErrors] = useState(false)
  const [filaments, setFilaments] = useState<Record<ID, FilamentView>>({})
  const [published, setPublished] = useState<Recipe | null>(null)
  const navigate = useNavigate()
  const { draftId } = useParams()
  const topRef = useRef<HTMLDivElement>(null)

  // --- filament cache: fetch anything referenced but not yet known
  const missing = useMemo(
    () => [...new Set([...state.palette, ...stageFilamentIds(state.draft.stages)])].filter((id) => id && !filaments[id]),
    [state.palette, state.draft.stages, filaments],
  )
  const missingKey = missing.join(',')
  useEffect(() => {
    if (!missingKey) return
    let alive = true
    api.getFilaments(missingKey.split(',')).then((fs) => {
      if (alive && fs.length) setFilaments((prev) => ({ ...prev, ...Object.fromEntries(fs.map((f) => [f.id, f])) }))
    })
    return () => { alive = false }
  }, [missingKey])
  const rememberFilament = useCallback((f: FilamentView) => setFilaments((prev) => (prev[f.id] ? prev : { ...prev, [f.id]: f })), [])

  // --- autosave
  const stepRef = useRef(step)
  stepRef.current = step
  const { save, status, savedAt } = useAutosave(state, published != null, (id, saved) => {
    adoptedKeys.set(id, instanceKey)
    sessionCache.set(id, { state: saved, step: stepRef.current })
    dispatch({ type: 'setId', id })
    if (draftId !== id) navigate(`/create/${id}`, { replace: true })
  })

  useEffect(() => {
    if (state.draft.id) sessionCache.set(state.draft.id, { state, step })
  }, [state, step])

  // Cmd/Ctrl+S saves the draft
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [save])

  const goTo = useCallback((i: number) => {
    setStep(Math.max(0, Math.min(STEPS.length - 1, i)))
    setShowErrors(false)
    requestAnimationFrame(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      topRef.current?.focus({ preventScroll: true })
    })
  }, [])

  const current = checkStep(step, state)
  const reachable = Math.max(firstBlocked(state), step)

  const next = () => {
    if (current.errors.length) {
      setShowErrors(true)
      return
    }
    goTo(step + 1)
  }

  const ctx: WizardCtx = { state, dispatch, filaments, rememberFilament, goTo }

  if (published) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <PublishedSuccess recipe={published} onAnother={() => navigate('/create', { state: { nonce: Date.now() } })} />
      </div>
    )
  }

  return (
    <Ctx.Provider value={ctx}>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-1 text-xs font-semibold tracking-wider text-accent uppercase">Create recipe</div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{state.draft.name.trim() || 'New color recipe'}</h1>
          </div>
          <SaveIndicator status={status} savedAt={savedAt} onSave={save} hasId={!!state.draft.id} />
        </div>

        {showDrafts && <DraftsList />}

        {/* Mobile progress */}
        <div className="mb-5 lg:hidden">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">{STEPS[step].title}</span>
            <span className="text-fg-muted tabular">Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="mt-2 flex gap-1" aria-hidden>
            {STEPS.map((s, i) => (
              <span key={s.id} className={cn('h-1.5 flex-1 rounded-full transition-colors', i < step ? 'bg-accent' : i === step ? 'bg-fg' : 'bg-surface-3')} />
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[13rem_minmax(0,1fr)]">
          <nav aria-label="Recipe steps" className="hidden lg:block">
            <ol className="sticky top-24 space-y-1">
              {STEPS.map((s, i) => {
                const done = i < step && checkStep(i, state).errors.length === 0
                const active = i === step
                const disabled = i > reachable
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => goTo(i)}
                      disabled={disabled}
                      aria-current={active ? 'step' : undefined}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition-colors disabled:opacity-40',
                        active ? 'bg-surface font-semibold text-fg shadow-sm ring-1 ring-border' : 'text-fg-muted hover:bg-surface-2 hover:text-fg',
                      )}
                    >
                      <span
                        className={cn(
                          'grid size-6 shrink-0 place-items-center rounded-full border text-xs font-semibold tabular',
                          done ? 'border-accent bg-accent text-accent-fg' : active ? 'border-fg bg-fg text-bg' : 'border-border-strong',
                        )}
                      >
                        {done ? <Check className="size-3.5" aria-label="completed" /> : i + 1}
                      </span>
                      {s.title}
                    </button>
                  </li>
                )
              })}
            </ol>
            <div className="mt-6 rounded-xl border border-border bg-surface p-3 text-xs text-fg-muted">
              <FlaskConical className="mb-1.5 size-4 text-accent" aria-hidden />
              Only publish colors you’ve physically mixed and printed. Community reproductions decide how trusted it becomes.
            </div>
          </nav>

          <div className="min-w-0">
            <div ref={topRef} tabIndex={-1} className="scroll-mt-24 outline-none" aria-live="polite">
              <span className="sr-only">Step {step + 1} of {STEPS.length}: {STEPS[step].title}</span>
            </div>
            <div key={step} className="animate-slide-up pb-6">
              {step === 0 && <BasicsStep showErrors={showErrors} />}
              {step === 1 && <ColorStep />}
              {step === 2 && <IngredientsStep showErrors={showErrors} />}
              {step === 3 && <StagesStep />}
              {step === 4 && <InstructionsStep />}
              {step === 5 && <PhotosStep showErrors={showErrors} />}
              {step === 6 && <ReviewStep />}
              {step === 7 && <PublishStep onPublished={setPublished} />}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="sticky bottom-16 z-20 mt-4 border-t border-border bg-surface/90 backdrop-blur-md lg:bottom-0">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:px-6">
          <Button variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0} icon={<ArrowLeft className="size-4" />}>
            <span className="hidden sm:inline">Back</span>
          </Button>
          <div className="min-w-0 flex-1 text-sm" aria-live="assertive">
            {showErrors && current.errors.length > 0 ? (
              <p role="alert" className="flex items-center gap-1.5 text-danger">
                <AlertCircle className="size-4 shrink-0" aria-hidden />
                <span className="truncate">{current.errors[0]}{current.errors.length > 1 ? ` (+${current.errors.length - 1} more)` : ''}</span>
              </p>
            ) : current.warnings.length > 0 && step !== 7 ? (
              <p className="hidden truncate text-fg-muted sm:block">{current.warnings[0]}</p>
            ) : null}
          </div>
          <Button variant="outline" onClick={() => void save()} icon={<Save className="size-4" />} className="hidden sm:inline-flex" loading={status === 'saving'}>
            Save draft
          </Button>
          {step < STEPS.length - 1 && (
            <Button onClick={next} iconRight={<ArrowRight className="size-4" />}>
              <span className="hidden sm:inline">Next:</span> {STEPS[step + 1].short}
            </Button>
          )}
        </div>
      </div>
    </Ctx.Provider>
  )
}

type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

function useAutosave(state: WizardState, disabled: boolean, onFirstSave: (id: ID, saved: WizardState) => void) {
  const [status, setStatus] = useState<SaveStatus>(state.draft.id ? 'saved' : 'idle')
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const idRef = useRef<ID | undefined>(state.draft.id)
  const saving = useRef(false)
  const again = useRef(false)
  const firstSaveRef = useRef(onFirstSave)
  firstSaveRef.current = onFirstSave
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountVersion = useRef(state.version)

  const save = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current)
    if (saving.current) {
      again.current = true
      return
    }
    saving.current = true
    setStatus('saving')
    try {
      const draft = { ...stateRef.current.draft, id: idRef.current ?? stateRef.current.draft.id }
      const r = await api.saveDraft(draft)
      const wasNew = !idRef.current
      idRef.current = r.id
      if (wasNew) firstSaveRef.current(r.id, { ...stateRef.current, draft: { ...stateRef.current.draft, id: r.id } })
      invalidate('drafts')
      setSavedAt(Date.now())
      setStatus('saved')
    } catch {
      setStatus('error')
    } finally {
      saving.current = false
      if (again.current) {
        again.current = false
        void save()
      }
    }
  }, [])

  useEffect(() => {
    if (disabled || state.version === mountVersion.current) return
    setStatus('pending')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void save(), 1500)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [state.version, disabled, save])

  return { save, status, savedAt }
}

function SaveIndicator({ status, savedAt, onSave, hasId }: { status: SaveStatus; savedAt: number | null; onSave: () => void; hasId: boolean }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 20000)
    return () => clearInterval(t)
  }, [])
  const label =
    status === 'saving' ? 'Saving…'
      : status === 'pending' ? 'Unsaved changes'
        : status === 'error' ? 'Couldn’t save. Retry?'
          : status === 'saved' ? `Draft saved · ${savedAt ? timeAgo(new Date(savedAt).toISOString()) : 'earlier'}`
            : hasId ? 'Draft' : 'Not saved yet'
  return (
    <button
      type="button"
      onClick={onSave}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
        status === 'error' ? 'border-danger/40 text-danger' : 'border-border text-fg-muted hover:text-fg',
      )}
      aria-live="polite"
      title="Save draft (⌘S)"
    >
      {status === 'saving' ? <Loader2 className="size-3.5 animate-spin" aria-hidden />
        : status === 'saved' ? <Check className="size-3.5 text-accent" aria-hidden />
          : status === 'error' ? <AlertCircle className="size-3.5" aria-hidden />
            : <Save className="size-3.5" aria-hidden />}
      {label}
    </button>
  )
}

function DraftsList() {
  const { data } = useQuery('drafts:list', () => api.listDrafts())
  const toast = useToast()
  if (!data?.length) return null
  return (
    <Card className="mb-6 p-4">
      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold"><FileClock className="size-4 text-fg-subtle" aria-hidden /> Continue a draft</h2>
      <ul className="divide-y divide-border" role="list">
        {data.slice(0, 5).map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2">
            <ColorDot hex={r.resultHex} size={22} />
            <Link to={`/create/${r.id}`} className="min-w-0 flex-1 hover:underline">
              <span className="block truncate text-sm font-medium">{r.name || 'Untitled recipe'}</span>
              <span className="block text-xs text-fg-muted">
                {r.stages.length} {r.stages.length === 1 ? 'stage' : 'stages'} · edited {timeAgo(r.updatedAt)}
              </span>
            </Link>
            <IconButton
              label={`Delete draft ${r.name || 'Untitled'}`}
              size="sm"
              onClick={async () => {
                await api.deleteRecipe(r.id)
                sessionCache.delete(r.id)
                invalidate('drafts')
                toast('Draft deleted', { tone: 'info' })
              }}
            >
              <Trash2 className="size-4" />
            </IconButton>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function SignInGate() {
  const { signInDemo } = useSession()
  const [busy, setBusy] = useState(false)
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <Card className="p-8 text-center">
        <div className="mx-auto mb-4 flex justify-center -space-x-2" aria-hidden>
          {['#C1AAD6', '#B4613F', '#9CAF88'].map((h) => <ColorDot key={h} hex={h} size={36} ring />)}
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Share a color you’ve mixed</h1>
        <p className="mt-2 text-sm text-fg-muted">
          Sign in to publish recipes, save drafts, and track reproductions of your colors.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <ButtonLink to="/signin">Sign in</ButtonLink>
          <Button
            variant="outline"
            loading={busy}
            onClick={async () => {
              setBusy(true)
              try { await signInDemo() } finally { setBusy(false) }
            }}
          >
            Try the demo account
          </Button>
        </div>
        <p className="mt-4 text-xs text-fg-muted">New here? <Link to="/signup" className="font-medium text-accent hover:underline">Create an account</Link></p>
      </Card>
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Skeleton className="h-8 w-64" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[13rem_1fr]">
        <div className="hidden space-y-2 lg:block">{STEPS.map((s) => <Skeleton key={s.id} className="h-9" />)}</div>
        <div className="space-y-4"><Skeleton className="h-10" /><Skeleton className="h-28" /><Skeleton className="h-10" /></div>
      </div>
    </div>
  )
}
