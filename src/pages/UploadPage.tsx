import React, { useState } from 'react'
import type { LLMConfig } from '../lib/llmService'
import { extractFromFile } from '../lib/imageExtractor'
import { useFlashcards } from '../hooks/useFlashcards'
import { useNavigate } from 'react-router-dom'

interface Props { config: LLMConfig }

type ConvertMode = 'analyze' | 'flashcards' | 'studyguide' | 'problems'

const CONVERT_MODES = [
  {
    id: 'analyze' as ConvertMode,
    icon: '🔬',
    title: 'Problem Analysis',
    description: 'Extract and analyze an engineering problem — get variables, equations, and solution steps',
    color: 'border-blue-700 bg-blue-900/20',
    badge: 'bg-blue-900 text-blue-300',
  },
  {
    id: 'flashcards' as ConvertMode,
    icon: '🃏',
    title: 'Flashcards',
    description: 'Convert notes, equations, or problem sets into study flashcards automatically',
    color: 'border-purple-700 bg-purple-900/20',
    badge: 'bg-purple-900 text-purple-300',
  },
  {
    id: 'studyguide' as ConvertMode,
    icon: '📖',
    title: 'Study Guide',
    description: 'Turn lecture notes or textbook pages into a structured study guide with key concepts',
    color: 'border-green-700 bg-green-900/20',
    badge: 'bg-green-900 text-green-300',
  },
  {
    id: 'problems' as ConvertMode,
    icon: '✏️',
    title: 'Practice Problems',
    description: 'Generate similar practice problems based on the uploaded content',
    color: 'border-orange-700 bg-orange-900/20',
    badge: 'bg-orange-900 text-orange-300',
  },
]

