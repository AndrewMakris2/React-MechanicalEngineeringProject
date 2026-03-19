import React, { useState, useEffect, useRef } from 'react'
import type { LLMConfig } from '../lib/llmService'

interface Props {
  config: LLMConfig
}

interface ExamQuestion {
  id: number
  text: string
  points: number
}

interface ExamState {
  questions: ExamQuestion[]
  answers: Record<number, string>
  selfScores: Record<number, number>
  phase: 'setup' | 'active' | 'grading' | 'results'
  subject: string
  difficulty: string
  numQuestions: number
  durationMinutes: number
  startedAt: number | null
}

const SUBJECTS = ['Statics', 'Dynamics', 'Thermodynamics', 'Fluid Mechanics', 'Mechanics of Materials']
const DIFFICULTIES = ['Easy', 'Medium', 'Hard', 'Mixed']
const DURATIONS = [15, 30, 45, 60, 90]
const QUESTION_COUNTS = [3, 5, 7, 10]

const MOCK_QUESTIONS: ExamQuestion[] = [
  {
    id: 1,
    text: 'A simply supported beam of span 4 m carries a point load of 20 kN at its midpoint. Determine: (a) the support reactions, (b) the maximum bending moment, and (c) the shear force at 1 m from the left support.',
    points: 20,
  },
  {
    id: 2,
    text: 'Two forces, F₁ = 30 N at 45° above horizontal and F₂ = 25 N at 120° from the positive x-axis, act on a particle. Find the resultant force magnitude and direction.',
    points: 15,
  },
  {
    id: 3,
    text: 'A ladder of length 5 m and weight 200 N rests against a smooth vertical wall, with its foot on rough horizontal ground. The ladder makes 60° with the horizontal. Find the minimum coefficient of static friction required to prevent slipping.',
    points: 25,
  },
]

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ExamSimulatorPage({ config }: Props) {
  const [exam, setExam] = useState<ExamState>({
    questions: [],
    answers: {},
    selfScores: {},
    phase: 'setup',
    subject: 'Statics',
    difficulty: 'Medium',
    numQuestions: 5,
    durationMinutes: 30,
    startedAt: null,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [activeQuestion, setActiveQuestion] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer
  useEffect(() => {
    if (exam.phase === 'active' && exam.startedAt) {
      const totalSeconds = exam.durationMinutes * 60
      const elapsed = Math.floor((Date.now() - exam.startedAt) / 1000)
      setTimeLeft(Math.max(0, totalSeconds - elapsed))

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setExam(e => ({ ...e, phase: 'grading' }))
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [exam.phase, exam.startedAt])

  async function handleStartExam() {
    if (config.mode === 'mock') {
      const questions = MOCK_QUESTIONS.slice(0, Math.min(exam.numQuestions, MOCK_QUESTIONS.length))
      const now = Date.now()
      setExam(e => ({ ...e, questions, phase: 'active', startedAt: now, answers: {}, selfScores: {} }))
      setActiveQuestion(0)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    const prompt = `Generate ${exam.numQuestions} ${exam.difficulty.toLowerCase()} ${exam.subject} exam questions for an undergraduate engineering student.

Requirements:
- Each question should be a realistic, solvable problem (not multiple choice)
- Vary the topics within ${exam.subject}
- Include specific numbers for calculations
- ${exam.difficulty === 'Mixed' ? 'Mix easy, medium, and hard difficulty' : `All questions at ${exam.difficulty} difficulty`}
- Format as JSON array with this exact structure:
[
  {"id": 1, "text": "Full question text here...", "points": 20},
  {"id": 2, "text": "Full question text here...", "points": 25}
]
- Total points should sum to 100
- Return ONLY the JSON array, no other text`

    try {
      const res = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'generate_problem',
          prompt,
          subject: exam.subject,
          difficulty: exam.difficulty,
          numQuestions: exam.numQuestions,
          groqApiKey: config.groqApiKey,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      const rawText = data.problem ?? data.text ?? data.content ?? ''

      // Parse JSON from response
      const jsonMatch = rawText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) throw new Error('Could not parse exam questions from response')
      const questions: ExamQuestion[] = JSON.parse(jsonMatch[0])

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('No questions returned')
      }

      const now = Date.now()
      setExam(e => ({ ...e, questions, phase: 'active', startedAt: now, answers: {}, selfScores: {} }))
      setActiveQuestion(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate exam')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(questionId: number, text: string) {
    setExam(e => ({ ...e, answers: { ...e.answers, [questionId]: text } }))
  }

  function handleSubmitExam() {
    if (timerRef.current) clearInterval(timerRef.current)
    setExam(e => ({ ...e, phase: 'grading' }))
  }

  function handleScore(questionId: number, score: number) {
    setExam(e => ({ ...e, selfScores: { ...e.selfScores, [questionId]: score } }))
  }

  function handleFinishGrading() {
    setExam(e => ({ ...e, phase: 'results' }))
  }

  function handleReset() {
    if (timerRef.current) clearInterval(timerRef.current)
    setExam(e => ({ ...e, phase: 'setup', questions: [], answers: {}, selfScores: {}, startedAt: null }))
    setError(null)
    setActiveQuestion(0)
  }

  const totalPoints = exam.questions.reduce((sum, q) => sum + q.points, 0)
  const earnedPoints = Object.entries(exam.selfScores).reduce((sum, [id, score]) => {
    const q = exam.questions.find(q => q.id === Number(id))
    return sum + (q ? Math.min(score, q.points) : 0)
  }, 0)
  const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

  const timerColor = timeLeft < 300 ? '#ef4444' : timeLeft < 600 ? '#eab308' : '#22c55e'
  const answeredCount = Object.keys(exam.answers).filter(k => exam.answers[Number(k)].trim()).length

  // ─── SETUP ───────────────────────────────────────────────────────────────
  if (exam.phase === 'setup') {
    return (
      <div className="space-y-5 max-w-2xl mx-auto">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Exam Simulator</h1>
          <p className="text-gray-400 text-sm mt-1">Timed practice exam with AI-generated problems</p>
        </div>

        <div className="card space-y-5">
          <h2 className="text-base font-semibold text-white">Configure Your Exam</h2>

          {/* Subject */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Subject</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SUBJECTS.map(s => (
                <button
                  key={s}
                  onClick={() => setExam(e => ({ ...e, subject: s }))}
                  className={`py-2 px-3 rounded-xl text-xs font-medium text-left transition-all ${
                    exam.subject === s ? 'text-blue-300' : 'text-gray-400 hover:text-gray-200'
                  }`}
                  style={exam.subject === s ? {
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

          {/* Difficulty */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {DIFFICULTIES.map(d => {
                const colors = {
                  Easy: { active: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.3)', text: '#86efac' },
                  Medium: { active: 'rgba(234,179,8,0.12)', border: 'rgba(234,179,8,0.3)', text: '#fde047' },
                  Hard: { active: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5' },
                  Mixed: { active: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', text: '#d8b4fe' },
                }[d]!
                return (
                  <button
                    key={d}
                    onClick={() => setExam(e => ({ ...e, difficulty: d }))}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={exam.difficulty === d ? {
                      background: colors.active,
                      border: `1px solid ${colors.border}`,
                      color: colors.text,
                    } : {
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#6b7280',
                    }}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Questions */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Number of Questions</label>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map(n => (
                <button
                  key={n}
                  onClick={() => setExam(e => ({ ...e, numQuestions: n }))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    exam.numQuestions === n ? 'text-blue-300' : 'text-gray-400'
                  }`}
                  style={exam.numQuestions === n ? {
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">Time Limit</label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  onClick={() => setExam(e => ({ ...e, durationMinutes: d }))}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    exam.durationMinutes === d ? 'text-blue-300' : 'text-gray-400'
                  }`}
                  style={exam.durationMinutes === d ? {
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {config.mode === 'mock' && (
            <p className="text-xs text-purple-400 bg-purple-900/10 border border-purple-900/30 rounded-lg px-3 py-2">
              Demo mode — using sample questions. Add your Groq API key in Account settings for AI-generated exams.
            </p>
          )}

          {error && (
            <p className="text-xs text-red-400 bg-red-900/10 border border-red-900/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleStartExam}
            disabled={loading}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm"
          >
            {loading && (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {loading ? 'Generating questions…' : '🎓 Start Exam'}
          </button>
        </div>
      </div>
    )
  }

  // ─── ACTIVE EXAM ──────────────────────────────────────────────────────────
  if (exam.phase === 'active') {
    const q = exam.questions[activeQuestion]
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{exam.subject} Exam</h1>
            <p className="text-xs text-gray-400">{exam.difficulty} · {exam.questions.length} questions</p>
          </div>
          <div className="flex items-center gap-4">
            <div
              className="text-2xl font-mono font-bold tabular-nums"
              style={{ color: timerColor }}
            >
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={handleSubmitExam}
              className="btn-primary text-xs px-3 py-2"
            >
              Submit Exam
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5">
          {exam.questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveQuestion(i)}
              className="flex-1 h-1.5 rounded-full transition-all"
              style={{
                background: i === activeQuestion
                  ? '#3b82f6'
                  : exam.answers[exam.questions[i].id]?.trim()
                    ? 'rgba(34,197,94,0.5)'
                    : 'rgba(255,255,255,0.1)',
              }}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500">
          Question {activeQuestion + 1} of {exam.questions.length} ·{' '}
          {answeredCount} answered
        </p>

        {/* Question */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Question {activeQuestion + 1}</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              {q.points} pts
            </span>
          </div>
          <div
            className="rounded-xl p-4 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {q.text}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Your Answer</label>
            <textarea
              value={exam.answers[q.id] ?? ''}
              onChange={e => handleAnswer(q.id, e.target.value)}
              className="input-base"
              rows={8}
              placeholder="Write your full solution here, including diagrams as needed, equations, and final answers with units..."
              style={{ resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setActiveQuestion(i => Math.max(0, i - 1))}
            disabled={activeQuestion === 0}
            className="btn-secondary text-sm px-4 py-2 disabled:opacity-30"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">{activeQuestion + 1} / {exam.questions.length}</span>
          {activeQuestion < exam.questions.length - 1 ? (
            <button
              onClick={() => setActiveQuestion(i => i + 1)}
              className="btn-secondary text-sm px-4 py-2"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmitExam}
              className="btn-primary text-sm px-4 py-2"
            >
              Submit →
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─── GRADING ──────────────────────────────────────────────────────────────
  if (exam.phase === 'grading') {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-white">Self-Grade Your Exam</h1>
          <p className="text-gray-400 text-sm mt-1">Review each answer and award yourself points honestly</p>
        </div>

        {exam.questions.map((q, i) => (
          <div key={q.id} className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Question {i + 1}</h2>
              <span className="text-xs text-gray-500">{q.points} pts available</span>
            </div>

            <div
              className="rounded-xl p-3 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {q.text}
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-1">Your Answer:</p>
              <div
                className="rounded-xl p-3 text-sm text-gray-200 whitespace-pre-wrap min-h-[60px]"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {exam.answers[q.id]?.trim() || <span className="text-gray-600 italic">No answer provided</span>}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">
                Points earned (0–{q.points}):
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={q.points}
                  value={exam.selfScores[q.id] ?? 0}
                  onChange={e => handleScore(q.id, Number(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
                <span
                  className="font-mono font-bold text-lg w-12 text-right"
                  style={{ color: (exam.selfScores[q.id] ?? 0) / q.points >= 0.7 ? '#22c55e' : '#eab308' }}
                >
                  {exam.selfScores[q.id] ?? 0}
                </span>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={handleFinishGrading}
          className="w-full btn-primary py-3 text-sm"
          disabled={exam.questions.some(q => exam.selfScores[q.id] === undefined)}
        >
          See Results →
        </button>
        <p className="text-xs text-gray-500 text-center">Grade all questions before continuing</p>
      </div>
    )
  }

  // ─── RESULTS ─────────────────────────────────────────────────────────────
  const grade = scorePercent >= 90 ? { letter: 'A', color: '#22c55e' }
    : scorePercent >= 80 ? { letter: 'B', color: '#86efac' }
    : scorePercent >= 70 ? { letter: 'C', color: '#eab308' }
    : scorePercent >= 60 ? { letter: 'D', color: '#f97316' }
    : { letter: 'F', color: '#ef4444' }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Score card */}
      <div className="card text-center py-8">
        <p className="text-gray-400 text-sm mb-2">{exam.subject} · {exam.difficulty}</p>
        <div
          className="inline-flex items-center justify-center w-24 h-24 rounded-full text-5xl font-black mb-3"
          style={{ background: `${grade.color}20`, border: `2px solid ${grade.color}40`, color: grade.color }}
        >
          {grade.letter}
        </div>
        <p className="text-4xl font-bold text-white">{scorePercent}%</p>
        <p className="text-gray-400 text-sm mt-1">{earnedPoints} / {totalPoints} points</p>
        <p className="text-gray-500 text-xs mt-3">
          {exam.questions.length} questions · {exam.durationMinutes} min time limit
        </p>
      </div>

      {/* Question breakdown */}
      <div className="card">
        <h3 className="text-sm font-semibold text-white mb-4">Question Breakdown</h3>
        <div className="space-y-3">
          {exam.questions.map((q, i) => {
            const score = exam.selfScores[q.id] ?? 0
            const pct = q.points > 0 ? score / q.points : 0
            return (
              <div key={q.id} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-6 shrink-0">Q{i + 1}</span>
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct * 100}%`,
                      background: pct >= 0.7 ? '#22c55e' : pct >= 0.4 ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-300 w-12 text-right shrink-0">
                  {score}/{q.points}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={handleReset} className="flex-1 btn-primary py-2.5 text-sm">
          🔄 Take Another Exam
        </button>
        <a href="/analyzer" className="flex-1 btn-secondary py-2.5 text-sm text-center">
          🔬 Analyze a Problem
        </a>
      </div>
    </div>
  )
}
