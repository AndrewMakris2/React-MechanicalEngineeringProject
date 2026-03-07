import React, { useState, useCallback } from 'react'
import type { LLMConfig } from '../lib/llmService'
import { useProblemHistory } from '../hooks/useProblemHistory'

interface Props { config: LLMConfig }

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
  subject: string
}

interface QuizResult {
  questionIndex: number
  selectedIndex: number
  correct: boolean
}

export default function QuizPage({ config }: Props) {
  const { history } = useProblemHistory()
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizComplete, setQuizComplete] = useState(false)
  const [subject, setSubject] = useState('auto')
  const [difficulty, setDifficulty] = useState('medium')
  const [questionCount, setQuestionCount] = useState(5)

  const generateQuiz = useCallback(async () => {
    setLoading(true)
    setError(null)
    setQuestions([])
    setResults([])
    setCurrentQ(0)
    setSelectedAnswer(null)
    setShowExplanation(false)
    setQuizComplete(false)

    if (config.mode === 'mock') {
      await new Promise(r => setTimeout(r, 1000))
      setQuestions([
        {
          question: 'A block is in static equilibrium on a frictionless inclined plane at 30 degrees. Which equation applies to forces perpendicular to the surface?',
          options: ['N = mg sin(30)', 'N = mg cos(30)', 'N = mg tan(30)', 'N = mg'],
          correctIndex: 1,
          explanation: 'The normal force N must balance the component of weight perpendicular to the surface, which is mg cos(theta). With theta = 30 degrees, N = mg cos(30). The component along the surface is mg sin(30).',
          subject: 'statics',
        },
        {
          question: 'What is the first law of thermodynamics?',
          options: [
            'Energy cannot be created or destroyed, only transformed',
            'Entropy always increases in an isolated system',
            'Heat flows from hot to cold',
            'The efficiency of a heat engine is always less than 1',
          ],
          correctIndex: 0,
          explanation: 'The first law states conservation of energy: dU = Q - W, where U is internal energy, Q is heat added, and W is work done by the system.',
          subject: 'thermo',
        },
        {
          question: 'In a Bernoulli flow, if velocity increases what happens to pressure?',
          options: ['Pressure increases', 'Pressure decreases', 'Pressure stays the same', 'Cannot be determined'],
          correctIndex: 1,
          explanation: 'By Bernoulli equation P + 0.5 * rho * V^2 = constant. If V increases, P must decrease to maintain the constant. This is the Venturi effect.',
          subject: 'fluids',
        },
        {
          question: 'A projectile is launched at 45 degrees. At maximum height, what is the vertical velocity?',
          options: ['Equal to initial vertical velocity', 'Half the initial velocity', 'Zero', 'Equal to horizontal velocity'],
          correctIndex: 2,
          explanation: 'At maximum height, the projectile momentarily stops moving vertically before coming back down. The vertical velocity is zero at this point, while horizontal velocity remains unchanged.',
          subject: 'dynamics',
        },
        {
          question: 'Which process involves no heat transfer?',
          options: ['Isothermal', 'Isobaric', 'Adiabatic', 'Isochoric'],
          correctIndex: 2,
          explanation: 'An adiabatic process has no heat transfer (Q = 0). Isothermal means constant temperature, isobaric means constant pressure, and isochoric means constant volume.',
          subject: 'thermo',
        },
      ].slice(0, questionCount))
      setLoading(false)
      return
    }

    try {
      const contextStr = history.length > 0
        ? `Recent topics studied: ${history.slice(0, 3).map(h => h.result.detectedDomain + ': ' + h.result.problemSummary).join('; ')}`
        : ''

      const prompt = `You are an expert engineering professor. Generate exactly ${questionCount} multiple choice questions.

Subject: ${subject === 'auto' ? 'Mix of Statics, Dynamics, Thermodynamics, and Fluids' : subject}
Difficulty: ${difficulty}
${contextStr}

MANDATORY CONSTANTS:
- g = 9.81 m/s² (gravity) - NEVER use 9.8 or 10
- rho_water = 1000 kg/m³
- rho_air = 1.225 kg/m³

MANDATORY PROCESS FOR EACH QUESTION:
Step 1: Write the question with all given values
Step 2: Calculate the answer yourself showing every step
Step 3: Write the correct answer as one of the 4 options
Step 4: Set correctIndex to point to that exact answer
Step 5: Create 3 wrong options using common mistakes like wrong g value
Step 6: Write the full calculation in explanation field

Return ONLY valid JSON no markdown:
{
  "questions": [
    {
      "question": "Full question with all given values",
      "options": ["answer with units", "wrong option 2", "wrong option 3", "wrong option 4"],
      "correctIndex": 0,
      "explanation": "Full calculation shown step by step. P = rho * g * h = 1000 * 9.81 * 10 = 98100 Pa. Wrong answers use g=9.8 giving 98000 or g=10 giving 100000.",
      "subject": "fluids"
    }
  ]
}

FINAL CHECK: For every question verify the option at correctIndex matches your calculated answer exactly.`

      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'quiz', prompt }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const raw = await response.json()

      let parsedQuestions: QuizQuestion[]
      if (raw.questions && Array.isArray(raw.questions)) {
        parsedQuestions = raw.questions
      } else if (raw.result?.questions) {
        parsedQuestions = raw.result.questions
      } else {
        throw new Error('Invalid quiz response format')
      }

      setQuestions(parsedQuestions)

    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [config, history, subject, difficulty, questionCount])

  function handleAnswer(index: number) {
    if (selectedAnswer !== null) return
    setSelectedAnswer(index)
    setShowExplanation(true)
    const correct = index === questions[currentQ].correctIndex
    setResults(prev => [...prev, { questionIndex: currentQ, selectedIndex: index, correct }])
  }

  function handleNext() {
    if (currentQ < questions.length - 1) {
      setCurrentQ(q => q + 1)
      setSelectedAnswer(null)
      setShowExplanation(false)
    } else {
      setQuizComplete(true)
    }
  }

  const score = results.filter(r => r.correct).length
  const currentQuestion = questions[currentQ]
  const OPTION_LABELS = ['A', 'B', 'C', 'D']

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-header">📝 Quiz Mode</h1>
        <p className="page-sub">Test your engineering knowledge with AI-generated questions</p>
      </div>

      {/* Setup Screen */}
      {questions.length === 0 && !loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Settings */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card space-y-4">
              <h3 className="text-sm font-semibold text-white">Quiz Settings</h3>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Subject</label>
                <select className="input-base" value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="auto">🔀 Mixed</option>
                  <option value="statics">⚖️ Statics</option>
                  <option value="dynamics">🚀 Dynamics</option>
                  <option value="thermo">🔥 Thermodynamics</option>
                  <option value="fluids">💧 Fluids</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Difficulty</label>
                <select className="input-base" value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Number of Questions</label>
                <select className="input-base" value={questionCount} onChange={e => setQuestionCount(Number(e.target.value))}>
                  <option value={5}>5 questions</option>
                  <option value={10}>10 questions</option>
                  <option value={15}>15 questions</option>
                </select>
              </div>

              <button
                onClick={generateQuiz}
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Generating Quiz...' : '🎯 Start Quiz'}
              </button>

              {error && (
                <div className="bg-red-900/30 border border-red-700 rounded-xl p-3">
                  <p className="text-xs text-red-300">🚨 {error}</p>
                </div>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="card bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-700">
              <h3 className="text-sm font-bold text-yellow-300 mb-3">How Quiz Mode Works</h3>
              <div className="space-y-3">
                {[
                  { step: 1, text: 'Choose your subject, difficulty, and number of questions' },
                  { step: 2, text: 'AI generates questions tailored to your recent study topics' },
                  { step: 3, text: 'Answer each multiple choice question' },
                  { step: 4, text: 'Get instant feedback and full calculation explanations' },
                  { step: 5, text: 'Review your score and see every correct answer with working shown' },
                ].map(s => (
                  <div key={s.step} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-yellow-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {s.step}
                    </div>
                    <p className="text-sm text-gray-300">{s.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="card text-center bg-green-900/20 border-green-700">
                <p className="text-2xl font-bold text-green-400">🟢</p>
                <p className="text-xs font-semibold text-green-300 mt-1">Easy</p>
                <p className="text-xs text-gray-500 mt-1">Definitions and basic concepts</p>
              </div>
              <div className="card text-center bg-yellow-900/20 border-yellow-700">
                <p className="text-2xl font-bold text-yellow-400">🟡</p>
                <p className="text-xs font-semibold text-yellow-300 mt-1">Medium</p>
                <p className="text-xs text-gray-500 mt-1">Application and problem solving</p>
              </div>
              <div className="card text-center bg-red-900/20 border-red-700">
                <p className="text-2xl font-bold text-red-400">🔴</p>
                <p className="text-xs font-semibold text-red-300 mt-1">Hard</p>
                <p className="text-xs text-gray-500 mt-1">Multi-step complex problems</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-10 w-10 text-yellow-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <p className="text-gray-400 text-sm">Generating your quiz...</p>
          <p className="text-gray-600 text-xs">Validating all answers for accuracy...</p>
        </div>
      )}

      {/* Quiz Complete */}
      {quizComplete && (
        <div className="max-w-xl mx-auto space-y-4">
          <div className="card text-center border-yellow-700 bg-yellow-900/20 space-y-4 py-8">
            <p className="text-5xl">{score === questions.length ? '🏆' : score >= questions.length / 2 ? '🎉' : '📚'}</p>
            <h2 className="text-2xl font-bold text-white">Quiz Complete!</h2>
            <p className="text-4xl font-bold text-yellow-400">{score}/{questions.length}</p>
            <p className="text-gray-400 text-sm">
              {score === questions.length ? 'Perfect score! Excellent work!' :
               score >= questions.length * 0.8 ? 'Great job! Almost perfect!' :
               score >= questions.length * 0.6 ? 'Good effort! Keep studying!' :
               'Keep practicing — you will get there!'}
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={generateQuiz} className="btn-primary">Try Again</button>
              <button onClick={() => { setQuestions([]); setQuizComplete(false) }} className="btn-secondary">New Quiz</button>
            </div>
          </div>

          {/* Review */}
          <h3 className="text-sm font-semibold text-white">Review Answers</h3>
          {questions.map((q, i) => {
            const result = results[i]
            return (
              <div key={i} className={`card border ${result?.correct ? 'border-green-700 bg-green-900/10' : 'border-red-700 bg-red-900/10'}`}>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-lg shrink-0">{result?.correct ? '✅' : '❌'}</span>
                  <p className="text-sm text-gray-200 font-medium">{q.question}</p>
                </div>
                <p className="text-xs text-green-400 mb-1">✓ Correct: {q.options[q.correctIndex]}</p>
                {!result?.correct && (
                  <p className="text-xs text-red-400 mb-1">✗ You chose: {q.options[result?.selectedIndex ?? 0]}</p>
                )}
                <p className="text-xs text-gray-500 mt-2 italic leading-relaxed">{q.explanation}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Active Quiz */}
      {questions.length > 0 && !quizComplete && currentQuestion && (
        <div className="max-w-2xl mx-auto space-y-4">

          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Question {currentQ + 1} of {questions.length}</span>
            <span className="badge bg-gray-700 text-gray-300">{currentQuestion.subject}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Score */}
          <div className="flex justify-between text-xs">
            <span className="text-green-400">✓ {results.filter(r => r.correct).length} correct</span>
            <span className="text-red-400">✗ {results.filter(r => !r.correct).length} wrong</span>
          </div>

          {/* Question */}
          <div className="card">
            <p className="text-base font-semibold text-white leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Options */}
          <div className="space-y-2">
            {currentQuestion.options.map((option, i) => {
              let style = 'bg-gray-800 border-gray-600 text-gray-200 hover:border-gray-400 cursor-pointer'
              if (selectedAnswer !== null) {
                if (i === currentQuestion.correctIndex) {
                  style = 'bg-green-900/50 border-green-600 text-green-300 cursor-default'
                } else if (i === selectedAnswer && i !== currentQuestion.correctIndex) {
                  style = 'bg-red-900/50 border-red-600 text-red-300 cursor-default'
                } else {
                  style = 'bg-gray-800 border-gray-700 text-gray-500 cursor-default'
                }
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${style}`}
                >
                  <span className="font-bold mr-3">{OPTION_LABELS[i]}.</span>
                  {option}
                </button>
              )
            })}
          </div>

          {/* Explanation */}
          {showExplanation && (
            <div className={`card border ${selectedAnswer === currentQuestion.correctIndex ? 'border-green-700 bg-green-900/20' : 'border-red-700 bg-red-900/20'}`}>
              <p className="text-xs font-semibold text-gray-300 mb-1">
                {selectedAnswer === currentQuestion.correctIndex ? '✅ Correct!' : `❌ Incorrect — Correct answer: ${currentQuestion.options[currentQuestion.correctIndex]}`}
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {selectedAnswer !== null && (
            <button onClick={handleNext} className="btn-primary w-full py-3">
              {currentQ < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}