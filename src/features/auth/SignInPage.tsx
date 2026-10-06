import { api } from '@/lib/api'
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { AlertCircle, Sparkles } from 'lucide-react'
import { useSession } from '@/lib/hooks/useSession'
import { Button, Divider, Field, Input } from '@/components/ui'
import { AuthLayout } from './AuthLayout'

export function safeNext(next: string | null, fallback = '/') {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}

export default function SignInPage() {
  const { signIn, signInDemo, user } = useSession()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<'form' | 'demo' | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending('form')
    try {
      await signIn(email, password)
      navigate(next, { replace: true })
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPending(null)
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle={<>New to SpoolShare? <Link to={`/signup${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-medium text-accent hover:underline">Create an account</Link></>}>
      {user && (
        <p className="mb-4 rounded-lg bg-surface-2 px-3 py-2 text-sm text-fg-muted">
          You’re currently signed in as <b className="text-fg">{user.displayName}</b>. Signing in again switches accounts.
        </p>
      )}
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-soft px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {error}
          </div>
        )}
        <Field label="Email" htmlFor="si-email">
          <Input id="si-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </Field>
        <Field label="Password" htmlFor="si-pass" hint="Demo account: demo@spoolshare.app / demo">
          <Input id="si-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={pending === 'form'} disabled={!email || !password}>Sign in</Button>
      </form>
      {api.backend === 'mock' && <>
      <Divider label="or" className="my-6" />
      <Button
        variant="outline"
        size="lg"
        className="w-full"
        icon={<Sparkles className="size-4 text-accent" />}
        loading={pending === 'demo'}
        onClick={async () => {
          setPending('demo')
          await signInDemo()
          navigate(next, { replace: true })
        }}
      >
        Continue as demo maker
      </Button>
      </>}
    </AuthLayout>
  )
}
