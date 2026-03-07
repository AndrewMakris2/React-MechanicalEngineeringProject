import { useState, useCallback } from 'react'
import type { Result } from '../lib/schema'
import type { LLMConfig } from '../lib/llmService'
import {
  loadCards, saveCards, loadDecks, saveDecks,
  generateId, type Flashcard, type Deck
} from '../lib/flashcardStorage'

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
      const prompt = `You are an expert engineering professor. Based on this engineering problem analysis, generate flashcards for studying.

PROBLEM: ${result.problemSummary}
DOMAIN: ${result.detectedDomain}
EQUATIONS: ${result.governingEquations.map(e => e.equation).join(', ')}
ASSUMPTIONS: ${result.assumptions.map(a => a.assumption).join(', ')}
COMMON MISTAKES: ${result.commonMistakes.map(m => m.mistake).join(', ')}
VARIABLES: ${result.knowns.map(k => `${k.name}=${k.symbol}`).join(', ')}

Generate exactly 8 flashcards. Return ONLY valid JSON in this exact format, no markdown:
{
  "cards": [
    {
      "front": "question or concept on the front of the card",
      "back": "answer or explanation on the back of the card"
    }
  ]
}

Make cards for:
- Key equations and when to use them
- Important variable definitions
- Common mistakes and how to avoid them
- Key assumptions and why they matter
- Physical concepts explained simply
Use plain ASCII text only. No special characters or Greek letters.`

      const response = await fetch(config.endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(err.error ?? `HTTP ${response.status}`)
      }

      const raw = await response.json()
      const data = raw?.result ?? raw

      let parsed: { cards: { front: string; back: string }[] }
      if (typeof data === 'object' && data?.cards) {
        parsed = data
      } else {
        const text = typeof data === 'string' ? data : JSON.stringify(data)
        const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
        parsed = JSON.parse(cleaned)
      }

      if (!parsed.cards || !Array.isArray(parsed.cards)) {
        throw new Error('Invalid response format')
      }

      parsed.cards.forEach(c => {
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