import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Замените эти значения на ваши данные из Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '⚠️ Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
  )
}

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false // Мы не используем Supabase Auth, только базу данных
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-client-info': 'quest-app@1.0.0'
    }
  }
})

// Типы для таблиц Supabase
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          name: string
          avatar: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          avatar: string
        }
        Update: {
          id?: string
          name?: string
          avatar?: string
        }
      }
      quests: {
        Row: {
          id: string
          title: string
          description: string | null
          data: any // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          title: string
          description?: string | null
          data: any
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          data?: any
        }
      }
      game_sessions: {
        Row: {
          id: string
          code: string
          quest_id: string
          host_id: string
          host_name: string
          host_avatar: string
          state: 'lobby' | 'active' | 'completed'
          round_id: string | null
          players: any // JSONB
          active_question: any | null // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          code: string
          quest_id: string
          host_id: string
          host_name: string
          host_avatar: string
          state: 'lobby' | 'active' | 'completed'
          round_id?: string | null
          players?: any
          active_question?: any | null
        }
        Update: {
          id?: string
          code?: string
          quest_id?: string
          host_id?: string
          host_name?: string
          host_avatar?: string
          state?: 'lobby' | 'active' | 'completed'
          round_id?: string | null
          players?: any
          active_question?: any | null
        }
      }
      quest_progress: {
        Row: {
          id: string
          quest_id: string
          user_id: string
          round_id: string
          category_id: string
          question_id: string
          played_at: string
        }
        Insert: {
          quest_id: string
          user_id: string
          round_id: string
          category_id: string
          question_id: string
        }
        Update: {
          id?: string
          quest_id?: string
          user_id?: string
          round_id?: string
          category_id?: string
          question_id?: string
        }
      }
    }
  }
}

