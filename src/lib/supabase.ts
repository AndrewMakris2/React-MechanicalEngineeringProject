import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set. Auth and cloud sync will be unavailable.')
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder'
)

// ── Types matching DB schema ──────────────────────────────────────────────────

export interface UserSettings {
  id: string
  user_id: string
  groq_api_key: string
  llm_mode: 'mock' | 'api'
  created_at: string
}

export interface DbFlashcard {
  id: string
  user_id: string
  front: string
  back: string
  subject: string
  deck: string
  status: 'new' | 'known' | 'learning'
  source_type: 'generated' | 'manual'
  created_at: number
  last_reviewed: number | null
  review_count: number
}

export interface DbDeck {
  id: string
  user_id: string
  name: string
  subject: string
  created_at: number
}

export interface DbHistoryEntry {
  id: string
  user_id: string
  problem_text: string
  subject: string
  result: unknown
  timestamp: number
}
