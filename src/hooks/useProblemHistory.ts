import { useState, useEffect, useCallback } from 'react'
import type { Result } from '../lib/schema'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export interface HistoryEntry {
  id: string
  timestamp: number
  problemText: string
  subject: string
  result: Result
}

const HISTORY_KEY = 'eng_translator_history'
const MAX_HISTORY = 50

export function useProblemHistory() {
  const { user } = useAuth()
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Load from Supabase when user is available
  useEffect(() => {
    if (!user) return
    supabase
      .from('problem_history')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(MAX_HISTORY)
      .then(({ data, error }) => {
        if (error || !data) return
        const entries: HistoryEntry[] = data.map(row => ({
          id: row.id as string,
          timestamp: row.timestamp as number,
          problemText: row.problem_text as string,
          subject: row.subject as string,
          result: row.result as Result,
        }))
        setHistory(entries)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
      })
  }, [user])

  // Keep localStorage in sync as offline fallback
  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  const addEntry = useCallback((problemText: string, subject: string, result: Result) => {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      problemText,
      subject,
      result,
    }
    setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY))
    if (user) {
      supabase.from('problem_history').insert({
        id: entry.id,
        user_id: user.id,
        problem_text: entry.problemText,
        subject: entry.subject,
        result: entry.result,
        timestamp: entry.timestamp,
      }).then(({ error }) => {
        if (error) console.error('Failed to save history to Supabase:', error.message)
      })
    }
  }, [user])

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id))
    if (user) {
      supabase.from('problem_history').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Failed to delete history from Supabase:', error.message)
      })
    }
  }, [user])

  const clearHistory = useCallback(() => {
    setHistory([])
    if (user) {
      supabase.from('problem_history').delete().eq('user_id', user.id).then(({ error }) => {
        if (error) console.error('Failed to clear history from Supabase:', error.message)
      })
    }
  }, [user])

  return { history, addEntry, removeEntry, clearHistory }
}
