/**
 * Wizard state: the recipe draft (RecipeDraftInput) plus authoring-only data
 * such as the ingredient palette. A single reducer owns every change.
 */
import type { FilamentView, Hex, ID, Recipe, Stage, StageInput, StageSource } from '@/types'
import type { RecipeDraftInput } from '@/lib/api'
import { uid } from '@/lib/utils/id'
import { flattenComposition } from '@/lib/recipe/composition'
import { predictMix } from '@/lib/color/mixing'

export interface WizardState {
  draft: RecipeDraftInput
  /** Raw filaments chosen in the Ingredients step. */
  palette: ID[]
  /** Incremented on every user edit, which drives autosave. */
  version: number
  /** Started from a Color Matcher prediction. */
  prefilled: boolean
}

export type Action =
  | { type: 'load'; state: WizardState }
  | { type: 'patch'; patch: Partial<RecipeDraftInput> }
  | { type: 'setId'; id: ID }
  | { type: 'addPalette'; id: ID }
  | { type: 'removePalette'; id: ID }
  | { type: 'addStage' }
  | { type: 'removeStage'; stageId: ID }
  | { type: 'setStages'; stages: Stage[] }
  | { type: 'patchStage'; stageId: ID; patch: Partial<Stage> }
  | { type: 'addInput'; stageId: ID; source: StageSource; parts?: number }
  | { type: 'patchInput'; stageId: ID; inputId: ID; patch: Partial<StageInput> }
  | { type: 'removeInput'; stageId: ID; inputId: ID }
  | { type: 'setParts'; stageId: ID; parts: number[] }

export function newStage(index: number, prev?: Stage): Stage {
  return {
    id: uid('st'),
    name: index === 0 ? 'Mix' : `Stage ${index + 1}`,
    outputName: '',
    inputs: prev ? [{ id: uid('in'), source: { kind: 'stage', stageId: prev.id }, parts: 1 }] : [],
    instructions: '',
    photos: [],
  }
}

export function emptyState(): WizardState {
  return {
    draft: {
      name: '',
      description: '',
      resultHex: '#C1AAD6',
      photos: [],
      material: 'PLA',
      finish: 'basic',
      mixingMethod: 'Filament re-extruder',
      tags: [],
      stages: [newStage(0)],
      notes: '',
    },
    palette: [],
    version: 0,
    prefilled: false,
  }
}

/** Every raw filament id referenced by the stages. */
export function stageFilamentIds(stages: Stage[]): ID[] {
  const ids: ID[] = []
  stages.forEach((s) => s.inputs.forEach((i) => {
    if (i.source.kind === 'filament' && i.source.filamentId && !ids.includes(i.source.filamentId)) ids.push(i.source.filamentId)
  }))
  return ids
}

export function stateFromRecipe(r: Recipe): WizardState {
  const draft: RecipeDraftInput = {
    id: r.id,
    name: r.name,
    description: r.description,
    resultHex: r.resultHex,
    photos: r.photos,
    lightingNotes: r.lightingNotes,
    material: r.material,
    finish: r.finish,
    mixingMethod: r.mixingMethod,
    printer: r.printer,
    nozzle: r.nozzle,
    layerHeight: r.layerHeight,
    tags: r.tags,
    stages: r.stages.length ? r.stages : [newStage(0)],
    notes: r.notes ?? '',
  }
  return { draft, palette: stageFilamentIds(draft.stages), version: 0, prefilled: false }
}

export interface Prefill {
  name?: string
  resultHex?: Hex
  components: { filamentId: ID; parts: number }[]
}

export function parsePrefill(raw: string | null): Prefill | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw) as Prefill
    if (!Array.isArray(p.components)) return null
    p.components = p.components.filter((c) => typeof c.filamentId === 'string' && c.parts > 0)
    return p.components.length ? p : null
  } catch {
    return null
  }
}

export function stateFromPrefill(p: Prefill): WizardState {
  const base = emptyState()
  const stage: Stage = {
    ...newStage(0),
    name: 'Mix',
    outputName: p.name ?? '',
    inputs: p.components.map((c) => ({ id: uid('in'), source: { kind: 'filament', filamentId: c.filamentId }, parts: c.parts })),
  }
  return {
    ...base,
    draft: { ...base.draft, name: p.name ?? '', resultHex: p.resultHex ?? base.draft.resultHex, stages: [stage] },
    palette: p.components.map((c) => c.filamentId),
    prefilled: true,
  }
}

const mapStage = (stages: Stage[], id: ID, fn: (s: Stage) => Stage) => stages.map((s) => (s.id === id ? fn(s) : s))

