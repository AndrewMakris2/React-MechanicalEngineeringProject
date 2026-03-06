import { useState, useCallback } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

function buildTutorSystemPrompt(result: Result | null): string {
  if (!result) {
    return `You are an expert engineering tutor. Answer engineering questions clearly and concisely. Use plain text only, no markdown formatting. Be conversational and helpful.`
  }

  return `You are an expert engineering tutor helping a student with the following problem:

PROBLEM SUMMARY: ${result.problemSummary}
DOMAIN: ${result.detectedDomain}
KNOWN VARIABLES: ${result.knowns.map(k => `${k.name} = ${k.value ?? '?'} ${k.units ?? ''}`).join(', ')}
UNKNOWN VARIABLES: ${result.unknowns.map(u => u.name).join(', ')}
GOVERNING EQUATIONS: ${result.governingEquations.map(e => e.equation).join('; ')}
ASSUMPTIONS: ${result.assumptions.map(a => a.assumption).join('; ')}

Your job is to help the student UNDERSTAND the problem, not just give them the answer.
- Be conversational and encouraging
- Give hints before full explanations
- Ask questions back to check understanding
- Use plain text only, no markdown, no special characters
- Keep responses concise unless more detail is requested
- If asked for the answer directly, guide them to it step by step instead`
}

export function useAITutor(config: LLMConfig, result: Result | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return

    const userMessage: Message = {
      id: `${Date.now()}-user`,
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
          'Great question! For this type of problem, the key is to first identify all the forces acting on the body and set up your coordinate system carefully.',
          'Think about what happens when you resolve the forces into components. What direction does each force act in your chosen coordinate system?',
          'Remember the fundamental principle here — for a body in equilibrium, the sum of all forces in any direction must equal zero.',
          'Before jumping to numbers, try setting up the equation symbolically first. What does your equation look like with just variables?',
          'Good thinking! Now check your units — make sure everything is consistent before you calculate.',
        ]
        const response: Message = {
          id: `${Date.now()}-assistant`,
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

      // Build clean messages array — only role and content strings
      const allMessages = [...messages, userMessage]
      const cleanMessages = allMessages
        .filter(m => m.content && m.content.trim().length > 0)
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
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
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