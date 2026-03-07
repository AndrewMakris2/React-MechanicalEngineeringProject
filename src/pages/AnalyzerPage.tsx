import React, { useState, useRef } from 'react'
import InputPanel from '../components/InputPanel'
import ResultPanel from '../components/ResultPanel'
import { useAnalysis } from '../hooks/useAnalysis'
import { useProblemHistory } from '../hooks/useProblemHistory'
import HistoryPanel from '../components/HistoryPanel'
import type { LLMConfig } from '../lib/llmService'
import type { Result } from '../lib/schema'

interface Props { config: LLMConfig }

export default function AnalyzerPage({ config }: Props) {
  const [showHistory, setShowHistory] = useState(false)
  const [currentProblem, setCurrentProblem] = useState('')
  const [currentSubject, setCurrentSubject] = useState('auto')
  const [injectProblem, setInjectProblem] = useState('')
  const { result, loading, error, run, clear } = useAnalysis(config)
  const { history, addEntry, removeEntry, clearHistory } = useProblemHistory()
  const hasAddedRef = useRef<string | null>(null)

  async function handleAnalyze(inputs: {
    problemText: string
    subject: string
    exampleId?: string
    allowFullSolution: boolean
    generateDiagram: boolean
    runUnitsCheck: boolean
  }) {
    setCurrentProblem(inputs.problemText)
    setCurrentSubject(inputs.subject)
    await run(inputs)
  }

  React.useEffect(() => {
    if (result && currentProblem && hasAddedRef.current !== currentProblem) {
      hasAddedRef.current = currentProblem
      addEntry(currentProblem, currentSubject, result)
    }
  }, [result])

  function handleSelectHistory(entry: { problemText: string; subject: string; result: Result }) {
    setCurrentProblem(entry.problemText)
    setCurrentSubject(entry.subject)
    setInjectProblem(entry.problemText)
  }

  function handleTryProblem(problem: string) {
    setInjectProblem(problem)
    setCurrentProblem(problem)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🔬 Problem Analyzer</h1>
          <p className="text-xs text-gray-400 mt-0.5">Paste any engineering problem for a full structured analysis</p>
        </div>
        <button
          onClick={() => setShowHistory(true)}
          className="btn-secondary text-xs flex items-center gap-1"
        >
          📚 History
          {history.length > 0 && (
            <span className="ml-1 badge bg-blue-900 text-blue-300">{history.length}</span>
          )}
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <InputPanel
            config={config}
            onAnalyze={handleAnalyze}
            onClear={clear}
            onOpenSettings={() => {}}
            loading={loading}
            initialProblem={injectProblem}
            initialSubject={currentSubject}
          />
        </div>
        <div className="card">
          <ResultPanel
            result={result}
            loading={loading}
            error={error}
            config={config}
            onTryProblem={handleTryProblem}
          />
        </div>
      </div>

      {showHistory && (
        <HistoryPanel
          history={history}
          onSelect={handleSelectHistory}
          onRemove={removeEntry}
          onClear={clearHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}