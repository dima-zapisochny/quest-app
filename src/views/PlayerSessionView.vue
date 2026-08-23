<template>
  <div
    v-if="session"
    class="player-view notranslate"
    lang="uk"
    spellcheck="false"
    translate="no"
    autocorrect="off"
    autocapitalize="off"
  >
    <AppHeader
      class="player-view__header notranslate"
      button-variant="exit"
      :button-label="isExiting ? t('game.exitBusy') : t('game.exitConfirm')"
      :button-disabled="isExiting"
      :user-name="player?.name"
      :user-avatar="player?.avatar"
      :show-sound-toggle="false"
      @button-click="handleExit"
    />

    <main class="player-main">
      <section v-if="player" class="player-stats notranslate">
        <div class="stats-item">
          <div class="stats-row">
            <div class="stats-col">
              <span class="stats-label player-ui-text" spellcheck="false" translate="no">{{ t('player.rank') }}</span>
              <span class="stats-value player-ui-text" spellcheck="false" translate="no">{{ playerRank }}</span>
            </div>
            <div class="stats-timer" :class="{ 'stats-timer--inactive': !shouldShowResponderTimer }" :aria-label="t('player.answerTimer')">
              <!-- Лише відображення: таймаут знімає хост (useResponderTimeout). Інакше зсув годинника на телефоні → finished → self-lock за ~1с. -->
              <TimerCircle
                :duration-sec="10"
                :auto-start="shouldShowResponderTimer"
                ref="responderTimerRef"
              />
            </div>
            <div class="stats-col">
              <span class="stats-label player-ui-text" spellcheck="false" translate="no">{{ t('player.points') }}</span>
              <span class="stats-value player-ui-text" spellcheck="false" translate="no">{{ player.score ?? 0 }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="question-panel" :class="{ 'question-panel--waiting': !activeQuestion }">
        <p v-if="!activeQuestion" class="question-placeholder">
          {{ t('player.waitingQuestion') }}
        </p>
        <div v-else-if="!showQuestionContent" class="question-panel-loading" aria-live="polite">
          <div class="question-panel-loading__spinner" aria-hidden="true"></div>
        </div>
        <div v-else class="question-content">
          <template v-if="activeQuestion.showAnswer">
            <h2 class="answer-only" v-html="currentQuestion?.answer ?? '—'"></h2>
            <div v-if="answerMediaImages.length" class="player-media-grid">
              <QuestionMediaPreview
                v-for="media in answerMediaImages"
                :key="media.id"
                :media="media"
              />
            </div>
            <div
              v-else-if="answerMediaAudio.length"
              class="player-media-audio"
            >
              <QuestionMediaPreview
                v-for="media in answerMediaAudio"
                :key="media.id"
                :media="media"
              />
            </div>
          </template>
          <template v-else>
            <h2 v-html="currentQuestion?.question ?? t('player.questionHidden')"></h2>
            <div v-if="visibleQuestionImages.length" class="player-media-grid">
              <QuestionMediaPreview
                v-for="media in visibleQuestionImages"
                :key="media.id"
                :media="media"
              />
            </div>
            <div
              v-else-if="hasQuestionAudio"
              class="player-media-audio"
            >
              <QuestionMediaPreview
                v-for="media in questionMediaAudio"
                :key="media.id"
                :media="media"
              />
            </div>
          </template>
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
    <p>{{ t('player.loadingSession') }}</p>
  </div>

  <!-- Полноэкранный лоадер при выходе из игры -->
  <teleport to="body">
    <div v-if="isExiting" class="quest-loading-wrapper">
      <div class="loading-state">
        <div class="loader"></div>
        <p>{{ t('game.exiting') }}</p>
      </div>
    </div>
  </teleport>

  <!-- Модальное окно подтверждения выхода -->
  <ConfirmDialog
    :show="showExitConfirm"
    :title="t('game.exitTitle')"
    :message="t('player.exitBody')"
    :confirm-label="t('game.exitConfirm')"
    :busy-label="t('game.exitBusy')"
    :busy="isExiting"
    @confirm="confirmExit"
    @cancel="cancelExit"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TimerCircle from '@/components/quiz/TimerCircle.vue'
import QuestionMediaPreview from '@/components/quiz/QuestionMediaPreview.vue'
import { useGameSessionStore } from '@/store/gameSessionStore'
import { useQuizStore } from '@/store/quizStore'
import { useQuestionMedia } from '@/composables/useQuestionMedia'
import { useQuestionElapsed } from '@/composables/useQuestionElapsed'
import { useQuestionContentReady } from '@/composables/useQuestionContentReady'
import AppHeader from '@/components/common/AppHeader.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { usePresenceHeartbeat } from '@/composables/usePresenceHeartbeat'

const { t } = useI18n()

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
const quest = computed(() =>
  session.value ? (session.value.quest ?? quizStore.getQuestById(session.value.questId)) : undefined
)
const activeQuestion = computed(() => session.value?.activeQuestion)

const playerId = computed(() => sessionStore.getCurrentDevicePlayer(sessionId))
const player = computed(() => session.value?.players.find(p => p.id === playerId.value))
const showExitConfirm = ref(false)
const isExiting = ref(false)

const currentQuestion = computed(() => {
  if (!activeQuestion.value) return undefined
  return quest.value?.rounds
    ?.find(round => round.id === activeQuestion.value?.roundId)?.categories
    .find(category => category.id === activeQuestion.value?.categoryId)?.questions
    .find(question => question.id === activeQuestion.value?.questionId)
})

const { elapsedSec } = useQuestionElapsed(activeQuestion)
const {
  questionMediaImages,
  visibleQuestionImages,
  questionMediaAudio,
  answerMediaImages,
  answerMediaAudio,
  hasQuestionAudio
} = useQuestionMedia(currentQuestion, elapsedSec)

const questionRevealKey = computed(() => {
  const aq = activeQuestion.value
  if (!aq) return null
  return `${aq.questionId}:${aq.showAnswer ? 'answer' : 'question'}`
})

const imagesForPreload = computed(() => {
  if (!activeQuestion.value) return []
  return activeQuestion.value.showAnswer ? answerMediaImages.value : questionMediaImages.value
})

const { ready: questionMediaReady } = useQuestionContentReady(questionRevealKey, imagesForPreload)

const showQuestionContent = computed(() => {
  if (!activeQuestion.value) return false
  if (!questionMediaReady.value) return false
  if (activeQuestion.value.showAnswer) {
    return Boolean(currentQuestion.value?.answer || answerMediaImages.value.length || answerMediaAudio.value.length)
  }
  return Boolean(
    currentQuestion.value?.question ||
      questionMediaImages.value.length ||
      hasQuestionAudio.value
  )
})

const canBuzz = computed(() => {
  if (!player.value || !activeQuestion.value) return false
  if (activeQuestion.value.showAnswer) return false
  // Пауза ведучого (немає відповідача) — не buzz; під час чужої відповіді інші можуть в чергу
  if (activeQuestion.value.timerPaused && !activeQuestion.value.currentResponderId) return false
  if (player.value.status === 'locked') return false
  if (player.value.status === 'buzzed') return false
  if (player.value.status === 'queued') return false
  if (activeQuestion.value.buzzedOrder?.includes(player.value.id)) return false
  return true
})

const buzzerLabel = computed(() => {
  if (!player.value) return t('player.connecting')
  switch (player.value.status) {
    case 'buzzed':
      return t('player.yourTurn')
    case 'queued':
      return t('player.waitTurn')
    case 'locked':
      return t('player.answered')
    default:
      return activeQuestion.value ? t('player.buzz') : t('player.waitForQuestion')
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
  const participants = session.value.players.filter(p => p.id !== session.value!.hostId)
  const sortedPlayers = [...participants].sort((a, b) => {
    const byScore = (b.score ?? 0) - (a.score ?? 0)
    if (byScore !== 0) return byScore
    return (a.joinedAt ?? 0) - (b.joinedAt ?? 0)
  })
  const rank = sortedPlayers.findIndex(p => p.id === player.value?.id) + 1
  return rank || '-'
})

const isCurrentResponder = computed(() => {
  if (!player.value || !activeQuestion.value?.currentResponderId) return false
  return activeQuestion.value.currentResponderId === player.value.id
})

const responderTimerRef = ref<InstanceType<typeof TimerCircle> | null>(null)

const shouldShowResponderTimer = computed(() => {
  return isCurrentResponder.value && !!activeQuestion.value?.responderStartedAt && !activeQuestion.value?.showAnswer
})

// Локальний відлік для UI: рестарт коли стаємо відповідачами / знімають право / показують відповідь
watch(
  shouldShowResponderTimer,
  (active, wasActive) => {
    nextTick(() => {
      if (!responderTimerRef.value) return
      if (active && !wasActive) {
        responderTimerRef.value.reset()
      } else if (!active) {
        responderTimerRef.value.reset()
      }
    })
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

// Presence (#5/#10): пока игрок на странице — периодически пингуем «я здесь».
// Уход/закрытие вкладки больше НЕ ловим — heartbeat просто перестаёт идти, и хост
// убирает игрока по TTL (prune_stale_players). Логика вынесена в usePresenceHeartbeat.
const { start: startHeartbeat } = usePresenceHeartbeat(sessionId, playerId)

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
  
  // Подписка на realtime именно этой сессии (#17)
  sessionStore.watchSession(sessionId)

  // Ждём готовности store без busy-wait (#35)
  await sessionStore.whenReady()

  // Realtime може додати сесію без quest_data раніше за GET — підтягуємо знімок квеста
  await sessionStore.ensureSessionQuestLoaded(sessionId)
  
  // Если сессия не найдена локально, пытаемся загрузить из базы
  if (!session.value) {
    console.log('📡 Session not found locally, loading from database...')
    try {
      const { getSessionById: getSessionByIdFromDb } = await import('@/services/supabaseService')
      const dbSession = await getSessionByIdFromDb(sessionId)
      if (dbSession) {
        console.log('✅ Session loaded from database')
        sessionStore.upsertSession(dbSession)
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

  // Запускаем presence-heartbeat (сразу и далее каждые 15с, + при возврате вкладки)
  startHeartbeat()
})

watch(
  () => activeQuestion.value?.questionId,
  async (questionId) => {
    if (!questionId) return
    if (currentQuestion.value?.question) return
    await sessionStore.ensureSessionQuestLoaded(sessionId)
  }
)

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
  // heartbeat/visibility снимает usePresenceHeartbeat автоматически
  sessionStore.unwatchSession()
  // Игрока НЕ удаляем вручную: heartbeat остановится, и хост уберёт его по TTL (#5).
  // Явный выход («Выйти») по-прежнему делает leaveSession в confirmExit.
})
</script>

<style scoped>
.player-view {
  height: 100dvh;
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
  color: rgb(var(--c-text));
  padding: 0;
  margin: 0;
  gap: 0;
  overflow: hidden;
  box-sizing: border-box;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Fallback для старых браузеров */
@supports not (height: 100dvh) {
  .player-view {
    height: 100vh;
    max-height: 100vh;
  }
}

/* «Вийти» — та сама висота й рівень, що капсула з іменем */
.player-view :deep(.app-header) {
  align-items: center;
}

.player-view :deep(.app-header-left) {
  align-items: center;
}

.player-view :deep(.nav-button--exit) {
  height: 72px;
  min-height: 72px;
  min-width: 8.25rem;
  padding: 0 1.85rem;
  font-size: 1.05rem;
}

@media (max-width: 768px) {
  .player-view :deep(.nav-button--exit) {
    height: 60px;
    min-height: 60px;
    min-width: 7.5rem;
    padding: 0 1.5rem;
    font-size: 0.95rem;
  }
}

@media (max-width: 480px) {
  .player-view :deep(.nav-button--exit) {
    height: 56px;
    min-height: 56px;
    min-width: 7rem;
    padding: 0 1.35rem;
    font-size: 0.9rem;
  }
}

@media (max-width: 360px) {
  .player-view :deep(.nav-button--exit) {
    height: 52px;
    min-height: 52px;
    min-width: 6.5rem;
    padding: 0 1.2rem;
    font-size: 0.85rem;
  }
}

.player-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1.15rem;
  padding: 1.25rem 1.5rem 1rem;
  margin: 0;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* Chrome Translate + spellcheck: пунктир під UI-текстом */
.player-view :deep(.user-name),
.player-view :deep(.nav-button),
.player-view :deep(.nav-button span),
.player-view :deep(.timer-text),
.player-view .player-ui-text {
  text-decoration: none !important;
  -webkit-text-decoration: none !important;
  text-decoration-line: none !important;
  -webkit-text-decoration-line: none !important;
  text-decoration-style: solid !important;
  -webkit-text-decoration-style: solid !important;
  text-decoration-color: transparent !important;
  -webkit-text-decoration-color: transparent !important;
  text-underline-offset: unset !important;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

@supports selector(::spelling-error) {
  .player-view :deep(.user-name)::spelling-error,
  .player-view :deep(.nav-button)::spelling-error,
  .player-view .player-ui-text::spelling-error {
    text-decoration: none !important;
  }
}

@supports selector(::grammar-error) {
  .player-view :deep(.user-name)::grammar-error,
  .player-view :deep(.nav-button)::grammar-error,
  .player-view .player-ui-text::grammar-error {
    text-decoration: none !important;
  }
}

.player-stats {
  width: 100%;
  flex-shrink: 0;
  box-sizing: border-box;
}


.stats-item {
  width: 100%;
  padding: 1rem 1.5rem;
  background: rgb(var(--c-bg) / 0.25);
  border-radius: 1.5rem;
  border: 1px solid rgb(var(--c-text-muted) / 0.2);
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    0 2px 6px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.15),
    inset 0 -2px 4px rgb(var(--c-black) / 0.25);
}

.stats-row {
  display: flex;
  gap: 2rem;
  justify-content: space-around;
  align-items: center;
}

.stats-timer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.stats-timer :deep(.timer-circle-container) {
  transform: scale(0.6);
  transition: filter 0.3s ease, opacity 0.3s ease;
}

.stats-timer--inactive :deep(.timer-circle-container) {
  filter: grayscale(1);
  opacity: 0.35;
}

.stats-timer--inactive :deep(.timer-text) {
  color: rgb(var(--c-slate-500));
  text-shadow: none;
}

.stats-timer--inactive :deep(.timer-progress) {
  color: rgb(var(--c-slate-600));
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
    rgb(var(--c-white) / 0.1) 0%,
    transparent 50%,
    rgb(var(--c-white) / 0.05) 100%
  );
  border-radius: 1.5rem;
  pointer-events: none;
  opacity: 0.6;
}

.stats-label {
  font-size: clamp(1rem, 2.5vw, 1.15rem);
  color: rgb(var(--c-text-muted));
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  position: relative;
  z-index: 1;
}

.stats-value {
  font-size: clamp(1.75rem, 5vw, 2.4rem);
  color: rgb(var(--c-text));
  font-weight: 700;
  position: relative;
  z-index: 1;
}

.question-panel {
  flex: 1;
  background: rgb(var(--c-bg) / 0.25);
  border-radius: 1.5rem;
  border: 1px solid rgb(var(--c-text-muted) / 0.2);
  padding: 1.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0.75rem;
  backdrop-filter: blur(12px);
  position: relative;
  overflow: hidden;
  min-height: 0;
  box-sizing: border-box;
  box-shadow: 
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    0 2px 6px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.15),
    inset 0 -2px 4px rgb(var(--c-black) / 0.25);
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
    rgb(var(--c-white) / 0.1) 0%,
    transparent 50%,
    rgb(var(--c-white) / 0.05) 100%
  );
  border-radius: 1.5rem;
  pointer-events: none;
  opacity: 0.6;
}

.question-panel--waiting {
  justify-content: center;
  align-items: center;
}

.question-placeholder {
  margin: 0;
  width: 100%;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: rgb(var(--c-text-muted));
  font-size: clamp(1.45rem, 4.8vw, 1.85rem);
  line-height: 1.45;
  padding: 1.25rem 1rem;
  position: relative;
  z-index: 1;
}

.question-panel-loading {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-panel-loading__spinner {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 3px solid rgb(var(--c-text-muted) / 0.25);
  border-top-color: rgb(var(--c-accent-sky));
  animation: player-question-spin 0.75s linear infinite;
}

@keyframes player-question-spin {
  to { transform: rotate(360deg); }
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
  gap: 0.75rem;
}

.question-content h2 {
  margin: 0;
  text-align: center;
  font-size: clamp(1.85rem, 6vw, 2.6rem);
  line-height: 1.3;
  flex-shrink: 0;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.question-content h2.answer-only {
  color: rgb(var(--c-gold));
  font-weight: 700;
}

.player-media-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  align-content: flex-start;
  width: 100%;
  flex: 0 1 auto;
  min-height: 0;
  max-height: 100%;
  overflow: hidden;
}

.player-media-grid :deep(.media-card) {
  max-width: min(100%, 360px);
  width: auto;
  max-height: 100%;
  min-height: 0;
  padding: 0.35rem;
  gap: 0;
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
}

.player-media-grid :deep(.image-wrapper) {
  width: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.player-media-grid :deep(.image-wrapper img) {
  max-width: 100%;
  max-height: min(42vh, 100%);
  width: auto;
  height: auto;
  object-fit: contain;
  display: block;
}

.player-media-grid :deep(.media-name) {
  display: none;
}

.player-media-audio {
  width: 100%;
  max-width: 320px;
  flex-shrink: 0;
}

.player-media-audio :deep(.media-card) {
  width: 100%;
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
  background: rgb(var(--c-success) / 0.2);
  border: 1px solid rgb(var(--c-success) / 0.4);
  border-radius: 9999px;
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    0 2px 6px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.15),
    inset 0 -2px 4px rgb(var(--c-black) / 0.25);
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
  border: 2px solid rgb(var(--c-success) / 0.5);
  background: rgb(var(--c-sky-deep) / 0.75);
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
  color: rgb(var(--c-text));
  line-height: 1.2;
}

.responder-label {
  font-size: clamp(0.75rem, 2vw, 0.85rem);
  color: rgb(var(--c-text-muted));
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
  color: rgb(var(--c-gold));
  flex-shrink: 0;
}

.buzzer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin: 0.15rem 0 0;
  padding: 0.5rem 0 1.1rem;
  flex-shrink: 0;
  box-sizing: border-box;
}

.buzzer-button {
  width: min(900px, 100%);
  border: 1px solid rgb(var(--c-text-muted) / 0.2);
  border-radius: 9999px;
  padding: 4.5rem 5.625rem;
  font-size: clamp(3.375rem, 9vw, 3.9375rem);
  font-weight: 700;
  cursor: pointer;
  color: rgb(var(--c-bg));
  background: linear-gradient(135deg, rgb(var(--c-gold) / 0.4), rgb(var(--c-amber) / 0.4));
  transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.15s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(12px);
  box-shadow: 
    0 4px 12px rgb(var(--c-bg-deep) / 0.3),
    0 2px 6px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.4),
    inset 0 -2px 4px rgb(var(--c-black) / 0.3);
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
    rgb(var(--c-white) / 0.2) 0%,
    transparent 50%,
    rgb(var(--c-white) / 0.1) 100%
  );
  border-radius: 9999px;
  pointer-events: none;
  opacity: 0.6;
  z-index: 0;
}

