import type { GameSession, Quest, Question, ActiveQuestionState, PlayerStatus } from '@/types'

/**
 * Чистые правила игрового цикла (без сети и стора): находят вопрос, строят
 * состояние активного вопроса и применяют локальные fallback-переходы, когда
 * серверный RPC недоступен. Тестируются изолированно; оркестрацию (загрузку
 * сессии и сохранение) делает gameSessionStore.
 */

/**
 * Снимок quest_data из Realtime/UPDATE без TOAST-поля часто пустой.
 * Серверный снимок с rounds авторитетен; без rounds — оставляем локальный.
 */
export function mergeSessionQuestSnapshot(
  incoming: Quest | undefined,
  previous: Quest | undefined
): Quest | undefined {
  if (incoming?.rounds?.length) return incoming
  return previous
}

/** Находит вопрос в квесте по идентификаторам раунда/категории/вопроса. */
export function findQuestion(
  quest: Quest | undefined,
  roundId: string,
  categoryId: string,
  questionId: string
): Question | undefined {
  return quest?.rounds
    ?.find(r => r.id === roundId)?.categories
    ?.find(c => c.id === categoryId)?.questions
    ?.find(q => q.id === questionId)
}

/** Сбрасывает статусы всех игроков (по умолчанию в idle) и снимает отметку buzz. */
export function resetPlayersStatuses(session: GameSession, status: PlayerStatus = 'idle'): void {
  session.players.forEach(player => {
    player.status = status
    player.buzzedAt = undefined
  })
}

/** Свежее состояние активного вопроса при открытии. */
export function buildActiveQuestion(
  payload: { roundId: string; categoryId: string; questionId: string },
  at: number
): ActiveQuestionState {
  return {
    ...payload,
    openedAt: at,
    showAnswer: false,
    timerPaused: false,
    buzzedOrder: [],
    currentResponderId: null,
    responderStartedAt: null
  }
}

/**
 * Локальная логика buzz (fallback, если RPC try_buzz недоступен): первый нажавший
 * становится отвечающим и ставит таймер на паузу, остальные — в очередь. Возможна гонка.
 */
export function applyBuzzFallback(session: GameSession, playerId: string, at: number): void {
  const aq = session.activeQuestion
  if (!aq) return
  const player = session.players.find(p => p.id === playerId)
  if (!player) return

  if (!aq.currentResponderId) {
    aq.currentResponderId = playerId
    aq.buzzedOrder.push(playerId)
    aq.timerPaused = true
    aq.responderStartedAt = at
    player.status = 'buzzed'
    player.buzzedAt = at
  } else {
    aq.buzzedOrder.push(playerId)
    player.status = 'queued'
    player.buzzedAt = at
  }
}

/**
 * Локальная логика «неправильный ответ» (fallback): блокируем отвечающего на этот
 * вопрос, очищаем очередь и разрешаем остальным нажимать снова. Баллы не отнимаем.
 */
export function applyWrongAnswer(session: GameSession): void {
  const aq = session.activeQuestion
  if (!aq) return

  const failedPlayerId = aq.currentResponderId
  if (failedPlayerId) {
    const player = session.players.find(p => p.id === failedPlayerId)
    if (player) player.status = 'locked'
  }

  aq.buzzedOrder = []
  aq.currentResponderId = null
  aq.timerPaused = false
  session.players.forEach(player => {
    if (player.status !== 'locked') player.status = 'idle'
  })
}

/**
 * Локальная логика таймаута отвечающего (fallback): блокируем его, снимаем как
 * текущего отвечающего и возобновляем общий таймер вопроса для остальных.
 */
export function applyTimeoutResponderFallback(session: GameSession, failedPlayerId: string): void {
  const aq = session.activeQuestion
  if (!aq) return

  const player = session.players.find(p => p.id === failedPlayerId)
  if (player) player.status = 'locked'

  aq.buzzedOrder = []
  aq.currentResponderId = null
  aq.responderStartedAt = null
  aq.timerPaused = false
  session.players.forEach(p => {
    if (p.status !== 'locked' && p.id !== failedPlayerId) p.status = 'idle'
  })
}
