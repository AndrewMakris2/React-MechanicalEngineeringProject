import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserSettings } from '../lib/supabase'

interface AuthContextValue {
  user: User | null
  session: Session | null
  settings: UserSettings | null
  loading: boolean
  groqApiKey: string
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  updateApiKey: (key: string) => Promise<string | null>
  updateMode: (mode: 'mock' | 'api') => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

async function fetchOrCreateSettings(userId: string): Promise<UserSettings | null> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code === 'PGRST116') {
    // Row doesn't exist yet — create it
    const { data: created } = await supabase
      .from('user_settings')
      .insert({ user_id: userId, groq_api_key: '', llm_mode: 'api' })
      .select('*')
      .single()
    return created ?? null
  }

  return data ?? null
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Failsafe: always clear loading after 8 seconds
    const failsafe = setTimeout(() => setLoading(false), 8000)

    // Use onAuthStateChange as sole source of truth — fires with INITIAL_SESSION
    // on mount, avoiding lock contention with a concurrent getSession() call.
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        try {
          const st = await fetchOrCreateSettings(s.user.id)
          setSettings(st)
        } catch {
          // settings fetch failed — app still works, just no saved settings
        }
      } else {
        setSettings(null)
      }
      clearTimeout(failsafe)
      setLoading(false)
    })

    return () => {
      clearTimeout(failsafe)
      listener.subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? error.message : null
  }

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error ? error.message : null
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  // Direct REST fetch — bypasses the Supabase JS client's Web Lock so DB writes
  // don't hang when the auth token refresh lock is contended.
  const dbPatch = async (token: string, filter: string, body: object) => {
    const base = import.meta.env.VITE_SUPABASE_URL as string
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const res  = await fetch(`${base}/rest/v1/user_settings?${filter}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: key,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => [])
    return { ok: res.ok, rows: Array.isArray(json) ? json : [], status: res.status, json }
  }

  const dbInsert = async (token: string, body: object) => {
    const base = import.meta.env.VITE_SUPABASE_URL as string
    const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string
    const res  = await fetch(`${base}/rest/v1/user_settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        apikey: key,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => null)
    return { ok: res.ok, status: res.status, json }
  }

  const updateApiKey = async (key: string): Promise<string | null> => {
    if (!user || !session) return 'Not signed in'
    try {
      const token = session.access_token
      const { ok, rows, json } = await dbPatch(token, `user_id=eq.${user.id}`, { groq_api_key: key })
      if (!ok) return (json as { message?: string })?.message ?? `HTTP error`
      if (rows.length === 0) {
        const ins = await dbInsert(token, { user_id: user.id, groq_api_key: key, llm_mode: settings?.llm_mode ?? 'api' })
        if (!ins.ok) return (ins.json as { message?: string })?.message ?? `HTTP error`
      }
      setSettings(prev => prev ? { ...prev, groq_api_key: key } : prev)
      return null
    } catch (err) {
      return (err as Error).message
    }
  }

  const updateMode = async (mode: 'mock' | 'api') => {
    if (!user || !session) return
    try {
      const token = session.access_token
      const { rows } = await dbPatch(token, `user_id=eq.${user.id}`, { llm_mode: mode })
      if (rows.length === 0) {
        await dbInsert(token, { user_id: user.id, groq_api_key: settings?.groq_api_key ?? '', llm_mode: mode })
      }
      setSettings(prev => prev ? { ...prev, llm_mode: mode } : prev)
    } catch { /* silent — mode toggle is non-critical */ }
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      settings,
      loading,
      groqApiKey: settings?.groq_api_key ?? '',
      signIn,
      signUp,
      signOut,
      updateApiKey,
      updateMode,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
