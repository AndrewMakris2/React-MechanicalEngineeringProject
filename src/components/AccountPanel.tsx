import React, { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onClose: () => void
}

export default function AccountPanel({ onClose }: Props) {
  const { user, settings, groqApiKey, updateApiKey, updateMode, signOut } = useAuth()
  const [newKey, setNewKey] = useState(groqApiKey)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [keyError, setKeyError] = useState<string | null>(null)
  const [keySaved, setKeySaved] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  async function handleSaveKey(e: React.FormEvent) {
    e.preventDefault()
    setKeyError(null)
    setKeySaved(false)
    if (newKey.trim() && !newKey.trim().startsWith('gsk_')) {
      setKeyError('Groq API keys start with "gsk_".')
      return
    }
    setSaving(true)
    const err = await updateApiKey(newKey.trim())
    setSaving(false)
    if (err) {
      setKeyError(err)
    } else {
      setKeySaved(true)
      setTimeout(() => setKeySaved(false), 2500)
    }
  }

  async function handleTestKey() {
    setTestResult(null)
    setTesting(true)
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${newKey.trim()}` },
      })
      if (res.ok) {
        setTestResult('✓ Key is valid')
      } else {
        const data = await res.json().catch(() => ({}))
        setTestResult(`Invalid key: ${data?.error?.message ?? `HTTP ${res.status}`}`)
      }
    } catch {
      setTestResult('Could not reach Groq — check your connection.')
    }
    setTesting(false)
  }

  async function handleSignOut() {
    await signOut()
    onClose()
  }

  const maskedEmail = user?.email ?? ''

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-lg">
              {maskedEmail[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{maskedEmail}</p>
              <p className="text-gray-500 text-xs">MechStudy account</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Mode</label>
            <div className="flex gap-2">
              {(['api', 'mock'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => updateMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    settings?.llm_mode === m
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {m === 'api' ? 'Live API' : 'Mock (Demo)'}
                </button>
              ))}
            </div>
            {settings?.llm_mode === 'mock' && (
              <p className="text-xs text-purple-400 mt-1">Mock mode uses sample data — no API key needed.</p>
            )}
          </div>

          {/* API Key */}
          <form onSubmit={handleSaveKey} className="space-y-3">
            <label className="block text-sm text-gray-400">
              Groq API Key{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                (get one free →)
              </a>
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={newKey}
                onChange={e => { setNewKey(e.target.value); setTestResult(null); setKeySaved(false) }}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-16 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
                placeholder="gsk_..."
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 text-xs"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>

            {keyError && <p className="text-red-400 text-xs">{keyError}</p>}
            {testResult && (
              <p className={`text-xs ${testResult.startsWith('✓') ? 'text-green-400' : 'text-red-400'}`}>
                {testResult}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={testing || !newKey.trim()}
                className="btn-secondary text-xs flex-1 py-2"
              >
                {testing ? 'Testing…' : 'Test key'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs flex-1 py-2"
              >
                {saving ? 'Saving…' : keySaved ? '✓ Saved!' : 'Save key'}
              </button>
            </div>
          </form>

          {/* Sign out */}
          <div className="border-t border-gray-800 pt-4">
            <button
              onClick={handleSignOut}
              className="w-full text-sm text-red-400 hover:text-red-300 border border-red-900/50 hover:border-red-800 rounded-lg py-2 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
