import type { Handler } from '@netlify/functions'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function cleanJSON(text: string): string {
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
  if (lastBrace !== -1 && lastBrace < cleaned.length - 1) {
    cleaned = cleaned.slice(0, lastBrace + 1)
  }

  // Fix common JSON issues
  cleaned = cleaned
    // Fix unescaped newlines inside strings
    .replace(/(?<=":.*?)[\n\r]+(?=.*?")/g, ' ')
    // Fix unescaped tabs
    .replace(/\t/g, ' ')
    // Fix trailing commas before } or ]
    .replace(/,\s*([}\]])/g, '$1')
    // Fix single quotes used instead of double quotes (basic)
    .replace(/'/g, '"')

  return cleaned
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
                content: 'You are an expert engineering tutor. Always respond with valid JSON only. No markdown, no code fences, no explanation outside the JSON. Escape all special characters properly in JSON strings.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.2,
            max_tokens: 4096,
          }),
        })

        const data = await response.json()
        console.log('Groq response status:', response.status)

        if (!response.ok) {
          throw new Error(`Groq API error: ${data.error?.message ?? JSON.stringify(data)}`)
        }

        if (!data.choices || !data.choices[0]) {
          throw new Error(`Groq returned no choices: ${JSON.stringify(data)}`)
        }

        const text = data.choices[0].message?.content
        if (!text) {
          throw new Error(`Groq returned empty content`)
        }

        const cleaned = cleanJSON(text)

        let parsed
        try {
          parsed = JSON.parse(cleaned)
        } catch (parseErr) {
          console.error('JSON parse failed, raw text:', text.slice(0, 500))
          throw new Error(`Failed to parse JSON response: ${(parseErr as Error).message}`)
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