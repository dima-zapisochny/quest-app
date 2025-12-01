<template>
  <div v-if="session && quest" class="player-view">
    <header class="player-topbar">
      <div class="player-topbar-left">
        <button class="exit-button" @click="handleExit">Выйти</button>
      </div>
      <div class="topbar-actions">
        <div v-if="player" class="player-user-pill">
          <span class="player-user-name">{{ player.name }}</span>
          <div class="player-user-avatar" :class="{ 'player-user-avatar--placeholder': !player.avatar }" aria-hidden="true">
            <span>{{ avatarEmoji(player.avatar || 'fox') }}</span>
          </div>
        </div>
      </div>
    </header>

    <main class="player-main">
      <section v-if="player" class="player-stats">
        <div class="stats-item">
          <div class="stats-row">
            <div class="stats-col">
              <span class="stats-label">Место</span>
              <span class="stats-value">{{ playerRank }}</span>
            </div>
            <div class="stats-col">
              <span class="stats-label">Очки</span>
              <span class="stats-value">{{ player.score ?? 0 }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="question-panel">
        <p v-if="!activeQuestion" class="question-placeholder">
          Ожидаем, когда ведущий откроет вопрос…
        </p>
        <div v-else class="question-content">
          <h2>{{ currentQuestion?.question ?? 'Вопрос скрыт' }}</h2>
          <div v-if="currentQuestionMedia.length" class="media-grid">
            <QuestionMediaPreview
              v-for="media in currentQuestionMedia"
              :key="media.id"
              :media="media"
            />
          </div>
          <div class="responder-container" :class="{ 'responder-container--hidden': !currentResponder }">
            <div v-if="currentResponder" class="responder-info">
              <div class="responder-avatar">
                <span>{{ avatarEmoji(currentResponder.avatar || 'fox') }}</span>
              </div>
              <div class="responder-details">
                <span class="responder-name">{{ currentResponder.name }}</span>
                <span class="responder-label">отвечает</span>
              </div>
            </div>
            <div v-if="currentResponder" class="responder-timer">
              <TimerCircle
                v-if="shouldShowResponderTimer"
                :duration-sec="10"
                :auto-start="true"
                ref="responderTimerRef"
                @finished="handleResponderTimeout"
              />
            </div>
          </div>
          <div v-if="activeQuestion.showAnswer" class="answer-reveal">
            Ответ: <strong>{{ currentQuestion?.answer }}</strong>
          </div>
        </div>
      </section>

      <section class="buzzer-section">
        <button
          class="buzzer-button"
          :class="buzzerClasses"
          type="button"
          :disabled="!canBuzz"
          @click="handleBuzz"
        >
          <span class="button-label">{{ buzzerLabel }}</span>
        </button>
      </section>
    </main>
  </div>
  <div v-else class="player-loading">
    <p>Загрузка сессии…</p>
  </div>

  <!-- Полноэкранный лоадер при выходе из игры -->
  <teleport to="body">
    <div v-if="isExiting" class="quest-loading-wrapper">
      <div class="loading-state">
        <div class="loader"></div>
        <p>Выход из игры...</p>
      </div>
    </div>
  </teleport>

  <!-- Модальное окно подтверждения выхода -->
  <teleport to="body">
    <Transition name="modal">
      <div v-if="showExitConfirm" class="player-modal-backdrop" @click="cancelExit">
        <div class="player-modal player-modal--confirm" role="dialog" aria-modal="true" @click.stop>
          <header class="player-modal__header">
            <h2>Выход из игры</h2>
            <button type="button" class="player-modal__close" @click="cancelExit" aria-label="Закрыть">✕</button>
          </header>
          <div class="player-modal__body">
            <p>Вы уверены, что хотите выйти из игры? Вы будете удалены из списка участников.</p>
          </div>
          <div class="player-modal__actions">
            <button type="button" class="secondary" @click="cancelExit" :disabled="isExiting">Отмена</button>
            <button type="button" class="danger" @click="confirmExit" :disabled="isExiting">
              {{ isExiting ? 'Выход...' : 'Выйти' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QuestionMediaPreview from '@/components/quiz/QuestionMediaPreview.vue'
import TimerCircle from '@/components/quiz/TimerCircle.vue'
import { useGameSessionStore } from '@/store/gameSessionStore'
import { useQuizStore } from '@/store/quizStore'
import type { MediaAsset } from '@/types'

const route = useRoute()
const router = useRouter()
const sessionStore = useGameSessionStore()
const quizStore = useQuizStore()

// Объявляем пропы для совместимости с router props: true
const props = defineProps<{
  sessionId?: string
}>()

const sessionId = (props.sessionId || route.params.sessionId) as string

const session = computed(() => sessionStore.getSessionById(sessionId))
const quest = computed(() => (session.value ? quizStore.getQuestById(session.value.questId) : undefined))
const activeRound = computed(() => {
  if (!session.value?.roundId) return undefined
  return quest.value?.rounds.find(round => round.id === session.value?.roundId)
})
const activeQuestion = computed(() => session.value?.activeQuestion)

const playerId = computed(() => sessionStore.getCurrentDevicePlayer(sessionId))
const player = computed(() => session.value?.players.find(p => p.id === playerId.value))
const showExitConfirm = ref(false)
const isExiting = ref(false)

const currentQuestion = computed(() => {
  if (!activeQuestion.value) return undefined
  return quest.value?.rounds
    .find(round => round.id === activeQuestion.value?.roundId)?.categories
    .find(category => category.id === activeQuestion.value?.categoryId)?.questions
    .find(question => question.id === activeQuestion.value?.questionId)
})

const currentQuestionMedia = computed<MediaAsset[]>(() => currentQuestion.value?.questionMedia ?? [])

const canBuzz = computed(() => {
  if (!player.value || !activeQuestion.value) return false
  if (player.value.status === 'locked') return false
  if (player.value.status === 'buzzed') return false
  if (activeQuestion.value.currentResponderId && activeQuestion.value.currentResponderId !== player.value.id) return false
  return true
})

const buzzerLabel = computed(() => {
  if (!player.value) return 'Подключаемся…'
  switch (player.value.status) {
    case 'buzzed':
      return 'Вы отвечаете!'
    case 'queued':
      return 'Ожидайте своей очереди'
    case 'locked':
      return 'Ответ уже дан'
    default:
      return activeQuestion.value ? 'Ответить' : 'Ждем вопрос'
  }
})

const buzzerClasses = computed(() => {
  if (!player.value) return {}
  return {
    buzzed: player.value.status === 'buzzed',
    queued: player.value.status === 'queued',
    locked: player.value.status === 'locked',
    ready: player.value.status === 'idle' && !!activeQuestion.value
  }
})

const playerRank = computed(() => {
  if (!session.value || !player.value) return '-'
  // Исключаем хоста из списка участников для расчета места
  const participants = session.value.players.filter(p => p.id !== session.value!.hostId)
  const sortedPlayers = [...participants].sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  const rank = sortedPlayers.findIndex(p => p.id === player.value?.id) + 1
  return rank || '-'
})

const currentResponder = computed(() => {
  if (!session.value || !activeQuestion.value?.currentResponderId) return null
  return session.value.players.find(p => p.id === activeQuestion.value?.currentResponderId) ?? null
})

const responderTimerRef = ref<InstanceType<typeof TimerCircle> | null>(null)

const shouldShowResponderTimer = computed(() => {
  return !!currentResponder.value && !!activeQuestion.value?.responderStartedAt && !activeQuestion.value?.showAnswer
})

function handleResponderTimeout() {
  if (!session.value || !activeQuestion.value?.currentResponderId) return
  console.log('⏰ Responder timeout, calling timeoutResponder')
  sessionStore.timeoutResponder(session.value.id)
}

// Отслеживаем изменения currentResponderId для сброса таймера
watch(
  () => activeQuestion.value?.currentResponderId,
  (newResponderId, oldResponderId) => {
    if (newResponderId !== oldResponderId) {
      nextTick(() => {
        if (responderTimerRef.value) {
          responderTimerRef.value.reset()
        }
      })
    }
  }
)

// Отслеживаем изменения responderStartedAt для запуска таймера
watch(
  () => activeQuestion.value?.responderStartedAt,
  (newStartedAt) => {
    if (newStartedAt && shouldShowResponderTimer.value) {
      nextTick(() => {
        if (responderTimerRef.value) {
          responderTimerRef.value.reset()
        }
      })
    }
  }
)

function handleBuzz() {
  if (!player.value || !session.value || !activeQuestion.value) return
  sessionStore.buzz(session.value.id, player.value.id)
}

function handleExit() {
  console.log('🔴 handleExit called, setting showExitConfirm to true')
  showExitConfirm.value = true
  console.log('🔴 showExitConfirm value:', showExitConfirm.value)
}

function cancelExit() {
  showExitConfirm.value = false
  isExiting.value = false
}

async function confirmExit() {
  if (isExiting.value) return // Предотвращаем повторные нажатия
  
  // Закрываем попап и показываем лоадер
  showExitConfirm.value = false
  isExiting.value = true
  
  if (session.value && player.value) {
    try {
      await sessionStore.leaveSession(session.value.id, player.value.id)
      // Очищаем активную сессию игрока, чтобы не редиректило обратно
      sessionStore.clearActivePlayer()
      console.log('✅ Player left session')
    } catch (error) {
      console.error('❌ Error leaving session:', error)
    }
  }
  
  router.push({ name: 'landing' })
}

function avatarEmoji(avatarId?: string) {
  const map: Record<string, string> = {
    fox: '🦊',
    panda: '🐼',
    tiger: '🐯',
    owl: '🦉',
    whale: '🐳',
    parrot: '🦜',
    koala: '🐨',
    dino: '🦕',
    crocodile: '🐊',
    lion: '🦁',
    penguin: '🐧',
    elephant: '🐘',
    seal: '🦭',
    hedgehog: '🦔'
  }
  return map[avatarId || 'fox'] ?? '🦊'
}

// Используем sessionStorage для отслеживания перезагрузки между страницами
// sessionStorage очищается при закрытии вкладки, но сохраняется при перезагрузке
function isPageReloading(): boolean {
  if (typeof window === 'undefined') return false
  
  // Проверяем, есть ли активная сессия - если есть, это перезагрузка
  const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
  if (!storedActiveSession) return false
  
  try {
    const parsed = JSON.parse(storedActiveSession)
    // Если sessionId совпадает с текущим, это перезагрузка
    return parsed.sessionId === sessionId
  } catch {
    return false
  }
}

function handleLeave() {
  // Не удаляем участника при перезагрузке страницы
  // Проверяем это ПЕРВЫМ делом, до любых других проверок
  if (isPageReloading()) {
    console.log('⏸️ Skipping leaveSession - page is reloading (active session found in localStorage)')
    return
  }
  
  // Дополнительная проверка: если есть активная сессия в localStorage с таким же sessionId,
  // это точно перезагрузка, не удаляем игрока
  const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
  if (storedActiveSession) {
    try {
      const parsed = JSON.parse(storedActiveSession)
      if (parsed.sessionId === sessionId) {
        console.log('⏸️ Skipping leaveSession - active session found, this is a reload')
        return
      }
    } catch (error) {
      // Игнорируем ошибки парсинга
    }
  }
  
  // Удаляем участника из сессии при уходе (только если это не перезагрузка)
  if (sessionId && playerId.value) {
    console.log('👋 Leaving session:', sessionId, 'player:', playerId.value)
    // Используем синхронный вызов для надежности при закрытии вкладки
    sessionStore.leaveSession(sessionId, playerId.value).catch(() => {
      // Игнорируем ошибки при закрытии вкладки
    })
  }
}

let handleVisibilityChange: (() => void) | null = null
let handleBeforeUnload: ((event: BeforeUnloadEvent) => void) | null = null

onMounted(async () => {
  console.log('🎮 PlayerSessionView mounted, sessionId:', sessionId)
  
  // Проверяем, есть ли активная сессия - если есть, значит это перезагрузка
  const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
  if (storedActiveSession) {
    try {
      const parsed = JSON.parse(storedActiveSession)
      if (parsed.sessionId === sessionId) {
        console.log('🔄 Page reload detected, player will not be removed')
      }
    } catch (error) {
      // Игнорируем ошибки парсинга
    }
  }
  
  // Ждем загрузки store, если он еще загружается
  if (sessionStore.isLoading) {
    console.log('⏳ Waiting for store to load...')
    let attempts = 0
    const maxAttempts = 30 // Увеличиваем время ожидания
    while (sessionStore.isLoading && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100))
      attempts++
    }
    console.log('✅ Store loaded')
  }
  
  // Если сессия не найдена локально, пытаемся загрузить из базы
  if (!session.value) {
    console.log('📡 Session not found locally, loading from database...')
    try {
      const { getSessionById: getSessionByIdFromDb } = await import('@/services/supabaseService')
      const dbSession = await getSessionByIdFromDb(sessionId)
      if (dbSession) {
        console.log('✅ Session loaded from database')
        // Сессия будет добавлена в store через checkActivePlayerSession
        // Но для немедленного отображения вызываем checkActivePlayerSession
        // Если активная сессия есть в localStorage, она загрузится автоматически
        // Если нет - сессия все равно будет доступна через computed свойство после обновления
      } else {
        // Сессия не найдена в базе - проверяем активную сессию
        console.log('⚠️ Session not found in database, checking active session...')
        const storedActiveSession = localStorage.getItem('quiz-app-active-player-session')
        if (storedActiveSession) {
          try {
            const parsed = JSON.parse(storedActiveSession)
            if (parsed.sessionId === sessionId) {
              // Есть активная сессия, но сессия не найдена - возможно, она была удалена
              // Даем еще одну попытку
              await new Promise(resolve => setTimeout(resolve, 1000))
              const { getSessionById: getSessionByIdFromDb } = await import('@/services/supabaseService')
              const retrySession = await getSessionByIdFromDb(sessionId)
              if (!retrySession) {
                console.warn('⚠️ Session not found after retry, redirecting to landing')
                router.replace('/')
                return
              }
            } else {
              console.warn('⚠️ Session ID mismatch, redirecting to landing')
              router.replace('/')
              return
            }
          } catch (error) {
            console.error('❌ Error parsing active session:', error)
            router.replace('/')
            return
          }
        } else {
          // Нет активной сессии и сессия не найдена - редиректим
          console.warn('⚠️ Session not found and no active session, redirecting to landing')
          router.replace('/')
          return
        }
      }
    } catch (error) {
      console.error('❌ Error loading session from database:', error)
      // При ошибке не редиректим сразу - возможно, это временная проблема сети
      // Компонент покажет состояние загрузки
    }
  }
  
  // Проверяем активную сессию для восстановления игрока (используем уже полученную выше)
  if (storedActiveSession) {
    try {
      const parsed = JSON.parse(storedActiveSession)
      if (parsed.sessionId === sessionId) {
        // Проверяем, что игрок в сессии
        if (!player.value) {
          console.log('👤 Player not found in session, attempting to restore...')
          
          // Проверяем активную сессию
          let activeSession = await sessionStore.checkActivePlayerSession()
          
          // Если игрок не найден в сессии, но есть активная сессия в localStorage,
          // значит игрок был удален при перезагрузке - добавляем его обратно
          if (!activeSession || !activeSession.session.players.find(p => p.id === parsed.playerId)) {
            console.log('🔄 Player was removed from session, restoring player...')
            
            // Используем функцию восстановления игрока
            try {
              console.log('🔄 Starting player restoration...')
              const restored = await sessionStore.restorePlayerToSession(sessionId)
              if (restored) {
                console.log('✅ Player restored to session:', restored.playerId)
                // Ждем, чтобы убедиться, что обновление применилось и WebSocket получил его
                await new Promise(resolve => setTimeout(resolve, 1000))
                
                // Дополнительная проверка - убеждаемся, что игрок действительно в сессии
                const verifySession = sessionStore.getSessionById(sessionId)
                if (verifySession) {
                  const verifyPlayer = verifySession.players.find(p => p.id === restored.playerId)
                  if (verifyPlayer) {
                    console.log('✅ Player verified in session after restoration')
                  } else {
                    console.warn('⚠️ Player not found in session after restoration, retrying...')
                    // Повторная попытка восстановления
                    await new Promise(resolve => setTimeout(resolve, 500))
                    const retryRestored = await sessionStore.restorePlayerToSession(sessionId)
                    if (retryRestored) {
                      console.log('✅ Player restored on retry:', retryRestored.playerId)
                    }
                  }
                }
              } else {
                console.warn('⚠️ Failed to restore player to session')
              }
            } catch (error) {
              console.error('❌ Error restoring player:', error)
            }
          } else {
            console.log('✅ Player found in active session')
          }
        } else {
          console.log('✅ Player already in session')
        }
      }
    } catch (error) {
      console.error('❌ Error checking active session:', error)
    }
  }
  
  console.log('✅ PlayerSessionView initialized successfully')
  
  // Обработка закрытия вкладки/окна
  // Используем visibilitychange для более надежной обработки
  handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // handleLeave сам проверит, не перезагрузка ли это
      handleLeave()
    }
  }
  
  // Обработчик beforeunload - проверяем, не перезагрузка ли это
  handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // handleLeave сам проверит, не перезагрузка ли это через isPageReloading()
    handleLeave()
  }
  
  document.addEventListener('visibilitychange', handleVisibilityChange)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// Отслеживаем удаление сессии (когда хост выходит из игры)
