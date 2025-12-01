import { createRouter, createWebHistory } from 'vue-router'
import { useGameSessionStore } from '@/store/gameSessionStore'
import LandingView from '@/views/LandingView.vue'
import QuestsList from '@/views/QuestsList.vue'
import QuestView from '@/views/QuestView.vue'
import PlayerSessionView from '@/views/PlayerSessionView.vue'
import HostSetupView from '@/views/HostSetupView.vue'
import AdminQuestView from '@/views/AdminQuestView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: LandingView
    },
    {
      path: '/quests',
      name: 'quests-list',
      component: QuestsList
    },
    {
      path: '/quest/:questId',
      name: 'quest-root',
      component: QuestView,
      props: route => ({ questId: route.params.questId, roundId: route.params.roundId, sessionId: route.params.sessionId })
    },
    {
      path: '/quest/:questId/round/:roundId',
      name: 'quest',
      component: QuestView,
      props: route => ({ questId: route.params.questId, roundId: route.params.roundId, sessionId: route.params.sessionId })
    },
    {
      path: '/host/setup',
      name: 'host-setup',
      component: HostSetupView
    },
    {
      path: '/host/session/:sessionCode',
      name: 'host-session-root',
      component: QuestView,
      props: route => ({ sessionCode: route.params.sessionCode, questId: route.query.questId as string | undefined, roundId: route.params.roundId })
    },
    {
      path: '/host/session/:sessionCode/round/:roundId',
      name: 'host-session',
      component: QuestView,
      props: route => ({ sessionCode: route.params.sessionCode, questId: route.query.questId as string | undefined, roundId: route.params.roundId })
    },
    {
      path: '/session/:sessionId/player',
      name: 'player-session',
      component: PlayerSessionView,
      props: true
    },
    {
      path: '/admin/quest/:questId',
      name: 'admin-quest',
      component: AdminQuestView,
      props: true
    }
  ]
})

// Router guard для проверки активной сессии при загрузке
router.beforeEach(async (to, from, next) => {
  const sessionStore = useGameSessionStore()
  
  // Ждем загрузки store, если он еще загружается
  if (sessionStore.isLoading) {
    let attempts = 0
    const maxAttempts = 30
    while (sessionStore.isLoading && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
  }
  
  // Проверяем активную сессию (хоста или игрока) для всех маршрутов
  const activeSession = await sessionStore.checkActiveSession()
  
  // Список маршрутов, где уже есть активная сессия
  const activeSessionRoutes = ['host-session', 'host-session-root', 'player-session']
  
  // Если мы переходим на страницу с активной сессией
  if (activeSessionRoutes.includes(to.name as string)) {
    // Если есть активная сессия, проверяем, что мы переходим на правильную страницу
    if (activeSession) {
      if (activeSession.role === 'host') {
        // Проверяем, что мы на правильной странице хоста
        if (to.name === 'host-session' || to.name === 'host-session-root') {
          const sessionCode = to.params.sessionCode as string
          if (sessionCode === activeSession.session.code) {
            // Мы на правильной странице, пропускаем
            next()
            return
          }
        }
        // Редиректим на правильную страницу хоста
        const roundId = activeSession.session.roundId
        if (roundId) {
          next({
            name: 'host-session',
            params: { sessionCode: activeSession.session.code, roundId },
            query: { questId: activeSession.session.questId }
          })
        } else {
          next({
            name: 'host-session-root',
            params: { sessionCode: activeSession.session.code },
            query: { questId: activeSession.session.questId }
          })
        }
        return
      } else if (activeSession.role === 'player') {
        // Проверяем, что мы на правильной странице игрока
        if (to.name === 'player-session') {
          const sessionId = to.params.sessionId as string
          if (sessionId === activeSession.session.id) {
            // Мы на правильной странице, продолжаем проверку существования сессии ниже
            // (не делаем return, чтобы выполнилась проверка существования сессии)
          } else {
            // Редиректим на правильную страницу игрока
            next({
              name: 'player-session',
              params: { sessionId: activeSession.session.id }
            })
            return
          }
        } else {
          // Редиректим на страницу игрока
          next({
            name: 'player-session',
            params: { sessionId: activeSession.session.id }
          })
          return
        }
      }
    }
    // Если активной сессии нет, но мы на странице с сессией, продолжаем проверку ниже
  } else if (activeSession) {
    // Если есть активная сессия, но мы не на странице с сессией, редиректим
    if (activeSession.role === 'host') {
      // Редиректим на страницу хоста
      const roundId = activeSession.session.roundId
      if (roundId) {
        next({
          name: 'host-session',
          params: { sessionCode: activeSession.session.code, roundId },
          query: { questId: activeSession.session.questId }
        })
      } else {
        next({
          name: 'host-session-root',
          params: { sessionCode: activeSession.session.code },
          query: { questId: activeSession.session.questId }
        })
      }
      return
    } else if (activeSession.role === 'player') {
      // Редиректим на страницу игрока
      next({
        name: 'player-session',
        params: { sessionId: activeSession.session.id }
      })
      return
    }
  }
  
  // Если переходим на страницу игрока, проверяем существование сессии
  if (to.name === 'player-session') {
    const sessionId = to.params.sessionId as string
    
    // Ждем загрузки store, если он еще загружается
    if (sessionStore.isLoading) {
      let attempts = 0
      const maxAttempts = 30
      while (sessionStore.isLoading && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
    }
    
    // Сначала проверяем в локальном кеше
    let session = sessionStore.getSessionById(sessionId)
    
    // Если не найдено локально, пытаемся загрузить из базы
    if (!session) {
      console.log('📡 Session not found locally, checking database...')
      try {
        const { getSessionById: getSessionByIdFromDb } = await import('@/services/supabaseService')
        const dbSession = await getSessionByIdFromDb(sessionId)
        if (dbSession) {
          console.log('✅ Session exists in database, adding to store and allowing navigation')
          // Сессия будет добавлена в store автоматически через checkActivePlayerSession
          // или через WebSocket подписку, поэтому просто пропускаем навигацию
          // Пропускаем навигацию, даже если нет активной сессии в localStorage
          // Компонент сам разберется с восстановлением игрока
          next()
          return
        }
      } catch (error) {
        console.error('❌ Error checking session in database:', error)
      }
    } else {
      console.log('✅ Session found in local cache, allowing navigation')
      // Сессия существует, пропускаем
      next()
      return
    }
    
    // Если сессия не найдена ни локально, ни в базе, проверяем активную сессию
    const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
    if (storedActiveSession) {
      try {
        const parsed = JSON.parse(storedActiveSession)
        if (parsed.sessionId === sessionId) {
          // Есть активная сессия, но сессия не найдена - возможно, она еще загружается
          // Даем время на загрузку
          console.log('⏳ Active session found, waiting for session to load...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Проверяем еще раз
          session = sessionStore.getSessionById(sessionId)
          if (!session) {
            try {
              const { getSessionById: getSessionByIdFromDb } = await import('@/services/supabaseService')
              session = await getSessionByIdFromDb(sessionId)
            } catch (error) {
              console.error('❌ Error fetching session on retry:', error)
            }
          }
          
          if (session) {
            console.log('✅ Session loaded after retry, allowing navigation')
            next()
            return
          }
        }
      } catch (error) {
        console.error('❌ Error parsing active session:', error)
      }
    }
    
    // Если сессия не найдена нигде, редиректим на главную
    console.warn('⚠️ Session not found, redirecting to landing')
    next({ name: 'landing' })
    return
  }
  
  // Если дошли сюда, значит активной сессии нет или мы уже на правильной странице
  next()
})

export default router

