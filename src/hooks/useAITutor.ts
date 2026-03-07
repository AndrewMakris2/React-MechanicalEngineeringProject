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
  const baseInstructions = `You are an expert engineering professor and tutor at a top university.

RESPONSE STYLE:
- Write in proper sentences with correct capitalization and punctuation
- Be precise and technical but still easy to understand
- Use proper engineering terminology
- Structure longer answers with clear logical flow
- Keep responses to 3-5 sentences unless more detail is explicitly requested
- Never use bullet points or markdown formatting
- End with a targeted follow-up question to check understanding
- Be encouraging but professional like a good professor would be

TEACHING APPROACH:
- Guide students to the answer rather than just giving it
- Connect concepts to physical intuition when possible
- Reference the specific problem context when relevant
- If a student is wrong, gently correct them and explain why
- Celebrate correct reasoning before adding more detail`

  if (!result) {
    return `${baseInstructions}

You are helping a mechanical engineering student with general engineering questions. Answer clearly and precisely.`
  }

  return `${baseInstructions}

You are helping a student with the following specific problem:

PROBLEM: ${result.problemSummary}
SUBJECT: ${result.detectedDomain}
KNOWN VARIABLES: ${result.knowns.map(k => `${k.name} (${k.symbol ?? '?'}) = ${k.value ?? '?'} ${k.units ?? ''}`).join(', ')}
UNKNOWN VARIABLES: ${result.unknowns.map(u => `${u.name} (${u.symbol ?? '?'})`).join(', ')}
GOVERNING EQUATIONS: ${result.governingEquations.map(e => e.equation).join(' | ')}
ASSUMPTIONS: ${result.assumptions.map(a => a.assumption).join(' | ')}
SOLUTION STEPS: ${result.solutionOutline.map(s => `Step ${s.step}: ${s.title}`).join(' | ')}

Always relate your answers back to this specific problem context when possible.`
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
          'Great question! For this type of problem, the key is to first identify all the forces acting on the body and set up your coordinate system carefully. What do you think should be the first step in drawing the free body diagram?',
          'Think about what happens when you resolve the forces into components. Each force must be broken down along your chosen coordinate axes. Which direction do you think the normal force acts relative to the inclined surface?',
          'Remember the fundamental principle here — for a body in static equilibrium, the sum of all forces in every direction must equal zero. This gives us our equilibrium equations. Can you write out what that equation looks like for the x-direction?',
          'Before substituting numbers, always set up the equation symbolically first. This helps you catch errors and understand the relationship between variables. What variables appear in your governing equation?',
          'Good thinking! Now verify your units carefully — every term in your equation must have the same dimensions. What units do you expect for your final answer?',
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