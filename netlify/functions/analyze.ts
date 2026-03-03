const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async (req: Request) => {
  try {
    const { prompt } = await req.json()

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
                content: 'You are an expert engineering tutor. Always respond with valid JSON only. No markdown, no code fences, no explanation outside the JSON.',
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

        // Log raw response for debugging
        const raw = await response.json()
        console.log('Groq raw response:', JSON.stringify(raw, null, 2))

        if (!response.ok) {
          throw new Error(`Groq API error: ${raw.error?.message ?? JSON.stringify(raw)}`)
        }

        if (!raw.choices || !raw.choices[0]) {
          throw new Error(`Groq returned no choices: ${JSON.stringify(raw)}`)
        }

        const text = raw.choices[0].message?.content
        if (!text) {
          throw new Error(`Groq returned empty content: ${JSON.stringify(raw)}`)
        }

        // Strip markdown code fences if present
        const cleaned = text
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim()

        const parsed = JSON.parse(cleaned)

        return new Response(JSON.stringify({ result: parsed }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })

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
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}

export const config = { path: '/api/analyze' }