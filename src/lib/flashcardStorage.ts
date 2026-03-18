import { supabase } from './supabase'

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

// ── Supabase helpers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToCard(row: any): Flashcard {
  return {
    id: row.id,
    front: row.front,
    back: row.back,
    subject: row.subject,
    deck: row.deck,
    status: row.status,
    createdAt: row.created_at,
    lastReviewed: row.last_reviewed,
    reviewCount: row.review_count,
    sourceType: row.source_type,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToDeck(row: any): Deck {
  return {
    id: row.id,
    name: row.name,
    subject: row.subject,
    createdAt: row.created_at,
  }
}

export async function fetchCardsFromDb(userId: string): Promise<Flashcard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToCard)
}

export async function upsertCardToDb(userId: string, card: Flashcard): Promise<void> {
  const { error } = await supabase.from('flashcards').upsert({
    id: card.id,
    user_id: userId,
    front: card.front,
    back: card.back,
    subject: card.subject,
    deck: card.deck,
    status: card.status,
    source_type: card.sourceType,
    created_at: card.createdAt,
    last_reviewed: card.lastReviewed,
    review_count: card.reviewCount,
  })
  if (error) throw error
}

export async function deleteCardFromDb(id: string): Promise<void> {
  const { error } = await supabase.from('flashcards').delete().eq('id', id)
  if (error) throw error
}

export async function fetchDecksFromDb(userId: string): Promise<Deck[]> {
  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return (data ?? []).map(rowToDeck)
}

export async function upsertDeckToDb(userId: string, deck: Deck): Promise<void> {
  const { error } = await supabase.from('decks').upsert({
    id: deck.id,
    user_id: userId,
    name: deck.name,
    subject: deck.subject,
    created_at: deck.createdAt,
  })
  if (error) throw error
}

export async function deleteDeckFromDb(id: string): Promise<void> {
  const { error } = await supabase.from('decks').delete().eq('id', id)
  if (error) throw error
}

export async function deleteDeckCardsFromDb(deckId: string): Promise<void> {
  const { error } = await supabase.from('flashcards').delete().eq('deck', deckId)
  if (error) throw error
}
