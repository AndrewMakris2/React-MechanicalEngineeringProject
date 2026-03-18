import React, { useState } from 'react'
import type { Result } from '../../lib/schema'

interface Props { result: Result }

export default function SolutionTab({ result }: Props) {
  const [revealedSteps, setRevealedSteps] = useState<number>(0)
  const [hintsMode, setHintsMode] = useState(false)
  const [answerRevealed, setAnswerRevealed] = useState(false)
  const total = result.solutionOutline.length
  const hasAnswer = result.finalAnswer && result.finalAnswer.length > 0

  function revealNext() {
    setRevealedSteps(prev => Math.min(prev + 1, total))
  }

  function reset() {
    setRevealedSteps(0)
    setHintsMode(true)
    setAnswerRevealed(false)
  }

  function showAll() {
    setHintsMode(false)
    setRevealedSteps(0)
  }

  const visibleSteps = hintsMode
    ? result.solutionOutline.slice(0, revealedSteps)
    : result.solutionOutline

  return (
    <div className="space-y-4">

      {/* Final Answer Box — always at top, hidden until revealed */}
      {hasAnswer && (
        <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${
          answerRevealed
            ? 'border-green-600 bg-green-900/20'
            : 'border-gray-600 bg-gray-800/50'
        }`}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">{answerRevealed ? '✅' : '🎯'}</span>
              <span className="text-sm font-semibold text-white">Final Answer</span>
              {!answerRevealed && (
                <span className="text-xs text-gray-500">— try it yourself first</span>
              )}
            </div>
            {!answerRevealed && (
              <button
                onClick={() => setAnswerRevealed(true)}
                className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
              >
                Reveal Answer
              </button>
            )}
          </div>

          {answerRevealed && (
            <div className="px-4 pb-4 space-y-2">
              {result.finalAnswer.map((a, i) => (
                <div key={i} className="flex items-baseline gap-2 bg-gray-900/50 rounded-lg px-3 py-2.5">
                  <span className="text-green-400 font-mono font-bold text-sm min-w-[2rem]">{a.symbol}</span>
                  <span className="text-white font-semibold text-base">=</span>
                  <span className="text-green-300 font-mono font-bold text-base">{a.value}</span>
                  {a.units && (
                    <span className="text-gray-400 text-sm font-mono">{a.units}</span>
                  )}
                  {a.description && (
                    <span className="text-gray-500 text-xs ml-auto truncate max-w-[40%]">{a.description}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mode Toggle */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">{total}-step solution</p>
        <div className="flex gap-2">
          <button
            onClick={showAll}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              !hintsMode
                ? 'bg-blue-600 border-blue-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            📋 Show All
          </button>
          <button
            onClick={reset}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              hintsMode
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
            }`}
          >
            💡 Hints Mode
          </button>
        </div>
      </div>

      {/* Hints Mode Banner */}
      {hintsMode && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-xl p-3 text-xs text-purple-300">
          💡 <strong>Hints Mode ON</strong> — Attempt each step yourself before revealing.
          <span className="ml-2 text-purple-400 font-mono">{revealedSteps}/{total} revealed</span>
        </div>
      )}

      {/* Progress Bar */}
      {hintsMode && (
        <div className="w-full bg-gray-700 rounded-full h-1.5">
          <div
            className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(revealedSteps / total) * 100}%` }}
          />
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {visibleSteps.map((step) => (
          <div
            key={step.step}
            className="card flex gap-4"
            style={{ animation: hintsMode ? 'fadeIn 0.3s ease-in' : 'none' }}
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
              {step.step}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-200 mb-1">{step.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{step.details}</p>
              {step.calculation && (
                <div className="mt-2 bg-gray-900 rounded-lg px-3 py-2 border border-gray-700">
                  <p className="text-xs text-yellow-300 font-mono leading-relaxed break-words">{step.calculation}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hidden steps indicator */}
      {hintsMode && revealedSteps < total && (
        <div className="border border-dashed border-gray-700 rounded-xl p-4 text-center">
          <p className="text-xs text-gray-500 mb-2">
            {total - revealedSteps} step{total - revealedSteps !== 1 ? 's' : ''} remaining
          </p>
          <div className="flex gap-2 justify-center flex-wrap">
            {Array.from({ length: total - revealedSteps }, (_, i) => (
              <div key={i} className="w-8 h-8 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center text-xs text-gray-600">
                {revealedSteps + i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hints Mode Buttons */}
      {hintsMode && (
        <div className="flex gap-3">
          {revealedSteps < total ? (
            <button onClick={revealNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
              💡 Reveal Step {revealedSteps + 1}
            </button>
          ) : (
            <div className="flex-1 bg-green-900/30 border border-green-700 rounded-xl p-3 text-center">
              <p className="text-green-400 text-sm font-semibold">✅ All steps revealed!</p>
              {!answerRevealed && hasAnswer && (
                <button
                  onClick={() => setAnswerRevealed(true)}
                  className="mt-1 text-xs text-green-300 underline"
                >
                  Check your final answer ↑
                </button>
              )}
            </div>
          )}
          <button onClick={showAll} className="btn-secondary text-xs">Show All</button>
          <button onClick={reset} className="btn-secondary text-xs">Reset</button>
        </div>
      )}
    </div>
  )
}
