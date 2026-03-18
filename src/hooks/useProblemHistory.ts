import { useState, useEffect, useCallback } from 'react'
import type { Result } from '../lib/schema'
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

// Use direct REST fetch to avoid Supabase JS client Web Lock contention
function headers(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  }
}
const base = () => `${import.meta.env.VITE_SUPABASE_URL as string}/rest/v1/problem_history`

export function useProblemHistory() {
  const { user, session } = useAuth()
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Load from Supabase when user + session are available.
  // If Supabase is empty but localStorage has data, migrate it up (one-time).
  useEffect(() => {
    if (!user || !session) return
    const token = session.access_token
    fetch(`${base()}?user_id=eq.${user.id}&order=timestamp.desc&limit=${MAX_HISTORY}`, {
      headers: headers(token),
    })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(async (data: unknown[]) => {
        if (!Array.isArray(data)) return

        if (data.length === 0) {
          // Migrate localStorage → Supabase
          const local: HistoryEntry[] = (() => {
            try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
          })()
          if (local.length > 0) {
            await Promise.all(local.map(e =>
              fetch(base(), {
                method: 'POST',
                headers: headers(token),
                body: JSON.stringify({
                  id: e.id, user_id: user.id, problem_text: e.problemText,
                  subject: e.subject, result: e.result, timestamp: e.timestamp,
                }),
              }).catch(() => null)
            ))
            setHistory(local)
            return
          }
        }

        const entries: HistoryEntry[] = data.map(row => {
          const r = row as Record<string, unknown>
          return {
            id: r.id as string,
            timestamp: r.timestamp as number,
            problemText: r.problem_text as string,
            subject: r.subject as string,
            result: r.result as Result,
          }
        })
        setHistory(entries)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(entries))
      })
      .catch(() => { /* keep localStorage data as fallback */ })
  }, [user, session])

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
    if (user && session) {
      fetch(base(), {
        method: 'POST',
        headers: headers(session.access_token),
        body: JSON.stringify({
          id: entry.id,
          user_id: user.id,
          problem_text: entry.problemText,
          subject: entry.subject,
          result: entry.result,
          timestamp: entry.timestamp,
        }),
      }).catch(err => console.error('Failed to save history:', err))
    }
  }, [user, session])

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id))
    if (user && session) {
      fetch(`${base()}?id=eq.${id}&user_id=eq.${user.id}`, {
        method: 'DELETE',
        headers: headers(session.access_token),
      }).catch(err => console.error('Failed to delete history:', err))
    }
  }, [user, session])

  const clearHistory = useCallback(() => {
    setHistory([])
    if (user && session) {
      fetch(`${base()}?user_id=eq.${user.id}`, {
        method: 'DELETE',
        headers: headers(session.access_token),
      }).catch(err => console.error('Failed to clear history:', err))
    }
  }, [user, session])

  return { history, addEntry, removeEntry, clearHistory }
}
