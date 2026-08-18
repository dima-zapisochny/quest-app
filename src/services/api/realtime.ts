import { supabase } from './_shared'
import { mapSessionRow } from './sessions'
import { getQuestById } from './quests'
import type { GameSession, Quest } from '@/types'

export function subscribeToSession(
  sessionId: string,
  callback: (session: GameSession) => void,
  onSessionDeleted?: (sessionId: string) => void
): () => void {
  const channelName = `session_${sessionId}_${Math.random().toString(36).slice(2, 8)}`
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'game_sessions', filter: `id=eq.${sessionId}` },
      (payload) => {
        try {
          if (payload.eventType === 'DELETE') {
            onSessionDeleted?.(sessionId)
            return
          }
          const row = payload.new as Parameters<typeof mapSessionRow>[0] | null
          if (row?.id) callback(mapSessionRow(row))
        } catch (error) {
          console.error('❌ [Realtime] Error in session subscription:', error)
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to session:', sessionId)
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to session:', sessionId)
      }
    })

  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToQuests(
  userId: string,
  callback: (quest: Quest) => void
): () => void {
  const channel = supabase
    .channel('quests_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'quests',
        filter: `user_id=eq.${userId}` // Подписываемся только на изменения квестов текущего пользователя
      },
      async (payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const quest = await getQuestById(payload.new.id, userId)
          if (quest) callback(quest)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

