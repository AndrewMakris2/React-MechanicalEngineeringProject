import React, { useRef } from 'react'
import type { DiagramSpec, DiagramElement } from '../lib/schema'

interface Props { spec: DiagramSpec }

const CANVAS_W = 500
const CANVAS_H = 380
const ARROW_HEAD = 10

function getBodyCenter(elem: Extract<DiagramElement, { kind: 'body' }>) {
  return { cx: elem.x + elem.w / 2, cy: elem.y + elem.h / 2 }
}

function ArrowHead({ x2, y2, angle }: { x2: number; y2: number; angle: number }) {
  const a1 = angle + Math.PI * 0.8
  const a2 = angle - Math.PI * 0.8
  return (
    <g stroke="currentColor" strokeWidth="2" fill="none">
      <line x1={x2} y1={y2} x2={x2 + ARROW_HEAD * Math.cos(a1)} y2={y2 + ARROW_HEAD * Math.sin(a1)} />
      <line x1={x2} y1={y2} x2={x2 + ARROW_HEAD * Math.cos(a2)} y2={y2 + ARROW_HEAD * Math.sin(a2)} />
    </g>
  )
}

export default function DiagramRenderer({ spec }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)

  if (spec.type === 'none' || spec.elements.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 rounded-xl border border-dashed border-gray-700 text-gray-500 text-sm">
        No diagram available for this problem.
      </div>
    )
  }

  const bodies = spec.elements.filter((e): e is Extract<DiagramElement, { kind: 'body' }> => e.kind === 'body')
  const forces = spec.elements.filter((e): e is Extract<DiagramElement, { kind: 'force' }> => e.kind === 'force')
  const moments = spec.elements.filter((e): e is Extract<DiagramElement, { kind: 'moment' }> => e.kind === 'moment')
  const supports = spec.elements.filter((e): e is Extract<DiagramElement, { kind: 'support' }> => e.kind === 'support')
  const bodyMap = new Map(bodies.map(b => [b.id, b]))

  function downloadSVG() {
    if (!svgRef.current) return
    const svg = new XMLSerializer().serializeToString(svgRef.current)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'free-body-diagram.svg'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-3">
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        <svg
          ref={svgRef}
          width={CANVAS_W}
          height={CANVAS_H}
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          className="w-full h-auto"
          style={{ background: '#0f1729' }}
        >
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e2a40" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />

          {/* Supports */}
          {supports.map((sup, i) => {
            const body = bodyMap.get(sup.at)
            if (!body) return null
            const { cx } = getBodyCenter(body)
            const by = body.y + body.h
            const bx = body.x
            const bw = body.w

            if (sup.supportType === 'pin') return (
              <g key={i} color="#60a5fa">
                <polygon points={`${cx},${by} ${cx - 15},${by + 25} ${cx + 15},${by + 25}`} fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1.5" />
                <line x1={cx - 20} y1={by + 27} x2={cx + 20} y2={by + 27} stroke="#60a5fa" strokeWidth="2" />
              </g>
            )
            if (sup.supportType === 'roller') return (
              <g key={i} color="#60a5fa">
                <polygon points={`${cx},${by} ${cx - 12},${by + 12} ${cx + 12},${by + 12}`} fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                <circle cx={cx} cy={by + 18} r={6} fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                <line x1={cx - 20} y1={by + 26} x2={cx + 20} y2={by + 26} stroke="#60a5fa" strokeWidth="2" />
              </g>
            )
            return (
              <g key={i}>
                <rect x={bx - 5} y={by} width={bw + 10} height={8} fill="#1e3a5f" stroke="#60a5fa" strokeWidth="1" />
                {Array.from({ length: 5 }, (_, n) => (
                  <line key={n} x1={bx + n * 22} y1={by + 8} x2={bx - 8 + n * 22} y2={by + 20} stroke="#60a5fa" strokeWidth="1.5" />
                ))}
              </g>
            )
          })}

          {/* Bodies */}
          {bodies.map(body => {
            if (body.shape === 'block') return (
              <g key={body.id}>
                <rect x={body.x} y={body.y} width={body.w} height={body.h} fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" rx="4" />
                <text x={body.x + body.w / 2} y={body.y + body.h / 2 + 5} textAnchor="middle" fill="#93c5fd" fontSize="13" fontWeight="bold">{body.label}</text>
              </g>
            )
            if (body.shape === 'beam') return (
              <g key={body.id}>
                <rect x={body.x} y={body.y} width={body.w} height={body.h} fill="#1e3a5f" stroke="#3b82f6" strokeWidth="2" />
                <text x={body.x + body.w / 2} y={body.y - 8} textAnchor="middle" fill="#93c5fd" fontSize="12">{body.label}</text>
              </g>
            )
            return (
              <g key={body.id}>
                <circle cx={body.x + body.w / 2} cy={body.y + body.h / 2} r={8} fill="#3b82f6" />
                <text x={body.x + body.w / 2 + 12} y={body.y + body.h / 2 + 5} fill="#93c5fd" fontSize="12">{body.label}</text>
              </g>
            )
          })}

          {/* Forces */}
          {forces.map((force, i) => {
            const body = bodyMap.get(force.from)
            if (!body) return null
            const { cx, cy } = getBodyCenter(body)
            const tx = cx + force.fx
            const ty = cy + force.fy
            const angle = Math.atan2(force.fy, force.fx)
            const color = force.label.startsWith('W') || force.label.startsWith('mg') ? '#f87171' : force.label.startsWith('N') ? '#34d399' : '#fbbf24'
            return (
              <g key={i} color={color}>
                <line x1={cx} y1={cy} x2={tx} y2={ty} stroke={color} strokeWidth="2.5" />
                <ArrowHead x2={tx} y2={ty} angle={angle} />
                <text x={tx + (force.fx > 0 ? 8 : -8)} y={ty + (force.fy > 0 ? 16 : -8)} fill={color} fontSize="12" fontWeight="bold" textAnchor={force.fx > 0 ? 'start' : 'end'}>{force.label}</text>
              </g>
            )
          })}

          {/* Moments */}
          {moments.map((moment, i) => {
            const body = bodyMap.get(moment.at)
            if (!body) return null
            const { cx, cy } = getBodyCenter(body)
            const r = 30
            const sweep = moment.direction === 'ccw' ? 0 : 1
            return (
              <g key={i}>
                <path d={`M ${cx + r} ${cy} A ${r} ${r} 0 0 ${sweep} ${cx} ${cy + r}`} fill="none" stroke="#a78bfa" strokeWidth="2" />
                <text x={cx + r + 5} y={cy - 5} fill="#a78bfa" fontSize="11">{moment.label}</text>
              </g>
            )
          })}

          {/* Legend */}
          <g transform={`translate(10, ${CANVAS_H - 60})`}>
            <rect width="160" height="55" rx="4" fill="#0f1729" fillOpacity="0.8" stroke="#374151" strokeWidth="1" />
            <line x1="8" y1="14" x2="28" y2="14" stroke="#f87171" strokeWidth="2" /><text x="32" y="18" fill="#9ca3af" fontSize="10">Weight (W)</text>
            <line x1="8" y1="28" x2="28" y2="28" stroke="#34d399" strokeWidth="2" /><text x="32" y="32" fill="#9ca3af" fontSize="10">Normal Force (N)</text>
            <line x1="8" y1="42" x2="28" y2="42" stroke="#fbbf24" strokeWidth="2" /><text x="32" y="46" fill="#9ca3af" fontSize="10">Other Force</text>
          </g>
        </svg>
      </div>

      {spec.notes && (
        <p className="text-xs text-gray-500 italic">{spec.notes}</p>
      )}

      <button onClick={downloadSVG} className="btn-secondary text-xs flex items-center gap-2">
        ⬇ Download SVG
      </button>
    </div>
  )
}