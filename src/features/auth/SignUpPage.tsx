import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AlertCircle, Check } from 'lucide-react'
import { useSession } from '@/lib/hooks/useSession'
import { slugify } from '@/lib/utils/id'
import { cn } from '@/lib/utils/cn'
import { Button, Field, Input } from '@/components/ui'
import { AuthLayout } from './AuthLayout'
import { safeNext } from './SignInPage'

const USERNAME = /^[a-z0-9._-]{3,24}$/

function strength(pw: string): { score: number; label: string } {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  const score = Math.min(4, s)
  return { score, label: ['Too short', 'Weak', 'Okay', 'Good', 'Strong'][score] }
}

export default function SignUpPage() {
  const { signUp } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' })
  const [touchedUser, setTouchedUser] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const usernameValid = USERNAME.test(form.username)
  const pw = strength(form.password)
  const valid = form.displayName.trim() && usernameValid && /\S+@\S+\.\S+/.test(form.email) && form.password.length >= 8

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setError(null)
    setPending(true)
    try {
      await signUp(form)
      navigate(params.get('next') ? safeNext(params.get('next')) : '/filaments?welcome=1', { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout title="Join SpoolShare" subtitle={<>Already have an account? <Link to="/signin" className="font-medium text-accent hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
          </div>
        )}
        <Field label="Display name" htmlFor="su-name">
          <Input
            id="su-name"
            autoComplete="name"
            value={form.displayName}
            onChange={(e) => {
              const displayName = e.target.value
              setForm((f) => ({ ...f, displayName, username: touchedUser ? f.username : slugify(displayName).replace(/-/g, '.').slice(0, 24) }))
            }}
            placeholder="Mira Okafor"
            required
          />
        </Field>
        <Field
          label="Username"
          htmlFor="su-user"
          error={form.username && !usernameValid ? '3–24 characters: lowercase letters, numbers, . _ -' : undefined}
          hint={usernameValid ? <span className="inline-flex items-center gap-1 text-accent"><Check className="size-3.5" /> spoolshare.app/u/{form.username}</span> : 'Shown on your profile and recipes.'}
        >
          <Input
            id="su-user"
            autoComplete="username"
            value={form.username}
            aria-invalid={!!form.username && !usernameValid}
            onChange={(e) => { setTouchedUser(true); setForm({ ...form, username: e.target.value.toLowerCase() }) }}
            leading={<span className="text-sm">@</span>}
            required
          />
        </Field>
        <Field label="Email" htmlFor="su-email">
          <Input id="su-email" type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <Field label="Password" htmlFor="su-pass" hint="At least 8 characters.">
          <Input id="su-pass" type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required aria-describedby="pw-strength" />
        </Field>
        {form.password && (
          <div id="pw-strength" className="-mt-2 flex items-center gap-2" aria-live="polite">
            <div className="flex flex-1 gap-1" aria-hidden>
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn('h-1 flex-1 rounded-full', i <= pw.score ? (pw.score <= 1 ? 'bg-danger' : pw.score === 2 ? 'bg-warn' : 'bg-accent') : 'bg-surface-3')} />
              ))}
            </div>
            <span className="w-16 text-right text-xs text-fg-muted">{form.password.length < 8 ? 'Too short' : pw.label}</span>
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" loading={pending} disabled={!valid}>Create account</Button>
        <p className="text-center text-xs text-fg-subtle">
          By joining you agree to share recipes honestly: only post colors you’ve physically mixed and printed.
        </p>
      </form>
    </AuthLayout>
  )
}
