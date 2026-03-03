import React, { useState } from 'react'
import type { Result } from '../../lib/schema'

interface Props { result: Result }

export default function VariablesTab({ result }: Props) {
  const [filter, setFilter] = useState('')
  const q = filter.toLowerCase()

  const knowns = result.knowns.filter(k =>
    k.name.toLowerCase().includes(q) || (k.symbol ?? '').toLowerCase().includes(q) || (k.units ?? '').toLowerCase().includes(q)
  )
  const unknowns = result.unknowns.filter(u =>
    u.name.toLowerCase().includes(q) || (u.symbol ?? '').toLowerCase().includes(q) || (u.units ?? '').toLowerCase().includes(q)
  )

  return (
    <div className="space-y-4">
      <input
        className="input-base"
        placeholder="Filter variables..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
      />

      <div>
        <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">✅ Known Variables ({knowns.length})</h3>
        <div className="space-y-2">
          {knowns.map((k, i) => (
            <div key={i} className="card flex items-start gap-3">
              {k.symbol && (
                <span className="shrink-0 w-10 text-center font-mono text-blue-300 text-sm bg-blue-900/40 rounded px-1 py-0.5">{k.symbol}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-200">{k.name}</span>
                  {k.value && <span className="badge bg-gray-700 text-gray-200">{k.value}</span>}
                  {k.units && <span className="badge bg-blue-900 text-blue-300">{k.units}</span>}
                </div>
                {k.notes && <p className="text-xs text-gray-500 mt-0.5">{k.notes}</p>}
              </div>
            </div>
          ))}
          {knowns.length === 0 && <p className="text-sm text-gray-500">No matches.</p>}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-yellow-400 uppercase tracking-wider mb-2">❓ Unknown Variables ({unknowns.length})</h3>
        <div className="space-y-2">
          {unknowns.map((u, i) => (
            <div key={i} className="card flex items-start gap-3">
              {u.symbol && (
                <span className="shrink-0 w-10 text-center font-mono text-yellow-300 text-sm bg-yellow-900/40 rounded px-1 py-0.5">{u.symbol}</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-200">{u.name}</span>
                  {u.units && <span className="badge bg-yellow-900 text-yellow-300">{u.units}</span>}
                </div>
                {u.notes && <p className="text-xs text-gray-500 mt-0.5">{u.notes}</p>}
              </div>
            </div>
          ))}
          {unknowns.length === 0 && <p className="text-sm text-gray-500">No matches.</p>}
        </div>
      </div>
    </div>
  )
}