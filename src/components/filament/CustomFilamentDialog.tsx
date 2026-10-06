import { useState } from 'react'
import type { FilamentView, Finish, Hex, Material } from '@/types'
import { FINISHES, MATERIALS } from '@/types'
import { api } from '@/lib/api'
import { invalidate } from '@/lib/hooks/useQuery'
import { Dialog } from '@/components/ui/overlay'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Button } from '@/components/ui/Button'
import { HexInput } from '@/components/color/ColorPicker'

export function CustomFilamentDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (f: FilamentView) => void }) {
  const [form, setForm] = useState({ manufacturerName: '', productLineName: '', colorName: '', material: 'PLA' as Material, finish: 'basic' as Finish, hex: '#888888' as Hex, notes: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const valid = form.manufacturerName.trim() && form.productLineName.trim() && form.colorName.trim()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid) return
    setSaving(true)
    setError(null)
    try {
      const f = await api.createCustomFilament(form)
      invalidate('catalog')
      onCreated(f)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Add a custom filament"
      description="Custom filaments are private to you until a moderator adds them to the shared catalog."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="custom-filament" loading={saving} disabled={!valid}>Add filament</Button>
        </>
      }
    >
      <form id="custom-filament" onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Manufacturer"><Input value={form.manufacturerName} onChange={(e) => set('manufacturerName', e.target.value)} placeholder="e.g. Polymaker" required /></Field>
        <Field label="Product line"><Input value={form.productLineName} onChange={(e) => set('productLineName', e.target.value)} placeholder="e.g. PolyTerra PLA" required /></Field>
        <Field label="Official color name" className="sm:col-span-2"><Input value={form.colorName} onChange={(e) => set('colorName', e.target.value)} placeholder="e.g. Arctic Teal" required /></Field>
        <Field label="Material">
          <Select value={form.material} onChange={(e) => set('material', e.target.value as Material)}>
            {MATERIALS.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
        <Field label="Finish">
          <Select value={form.finish} onChange={(e) => set('finish', e.target.value as Finish)}>
            {FINISHES.map((m) => <option key={m} value={m}>{m[0].toUpperCase() + m.slice(1)}</option>)}
          </Select>
        </Field>
        <Field label="Display color" hint="Approximate. Used for previews only, never as a physical truth." className="sm:col-span-2">
          <HexInput value={form.hex} onChange={(h) => set('hex', h)} />
        </Field>
        <Field label="Notes" optional className="sm:col-span-2"><Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></Field>
        {error && <p role="alert" className="text-sm text-danger sm:col-span-2">{error}</p>}
      </form>
    </Dialog>
  )
}
