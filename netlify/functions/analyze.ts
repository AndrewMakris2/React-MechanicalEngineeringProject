import type { Handler } from '@netlify/functions'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function repairJSON(text: string): string {
  // Remove markdown code fences
  let cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  // Remove any text before the first {
  const firstBrace = cleaned.indexOf('{')
  if (firstBrace > 0) cleaned = cleaned.slice(firstBrace)

  // Remove any text after the last }
  const lastBrace = cleaned.lastIndexOf('}')
  if (lastBrace !== -1) cleaned = cleaned.slice(0, lastBrace + 1)

  // Fix escape issues character by character inside strings
  let result = ''
  let inString = false
  let escaped = false

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    const code = cleaned.charCodeAt(i)

    if (escaped) {
      // Allow valid escape sequences
      if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'].includes(char)) {
        result += char
      } else {
        // Invalid escape — just add the character without backslash
        result += char
      }
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
      // Fix unescaped control characters inside strings
      if (code === 0x0a) { result += '\\n'; continue }  // newline
      if (code === 0x0d) { result += '\\r'; continue }  // carriage return
      if (code === 0x09) { result += '\\t'; continue }  // tab
      if (code < 0x20) { result += ' '; continue }      // other control chars
    }

    result += char
  }

  // Fix trailing commas
  result = result.replace(/,\s*([}\]])/g, '$1')

  return result
}

export const handler: Handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { prompt } = JSON.parse(event.body ?? '{}')

    let lastError: Error | null = null

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content: 'You are an expert engineering tutor. Always respond with valid JSON only. No markdown, no code fences, no explanation outside the JSON. Never use special characters or greek letters in JSON strings. Use plain ASCII text only. Escape all backslashes properly.',
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
          throw new Error(`Groq returned no choices`)
        }

        const text = data.choices[0].message?.content
        if (!text) throw new Error(`Groq returned empty content`)

        console.log('Raw text sample:', text.slice(0, 200))

        const repaired = repairJSON(text)

        let parsed
        try {
          parsed = JSON.parse(repaired)
        } catch (parseErr) {
          console.error('Parse failed after repair. Sample:', repaired.slice(0, 300))
          throw new Error(`JSON parse failed: ${(parseErr as Error).message}`)
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ result: parsed }),
        }

      } catch (err) {
        lastError = err as Error
        console.error(`Attempt ${attempt} failed:`, lastError.message)
        if (attempt < 3) {
          await sleep(attempt * 3000)
          continue
        }
        break
      }
    }

    throw lastError

  } catch (err) {
    console.error('Final error:', (err as Error).message)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: (err as Error).message }),
    }
  }
}