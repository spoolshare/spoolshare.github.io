import { validateStages, type RecipeIssue } from '@/lib/recipe/composition'
import type { WizardState } from './draft'

export const STEPS = [
  { id: 'basics', title: 'Basic information', short: 'Basics' },
  { id: 'color', title: 'Result color', short: 'Color' },
  { id: 'ingredients', title: 'Ingredients', short: 'Ingredients' },
  { id: 'stages', title: 'Mixing stages', short: 'Stages' },
  { id: 'instructions', title: 'Instructions', short: 'Instructions' },
  { id: 'photos', title: 'Photos', short: 'Photos' },
  { id: 'review', title: 'Review', short: 'Review' },
  { id: 'publish', title: 'Publish', short: 'Publish' },
] as const

export interface StepCheck {
  errors: string[]
  warnings: string[]
}

export function stageIssues(state: WizardState): RecipeIssue[] {
  return validateStages(state.draft.stages)
}

export function checkStep(step: number, state: WizardState): StepCheck {
  const d = state.draft
  const errors: string[] = []
  const warnings: string[] = []
  switch (STEPS[step]?.id) {
    case 'basics':
      if (!d.name.trim()) errors.push('Give your recipe a name.')
      else if (d.name.trim().length > 60) errors.push('Keep the name under 60 characters.')
      if (!d.description.trim()) warnings.push('A short description helps others find your color.')
      break
    case 'color':
      if (state.prefilled && d.photos.length === 0) warnings.push('This color is still the calculated prediction. Replace it with your measured result.')
      break
    case 'ingredients':
      if (state.palette.length === 0) errors.push('Add at least one filament you used.')
      else if (state.palette.length === 1) warnings.push('One filament alone isn’t a mix. Add the other colors you blended.')
      break
    case 'stages':
      for (const i of stageIssues(state)) (i.level === 'error' ? errors : warnings).push(i.message)
      break
    case 'photos':
      if (d.photos.length === 0) warnings.push('No photo yet. Recipes need a photographed swatch to count as Tested.')
      if (d.photos.some((p) => !p.alt.trim())) errors.push('Every photo needs alt text describing it.')
      break
  }
  return { errors, warnings }
}

/** Index of the first step with blocking errors (or the last step). */
export function firstBlocked(state: WizardState): number {
  for (let i = 0; i < STEPS.length - 1; i++) if (checkStep(i, state).errors.length) return i
  return STEPS.length - 1
}
