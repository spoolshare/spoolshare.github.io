import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Database, LogOut, Monitor, Moon, Plus, RotateCcw, Sun, X } from 'lucide-react'
import type { Profile } from '@/types'
import { api } from '@/lib/api'
import { resetDb } from '@/lib/api/mock/db'
import { invalidate } from '@/lib/hooks/useQuery'
import { useSession } from '@/lib/hooks/useSession'
import { useTheme, type ThemePref } from '@/lib/hooks/usePreferences'
import {
  Avatar, Badge, Button, ButtonLink, Card, Dialog, EmptyState, Field, Input, PageHeader, SegmentedControl, Switch, Textarea, useToast,
} from '@/components/ui'

export default function SettingsPage() {
  const { user, loading, signOut } = useSession()
  const navigate = useNavigate()
  if (!loading && !user) {
    return (
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-6">
        <EmptyState title="Sign in to change settings" action={<ButtonLink to="/signin?next=/settings">Sign in</ButtonLink>} />
      </div>
    )
  }
  if (!user) return null
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <PageHeader title="Settings" description="Your profile, privacy, and how SpoolShare looks." />
      <div className="space-y-6">
        <ProfileSection key={user.id} user={user} />
        <PrivacySection user={user} />
        <AppearanceSection />
        <DataSection />
        <Section title="Account">
          <Button variant="outline" icon={<LogOut className="size-4" />} onClick={async () => { await signOut(); navigate('/') }}>Sign out</Button>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </Card>
  )
}

function ProfileSection({ user }: { user: Profile }) {
  const toast = useToast()
  const [form, setForm] = useState({ displayName: user.displayName, username: user.username, bio: user.bio ?? '', location: user.location ?? '', printers: user.printers })
  const [printer, setPrinter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const addPrinter = () => {
    const p = printer.trim()
    if (p && !form.printers.includes(p)) setForm({ ...form, printers: [...form.printers, p] })
    setPrinter('')
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.updateProfile({ displayName: form.displayName.trim() || user.username, username: form.username.trim(), bio: form.bio.trim() || undefined, location: form.location.trim() || undefined, printers: form.printers })
      invalidate('session', 'profile')
      toast('Profile saved')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Section title="Profile" description="Shown on your public profile and next to your recipes.">
      <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 sm:col-span-2">
          <Avatar profile={{ ...user, displayName: form.displayName || user.displayName }} size="lg" />
          <p className="text-sm text-fg-muted">Your avatar is generated from your name. Photo uploads arrive with the Supabase backend.</p>
        </div>
        <Field label="Display name" htmlFor="st-name"><Input id="st-name" value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></Field>
        <Field label="Username" htmlFor="st-user"><Input id="st-user" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })} leading={<span className="text-sm">@</span>} /></Field>
        <Field label="Bio" optional className="sm:col-span-2" htmlFor="st-bio"><Textarea id="st-bio" rows={3} maxLength={280} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="What do you like to mix?" /></Field>
        <Field label="Location" optional htmlFor="st-loc"><Input id="st-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
        <Field label="Printers" optional htmlFor="st-printer" hint="Press Enter to add.">
          <Input
            id="st-printer"
            value={printer}
            onChange={(e) => setPrinter(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPrinter() } }}
            placeholder="Bambu Lab P1S"
            trailing={<button type="button" onClick={addPrinter} aria-label="Add printer" className="grid size-7 place-items-center rounded-md text-fg-muted hover:bg-surface-2"><Plus className="size-4" /></button>}
          />
        </Field>
        {form.printers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:col-span-2">
            {form.printers.map((p) => (
              <Badge key={p} size="md">
                {p}
                <button type="button" aria-label={`Remove ${p}`} onClick={() => setForm({ ...form, printers: form.printers.filter((x) => x !== p) })} className="-mr-1 rounded hover:text-fg"><X className="size-3.5" /></button>
              </Badge>
            ))}
          </div>
        )}
        {error && <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p>}
        <div className="sm:col-span-2"><Button type="submit" loading={saving}>Save profile</Button></div>
      </form>
    </Section>
  )
}

function PrivacySection({ user }: { user: Profile }) {
  const toast = useToast()
  return (
    <Section title="Privacy">
      <Switch
        checked={user.inventoryVisibility === 'public'}
        onChange={async (v) => {
          await api.updateProfile({ inventoryVisibility: v ? 'public' : 'private' })
          invalidate('session', 'profile')
          toast(v ? 'Your filament collection is public' : 'Your filament collection is private', { tone: 'info' })
        }}
        label="Show my filament collection on my profile"
        description="Others can see which spools you own. Recipes and reproductions are always public."
      />
    </Section>
  )
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  return (
    <Section title="Appearance">
      <SegmentedControl<ThemePref>
        label="Theme"
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'light', label: 'Light', icon: <Sun className="size-4" /> },
          { value: 'dark', label: 'Dark', icon: <Moon className="size-4" /> },
          { value: 'system', label: 'System', icon: <Monitor className="size-4" /> },
        ]}
      />
    </Section>
  )
}

function DataSection() {
  const [confirm, setConfirm] = useState(false)
  const toast = useToast()
  return (
    <Section title="Data">
      <div className="flex items-center gap-2 text-sm">
        <Database className="size-4 text-fg-subtle" aria-hidden />
        Backend:
        <Badge tone={api.backend === 'mock' ? 'warn' : 'accent'}>{api.backend === 'mock' ? 'Mock (this browser)' : 'Supabase'}</Badge>
      </div>
      {api.backend === 'mock' && (
        <>
          <p className="mt-2 text-sm text-fg-muted">All accounts, recipes and photos are stored in this browser’s localStorage.</p>
          <Button className="mt-4" variant="outline" icon={<RotateCcw className="size-4" />} onClick={() => setConfirm(true)}>Reset demo data</Button>
          <Dialog
            open={confirm}
            onClose={() => setConfirm(false)}
            title="Reset demo data?"
            size="sm"
            footer={
              <>
                <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
                <Button variant="danger" onClick={() => { resetDb(); invalidate(); setConfirm(false); toast('Demo data restored') }}>Reset everything</Button>
              </>
            }
          >
            <p className="text-sm text-fg-muted">This deletes every account, recipe, reproduction and photo you created in this browser and restores the seeded demo world.</p>
          </Dialog>
        </>
      )}
    </Section>
  )
}
