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
      path: '/host/session/:sessionId/quest/:questId',
      name: 'host-session-root',
      component: QuestView,
      props: route => ({ sessionId: route.params.sessionId, questId: route.params.questId, roundId: route.params.roundId })
    },
    {
      path: '/host/session/:sessionId/quest/:questId/round/:roundId',
      name: 'host-session',
      component: QuestView,
      props: route => ({ sessionId: route.params.sessionId, questId: route.params.questId, roundId: route.params.roundId })
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

  // Если переходим на главную страницу, проверяем активную сессию
  if (to.name === 'landing') {
    // Проверяем, есть ли активная сессия в localStorage
    const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
    if (storedActiveSession) {
      try {
        // Ждем загрузки store, если он еще загружается
        if (sessionStore.isLoading) {
          // Ждем максимум 2 секунды
          let attempts = 0
          const maxAttempts = 20
          while (sessionStore.isLoading && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100))
            attempts++
          }
        }
        
        // Проверяем активную сессию
        const activeSession = await sessionStore.checkActivePlayerSession()
        if (activeSession) {
          // Редиректим на страницу игрока
          next({ 
            name: 'player-session', 
            params: { sessionId: activeSession.session.id } 
          })
          return
        }
      } catch (error) {
        console.error('Error checking active session:', error)
      }
    }
  }
  
  next()
})

export default router

