import { GoogleGenerativeAI } from '@google/generative-ai'

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export default async (req: Request) => {
  try {
    const { prompt } = await req.json()

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    })

    // Retry up to 3 times on 429
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const result = await model.generateContent(prompt)
        const text = result.response.text()
        const parsed = JSON.parse(text)

        return new Response(JSON.stringify({ result: parsed }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } catch (err) {
        lastError = err as Error
        const is429 = lastError.message.includes('429')
        if (is429 && attempt < 3) {
          // Wait longer each retry: 5s, 10s, 15s
          await sleep(attempt * 5000)
          continue
        }
        break
      }
    }

    throw lastError

  } catch (err) {
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