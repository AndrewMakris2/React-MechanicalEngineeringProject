import React, { useState } from 'react'
import { saveConfig } from '../lib/llmService'
import type { LLMConfig } from '../lib/llmService'

interface Props {
  config: LLMConfig
  onChange: (c: LLMConfig) => void
  onClose: () => void
}

export default function SettingsPanel({ config, onChange, onClose }: Props) {
  const [local, setLocal] = useState<LLMConfig>(config)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    saveConfig(local)
    onChange(local)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">⚙️ LLM Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="mb-5">
          <label className="text-sm font-semibold text-gray-300 block mb-2">Analysis Mode</label>
          <div className="flex gap-2">
            {(['mock', 'api'] as const).map(m => (
              <button
                key={m}
                onClick={() => setLocal(l => ({ ...l, mode: m }))}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  local.mode === m
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                }`}
              >
                {m === 'mock' ? '🎭 MOCK (default)' : '🌐 API (real LLM)'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {local.mode === 'mock'
              ? 'Uses built-in deterministic sample data. Works offline, no API key needed.'
              : 'Calls your custom serverless endpoint. Must accept POST { prompt } and return Result JSON.'}
          </p>
        </div>

        {local.mode === 'api' && (
          <div className="mb-5">
            <label className="text-sm font-semibold text-gray-300 block mb-2">Endpoint URL</label>
            <input
              type="url"
              value={local.endpointUrl}
              onChange={e => setLocal(l => ({ ...l, endpointUrl: e.target.value }))}
              placeholder="https://your-endpoint.com/analyze"
              className="input-base"
            />
            <p className="text-xs text-gray-500 mt-1">
              Receives <code className="text-blue-400">{'{ prompt: string }'}</code> and must return <code className="text-blue-400">{'{ result: Result }'}</code> or direct <code className="text-blue-400">Result</code>.
            </p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1">
            {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  )
}