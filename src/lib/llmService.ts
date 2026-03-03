import { MOCK_RESULTS, GENERIC_MOCK_RESULT } from './mockData'
import { detectDomain } from './domainDetector'
import { ResultSchema } from './schema'
import type { Result } from './schema'

export type LLMMode = 'mock' | 'api'

export interface LLMConfig {
  mode: LLMMode
  endpointUrl: string
}

const CONFIG_KEY = 'eng_translator_llm_config'

export function loadConfig(): LLMConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return { mode: 'mock', endpointUrl: '' }
}

export function saveConfig(config: LLMConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}

export interface AnalyzeOptions {
  problemText: string
  subject: string
  exampleId?: string
  allowFullSolution: boolean
  generateDiagram: boolean
  runUnitsCheck: boolean
  prompt: string
  config: LLMConfig
}

export async function analyze(opts: AnalyzeOptions): Promise<Result> {
  if (opts.config.mode === 'mock') {
    return analyzeMock(opts)
  }
  return analyzeApi(opts)
}

function analyzeMock(opts: AnalyzeOptions): Result {
  if (opts.exampleId && MOCK_RESULTS[opts.exampleId]) {
    return MOCK_RESULTS[opts.exampleId]
  }
  const domain = detectDomain(opts.problemText, opts.subject)
  return GENERIC_MOCK_RESULT(domain)
}

async function analyzeApi(opts: AnalyzeOptions): Promise<Result> {
  const url = opts.config.endpointUrl.trim()
  if (!url) throw new Error('API endpoint URL is not configured. Please set it in Settings.')

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: opts.prompt }),
    })
  } catch (err) {
    throw new Error(`Network error: Could not reach endpoint "${url}". Check the URL and CORS settings.`)
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`API returned HTTP ${response.status}: ${text.slice(0, 200)}`)
  }

  let raw: unknown
  try {
    raw = await response.json()
  } catch {
    throw new Error('API response is not valid JSON.')
  }

  const data = (raw as Record<string, unknown>)?.result ?? raw

  const parsed = ResultSchema.safeParse(data)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`API response failed schema validation: ${issues}`)
  }

  return parsed.data
}