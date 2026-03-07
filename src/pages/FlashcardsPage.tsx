import React, { useState, useMemo } from 'react'
import type { LLMConfig } from '../lib/llmService'
import { useFlashcards } from '../hooks/useFlashcards'
import FlashcardView from '../components/FlashcardView'
import type { Flashcard } from '../lib/flashcardStorage'
import { useProblemHistory } from '../hooks/useProblemHistory'

interface Props { config: LLMConfig }

type Tab = 'study' | 'manage' | 'add'
type Filter = 'all' | 'new' | 'learning' | 'known'
type SubjectFilter = 'all' | 'statics' | 'dynamics' | 'thermo' | 'fluids'

const DOMAIN_ICONS: Record<string, string> = {
  statics: '⚖️', dynamics: '🚀', thermo: '🔥', fluids: '💧', unknown: '❓', all: '📚',
}

export default function FlashcardsPage({ config }: Props) {
  const { cards, generating, generateError, addCard, deleteCard, markCard, generateFromProblem } = useFlashcards(config)
  const { history } = useProblemHistory()

  const [tab, setTab] = useState<Tab>('study')
  const [filter, setFilter] = useState<Filter>('all')
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionComplete, setSessionComplete] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [newFront, setNewFront] = useState('')
  const [newBack, setNewBack] = useState('')
  const [newSubject, setNewSubject] = useState('statics')
  const [search, setSearch] = useState('')
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('')
  const [generated, setGenerated] = useState(false)

  const filteredCards = useMemo(() => {
    let c = cards
    if (subjectFilter !== 'all') c = c.filter(x => x.subject === subjectFilter)
    if (filter !== 'all') c = c.filter(x => x.status === filter)
    if (search) c = c.filter(x =>
      x.front.toLowerCase().includes(search.toLowerCase()) ||
      x.back.toLowerCase().includes(search.toLowerCase())
    )
    return c
  }, [cards, subjectFilter, filter, search])

  const studyCards = useMemo(() => {
    let sc = cards
    if (subjectFilter !== 'all') sc = sc.filter(c => c.subject === subjectFilter)
    sc = shuffle
      ? [...sc].sort(() => Math.random() - 0.5)
      : [...sc].sort((a, b) => {
          const order = { new: 0, learning: 1, known: 2 }
          return order[a.status] - order[b.status]
        })
    return sc
  }, [cards, subjectFilter, shuffle])

  const currentCard = studyCards[currentIndex]

  function handleNext() {
    if (currentIndex < studyCards.length - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      setSessionComplete(true)
    }
  }

  function resetSession() {
    setCurrentIndex(0)
    setSessionComplete(false)
  }

  async function handleGenerate() {
    const entry = history.find(h => h.id === selectedHistoryId) ?? history[0]
    if (!entry) return
    await generateFromProblem(entry.result)
    setGenerated(true)
    setTimeout(() => setGenerated(false), 3000)
  }

  function handleAddCard() {
    if (!newFront.trim() || !newBack.trim()) return
    addCard({
      front: newFront.trim(),
      back: newBack.trim(),
      subject: newSubject,
      deck: 'manual',
      status: 'new',
      sourceType: 'manual',
    })
    setNewFront('')
    setNewBack('')
  }

  const stats = {
    total: cards.length,
    known: cards.filter(c => c.status === 'known').length,
    learning: cards.filter(c => c.status === 'learning').length,
    new: cards.filter(c => c.status === 'new').length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">🃏 Flashcards</h1>
        <p className="text-xs text-gray-400 mt-0.5">Study smarter with auto-generated and custom flashcards</p>
      </div>

      {/* Stats */}
      {stats.total > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <div className="card text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-400">Total</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.new}</p>
            <p className="text-xs text-gray-400">New</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.learning}</p>
            <p className="text-xs text-gray-400">Learning</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-green-400">{stats.known}</p>
            <p className="text-xs text-gray-400">Known</p>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {stats.total > 0 && (
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div className="flex h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 transition-all" style={{ width: `${(stats.known / stats.total) * 100}%` }} />
            <div className="bg-yellow-500 transition-all" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-700 gap-1">
        {(['study', 'manage', 'add'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors capitalize border-b-2 ${
              tab === t
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {t === 'study' ? '📖 Study' : t === 'manage' ? '📋 Manage' : '➕ Add Card'}
          </button>
        ))}
      </div>

      {/* STUDY TAB */}
      {tab === 'study' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Controls */}
          <div className="space-y-4">
            {/* Generate */}
            <div className="card border-purple-700 bg-purple-900/20">
              <p className="text-xs font-semibold text-purple-300 mb-3">Generate from Problem</p>
              {history.length === 0 ? (
                <p className="text-xs text-gray-500">Analyze a problem first to generate cards.</p>
              ) : (
                <div className="space-y-2">
                  <select
                    className="input-base text-xs"
                    value={selectedHistoryId}
                    onChange={e => setSelectedHistoryId(e.target.value)}
                  >
                    <option value="">Most recent problem</option>
                    {history.slice(0, 10).map(h => (
                      <option key={h.id} value={h.id}>
                        {h.result.detectedDomain} — {h.problemText.slice(0, 40)}...
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="btn-primary w-full text-xs"
                  >
                    {generating ? 'Generating...' : generated ? '✓ Generated!' : '✨ Generate Cards'}
                  </button>
                  {generateError && <p className="text-xs text-red-400">{generateError}</p>}
                </div>
              )}
            </div>

            {/* Filters */}
            <div className="card">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter by Subject</p>
              <div className="flex flex-wrap gap-1">
                {(['all', 'statics', 'dynamics', 'thermo', 'fluids'] as SubjectFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => { setSubjectFilter(s); resetSession() }}
                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                      subjectFilter === s
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {DOMAIN_ICONS[s]} {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <label className="toggle-label text-xs">
                <input
                  type="checkbox"
                  checked={shuffle}
                  onChange={e => { setShuffle(e.target.checked); resetSession() }}
                  className="w-3 h-3 accent-purple-500"
                />
                <span>Shuffle Cards</span>
              </label>
              <button onClick={resetSession} className="text-xs text-gray-500 hover:text-gray-300 mt-2 block">
                Reset Session
              </button>
            </div>
          </div>

          {/* Card Display */}
          <div className="lg:col-span-2">
            {studyCards.length === 0 ? (
              <div className="card text-center py-16">
                <p className="text-4xl mb-3">🃏</p>
                <p className="text-gray-400 text-sm">No flashcards yet.</p>
                <p className="text-gray-600 text-xs mt-1">Generate from a problem or add cards manually.</p>
              </div>
            ) : sessionComplete ? (
              <div className="card text-center py-12 border-green-700 bg-green-900/20 space-y-4">
                <p className="text-4xl">🎉</p>
                <p className="text-green-400 font-bold text-lg">Session Complete!</p>
                <div className="flex gap-4 justify-center text-sm">
                  <span className="text-green-400">✓ {studyCards.filter(c => c.status === 'known').length} known</span>
                  <span className="text-yellow-400">↻ {studyCards.filter(c => c.status === 'learning').length} learning</span>
                </div>
                <button onClick={resetSession} className="btn-primary">Study Again</button>
              </div>
            ) : (
              <FlashcardView
                card={currentCard}
                onKnown={() => { markCard(currentCard.id, 'known'); handleNext() }}
                onLearning={() => { markCard(currentCard.id, 'learning'); handleNext() }}
                onSkip={handleNext}
                current={currentIndex + 1}
                total={studyCards.length}
              />
            )}
          </div>
        </div>
      )}

      {/* MANAGE TAB */}
      {tab === 'manage' && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <input
              className="input-base flex-1"
              placeholder="Search cards..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="flex gap-1">
              {(['all', 'new', 'learning', 'known'] as Filter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                    filter === f
                      ? 'bg-purple-600 border-purple-500 text-white'
                      : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                  }`}
                >
                  {f} ({f === 'all' ? cards.length : cards.filter(c => c.status === f).length})
                </button>
              ))}
            </div>
          </div>

          {filteredCards.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 text-sm">No cards found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCards.map(card => (
                <div key={card.id} className="card space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span>{DOMAIN_ICONS[card.subject]}</span>
                      <span className={`badge text-xs ${
                        card.status === 'known' ? 'bg-green-900 text-green-300' :
                        card.status === 'learning' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>{card.status}</span>
                    </div>
                    <button
                      onClick={() => deleteCard(card.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors"
                    >🗑</button>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-200 mb-1">Q: {card.front}</p>
                    <p className="text-xs text-gray-500">A: {card.back}</p>
                  </div>
                  <div className="flex gap-1">
                    {(['new', 'learning', 'known'] as Flashcard['status'][]).map(s => (
                      <button
                        key={s}
                        onClick={() => markCard(card.id, s)}
                        className={`flex-1 text-xs py-1 rounded border transition-colors ${
                          card.status === s
                            ? s === 'known' ? 'bg-green-900 border-green-700 text-green-300'
                              : s === 'learning' ? 'bg-yellow-900 border-yellow-700 text-yellow-300'
                              : 'bg-gray-700 border-gray-500 text-gray-300'
                            : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'
                        }`}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADD TAB */}
      {tab === 'add' && (
        <div className="max-w-xl space-y-4">
          <div className="card space-y-4">
            <h3 className="text-sm font-semibold text-white">Create a New Flashcard</h3>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Subject</label>
              <select className="input-base" value={newSubject} onChange={e => setNewSubject(e.target.value)}>
                <option value="statics">⚖️ Statics</option>
                <option value="dynamics">🚀 Dynamics</option>
                <option value="thermo">🔥 Thermodynamics</option>
                <option value="fluids">💧 Fluids</option>
                <option value="unknown">📚 General</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Front (Question or Concept)</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                placeholder="What is Newton's Second Law?"
                value={newFront}
                onChange={e => setNewFront(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">Back (Answer or Explanation)</label>
              <textarea
                className="input-base resize-none"
                rows={3}
                placeholder="F = ma — Force equals mass times acceleration"
                value={newBack}
                onChange={e => setNewBack(e.target.value)}
              />
            </div>

            <button
              onClick={handleAddCard}
              disabled={!newFront.trim() || !newBack.trim()}
              className="btn-primary w-full"
            >
              ➕ Add Flashcard
            </button>
          </div>

          {/* Tips */}
          <div className="card bg-purple-900/20 border-purple-700">
            <h3 className="text-xs font-semibold text-purple-300 mb-3">💡 Tips for Good Flashcards</h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>• Keep questions short and specific</li>
              <li>• One concept per card</li>
              <li>• Include units in the answer when relevant</li>
              <li>• Add the equation AND when to use it</li>
              <li>• Include common mistakes as separate cards</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}