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
  const [activePanel, setActivePanel] = useState<'input' | 'result'>('input')
  const { result, loading, error, run, clear, restore } = useAnalysis(config)
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
    setActivePanel('result')
    await run(inputs)
  }

  React.useEffect(() => {
    if (result && currentProblem && hasAddedRef.current !== currentProblem) {
      hasAddedRef.current = currentProblem
      addEntry(currentProblem, currentSubject, result)
    }
  }, [result, currentProblem, currentSubject, addEntry])

  function handleSelectHistory(entry: { problemText: string; subject: string; result: Result }) {
    hasAddedRef.current = entry.problemText
    setCurrentProblem(entry.problemText)
    setCurrentSubject(entry.subject)
    setInjectProblem(entry.problemText)
    restore(entry.result)
    setActivePanel('result')
  }

  function handleTryProblem(problem: string) {
    setInjectProblem(problem)
    setCurrentProblem(problem)
    setActivePanel('input')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">🔬 Problem Analyzer</h1>
          <p className="page-sub">Paste any engineering problem for a full structured analysis</p>
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

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setActivePanel('input')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activePanel === 'input'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          📋 Problem
        </button>
        <button
          onClick={() => setActivePanel('result')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activePanel === 'result'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          📊 Results
          {result && <span className="ml-1 w-2 h-2 rounded-full bg-green-400 inline-block" />}
        </button>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        <div className={`card ${activePanel === 'result' ? 'hidden lg:block' : ''}`}>
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
        <div className={`card ${activePanel === 'input' ? 'hidden lg:block' : ''}`}>
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