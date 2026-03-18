// All Supabase DB helpers use direct REST fetch (not the supabase JS client)
// to avoid Web Lock contention on auth token refresh.

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

// ── Direct REST helpers ────────────────────────────────────────────────────────

function h(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  }
}

const url = (table: string, query = '') =>
  `${import.meta.env.VITE_SUPABASE_URL as string}/rest/v1/${table}${query ? `?${query}` : ''}`

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

export async function fetchCardsFromDb(token: string, userId: string): Promise<Flashcard[]> {
  const res = await fetch(url('flashcards', `user_id=eq.${userId}&order=created_at.asc`), { headers: h(token) })
  if (!res.ok) throw new Error(`fetchCards: HTTP ${res.status}`)
  const data = await res.json()
  return (data as unknown[]).map(rowToCard)
}

export async function upsertCardToDb(token: string, userId: string, card: Flashcard): Promise<void> {
  const res = await fetch(url('flashcards'), {
    method: 'POST',
    headers: { ...h(token), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
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
    }),
  })
  if (!res.ok) throw new Error(`upsertCard: HTTP ${res.status}`)
}

export async function deleteCardFromDb(token: string, id: string): Promise<void> {
  const res = await fetch(url('flashcards', `id=eq.${id}`), { method: 'DELETE', headers: h(token) })
  if (!res.ok) throw new Error(`deleteCard: HTTP ${res.status}`)
}

export async function fetchDecksFromDb(token: string, userId: string): Promise<Deck[]> {
  const res = await fetch(url('decks', `user_id=eq.${userId}&order=created_at.asc`), { headers: h(token) })
  if (!res.ok) throw new Error(`fetchDecks: HTTP ${res.status}`)
  const data = await res.json()
  return (data as unknown[]).map(rowToDeck)
}

export async function upsertDeckToDb(token: string, userId: string, deck: Deck): Promise<void> {
  const res = await fetch(url('decks'), {
    method: 'POST',
    headers: { ...h(token), Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify({
      id: deck.id,
      user_id: userId,
      name: deck.name,
      subject: deck.subject,
      created_at: deck.createdAt,
    }),
  })
  if (!res.ok) throw new Error(`upsertDeck: HTTP ${res.status}`)
}

export async function deleteDeckFromDb(token: string, id: string): Promise<void> {
  const res = await fetch(url('decks', `id=eq.${id}`), { method: 'DELETE', headers: h(token) })
  if (!res.ok) throw new Error(`deleteDeck: HTTP ${res.status}`)
}

export async function deleteDeckCardsFromDb(token: string, deckId: string): Promise<void> {
  const res = await fetch(url('flashcards', `deck=eq.${deckId}`), { method: 'DELETE', headers: h(token) })
  if (!res.ok) throw new Error(`deleteDeckCards: HTTP ${res.status}`)
}
