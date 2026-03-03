import React from 'react'
import type { Result } from '../../lib/schema'

interface Props { result: Result }

export default function MistakesTab({ result }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">{result.commonMistakes.length} common mistake{result.commonMistakes.length !== 1 ? 's' : ''} identified</p>
      {result.commonMistakes.map((m, i) => (
        <div key={i} className="card border-l-2 border-l-red-500">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-red-400 text-lg leading-none">✗</span>
            <p className="text-sm font-medium text-red-300">{m.mistake}</p>
          </div>
          <div className="flex items-start gap-2 ml-6">
            <span className="text-green-400 text-lg leading-none">✓</span>
            <p className="text-xs text-green-300">{m.avoidanceTip}</p>
          </div>
        </div>
      ))}
    </div>
  )
}