import React from 'react'
import type { Result } from '../../lib/schema'
import DiagramRenderer from '../DiagramRenderer'

interface Props { result: Result }

export default function DiagramTab({ result }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {result.diagramSpec.type === 'fbd'
          ? `Free Body Diagram — ${result.diagramSpec.elements.length} elements`
          : 'No diagram generated for this problem type.'}
      </p>
      <DiagramRenderer spec={result.diagramSpec} />
    </div>
  )
}