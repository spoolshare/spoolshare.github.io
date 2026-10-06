import { createContext, useContext, type Dispatch } from 'react'
import type { FilamentView, ID } from '@/types'
import type { Action, WizardState } from './draft'

export interface WizardCtx {
  state: WizardState
  dispatch: Dispatch<Action>
  /** Every filament the wizard knows about (palette, stage inputs). */
  filaments: Record<ID, FilamentView>
  rememberFilament: (f: FilamentView) => void
  goTo: (step: number) => void
}

export const Ctx = createContext<WizardCtx | null>(null)

export function useWizard() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useWizard outside wizard')
  return c
}
