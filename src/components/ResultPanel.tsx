import React, { useState } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'
import ConfidencePanel from './ConfidenceBar'
import SummaryTab from './tabs/SummaryTab'
import VariablesTab from './tabs/VariablesTab'
import AssumptionsTab from './tabs/AssumptionsTab'
import EquationsTab from './tabs/EquationsTab'
import SolutionTab from './tabs/SolutionTab'
import MistakesTab from './tabs/MistakesTab'
import UnitsTab from './tabs/UnitsTab'
import DiagramTab from './tabs/DiagramTab'
import RawJsonTab from './tabs/RawJsonTab'
import SimilarProblems from './SimilarProblems'
import { useSimilarProblems } from '../hooks/useSimilarProblems'

const TABS = [
  { id: 'summary',     label: '📋 Summary' },
  { id: 'variables',   label: '📊 Variables' },
  { id: 'assumptions', label: '💡 Assumptions' },
  { id: 'equations',   label: '📐 Equations' },
  { id: 'solution',    label: '🪜 Solution' },
  { id: 'mistakes',    label: '⚠️ Mistakes' },
  { id: 'units',       label: '📏 Units' },
  { id: 'diagram',     label: '🖼 Diagram' },
  { id: 'similar',     label: '🔄 Similar' },
  { id: 'raw',         label: '{ } JSON' },
]

interface Props {
  result: Result | null
  loading: boolean
  error: string | null
  config: LLMConfig
  onTryProblem: (problem: string) => void
}

export default function ResultPanel({ result, loading, error, config, onTryProblem }: Props) {
  const [activeTab, setActiveTab] = useState('summary')
  const { problems, loading: simLoading, error: simError, generate, clear } = useSimilarProblems(config)

  function handleGenerate() {
    if (!result) return
    generate(result.problemSummary, result.detectedDomain)
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <svg className="animate-spin h-10 w-10 text-blue-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        <p className="text-gray-400 text-sm">Analyzing problem...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-700 bg-red-950/30">
        <h3 className="text-red-400 font-semibold mb-2">🚨 Error</h3>
        <p className="text-red-300 text-sm">{error}</p>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3 text-center">
        <div className="text-6xl">⚙️</div>
        <p className="text-gray-400 text-sm max-w-xs">
          Paste an engineering problem on the left and click <strong className="text-gray-300">Analyze</strong> to get started.
        </p>
        <p className="text-xs text-gray-600">Running in MOCK mode by default — no API key needed.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ConfidencePanel confidence={result.confidence} />

      {/* Tab Bar */}
      <div className="overflow-x-auto">
        <div className="flex border-b border-gray-700 gap-0.5 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : 'tab-btn-inactive'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'summary'     && <SummaryTab result={result} />}
        {activeTab === 'variables'   && <VariablesTab result={result} />}
        {activeTab === 'assumptions' && <AssumptionsTab result={result} />}
        {activeTab === 'equations'   && <EquationsTab result={result} />}
        {activeTab === 'solution'    && <SolutionTab result={result} />}
        {activeTab === 'mistakes'    && <MistakesTab result={result} />}
        {activeTab === 'units'       && <UnitsTab result={result} />}
        {activeTab === 'diagram'     && <DiagramTab result={result} />}
        {activeTab === 'raw'         && <RawJsonTab result={result} />}
        {activeTab === 'similar'     && (
          <SimilarProblems
            problems={problems}
            loading={simLoading}
            error={simError}
            onGenerate={handleGenerate}
            onTryProblem={onTryProblem}
            hasResult={!!result}
          />
        )}
      </div>
    </div>
  )
}