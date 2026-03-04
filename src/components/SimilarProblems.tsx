import React, { useState } from 'react'
import type { SimilarProblem } from '../hooks/useSimilarProblems'

const DIFFICULTY_CONFIG = {
  easier: {
    label: '🟢 Easier',
    color: 'border-green-700 bg-green-900/20',
    badge: 'bg-green-900 text-green-300',
    btn: 'bg-green-700 hover:bg-green-600',
  },
  similar: {
    label: '🟡 Similar',
    color: 'border-yellow-700 bg-yellow-900/20',
    badge: 'bg-yellow-900 text-yellow-300',
    btn: 'bg-yellow-700 hover:bg-yellow-600',
  },
  harder: {
    label: '🔴 Harder',
    color: 'border-red-700 bg-red-900/20',
    badge: 'bg-red-900 text-red-300',
    btn: 'bg-red-700 hover:bg-red-600',
  },
}

interface Props {
  problems: SimilarProblem[]
  loading: boolean
  error: string | null
  onGenerate: () => void
  onTryProblem: (problem: string) => void
  hasResult: boolean
}

export default function SimilarProblems({
  problems,
  loading,
  error,
  onGenerate,
  onTryProblem,
  hasResult,
}: Props) {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)

  if (!hasResult) return null

  function copyProblem(problem: string, idx: number) {
    navigator.clipboard.writeText(problem)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-200">🔄 Similar Problems</h3>
          <p className="text-xs text-gray-500 mt-0.5">Practice with variations at different difficulty levels</p>
        </div>
        <button
          onClick={onGenerate}
          disabled={loading}
          className="btn-primary text-xs flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating...
            </>
          ) : problems.length > 0 ? '🔄 Regenerate' : '✨ Generate'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="card border-red-700 bg-red-950/30">
          <p className="text-red-300 text-xs">{error}</p>
        </div>
      )}

      {/* Problems */}
      {problems.length > 0 && (
        <div className="space-y-3">
          {problems.map((p, i) => {
            const config = DIFFICULTY_CONFIG[p.difficulty] ?? DIFFICULTY_CONFIG.similar
            return (
              <div key={i} className={`card border ${config.color}`}>
                {/* Difficulty badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge ${config.badge} text-xs font-semibold`}>
                    {config.label}
                  </span>
                </div>

                {/* What's new */}
                <p className="text-xs text-gray-400 italic mb-2">
                  💬 {p.whatsNew}
                </p>

                {/* Problem text */}
                <p className="text-sm text-gray-200 leading-relaxed mb-3">
                  {p.problem}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onTryProblem(p.problem)}
                    className={`${config.btn} text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex-1`}
                  >
                    🔍 Analyze This Problem
                  </button>
                  <button
                    onClick={() => copyProblem(p.problem, i)}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    {copiedIdx === i ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && problems.length === 0 && !error && (
        <div className="border border-dashed border-gray-700 rounded-xl p-6 text-center">
          <p className="text-3xl mb-2">🔄</p>
          <p className="text-sm text-gray-400">Click Generate to get 3 similar problems</p>
          <p className="text-xs text-gray-600 mt-1">Easier, similar difficulty, and harder variations</p>
        </div>
      )}
    </div>
  )
}