export function reducer(state: WizardState, action: Action): WizardState {
  const bump = (draft: RecipeDraftInput, palette = state.palette): WizardState => ({ ...state, draft, palette, version: state.version + 1 })
  const d = state.draft
  switch (action.type) {
    case 'load':
      return action.state
    case 'setId':
      return { ...state, draft: { ...d, id: action.id } }
    case 'patch':
      return bump({ ...d, ...action.patch })
    case 'addPalette':
      return state.palette.includes(action.id) ? state : bump(d, [...state.palette, action.id])
    case 'removePalette': {
      // Removing an ingredient also removes every input that used it.
      const stages = d.stages.map((s) => ({
        ...s,
        inputs: s.inputs.filter((i) => !(i.source.kind === 'filament' && i.source.filamentId === action.id)),
      }))
      return bump({ ...d, stages }, state.palette.filter((x) => x !== action.id))
    }
    case 'addStage': {
      const prev = d.stages[d.stages.length - 1]
      if (prev && !prev.outputName.trim()) {
        // The previous stage now becomes an intermediate, so give it a sensible output name.
        const named = { ...prev, outputName: `${prev.name || 'Stage ' + d.stages.length} output` }
        return bump({ ...d, stages: [...d.stages.slice(0, -1), named, newStage(d.stages.length, named)] })
      }
      return bump({ ...d, stages: [...d.stages, newStage(d.stages.length, prev)] })
    }
    case 'removeStage': {
      const stages = d.stages
        .filter((s) => s.id !== action.stageId)
        .map((s) => ({ ...s, inputs: s.inputs.filter((i) => !(i.source.kind === 'stage' && i.source.stageId === action.stageId)) }))
      return bump({ ...d, stages: stages.length ? stages : [newStage(0)] })
    }
    case 'setStages':
      return bump({ ...d, stages: action.stages })
    case 'patchStage':
      return bump({ ...d, stages: mapStage(d.stages, action.stageId, (s) => ({ ...s, ...action.patch })) })
    case 'addInput': {
      const palette =
        action.source.kind === 'filament' && action.source.filamentId && !state.palette.includes(action.source.filamentId)
          ? [...state.palette, action.source.filamentId]
          : state.palette
      return bump(
        { ...d, stages: mapStage(d.stages, action.stageId, (s) => ({ ...s, inputs: [...s.inputs, { id: uid('in'), source: action.source, parts: action.parts ?? 1 }] })) },
        palette,
      )
    }
    case 'patchInput': {
      const src = action.patch.source
      const palette = src?.kind === 'filament' && src.filamentId && !state.palette.includes(src.filamentId) ? [...state.palette, src.filamentId] : state.palette
      return bump(
        { ...d, stages: mapStage(d.stages, action.stageId, (s) => ({ ...s, inputs: s.inputs.map((i) => (i.id === action.inputId ? { ...i, ...action.patch } : i)) })) },
        palette,
      )
    }
    case 'removeInput':
      return bump({ ...d, stages: mapStage(d.stages, action.stageId, (s) => ({ ...s, inputs: s.inputs.filter((i) => i.id !== action.inputId) })) })
    case 'setParts':
      return bump({
        ...d,
        stages: mapStage(d.stages, action.stageId, (s) => ({ ...s, inputs: s.inputs.map((i, k) => ({ ...i, parts: action.parts[k] ?? i.parts })) })),
      })
  }
}

/** Calculated color of any stage's output (an untested preview). */
export function predictStageHex(stages: Stage[], stageId: ID, filaments: Record<ID, FilamentView>): Hex | null {
  try {
    const comp = flattenComposition(stages, stageId).filter((c) => filaments[c.filamentId])
    if (comp.length === 0) return null
    return predictMix(comp.map((c) => ({ hex: filaments[c.filamentId].hex, weight: c.fraction, filament: filaments[c.filamentId] })))
  } catch {
    return null
  }
}

/** True final composition, ignoring empty or unknown inputs. */
export function safeComposition(stages: Stage[]) {
  try {
    return stages.length ? flattenComposition(stages).filter((c) => c.filamentId) : []
  } catch {
    return []
  }
}

/** Session-scoped memory so remounts (e.g. /create → /create/:id) don't lose palette or step. */
export const sessionCache = new Map<string, { state: WizardState; step: number }>()

/** Draft ids first saved by a mounted wizard, mapped to that wizard's React key (keeps it mounted across the URL change). */
export const adoptedKeys = new Map<string, string>()
