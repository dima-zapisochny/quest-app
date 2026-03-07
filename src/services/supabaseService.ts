import { supabase, isSupabaseConfigured } from '@/config/supabase'
import type { UserProfile, Quest, GameSession, Player } from '@/types'

function ensureSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase не настроен. Добавьте в .env переменные VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY (см. .env.example), затем перезапустите dev-сервер. Иначе при сохранении и удалении появляется ошибка «No API key found».'
    )
  }
}

// ============================================================================
// User Profiles
// ============================================================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  if (!data) return null

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar
  }
}

export async function upsertUserProfile(profile: UserProfile): Promise<UserProfile> {
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar
    })
    .select()
    .single()

  if (error) {
    console.error('Error upserting user profile:', error)
    throw error
  }

  return {
    id: data.id,
    name: data.name,
    avatar: data.avatar
  }
}

// ============================================================================
// Quests
// ============================================================================

export async function getAllQuests(userId: string): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quests:', error)
    return []
  }

  return data.map(row => row.data as Quest)
}

export async function getQuestById(questId: string, userId: string): Promise<Quest | null> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    console.error('Error fetching quest:', error)
    return null
  }

  return data.data as Quest
}

function logSupabaseError(context: string, error: unknown): void {
  const err = error as { code?: string; message?: string }
  console.error(`[Supabase] ${context}:`, err)
  if (err?.code === '57014' || err?.message?.includes('timeout')) {
    console.warn('[Supabase] Подсказка: таймаут запроса. В Dashboard: Settings → Database увеличьте statement_timeout или проверьте тяжёлые триггеры/RLS.')
  }
  if (String(err?.message || '').includes('500') || (err as { status?: number })?.status === 500) {
    console.warn('[Supabase] Подсказка: 500 часто из‑за триггеров, RLS или больших JSONB. Проверьте логи в Supabase Dashboard.')
  }
}

/** Загрузка квеста только по id (для глобальных квестов, сохранённых любым пользователем) */
export async function getQuestByIdGlobal(questId: string): Promise<Quest | null> {
  const { data, error } = await supabase
    .from('quests')
    .select('*')
    .eq('id', questId)
    .maybeSingle()

  if (error) {
    logSupabaseError('getQuestByIdGlobal', error)
    return null
  }
  if (!data) return null
  const quest = data.data as Quest
  return quest ? ({ ...quest, id: questId } as Quest) : null
}

export async function createQuest(quest: Quest, userId: string): Promise<Quest> {
  ensureSupabaseConfigured()
  const { data, error } = await supabase
    .from('quests')
    .insert({
      id: quest.id,
      title: quest.title,
      description: quest.description || null,
      data: quest,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating quest:', error)
    throw error
  }

  return data.data as Quest
}

export async function updateQuest(quest: Quest, userId: string): Promise<Quest> {
  ensureSupabaseConfigured()
  const { data, error } = await supabase
    .from('quests')
    .update({
      title: quest.title,
      description: quest.description || null,
      data: quest
    })
    .eq('id', quest.id)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new Error('Quest not found or you do not have permission to update it')
    }
    console.error('Error updating quest:', error)
    throw error
  }

  return data.data as Quest
}

export async function deleteQuest(questId: string, userId: string): Promise<void> {
  ensureSupabaseConfigured()
  const { error } = await supabase
    .from('quests')
    .delete()
    .eq('id', questId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting quest:', error)
    throw error
  }
}

// ============================================================================
// Game Sessions
// ============================================================================

export async function getAllSessions(): Promise<GameSession[]> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('getAllSessions', error)
    return []
  }

  return data.map(row => ({
    id: row.id,
    code: row.code,
    questId: row.quest_id,
    quest: (row as { quest_data?: Quest }).quest_data || undefined,
    hostId: row.host_id,
    hostName: row.host_name,
    hostAvatar: row.host_avatar,
    state: row.state,
    roundId: row.round_id || undefined,
    players: (row.players as Player[]).map(player => ({
      ...player,
      score: player.score ?? 0
    })),
    activeQuestion: row.active_question as GameSession['activeQuestion'],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  }))
}

