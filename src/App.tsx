import React, { useState, useRef } from 'react'
import InputPanel from './components/InputPanel'
import ResultPanel from './components/ResultPanel'
import SettingsPanel from './components/SettingsPanel'
import HistoryPanel from './components/HistoryPanel'
import { useAnalysis } from './hooks/useAnalysis'
import { loadConfig } from './lib/llmService'
import type { LLMConfig } from './lib/llmService'
import { useProblemHistory } from './hooks/useProblemHistory'
import type { Result } from './lib/schema'

export default function App() {
  const [config, setConfig] = useState<LLMConfig>(loadConfig)
  const [showSettings, setShowSettings] = useState(false)
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
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">⚙️ Engineering Problem Translator</h1>
            <p className="text-xs text-gray-400 mt-0.5">Paste a problem → get structured analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              📚 History
              {history.length > 0 && (
                <span className="ml-1 badge bg-blue-900 text-blue-300">{history.length}</span>
              )}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="btn-secondary text-xs flex items-center gap-1"
            >
              ⚙️ Settings
              <span className={`ml-1 badge ${config.mode === 'mock' ? 'bg-purple-900 text-purple-300' : 'bg-green-900 text-green-300'}`}>
                {config.mode.toUpperCase()}
              </span>
            </button>
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <InputPanel
              config={config}
              onAnalyze={handleAnalyze}
              onClear={clear}
              onOpenSettings={() => setShowSettings(true)}
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
      </div>

      {showSettings && (
        <SettingsPanel
          config={config}
          onChange={setConfig}
          onClose={() => setShowSettings(false)}
        />
      )}

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