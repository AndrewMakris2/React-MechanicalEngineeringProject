import { useState, useCallback } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'
import {
  loadCards, saveCards, loadDecks, saveDecks,
  generateId, type Flashcard, type Deck
} from '../lib/flashcardStorage'
import { buildFlashcardPrompt } from '../lib/promptBuilder'

export function useFlashcards(config: LLMConfig) {
  const [cards, setCards] = useState<Flashcard[]>(loadCards)
  const [decks, setDecks] = useState<Deck[]>(loadDecks)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

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
    return newCard
  }, [cards])

  const updateCard = useCallback((id: string, changes: Partial<Flashcard>) => {
    const updated = cards.map(c => c.id === id ? { ...c, ...changes } : c)
    updateCards(updated)
  }, [cards])

  const deleteCard = useCallback((id: string) => {
    const updated = cards.filter(c => c.id !== id)
    updateCards(updated)
  }, [cards])

  const markCard = useCallback((id: string, status: Flashcard['status']) => {
    const updated = cards.map(c =>
      c.id === id
        ? { ...c, status, lastReviewed: Date.now(), reviewCount: c.reviewCount + 1 }
        : c
    )
    updateCards(updated)
  }, [cards])

  const addDeck = useCallback((name: string, subject: string) => {
    const newDeck: Deck = {
      id: generateId(),
      name,
      subject,
      createdAt: Date.now(),
    }
    const updated = [...decks, newDeck]
    updateDecks(updated)
    return newDeck
  }, [decks])

  const deleteDeck = useCallback((id: string) => {
    const updatedDecks = decks.filter(d => d.id !== id)
    const updatedCards = cards.filter(c => c.deck !== id)
    updateDecks(updatedDecks)
    updateCards(updatedCards)
  }, [decks, cards])

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
        body: JSON.stringify({ type: 'flashcards', prompt }),
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