watch(
  () => session.value,
  (newSession, oldSession) => {
    // Если сессия была, но теперь её нет - значит хост вышел из игры
    if (oldSession && !newSession) {
      console.log('⚠️ Session was deleted, redirecting to landing...')
      // Очищаем активную сессию игрока
      sessionStore.clearActivePlayer()
      // Редиректим на страницу входа
      router.replace({ name: 'landing' })
    }
  },
  { immediate: false }
)

onBeforeUnmount(() => {
  // Удаляем обработчики событий
  if (handleVisibilityChange) {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
  if (handleBeforeUnload) {
  window.removeEventListener('beforeunload', handleBeforeUnload)
  }
  
  // Автоматически удаляем участника из сессии при уходе со страницы
  // handleLeave сам проверит, не перезагрузка ли это
  handleLeave()
})
</script>

<style scoped>
.player-view {
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f8fafc;
  padding: 0;
  gap: 0;
  overflow: hidden;
}

.player-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.75rem 1.5rem;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.player-topbar-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}

.topbar-actions {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.exit-button {
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid rgba(148, 163, 184, 0.2);
  color: #f8fafc;
  font-size: 0.95rem;
  padding: 1rem 1.25rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.05em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.exit-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
}

.exit-button:hover {
  transform: translateY(-2px);
  box-shadow: 
    0 6px 16px rgba(239, 68, 68, 0.35),
    0 3px 8px rgba(239, 68, 68, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
  background: rgba(239, 68, 68, 0.3);
}

.session-chip {
  background: rgba(34, 211, 238, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.4);
  padding: 0.6rem 1.25rem;
  border-radius: 9999px;
  font-weight: 600;
  color: #f8fafc;
}

.player-user-pill {
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  padding: 0.45rem 1.1rem;
  border-radius: 9999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, 0.25);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  transform: perspective(1000px) rotateY(-5deg) rotateX(2deg);
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.player-user-pill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
}

.player-user-name {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.player-user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(56, 189, 248, 0.45);
  background: rgba(8, 47, 73, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  color: #e2e8f0;
}

.player-user-avatar--placeholder {
  border-style: dashed;
  color: #bae6fd;
}

.player-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding: 1rem;
  min-height: 0;
  overflow: hidden;
}

.player-stats {
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}


.stats-item {
  width: 100%;
  padding: 1rem 1.5rem;
  background: rgba(15, 23, 42, 0.25);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.stats-row {
  display: flex;
  gap: 2rem;
  justify-content: space-around;
  align-items: center;
}

.stats-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  position: relative;
  z-index: 1;
}

.stats-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 1.5rem;
  pointer-events: none;
  opacity: 0.6;
}

