import type { Handler } from '@netlify/functions'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function repairJSON(text: string): string {
  let cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  const firstBrace = cleaned.indexOf('{')
  if (firstBrace > 0) cleaned = cleaned.slice(firstBrace)

  const lastBrace = cleaned.lastIndexOf('}')
  if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1)

  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    const code = cleaned.charCodeAt(i)

    if (escaped) {
      result += char
      escaped = false
      continue
    }

    if (char === '\\' && inString) {
      escaped = true
      result += char
      continue
    }

    if (char === '"') {
      inString = !inString
      result += char
      continue
    }

    if (inString) {
      if (code === 0x0a) { result += ' '; continue }
      if (code === 0x0d) { result += ' '; continue }
      if (code === 0x09) { result += ' '; continue }
      if (code < 0x20) { result += ' '; continue }
    }

    result += char
  }

  result = result.replace(/,\s*([}\]])/g, '$1')
  return result
}

// ─── QUIZ VALIDATOR ───────────────────────────────────────────────────────────
// Extract all numbers from a string
function extractNumbers(str: string): number[] {
  const matches = str.match(/-?\d+\.?\d*/g)
  return matches ? matches.map(Number) : []
}

// Check if a number appears in any of the option strings
function numberAppearsInOptions(num: number, options: string[]): boolean {
  return options.some(opt => {
    const nums = extractNumbers(opt)
    return nums.some(n => Math.abs(n - num) < 0.5)
  })
}

// Validate and fix quiz questions
function validateQuizQuestions(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map(q => {
    let correctIndex = q.correctIndex

    // Make sure correctIndex is valid
    if (correctIndex < 0 || correctIndex >= q.options.length) {
      correctIndex = 0
    }

    // Extract numbers from explanation to verify correct answer
    const explanationNums = extractNumbers(q.explanation)
    if (explanationNums.length === 0) return { ...q, correctIndex }

    // Get the last significant number from the explanation (usually the final answer)
    const lastNum = explanationNums[explanationNums.length - 1]

    // Get numbers from the supposedly correct option
    const correctOptionNums = extractNumbers(q.options[correctIndex])

    if (correctOptionNums.length === 0) return { ...q, correctIndex }

    const correctOptionNum = correctOptionNums[0]

    // Check if the correct option matches the explanation's final answer
    const matches = Math.abs(correctOptionNum - lastNum) / (Math.abs(lastNum) + 0.001) < 0.01

    if (!matches) {
      // The correctIndex is wrong — find which option actually matches
      for (let i = 0; i < q.options.length; i++) {
        const optNums = extractNumbers(q.options[i])
        if (optNums.length > 0) {
          const ratio = Math.abs(optNums[0] - lastNum) / (Math.abs(lastNum) + 0.001)
          if (ratio < 0.01) {
            console.log(`Fixed correctIndex from ${correctIndex} to ${i} for question: ${q.question.slice(0, 50)}`)
            return { ...q, correctIndex: i }
          }
        }
      }
    }

    return { ...q, correctIndex }
  })
}

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  subject: string
}

// ─── HANDLERS ─────────────────────────────────────────────────────────────────

function resolveApiKey(userKey: string | undefined): string {
  const key = (userKey ?? '').trim()
  return key || (process.env.GROQ_API_KEY ?? '')
}

async function extractTextFromImages(base64Images: string[], mimeType: string, apiKey: string): Promise<string> {
  const contents: object[] = []

  for (let i = 0; i < base64Images.length; i++) {
    contents.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Images[i]}`,
          },
        },
        {
          type: 'text',
          text: i === 0
            ? 'Extract all text from this engineering problem image. Return only the extracted text, nothing else.'
            : 'Extract all text from this page. Return only the extracted text.',
        },
      ],
    })
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: contents,
      temperature: 0.1,
      max_tokens: 2048,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Vision API error: ${data.error?.message ?? JSON.stringify(data)}`)
  }

  return data.choices?.[0]?.message?.content ?? ''
}

