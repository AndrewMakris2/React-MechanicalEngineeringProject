import React, { useState } from 'react'
import type { LLMConfig } from '../lib/llmService'

interface Props {
  config: LLMConfig
}

const SUBJECTS = [
  'Statics',
  'Dynamics',
  'Thermodynamics',
  'Fluid Mechanics',
  'Mechanics of Materials',
  'Machine Design',
  'Heat Transfer',
]

const DIFFICULTIES = ['Easy', 'Medium', 'Hard']

const TOPICS: Record<string, string[]> = {
  Statics: ['Equilibrium of particles', 'Equilibrium of rigid bodies', 'Free body diagrams', 'Truss analysis', 'Friction', 'Centroids & moments of inertia', 'Internal forces'],
  Dynamics: ['Kinematics of particles', 'Newton\'s second law', 'Work-energy theorem', 'Impulse-momentum', 'Relative motion', 'Rotation of rigid bodies', 'Vibrations'],
  Thermodynamics: ['First law (closed systems)', 'First law (open systems)', 'Second law & entropy', 'Ideal gas law', 'Power cycles', 'Refrigeration cycles', 'Mixtures'],
  'Fluid Mechanics': ['Fluid statics', 'Bernoulli equation', 'Continuity equation', 'Pipe flow & head loss', 'Dimensional analysis', 'Drag & lift', 'Pump/turbine problems'],
  'Mechanics of Materials': ['Axial stress/strain', 'Torsion of shafts', 'Beam bending', 'Beam deflection', 'Columns & buckling', 'Pressure vessels', 'Stress transformations'],
  'Machine Design': ['Shaft design', 'Fatigue analysis', 'Gear design', 'Bearing selection', 'Spring design', 'Welded joints', 'Bolted connections'],
  'Heat Transfer': ['Conduction (1D)', 'Convection', 'Radiation', 'Fins', 'Transient conduction', 'Heat exchangers', 'Combined modes'],
}

const MOCK_PROBLEMS: Record<string, string> = {
  Statics: `A beam AB of length 6 m is supported by a pin at A and a roller at B. A uniformly distributed load of 8 kN/m acts over the entire span. Additionally, a concentrated load of 24 kN acts downward at 2 m from A.

(a) Draw the free body diagram of the beam.
(b) Determine the support reactions at A and B.
(c) Draw the shear force and bending moment diagrams.
(d) Find the location and magnitude of the maximum bending moment.`,
  Dynamics: `A 15 kg block is released from rest at the top of a 30° incline. The coefficient of kinetic friction between the block and the incline is μk = 0.25. The incline is 8 m long.

(a) Draw the free body diagram showing all forces.
(b) Calculate the acceleration of the block as it slides down.
(c) Find the velocity of the block when it reaches the bottom.
(d) If the block then slides on a flat surface with the same friction coefficient, how far does it travel before stopping?`,
}