.stats-label {
  font-size: clamp(0.85rem, 2vw, 0.95rem);
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
}

.stats-value {
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: #f8fafc;
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.question-panel {
  flex: 1;
  background: rgba(15, 23, 42, 0.25);
  border-radius: 1.5rem;
  border: 1px solid rgba(148, 163, 184, 0.2);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.75rem;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  min-height: 0;
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.question-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.1) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.05) 100%
  );
  border-radius: 1.5rem;
  pointer-events: none;
  opacity: 0.6;
}

.question-placeholder {
  margin: 0;
  text-align: center;
  color: #94a3b8;
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  position: relative;
  z-index: 1;
}

.question-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.question-content h2 {
  margin: 0;
  text-align: center;
  font-size: clamp(1.2rem, 4vw, 1.75rem);
  line-height: 1.3;
  flex-shrink: 0;
}

.responder-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
  min-height: 72px;
  transition: opacity 0.3s ease;
}

.responder-container--hidden {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
}

.responder-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.75rem 1.25rem;
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.4);
  border-radius: 9999px;
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.25);
}

.responder-timer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.responder-timer :deep(.timer-circle-container) {
  transform: scale(0.6);
}

.responder-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid rgba(34, 197, 94, 0.5);
  background: rgba(8, 47, 73, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  flex-shrink: 0;
}

