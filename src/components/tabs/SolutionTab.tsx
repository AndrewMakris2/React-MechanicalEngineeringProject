import React from 'react'
import type { Result } from '../../lib/schema'

interface Props { result: Result }

export default function SolutionTab({ result }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{result.solutionOutline.length}-step solution outline</p>
      {result.solutionOutline.map((step) => (
        <div key={step.step} className="card flex gap-4">
          <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">{step.step}</div>
          <div>
            <p className="text-sm font-semibold text-gray-200 mb-1">{step.title}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{step.details}</p>
          </div>
        </div>
      ))}
    </div>
  )
}