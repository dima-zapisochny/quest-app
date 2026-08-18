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

/**
 * Лёгкий список квестов (#16): из quest_list_view приходят только счётчики
 * (rounds_count/questions_count), без тяжёлого data. Полный квест подгружается
 * по требованию через loadQuestFull.
 * Fallback: если view не задеплоен (007), берём старый путь с полем data.
 */
export async function getQuestList(userId: string): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quest_list_view')
    .select('id, title, description, rounds_count, questions_count')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.warn('[Supabase] quest_list_view недоступен, fallback на полный data:', error.message)
    return getQuestListFallback(userId)
  }

  return (data || []).map((row: { id: string; title: string; description?: string | null; rounds_count?: number; questions_count?: number }) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    rounds: [], // структура подгрузится через loadQuestFull
    roundsCount: row.rounds_count ?? 0,
    questionsCount: row.questions_count ?? 0
  }))
}

/** Старый путь: тянет полный data и считает на клиенте (пока view не задеплоен). */
async function getQuestListFallback(userId: string): Promise<Quest[]> {
  const { data, error } = await supabase
    .from('quests')
    .select('id, title, description, data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching quest list:', error)
    return []
  }

  return (data || []).map((row: { id: string; title: string; description?: string | null; data?: Quest | null }) => {
    const q = row.data
    const rounds = q && Array.isArray(q.rounds) ? q.rounds : []
    const questionsCount = rounds.reduce((sum, r) => sum + (r.categories || []).reduce((cs, c) => cs + (c.questions?.length ?? 0), 0), 0)
    return {
      id: row.id,
      title: row.title ?? q?.title ?? '',
      description: row.description ?? q?.description ?? undefined,
      rounds,
      roundsCount: rounds.length,
      questionsCount
    } as Quest
  })
}

/** Повний список квестів з data (важкий, усі медіа в JSON). */
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
  if (!data) return null
  return (data as { data: Quest }).data
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

/** Только сессии, где пользователь — хост. Для инициализации store не тянем чужие сессии (#17). */
export async function getSessionsByHost(hostId: string): Promise<GameSession[]> {
  const { data, error } = await supabase
    .from('game_sessions')
    .select('*')
    .eq('host_id', hostId)
    .order('created_at', { ascending: false })

  if (error) {
    logSupabaseError('getSessionsByHost', error)
    return []
  }
  return (data || []).map(row => mapSessionRow(row as Parameters<typeof mapSessionRow>[0]))
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

/** Атомарный buzz: по clientTimestamp выигрывает тот, кто нажал раньше (устраняет гонку из-за порядка запросов). Вызывать с клиента участника. */
export async function tryBuzz(sessionId: string, playerId: string, clientTimestamp?: number): Promise<GameSession | null> {
  ensureSupabaseConfigured()
  const { data, error } = await supabase.rpc('try_buzz', {
    p_session_id: sessionId,
    p_player_id: playerId,
    p_client_ts: clientTimestamp ?? null
  })

  if (error) {
    console.error('Error try_buzz:', error)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return mapSessionRow(row as Parameters<typeof mapSessionRow>[0])
}

// ============================================================================
// Атомарные RPC игрового цикла (см. supabase-migrations/004_atomic_game_rpc.sql).
// Возвращают GameSession при успехе или null, если функция не задеплоена / ошибка —
// тогда вызывающий код откатывается на updateSession (старый путь).
// ============================================================================

/** Общий вызов RPC, возвращающего строку game_sessions. null → сигнал для fallback. */
async function sessionRpc(fn: string, params: Record<string, unknown>): Promise<GameSession | null> {
  const { data, error } = await supabase.rpc(fn, params)
  if (error) {
    console.warn(`[Supabase] RPC ${fn} недоступен, откат на updateSession:`, error.message)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  return row ? mapSessionRow(row as Parameters<typeof mapSessionRow>[0]) : null
}

/** Атомарный вход в сессию (#7). Бросает Error('SESSION_FULL') при переполнении; null → fallback. */
export async function joinSessionRpc(sessionId: string, player: Player, max = 20): Promise<GameSession | null> {
  const { data, error } = await supabase.rpc('join_session', {
    p_session_id: sessionId,
    p_player: player,
    p_max: max
  })
  if (error) {
    if (/SESSION_FULL/.test(error.message)) throw new Error('SESSION_FULL')
    console.warn('[Supabase] RPC join_session недоступен, откат:', error.message)
    return null
  }
  const row = Array.isArray(data) ? data[0] : data
  return row ? mapSessionRow(row as Parameters<typeof mapSessionRow>[0]) : null
}

export const leaveSessionRpc = (sessionId: string, playerId: string) =>
  sessionRpc('leave_session', { p_session_id: sessionId, p_player_id: playerId })

export const awardPointsRpc = (sessionId: string, playerId: string, delta: number) =>
  sessionRpc('award_points', { p_session_id: sessionId, p_player_id: playerId, p_delta: delta })

export const setPlayerScoreRpc = (sessionId: string, playerId: string, score: number) =>
  sessionRpc('set_player_score', { p_session_id: sessionId, p_player_id: playerId, p_score: score })

export const resetScoresRpc = (sessionId: string) =>
  sessionRpc('reset_scores', { p_session_id: sessionId })

export const timeoutResponderRpc = (sessionId: string, playerId: string) =>
  sessionRpc('timeout_responder', { p_session_id: sessionId, p_player_id: playerId })

/** Presence-пинг игрока (#5). Fire-and-forget: ошибки/отсутствие RPC игнорируем. */
export async function heartbeatRpc(sessionId: string, playerId: string): Promise<void> {
  try {
    await supabase.rpc('heartbeat', { p_session_id: sessionId, p_player_id: playerId })
  } catch { /* presence не задеплоен — не критично */ }
}

/** Хост убирает протухших игроков (#5). Возвращает сессию, если кого-то убрали; иначе null. */
export const pruneStalePlayersRpc = (sessionId: string, ttlMs = 30000) =>
  sessionRpc('prune_stale_players', { p_session_id: sessionId, p_ttl_ms: ttlMs })

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
// Quest Media Storage (зберігає файли окремо, щоб не роздувати JSON і уникнути timeout)
// ============================================================================

const QUEST_MEDIA_BUCKET = 'quest-media'

/**
 * Завантажує файл (зображення/аудіо) в Supabase Storage і повертає публічний URL.
 * Якщо Supabase не налаштований або помилка — повертає null (клієнт може зберегти base64).
 */
export async function uploadQuestMedia(
  questId: string,
  userId: string,
  file: File,
  mediaId: string
): Promise<string | null> {
  if (!isSupabaseConfigured) return null
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
  const path = `${userId}/${questId}/${mediaId}.${ext}`
  const { error } = await supabase.storage.from(QUEST_MEDIA_BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || undefined
  })
  if (error) {
    console.warn('[Supabase] Upload quest media failed:', error.message, { code: (error as { error?: string }).error, path, size: file.size })
    return null
  }
  const { data } = supabase.storage.from(QUEST_MEDIA_BUCKET).getPublicUrl(path)
  return data.publicUrl
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
    .upsert(
      {
        quest_id: questId,
        user_id: userId,
        round_id: roundId,
        category_id: categoryId,
        question_id: questionId
      },
      {
        onConflict: 'quest_id,round_id,category_id,question_id,user_id'
      }
    )

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

/**
 * Подписка на ОДНУ сессию по id (#17): realtime фильтрует по id=eq.<sessionId>,
 * поэтому клиент не получает изменения чужих игр. payload.new маппится напрямую —
 * без лишнего getSessionById на каждое событие.
 */
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

