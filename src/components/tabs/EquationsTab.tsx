import React from 'react'
import type { Result } from '../../lib/schema'

interface Props { result: Result }

export default function EquationsTab({ result }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{result.governingEquations.length} equation{result.governingEquations.length !== 1 ? 's' : ''} identified</p>
      {result.governingEquations.map((eq, i) => (
        <div key={i} className="card border-l-2 border-l-green-500">
          <div className="font-mono text-sm text-green-300 bg-gray-800 rounded px-3 py-2 mb-2">{eq.equation}</div>
          {eq.whenToUse && <p className="text-xs text-gray-400 mb-2"><span className="text-green-400 font-medium">When to use: </span>{eq.whenToUse}</p>}
          <div className="flex flex-wrap gap-1">
            {eq.variables.map((v, j) => (
              <span key={j} className="badge bg-gray-700 text-gray-300 font-mono">{v}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}