export default function ProblemGeneratorPage({ config }: Props) {
  const [subject, setSubject] = useState('Statics')
  const [topic, setTopic] = useState(TOPICS.Statics[0])
  const [difficulty, setDifficulty] = useState('Medium')
  const [customContext, setCustomContext] = useState('')
  const [generated, setGenerated] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  function handleSubjectChange(s: string) {
    setSubject(s)
    setTopic(TOPICS[s][0])
    setGenerated(null)
    setError(null)
  }

  async function handleGenerate() {
    if (config.mode === 'mock') {
      setGenerated(MOCK_PROBLEMS[subject] ?? MOCK_PROBLEMS.Statics)
      return
    }

    setLoading(true)
    setError(null)
    setGenerated(null)

    const prompt = `Generate a realistic ${difficulty.toLowerCase()} undergraduate ${subject} problem about "${topic}".
${customContext ? `Additional context: ${customContext}` : ''}

Requirements:
- Write a clear, realistic engineering problem with specific numbers
- Include multiple parts (a), (b), (c)... if appropriate
- Problem should be solvable in 10-20 minutes for a ${difficulty.toLowerCase()} difficulty
- Do NOT provide the solution — only the problem statement
- Use proper engineering units and notation
- Make it feel like a real textbook or exam problem

Return ONLY the problem statement text, no headers, no solution, no preamble.`

    try {
      const res = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate_problem',
          prompt,
          subject,
          topic,
          difficulty,
          groqApiKey: config.groqApiKey,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      setGenerated(data.problem ?? data.text ?? data.content ?? JSON.stringify(data))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate problem')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!generated) return
    try {
      await navigator.clipboard.writeText(generated)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Problem Generator</h1>
        <p className="text-gray-400 text-sm mt-1">Generate custom practice problems on demand</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Configuration panel */}
        <div className="card space-y-4">
          <h2 className="text-base font-semibold text-white">Configure Problem</h2>

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Subject</label>
            <div className="grid grid-cols-2 gap-2">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => handleSubjectChange(s)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-all ${
                    subject === s ? 'text-blue-300' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={subject === s ? {
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Topic</label>
            <select
              value={topic}
              onChange={e => setTopic(e.target.value)}
              className="input-base"
            >
              {(TOPICS[subject] ?? []).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                    difficulty === d ? (
                      d === 'Easy' ? 'text-green-300' : d === 'Medium' ? 'text-yellow-300' : 'text-red-300'
                    ) : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={difficulty === d ? {
                    background: d === 'Easy' ? 'rgba(34,197,94,0.1)' : d === 'Medium' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${d === 'Easy' ? 'rgba(34,197,94,0.3)' : d === 'Medium' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Custom context */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Custom context <span className="text-gray-600">(optional)</span>
            </label>
            <textarea
              value={customContext}
              onChange={e => setCustomContext(e.target.value)}
              className="input-base"
              rows={2}
              placeholder="e.g. 'involving a cantilever beam with two point loads'"
              style={{ resize: 'vertical' }}
            />
          </div>

          {config.mode === 'mock' && (
            <p className="text-xs text-purple-400 bg-purple-900/10 border border-purple-900/30 rounded-lg px-3 py-2">
              Demo mode — showing a sample problem. Add your Groq API key in Account settings for AI-generated problems.
            </p>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full btn-primary py-2.5 flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Generating…' : '✨ Generate Problem'}
          </button>
        </div>

        {/* Result panel */}
        <div>
          {error && (
            <div className="card border-red-900/40 text-red-400 text-sm p-4">
              <p className="font-medium mb-1">Error generating problem</p>
              <p className="text-red-400/80">{error}</p>
            </div>
          )}

          {!generated && !error && !loading && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <span className="text-5xl mb-4">⚡</span>
              <p className="text-white font-medium mb-1">Ready to generate</p>
              <p className="text-gray-400 text-sm">Configure your problem on the left and click Generate</p>
            </div>
          )}

          {loading && (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <span className="inline-block w-10 h-10 border-2 border-blue-600/30 border-t-blue-500 rounded-full animate-spin mb-4" />
              <p className="text-white font-medium">Generating your problem…</p>
              <p className="text-gray-500 text-sm mt-1">This takes a few seconds</p>
            </div>
          )}

          {generated && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white">Generated Problem</h2>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{
                        background: difficulty === 'Easy' ? 'rgba(34,197,94,0.1)' : difficulty === 'Medium' ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                        color: difficulty === 'Easy' ? '#86efac' : difficulty === 'Medium' ? '#fde047' : '#fca5a5',
                        border: `1px solid ${difficulty === 'Easy' ? 'rgba(34,197,94,0.3)' : difficulty === 'Medium' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      }}
                    >
                      {difficulty}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{subject} · {topic}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="btn-secondary text-xs px-3 py-1.5"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                  <button
                    onClick={handleGenerate}
                    className="btn-secondary text-xs px-3 py-1.5"
                    disabled={loading}
                  >
                    🔄 Regenerate
                  </button>
                </div>
              </div>

              <div
                className="rounded-xl p-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  fontFamily: 'inherit',
                }}
              >
                {generated}
              </div>

              <p className="text-xs text-gray-500">
                Tip: Copy this problem and paste it into the{' '}
                <a href="/analyzer" className="text-blue-400 hover:text-blue-300">Problem Analyzer</a>
                {' '}for a full structured breakdown.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