.buzzer-button .button-label {
  position: relative;
  z-index: 1;
  font-weight: 600;
  font-size: 1em;
  text-shadow: 0 2px 4px rgb(var(--c-black) / 0.2);
}

.buzzer-button.ready {
  background: linear-gradient(135deg, rgb(var(--c-gold)), rgb(var(--c-amber)), rgb(var(--c-amber-500)));
  box-shadow: 
    0 6px 16px rgb(var(--c-gold) / 0.4),
    0 3px 8px rgb(var(--c-gold) / 0.3),
    inset 0 2px 4px rgb(var(--c-white) / 0.5),
    inset 0 -2px 4px rgb(var(--c-black) / 0.3);
  transform: translateY(-2px);
}

.buzzer-button.buzzed {
  background: linear-gradient(135deg, rgb(var(--c-success)), #bbf7d0);
  box-shadow: 
    0 4px 12px rgb(var(--c-success) / 0.3),
    0 2px 6px rgb(var(--c-success) / 0.25),
    inset 0 2px 4px rgb(var(--c-white) / 0.4),
    inset 0 -2px 4px rgb(var(--c-black) / 0.3);
  transform: translateY(-1px);
}

.buzzer-button.queued {
  background: linear-gradient(135deg, rgb(var(--c-orange-500)), rgb(var(--c-orange)));
  box-shadow: 
    0 4px 12px rgb(var(--c-orange-500) / 0.3),
    0 2px 6px rgb(var(--c-orange-500) / 0.25),
    inset 0 2px 4px rgb(var(--c-white) / 0.4),
    inset 0 -2px 4px rgb(var(--c-black) / 0.3);
  transform: translateY(-1px);
}

.buzzer-button.locked,
.buzzer-button:disabled {
  background: linear-gradient(135deg, rgb(var(--c-gold) / 0.15), rgb(var(--c-amber) / 0.15));
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: 
    0 4px 12px rgb(var(--c-bg-deep) / 0.25),
    0 2px 6px rgb(var(--c-bg-deep) / 0.2),
    inset 0 2px 4px rgb(var(--c-white) / 0.1),
    inset 0 -2px 4px rgb(var(--c-black) / 0.2);
}

.buzzer-button:not(:disabled):active {
  transform: translateY(1px) scale(0.98);
  box-shadow: 
    0 2px 6px rgb(var(--c-black) / 0.25),
    0 1px 3px rgb(var(--c-black) / 0.2),
    inset 0 3px 6px rgb(var(--c-black) / 0.3),
    inset 0 -1px 2px rgb(var(--c-white) / 0.2);
  transition: transform 0.1s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.1s ease;
}

.buzzer-hint {
  margin: 0;
  color: rgb(var(--c-text-muted));
  font-size: 0.95rem;
}

.player-loading {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--c-bg));
  color: rgb(var(--c-text-muted));
}

