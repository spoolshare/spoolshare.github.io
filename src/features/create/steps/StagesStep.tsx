import { useState } from 'react'
import { Plus } from 'lucide-react'
import { validateStages } from '@/lib/recipe/composition'
import { Button } from '@/components/ui'
import { useWizard } from '../context'
import { StageEditor } from '../StageEditor'
import { LiveFlow, LivePanel } from '../LivePanel'
import { StepIntro } from './StepIntro'

export function StagesStep() {
  const { state, dispatch } = useWizard()
  const stages = state.draft.stages
  const [moveError, setMoveError] = useState<{ stageId: string; message: string } | null>(null)

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= stages.length) return
    const next = [...stages]
    ;[next[index], next[j]] = [next[j], next[index]]
    const forwardRef = validateStages(next).find((i) => i.level === 'error' && i.message.includes('made before'))
    if (forwardRef) {
      setMoveError({
        stageId: stages[index].id,
        message: 'Can’t move this stage there: a stage can only use intermediates made in earlier stages.',
      })
      return
    }
    setMoveError(null)
    dispatch({ type: 'setStages', stages: next })
  }

  return (
    <div className="space-y-6">
      <StepIntro
        title="Mixing stages"
        description="Build the recipe step by step. A stage can use raw filaments and the outputs of earlier stages. The last stage makes the final color."
      />
      <LiveFlow />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          {stages.map((s, i) => (
            <div key={s.id} className="relative">
              {i > 0 && <div className="absolute -top-4 left-8 h-4 w-px bg-border-strong" aria-hidden />}
              <StageEditor
                stage={s}
                index={i}
                onMove={(dir) => move(i, dir)}
                moveError={moveError?.stageId === s.id ? moveError.message : undefined}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="lg"
            className="w-full border-dashed"
            icon={<Plus className="size-5" />}
            onClick={() => {
              setMoveError(null)
              dispatch({ type: 'addStage' })
            }}
          >
            Add Mixing Stage
          </Button>
          <p className="text-center text-xs text-fg-muted">
            The new stage starts with the previous stage’s output as an input. Example: make a light blue first, then use it to tint a purple.
          </p>
        </div>
        <aside className="xl:sticky xl:top-24 xl:self-start" aria-label="Live recipe preview">
          <LivePanel />
        </aside>
      </div>
    </div>
  )
}
