import React, { useState } from 'react'
import type { Result } from '../../lib/schema'

interface Props { result: Result }

export default function RawJsonTab({ result }: Props) {
  const [copied, setCopied] = useState(false)
  const json = JSON.stringify(result, null, 2)

  function copy() {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Raw validated JSON output</p>
        <button onClick={copy} className="btn-secondary text-xs">{copied ? '✓ Copied!' : '📋 Copy'}</button>
      </div>
      <pre className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-xs text-green-300 overflow-auto max-h-[500px] font-mono leading-relaxed">
        {json}
      </pre>
    </div>
  )
}