/* Fallback для старых браузеров */
@supports not (min-height: 100dvh) {
  .player-loading {
    min-height: 100vh;
  }
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
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
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
  background: linear-gradient(135deg, rgb(var(--c-accent) / 0.2), rgb(var(--c-accent-sky) / 0.15));
  border: 3px solid rgb(var(--c-accent-sky) / 0.3);
  position: relative;
  animation: pulse 2s ease-in-out infinite;
  box-shadow: 
    0 0 0 0 rgb(var(--c-accent) / 0.4),
    0 8px 24px rgb(var(--c-bg) / 0.3),
    inset 0 2px 4px rgb(var(--c-white) / 0.1);
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
  border-top-color: rgb(var(--c-accent));
  border-right-color: rgb(var(--c-accent-sky));
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
  background: radial-gradient(circle, rgb(var(--c-accent) / 0.6), transparent);
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
      0 0 0 0 rgb(var(--c-accent) / 0.4),
      0 8px 24px rgb(var(--c-bg) / 0.3),
      inset 0 2px 4px rgb(var(--c-white) / 0.1);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 
      0 0 0 8px rgb(var(--c-accent) / 0),
      0 12px 32px rgb(var(--c-bg) / 0.4),
      inset 0 2px 4px rgb(var(--c-white) / 0.15);
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
  color: rgb(var(--c-text-soft) / 0.9);
  font-size: 1.05rem;
  margin: 0;
}

