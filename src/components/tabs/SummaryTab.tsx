import React from 'react'
import type { Result } from '../../lib/schema'

const DOMAIN_COLORS: Record<string, string> = {
  statics:  'bg-blue-900 text-blue-300 border-blue-700',
  dynamics: 'bg-purple-900 text-purple-300 border-purple-700',
  thermo:   'bg-orange-900 text-orange-300 border-orange-700',
  fluids:   'bg-cyan-900 text-cyan-300 border-cyan-700',
  unknown:  'bg-gray-800 text-gray-300 border-gray-600',
}

const DOMAIN_ICONS: Record<string, string> = {
  statics: '⚖️', dynamics: '🚀', thermo: '🔥', fluids: '💧', unknown: '❓',
}

interface Props { result: Result }

export default function SummaryTab({ result }: Props) {
  const domainClass = DOMAIN_COLORS[result.detectedDomain]
  const icon = DOMAIN_ICONS[result.detectedDomain]

  return (
    <div className="space-y-4">
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold border ${domainClass}`}>
        <span>{icon}</span>
        <span>{result.detectedDomain.charAt(0).toUpperCase() + result.detectedDomain.slice(1)}</span>
      </div>

      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Problem Summary</h3>
        <p className="text-gray-200 text-sm leading-relaxed">{result.problemSummary}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Known Variables</p>
          <p className="text-2xl font-bold text-blue-400">{result.knowns.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Unknown Variables</p>
          <p className="text-2xl font-bold text-yellow-400">{result.unknowns.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Governing Equations</p>
          <p className="text-2xl font-bold text-green-400">{result.governingEquations.length}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-400 mb-1">Solution Steps</p>
          <p className="text-2xl font-bold text-purple-400">{result.solutionOutline.length}</p>
        </div>
      </div>

      {result.units.issues.length > 0 && (
        <div className="card border-yellow-700">
          <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">⚠️ Units Issues Detected</h3>
          <ul className="space-y-1">
            {result.units.issues.map((issue, i) => (
              <li key={i} className="text-xs text-gray-300">• {issue.issue}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}