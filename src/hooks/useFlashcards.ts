import { useState, useCallback, useEffect } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'
import {
  loadCards, saveCards, loadDecks, saveDecks,
  generateId, type Flashcard, type Deck,
  fetchCardsFromDb, upsertCardToDb, deleteCardFromDb,
  fetchDecksFromDb, upsertDeckToDb, deleteDeckFromDb, deleteDeckCardsFromDb,
} from '../lib/flashcardStorage'
import { buildFlashcardPrompt } from '../lib/promptBuilder'
import { useAuth } from '../contexts/AuthContext'

export function useFlashcards(config: LLMConfig) {
  const { user } = useAuth()
  const [cards, setCards] = useState<Flashcard[]>(loadCards)
  const [decks, setDecks] = useState<Deck[]>(loadDecks)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Load from Supabase when user is available
  useEffect(() => {
    if (!user) return
    Promise.all([fetchCardsFromDb(user.id), fetchDecksFromDb(user.id)])
      .then(([dbCards, dbDecks]) => {
        setCards(dbCards)
        saveCards(dbCards)
        setDecks(dbDecks)
        saveDecks(dbDecks)
      })
      .catch(err => console.error('Failed to load flashcards from Supabase:', err.message))
  }, [user])

  function updateCards(updated: Flashcard[]) {
    setCards(updated)
    saveCards(updated)
  }

  function updateDecks(updated: Deck[]) {
    setDecks(updated)
    saveDecks(updated)
  }

  const addCard = useCallback((card: Omit<Flashcard, 'id' | 'createdAt' | 'lastReviewed' | 'reviewCount'>) => {
    const newCard: Flashcard = {
      ...card,
      id: generateId(),
      createdAt: Date.now(),
      lastReviewed: null,
      reviewCount: 0,
    }
    const updated = [...cards, newCard]
    updateCards(updated)
    if (user) {
      upsertCardToDb(user.id, newCard).catch(err =>
        console.error('Failed to save card to Supabase:', err.message)
      )
    }
    return newCard
  }, [cards, user])

  const updateCard = useCallback((id: string, changes: Partial<Flashcard>) => {
    const next = cards.map(c => c.id === id ? { ...c, ...changes } : c)
    updateCards(next)
    if (user) {
      const card = next.find(c => c.id === id)
      if (card) {
        upsertCardToDb(user.id, card).catch(err =>
          console.error('Failed to update card in Supabase:', err.message)
        )
      }
    }
  }, [cards, user])

  const deleteCard = useCallback((id: string) => {
    updateCards(cards.filter(c => c.id !== id))
    if (user) {
      deleteCardFromDb(id).catch(err =>
        console.error('Failed to delete card from Supabase:', err.message)
      )
    }
  }, [cards, user])

  const markCard = useCallback((id: string, status: Flashcard['status']) => {
    const next = cards.map(c =>
      c.id === id
        ? { ...c, status, lastReviewed: Date.now(), reviewCount: c.reviewCount + 1 }
        : c
    )
    updateCards(next)
    if (user) {
      const card = next.find(c => c.id === id)
      if (card) {
        upsertCardToDb(user.id, card).catch(err =>
          console.error('Failed to mark card in Supabase:', err.message)
        )
      }
    }
  }, [cards, user])

  const addDeck = useCallback((name: string, subject: string) => {
    const newDeck: Deck = {
      id: generateId(),
      name,
      subject,
      createdAt: Date.now(),
    }
    updateDecks([...decks, newDeck])
    if (user) {
      upsertDeckToDb(user.id, newDeck).catch(err =>
        console.error('Failed to save deck to Supabase:', err.message)
      )
    }
    return newDeck
  }, [decks, user])

  const deleteDeck = useCallback((id: string) => {
    updateDecks(decks.filter(d => d.id !== id))
    updateCards(cards.filter(c => c.deck !== id))
    if (user) {
      Promise.all([deleteDeckFromDb(id), deleteDeckCardsFromDb(id)]).catch(err =>
        console.error('Failed to delete deck from Supabase:', err.message)
      )
    }
  }, [decks, cards, user])

  const generateFromProblem = useCallback(async (result: Result) => {
    if (config.mode === 'mock') {
      const mockCards = [
        {
          front: `What is the governing equation for ${result.detectedDomain} problems like this?`,
          back: result.governingEquations[0]?.equation ?? 'See governing equations tab',
          subject: result.detectedDomain,
          deck: 'auto',
          status: 'new' as const,
          sourceType: 'generated' as const,
        },
        ...result.governingEquations.slice(0, 3).map(eq => ({
          front: `When do you use: ${eq.equation}?`,
          back: eq.whenToUse ?? 'Apply when the problem involves ' + eq.variables.join(', '),
          subject: result.detectedDomain,
          deck: 'auto',
          status: 'new' as const,
          sourceType: 'generated' as const,
        })),
        ...result.assumptions.slice(0, 2).map(a => ({
          front: `What assumption is made about: ${a.assumption}?`,
          back: a.whyItMatters ?? 'This assumption simplifies the problem significantly',
          subject: result.detectedDomain,
          deck: 'auto',
          status: 'new' as const,
          sourceType: 'generated' as const,
        })),
        ...result.commonMistakes.slice(0, 2).map(m => ({
          front: `Common mistake: ${m.mistake}`,
          back: `How to avoid it: ${m.avoidanceTip}`,
          subject: result.detectedDomain,
          deck: 'auto',
          status: 'new' as const,
          sourceType: 'generated' as const,
        })),
      ]
      mockCards.forEach(c => addCard(c))
      return
    }

    setGenerating(true)
    setGenerateError(null)

    try {
      const prompt = buildFlashcardPrompt(result)

      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'flashcards', prompt, groqApiKey: config.groqApiKey || undefined }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const data = await response.json()

      if (!data.cards || !Array.isArray(data.cards)) {
        throw new Error('Invalid response format')
      }

      data.cards.forEach((c: { front: string; back: string }) => {
        if (c.front && c.back) {
          addCard({
            front: c.front,
            back: c.back,
            subject: result.detectedDomain,
            deck: 'auto',
            status: 'new',
            sourceType: 'generated',
          })
        }
      })

    } catch (err) {
      setGenerateError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [config, addCard])

  return {
    cards,
    decks,
    generating,
    generateError,
    addCard,
    updateCard,
    deleteCard,
    markCard,
    addDeck,
    deleteDeck,
    generateFromProblem,
  }
}
