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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl"
        style={{
          background: 'rgba(8, 14, 28, 0.92)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none transition-colors">✕</button>
        </div>

        <div className="p-6 space-y-6">
          {/* User info */}
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                boxShadow: '0 0 16px rgba(59,130,246,0.4)',
              }}
            >
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
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    settings?.llm_mode === m
                      ? 'text-blue-300'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={settings?.llm_mode === m ? {
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
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
                className="input-base pr-16 font-mono"
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
          <div className="border-t pt-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
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
