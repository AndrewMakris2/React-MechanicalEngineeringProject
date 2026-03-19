import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  // Supabase appends #access_token=...&type=recovery to the URL.
  // onAuthStateChange fires with event PASSWORD_RECOVERY once the token is consumed.
  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: '#060c18' }}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 55% at 25% 30%, rgba(59,130,246,0.09) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 75% 70%, rgba(99,102,241,0.07) 0%, transparent 60%)',
      }} />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', boxShadow: '0 0 30px rgba(59,130,246,0.15)' }}>
            <span className="text-2xl">⚙️</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MechStudy</h1>
          <p className="text-gray-500 text-sm mt-1">Engineering Study Platform</p>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-white mb-2">Set a new password</h2>

          {!ready ? (
            <div className="text-center py-6">
              <span className="inline-block w-6 h-6 border-2 border-blue-600/30 border-t-blue-500 rounded-full animate-spin mb-3" />
              <p className="text-gray-400 text-sm">Verifying reset link…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">New password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Confirm new password</label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  className="input-base"
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
                {loading && (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