.responder-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
}

.responder-name {
  font-size: clamp(0.95rem, 2.5vw, 1.1rem);
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.2;
}

.responder-label {
  font-size: clamp(0.75rem, 2vw, 0.85rem);
  color: #94a3b8;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.media-grid {
  margin-top: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1 1 0;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.media-grid :deep(.media-card) {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: transparent;
  border: none;
  padding: 0;
  box-shadow: none;
  min-height: 0;
  align-items: center;
  justify-content: center;
}

.media-grid :deep(.image-wrapper) {
  width: 100%;
  max-height: 100%;
  flex: 1 1 0;
  min-height: 0;
  border: none;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.media-grid :deep(.media-name) {
  display: none;
}

.media-grid :deep(.image-wrapper img) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.answer-reveal {
  margin-top: 0.75rem;
  text-align: center;
  font-size: clamp(1rem, 2.5vw, 1.1rem);
  color: #facc15;
  flex-shrink: 0;
}

.buzzer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.buzzer-button {
  width: min(600px, 100%);
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 9999px;
  padding: 3rem 3.75rem;
  font-size: clamp(2.25rem, 6vw, 2.625rem);
  font-weight: 700;
  cursor: pointer;
  color: #0f172a;
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.4), rgba(251, 191, 36, 0.4));
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.3),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
}

