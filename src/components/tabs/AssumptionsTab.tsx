import React from 'react'
import type { Result } from '../../lib/schema'

interface Props { result: Result }

export default function AssumptionsTab({ result }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{result.assumptions.length} assumption{result.assumptions.length !== 1 ? 's' : ''} identified</p>
      {result.assumptions.map((a, i) => (
        <div key={i} className="card border-l-2 border-l-purple-500">
          <div className="flex items-start gap-2">
            <span className="shrink-0 w-6 h-6 rounded-full bg-purple-900 text-purple-300 text-xs flex items-center justify-center font-bold">{i + 1}</span>
            <div>
              <p className="text-sm font-medium text-gray-200">{a.assumption}</p>
              {a.whyItMatters && (
                <p className="text-xs text-gray-400 mt-1">
                  <span className="text-purple-400 font-medium">Why it matters: </span>{a.whyItMatters}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}