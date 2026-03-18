import { ResultSchema } from './schema'
import type { Result } from './schema'
import { MOCK_RESULTS, GENERIC_MOCK_RESULT } from './mockData'
import { detectDomain } from './domainDetector'

export type LLMMode = 'mock' | 'api'

export interface LLMConfig {
  mode: LLMMode
  endpointUrl: string
  groqApiKey: string
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

function sanitizeData(data: unknown): unknown {
  if (typeof data !== 'object' || data === null) return data

  const obj = data as Record<string, unknown>

  if (obj.diagramSpec && typeof obj.diagramSpec === 'object') {
    const spec = obj.diagramSpec as Record<string, unknown>
    if (Array.isArray(spec.elements)) {
      spec.elements = spec.elements
        .filter((el: unknown) => {
          if (typeof el !== 'object' || el === null) return false
          const kind = (el as Record<string, unknown>).kind
          return ['body', 'force', 'moment', 'support'].includes(kind as string)
        })
        .map((el: unknown) => {
          const e = el as Record<string, unknown>
          if (e.kind === 'body') {
            return {
              kind: 'body',
              id: e.id ?? 'body1',
              shape: ['block', 'point', 'beam'].includes(e.shape as string) ? e.shape : 'block',
              label: e.label ?? '',
              x: Number(e.x) || 200,
              y: Number(e.y) || 160,
              w: Number(e.w) || 80,
              h: Number(e.h) || 50,
            }
          }
          if (e.kind === 'force') {
            return {
              kind: 'force',
              from: e.from ?? 'body1',
              label: e.label ?? 'F',
              fx: Number(e.fx) || 0,
              fy: Number(e.fy) || 80,
            }
          }
          if (e.kind === 'moment') {
            return {
              kind: 'moment',
              at: e.at ?? 'body1',
              label: e.label ?? 'M',
              direction: e.direction === 'ccw' ? 'ccw' : 'cw',
            }
          }
          if (e.kind === 'support') {
            return {
              kind: 'support',
              at: e.at ?? 'body1',
              supportType: ['pin', 'roller', 'fixed'].includes(e.supportType as string)
                ? e.supportType
                : 'pin',
            }
          }
          return null
        })
        .filter(Boolean)
    }

    if (spec.type !== 'fbd' && spec.type !== 'none') {
      spec.type = 'none'
    }
  }

  if (obj.confidence && typeof obj.confidence === 'object') {
    const conf = obj.confidence as Record<string, unknown>
    conf.parsing = Math.min(1, Math.max(0, Number(conf.parsing) || 0.5))
    conf.domain = Math.min(1, Math.max(0, Number(conf.domain) || 0.5))
    conf.units = Math.min(1, Math.max(0, Number(conf.units) || 0.5))
  }

  const validDomains = ['statics', 'dynamics', 'thermo', 'fluids', 'unknown']
  if (!validDomains.includes(obj.detectedDomain as string)) {
    obj.detectedDomain = 'unknown'
  }

  return obj
}

async function analyzeApi(opts: AnalyzeOptions): Promise<Result> {
  const url = opts.config.endpointUrl.trim()
  if (!url) throw new Error('API endpoint URL is not configured. Please set it in Settings.')

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: opts.prompt, groqApiKey: opts.config.groqApiKey || undefined }),
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
  const sanitized = sanitizeData(data)

  const parsed = ResultSchema.safeParse(sanitized)
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
    throw new Error(`API response failed schema validation: ${issues}`)
  }

  return parsed.data
}