.buzzer-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.2) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.1) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
  z-index: 0;
}

.buzzer-button .button-label {
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.buzzer-button.ready {
  background: linear-gradient(135deg, #facc15, #fbbf24, #f59e0b);
  box-shadow: 
    0 6px 16px rgba(250, 204, 21, 0.4),
    0 3px 8px rgba(250, 204, 21, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.5),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  transform: translateY(-2px);
}

.buzzer-button.buzzed {
  background: linear-gradient(135deg, #22c55e, #bbf7d0);
  box-shadow: 
    0 4px 12px rgba(34, 197, 94, 0.3),
    0 2px 6px rgba(34, 197, 94, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.buzzer-button.queued {
  background: linear-gradient(135deg, #f97316, #fb923c);
  box-shadow: 
    0 4px 12px rgba(249, 115, 22, 0.3),
    0 2px 6px rgba(249, 115, 22, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.4),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  transform: translateY(-1px);
}

.buzzer-button.locked,
.buzzer-button:disabled {
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(251, 191, 36, 0.15));
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.25),
    0 2px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.buzzer-button:not(:disabled):active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 
    0 2px 6px rgba(0, 0, 0, 0.25),
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 3px 6px rgba(0, 0, 0, 0.3),
    inset 0 -1px 2px rgba(255, 255, 255, 0.2);
  transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s ease;
}

.buzzer-hint {
  margin: 0;
  color: #94a3b8;
  font-size: 0.95rem;
}

.player-loading {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0f172a;
  color: #94a3b8;
  font-size: 1.1rem;
}

.quest-loading-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  z-index: 10000;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  text-align: center;
}

.loader {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.2), rgba(56, 189, 248, 0.15));
  border: 3px solid rgba(56, 189, 248, 0.3);
  position: relative;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 
    0 0 0 0 rgba(34, 211, 238, 0.4),
    0 8px 24px rgba(15, 23, 42, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
}

.loader::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: #22d3ee;
  border-right-color: #38bdf8;
  animation: spin 1s linear infinite;
}

.loader::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(34, 211, 238, 0.6), transparent);
  animation: pulse-inner 1.5s ease-in-out infinite;
}

