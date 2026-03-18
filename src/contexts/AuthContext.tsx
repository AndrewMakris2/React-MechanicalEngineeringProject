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
    supabase.auth.getSession().then(async ({ data }) => {
      const s = data.session
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const st = await fetchOrCreateSettings(s.user.id)
        setSettings(st)
      }
      setLoading(false)
    }).catch(() => {
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, s) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const st = await fetchOrCreateSettings(s.user.id)
        setSettings(st)
      } else {
        setSettings(null)
      }
    })

    return () => listener.subscription.unsubscribe()
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

  const updateApiKey = async (key: string): Promise<string | null> => {
    if (!user) return 'Not signed in'
    const { error } = await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, groq_api_key: key, llm_mode: settings?.llm_mode ?? 'api' }, { onConflict: 'user_id' })
    if (error) return error.message
    setSettings(prev => prev ? { ...prev, groq_api_key: key } : prev)
    return null
  }

  const updateMode = async (mode: 'mock' | 'api') => {
    if (!user) return
    await supabase
      .from('user_settings')
      .upsert({ user_id: user.id, groq_api_key: settings?.groq_api_key ?? '', llm_mode: mode }, { onConflict: 'user_id' })
    setSettings(prev => prev ? { ...prev, llm_mode: mode } : prev)
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
