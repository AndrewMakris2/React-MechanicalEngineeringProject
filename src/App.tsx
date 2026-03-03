import React, { useState } from 'react'
import InputPanel from './components/InputPanel'
import ResultPanel from './components/ResultPanel'
import SettingsPanel from './components/SettingsPanel'
import { useAnalysis } from './hooks/useAnalysis'
import { loadConfig } from './lib/llmService'
import type { LLMConfig } from './lib/llmService'

export default function App() {
  const [config, setConfig] = useState<LLMConfig>(loadConfig)
  const [showSettings, setShowSettings] = useState(false)
  const { result, loading, error, run, clear } = useAnalysis(config)

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Input */}
          <div className="card">
            <InputPanel
              config={config}
              onAnalyze={run}
              onClear={clear}
              onOpenSettings={() => setShowSettings(true)}
              loading={loading}
            />
          </div>

          {/* Right: Results */}
          <div className="card">
            <ResultPanel result={result} loading={loading} error={error} />
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
    </div>
  )
}