export async function getSessionById(sessionId: string): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle()

  if (error) {
    logSupabaseError('getSessionById', error)
    return null
  }
  if (!data) return null

  return {
    id: data.id,
    code: data.code,
    questId: data.quest_id,
    quest: (data as { quest_data?: Quest }).quest_data || undefined,
    hostId: data.host_id,
    hostName: data.host_name,
    hostAvatar: data.host_avatar,
    state: data.state,
    roundId: data.round_id || undefined,
    players: (data.players as Player[]).map(player => {
      const mappedPlayer = {
        ...player,
        score: player.score ?? 0
      }
      console.log('📊 Player loaded from database:', { id: mappedPlayer.id, name: mappedPlayer.name, score: mappedPlayer.score })
      return mappedPlayer
    }),
    activeQuestion: data.active_question as GameSession['activeQuestion'],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  }
}

export async function getSessionByCode(code: string): Promise<GameSession | null> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle()

  if (error) {
    logSupabaseError('getSessionByCode', error)
    return null
  }
  if (!data) return null

  return mapSessionRow(data as Parameters<typeof mapSessionRow>[0])
}

export async function createSession(session: GameSession): Promise<GameSession> {
  ensureSupabaseConfigured()
  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      id: session.id,
      code: session.code,
      quest_id: session.questId,
      quest_data: session.quest || null,
      host_id: session.hostId,
      host_name: session.hostName,
      host_avatar: session.hostAvatar,
      state: session.state,
      round_id: session.roundId || null,
      players: session.players,
      active_question: session.activeQuestion || null
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating session:', error)
    throw error
  }

  return mapSessionRow(data)
}

function mapSessionRow(data: { id: string; code: string; quest_id: string; quest_data?: Quest | null; host_id: string; host_name: string; host_avatar: string; state: string; round_id: string | null; players: Player[]; active_question: unknown; created_at: string; updated_at: string }): GameSession {
  return {
    id: data.id,
    code: data.code,
    questId: data.quest_id,
    quest: data.quest_data || undefined,
    hostId: data.host_id,
    hostName: data.host_name,
    hostAvatar: data.host_avatar,
    state: data.state as GameSession['state'],
    roundId: data.round_id || undefined,
    players: (data.players as Player[]).map(player => ({
      ...player,
      score: player.score ?? 0
    })),
    activeQuestion: data.active_question as GameSession['activeQuestion'],
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime()
  }
}

export async function updateSession(
  session: GameSession,
  options?: { includeQuestData?: boolean }
): Promise<GameSession> {
  const includeQuestData = options?.includeQuestData ?? false
  const payload: Record<string, unknown> = {
    code: session.code,
    quest_id: session.questId,
    host_id: session.hostId,
    host_name: session.hostName,
    host_avatar: session.hostAvatar,
    state: session.state,
    round_id: session.roundId || null,
    players: session.players,
    active_question: session.activeQuestion || null
  }
  if (includeQuestData) {
    payload.quest_data = session.quest || null
  }

  const { data, error } = await supabase
    .from('game_sessions')
    .update(payload)
    .eq('id', session.id)
    .select()

  if (error) {
    console.error('❌ Error updating session:', error)
    throw error
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    // Сессия удалена в БД (например CASCADE при удалении квеста), или RLS не вернул строку.
    console.warn(
      `[Supabase] Session update returned no rows (id=${session.id}). Session may have been deleted. Create a new game or re-join by code.`
    )
    throw new Error('Session not found or update returned no rows')
  }
  console.log('💾 [Save] Session updated:', session.id, 'state:', session.state, 'activeQuestion:', session.activeQuestion?.questionId ?? null)

  const updated: GameSession = {
    id: row.id,
    code: row.code,
    questId: row.quest_id,
    quest: (row as { quest_data?: Quest }).quest_data ?? session.quest,
    hostId: row.host_id,
    hostName: row.host_name,
    hostAvatar: row.host_avatar,
    state: row.state,
    roundId: row.round_id ?? undefined,
    players: (row.players as Player[]).map((player) => ({
      ...player,
      score: player.score ?? 0
    })),
    activeQuestion: row.active_question as GameSession['activeQuestion'],
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime()
  }

  return updated
}

/** Атомарный buzz: первый запрос получает право ответа (currentResponderId), остальные попадают в очередь. Вызывать с клиента участника. */
export async function tryBuzz(sessionId: string, playerId: string): Promise<GameSession | null> {
  ensureSupabaseConfigured()
  const { data, error } = await supabase.rpc('try_buzz', {
    p_session_id: sessionId,
    p_player_id: playerId
  })

  if (error) {
    console.error('Error try_buzz:', error)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return mapSessionRow(row as Parameters<typeof mapSessionRow>[0])
}

export async function deleteSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('game_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting session:', error)
    throw error
  }
}

// ============================================================================
// Quest Progress
// ============================================================================