async function handleTutorChat(systemPrompt: string, messages: { role: string; content: string }[], apiKey: string): Promise<string> {
  const cleanMessages = messages
    .filter(m => m && m.role && m.content && String(m.content).trim().length > 0)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content).trim(),
    }))

  if (cleanMessages.length === 0) {
    throw new Error('No valid messages to send')
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: systemPrompt && systemPrompt.trim().length > 0
            ? systemPrompt.trim()
            : 'You are an expert engineering tutor. Be helpful and concise.',
        },
        ...cleanMessages,
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Tutor API error: ${data.error?.message ?? JSON.stringify(data)}`)
  }

  return data.choices?.[0]?.message?.content ?? 'Sorry I could not generate a response.'
}

async function handleQuiz(prompt: string, apiKey: string): Promise<QuizQuestion[]> {
  // Try up to 3 times to get a valid quiz
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: `You are an expert engineering professor creating quiz questions.
CRITICAL RULES:
1. Always use g = 9.81 m/s² exactly - never 9.8 or 10
2. Always use rho_water = 1000 kg/m³
3. Calculate every answer yourself step by step before writing options
4. The option at correctIndex MUST equal your calculated answer
5. Show full calculation in explanation
6. Use plain ASCII only - no Greek letters or special symbols
7. Return only valid JSON - no markdown`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Groq API error: ${data.error?.message ?? JSON.stringify(data)}`)
      }

      const text = data.choices?.[0]?.message?.content
      if (!text) throw new Error('Empty response from Groq')

      const repaired = repairJSON(text)
      const parsed = JSON.parse(repaired)

      if (!parsed.questions || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid quiz format returned')
      }

      // Validate and auto-fix correctIndex mismatches
      const validated = validateQuizQuestions(parsed.questions)

      console.log(`Quiz generated successfully on attempt ${attempt}`)
      return validated

    } catch (err) {
      lastError = err as Error
      console.error(`Quiz attempt ${attempt} failed:`, lastError.message)
      if (attempt < 3) await sleep(2000)
    }
  }

  throw lastError
}

// ─── FLASHCARD HANDLER ────────────────────────────────────────────────────────

async function handleFlashcards(prompt: string, apiKey: string): Promise<{ front: string; back: string }[]> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'You are an expert engineering professor creating study flashcards. Return ONLY valid JSON — no markdown, no code fences. Use plain ASCII text only.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2048,
    }),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Groq API error: ${data.error?.message ?? JSON.stringify(data)}`)
  }

  const text = data.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response from Groq')

  const repaired = repairJSON(text)
  const parsed = JSON.parse(repaired)

  if (!parsed.cards || !Array.isArray(parsed.cards)) {
    throw new Error('Invalid flashcard format returned')
  }

  return parsed.cards.filter((c: unknown) => {
    if (typeof c !== 'object' || c === null) return false
    const card = c as Record<string, unknown>
    return typeof card.front === 'string' && typeof card.back === 'string'
  })
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://stalwart-shortbread-fff106.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
]

export const handler: Handler = async (event) => {
  const requestOrigin = event.headers?.origin ?? ''
  const allowedOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : ALLOWED_ORIGINS[0]

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const body = JSON.parse(event.body ?? '{}')
    const apiKey = resolveApiKey(body.groqApiKey)

    // ── Tutor chat ──
    if (body.type === 'tutor') {
      const { systemPrompt, messages } = body
      if (!messages || !Array.isArray(messages)) {
        throw new Error('No messages provided for tutor')
      }
      const text = await handleTutorChat(systemPrompt ?? '', messages, apiKey)
      return { statusCode: 200, headers, body: JSON.stringify({ text }) }
    }

    // ── OCR ──
    if (body.type === 'ocr') {
      const { base64Images, mimeType } = body
      if (!base64Images || !Array.isArray(base64Images)) {
        throw new Error('No images provided for OCR')
      }
      const extractedText = await extractTextFromImages(base64Images, mimeType ?? 'image/jpeg', apiKey)
      return { statusCode: 200, headers, body: JSON.stringify({ text: extractedText }) }
    }

    // ── Quiz ──
    if (body.type === 'quiz') {
      const questions = await handleQuiz(body.prompt, apiKey)
      return { statusCode: 200, headers, body: JSON.stringify({ questions }) }
    }

    // ── Flashcards ──
    if (body.type === 'flashcards') {
      if (!body.prompt) throw new Error('No prompt provided for flashcards')
      const cards = await handleFlashcards(body.prompt, apiKey)
      return { statusCode: 200, headers, body: JSON.stringify({ cards }) }
    }

    // ── Problem Analysis ──
    const { prompt } = body
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are an expert engineering tutor. Always respond with valid JSON only. No markdown, no code fences, no explanation outside the JSON. Use only plain ASCII characters. No Greek letters or special symbols. No newlines or tabs inside string values.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.1,
            max_tokens: 4096,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(`Groq API error: ${data.error?.message ?? JSON.stringify(data)}`)
        }

        if (!data.choices?.[0]) {
          throw new Error('Groq returned no choices')
        }

        const text = data.choices[0].message?.content
        if (!text) throw new Error('Groq returned empty content')

        const repaired = repairJSON(text)

        let parsed
        try {
          parsed = JSON.parse(repaired)
        } catch (parseErr) {
          throw new Error(`JSON parse failed: ${(parseErr as Error).message}`)
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ result: parsed }),
        }

      } catch (err) {
        lastError = err as Error
        if (attempt < 3) await sleep(attempt * 3000)
      }
    }

    throw lastError

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: (err as Error).message }),
    }
  }
}