import { useState, useEffect } from 'react'
import type { Result } from '../lib/schema'

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
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  }, [history])

  function addEntry(problemText: string, subject: string, result: Result) {
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
      problemText,
      subject,
      result,
    }
    setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY))
  }

  function removeEntry(id: string) {
    setHistory(prev => prev.filter(e => e.id !== id))
  }

  function clearHistory() {
    setHistory([])
  }

  return { history, addEntry, removeEntry, clearHistory }
}