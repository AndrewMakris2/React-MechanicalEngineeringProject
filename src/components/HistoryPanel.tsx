import React, { useState } from 'react'
import type { HistoryEntry } from '../hooks/useProblemHistory'

const DOMAIN_ICONS: Record<string, string> = {
  statics: '⚖️',
  dynamics: '🚀',
  thermo: '🔥',
  fluids: '💧',
  unknown: '❓',
}

const DOMAIN_COLORS: Record<string, string> = {
  statics:  'bg-blue-900 text-blue-300',
  dynamics: 'bg-purple-900 text-purple-300',
  thermo:   'bg-orange-900 text-orange-300',
  fluids:   'bg-cyan-900 text-cyan-300',
  unknown:  'bg-gray-800 text-gray-300',
}

interface Props {
  history: HistoryEntry[]
  onSelect: (entry: HistoryEntry) => void
  onRemove: (id: string) => void
  onClear: () => void
  onClose: () => void
}

export default function HistoryPanel({ history, onSelect, onRemove, onClear, onClose }: Props) {
  const [search, setSearch] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = history.filter(e =>
    e.problemText.toLowerCase().includes(search.toLowerCase()) ||
    e.subject.toLowerCase().includes(search.toLowerCase()) ||
    e.result.detectedDomain.toLowerCase().includes(search.toLowerCase())
  )

  function formatDate(ts: number) {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">📚 Problem History</h2>
            <p className="text-xs text-gray-400 mt-0.5">{history.length} problem{history.length !== 1 ? 's' : ''} saved</p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirmClear) {
                    onClear()
                    setConfirmClear(false)
                  } else {
                    setConfirmClear(true)
                    setTimeout(() => setConfirmClear(false), 3000)
                  }
                }}
                className="btn-secondary text-xs text-red-400 hover:text-red-300"
              >
                {confirmClear ? '⚠️ Confirm Clear' : '🗑 Clear All'}
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700 shrink-0">
          <input
            className="input-base"
            placeholder="Search problems..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-4xl mb-3">📭</p>
              <p className="text-gray-400 text-sm">
                {history.length === 0 ? 'No problems analyzed yet.' : 'No results match your search.'}
              </p>
            </div>
          ) : (
            filtered.map(entry => (
              <div
                key={entry.id}
                className="card hover:border-blue-600 transition-colors cursor-pointer group"
                onClick={() => { onSelect(entry); onClose() }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Domain badge + timestamp */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`badge ${DOMAIN_COLORS[entry.result.detectedDomain]}`}>
                        {DOMAIN_ICONS[entry.result.detectedDomain]} {entry.result.detectedDomain}
                      </span>
                      <span className="text-xs text-gray-500">{formatDate(entry.timestamp)}</span>
                    </div>

                    {/* Problem text preview */}
                    <p className="text-sm text-gray-300 line-clamp-2 leading-relaxed">
                      {entry.problemText}
                    </p>

                    {/* Summary */}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {entry.result.problemSummary}
                    </p>

                    {/* Stats */}
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs text-blue-400">{entry.result.knowns.length} knowns</span>
                      <span className="text-xs text-yellow-400">{entry.result.unknowns.length} unknowns</span>
                      <span className="text-xs text-green-400">{entry.result.governingEquations.length} equations</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); onSelect(entry); onClose() }}
                      className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Load
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); onRemove(entry.id) }}
                      className="text-xs bg-gray-700 hover:bg-red-800 text-gray-300 px-2 py-1 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}