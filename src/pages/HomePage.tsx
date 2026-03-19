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
    hoverBorder: 'rgba(59,130,246,0.3)',
    hoverGlow: 'rgba(59,130,246,0.08)',
    badge: 'Core Feature',
    badgeStyle: { background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: '#93c5fd' },
  },
  {
    path: '/tutor',
    icon: '🤖',
    title: 'AI Tutor',
    description: 'Chat with an AI engineering professor. Ask follow-up questions, get hints, and understand concepts without just being given the answer.',
    hoverBorder: 'rgba(34,197,94,0.3)',
    hoverGlow: 'rgba(34,197,94,0.06)',
    badge: 'Interactive',
    badgeStyle: { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' },
  },
  {
    path: '/flashcards',
    icon: '🃏',
    title: 'Flashcards',
    description: 'Auto-generate flashcards from any analyzed problem or create your own. Study with flip animations and track your progress.',
    hoverBorder: 'rgba(168,85,247,0.3)',
    hoverGlow: 'rgba(168,85,247,0.06)',
    badge: 'Study Tool',
    badgeStyle: { background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#d8b4fe' },
  },
  {
    path: '/quiz',
    icon: '📝',
    title: 'Quiz Mode',
    description: 'Test your knowledge with auto-generated multiple choice questions. Track your scores and identify weak areas.',
    hoverBorder: 'rgba(234,179,8,0.3)',
    hoverGlow: 'rgba(234,179,8,0.06)',
    badge: 'New',
    badgeStyle: { background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#fde047' },
  },
  {
    path: '/upload',
    icon: '📎',
    title: 'Upload & Convert',
    description: 'Upload photos or PDFs of your homework and convert them into flashcards, practice problems, or study guides instantly.',
    hoverBorder: 'rgba(249,115,22,0.3)',
    hoverGlow: 'rgba(249,115,22,0.06)',
    badge: 'Smart OCR',
    badgeStyle: { background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', color: '#fdba74' },
  },
]

const MORE_TOOLS = [
  {
    path: '/formulas',
    icon: '📐',
    title: 'Formula Sheet',
    description: 'Searchable library of 38+ engineering formulas across Statics, Dynamics, Thermo, and Fluids with variables and usage notes.',
    hoverBorder: 'rgba(99,102,241,0.3)',
    hoverGlow: 'rgba(99,102,241,0.06)',
    badge: 'Reference',
    badgeStyle: { background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' },
  },
  {
    path: '/generator',
    icon: '⚡',
    title: 'Problem Generator',
    description: 'AI generates custom practice problems on demand. Pick your subject, topic, and difficulty level.',
    hoverBorder: 'rgba(234,179,8,0.3)',
    hoverGlow: 'rgba(234,179,8,0.06)',
    badge: 'AI-Powered',
    badgeStyle: { background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', color: '#fde047' },
  },
  {
    path: '/converter',
    icon: '🔁',
    title: 'Unit Converter',
    description: 'Engineering-specific unit conversions for Force, Pressure, Energy, Power, Length, Mass, Temperature, Torque, and more.',
    hoverBorder: 'rgba(6,182,212,0.3)',
    hoverGlow: 'rgba(6,182,212,0.06)',
    badge: 'Utility',
    badgeStyle: { background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9' },
  },
  {
    path: '/exam',
    icon: '🎓',
    title: 'Exam Simulator',
    description: 'Take a timed AI-generated practice exam with self-grading. Simulate real exam pressure and track your performance.',
    hoverBorder: 'rgba(239,68,68,0.3)',
    hoverGlow: 'rgba(239,68,68,0.06)',
    badge: 'Timed',
    badgeStyle: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' },
  },
  {
    path: '/notes',
    icon: '📓',
    title: 'Concept Notes',
    description: 'Your personal engineering notebook. Create, search, and organize study notes by subject with tags.',
    hoverBorder: 'rgba(34,197,94,0.3)',
    hoverGlow: 'rgba(34,197,94,0.06)',
    badge: 'Personal',
    badgeStyle: { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#86efac' },
  },
  {
    path: '/progress',
    icon: '📊',
    title: 'Progress Dashboard',
    description: 'Visualize your learning with charts. Track problems solved, flashcard mastery rates, and study activity over time.',
    hoverBorder: 'rgba(168,85,247,0.3)',
    hoverGlow: 'rgba(168,85,247,0.06)',
    badge: 'Analytics',
    badgeStyle: { background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#d8b4fe' },
  },
  {
    path: '/materials',
    icon: '🔩',
    title: 'Material Properties',
    description: 'Quick-reference table for 18 common engineering materials — steel, aluminum, titanium, copper, polymers, and more.',
    hoverBorder: 'rgba(148,163,184,0.3)',
    hoverGlow: 'rgba(148,163,184,0.06)',
    badge: 'Reference',
    badgeStyle: { background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', color: '#cbd5e1' },
  },
]

const SUBJECTS = [
  { icon: '⚖️', name: 'Statics', color: 'text-blue-400' },
  { icon: '🚀', name: 'Dynamics', color: 'text-purple-400' },
  { icon: '🔥', name: 'Thermo', color: 'text-orange-400' },
  { icon: '💧', name: 'Fluids', color: 'text-cyan-400' },
]

interface Feature {
  path: string
  icon: string
  title: string
  description: string
  hoverBorder: string
  hoverGlow: string
  badge: string
  badgeStyle: React.CSSProperties
}

function FeatureCard({ feature, onClick }: { feature: Feature; onClick: () => void }) {
  const [hovered, setHovered] = React.useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left rounded-2xl p-4 transition-all active:scale-[0.98] cursor-pointer"
      style={{
        background: hovered ? `rgba(255,255,255,0.055)` : 'rgba(255,255,255,0.035)',
        border: `1px solid ${hovered ? feature.hoverBorder : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: hovered
          ? `0 8px 32px rgba(0,0,0,0.5), 0 0 40px ${feature.hoverGlow}, inset 0 1px 0 rgba(255,255,255,0.08)`
          : '0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
        transform: hovered ? 'translateY(-2px)' : 'none',
      }}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl sm:text-3xl">{feature.icon}</span>
        <span className="badge text-xs" style={feature.badgeStyle}>{feature.badge}</span>
      </div>
      <h3 className="text-sm sm:text-base font-bold text-white mb-1 sm:mb-2">{feature.title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
    </button>
  )
}

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
      <div className="text-center space-y-4 py-6 sm:py-10 relative">
        {/* Background hero glow */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 50% 60% at 50% 0%, rgba(59,130,246,0.1) 0%, transparent 70%)',
        }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.25)',
              boxShadow: '0 0 40px rgba(59,130,246,0.2)',
            }}>
            <span className="text-2xl">⚙️</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white leading-tight">
            Welcome to{' '}
            <span style={{
              background: 'linear-gradient(135deg, #60a5fa 0%, #818cf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              MechStudy
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-lg max-w-2xl mx-auto px-2 mt-3">
            Your AI-powered engineering study platform. Analyze problems, chat with a tutor,
            create flashcards, and ace your exams.
          </p>
        </div>

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
            <FeatureCard key={feature.path} feature={feature} onClick={() => navigate(feature.path)} />
          ))}
        </div>
      </div>

      {/* More Tools */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">More Tools</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {MORE_TOOLS.map(feature => (
            <FeatureCard key={feature.path} feature={feature} onClick={() => navigate(feature.path)} />
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
      <div className="card">
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