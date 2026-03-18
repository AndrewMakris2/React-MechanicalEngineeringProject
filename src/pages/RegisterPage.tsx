import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

type Step = 'account' | 'apikey'

export default function RegisterPage() {
  const { signUp, updateApiKey, signIn } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const err = await signUp(email, password)
    if (err) {
      setError(err)
      setLoading(false)
      return
    }
    // Sign in immediately so the user is authenticated for the next step
    await signIn(email, password)
    setLoading(false)
    setStep('apikey')
  }

  async function handleApiKey(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!apiKey.trim().startsWith('gsk_')) {
      setError('Groq API keys start with "gsk_". Please check your key.')
      return
    }
    setLoading(true)
    const err = await updateApiKey(apiKey.trim())
    setLoading(false)
    if (err) {
      setError(err)
      return
    }
    navigate('/')
  }

  function handleSkip() {
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-4xl">⚙️</span>
          <h1 className="text-2xl font-bold text-white mt-2">MechStudy</h1>
          <p className="text-gray-400 text-sm mt-1">Engineering Study Platform</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6 justify-center">
          <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'account' ? 'text-blue-400' : 'text-green-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'account' ? 'bg-blue-600 text-white' : 'bg-green-700 text-white'}`}>
              {step === 'account' ? '1' : '✓'}
            </span>
            Account
          </div>
          <div className="flex-1 h-px bg-gray-700 max-w-12" />
          <div className={`flex items-center gap-1.5 text-sm font-medium ${step === 'apikey' ? 'text-blue-400' : 'text-gray-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'apikey' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
              2
            </span>
            API Key
          </div>
        </div>

        <div className="card">
          {step === 'account' ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>
              <form onSubmit={handleAccount} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm password</label>
                  <input
                    type="password"
                    required
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
                >
                  {loading && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Creating account…' : 'Continue'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-400 hover:text-blue-300">Sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Add your Groq API key</h2>
              <p className="text-gray-400 text-sm mb-6">
                MechStudy uses your own Groq key so your usage stays in your account.{' '}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Get a free key →
                </a>
              </p>

              <form onSubmit={handleApiKey} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Groq API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={e => setApiKey(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 pr-20 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
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
                  <p className="text-xs text-gray-500 mt-1">Your key is stored securely and never shared.</p>
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !apiKey.trim()}
                  className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
                >
                  {loading && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Saving…' : 'Save & get started'}
                </button>

                <button
                  type="button"
                  onClick={handleSkip}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-400 py-1"
                >
                  Skip for now (you can add it later in Account settings)
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
