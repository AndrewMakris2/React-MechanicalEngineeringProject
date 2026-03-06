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
      if (['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'].includes(char)) {
        result += char
      } else {
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

async function extractTextFromImages(base64Images: string[], mimeType: string): Promise<string> {
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
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: contents,
      temperature: 0.1,
      max_tokens: 2048,
    }),
  })

  const data = await response.json()
  console.log('Vision API response status:', response.status)

  if (!response.ok) {
    throw new Error(`Vision API error: ${data.error?.message ?? JSON.stringify(data)}`)
  }

  return data.choices?.[0]?.message?.content ?? ''
}

async function handleTutorChat(systemPrompt: string, messages: { role: string; content: string }[]): Promise<string> {
  // Filter out any messages with empty or missing content
  const cleanMessages = messages
    .filter(m => m && m.role && m.content && String(m.content).trim().length > 0)
    .map(m => ({
      role: m.role as 'user' | 'assistant',
      content: String(m.content).trim(),
    }))

  if (cleanMessages.length === 0) {
    throw new Error('No valid messages to send')
  }

  console.log('Sending messages to Groq:', JSON.stringify(cleanMessages, null, 2))

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
  console.log('Tutor API response status:', response.status)

  if (!response.ok) {
    throw new Error(`Tutor API error: ${data.error?.message ?? JSON.stringify(data)}`)
  }

  return data.choices?.[0]?.message?.content ?? 'Sorry I could not generate a response.'
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
    const body = JSON.parse(event.body ?? '{}')

    // Handle tutor chat request
    if (body.type === 'tutor') {
      const { systemPrompt, messages } = body
      if (!messages || !Array.isArray(messages)) {
        throw new Error('No messages provided for tutor')
      }
      const text = await handleTutorChat(systemPrompt ?? '', messages)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text }),
      }
    }

    // Handle image/PDF OCR request
    if (body.type === 'ocr') {
      const { base64Images, mimeType } = body
      if (!base64Images || !Array.isArray(base64Images)) {
        throw new Error('No images provided for OCR')
      }
      const extractedText = await extractTextFromImages(base64Images, mimeType ?? 'image/jpeg')
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ text: extractedText }),
      }
    }

    // Handle normal analysis request
    const { prompt } = body
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
          throw new Error(`Groq returned no choices`)
        }

        const text = data.choices[0].message?.content
        if (!text) throw new Error(`Groq returned empty content`)

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
        if (attempt < 3) {
          await sleep(attempt * 3000)
          continue
        }
        break
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