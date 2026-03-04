import React, { useState, useEffect } from 'react'
import { EXAMPLES } from '../lib/mockData'
import type { LLMConfig } from '../lib/llmService'
import FileUpload from './FileUpload'

interface Props {
  config: LLMConfig
  onAnalyze: (inputs: {
    problemText: string
    subject: string
    exampleId?: string
    allowFullSolution: boolean
    generateDiagram: boolean
    runUnitsCheck: boolean
  }) => void
  onClear: () => void
  onOpenSettings: () => void
  loading: boolean
  initialProblem?: string
  initialSubject?: string
}

export default function InputPanel({
  config,
  onAnalyze,
  onClear,
  onOpenSettings,
  loading,
  initialProblem = '',
  initialSubject = 'auto',
}: Props) {
  const [problemText, setProblemText] = useState(initialProblem)
  const [subject, setSubject] = useState(initialSubject)
  const [allowFullSolution, setAllowFullSolution] = useState(false)
  const [generateDiagram, setGenerateDiagram] = useState(true)
  const [runUnitsCheck, setRunUnitsCheck] = useState(true)
  const [exampleId, setExampleId] = useState<string | undefined>()
  const [showUpload, setShowUpload] = useState(false)

  useEffect(() => {
    if (initialProblem) setProblemText(initialProblem)
    if (initialSubject) setSubject(initialSubject)
  }, [initialProblem, initialSubject])

  function handleExample(id: string) {
    const ex = EXAMPLES.find(e => e.id === id)
    if (!ex) return
    setProblemText(ex.problem)
    setSubject(ex.subject)
    setExampleId(ex.id)
  }

  function handleAnalyze() {
    onAnalyze({ problemText, subject, exampleId, allowFullSolution, generateDiagram, runUnitsCheck })
  }

  function handleClear() {
    setProblemText('')
    setSubject('auto')
    setExampleId(undefined)
    onClear()
  }

  function handleExtracted(text: string) {
    setProblemText(text)
    setExampleId(undefined)
    setShowUpload(false)
  }

  return (
    <div className="space-y-4">

      {/* Try Example */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Try an Example</label>
        <select
          className="input-base"
          value={exampleId ?? ''}
          onChange={e => handleExample(e.target.value)}
        >
          <option value="">— Select example —</option>
          {EXAMPLES.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.label}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="text-xs text-gray-400 block mb-1">Subject</label>
        <select
          className="input-base"
          value={subject}
          onChange={e => { setSubject(e.target.value); setExampleId(undefined) }}
        >
          <option value="auto">🔍 Auto-detect</option>
          <option value="statics">⚖️ Statics</option>
          <option value="dynamics">🚀 Dynamics</option>
          <option value="thermo">🔥 Thermodynamics</option>
          <option value="fluids">💧 Fluids</option>
        </select>
      </div>

      {/* Upload Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">Problem Statement</label>
        <button
          onClick={() => setShowUpload(s => !s)}
          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
            showUpload
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
          }`}
        >
          📎 {showUpload ? 'Hide Upload' : 'Upload Photo/PDF'}
        </button>
      </div>

      {/* File Upload */}
      {showUpload && (
        <FileUpload
          endpointUrl={config.endpointUrl}
          onExtracted={handleExtracted}
          disabled={loading}
        />
      )}

      {/* Problem Text */}
      <textarea
        className="input-base resize-none"
        rows={8}
        placeholder="Paste your engineering problem here, or upload a photo/PDF above..."
        value={problemText}
        onChange={e => { setProblemText(e.target.value); setExampleId(undefined) }}
      />

      {/* Toggles */}
      <div className="card space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Options</p>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={allowFullSolution}
            onChange={e => setAllowFullSolution(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
          <span>Allow full numeric solution</span>
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={generateDiagram}
            onChange={e => setGenerateDiagram(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
          <span>Generate Free Body Diagram</span>
        </label>
        <label className="toggle-label">
          <input
            type="checkbox"
            checked={runUnitsCheck}
            onChange={e => setRunUnitsCheck(e.target.checked)}
            className="w-4 h-4 rounded accent-blue-500"
          />
          <span>Run units check</span>
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAnalyze}
          disabled={loading || !problemText.trim()}
          className="btn-primary flex-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing...
            </>
          ) : '🔍 Analyze'}
        </button>
        <button onClick={handleClear} className="btn-secondary">Clear</button>
      </div>
    </div>
  )
}