@keyframes spin {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 
      0 0 0 0 rgba(34, 211, 238, 0.4),
      0 8px 24px rgba(15, 23, 42, 0.3),
      inset 0 2px 4px rgba(255, 255, 255, 0.1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 
      0 0 0 8px rgba(34, 211, 238, 0),
      0 12px 32px rgba(15, 23, 42, 0.4),
      inset 0 2px 4px rgba(255, 255, 255, 0.15);
  }
}

@keyframes pulse-inner {
  0%, 100% {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(1);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.2);
  }
}

.loading-state p {
  color: rgba(226, 232, 240, 0.9);
  font-size: 1.05rem;
  margin: 0;
}

.player-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 9999;
}

.player-modal {
  width: min(480px, 100%);
  border-radius: 20px;
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid rgba(56, 189, 248, 0.28);
  box-shadow: 0 30px 60px rgba(8, 47, 73, 0.45);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.6rem;
}

.player-modal--confirm {
  max-width: 500px;
  padding: 1.9rem;
  gap: 1.5rem;
}

.player-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.player-modal__header h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #22d3ee;
}

.player-modal__close {
  background: rgba(15, 118, 110, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #bae6fd;
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  line-height: 1;
}

.player-modal__close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 211, 238, 0.3);
}

.player-modal__body {
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.6;
}

.player-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.player-modal__actions .secondary,
.player-modal__actions .danger {
  min-width: 140px;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
}

.player-modal__actions .secondary {
  background: rgba(15, 118, 110, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #bae6fd;
}

.player-modal__actions .secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(34, 211, 238, 0.22);
}

.player-modal__actions .danger {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}

.player-modal__actions .danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.3);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (min-width: 1024px) {
  .player-topbar {
    max-width: 768px;
    margin: 0 auto;
    width: 100%;
  }

  .player-main {
    max-width: 768px;
    margin: 0 auto;
    width: 100%;
  }

  .player-stats {
    max-width: 100%;
  }

  .question-panel {
    max-width: 100%;
  }

  .buzzer-section {
    max-width: 100%;
  }
}

/* Планшеты (768px - 1024px) */
@media (max-width: 1024px) and (min-width: 769px) {
  .player-topbar {
    padding: 0.75rem 1.25rem;
  }

  .player-main {
    padding: 1.25rem;
    gap: 1.25rem;
  }

  .player-stats {
    padding: 1.25rem;
  }

  .question-panel {
    padding: 1.75rem;
  }

  .buzzer-button {
    padding: 2.625rem 3.75rem;
    font-size: 1.65rem;
  }
}

