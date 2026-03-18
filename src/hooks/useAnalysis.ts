import { useState, useCallback } from 'react'
import type { Result } from '../lib/schema'
import { analyze } from '../lib/llmService'
import type { LLMConfig } from '../lib/llmService'
import { buildPrompt } from '../lib/promptBuilder'

export interface AnalysisState {
  result: Result | null
  loading: boolean
  error: string | null
}

export interface AnalysisInputs {
  problemText: string
  subject: string
  exampleId?: string
  allowFullSolution: boolean
  generateDiagram: boolean
  runUnitsCheck: boolean
}

export function useAnalysis(config: LLMConfig) {
  const [state, setState] = useState<AnalysisState>({
    result: null,
    loading: false,
    error: null,
  })

  const run = useCallback(async (inputs: AnalysisInputs) => {
    if (!inputs.problemText.trim()) {
      setState(s => ({ ...s, error: 'Please enter a problem statement.' }))
      return
    }

    setState({ result: null, loading: true, error: null })

    try {
      const prompt = buildPrompt({
        problemText: inputs.problemText,
        subject: inputs.subject,
        allowFullSolution: inputs.allowFullSolution,
        generateDiagram: inputs.generateDiagram,
        runUnitsCheck: inputs.runUnitsCheck,
      })

      const result = await analyze({ ...inputs, prompt, config })
      setState({ result, loading: false, error: null })
    } catch (err) {
      setState({ result: null, loading: false, error: (err as Error).message })
    }
  }, [config])

  const clear = useCallback(() => {
    setState({ result: null, loading: false, error: null })
  }, [])

  const restore = useCallback((result: Result) => {
    setState({ result, loading: false, error: null })
  }, [])

  return { ...state, run, clear, restore }
}