@media (min-width: 1024px) {

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

  .player-main {
    padding: 1.25rem 1.75rem 1rem;
    gap: 0.75rem;
  }

  .player-stats {
    padding: 1.25rem;
  }

  .question-panel {
    padding: 1.75rem;
  }

  .buzzer-button {
    padding: 3.9375rem 5.625rem;
    font-size: 2.475rem;
    width: min(900px, 100%);
  }
}

/* Мобильные устройства (до 768px) */
@media (max-width: 768px) {
  .player-view {
    padding: 0;
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
  }

  /* Fallback для старых браузеров */
  @supports not (height: 100dvh) {
    .player-view {
      height: 100vh;
      max-height: 100vh;
    }
  }


  .player-main {
    padding: 1.25rem 1.25rem 0.625rem;
    gap: 1rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
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
    font-size: 0.95rem;
  }

  .stats-value {
    font-size: 1.45rem;
  }

  .question-panel {
    padding: 0.75rem;
    margin: 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .question-content {
    gap: 0.65rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .question-content h2 {
    font-size: clamp(1.5rem, 5.5vw, 1.95rem);
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
    padding: 0.35rem 0.625rem 0.75rem;
    margin: 0;
    flex-shrink: 0;
  }

  .buzzer-button {
    padding: 2.8125rem 3.9375rem;
    font-size: 2.1375rem;
    min-height: 146.25px;
    width: 100%;
  }

  .button-label {
    font-size: 1.05rem;
    font-weight: 600;
  }

  .buzzer-hint {
    font-size: 0.8rem;
    margin-top: 0.375rem;
  }
}

/* Маленькие мобильные (до 480px) */
@media (max-width: 480px) {
  .player-view {
    height: 100dvh;
    max-height: 100dvh;
    overflow: hidden;
  }

  /* Fallback для старых браузеров */
  @supports not (height: 100dvh) {
    .player-view {
      height: 100vh;
      max-height: 100vh;
    }
  }


  .player-main {
    padding: 1rem 1rem 0.5rem;
    gap: 0.9rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .player-stats {
    padding: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .stats-item {
    padding: 0.4rem 0.5rem;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
  }

  .stats-row {
    gap: 0.4rem;
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
    font-size: 0.88rem;
  }

  .stats-value {
    font-size: 1.25rem;
  }

  .question-panel {
    padding: 0.5rem;
    margin: 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }

  .question-content {
    gap: 0.5rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .question-content h2 {
    font-size: clamp(1.35rem, 4.8vw, 1.65rem);
    line-height: 1.25;
    flex-shrink: 0;
    margin: 0;
  }

  .media-grid {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
  }

  .responder-container {
    gap: 0.4rem;
    min-height: 48px;
    flex-shrink: 0;
  }

  .responder-info {
    padding: 0.4rem 0.65rem;
    gap: 0.4rem;
  }

  .responder-avatar {
    width: 26px;
    height: 26px;
    font-size: 0.9rem;
  }

  .responder-name {
    font-size: clamp(0.75rem, 2.2vw, 0.85rem);
  }

  .responder-label {
    font-size: clamp(0.6rem, 1.8vw, 0.65rem);
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
    padding: 0.25rem 0.25rem 0.65rem;
    margin: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .buzzer-button {
    padding: 1.875rem 2.625rem;
    font-size: 1.8rem;
    min-height: 105px;
    width: 100%;
  }

  .button-label {
    font-size: 0.95rem;
    font-weight: 600;
  }

  .buzzer-hint {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
}

/* Очень маленькие экраны (до 360px) */
@media (max-width: 360px) {

  .player-main {
    padding: 0.375rem 0.875rem;
    gap: 0.5625rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
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
    font-size: 0.82rem;
  }

  .stats-value {
    font-size: 1.1rem;
  }

  .question-panel {
    padding: 0.4rem;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .question-content {
    gap: 0.4rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .question-content h2 {
    font-size: clamp(1.2rem, 4vw, 1.5rem);
    line-height: 1.2;
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
    font-size: clamp(1.2rem, 4.5vw, 1.45rem);
    line-height: 1.3;
  }

  .question-placeholder {
    font-size: clamp(1.35rem, 4.5vw, 1.65rem);
    padding: 1rem 0.75rem;
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
    padding: 1.96875rem 2.8125rem;
    font-size: 1.8rem;
    min-height: 112.5px;
    width: 100%;
  }

  .button-label {
    font-size: 0.9rem;
    font-weight: 600;
  }

  .buzzer-hint {
    font-size: 0.7rem;
  }
}

/* Экстремально маленькие экраны (до 320px) */
@media (max-width: 320px) {

  .player-main {
    padding: 1rem 0.875rem 0.5rem;
    gap: 0.3rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  .player-stats {
    padding: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .stats-item {
    padding: 0.3rem 0.4rem;
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;
  }

  .stats-row {
    gap: 0.3rem;
  }

  .stats-label {
    font-size: 0.78rem;
  }

  .stats-value {
    font-size: 0.95rem;
  }

  .question-panel {
    padding: 0.35rem;
    margin: 0;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-sizing: border-box;
  }

  .question-content {
    gap: 0.35rem;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .question-content h2 {
    font-size: clamp(1.15rem, 3.8vw, 1.35rem);
    line-height: 1.2;
    margin: 0;
  }

  .responder-container {
    gap: 0.3rem;
    min-height: 44px;
    flex-shrink: 0;
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

  .media-grid {
    flex: 1 1 0;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
  }

  .question-placeholder {
    font-size: clamp(1.25rem, 4.2vw, 1.5rem);
    padding: 0.85rem 0.65rem;
  }

  .answer-reveal {
    font-size: clamp(0.7rem, 2.5vw, 0.85rem);
    padding: 0.35rem;
  }

  .buzzer-section {
    padding: 0.2rem 0.2rem 0.55rem;
    margin: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  .buzzer-button {
    padding: 1.5rem 1.875rem;
    font-size: 1.65rem;
    min-height: 90px;
    width: 100%;
  }

  .button-label {
    font-size: 0.85rem;
    font-weight: 600;
  }

  .buzzer-hint {
    font-size: 0.65rem;
  }
}
</style>

