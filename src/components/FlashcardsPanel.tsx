import React, { useState, useMemo } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'
import { useFlashcards } from '../hooks/useFlashcards'
import FlashcardView from './FlashcardView'
import type { Flashcard } from '../lib/flashcardStorage'

const DOMAIN_ICONS: Record<string, string> = {
  statics: '⚖️', dynamics: '🚀', thermo: '🔥', fluids: '💧', unknown: '❓', all: '📚',
}

interface Props {
  result: Result | null
  config: LLMConfig
  isOpen: boolean
  onClose: () => void
}

type Tab = 'study' | 'manage' | 'add'
type Filter = 'all' | 'new' | 'learning' | 'known'
type SubjectFilter = 'all' | 'statics' | 'dynamics' | 'thermo' | 'fluids'

export default function FlashcardsPanel({ result, config, isOpen, onClose }: Props) {
  const {
    cards, generating, generateError,
    addCard, deleteCard, markCard, generateFromProblem
  } = useFlashcards(config)

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
  const [generated, setGenerated] = useState(false)

  // Filter cards
  const filteredCards = useMemo(() => {
    let result_cards = cards
    if (subjectFilter !== 'all') result_cards = result_cards.filter(c => c.subject === subjectFilter)
    if (filter !== 'all') result_cards = result_cards.filter(c => c.status === filter)
    if (search) result_cards = result_cards.filter(c =>
      c.front.toLowerCase().includes(search.toLowerCase()) ||
      c.back.toLowerCase().includes(search.toLowerCase())
    )
    if (shuffle) result_cards = [...result_cards].sort(() => Math.random() - 0.5)
    return result_cards
  }, [cards, subjectFilter, filter, search, shuffle])

  const studyCards = useMemo(() => {
    let sc = cards
    if (subjectFilter !== 'all') sc = sc.filter(c => c.subject === subjectFilter)
    if (shuffle) sc = [...sc].sort(() => Math.random() - 0.5)
    else sc = [...sc].sort((a, b) => {
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

  function handleKnown() {
    if (!currentCard) return
    markCard(currentCard.id, 'known')
    handleNext()
  }

  function handleLearning() {
    if (!currentCard) return
    markCard(currentCard.id, 'learning')
    handleNext()
  }

  function handleSkip() {
    handleNext()
  }

  function resetSession() {
    setCurrentIndex(0)
    setSessionComplete(false)
  }

  async function handleGenerate() {
    if (!result) return
    await generateFromProblem(result)
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
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-30 lg:hidden" onClick={onClose} />
      )}

      <div className={`
        fixed top-0 right-0 h-full w-full sm:w-[420px] bg-gray-900 border-l border-gray-700
        shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm">🃏</div>
            <div>
              <h2 className="text-sm font-bold text-white">Flashcards</h2>
              <p className="text-xs text-gray-400">{stats.total} cards · {stats.known} known · {stats.learning} learning</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Stats Bar */}
        {stats.total > 0 && (
          <div className="px-4 py-2 border-b border-gray-700 shrink-0">
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 transition-all" style={{ width: `${(stats.known / stats.total) * 100}%` }} />
              <div className="bg-yellow-500 transition-all" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />
              <div className="bg-gray-600 transition-all" style={{ width: `${(stats.new / stats.total) * 100}%` }} />
            </div>
            <div className="flex gap-3 mt-1 text-xs">
              <span className="text-green-400">✓ {stats.known} known</span>
              <span className="text-yellow-400">↻ {stats.learning} learning</span>
              <span className="text-gray-400">● {stats.new} new</span>
            </div>
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex border-b border-gray-700 shrink-0">
          {(['study', 'manage', 'add'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors capitalize ${
                tab === t
                  ? 'border-b-2 border-purple-500 text-purple-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {t === 'study' ? '📖 Study' : t === 'manage' ? '📋 Manage' : '➕ Add Card'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">

          {/* STUDY TAB */}
          {tab === 'study' && (
            <div className="space-y-4">
              {/* Generate button */}
              {result && (
                <div className="card bg-purple-900/20 border-purple-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-purple-300">Generate from current problem</p>
                      <p className="text-xs text-gray-500 mt-0.5">Creates ~8 cards from your analysis</p>
                    </div>
                    <button
                      onClick={handleGenerate}
                      disabled={generating}
                      className="btn-primary text-xs flex items-center gap-1 shrink-0"
                    >
                      {generating ? (
                        <>
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Generating...
                        </>
                      ) : generated ? '✓ Generated!' : '✨ Generate'}
                    </button>
                  </div>
                  {generateError && <p className="text-xs text-red-400 mt-2">{generateError}</p>}
                </div>
              )}

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
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
                    {DOMAIN_ICONS[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <label className="toggle-label text-xs">
                  <input
                    type="checkbox"
                    checked={shuffle}
                    onChange={e => { setShuffle(e.target.checked); resetSession() }}
                    className="w-3 h-3 accent-purple-500"
                  />
                  <span>Shuffle</span>
                </label>
                <button onClick={resetSession} className="text-xs text-gray-500 hover:text-gray-300">
                  Reset Session
                </button>
              </div>

              {/* No cards */}
              {studyCards.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-4xl mb-3">🃏</p>
                  <p className="text-gray-400 text-sm">No flashcards yet.</p>
                  <p className="text-gray-600 text-xs mt-1">Generate from a problem or add manually.</p>
                </div>
              )}

              {/* Session complete */}
              {sessionComplete && studyCards.length > 0 && (
                <div className="card text-center border-green-700 bg-green-900/20 space-y-3">
                  <p className="text-3xl">🎉</p>
                  <p className="text-green-400 font-semibold">Session Complete!</p>
                  <div className="flex gap-3 justify-center text-xs">
                    <span className="text-green-400">{studyCards.filter(c => c.status === 'known').length} known</span>
                    <span className="text-yellow-400">{studyCards.filter(c => c.status === 'learning').length} learning</span>
                  </div>
                  <button onClick={resetSession} className="btn-primary text-xs w-full">
                    Study Again
                  </button>
                </div>
              )}

              {/* Card */}
              {!sessionComplete && currentCard && (
                <FlashcardView
                  card={currentCard}
                  onKnown={handleKnown}
                  onLearning={handleLearning}
                  onSkip={handleSkip}
                  current={currentIndex + 1}
                  total={studyCards.length}
                />
              )}
            </div>
          )}

          {/* MANAGE TAB */}
          {tab === 'manage' && (
            <div className="space-y-3">
              <input
                className="input-base"
                placeholder="Search cards..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />

              <div className="flex gap-1 flex-wrap">
                {(['all', 'new', 'learning', 'known'] as Filter[]).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                      filter === f
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-gray-800 border-gray-600 text-gray-400 hover:border-gray-400'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)} ({
                      f === 'all' ? cards.length : cards.filter(c => c.status === f).length
                    })
                  </button>
                ))}
              </div>

              {filteredCards.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No cards found.</p>
                </div>
              ) : (
                filteredCards.map(card => (
                  <div key={card.id} className="card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{DOMAIN_ICONS[card.subject]}</span>
                          <span className={`badge text-xs ${
                            card.status === 'known' ? 'bg-green-900 text-green-300' :
                            card.status === 'learning' ? 'bg-yellow-900 text-yellow-300' :
                            'bg-gray-700 text-gray-300'
                          }`}>
                            {card.status}
                          </span>
                          <span className="text-xs text-gray-600">{card.reviewCount} reviews</span>
                        </div>
                        <p className="text-xs font-medium text-gray-200 line-clamp-2">{card.front}</p>
                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{card.back}</p>
                      </div>
                      <button
                        onClick={() => deleteCard(card.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-sm shrink-0"
                      >
                        🗑
                      </button>
                    </div>
                    <div className="flex gap-1">
                      {(['new', 'learning', 'known'] as Flashcard['status'][]).map(s => (
                        <button
                          key={s}
                          onClick={() => markCard(card.id, s)}
                          className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                            card.status === s
                              ? s === 'known' ? 'bg-green-900 border-green-700 text-green-300'
                                : s === 'learning' ? 'bg-yellow-900 border-yellow-700 text-yellow-300'
                                : 'bg-gray-700 border-gray-500 text-gray-300'
                              : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-500'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ADD TAB */}
          {tab === 'add' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1">Subject</label>
                <select
                  className="input-base"
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                >
                  <option value="statics">⚖️ Statics</option>
                  <option value="dynamics">🚀 Dynamics</option>
                  <option value="thermo">🔥 Thermodynamics</option>
                  <option value="fluids">💧 Fluids</option>
                  <option value="unknown">📚 General</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Front (Question)</label>
                <textarea
                  className="input-base resize-none"
                  rows={3}
                  placeholder="What is Newton's Second Law?"
                  value={newFront}
                  onChange={e => setNewFront(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1">Back (Answer)</label>
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
                ➕ Add Card
              </button>

              <div className="card bg-gray-800/50 text-center">
                <p className="text-xs text-gray-400">
                  💡 Tip: Analyze a problem first then use the <strong className="text-purple-400">Generate</strong> button in the Study tab to auto-create cards.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}