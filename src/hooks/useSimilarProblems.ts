import { useState, useCallback } from 'react'
import type { LLMConfig } from '../lib/llmService'

export interface SimilarProblem {
  difficulty: 'easier' | 'similar' | 'harder'
  problem: string
  whatsNew: string
}

const DIFFICULTY_LABELS = {
  easier: 'easier',
  similar: 'similar difficulty',
  harder: 'harder',
}

function buildSimilarProblemsPrompt(originalProblem: string, domain: string): string {
  return `You are an expert engineering professor. Based on the following ${domain} engineering problem, generate 3 similar practice problems at different difficulty levels.

ORIGINAL PROBLEM:
${originalProblem}

Return ONLY valid JSON in this exact format, no markdown, no code fences:
{
  "problems": [
    {
      "difficulty": "easier",
      "problem": "full problem statement here",
      "whatsNew": "one sentence explaining what is simpler about this problem"
    },
    {
      "difficulty": "similar",
      "problem": "full problem statement here",
      "whatsNew": "one sentence explaining what is different about this problem"
    },
    {
      "difficulty": "harder",
      "problem": "full problem statement here",
      "whatsNew": "one sentence explaining what makes this problem harder"
    }
  ]
}

Rules:
1. Keep the same subject (${domain})
2. Use realistic engineering values
3. Each problem must be self contained and solvable
4. Easier = fewer unknowns or simpler geometry
5. Harder = more unknowns, combined loading, or additional complexity
6. Return ONLY the JSON, nothing else`
}

export function useSimilarProblems(config: LLMConfig) {
  const [problems, setProblems] = useState<SimilarProblem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (originalProblem: string, domain: string) => {
    if (config.mode === 'mock') {
      // Return mock similar problems in mock mode
      setProblems([
        {
          difficulty: 'easier',
          problem: 'A 20 kg block rests on a frictionless horizontal surface. A horizontal force of 50 N is applied. Find the acceleration.',
          whatsNew: 'Simplified to a single force on a flat surface with no friction.',
        },
        {
          difficulty: 'similar',
          problem: 'A 15 kg block is on a rough surface with coefficient of kinetic friction 0.25. A force of 60 N is applied at 20° above horizontal. Find the acceleration and normal force.',
          whatsNew: 'Similar setup with slightly different mass, angle and friction values.',
        },
        {
          difficulty: 'harder',
          problem: 'A 12 kg block on a rough inclined plane (30°, μk = 0.2) is connected via a cable over a frictionless pulley to a hanging 8 kg mass. Find the acceleration of the system and tension in the cable.',
          whatsNew: 'Adds an inclined plane, pulley system, and two connected masses.',
        },
      ])
      return
    }

    setLoading(true)
    setError(null)
    setProblems([])

    try {
      const prompt = buildSimilarProblemsPrompt(originalProblem, domain)

      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}`)
      }

      const raw = await response.json()
      const data = raw?.result ?? raw
      const text = typeof data === 'string' ? data : JSON.stringify(data)

      let parsed: { problems: SimilarProblem[] }

      if (typeof data === 'object' && data?.problems) {
        parsed = data as { problems: SimilarProblem[] }
      } else {
        const cleaned = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim()
        parsed = JSON.parse(cleaned)
      }

      if (!parsed.problems || !Array.isArray(parsed.problems)) {
        throw new Error('Invalid response format from API')
      }

      setProblems(parsed.problems)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [config])

  const clear = useCallback(() => {
    setProblems([])
    setError(null)
  }, [])

  return { problems, loading, error, generate, clear }
}