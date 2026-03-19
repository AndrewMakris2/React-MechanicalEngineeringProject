import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProblemHistory } from '../hooks/useProblemHistory'
import { loadCards } from '../lib/flashcardStorage'

const SUBJECT_COLORS: Record<string, string> = {
  Statics: '#3b82f6',
  Dynamics: '#a855f7',
  Thermodynamics: '#f97316',
  'Fluid Mechanics': '#06b6d4',
  'Mechanics of Materials': '#eab308',
  'Machine Design': '#ec4899',
  'Heat Transfer': '#ef4444',
  'Engineering Mechanics': '#6366f1',
  Other: '#6b7280',
}

function getSubjectColor(subject: string): string {
  for (const [key, color] of Object.entries(SUBJECT_COLORS)) {
    if (subject?.toLowerCase().includes(key.toLowerCase())) return color
  }
  return SUBJECT_COLORS.Other
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: string
}

function StatCard({ label, value, sub, color, icon }: StatCardProps) {
  return (
    <div className="card p-4 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        {icon}
      </div>
      <div>
        <p style={{ color }} className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-white font-medium">{label}</p>
        {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

interface BarChartProps {
  data: { label: string; value: number; color: string }[]
  max: number
  title: string
}

function BarChart({ data, max, title }: BarChartProps) {
  if (data.length === 0) return null
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400">{item.label}</span>
              <span className="text-xs font-mono text-gray-300">{item.value}</span>
            </div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: '8px', background: 'rgba(255,255,255,0.06)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: max > 0 ? `${(item.value / max) * 100}%` : '0%',
                  background: item.color,
                  boxShadow: `0 0 8px ${item.color}60`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProgressDashboardPage() {
  const navigate = useNavigate()
  const { history } = useProblemHistory()
  const cards = loadCards()

  const stats = useMemo(() => {
    const known = cards.filter(c => c.status === 'known').length
    const learning = cards.filter(c => c.status === 'learning').length
    const newCards = cards.filter(c => c.status === 'new').length

    // Subject breakdown for problems
    const subjectMap: Record<string, number> = {}
    history.forEach(h => {
      const s = h.result?.detectedDomain ?? h.subject ?? 'Other'
      subjectMap[s] = (subjectMap[s] ?? 0) + 1
    })

    // Card subject breakdown
    const cardSubjectMap: Record<string, number> = {}
    cards.forEach(c => {
      const s = c.subject ?? 'Other'
      cardSubjectMap[s] = (cardSubjectMap[s] ?? 0) + 1
    })

    // Activity by day (last 14 days)
    const now = Date.now()
    const dayMs = 86400000
    const activityMap: Record<string, number> = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * dayMs)
      activityMap[d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })] = 0
    }
    history.forEach(h => {
      const d = new Date(h.timestamp)
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      if (key in activityMap) activityMap[key]++
    })

    // Mastery rate
    const masteryRate = cards.length > 0 ? Math.round((known / cards.length) * 100) : 0

    // Avg difficulty from results
    const difficulties = history
      .map(h => h.result?.difficulty)
      .filter(Boolean) as string[]
    const difficultyCount: Record<string, number> = {}
    difficulties.forEach(d => { difficultyCount[d] = (difficultyCount[d] ?? 0) + 1 })

    return {
      totalProblems: history.length,
      totalCards: cards.length,
      knownCards: known,
      learningCards: learning,
      newCardsCount: newCards,
      masteryRate,
      subjectMap,
      cardSubjectMap,
      activityMap,
      difficultyCount,
    }
  }, [history, cards])

  const problemSubjectData = Object.entries(stats.subjectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, color: getSubjectColor(label) }))

  const cardSubjectData = Object.entries(stats.cardSubjectMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value, color: getSubjectColor(label) }))

  const activityData = Object.entries(stats.activityMap)
    .map(([label, value]) => ({ label, value, color: '#3b82f6' }))

  const difficultyData = Object.entries(stats.difficultyCount)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      color: label.toLowerCase() === 'hard' ? '#ef4444' : label.toLowerCase() === 'medium' ? '#eab308' : '#22c55e',
    }))

  const maxActivity = Math.max(...activityData.map(d => d.value), 1)
  const maxProblems = Math.max(...problemSubjectData.map(d => d.value), 1)
  const maxCards = Math.max(...cardSubjectData.map(d => d.value), 1)
  const maxDiff = Math.max(...difficultyData.map(d => d.value), 1)

  const hasAnyData = stats.totalProblems > 0 || stats.totalCards > 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Progress Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">Track your learning across all study tools</p>
      </div>

      {!hasAnyData ? (
        <div className="card text-center py-16">
          <p className="text-5xl mb-4">📊</p>
          <p className="text-white font-semibold text-lg mb-2">No data yet</p>
          <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
            Start analyzing problems and studying flashcards to see your progress here.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button onClick={() => navigate('/analyzer')} className="btn-primary text-sm px-4 py-2">
              🔬 Analyze a Problem
            </button>
            <button onClick={() => navigate('/flashcards')} className="btn-secondary text-sm px-4 py-2">
              🃏 Study Flashcards
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Overview stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="Problems Analyzed"
              value={stats.totalProblems}
              sub="lifetime"
              color="#3b82f6"
              icon="🔬"
            />
            <StatCard
              label="Total Flashcards"
              value={stats.totalCards}
              sub={`${stats.knownCards} mastered`}
              color="#a855f7"
              icon="🃏"
            />
            <StatCard
              label="Mastery Rate"
              value={`${stats.masteryRate}%`}
              sub="cards marked known"
              color="#22c55e"
              icon="🏆"
            />
            <StatCard
              label="In Progress"
              value={stats.learningCards}
              sub="cards still learning"
              color="#eab308"
              icon="📚"
            />
          </div>

          {/* Flashcard breakdown */}
          {stats.totalCards > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Flashcard Mastery</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Known', count: stats.knownCards, color: '#22c55e', pct: stats.totalCards > 0 ? Math.round(stats.knownCards / stats.totalCards * 100) : 0 },
                  { label: 'Learning', count: stats.learningCards, color: '#eab308', pct: stats.totalCards > 0 ? Math.round(stats.learningCards / stats.totalCards * 100) : 0 },
                  { label: 'New', count: stats.newCardsCount, color: '#6b7280', pct: stats.totalCards > 0 ? Math.round(stats.newCardsCount / stats.totalCards * 100) : 0 },
                ].map(item => (
                  <div
                    key={item.label}
                    className="rounded-xl p-3 text-center"
                    style={{ background: `${item.color}15`, border: `1px solid ${item.color}30` }}
                  >
                    <p style={{ color: item.color }} className="text-2xl font-bold">{item.count}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
                    <p className="text-xs font-mono mt-1" style={{ color: item.color }}>{item.pct}%</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: 'rgba(255,255,255,0.06)' }}>
                {stats.totalCards > 0 && (
                  <>
                    <div style={{ width: `${(stats.knownCards / stats.totalCards) * 100}%`, background: '#22c55e' }} />
                    <div style={{ width: `${(stats.learningCards / stats.totalCards) * 100}%`, background: '#eab308' }} />
                    <div style={{ width: `${(stats.newCardsCount / stats.totalCards) * 100}%`, background: '#6b7280' }} />
                  </>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
                {[
                  { label: 'Known', color: '#22c55e' },
                  { label: 'Learning', color: '#eab308' },
                  { label: 'New', color: '#6b7280' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity last 14 days */}
          {stats.totalProblems > 0 && (
            <div className="card">
              <h3 className="text-sm font-semibold text-white mb-4">Problems Analyzed — Last 14 Days</h3>
              <div className="flex items-end gap-1.5" style={{ height: '80px' }}>
                {activityData.map(d => {
                  const heightPct = maxActivity > 0 ? (d.value / maxActivity) * 100 : 0
                  return (
                    <div key={d.label} className="flex-1 flex flex-col items-center gap-1" style={{ minWidth: 0 }}>
                      <div className="w-full flex items-end" style={{ height: '64px' }}>
                        <div
                          className="w-full rounded-t-sm transition-all"
                          style={{
                            height: heightPct > 0 ? `${Math.max(heightPct, 8)}%` : '2px',
                            background: d.value > 0 ? '#3b82f6' : 'rgba(255,255,255,0.06)',
                            boxShadow: d.value > 0 ? '0 0 6px rgba(59,130,246,0.5)' : 'none',
                          }}
                        />
                      </div>
                      {d.value > 0 && (
                        <span className="text-xs text-blue-400 font-mono">{d.value}</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-600">{activityData[0]?.label}</span>
                <span className="text-xs text-gray-600">{activityData[activityData.length - 1]?.label}</span>
              </div>
            </div>
          )}

          {/* Charts row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {problemSubjectData.length > 0 && (
              <BarChart
                title="Problems by Subject"
                data={problemSubjectData}
                max={maxProblems}
              />
            )}
            {cardSubjectData.length > 0 && (
              <BarChart
                title="Flashcards by Subject"
                data={cardSubjectData}
                max={maxCards}
              />
            )}
            {difficultyData.length > 0 && (
              <BarChart
                title="Problem Difficulty Breakdown"
                data={difficultyData}
                max={maxDiff}
              />
            )}
          </div>

          {/* Recent problems */}
          {history.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Recent Problems</h3>
                <button
                  onClick={() => navigate('/analyzer')}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Analyze more →
                </button>
              </div>
              <div className="space-y-2">
                {history.slice(0, 5).map(h => (
                  <div
                    key={h.id}
                    className="flex items-start gap-3 py-2 px-3 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: getSubjectColor(h.result?.detectedDomain ?? h.subject ?? '') }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{h.problemText.slice(0, 80)}{h.problemText.length > 80 ? '…' : ''}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{h.result?.detectedDomain ?? h.subject}</span>
                        <span className="text-xs text-gray-600">·</span>
                        <span className="text-xs text-gray-500">{new Date(h.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
