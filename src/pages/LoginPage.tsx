import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type View = 'login' | 'forgot'

export default function LoginPage() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState<View>('login')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const err = await signIn(email, password)
    setLoading(false)
    if (err) {
      setError(err)
    } else {
      navigate('/')
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setResetError(null)
    setResetLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setResetLoading(false)
    if (error) {
      setResetError(error.message)
    } else {
      setResetSent(true)
    }
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

        <div className="card">
          {view === 'login' ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Sign in to your account</h2>

              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm text-gray-400">Password</label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot'); setResetEmail(email) }}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                    placeholder="••••••••"
                    autoComplete="current-password"
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
                  {loading && (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {loading ? 'Signing in…' : 'Sign in'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-blue-400 hover:text-blue-300">
                  Create one
                </Link>
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setView('login'); setResetSent(false); setResetError(null) }}
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4"
              >
                ← Back to sign in
              </button>

              <h2 className="text-xl font-semibold text-white mb-2">Reset your password</h2>

              {resetSent ? (
                <div className="text-center py-4">
                  <div className="text-3xl mb-3">📧</div>
                  <p className="text-green-400 font-medium">Check your email</p>
                  <p className="text-gray-400 text-sm mt-2">
                    We sent a password reset link to <span className="text-white">{resetEmail}</span>
                  </p>
                  <button
                    onClick={() => { setView('login'); setResetSent(false) }}
                    className="mt-4 text-sm text-blue-400 hover:text-blue-300"
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    Enter your email and we'll send you a reset link.
                  </p>
                  <form onSubmit={handleReset} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>

                    {resetError && (
                      <p className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                        {resetError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
                    >
                      {resetLoading && (
                        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {resetLoading ? 'Sending…' : 'Send reset link'}
                    </button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
