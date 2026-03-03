import React from 'react'
import type { Result } from '../../lib/schema'
import { runUnitsCheck, getDimensionLabel } from '../../lib/unitsChecker'

const SEVERITY_COLORS = {
  low:    'bg-yellow-900/50 border-yellow-700 text-yellow-300',
  medium: 'bg-orange-900/50 border-orange-700 text-orange-300',
  high:   'bg-red-900/50 border-red-700 text-red-300',
}

const SEVERITY_ICONS = { low: '⚠️', medium: '🔶', high: '🚨' }

interface Props { result: Result }

export default function UnitsTab({ result }: Props) {
  const check = runUnitsCheck(result.knowns, result.unknowns, result.detectedDomain)
  const allIssues = [...result.units.issues, ...check.issues]
    .filter((v, i, a) => a.findIndex(x => x.issue === v.issue) === i)

  return (
    <div className="space-y-4">
      {/* Parsed Units Table */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Parsed Units</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-gray-500 border-b border-gray-700">
                <th className="text-left py-1 pr-3">Quantity</th>
                <th className="text-left py-1 pr-3">Value</th>
                <th className="text-left py-1 pr-3">Units</th>
                <th className="text-left py-1">Dimension</th>
              </tr>
            </thead>
            <tbody>
              {check.parsed.map((p, i) => (
                <tr key={i} className="border-b border-gray-800">
                  <td className="py-1.5 pr-3 text-gray-300">{p.quantity}</td>
                  <td className="py-1.5 pr-3 text-gray-400">{p.value ?? '—'}</td>
                  <td className="py-1.5 pr-3 font-mono text-blue-300">{p.units ?? '—'}</td>
                  <td className="py-1.5">
                    <span className={`badge ${p.known ? 'bg-gray-700 text-gray-300' : 'bg-red-900 text-red-300'}`}>
                      {getDimensionLabel(p.dimension)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Equation Checks */}
      {check.equationChecks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Equation Dimensional Checks</h3>
          <div className="space-y-2">
            {check.equationChecks.map((ec, i) => (
              <div key={i} className="card flex items-start gap-3">
                <span className="text-lg">{ec.status === 'ok' ? '✅' : ec.status === 'warning' ? '⚠️' : '❔'}</span>
                <div>
                  <p className="text-sm font-mono text-green-300">{ec.equation}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{ec.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issues */}
      <div>
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Issues ({allIssues.length})
        </h3>
        {allIssues.length === 0 ? (
          <div className="card text-center text-green-400 text-sm">✅ No units issues detected</div>
        ) : (
          <div className="space-y-2">
            {allIssues.map((issue, i) => (
              <div key={i} className={`card border ${SEVERITY_COLORS[issue.severity]}`}>
                <div className="flex items-start gap-2 mb-1">
                  <span>{SEVERITY_ICONS[issue.severity]}</span>
                  <p className="text-sm font-medium">{issue.issue}</p>
                </div>
                <p className="text-xs opacity-80 ml-6">{issue.tip}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}