export async function getQuestProgress(questId: string, userId: string) {
  const { data, error } = await supabase
    .from('quest_progress')
    .select('*')
    .eq('quest_id', questId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error fetching quest progress:', error)
    return []
  }

  return data.map(row => ({
    questId: row.quest_id,
    userId: row.user_id,
    roundId: row.round_id,
    categoryId: row.category_id,
    questionId: row.question_id,
    playedAt: new Date(row.played_at).getTime()
  }))
}

export async function markQuestionAsPlayed(
  questId: string,
  userId: string,
  roundId: string,
  categoryId: string,
  questionId: string
): Promise<void> {
  const { error } = await supabase
    .from('quest_progress')
    .upsert({
      quest_id: questId,
      user_id: userId,
      round_id: roundId,
      category_id: categoryId,
      question_id: questionId
    })

  if (error) {
    console.error('Error marking question as played:', error)
    throw error
  }
}

export async function resetQuestProgress(questId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('quest_progress')
    .delete()
    .eq('quest_id', questId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error resetting quest progress:', error)
    throw error
  }
}

export async function resetRoundProgress(
  questId: string,
  userId: string,
  roundId: string
): Promise<void> {
  const { error } = await supabase
    .from('quest_progress')
    .delete()
    .eq('quest_id', questId)
    .eq('user_id', userId)
    .eq('round_id', roundId)

  if (error) {
    console.error('Error resetting round progress:', error)
    throw error
  }
}

// ============================================================================
// Real-time subscriptions
// ============================================================================

export function subscribeToSessions(
  callback: (session: GameSession) => void,
  onSessionDeleted?: (sessionId: string) => void
): () => void {
  const channelName = `game_sessions_changes_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const channel = supabase
    .channel(channelName, {
      config: {
        broadcast: { self: true },
        presence: { key: 'session' }
      }
    })
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_sessions',
        filter: undefined // Подписываемся на все изменения
      },
      async (payload) => {
        try {
          console.log('📨 [Realtime] game_sessions payload:', {
            eventType: payload.eventType,
            sessionId: payload.new?.id ?? payload.old?.id,
            timestamp: new Date().toISOString()
          })
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const sessionId = payload.new.id
            console.log('🔄 [Realtime] Loading session:', sessionId)
            
            const session = await getSessionById(sessionId)
            if (session) {
              console.log('✅ [Realtime] Session loaded, players:', session.players.length)
              callback(session)
            } else {
              console.warn('⚠️ [Realtime] Session not found:', sessionId)
            }
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            console.log('🗑️ [Realtime] Session deleted:', deletedId)
            if (deletedId && onSessionDeleted) {
              onSessionDeleted(deletedId)
            }
          }
        } catch (error) {
          console.error('❌ [Realtime] Error in game_sessions subscription:', error)
        }
      }
    )
    .on('system', {}, (payload) => {
      // Обработка системных событий (подключение, отключение)
      if (payload.status === 'SUBSCRIBED') {
        console.log('✅ WebSocket connected to game_sessions')
      } else if (payload.status === 'CHANNEL_ERROR') {
        console.error('❌ WebSocket channel error:', payload)
      } else if (payload.status === 'TIMED_OUT') {
        console.warn('⏱️ WebSocket connection timed out, reconnecting...')
      } else if (payload.status === 'CLOSED') {
        console.warn('🔌 WebSocket connection closed')
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to game_sessions changes via WebSocket')
        console.log('📡 WebSocket channel:', channelName, 'is now listening for changes')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('❌ Error subscribing to game_sessions:', status)
        console.error('💡 Убедитесь, что real-time включен для таблицы game_sessions в Supabase Dashboard')
      } else if (status === 'TIMED_OUT') {
        console.warn('⏱️ Subscription timeout, retrying...')
        // Попытка переподключения
        setTimeout(() => {
          channel.subscribe()
        }, 1000)
      } else if (status === 'CLOSED') {
        console.warn('🔌 Subscription closed')
      } else {
        console.log('ℹ️ WebSocket subscription status:', status)
      }
    })

  // Автоматическое переподключение при разрыве соединения
  const handleReconnect = () => {
    console.log('🔄 Attempting to reconnect WebSocket...')
    channel.subscribe()
  }

  // Обработка разрыва соединения
  const originalUnsubscribe = channel.unsubscribe
  channel.unsubscribe = function() {
    console.log('🔌 Unsubscribing from game_sessions changes')
    return originalUnsubscribe.call(this)
  }

  return () => {
    console.log('🔌 Cleaning up WebSocket subscription')
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

