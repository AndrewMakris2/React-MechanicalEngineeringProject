import React from 'react'
import { useNavigate } from 'react-router-dom'
import { loadCards } from '../lib/flashcardStorage'
import { useProblemHistory } from '../hooks/useProblemHistory'

const FEATURES = [
  {
    path: '/analyzer',
    icon: '🔬',
    title: 'Problem Analyzer',
    description: 'Paste any engineering problem and get a full structured breakdown with equations, variables, assumptions, and step-by-step guidance.',
    color: 'from-blue-900/50 to-blue-800/30 border-blue-700',
    badge: 'Core Feature',
    badgeColor: 'bg-blue-900 text-blue-300',
  },
  {
    path: '/tutor',
    icon: '🤖',
    title: 'AI Tutor',
    description: 'Chat with an AI engineering professor. Ask follow-up questions, get hints, and understand concepts without just being given the answer.',
    color: 'from-green-900/50 to-green-800/30 border-green-700',
    badge: 'Interactive',
    badgeColor: 'bg-green-900 text-green-300',
  },
  {
    path: '/flashcards',
    icon: '🃏',
    title: 'Flashcards',
    description: 'Auto-generate flashcards from any analyzed problem or create your own. Study with flip animations and track your progress.',
    color: 'from-purple-900/50 to-purple-800/30 border-purple-700',
    badge: 'Study Tool',
    badgeColor: 'bg-purple-900 text-purple-300',
  },
  {
    path: '/quiz',
    icon: '📝',
    title: 'Quiz Mode',
    description: 'Test your knowledge with auto-generated multiple choice questions. Track your scores and identify weak areas.',
    color: 'from-yellow-900/50 to-yellow-800/30 border-yellow-700',
    badge: 'New',
    badgeColor: 'bg-yellow-900 text-yellow-300',
  },
  {
    path: '/upload',
    icon: '📎',
    title: 'Upload & Convert',
    description: 'Upload photos or PDFs of your homework and convert them into flashcards, practice problems, or study guides instantly.',
    color: 'from-orange-900/50 to-orange-800/30 border-orange-700',
    badge: 'Smart OCR',
    badgeColor: 'bg-orange-900 text-orange-300',
  },
]

const SUBJECTS = [
  { icon: '⚖️', name: 'Statics', color: 'text-blue-400' },
  { icon: '🚀', name: 'Dynamics', color: 'text-purple-400' },
  { icon: '🔥', name: 'Thermo', color: 'text-orange-400' },
  { icon: '💧', name: 'Fluids', color: 'text-cyan-400' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { history } = useProblemHistory()
  const cards = loadCards()

  const stats = {
    problems: history.length,
    flashcards: cards.length,
    known: cards.filter(c => c.status === 'known').length,
  }

  return (
    <div className="space-y-6 sm:space-y-8">

      {/* Hero */}
      <div className="text-center space-y-4 py-4 sm:py-8">
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-4xl sm:text-5xl">⚙️</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white">
          Welcome to <span className="text-blue-400">MechStudy</span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-2">
          Your AI-powered engineering study platform. Analyze problems, chat with a tutor,
          create flashcards, and ace your exams.
        </p>

        {/* Subjects */}
        <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap mt-2">
          {SUBJECTS.map(s => (
            <div key={s.name} className="flex items-center gap-1.5 text-xs sm:text-sm">
              <span>{s.icon}</span>
              <span className={s.color}>{s.name}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <button
            onClick={() => navigate('/analyzer')}
            className="btn-primary px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base"
          >
            🔬 Start Analyzing
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="btn-secondary px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base"
          >
            📎 Upload Problem
          </button>
        </div>
      </div>

      {/* Stats */}
      {(stats.problems > 0 || stats.flashcards > 0) && (
        <div className="grid grid-cols-3 gap-3">
          <div className="card text-center p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold text-blue-400">{stats.problems}</p>
            <p className="text-xs text-gray-400 mt-1">Problems</p>
          </div>
          <div className="card text-center p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold text-purple-400">{stats.flashcards}</p>
            <p className="text-xs text-gray-400 mt-1">Flashcards</p>
          </div>
          <div className="card text-center p-3 sm:p-4">
            <p className="text-2xl sm:text-3xl font-bold text-green-400">{stats.known}</p>
            <p className="text-xs text-gray-400 mt-1">Mastered</p>
          </div>
        </div>
      )}

      {/* Feature Cards */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Study Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map(feature => (
            <button
              key={feature.path}
              onClick={() => navigate(feature.path)}
              className={`card bg-gradient-to-br ${feature.color} text-left hover:scale-[1.02] active:scale-[0.98] transition-transform cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl sm:text-3xl">{feature.icon}</span>
                <span className={`badge ${feature.badgeColor} text-xs`}>{feature.badge}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Problems */}
      {history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-white">Recent Problems</h2>
            <button
              onClick={() => navigate('/analyzer')}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View all →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {history.slice(0, 4).map(entry => (
              <button
                key={entry.id}
                onClick={() => navigate('/analyzer')}
                className="card text-left hover:border-blue-600 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge bg-gray-700 text-gray-300 text-xs">
                    {entry.result.detectedDomain}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-300 line-clamp-2">{entry.problemText}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Start Guide */}
      <div className="card bg-gradient-to-br from-gray-900 to-gray-800">
        <h2 className="text-base sm:text-lg font-bold text-white mb-4">🚀 Quick Start Guide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { step: 1, icon: '📋', title: 'Paste Problem', desc: 'Copy any engineering problem from your homework or textbook' },
            { step: 2, icon: '🔬', title: 'Analyze It', desc: 'Click Analyze and get a full structured breakdown instantly' },
            { step: 3, icon: '🤖', title: 'Ask Questions', desc: 'Use the AI Tutor to ask follow-up questions and get hints' },
            { step: 4, icon: '🃏', title: 'Create Cards', desc: 'Generate flashcards from the analysis to study for exams' },
          ].map(s => (
            <div key={s.step} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{s.icon} {s.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}