/* Мобильные устройства (до 768px) */
@media (max-width: 768px) {
  .player-view {
    padding: 0;
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  .player-topbar {
    padding: 0.6rem 0.875rem;
    gap: 0.625rem;
    flex-shrink: 0;
  }

  .player-topbar-left {
    gap: 0.4rem;
  }

  .exit-button {
    padding: 0.7rem 0.9rem;
    font-size: 0.8rem;
  }

  .player-user-pill {
    gap: 0.4rem;
    padding: 0.35rem 0.75rem;
  }

  .player-user-name {
    font-size: 0.8rem;
  }

  .player-user-avatar {
    width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }

  .player-main {
    padding: 0.625rem;
    gap: 0.625rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .player-stats {
    padding: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .stats-item {
    padding: 0.625rem;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
  }

  .stats-row {
    gap: 0.75rem;
  }

  .responder-container {
    gap: 0.75rem;
    min-height: 60px;
  }

  .responder-info {
    padding: 0.5rem 0.875rem;
    gap: 0.5rem;
  }

  .responder-timer :deep(.timer-circle-container) {
    transform: scale(0.5);
  }

  .responder-avatar {
    width: 32px;
    height: 32px;
    font-size: 1.1rem;
  }

  .responder-name {
    font-size: clamp(0.85rem, 2.5vw, 0.95rem);
  }

  .responder-label {
    font-size: clamp(0.7rem, 2vw, 0.75rem);
  }

  .stats-label {
    font-size: 0.75rem;
  }

  .stats-value {
    font-size: 1.15rem;
  }

  .question-panel {
    padding: 0.875rem;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .question-content {
    gap: 1rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .question-content h2 {
    font-size: clamp(1rem, 4vw, 1.3rem);
    line-height: 1.35;
    flex-shrink: 0;
  }

  .media-grid {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
  }

  .responder-container {
    gap: 0.75rem;
    min-height: 64px;
  }

  .responder-info {
    padding: 0.6rem 1rem;
    gap: 0.6rem;
  }

  .responder-timer :deep(.timer-circle-container) {
    transform: scale(0.55);
  }

  .responder-avatar {
    width: 36px;
    height: 36px;
    font-size: 1.2rem;
  }

  .responder-name {
    font-size: clamp(0.9rem, 2.5vw, 1rem);
  }

  .responder-label {
    font-size: clamp(0.7rem, 2vw, 0.8rem);
  }

  .answer-reveal {
    font-size: clamp(0.9rem, 3vw, 1.1rem);
    padding: 0.75rem;
    flex-shrink: 0;
  }

  .media-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.625rem;
    flex-shrink: 0;
    max-height: 400px;
    overflow-y: auto;
  }

  .buzzer-section {
    padding: 0.625rem;
    flex-shrink: 0;
  }

  .buzzer-button {
    padding: 1.875rem 2.625rem;
    font-size: 1.425rem;
    min-height: 97.5px;
    width: 100%;
  }

  .button-label {
    font-size: 0.95rem;
  }

  .buzzer-hint {
    font-size: 0.8rem;
    margin-top: 0.375rem;
  }

  .player-modal {
    width: calc(100% - 1.5rem);
    margin: 0.75rem;
    padding: 1.2rem;
  }
}

/* Маленькие мобильные (до 480px) */
@media (max-width: 480px) {
  .player-view {
    height: 100vh;
    max-height: 100vh;
    overflow: hidden;
  }

  .player-topbar {
    padding: 0.5rem 0.75rem;
    flex-shrink: 0;
  }

  .exit-button {
    padding: 0.6rem 0.875rem;
    font-size: 0.75rem;
  }

  .player-user-pill {
    padding: 0.3rem 0.65rem;
    gap: 0.4rem;
  }

  .player-user-name {
    font-size: 0.75rem;
  }

  .player-user-avatar {
    width: 24px;
    height: 24px;
    font-size: 0.8rem;
  }

  .player-main {
    padding: 0.5rem;
    gap: 0.5rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .player-stats {
    padding: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .stats-item {
    padding: 0.5rem;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
  }

  .stats-row {
    gap: 0.5rem;
  }

  .responder-info {
    padding: 0.45rem 0.75rem;
    gap: 0.45rem;
  }

  .responder-avatar {
    width: 28px;
    height: 28px;
    font-size: 1rem;
  }

  .responder-name {
    font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  }

  .responder-label {
    font-size: clamp(0.65rem, 2vw, 0.7rem);
  }

  .stats-label {
    font-size: 0.7rem;
  }

  .stats-value {
    font-size: 1rem;
  }

  .question-panel {
    padding: 0.75rem;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .question-content {
    gap: 0.75rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .question-content h2 {
    font-size: clamp(0.9rem, 4vw, 1.1rem);
    line-height: 1.3;
    flex-shrink: 0;
  }

  .media-grid {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
  }

  .responder-container {
    gap: 0.5rem;
    min-height: 52px;
  }

  .responder-info {
    padding: 0.45rem 0.75rem;
    gap: 0.45rem;
  }

  .responder-avatar {
    width: 28px;
    height: 28px;
    font-size: 1rem;
  }

  .responder-name {
    font-size: clamp(0.8rem, 2.5vw, 0.9rem);
  }

  .responder-label {
    font-size: clamp(0.65rem, 2vw, 0.7rem);
  }

  .media-grid {
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 0.4rem;
    flex-shrink: 0;
    max-height: 220px;
    overflow-y: auto;
  }

  .answer-reveal {
    font-size: clamp(0.8rem, 3vw, 1rem);
    padding: 0.5rem;
    flex-shrink: 0;
  }

  .buzzer-section {
    padding: 0.5rem;
    flex-shrink: 0;
  }

  .buzzer-button {
    padding: 1.5rem 2.25rem;
    font-size: 1.35rem;
    min-height: 90px;
    width: 100%;
  }

  .button-label {
    font-size: 0.9rem;
  }

  .buzzer-hint {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }

  .player-modal {
    padding: 1rem;
  }
}

/* Очень маленькие экраны (до 360px) */
@media (max-width: 360px) {
  .player-topbar {
    padding: 0.4rem 0.5rem;
  }

  .exit-button {
    padding: 0.5rem 0.75rem;
    font-size: 0.7rem;
  }

  .player-user-pill {
    padding: 0.25rem 0.5rem;
  }

  .player-user-name {
    font-size: 0.7rem;
  }

  .player-user-avatar {
    width: 20px;
    height: 20px;
    font-size: 0.75rem;
  }

  .player-main {
    padding: 0.375rem;
    gap: 0.375rem;
  }

  .player-stats {
    padding: 0;
    box-sizing: border-box;
  }

  .stats-item {
    padding: 0.375rem;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
  }

  .stats-label {
    font-size: 0.65rem;
  }

  .stats-value {
    font-size: 0.85rem;
  }

  .question-panel {
    padding: 0.5rem;
  }

  .question-content {
    gap: 0.5rem;
    overflow: hidden;
  }

  .media-grid {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
  }

  .stats-row {
    gap: 0.4rem;
  }

  .responder-container {
    gap: 0.4rem;
    min-height: 48px;
  }

  .responder-info {
    padding: 0.35rem 0.55rem;
    gap: 0.35rem;
  }

  .responder-timer :deep(.timer-circle-container) {
    transform: scale(0.4);
  }

  .responder-avatar {
    width: 20px;
    height: 20px;
    font-size: 0.8rem;
  }

  .responder-name {
    font-size: clamp(0.7rem, 2.5vw, 0.8rem);
  }

  .responder-label {
    font-size: clamp(0.55rem, 2vw, 0.6rem);
  }

  .question-content h2 {
    font-size: clamp(0.8rem, 4vw, 0.95rem);
    line-height: 1.3;
  }

  .question-placeholder {
    font-size: clamp(0.8rem, 3vw, 0.9rem);
  }

  .answer-reveal {
    font-size: clamp(0.75rem, 2.8vw, 0.9rem);
    padding: 0.4rem;
  }

  .media-grid {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
    gap: 0.3rem;
  }

  .buzzer-button {
    padding: 1.3125rem 1.875rem;
    font-size: 1.2rem;
    min-height: 75px;
  }

  .button-label {
    font-size: 0.8rem;
  }

  .buzzer-hint {
    font-size: 0.7rem;
  }
}

/* Экстремально маленькие экраны (до 320px) */
@media (max-width: 320px) {
  .player-topbar {
    padding: 0.35rem 0.4rem;
  }

  .exit-button {
    padding: 0.45rem 0.65rem;
    font-size: 0.65rem;
  }

  .player-user-pill {
    padding: 0.2rem 0.4rem;
  }

  .player-user-name {
    font-size: 0.65rem;
  }

  .player-user-avatar {
    width: 18px;
    height: 18px;
    font-size: 0.7rem;
  }

  .player-main {
    padding: 0.3rem;
    gap: 0.3rem;
  }

  .player-stats {
    padding: 0;
    box-sizing: border-box;
  }

  .stats-item {
    padding: 0.3rem;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
  }

  .stats-label {
    font-size: 0.6rem;
  }

  .stats-value {
    font-size: 0.8rem;
  }

  .question-panel {
    padding: 0.4rem;
  }

  .stats-row {
    gap: 0.3rem;
  }

  .responder-container {
    gap: 0.35rem;
    min-height: 44px;
  }

  .responder-info {
    padding: 0.3rem 0.5rem;
    gap: 0.3rem;
  }

  .responder-timer :deep(.timer-circle-container) {
    transform: scale(0.35);
  }

  .responder-avatar {
    width: 18px;
    height: 18px;
    font-size: 0.75rem;
  }

  .responder-name {
    font-size: clamp(0.65rem, 2.5vw, 0.75rem);
  }

  .responder-label {
    font-size: clamp(0.5rem, 2vw, 0.55rem);
  }

  .question-content {
    gap: 0.4rem;
    overflow: hidden;
  }

  .question-content h2 {
    font-size: clamp(0.75rem, 3.8vw, 0.9rem);
  }

  .media-grid {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
  }

  .question-placeholder {
    font-size: clamp(0.75rem, 2.8vw, 0.85rem);
  }

  .answer-reveal {
    font-size: clamp(0.7rem, 2.5vw, 0.85rem);
    padding: 0.35rem;
  }

  .buzzer-button {
    padding: 1.125rem 1.5rem;
    font-size: 1.125rem;
    min-height: 67.5px;
  }

  .button-label {
    font-size: 0.75rem;
  }

  .buzzer-hint {
    font-size: 0.65rem;
  }
}
</style>

