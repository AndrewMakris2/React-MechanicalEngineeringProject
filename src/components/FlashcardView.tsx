import React, { useState, useEffect } from 'react'
import type { Flashcard } from '../lib/flashcardStorage'

interface Props {
  card: Flashcard
  onKnown: () => void
  onLearning: () => void
  onSkip: () => void
  current: number
  total: number
}

export default function FlashcardView({ card, onKnown, onLearning, onSkip, current, total }: Props) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    setFlipped(false)
  }, [card.id])

  const SUBJECT_COLORS: Record<string, string> = {
    statics:  'from-blue-900 to-blue-800',
    dynamics: 'from-purple-900 to-purple-800',
    thermo:   'from-orange-900 to-orange-800',
    fluids:   'from-cyan-900 to-cyan-800',
    unknown:  'from-gray-800 to-gray-700',
  }

  const gradient = SUBJECT_COLORS[card.subject] ?? SUBJECT_COLORS.unknown

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Card {current} of {total}</span>
        <span className={`badge ${
          card.status === 'known' ? 'bg-green-900 text-green-300' :
          card.status === 'learning' ? 'bg-yellow-900 text-yellow-300' :
          'bg-gray-700 text-gray-300'
        }`}>
          {card.status === 'known' ? '✓ Known' : card.status === 'learning' ? '↻ Learning' : '● New'}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-700 rounded-full h-1">
        <div
          className="bg-blue-500 h-1 rounded-full transition-all duration-300"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>

      {/* Card */}
      <div
        className="relative cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(f => !f)}
      >
        <div
          className="relative transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          {/* Front */}
          <div
            className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} border border-gray-600 p-6 flex flex-col items-center justify-center`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Question</p>
            <p className="text-lg font-semibold text-white text-center leading-relaxed">
              {card.front}
            </p>
            <p className="text-xs text-gray-500 mt-6">Click to reveal answer</p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl bg-gray-800 border border-gray-600 p-6 flex flex-col items-center justify-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-4">Answer</p>
            <p className="text-base text-gray-200 text-center leading-relaxed">
              {card.back}
            </p>
            <p className="text-xs text-gray-500 mt-6">How well did you know this?</p>
          </div>
        </div>
      </div>

      {/* Action buttons - only show when flipped */}
      {flipped ? (
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={onLearning}
            className="bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-300 font-medium py-3 rounded-xl transition-colors text-sm"
          >
            ✗ Still Learning
          </button>
          <button
            onClick={onSkip}
            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 font-medium py-3 rounded-xl transition-colors text-sm"
          >
            → Skip
          </button>
          <button
            onClick={onKnown}
            className="bg-green-900/50 hover:bg-green-800 border border-green-700 text-green-300 font-medium py-3 rounded-xl transition-colors text-sm"
          >
            ✓ Got It
          </button>
        </div>
      ) : (
        <button
          onClick={() => setFlipped(true)}
          className="w-full btn-primary py-3"
        >
          Flip Card
        </button>
      )}
    </div>
  )
}