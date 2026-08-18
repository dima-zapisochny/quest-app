import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type {
  GameSession,
  Quest,
  UserProfile,
  Player
} from '@/types'
import { useQuizStore } from './quizStore'
import { useProfileStore } from './profileStore'
import { generateId } from '@/utils/id'
import {
  findQuestion,
  resetPlayersStatuses,
  buildActiveQuestion,
  applyBuzzFallback,
  applyWrongAnswer,
  applyTimeoutResponderFallback
} from '@/services/gameFlow'
import {
  getSessionsByHost,
  getSessionById as getSessionByIdFromDb,
  getSessionByCode,
  createSession as createSessionInDb,
  updateSession,
  tryBuzz as tryBuzzInDb,
  deleteSession as deleteSessionInDb,
  subscribeToSession,
  joinSessionRpc,
  leaveSessionRpc,
  awardPointsRpc,
  setPlayerScoreRpc,
  resetScoresRpc,
  timeoutResponderRpc,
  heartbeatRpc,
  pruneStalePlayersRpc
} from '@/services/supabaseService'

function generateCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function now() {
  return Date.now()
}

/** Максимум участников в одной сессии (включая ведущего). */
const MAX_SESSION_PLAYERS = 20

export const useGameSessionStore = defineStore('game-session', () => {
  const profileStore = useProfileStore()
  const sessions = ref<GameSession[]>([])
  const isLoading = ref(true) // Начинаем с true, так как данные загружаются при инициализации

  /** Промис готовности store вместо busy-wait циклов `while(isLoading) sleep(100)` (#35). */
  function whenReady(): Promise<void> {
    if (!isLoading.value) return Promise.resolve()
    return new Promise<void>(resolve => {
      const stop = watch(isLoading, loading => {
        if (!loading) { stop(); resolve() }
      })
    })
  }

  // Загрузка данных при инициализации
  async function loadData() {
    isLoading.value = true
    try {
      // Профиль + анонимная авторизация + активная сессия игрока (profileStore)
      await profileStore.loadProfile()

      // Загружаем только СВОИ (хостованные) сессии — не тянем чужие (#17).
      // Сессии игрока (по коду) и восстановление грузятся по требованию.
      const uid = profileStore.userProfile?.id
      sessions.value = uid ? await getSessionsByHost(uid) : []
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Инициализация при монтировании store. Realtime-подписка больше НЕ глобальная (#17):
  // на конкретную сессию подписываемся через watchSession() из QuestView/PlayerSessionView.
  if (typeof window !== 'undefined') {
    loadData()
  }

  /** Применяет realtime-обновление сессии в store (новые объекты для реактивности Vue). */
  function applySessionUpdate(session: GameSession) {
    const existingIndex = sessions.value.findIndex(s => s.id === session.id)
    const rebuilt: GameSession = {
      ...session,
      players: session.players.map(player => ({ ...player })),
      activeQuestion: session.activeQuestion ? { ...session.activeQuestion } : undefined
    }
    if (existingIndex >= 0) {
      updateSessionInArray(rebuilt)
    } else {
      sessions.value = [...sessions.value, rebuilt]
    }
  }

  // Подписка на текущую сессию (одну, с фильтром по id — #17)
  let unsubscribeSession: (() => void) | null = null
  let subscribedSessionId: string | null = null

  /** Подписаться на realtime конкретной сессии (вызывается из вью при входе в игру). */
  function watchSession(sessionId: string) {
    if (subscribedSessionId === sessionId && unsubscribeSession) return
    unwatchSession()
    subscribedSessionId = sessionId
    unsubscribeSession = subscribeToSession(
      sessionId,
      (session) => applySessionUpdate(session),
      (deletedId) => { sessions.value = sessions.value.filter(s => s.id !== deletedId) }
    )
  }

  /** Отписаться от realtime текущей сессии. */
  function unwatchSession() {
    if (unsubscribeSession) {
      unsubscribeSession()
      unsubscribeSession = null
    }
    subscribedSessionId = null
  }

  const getSessionById = (sessionId: string) => sessions.value.find(session => session.id === sessionId)
  const getSessionByCodeLocal = (code: string) => sessions.value.find(session => session.code.toUpperCase() === code.toUpperCase())

  // Helper функция для обновления сессии в массиве с правильной реактивностью Vue
  function updateSessionInArray(updatedSession: GameSession) {
    const index = sessions.value.findIndex(s => s.id === updatedSession.id)
    if (index >= 0) {
      const oldSession = sessions.value[index]
      const oldPlayersCount = oldSession.players.length
      const newPlayersCount = updatedSession.players.length
      
      // Создаем полностью новый объект и новый массив для триггера реактивности Vue
      // Важно: создаем новые объекты для каждого игрока, чтобы Vue отследил изменения в score
      const newSession: GameSession = {
        id: updatedSession.id,
        code: updatedSession.code,
        questId: updatedSession.questId,
        quest: updatedSession.quest,
        hostId: updatedSession.hostId,
        hostName: updatedSession.hostName,
        hostAvatar: updatedSession.hostAvatar,
        state: updatedSession.state,
        roundId: updatedSession.roundId,
        players: updatedSession.players.map(player => ({ ...player })), // Создаем новый объект для каждого игрока
        activeQuestion: updatedSession.activeQuestion ? { ...updatedSession.activeQuestion } : undefined,
        createdAt: updatedSession.createdAt,
        updatedAt: updatedSession.updatedAt
      }
      
      // Создаем новый массив для триггера реактивности Vue
      // Это гарантирует, что Vue отследит изменение и пересчитает все computed свойства
      sessions.value = [
        ...sessions.value.slice(0, index),
        newSession,
        ...sessions.value.slice(index + 1)
      ]
      
      console.log('🔄 Session updated in array:', {
        sessionId: updatedSession.id,
        oldPlayersCount,
        newPlayersCount,
        playersChanged: oldPlayersCount !== newPlayersCount,
        newArrayCreated: true
      })
      
      return true
    }
    return false
  }

  /**
   * Сохраняет сессию на сервер и применяет результат в стор. При ошибке сети
   * оставляет локальную мутацию (оптимистично). Убирает повтор try/updateSession/
   * updateSessionInArray/catch во всех host-операциях игрового цикла.
   */
  async function persistSession(
    session: GameSession,
    opts?: { includeQuestData?: boolean }
  ): Promise<GameSession> {
    try {
      const updated = await updateSession(session, opts)
      updateSessionInArray(updated)
      return updated
    } catch (error) {
      console.error('Error updating session:', error)
      updateSessionInArray(session)
      return session
    }
  }

  async function createSession(questId: string, questSnapshot?: Quest) {
    const profile = profileStore.ensureProfile()
    const session: GameSession = {
      id: generateId('session'),
      code: generateCode(),
      questId,
      quest: questSnapshot,
      hostId: profile.id,
      hostName: profile.name,
      hostAvatar: profile.avatar,
      state: 'lobby',
      roundId: undefined,
      players: [
        {
          id: profile.id,
          name: profile.name,
          avatar: profile.avatar,
          joinedAt: now(),
          status: 'idle',
          score: 0
        }
      ],
      activeQuestion: undefined,
      createdAt: now(),
      updatedAt: now()
    }
    
    // Код игры уникален в БД (UNIQUE). При коллизии (23505) перегенерируем код и
    // повторяем — иначе пользователь видел сырую ошибку Postgres (#24).
    const MAX_CODE_RETRIES = 5
    for (let attempt = 0; attempt < MAX_CODE_RETRIES; attempt++) {
      try {
        const created = await createSessionInDb(session)
        sessions.value.push(created)
        console.log('🟢 [Lifecycle] Session created:', { id: created.id, code: created.code, questId: created.questId })
        return created
      } catch (error) {
        const code = (error as { code?: string })?.code
        const msg = (error as { message?: string })?.message ?? ''
        const isCodeCollision = code === '23505' && /code/i.test(msg)
        if (isCodeCollision && attempt < MAX_CODE_RETRIES - 1) {
          session.code = generateCode()
          console.warn('⚠️ Код игры занят, генерируем новый и повторяем:', session.code)
          continue
        }
        console.error('Error creating session:', error)
        throw error
      }
    }
    // недостижимо, но для типов
    throw new Error('Не удалось создать игру: не нашлось свободного кода')
  }

  async function deleteSession(sessionId: string) {
    try {
      await deleteSessionInDb(sessionId)
      sessions.value = sessions.value.filter(session => session.id !== sessionId)
      console.log('🔴 [Lifecycle] Session deleted:', sessionId)
    } catch (error) {
      console.error('Error deleting session:', error)
      // Fallback: удаляем из локального массива
      sessions.value = sessions.value.filter(session => session.id !== sessionId)
    }
  }

  async function joinSessionByCode(code: string) {
    const profile = profileStore.ensureProfile()
    
    // Сначала проверяем локальный кеш
    let session = getSessionByCodeLocal(code)
    
    // Если не найдено локально, запрашиваем из базы
    if (!session) {
      try {
        session = (await getSessionByCode(code)) ?? undefined // Используем импортированную функцию из supabaseService
        if (session) {
          // Добавляем в локальный кеш
          const existingIndex = sessions.value.findIndex(s => s.id === session!.id)
          if (existingIndex >= 0) {
            sessions.value[existingIndex] = session
          } else {
            sessions.value.push(session)
          }
        }
      } catch (error) {
        console.error('Error fetching session by code:', error)
      }
    }
    
    if (!session) {
      throw new Error('Сессия с таким кодом не найдена')
    }
    
    return await processJoin(session, profile)
  }
  
  async function processJoin(session: GameSession, profile: UserProfile, existingPlayerId?: string): Promise<{ session: GameSession; playerId: string }> {
    // Если указан existingPlayerId, проверяем, есть ли игрок с таким ID в сессии
    if (existingPlayerId && session.players.some(player => player.id === existingPlayerId)) {
      profileStore.setActivePlayer(session.id, existingPlayerId)
      return { session, playerId: existingPlayerId }
    }
    
    // Лимит участников: не более MAX_SESSION_PLAYERS (включая ведущего)
    if (session.players.length >= MAX_SESSION_PLAYERS) {
      throw new Error(`В игре уже максимальное число участников (${MAX_SESSION_PLAYERS}). Попробуйте подключиться к другой игре.`)
    }

    // Проверяем, есть ли игрок с таким же профилем (по ID профиля)
    const existingPlayer = session.players.find(player => player.id === profile.id)
    if (existingPlayer) {
      // Игрок уже в сессии — его счёт авторитетно хранится на сервере, ничего не восстанавливаем
      profileStore.setActivePlayer(session.id, existingPlayer.id)
      return { session, playerId: existingPlayer.id }
    }

    // Новый игрок всегда начинает с 0 — очки авторитетны на сервере (#14), localStorage не читаем
    const playerIdToUse = existingPlayerId || profile.id
    const player: Player = {
      id: playerIdToUse,
      name: profile.name,
      avatar: profile.avatar,
      joinedAt: now(),
      status: 'idle',
      score: 0
    }

    // Приоритет: атомарный вход через RPC (#7) — устраняет гонку одновременных входов.
    try {
      const viaRpc = await joinSessionRpc(session.id, player, MAX_SESSION_PLAYERS)
      if (viaRpc) {
        updateSessionInArray(viaRpc)
        profileStore.setActivePlayer(viaRpc.id, player.id)
        return { session: viaRpc, playerId: player.id }
      }
    } catch (e) {
      if (e instanceof Error && e.message === 'SESSION_FULL') {
        throw new Error(`В игре уже максимальное число участников (${MAX_SESSION_PLAYERS}). Попробуйте подключиться к другой игре.`)
      }
      // иная ошибка — уходим в fallback ниже
    }

    // Fallback (RPC не задеплоен): старый путь read-modify-write через updateSession
    session.players.push(player)
    session.updatedAt = now()

    try {
      const updated = await updateSession(session)
      const index = sessions.value.findIndex(s => s.id === session.id)
      if (index >= 0) {
        updateSessionInArray({ ...updated, players: [...updated.players] })
      }
      profileStore.setActivePlayer(updated.id, player.id)
      return { session: updated, playerId: player.id }
    } catch (error) {
      console.error('Error updating session:', error)
      updateSessionInArray(session)
      profileStore.setActivePlayer(session.id, player.id)
      return { session, playerId: player.id }
    }
  }

  // Восстанавливает игрока в сессии при перезагрузке страницы
  async function restorePlayerToSession(sessionId: string): Promise<{ session: GameSession; playerId: string } | null> {
    const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
    if (!storedActiveSession) {
      return null
    }

    try {
      const parsed = JSON.parse(storedActiveSession)
      if (parsed.sessionId !== sessionId) {
        return null
      }

      const session = getSessionById(sessionId)
      if (!session) {
        console.warn('⚠️ Session not found for restore')
        return null
      }

      // Проверяем, есть ли игрок уже в сессии
      const existingPlayer = session.players.find(p => p.id === parsed.playerId)
      if (existingPlayer) {
        console.log('✅ Player already in session, no restore needed')
        profileStore.setActivePlayer(session.id, parsed.playerId)
        return { session, playerId: parsed.playerId }
      }

      // Игрок не найден, восстанавливаем его
      const profile = profileStore.ensureProfile()
      console.log('🔄 Restoring player to session:', parsed.playerId)
      
      // Восстанавливаем игрока
      const result = await processJoin(session, profile, parsed.playerId)
      
      // Ждем, чтобы убедиться, что обновление применилось в базе
      // Это предотвратит перезапись WebSocket обновлением
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Проверяем, что игрок действительно в сессии после восстановления
      const verifySession = getSessionById(sessionId)
      if (verifySession) {
        const verifyPlayer = verifySession.players.find(p => p.id === parsed.playerId)
        if (verifyPlayer) {
          console.log('✅ Player restoration completed and verified in session')
        } else {
          console.warn('⚠️ Player not found after restoration, but restoration completed')
        }
      }
      
      return result
    } catch (error) {
      console.error('❌ Error restoring player to session:', error)
      return null
    }
  }

  async function leaveSession(sessionId: string, playerId: string) {
    const session = getSessionById(sessionId)
    if (!session) return

    // Удаляем участника из массива (счёт остаётся в строке сессии на сервере до удаления игрока)
    const updatedPlayers = session.players.filter(player => player.id !== playerId)
    const updatedSession = {
      ...session,
      players: updatedPlayers,
      updatedAt: now()
    }
    
    if (profileStore.activePlayerSession?.sessionId === sessionId && profileStore.activePlayerSession.playerId === playerId) {
      profileStore.clearActivePlayer()
    }

    // Сначала обновляем локально для немедленного отображения
    updateSessionInArray(updatedSession)

    // Приоритет: атомарное удаление через RPC (не затирает параллельные входы)
    const viaRpc = await leaveSessionRpc(sessionId, playerId)
    if (viaRpc) {
      updateSessionInArray(viaRpc)
      return
    }

    try {
      // Fallback: старый путь через updateSession
      const updated = await updateSession(updatedSession)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // При ошибке оставляем локальное обновление
    }
  }

  async function setActiveRound(sessionId: string, roundId: string) {
    const session = getSessionById(sessionId)
    if (!session) return
    
    session.roundId = roundId
    session.state = 'active'
    session.updatedAt = now()
    await persistSession(session)
  }

  async function openQuestion(
    sessionId: string,
    payload: { roundId: string; categoryId: string; questionId: string }
  ) {
    const session = getSessionById(sessionId)
    if (!session) return

    resetPlayersStatuses(session)
    session.activeQuestion = buildActiveQuestion(payload, now())
    session.state = 'active'
    session.updatedAt = now()
    await persistSession(session)
  }

  async function closeQuestion(sessionId: string, options?: { byTimeout?: boolean }) {
    const session = getSessionById(sessionId)
    if (!session) return

    const aq = session.activeQuestion
    const byTimeout = options?.byTimeout === true
    // Сыгранным помечаем только при таймауте (крестик). Ручное закрытие до конца таймера — вопрос остаётся не разыгранным.
    if (aq && byTimeout) {
      const q = findQuestion(session.quest, aq.roundId, aq.categoryId, aq.questionId)
      if (q) {
        q.played = true
        if (!q.answeredBy) {
          q.timedOut = true
          useQuizStore().markQuestionAsPlayed(session.questId, aq.roundId, aq.categoryId, aq.questionId)
        }
      }
    }

    session.activeQuestion = undefined
    resetPlayersStatuses(session)
    session.updatedAt = now()
    await persistSession(session, { includeQuestData: true })
  }

  async function revealAnswer(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return

    session.activeQuestion.showAnswer = true
    session.updatedAt = now()
    await persistSession(session)
  }

  /**
   * Помечает активный вопрос как сыгранный по истечению таймера (крестик),
   * НЕ очищая activeQuestion — чтобы ответ оставался виден участникам,
   * пока ведущий не закроет модалку. Очистку делает closeQuestion.
   */
  async function markActiveQuestionTimedOut(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return
    const aq = session.activeQuestion
    const q = findQuestion(session.quest, aq.roundId, aq.categoryId, aq.questionId)
    if (q && !q.answeredBy) {
      q.played = true
      q.timedOut = true
      useQuizStore().markQuestionAsPlayed(session.questId, aq.roundId, aq.categoryId, aq.questionId)
    }
    session.updatedAt = now()
    await persistSession(session, { includeQuestData: true })
  }

  async function syncSessionQuestSnapshot(questId: string, quest: Quest) {
    const clearedSnapshot = JSON.parse(JSON.stringify(quest)) as Quest
    const list = sessions.value.filter(s => s.questId === questId)
    for (const session of list) {
      const sessionToUpdate: GameSession = {
        ...session,
        quest: clearedSnapshot,
        updatedAt: now()
      }
      try {
        const updated = await updateSession(sessionToUpdate, { includeQuestData: true })
        const withQuest = { ...updated, quest: clearedSnapshot }
        updateSessionInArray(withQuest)
      } catch (error) {
        console.error('Error syncing session quest snapshot:', error)
        updateSessionInArray({ ...session, quest: clearedSnapshot, updatedAt: now() })
      }
    }
  }

  async function buzz(sessionId: string, playerId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return

    const player = session.players.find(p => p.id === playerId)
    if (!player) return

    if (player.status === 'locked' || player.status === 'buzzed' || session.activeQuestion.buzzedOrder.includes(playerId)) {
      return
    }

    // Клиентский timestamp: хто натиснув раніше за своїм часом — той і відповідає (усуває гонку через порядок запитів).
    const clientTs = typeof Date.now === 'function' ? Date.now() : 0
    const updated = await tryBuzzInDb(sessionId, playerId, clientTs)
    if (updated) {
      updateSessionInArray(updated)
      return
    }

    // Fallback, если RPC try_buzz не подключён или ошибка: локальная логика (возможна гонка).
    applyBuzzFallback(session, playerId, now())
    session.updatedAt = now()
    await persistSession(session)
  }

  async function resolveQuestion(sessionId: string, correct: boolean) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return

    const quizStore = useQuizStore()
    const { roundId, categoryId, questionId } = session.activeQuestion

    if (correct) {
      const responderId = session.activeQuestion.currentResponderId
      const responder = responderId ? session.players.find(p => p.id === responderId) ?? null : null
      const answeredBy = responder
        ? { playerId: responder.id, playerName: responder.name, playerAvatar: responder.avatar }
        : undefined

      // Значение вопроса для начисления + отметка «кто ответил» в квесте
      let awardDelta = 0
      const question = findQuestion(quizStore.getQuestById(session.questId), roundId, categoryId, questionId)
      if (responder && question) {
        awardDelta = question.value
        question.answeredBy = answeredBy
      }

      // Отмечаем вопрос сыгранным (таблица прогресса + снимок квеста в store)
      quizStore.markQuestionAsPlayed(session.questId, roundId, categoryId, questionId, answeredBy)

      // Обновляем снимок квеста в сессии, чтобы на плитках сразу отображалось «кто ответил»
      const snapQ = findQuestion(session.quest, roundId, categoryId, questionId)
      if (snapQ) {
        snapQ.played = true
        if (responder) snapQ.answeredBy = answeredBy
      }

      // Показываем правильный ответ участникам (счёт пока прежний — начислим атомарно ниже)
      session.activeQuestion.showAnswer = true
      session.updatedAt = now()
      await persistSession(session, { includeQuestData: true })

      // Атомарное начисление очков отвечающему (#14) — не теряется при параллельных записях
      if (responder && awardDelta > 0) {
        const viaRpc = await awardPointsRpc(sessionId, responder.id, awardDelta)
        if (viaRpc) {
          updateSessionInArray(viaRpc)
        } else {
          // Fallback (RPC не задеплоен): начисляем локально и сохраняем ещё раз
          const p = session.players.find(pp => pp.id === responder.id)
          if (p) {
            p.score = (p.score || 0) + awardDelta
            session.players = [...session.players]
            session.updatedAt = now()
            await persistSession(session)
          }
        }
      }

      // НЕ закрываем вопрос сразу: showAnswer=true оставляет ответ видимым,
      // пока ведущий не закроет модалку (тогда сработает closeQuestion).
      return
    }

    // Неправильный ответ: блокируем отвечающего, очищаем очередь, разрешаем остальным.
    applyWrongAnswer(session)
    session.updatedAt = now()
    await persistSession(session)
  }

  async function pauseTimer(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return

    session.activeQuestion.timerPaused = true
    session.updatedAt = now()
    await persistSession(session)
  }

  async function resumeTimer(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return

    session.activeQuestion.timerPaused = false
    session.updatedAt = now()
    await persistSession(session)
  }

  async function timeoutResponder(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion || !session.activeQuestion.currentResponderId) return

    const failedPlayerId = session.activeQuestion.currentResponderId

    // Приоритет: атомарный таймаут через RPC (#12) — идемпотентно, не зависит от порядка запросов.
    const viaRpc = await timeoutResponderRpc(sessionId, failedPlayerId)
    if (viaRpc) {
      updateSessionInArray(viaRpc)
      return
    }

    // Fallback (RPC не задеплоен): старый путь. Сохраняем buzzedOrder, возобновляем общий таймер.
    applyTimeoutResponderFallback(session, failedPlayerId)
    session.updatedAt = now()
    await persistSession(session)
  }

  async function resetPlayersScores(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session) {
      console.warn('⚠️ Session not found for resetting scores:', sessionId)
      return
    }
    
    // Приоритет: атомарный сброс через RPC
    const viaRpc = await resetScoresRpc(sessionId)
    if (viaRpc) {
      updateSessionInArray(viaRpc)
      return
    }

    // Fallback: старый путь
    session.players.forEach(player => {
      player.score = 0
    })
    session.updatedAt = now()
    await persistSession(session)
  }

  async function setPlayerScore(sessionId: string, playerId: string, newScore: number) {
    const session = getSessionById(sessionId)
    if (!session) return
    const player = session.players.find(p => p.id === playerId)
    if (!player) return
    const score = Math.max(0, Math.round(newScore))

    // Приоритет: атомарная установка счёта через RPC (не затирает параллельные изменения)
    const viaRpc = await setPlayerScoreRpc(sessionId, playerId, score)
    if (viaRpc) {
      updateSessionInArray(viaRpc)
      return
    }

    // Fallback: старый путь
    player.score = score
    session.updatedAt = now()
    await persistSession(session)
  }

  // Проверяет существование активной сессии и возвращает её, если она существует
  async function checkActivePlayerSession(): Promise<{ session: GameSession; playerId: string } | null> {
    // Если активная сессия не загружена в store, пытаемся загрузить из localStorage
    if (!profileStore.activePlayerSession) {
      console.log('🔍 checkActivePlayerSession: No active player session in store, checking localStorage...')
      const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
      if (storedActiveSession) {
        try {
          const parsed = JSON.parse(storedActiveSession)
          profileStore.activePlayerSession = { sessionId: parsed.sessionId, playerId: parsed.playerId }
          console.log('✅ Active session loaded from localStorage:', parsed)
        } catch (error) {
          console.error('❌ Error parsing active session from localStorage:', error)
          return null
        }
      } else {
        console.log('🔍 checkActivePlayerSession: No active player session in localStorage')
        return null
      }
    }

    const { sessionId, playerId } = profileStore.activePlayerSession
    console.log('🔍 checkActivePlayerSession: Checking session', sessionId, 'for player', playerId)
    
    // Сначала проверяем в локальном кеше
    let session = getSessionById(sessionId)
    
    // Если не найдено локально, пытаемся загрузить из базы
    if (!session) {
      console.log('📡 Session not found locally, fetching from database...')
      try {
        session = (await getSessionByIdFromDb(sessionId)) ?? undefined
        if (session) {
          console.log('✅ Session loaded from database, players count:', session.players.length)
          // Добавляем в локальный кеш через helper функцию для правильной реактивности
          if (!updateSessionInArray(session)) {
            // Если сессия не найдена, добавляем новую, создавая новый массив для реактивности
            sessions.value = [...sessions.value, {
              ...session,
              players: session.players.map(player => ({ ...player })) // Создаем новый объект для каждого игрока
            }]
          }
          // Обновляем session для дальнейшей проверки
          session = sessions.value.find(s => s.id === sessionId) || session
          console.log('✅ Session added to store from database')
        } else {
          console.warn('⚠️ Session not found in database:', sessionId)
        }
      } catch (error) {
        console.error('❌ Error fetching active session:', error)
        // Не очищаем активную сессию при ошибке - возможно, это временная проблема сети
        return null
      }
    } else {
      console.log('✅ Session found in local cache, players count:', session.players.length)
    }

    // Если сессия не найдена, очищаем активную сессию
    if (!session) {
      console.warn('⚠️ Session not found, clearing active player session')
      profileStore.clearActivePlayer()
      return null
    }

    // Проверяем, что игрок все еще в сессии
    const player = session.players.find(p => p.id === playerId)
    if (!player) {
      console.warn('⚠️ Player not found in session, clearing active player session')
      console.log('Available players:', session.players.map(p => ({ id: p.id, name: p.name })))
      profileStore.clearActivePlayer()
      return null
    }

    console.log('✅ Active session verified:', { sessionId, playerId, playerName: player.name })
    return { session, playerId }
  }


  // Проверяет, является ли пользователь хостом какой-либо сессии
  /** Сессия считается «активной» для авто-редиректа только если обновлялась недавно —
   *  иначе забытая старая сессия запирала хоста в игре навсегда (#2, #24). */
  const HOST_SESSION_FRESH_MS = 12 * 60 * 60 * 1000 // 12 часов

  function checkActiveHostSession(): { session: GameSession; isHost: true } | null {
    if (!profileStore.userProfile) return null

    const now = Date.now()
    const hostSession = sessions.value
      .filter(session => session.hostId === profileStore.userProfile!.id)
      .filter(session => now - (session.updatedAt || 0) < HOST_SESSION_FRESH_MS)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0]

    if (hostSession) {
      console.log('✅ Active host session found:', hostSession.id, hostSession.code)
      return { session: hostSession, isHost: true }
    }

    return null
  }

  // Проверяет активную сессию (хоста или игрока) и возвращает информацию для редиректа
  async function checkActiveSession(): Promise<{ 
    session: GameSession; 
    role: 'host' | 'player';
    playerId?: string;
  } | null> {
    // Сначала проверяем, является ли пользователь хостом
    const hostSession = checkActiveHostSession()
    if (hostSession) {
      return { session: hostSession.session, role: 'host' }
    }
    
    // Затем проверяем, является ли пользователь игроком
    const playerSession = await checkActivePlayerSession()
    if (playerSession) {
      return { 
        session: playerSession.session, 
        role: 'player',
        playerId: playerSession.playerId
      }
    }
    
    return null
  }

  /** Оновлює сесію з сервера (fallback, якщо Realtime не прийшов — щоб учасники з’являлись у списку без перезавантаження). */
  async function refreshSessionFromServer(sessionId: string): Promise<void> {
    const session = await getSessionByIdFromDb(sessionId)
    if (!session) return
    const idx = sessions.value.findIndex(s => s.id === sessionId)
    if (idx < 0) return
    const local = sessions.value[idx]
    // Снимок quest_data на сервере авторитетен по «сыграно» (#28): пишется при
    // resolve / close / timeout / reset (includeQuestData). Раньше здесь сохранялся
    // локальный квест из-за устаревшего снимка — это и было источником расхождения
    // между хостом и игроком. Теперь доверяем серверу (как и realtime-путь).
    // Fallback: если серверный снимок пуст, оставляем локальный квест, чтобы не сломать доску.
    if (!session.quest?.rounds?.length && local.quest?.rounds?.length) {
      session.quest = local.quest
    }
    updateSessionInArray(session)
  }

  /** Presence-пинг игрока — «я ещё здесь» (#5). Вызывается интервалом из PlayerSessionView. */
  async function heartbeat(sessionId: string, playerId: string): Promise<void> {
    await heartbeatRpc(sessionId, playerId)
  }

  /** Хост убирает игроков с протухшим heartbeat (#5). Вызывается интервалом из QuestView. */
  async function pruneStalePlayers(sessionId: string, ttlMs = 30000): Promise<void> {
    const updated = await pruneStalePlayersRpc(sessionId, ttlMs)
    if (updated) updateSessionInArray(updated)
  }

  const sessionList = computed(() => sessions.value)

  return {
    // Профиль/auth делегированы в profileStore; проксируем для обратной совместимости консюмеров
    userProfile: computed(() => profileStore.userProfile),
    sessions: sessionList,
    activePlayerSession: computed(() => profileStore.activePlayerSession),
    isLoading,
    whenReady,
    loadData,
    setUserProfile: profileStore.setUserProfile,
    ensureProfile: profileStore.ensureProfile,
    getSessionById,
    getSessionByCode: getSessionByCodeLocal,
    createSession,
    deleteSession,
    joinSessionByCode,
    leaveSession,
    restorePlayerToSession,
    setActiveRound,
    openQuestion,
    closeQuestion,
    revealAnswer,
    markActiveQuestionTimedOut,
    syncSessionQuestSnapshot,
    buzz,
    resolveQuestion,
    pauseTimer,
    resumeTimer,
    timeoutResponder,
    resetPlayersScores,
    setPlayerScore,
    setActivePlayer: profileStore.setActivePlayer,
    clearActivePlayer: profileStore.clearActivePlayer,
    checkActivePlayerSession,
    checkActiveHostSession,
    checkActiveSession,
    getCurrentDevicePlayer: profileStore.getCurrentDevicePlayer,
    refreshSessionFromServer,
    heartbeat,
    pruneStalePlayers,
    watchSession,
    unwatchSession
  }
})