export default function UploadPage({ config }: Props) {
  const navigate = useNavigate()
  const { addCard } = useFlashcards(config)
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<ConvertMode>('analyze')
  const [extracting, setExtracting] = useState(false)
  const [converting, setConverting] = useState(false)
  const [extractedText, setExtractedText] = useState('')
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  async function handleFile(f: File) {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(f.type)) {
      setError('Please upload a JPG, PNG, WEBP, or PDF file.')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File too large. Max size is 20MB.')
      return
    }
    setFile(f)
    setError(null)
    setExtractedText('')
    setResult('')
    setStep(1)
  }

  async function handleExtract() {
    if (!file) return
    setExtracting(true)
    setError(null)

    try {
      const extracted = await extractFromFile(file)
      let base64Images: string[]
      let mimeType: string

      if (extracted.type === 'pdf') {
        base64Images = extracted.base64Images
        mimeType = 'image/jpeg'
      } else {
        base64Images = [extracted.base64]
        mimeType = extracted.mimeType
      }

      if (!config.endpointUrl) throw new Error('API endpoint not configured.')

      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'ocr', base64Images, mimeType }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const data = await response.json()
      setExtractedText(data.text ?? '')
      setStep(2)

    } catch (err) {
      setError((err as Error).message)} finally {
      setExtracting(false)
    }
  }

  async function handleConvert() {
    if (!extractedText.trim()) return
    setConverting(true)
    setError(null)

    try {
      let prompt = ''

      if (mode === 'analyze') {
        prompt = `You are an expert engineering tutor. Analyze the following engineering problem extracted from an image or PDF.

EXTRACTED TEXT:
${extractedText}

Return ONLY valid JSON matching this schema, no markdown, plain ASCII only:
{
  "detectedDomain": "statics" or "dynamics" or "thermo" or "fluids" or "unknown",
  "problemSummary": "plain text summary",
  "knowns": [{ "name": "string", "symbol": "string or null", "value": "string or null", "units": "string or null", "notes": "string or null" }],
  "unknowns": [{ "name": "string", "symbol": "string or null", "units": "string or null", "notes": "string or null" }],
  "assumptions": [{ "assumption": "string", "whyItMatters": "string or null" }],
  "governingEquations": [{ "equation": "plain text equation", "whenToUse": "string or null", "variables": ["string"] }],
  "solutionOutline": [{ "step": 1, "title": "string", "details": "plain text details" }],
  "commonMistakes": [{ "mistake": "string", "avoidanceTip": "string" }],
  "diagramSpec": { "type": "none", "elements": [], "notes": null },
  "units": { "parsed": [], "issues": [] },
  "confidence": { "parsing": 0.9, "domain": 0.9, "units": 0.9 }
}`
      } else if (mode === 'flashcards') {
        prompt = `You are an expert engineering professor. Convert the following text into flashcards for studying.

EXTRACTED TEXT:
${extractedText}

Generate 8-12 flashcards. Return ONLY valid JSON, no markdown, plain ASCII only:
{
  "cards": [
    {
      "front": "question or concept",
      "back": "answer or explanation",
      "subject": "statics or dynamics or thermo or fluids or unknown"
    }
  ]
}`
      } else if (mode === 'studyguide') {
        prompt = `You are an expert engineering professor. Convert the following text into a structured study guide.

EXTRACTED TEXT:
${extractedText}

Return ONLY valid JSON, no markdown, plain ASCII only:
{
  "title": "Study Guide Title",
  "subject": "statics or dynamics or thermo or fluids or unknown",
  "keyConcepts": [{ "concept": "string", "explanation": "string" }],
  "keyEquations": [{ "equation": "string", "description": "string" }],
  "importantFacts": ["string"],
  "studyTips": ["string"]
}`
      } else if (mode === 'problems') {
        prompt = `You are an expert engineering professor. Based on the following content, generate 3 practice problems at different difficulty levels.

EXTRACTED TEXT:
${extractedText}

Return ONLY valid JSON, no markdown, plain ASCII only:
{
  "problems": [
    {
      "difficulty": "easy" or "medium" or "hard",
      "problem": "full problem statement",
      "hint": "one hint to get started"
    }
  ]
}`
      }

      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const raw = await response.json()
      const data = raw?.result ?? raw

      if (mode === 'flashcards' && typeof data === 'object' && data?.cards) {
        const cards = data.cards as { front: string; back: string; subject: string }[]
        cards.forEach(c => {
          if (c.front && c.back) {
            addCard({
              front: c.front,
              back: c.back,
              subject: c.subject ?? 'unknown',
              deck: 'uploaded',
              status: 'new',
              sourceType: 'generated',
            })
          }
        })
        setResult(`✅ Created ${cards.length} flashcards! Go to the Flashcards page to study them.`)
      } else if (mode === 'analyze') {
        setResult(JSON.stringify(data, null, 2))
      } else {
        setResult(JSON.stringify(data, null, 2))
      }

      setStep(3)

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setConverting(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">📎 Upload & Convert</h1>
        <p className="text-xs text-gray-400 mt-0.5">Upload photos or PDFs and convert them into study materials</p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: 'Upload File' },
          { n: 2, label: 'Choose Output' },
          { n: 3, label: 'Review Result' },
        ].map((s, i) => (
          <React.Fragment key={s.n}>
            <div className={`flex items-center gap-2 ${step >= s.n ? 'text-white' : 'text-gray-500'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > s.n ? 'bg-green-600' : step === s.n ? 'bg-blue-600' : 'bg-gray-700'
              }`}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.label}</span>
            </div>
            {i < 2 && <div className={`flex-1 h-0.5 ${step > s.n ? 'bg-green-600' : 'bg-gray-700'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Upload + Instructions */}
        <div className="space-y-4">

          {/* Upload Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('file-input')?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver ? 'border-blue-500 bg-blue-900/20' :
              file ? 'border-green-600 bg-green-900/10' :
              'border-gray-600 hover:border-gray-400'
            }`}
          >
            <input
              id="file-input"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            {file ? (
              <div>
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm font-semibold text-green-400">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(0)} KB</p>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); setExtractedText(''); setResult(''); setStep(1) }}
                  className="text-xs text-gray-500 hover:text-red-400 mt-2 block mx-auto"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div>
                <p className="text-3xl mb-2">📎</p>
                <p className="text-sm font-medium text-gray-300">Click or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP, PDF · Max 20MB</p>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-xl px-3 py-2">
              <p className="text-xs text-red-300">🚨 {error}</p>
            </div>
          )}

          {/* How it works */}
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">How It Works</h3>
            <div className="space-y-3">
              {[
                { step: 1, icon: '📸', text: 'Upload a photo of your homework, notes, or textbook page' },
                { step: 2, icon: '🤖', text: 'AI reads and extracts all the text from your file' },
                { step: 3, icon: '⚡', text: 'Choose how to convert it — analysis, flashcards, study guide, or practice problems' },
                { step: 4, icon: '✅', text: 'Review and save the results to your study library' },
              ].map(s => (
                <div key={s.step} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-700 text-xs flex items-center justify-center shrink-0">{s.icon}</div>
                  <p className="text-xs text-gray-400">{s.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="card bg-blue-900/20 border-blue-700">
            <h3 className="text-xs font-semibold text-blue-300 mb-2">📸 Photo Tips</h3>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>• Good lighting — avoid shadows</li>
              <li>• Hold camera straight above the page</li>
              <li>• Make sure text is sharp and in focus</li>
              <li>• Crop out irrelevant parts</li>
              <li>• PDF uploads work best for typed documents</li>
            </ul>
          </div>
        </div>

        {/* Right: Steps 2 and 3 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Step 1 — Extract */}
          {file && step === 1 && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-white">Step 1 — Extract Text</h3>
              <p className="text-xs text-gray-400">
                Click the button below to use AI vision to read the text from your uploaded file.
              </p>
              <button
                onClick={handleExtract}
                disabled={extracting}
                className="btn-primary flex items-center gap-2"
              >
                {extracting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Reading file...
                  </>
                ) : '🤖 Extract Text with AI'}
              </button>
            </div>
          )}

          {/* Step 2 — Choose mode + review text */}
          {step >= 2 && (
            <div className="space-y-4">

              {/* Extracted text */}
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Extracted Text</h3>
                  <span className="text-xs text-gray-500">{extractedText.length} characters</span>
                </div>
                <textarea
                  className="input-base resize-none text-xs"
                  rows={6}
                  value={extractedText}
                  onChange={e => setExtractedText(e.target.value)}
                />
                <p className="text-xs text-gray-600 mt-1">You can edit the text above if needed before converting.</p>
              </div>

              {/* Convert modes */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3">Step 2 — Choose Output Type</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CONVERT_MODES.map(m => (
                    <button
                      key={m.id}
                      onClick={() => setMode(m.id)}
                      className={`card text-left border-2 transition-all ${
                        mode === m.id ? m.color + ' scale-[1.02]' : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-2xl">{m.icon}</span>
                        {mode === m.id && <span className={`badge ${m.badge} text-xs`}>Selected</span>}
                      </div>
                      <p className="text-sm font-semibold text-white">{m.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{m.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleConvert}
                disabled={converting || !extractedText.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {converting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Converting...
                  </>
                ) : `⚡ Convert to ${CONVERT_MODES.find(m2 => m2.id === mode)?.title}`}
              </button>
            </div>
          )}

          {/* Step 3 — Result */}
          {step === 3 && result && (
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-white">Step 3 — Result</h3>

              {mode === 'flashcards' ? (
                <div className="space-y-3">
                  <div className="bg-green-900/30 border border-green-700 rounded-xl p-4 text-center">
                    <p className="text-green-400 font-semibold">{result}</p>
                  </div>
                  <button
                    onClick={() => navigate('/flashcards')}
                    className="btn-primary w-full"
                  >
                    🃏 Go to Flashcards
                  </button>
                </div>
              ) : mode === 'analyze' ? (
                <div className="space-y-3">
                  <div className="bg-green-900/30 border border-green-700 rounded-xl p-3">
                    <p className="text-xs text-green-400">✅ Analysis complete! Copy the problem text and paste it into the Analyzer.</p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3">
                    <p className="text-xs text-gray-300 font-medium mb-2">Extracted Problem:</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{extractedText}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(extractedText)
                      }}
                      className="btn-secondary text-xs flex-1"
                    >
                      📋 Copy Text
                    </button>
                    <button
                      onClick={() => navigate('/analyzer')}
                      className="btn-primary text-xs flex-1"
                    >
                      🔬 Go to Analyzer
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-green-900/30 border border-green-700 rounded-xl p-3">
                    <p className="text-xs text-green-400">✅ Conversion complete!</p>
                  </div>
                  <pre className="bg-gray-800 rounded-xl p-4 text-xs text-gray-300 overflow-auto max-h-96 font-mono">
                    {result}
                  </pre>
                </div>
              )}

              <button
                onClick={() => { setStep(1); setFile(null); setExtractedText(''); setResult('') }}
                className="btn-secondary text-xs w-full"
              >
                Upload Another File
              </button>
            </div>
          )}

          {!file && (
            <div className="card text-center py-16 border-dashed">
              <p className="text-5xl mb-3">📎</p>
              <p className="text-gray-400 text-sm">Upload a file to get started</p>
              <p className="text-gray-600 text-xs mt-1">Supports JPG, PNG, WEBP, and PDF</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}