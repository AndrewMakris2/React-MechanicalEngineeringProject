import { useState, useCallback } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'
import { generateId } from '../lib/flashcardStorage'
import { buildTutorSystemPrompt } from '../lib/promptBuilder'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export function useAITutor(config: LLMConfig, result: Result | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setLoading(true)
    setError(null)

    try {
      if (config.mode === 'mock') {
        await new Promise(r => setTimeout(r, 800))
        const mockResponses = [
          'Great question! For this type of problem, the key is to first identify all the forces acting on the body and set up your coordinate system carefully. What do you think should be the first step in drawing the free body diagram?',
          'Think about what happens when you resolve the forces into components. Each force must be broken down along your chosen coordinate axes. Which direction do you think the normal force acts relative to the inclined surface?',
          'Remember the fundamental principle here — for a body in static equilibrium, the sum of all forces in every direction must equal zero. This gives us our equilibrium equations. Can you write out what that equation looks like for the x-direction?',
          'Before substituting numbers, always set up the equation symbolically first. This helps you catch errors and understand the relationship between variables. What variables appear in your governing equation?',
          'Good thinking! Now verify your units carefully — every term in your equation must have the same dimensions. What units do you expect for your final answer?',
        ]
        const response: Message = {
          id: generateId(),
          role: 'assistant',
          content: mockResponses[Math.floor(Math.random() * mockResponses.length)],
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev, response])
        return
      }

      if (!config.endpointUrl) {
        throw new Error('API endpoint not configured. Please set it in Settings.')
      }

      const allMessages = [...messages, userMessage]
      const cleanMessages = allMessages
        .filter(m => m && m.role && m.content && String(m.content).trim().length > 0)
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: String(m.content).trim(),
        }))

      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'tutor',
          systemPrompt: buildTutorSystemPrompt(result),
          messages: cleanMessages,
          groqApiKey: config.groqApiKey || undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.text ?? 'Sorry I could not generate a response. Please try again.',
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [config, result, messages])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
  }, [])

  return { messages, loading, error, sendMessage, clearChat }
}