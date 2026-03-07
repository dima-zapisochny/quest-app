import { defineStore } from 'pinia'
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import type {
  GameSession,
  Quest,
  UserProfile,
  Player,
  ActiveQuestionState,
  PlayerStatus
} from '@/types'
import { useQuizStore } from './quizStore'
import { generateId } from '@/utils/id'
import {
  getUserProfile,
  upsertUserProfile,
  getAllSessions,
  getSessionById as getSessionByIdFromDb,
  getSessionByCode,
  createSession as createSessionInDb,
  updateSession,
  deleteSession as deleteSessionInDb,
  subscribeToSessions
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

let unsubscribeSessions: (() => void) | null = null

export const useGameSessionStore = defineStore('game-session', () => {
  const sessions = ref<GameSession[]>([])
  const userProfile = ref<UserProfile | null>(null)
  const activePlayerSession = ref<{ sessionId: string; playerId: string } | null>(null)
  const isLoading = ref(true) // Начинаем с true, так как данные загружаются при инициализации

  // Загрузка данных при инициализации
  async function loadData() {
    isLoading.value = true
    try {
      // Загружаем профиль из localStorage (fallback) или создаем новый
      const profileId = localStorage.getItem('quiz-app-user-id')
      if (profileId) {
        try {
          // Пытаемся загрузить из Supabase
          const profile = await getUserProfile(profileId)
          if (profile) {
            userProfile.value = profile
            // Сохраняем полный профиль в localStorage для быстрого доступа
            localStorage.setItem('quiz-app-user-profile', JSON.stringify(profile))
          }
        } catch (error) {
          console.error('Error loading profile from Supabase:', error)
        }
        
        // Fallback: загружаем из localStorage, если не удалось загрузить из Supabase
        if (!userProfile.value) {
          const storedProfile = localStorage.getItem('quiz-app-user-profile')
          if (storedProfile) {
            try {
              userProfile.value = JSON.parse(storedProfile)
            } catch (e) {
              console.error('Error parsing stored profile:', e)
            }
          }
        }
      }

      // Загружаем активную сессию игрока из localStorage
      const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
      if (storedActiveSession) {
        try {
          activePlayerSession.value = JSON.parse(storedActiveSession)
        } catch (e) {
          console.error('Error parsing stored active player session:', e)
          localStorage.removeItem('quiz-app-active-player-session')
        }
      }

      // Загружаем все сессии
      sessions.value = await getAllSessions()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      isLoading.value = false
    }
  }

  // Инициализация при монтировании store
  if (typeof window !== 'undefined') {
    loadData()

    // Подписываемся на изменения сессий через WebSocket real-time
    unsubscribeSessions = subscribeToSessions(
      (session) => {
      console.log('📡 WebSocket update received for session:', session.id, {
        playersCount: session.players.length,
        players: session.players.map(p => ({ id: p.id, name: p.name }))
      })
      
      const existingIndex = sessions.value.findIndex(s => s.id === session.id)
      if (existingIndex >= 0) {
        const oldSession = sessions.value[existingIndex]
        const oldPlayersCount = oldSession.players.length
        const newPlayersCount = session.players.length
        
        // Проверяем, не удаляется ли активный игрок через WebSocket
        // Если это так, и игрок был недавно восстановлен, игнорируем обновление
        if (typeof window !== 'undefined' && newPlayersCount < oldPlayersCount) {
          const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
          if (storedActiveSession) {
            try {
              const parsed = JSON.parse(storedActiveSession)
              if (parsed.sessionId === session.id) {
                // Проверяем, есть ли активный игрок в новой версии сессии
                const activePlayerInNewSession = session.players.find(p => p.id === parsed.playerId)
                const activePlayerInOldSession = oldSession.players.find(p => p.id === parsed.playerId)
                
                // Если активный игрок был в старой версии, но отсутствует в новой,
                // и это произошло недавно (возможно, из-за перезагрузки), игнорируем обновление
                if (activePlayerInOldSession && !activePlayerInNewSession) {
                  // Проверяем timestamp - если обновление произошло недавно, игнорируем
                  // Это может быть старое обновление от leaveSession при перезагрузке
                  const updateAge = Date.now() - (session.updatedAt || 0)
                  if (updateAge < 10000) { // Если обновление произошло менее 10 секунд назад
                    console.log('⚠️ WebSocket update would remove active player, ignoring (likely from page reload)')
                    console.log('🔄 Active player will be restored if needed')
                    console.log('📊 Update age:', updateAge, 'ms, session updatedAt:', session.updatedAt)
                    return
                  }
                }
              }
            } catch (error) {
              // Игнорируем ошибки парсинга
            }
          }
        }
        
        // Сохраняем обновленные баллы всех игроков в localStorage
        if (typeof window !== 'undefined') {
          session.players.forEach(player => {
            const scoreKey = `quiz-app-player-score-${session.id}-${player.id}`
            try {
              localStorage.setItem(scoreKey, JSON.stringify({
                score: player.score || 0,
                savedAt: now()
              }))
            } catch (error) {
              console.error('Error saving player score from WebSocket:', error)
            }
          })
        }
        
        // Создаем полностью новый объект для правильной реактивности Vue
        // Важно создать новый объект, чтобы Vue отследил изменения
        // Также создаем новые объекты для каждого игрока, чтобы Vue отследил изменения в score
        const updatedSession: GameSession = {
          id: session.id,
          code: session.code,
          questId: session.questId,
          quest: session.quest,
          hostId: session.hostId,
          hostName: session.hostName,
          hostAvatar: session.hostAvatar,
          state: session.state,
          roundId: session.roundId,
          players: session.players.map(player => ({ ...player })), // Создаем новый объект для каждого игрока
          activeQuestion: session.activeQuestion ? { ...session.activeQuestion } : undefined,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt
        }
        
        // Обновляем сессию через helper функцию для правильной реактивности
        updateSessionInArray(updatedSession)
        
        console.log('✅ Session updated via WebSocket:', {
          sessionId: session.id,
          oldPlayersCount,
          newPlayersCount,
          playersChanged: oldPlayersCount !== newPlayersCount,
          hasActiveQuestion: !!session.activeQuestion,
          activeQuestionId: session.activeQuestion?.questionId,
          newArrayLength: sessions.value.length
        })
      } else {
        // Новая сессия добавлена
        sessions.value = [...sessions.value, {
          ...session,
          players: session.players.map(player => ({ ...player })) // Создаем новый объект для каждого игрока
        }]
        console.log('➕ [Session] New session via WebSocket:', session.id)
      }
    },
      (deletedSessionId) => {
        sessions.value = sessions.value.filter(s => s.id !== deletedSessionId)
        console.log('🗑️ [Session] Removed deleted session from store:', deletedSessionId)
      }
    )

    // Обработка видимости страницы для переподключения WebSocket
    if (typeof document !== 'undefined') {
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          // При возврате на страницу проверяем соединение
          console.log('👁️ Page visible, checking WebSocket connection')
        }
      }
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  }

  async function setUserProfile(profile: { name: string; avatar: string }) {
    const existing = userProfile.value ?? { id: generateId('player'), name: '', avatar: '' }
    const newProfile: UserProfile = {
      ...existing,
      name: profile.name.trim(),
      avatar: profile.avatar
    }
    
    try {
      userProfile.value = await upsertUserProfile(newProfile)
      // Сохраняем в localStorage для быстрого доступа
      localStorage.setItem('quiz-app-user-id', userProfile.value.id)
      localStorage.setItem('quiz-app-user-profile', JSON.stringify(userProfile.value))
    } catch (error) {
      console.error('Error saving user profile:', error)
      // Fallback to localStorage
      localStorage.setItem('quiz-app-user-profile', JSON.stringify(newProfile))
      localStorage.setItem('quiz-app-user-id', newProfile.id)
      userProfile.value = newProfile
    }
    
    return userProfile.value
  }

  function ensureProfile(): UserProfile {
    if (!userProfile.value) {
      throw new Error('User profile is not set')
    }
    return userProfile.value
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

  async function createSession(questId: string, questSnapshot?: Quest) {
    const profile = ensureProfile()
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
    
    try {
      const created = await createSessionInDb(session)
      sessions.value.push(created)
      console.log('🟢 [Lifecycle] Session created:', { id: created.id, code: created.code, questId: created.questId })
      return created
    } catch (error) {
      console.error('Error creating session:', error)
      // Fallback: добавляем в локальный массив
      sessions.value.push(session)
      throw error
    }
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
    const profile = ensureProfile()
    
    // Сначала проверяем локальный кеш
    let session = getSessionByCodeLocal(code)
    
    // Если не найдено локально, запрашиваем из базы
    if (!session) {
      try {
        session = await getSessionByCode(code) // Используем импортированную функцию из supabaseService
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
      setActivePlayer(session.id, existingPlayerId)
      return { session, playerId: existingPlayerId }
    }
    
    // Лимит участников: не более MAX_SESSION_PLAYERS (включая ведущего)
    if (session.players.length >= MAX_SESSION_PLAYERS) {
      throw new Error(`В игре уже максимальное число участников (${MAX_SESSION_PLAYERS}). Попробуйте подключиться к другой игре.`)
    }

    // Проверяем, есть ли игрок с таким же профилем (по ID профиля)
    const existingPlayer = session.players.find(player => player.id === profile.id)
    if (existingPlayer) {
      // Если игрок уже в сессии, обновляем сохраненные баллы в localStorage на случай, если они изменились
      if (typeof window !== 'undefined') {
        const scoreKey = `quiz-app-player-score-${session.id}-${existingPlayer.id}`
        try {
          localStorage.setItem(scoreKey, JSON.stringify({
            score: existingPlayer.score || 0,
            savedAt: now()
          }))
        } catch (error) {
          console.error('Error saving existing player score:', error)
        }
      }
      setActivePlayer(session.id, existingPlayer.id)
      return { session, playerId: existingPlayer.id }
    }
    
    // Проверяем, были ли сохранены баллы для этого участника в этой сессии
    let savedScore = 0
    const playerIdToUse = existingPlayerId || profile.id
    const scoreKey = `quiz-app-player-score-${session.id}-${playerIdToUse}`
    
    if (typeof window !== 'undefined') {
      try {
        const savedScoreData = localStorage.getItem(scoreKey)
        if (savedScoreData) {
          const parsed = JSON.parse(savedScoreData)
          savedScore = parsed.score || 0
          console.log('📊 Restoring saved score for player:', playerIdToUse, 'score:', savedScore)
        }
      } catch (error) {
        console.error('Error loading saved score:', error)
      }
    }
    
    // Создаем нового игрока, используя existingPlayerId если он указан, и восстанавливаем баллы
    const player: Player = {
      id: playerIdToUse,
      name: profile.name,
      avatar: profile.avatar,
      joinedAt: now(),
      status: 'idle',
      score: savedScore
    }
    
    session.players.push(player)
    session.updatedAt = now()
    
    try {
      console.log('💾 Updating session in database:', session.id, 'New player:', player.name)
      const updated = await updateSession(session)
      console.log('✅ Session updated in database, players count:', updated.players.length)
      
      const index = sessions.value.findIndex(s => s.id === session.id)
      if (index >= 0) {
        // Создаем новый объект с новым массивом players для правильной реактивности Vue
        // WebSocket подписка также обновит это, но локальное обновление нужно для немедленного отображения
        const updatedSession: GameSession = {
          ...updated,
          players: [...updated.players]
        }
        // Обновляем сессию через helper функцию для правильной реактивности
        updateSessionInArray(updatedSession)
        console.log('📝 Local session updated, waiting for WebSocket confirmation')
      }
      setActivePlayer(updated.id, player.id)
      return { session: updated, playerId: player.id }
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
      setActivePlayer(session.id, player.id)
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
        setActivePlayer(session.id, parsed.playerId)
        return { session, playerId: parsed.playerId }
      }

      // Игрок не найден, восстанавливаем его
      const profile = ensureProfile()
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
    
    // Сохраняем баллы участника перед удалением
    const leavingPlayer = session.players.find(player => player.id === playerId)
    if (leavingPlayer && typeof window !== 'undefined') {
      const scoreKey = `quiz-app-player-score-${sessionId}-${playerId}`
      try {
        localStorage.setItem(scoreKey, JSON.stringify({
          score: leavingPlayer.score || 0,
          savedAt: now()
        }))
        console.log('💾 Saved player score before leaving:', playerId, 'score:', leavingPlayer.score)
      } catch (error) {
        console.error('Error saving player score:', error)
      }
    }
    
    // Удаляем участника из массива
    const updatedPlayers = session.players.filter(player => player.id !== playerId)
    const updatedSession = {
      ...session,
      players: updatedPlayers,
      updatedAt: now()
    }
    
    if (activePlayerSession.value?.sessionId === sessionId && activePlayerSession.value.playerId === playerId) {
      clearActivePlayer()
    }
    
    // Сначала обновляем локально для немедленного отображения
    updateSessionInArray(updatedSession)
    
    try {
      // Затем обновляем в базе данных
      const updated = await updateSession(updatedSession)
      // Обновляем с данными из базы через helper функцию
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
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
  }

  function resetPlayersStatuses(session: GameSession, status: PlayerStatus = 'idle') {
    session.players.forEach(player => {
      player.status = status
      player.buzzedAt = undefined
    })
  }

  async function openQuestion(
    sessionId: string,
    payload: { roundId: string; categoryId: string; questionId: string }
  ) {
    const session = getSessionById(sessionId)
    if (!session) return
    
    resetPlayersStatuses(session)
    const active: ActiveQuestionState = {
      roundId: payload.roundId,
      categoryId: payload.categoryId,
      questionId: payload.questionId,
      openedAt: now(),
      showAnswer: false,
      timerPaused: false,
      buzzedOrder: [],
      currentResponderId: null,
      responderStartedAt: null
    }
    
    session.activeQuestion = active
    session.state = 'active'
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
  }

  async function closeQuestion(sessionId: string, options?: { byTimeout?: boolean }) {
    const session = getSessionById(sessionId)
    if (!session) return

    const aq = session.activeQuestion
    const byTimeout = options?.byTimeout === true
    // Помечаем вопрос сыгранным. Крестик показываем только если таймер истёк и никто не ответил (byTimeout && !answeredBy).
    if (aq && session.quest?.rounds) {
      const round = session.quest.rounds.find(r => r.id === aq.roundId)
      const category = round?.categories?.find(c => c.id === aq.categoryId)
      const q = category?.questions?.find(q => q.id === aq.questionId)
      if (q) {
        q.played = true
        if (byTimeout && !q.answeredBy) {
          q.timedOut = true
        }
        if (!q.answeredBy) {
          const quizStore = useQuizStore()
          quizStore.markQuestionAsPlayed(session.questId, aq.roundId, aq.categoryId, aq.questionId)
        }
      }
    }

    session.activeQuestion = undefined
    resetPlayersStatuses(session)
    session.updatedAt = now()

    try {
      const updated = await updateSession(session, { includeQuestData: true })
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      updateSessionInArray(session)
    }
  }

  async function revealAnswer(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return
    
    session.activeQuestion.showAnswer = true
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
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

    // Already locked or answered
    if (player.status === 'locked' || player.status === 'buzzed' || session.activeQuestion.buzzedOrder.includes(playerId)) {
      return
    }

    if (!session.activeQuestion.currentResponderId) {
      session.activeQuestion.currentResponderId = playerId
      session.activeQuestion.buzzedOrder.push(playerId)
      session.activeQuestion.timerPaused = true
      session.activeQuestion.responderStartedAt = now()
      player.status = 'buzzed'
      player.buzzedAt = now()
    } else {
      session.activeQuestion.buzzedOrder.push(playerId)
      player.status = 'queued'
      player.buzzedAt = now()
    }
    
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
  }

  async function resolveQuestion(sessionId: string, correct: boolean) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return

    const quizStore = useQuizStore()
    const { roundId, categoryId, questionId } = session.activeQuestion

    if (correct) {
      // Находим игрока, который ответил правильно
      const responderId = session.activeQuestion.currentResponderId
      console.log('🎯 Resolving question as correct, responderId:', responderId)
      
      if (!responderId) {
        console.warn('⚠️ No responder ID found, cannot award points')
      } else {
        const player = session.players.find(p => p.id === responderId)
        if (!player) {
          console.warn('⚠️ Player not found:', responderId, 'Available players:', session.players.map(p => p.id))
        } else {
          console.log('👤 Found player:', { id: player.id, name: player.name, currentScore: player.score })
          
          // Получаем значение вопроса из квеста
          const quest = quizStore.getQuestById(session.questId)
          if (!quest) {
            console.warn('⚠️ Quest not found:', session.questId)
          } else {
            const round = quest.rounds.find(r => r.id === roundId)
            if (!round) {
              console.warn('⚠️ Round not found:', roundId)
            } else {
              const category = round.categories.find(c => c.id === categoryId)
              if (!category) {
                console.warn('⚠️ Category not found:', categoryId)
              } else {
                const question = category.questions.find(q => q.id === questionId)
                if (!question) {
                  console.warn('⚠️ Question not found:', questionId)
                } else {
                  // Добавляем баллы игроку
                  const oldScore = player.score || 0
                  player.score = oldScore + question.value
                  console.log('✅ Player answered correctly:', {
                    playerId: player.id,
                    playerName: player.name,
                    questionValue: question.value,
                    oldScore,
                    newScore: player.score
                  })
                  
                  // Сохраняем обновленные баллы в localStorage
                  if (typeof window !== 'undefined') {
                    const scoreKey = `quiz-app-player-score-${sessionId}-${player.id}`
                    try {
                      localStorage.setItem(scoreKey, JSON.stringify({
                        score: player.score,
                        savedAt: now()
                      }))
                      console.log('💾 Saved updated player score:', player.id, 'score:', player.score)
                    } catch (error) {
                      console.error('Error saving updated player score:', error)
                    }
                  }
                  
                  // Сохраняем информацию о том, кто ответил правильно
                  question.answeredBy = {
                    playerId: player.id,
                    playerName: player.name,
                    playerAvatar: player.avatar
                  }
                  
                  // Убеждаемся, что изменения в массиве игроков видны
                  const playerIndex = session.players.findIndex(p => p.id === responderId)
                  if (playerIndex >= 0) {
                    // Создаем новый массив игроков для реактивности
                    session.players = [
                      ...session.players.slice(0, playerIndex),
                      { ...player },
                      ...session.players.slice(playerIndex + 1)
                    ]
                    console.log('🔄 Updated players array, player score:', session.players[playerIndex].score)
                  }
                }
              }
            }
          }
        }
      }
      
      // Сохраняем информацию о том, кто ответил правильно
      const responder = responderId ? session.players.find(p => p.id === responderId) : null
      quizStore.markQuestionAsPlayed(
        session.questId, 
        roundId, 
        categoryId, 
        questionId,
        responder ? {
          playerId: responder.id,
          playerName: responder.name,
          playerAvatar: responder.avatar
        } : undefined
      )
      
      // Обновляем снепшот квеста в сессии, чтобы на плитках сразу отображалось «кто ответил»
      if (session.quest?.rounds) {
        const round = session.quest.rounds.find(r => r.id === roundId)
        const category = round?.categories?.find(c => c.id === categoryId)
        const q = category?.questions?.find(q => q.id === questionId)
        if (q) {
          q.played = true
          if (responder) {
            q.answeredBy = {
              playerId: responder.id,
              playerName: responder.name,
              playerAvatar: responder.avatar
            }
          }
        }
      }
      
      // Показываем правильный ответ участникам и обновляем сессию
      session.activeQuestion.showAnswer = true
      session.updatedAt = now()
      console.log('💾 Saving session with updated scores and showAnswer:', {
        sessionId: session.id,
        players: session.players.map(p => ({ id: p.id, name: p.name, score: p.score }))
      })
      
      try {
        const updated = await updateSession(session, { includeQuestData: true })
        console.log('✅ Session updated in database, players:', updated.players.map(p => ({ id: p.id, name: p.name, score: p.score })))
        updateSessionInArray(updated)
      } catch (error) {
        console.error('❌ Error updating session:', error)
        updateSessionInArray(session)
      }

      await closeQuestion(sessionId)
      return
    }

    const failedPlayerId = session.activeQuestion.currentResponderId
    if (failedPlayerId) {
      const player = session.players.find(p => p.id === failedPlayerId)
      if (player) {
        player.status = 'locked'
        // За неправильный ответ баллы не отнимаем
      }
    }
    
    // очистить очередь и позволить игрокам нажимать снова
    session.activeQuestion.buzzedOrder = []
    session.activeQuestion.currentResponderId = null
    session.activeQuestion.timerPaused = false

    session.players.forEach(player => {
      if (player.status !== 'locked') {
        player.status = 'idle'
      }
    })
    
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
  }

  async function pauseTimer(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return
    
    session.activeQuestion.timerPaused = true
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      updateSessionInArray(session)
    }
  }

  async function resumeTimer(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion) return
    
    session.activeQuestion.timerPaused = false
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
  }

  async function timeoutResponder(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session || !session.activeQuestion || !session.activeQuestion.currentResponderId) return
    
    const failedPlayerId = session.activeQuestion.currentResponderId
    const player = session.players.find(p => p.id === failedPlayerId)
    
    if (player) {
      // Блокируем игрока для этого вопроса
      player.status = 'locked'
    }
    
    // Очищаем текущего отвечающего, но сохраняем buzzedOrder
    session.activeQuestion.currentResponderId = null
    session.activeQuestion.responderStartedAt = null
    
    // Возобновляем общий таймер вопроса (30 секунд), чтобы он продолжал идти
    session.activeQuestion.timerPaused = false
    
    // Разблокируем других игроков, которые не заблокированы
    session.players.forEach(p => {
      if (p.status !== 'locked' && p.id !== failedPlayerId) {
        p.status = 'idle'
      }
    })
    
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
  }

  async function resetPlayersScores(sessionId: string) {
    const session = getSessionById(sessionId)
    if (!session) {
      console.warn('⚠️ Session not found for resetting scores:', sessionId)
      return
    }
    
    // Сбрасываем баллы всех участников
    session.players.forEach(player => {
      player.score = 0
      console.log('🔄 Reset score for player:', player.id, player.name)
    })
    
    // Очищаем сохраненные баллы в localStorage
    if (typeof window !== 'undefined') {
      session.players.forEach(player => {
        const scoreKey = `quiz-app-player-score-${sessionId}-${player.id}`
        try {
          localStorage.removeItem(scoreKey)
          console.log('🗑️ Removed saved score from localStorage:', scoreKey)
        } catch (error) {
          console.error('Error removing saved score from localStorage:', error)
        }
      })
    }
    
    session.updatedAt = now()
    
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
      console.log('✅ Players scores reset successfully')
    } catch (error) {
      console.error('Error updating session after resetting scores:', error)
      // Fallback: обновляем локально
      updateSessionInArray(session)
    }
  }

  async function setPlayerScore(sessionId: string, playerId: string, newScore: number) {
    const session = getSessionById(sessionId)
    if (!session) return
    const player = session.players.find(p => p.id === playerId)
    if (!player) return
    const score = Math.max(0, Math.round(newScore))
    player.score = score
    if (typeof window !== 'undefined') {
      const scoreKey = `quiz-app-player-score-${sessionId}-${player.id}`
      try {
        localStorage.setItem(scoreKey, JSON.stringify({ score, savedAt: now() }))
      } catch (e) {
        console.error('Error saving player score to localStorage:', e)
      }
    }
    session.updatedAt = now()
    try {
      const updated = await updateSession(session)
      updateSessionInArray(updated)
    } catch (error) {
      console.error('Error updating session after setPlayerScore:', error)
      updateSessionInArray(session)
    }
  }

  function setActivePlayer(sessionId: string, playerId: string) {
    activePlayerSession.value = { sessionId, playerId }
    // Сохраняем в localStorage для восстановления при обновлении страницы
    localStorage.setItem('quiz-app-active-player-session', JSON.stringify({ sessionId, playerId }))
  }

  function clearActivePlayer() {
    activePlayerSession.value = null
    localStorage.removeItem('quiz-app-active-player-session')
  }

  // Проверяет существование активной сессии и возвращает её, если она существует
  async function checkActivePlayerSession(): Promise<{ session: GameSession; playerId: string } | null> {
    // Если активная сессия не загружена в store, пытаемся загрузить из localStorage
    if (!activePlayerSession.value) {
      console.log('🔍 checkActivePlayerSession: No active player session in store, checking localStorage...')
      const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
      if (storedActiveSession) {
        try {
          const parsed = JSON.parse(storedActiveSession)
          activePlayerSession.value = { sessionId: parsed.sessionId, playerId: parsed.playerId }
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

    const { sessionId, playerId } = activePlayerSession.value
    console.log('🔍 checkActivePlayerSession: Checking session', sessionId, 'for player', playerId)
    
    // Сначала проверяем в локальном кеше
    let session = getSessionById(sessionId)
    
    // Если не найдено локально, пытаемся загрузить из базы
    if (!session) {
      console.log('📡 Session not found locally, fetching from database...')
      try {
        session = await getSessionByIdFromDb(sessionId)
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
      clearActivePlayer()
      return null
    }

    // Проверяем, что игрок все еще в сессии
    const player = session.players.find(p => p.id === playerId)
    if (!player) {
      console.warn('⚠️ Player not found in session, clearing active player session')
      console.log('Available players:', session.players.map(p => ({ id: p.id, name: p.name })))
      clearActivePlayer()
      return null
    }

    console.log('✅ Active session verified:', { sessionId, playerId, playerName: player.name })
    return { session, playerId }
  }

  function getCurrentDevicePlayer(sessionId: string) {
    if (activePlayerSession.value?.sessionId === sessionId) {
      return activePlayerSession.value.playerId
    }
    return null
  }

  // Проверяет, является ли пользователь хостом какой-либо сессии
  function checkActiveHostSession(): { session: GameSession; isHost: true } | null {
    if (!userProfile.value) return null
    
    // Проверяем все сессии в store
    const hostSession = sessions.value.find(session => session.hostId === userProfile.value!.id)
    
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

  const sessionList = computed(() => sessions.value)

  return {
    userProfile,
    sessions: sessionList,
    activePlayerSession,
    isLoading,
    loadData,
    setUserProfile,
    ensureProfile,
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
    syncSessionQuestSnapshot,
    buzz,
    resolveQuestion,
    pauseTimer,
    resumeTimer,
    timeoutResponder,
    resetPlayersScores,
    setPlayerScore,
    setActivePlayer,
    clearActivePlayer,
    checkActivePlayerSession,
    checkActiveHostSession,
    checkActiveSession,
    getCurrentDevicePlayer
  }
})
