import { supabase, ensureSupabaseConfigured, logSupabaseError } from './_shared'
import type { GameSession, Quest, Player } from '@/types'

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

export function mapSessionRow(data: { id: string; code: string; quest_id: string; quest_data?: Quest | null; host_id: string; host_name: string; host_avatar: string; state: string; round_id: string | null; players: Player[]; active_question: unknown; created_at: string; updated_at: string }): GameSession {
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

