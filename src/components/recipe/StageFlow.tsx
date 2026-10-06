import { useMemo } from 'react'
import type { FilamentView, Hex, ID, Stage } from '@/types'
import { inputFractions, flattenComposition } from '@/lib/recipe/composition'
import { predictMix } from '@/lib/color/mixing'
import { isVeryLight } from '@/lib/color/convert'
import { formatPercent } from '@/lib/utils/format'

interface LeafNode { kind: 'leaf'; key: string; filament?: FilamentView; label: string; hex: Hex; x: number; y: number; parent: ID; fraction: number }
interface StageNode { kind: 'stage'; id: ID; stage: Stage; index: number; x: number; y: number; hex: Hex; predicted: boolean; parent?: ID; fraction?: number }

const ROW = 40
const LEAF_W = 170
const COL = 170
const GAP = 110 // space between leaf labels and the first stage column
const PAD = 16

/**
 * Elegant left-to-right flow diagram of a multi-stage recipe.
 * Raw filaments sit on the left; each stage merges its inputs into an
 * output node; intermediates feed later stages; the final color is on the right.
 */
export function StageFlow({
  stages,
  filamentsById,
  finalHex,
  className,
}: {
  stages: Stage[]
  filamentsById: Record<ID, FilamentView> | Map<ID, FilamentView>
  finalHex?: Hex
  className?: string
}) {
  const layout = useMemo(() => buildLayout(stages, filamentsById, finalHex), [stages, filamentsById, finalHex])
  if (!layout) return null
  const { leaves, nodes, width, height } = layout
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  const curve = (x1: number, y1: number, x2: number, y2: number) => {
    const mx = (x1 + x2) / 2
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`
  }

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={describe(stages, filamentsById)} className="block min-w-full">
          {/* edges: leaves → stage */}
          {leaves.map((l) => {
            const p = nodeById.get(l.parent)!
            return (
              <g key={`e-${l.key}`}>
                <path d={curve(l.x + LEAF_W - 24, l.y, p.x - 14, p.y)} fill="none" stroke={l.hex} strokeOpacity={isVeryLight(l.hex) ? 1 : 0.55} strokeWidth={2 + l.fraction * 6} strokeLinecap="round" className={isVeryLight(l.hex) ? '[stroke:var(--border-strong)]' : ''} />
                <text x={l.x + LEAF_W - 20} y={l.y - 6} className="fill-fg-subtle text-[10px] tabular" textAnchor="start">{formatPercent(l.fraction, l.fraction * 100 % 1 === 0 ? 0 : 1)}</text>
              </g>
            )
          })}
          {/* edges: stage → stage */}
          {nodes.filter((n) => n.parent).map((n) => {
            const p = nodeById.get(n.parent!)!
            return (
              <g key={`se-${n.id}`}>
                <path d={curve(n.x + 14, n.y, p.x - 14, p.y)} fill="none" stroke={n.hex} strokeOpacity={0.6} strokeWidth={2 + (n.fraction ?? 0) * 6} strokeLinecap="round" strokeDasharray="1 0" />
                <text x={n.x + 20} y={n.y - 8} className="fill-fg-subtle text-[10px] tabular">{formatPercent(n.fraction ?? 0, 0)}</text>
              </g>
            )
          })}
          {/* leaves */}
          {leaves.map((l) => (
            <g key={l.key} transform={`translate(${l.x},${l.y})`}>
              <circle cx={8} cy={0} r={7} fill={l.hex} stroke="var(--border-strong)" strokeWidth={isVeryLight(l.hex) ? 1 : 0.5} />
              <text x={22} y={4} className="fill-fg text-[12px] font-medium">{truncate(l.label, 19)}</text>
            </g>
          ))}
          {/* stage nodes */}
          {nodes.map((n) => {
            const final = n.index === stages.length - 1
            const r = final ? 18 : 13
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                <circle r={r + 4} fill="var(--surface)" stroke="var(--border)" />
                <circle r={r} fill={n.hex} stroke={isVeryLight(n.hex) ? 'var(--border-strong)' : 'none'} />
                {n.predicted && <circle r={r} fill="none" stroke="var(--calc)" strokeDasharray="2 2.5" strokeWidth={1.25} />}
                <text y={r + 18} textAnchor="middle" className="fill-fg text-[11px] font-semibold uppercase" style={{ letterSpacing: '0.04em' }}>
                  {truncate(n.stage.outputName || n.stage.name, 18)}
                </text>
                <text y={r + 31} textAnchor="middle" className="fill-fg-subtle text-[10px]">
                  {final ? 'Final color' : `Stage ${n.index + 1}`}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      {nodes.some((n) => n.predicted) && (
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-fg-subtle">
          <svg width="14" height="14" aria-hidden><circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--calc)" strokeDasharray="2 2" /></svg>
          Dashed ring = intermediate color is a calculated preview, not a measured swatch.
        </p>
      )}
    </div>
  )
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s
}

function describe(stages: Stage[], byId: Record<ID, FilamentView> | Map<ID, FilamentView>) {
  const get = (id: ID) => (byId instanceof Map ? byId.get(id) : byId[id])
  return stages
    .map((s, i) => {
      const fr = inputFractions(s.inputs)
      const parts = s.inputs.map((inp, k) => {
        const name = inp.source.kind === 'filament' ? get(inp.source.filamentId)?.colorName ?? 'Unknown' : stages.find((x) => x.id === (inp.source as { stageId: ID }).stageId)?.outputName ?? 'intermediate'
        return `${formatPercent(fr[k])} ${name}`
      })
      return `Stage ${i + 1}, ${s.outputName}: ${parts.join(', ')}`
    })
    .join('. ')
}

function buildLayout(stages: Stage[], byId: Record<ID, FilamentView> | Map<ID, FilamentView>, finalHex?: Hex) {
  if (stages.length === 0) return null
  const get = (id: ID) => (byId instanceof Map ? byId.get(id) : byId[id])
  const index = new Map(stages.map((s, i) => [s.id, i]))

  // depth from the final stage
  const depth = new Map<ID, number>()
  const walk = (id: ID, d: number, seen: Set<ID>) => {
    if (seen.has(id)) return
    depth.set(id, Math.max(depth.get(id) ?? 0, d))
    const s = stages[index.get(id)!]
    s?.inputs.forEach((inp) => inp.source.kind === 'stage' && index.has(inp.source.stageId) && walk(inp.source.stageId, d + 1, new Set([...seen, id])))
  }
  const final = stages[stages.length - 1]
  walk(final.id, 0, new Set())
  // orphan stages (not used): place them by array distance
  stages.forEach((s, i) => !depth.has(s.id) && depth.set(s.id, stages.length - 1 - i))
  const maxDepth = Math.max(...depth.values())

  const leaves: LeafNode[] = []
  const nodes: StageNode[] = []
  let row = 0
  const placed = new Set<ID>()

  const colorOf = (s: Stage): { hex: Hex; predicted: boolean } => {
    if (s.id === final.id && finalHex) return { hex: finalHex, predicted: false }
    if (s.outputHex) return { hex: s.outputHex, predicted: false }
    try {
      const comp = flattenComposition(stages, s.id)
      const hex = predictMix(comp.map((c) => ({ hex: get(c.filamentId)?.hex ?? '#888888', weight: c.fraction, filament: get(c.filamentId) })))
      return { hex, predicted: true }
    } catch {
      return { hex: '#888888', predicted: true }
    }
  }

  const place = (s: Stage, parent?: ID, fraction?: number): number => {
    placed.add(s.id)
    const fr = inputFractions(s.inputs)
    const ys: number[] = []
    s.inputs.forEach((inp, k) => {
      if (inp.source.kind === 'filament') {
        const f = get(inp.source.filamentId)
        const y = PAD + 14 + row++ * ROW
        leaves.push({ kind: 'leaf', key: `${s.id}-${inp.id}`, filament: f, label: f?.colorName ?? 'Select filament', hex: f?.hex ?? '#BBBBBB', x: PAD, y, parent: s.id, fraction: fr[k] })
        ys.push(y)
      } else {
        const sub = stages[index.get(inp.source.stageId)!]
        if (sub && !placed.has(sub.id)) ys.push(place(sub, s.id, fr[k]))
      }
    })
    const y = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : PAD + 14 + row++ * ROW
    const d = depth.get(s.id) ?? 0
    const { hex, predicted } = colorOf(s)
    nodes.push({ kind: 'stage', id: s.id, stage: s, index: index.get(s.id)!, x: PAD + LEAF_W + GAP + (maxDepth - d) * COL, y, hex, predicted, parent, fraction })
    return y
  }

  place(final)
  stages.forEach((s) => !placed.has(s.id) && place(s))

  const width = PAD + LEAF_W + GAP + maxDepth * COL + 90
  const height = Math.max(PAD * 2 + row * ROW + 30, 120)
  return { leaves, nodes, width, height }
}
