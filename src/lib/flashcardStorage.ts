export interface Flashcard {
  id: string
  front: string
  back: string
  subject: string
  deck: string
  status: 'new' | 'known' | 'learning'
  createdAt: number
  lastReviewed: number | null
  reviewCount: number
  sourceType: 'generated' | 'manual'
}

export interface Deck {
  id: string
  name: string
  subject: string
  createdAt: number
}

const CARDS_KEY = 'eng_flashcards'
const DECKS_KEY = 'eng_decks'

export function loadCards(): Flashcard[] {
  try {
    const stored = localStorage.getItem(CARDS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function saveCards(cards: Flashcard[]): void {
  localStorage.setItem(CARDS_KEY, JSON.stringify(cards))
}

export function loadDecks(): Deck[] {
  try {
    const stored = localStorage.getItem(DECKS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch { return [] }
}

export function saveDecks(decks: Deck[]): void {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}