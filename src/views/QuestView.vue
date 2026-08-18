<template>
  <!-- Під час завантаження повного квеста (rounds ще немає) показуємо лоадер -->
  <div v-if="isLoadingQuest && (!quest || !quest.rounds?.length)" class="quest-loading-wrapper">
    <div class="loading-state">
      <div class="loader"></div>
      <p>Загрузка квеста…</p>
    </div>
  </div>
  <div v-else-if="quest" class="quest-view">
    <AppHeader
      button-variant="back"
      button-label="Назад"
      :show-session-code="!!session && !isMobileViewport"
      :session-code="session?.code"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <section v-if="isMobileViewport" class="desktop-only-stub" aria-live="polite">
      <div class="desktop-only-stub__content">
        <div class="desktop-only-stub__icon" aria-hidden="true">🖥️</div>
        <h2 class="desktop-only-stub__title">Игровое поле доступно только с десктопных устройств</h2>
        <p class="desktop-only-stub__text">Откройте эту страницу на компьютере или планшете, чтобы вести игру. Участники могут подключаться с телефона по коду игры.</p>
      </div>
    </section>

    <main v-else-if="activeRound" class="quest-layout">
      <section class="quest-stage">
        <nav class="rounds-nav rounds-nav--stage">
      <div class="rounds-track">
        <button
          v-for="round in (quest?.rounds || [])"
          :key="round.id"
          :class="['round-chip', { active: round.id === activeRoundId } ]"
          :title="round.title"
          @click="selectRound(round.id)"
        >
          <span class="round-chip__label">{{ round.title }}</span>
        </button>
      </div>
    </nav>
        <QuizBoard :quest-id="quest.id" :round="activeRound" :session-id="session?.id" />
      </section>
      <QuestSidebar :quest="quest" :session="session" @reset="handleReset" />
    </main>

    <LeaderboardPanel v-if="!isMobileViewport && activeRound" :session="session" />

    <!-- Показувати, коли в квесті взагалі немає раундів (не під час завантаження) -->
    <section v-if="!isMobileViewport && !isLoadingQuest && quest && (!quest.rounds || !quest.rounds.length)" class="empty-round">
      <p>Для этого квеста ещё не создано ни одного раунда.</p>
      <router-link to="/host/setup" class="empty-round__link">Перейти к управлению квестами</router-link>
    </section>
  </div>
  <div v-else class="not-found">
    <p>Квест не найден.</p>
    <router-link to="/host/setup" class="back-link">← Вернуться к списку квестов</router-link>
  </div>

  <!-- Полноэкранный лоадер при выходе из игры -->
  <teleport to="body">
    <div v-if="isExiting" class="quest-loading-wrapper" style="z-index: 10000;">
      <div class="loading-state">
        <div class="loader"></div>
        <p>Выход из игры...</p>
      </div>
    </div>
  </teleport>
  
  <!-- Модальное окно подтверждения выхода из игры -->
  <ConfirmDialog
    :show="showExitConfirm"
    title="Выход из игры"
    message="Вы уверены, что хотите выйти из игры? Все данные игры будут утеряны."
    confirm-label="Выйти"
    busy-label="Выход..."
    :busy="isExiting"
    @confirm="confirmExit"
    @cancel="cancelExit"
  />

  <!-- Модальное окно подтверждения сброса прогресса -->
  <ConfirmDialog
    :show="showResetConfirm"
    title="Сбросить прогресс"
    message="Вы уверены, что хотите сбросить весь прогресс квеста? Это действие нельзя отменить."
    confirm-label="Сбросить"
    @confirm="confirmReset"
    @cancel="cancelReset"
  />
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import QuizBoard from '@/components/quiz/QuizBoard.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useIsMobileViewport } from '@/composables/useIsMobileViewport'
import { useHostSessionSync } from '@/composables/useHostSessionSync'
import { useResponderTimeout } from '@/composables/useResponderTimeout'
import LeaderboardPanel from '@/components/quiz/LeaderboardPanel.vue'
import QuestSidebar from '@/components/quiz/QuestSidebar.vue'

interface Props {
  questId?: string
  roundId?: string
  sessionId?: string
  sessionCode?: string
}

const props = defineProps<Props>()
const router = useRouter()
const route = useRoute()
const quizStore = useQuizStore()
const sessionStore = useGameSessionStore()

const isLoadingQuest = ref(true)
const { isMobileViewport } = useIsMobileViewport()

// Получаем сессию по коду или ID
const session = computed(() => {
  if (props.sessionCode) {
    return sessionStore.getSessionByCode(props.sessionCode)
  }
  if (props.sessionId) {
    return sessionStore.getSessionById(props.sessionId)
  }
  return undefined
})

// Получаем questId из сессии или из props
const questId = computed(() => {
  if (props.questId) {
    return props.questId
  }
  if (session.value) {
    return session.value.questId
  }
  return ''
})

const quest = computed(() => {
  if (session.value?.quest) return session.value.quest
  return questId.value ? quizStore.getQuestById(questId.value) ?? null : null
})
const showExitConfirm = ref(false)
const showResetConfirm = ref(false)
const isExiting = ref(false)

const userProfile = computed(() => sessionStore.userProfile)

const activeRoundId = computed(() => {
  const rounds = quest.value?.rounds
  if (!quest.value || !Array.isArray(rounds) || rounds.length === 0) return null
  if (session.value?.roundId) return session.value.roundId
  const fromRoute = (route.params.roundId as string | undefined) ?? props.roundId
  const roundExists = fromRoute && rounds.some(r => r.id === fromRoute)
  return roundExists ? fromRoute! : rounds[0].id
})

const activeRound = computed(() => {
  const rounds = quest.value?.rounds
  if (!quest.value || !Array.isArray(rounds) || !activeRoundId.value) return undefined
  return rounds.find(r => r.id === activeRoundId.value)
})

// Резервный поллинг сессии (#18) + prune протухших игроков (#5) на стороне хоста
const { start: startHostSync } = useHostSessionSync(() => session.value?.id)

// Если сессия загрузилась после mount (например, при перезагрузке страницы) —
// подписываемся на её realtime (#17)
watch(
  () => session.value?.id,
  (id) => { if (id) sessionStore.watchSession(id) },
  { immediate: false }
)

// Хост — авторитет по таймауту отвечающего (#12): снимает право ответа через 10с
// от серверного responderStartedAt, даже если у отвечающего закрыта вкладка.
useResponderTimeout(() => session.value)

onMounted(async () => {
  // Встановити активний раунд для сесії, якщо ще не встановлено
  if (session.value && !session.value.roundId && quest.value?.rounds?.length) {
    sessionStore.setActiveRound(session.value.id, quest.value.rounds[0].id)
  }

  // Подписка на realtime именно этой сессии (#17)
  if (session.value?.id) sessionStore.watchSession(session.value.id)

  // Резервный поллинг сессии + prune протухших игроков (нові учасники з’являються
  // без перезавантаження, вкладка гравця чиститься по TTL). Живе поза mount через getter.
  if (session.value?.id) startHostSync()

  // Завантажуємо список (якщо треба) і повний квест для перегляду/гри
  if (!quest.value || !quest.value.rounds) {
    try {
      isLoadingQuest.value = true
      if (!quizStore.quests.length) await quizStore.loadFromStorage()
      if (questId.value) await quizStore.loadQuestFull(questId.value)
      if (!quest.value?.rounds) {
        router.replace({ name: 'host-setup' })
        return
      }
    } catch (error) {
      console.error('Error loading quest:', error)
      router.replace({ name: 'host-setup' })
      return
    } finally {
      isLoadingQuest.value = false
    }
  } else {
    isLoadingQuest.value = false
  }
})

// Відстежуємо зміну questId — підвантажуємо повний квест за потреби
watch(
  () => questId.value,
  async (newQuestId) => {
    if (!newQuestId) return
    if (!quest.value?.rounds) {
      isLoadingQuest.value = true
      try {
        if (!quizStore.quests.length) await quizStore.loadFromStorage()
        await quizStore.loadQuestFull(newQuestId)
        if (!quest.value?.rounds) router.replace({ name: 'host-setup' })
      } catch (error) {
        console.error('Error loading quest:', error)
        router.replace({ name: 'host-setup' })
      } finally {
        isLoadingQuest.value = false
      }
    }
  },
  { immediate: true }
)

// Отслеживаем появление квеста после загрузки
watch(
  () => quest.value,
  (newQuest) => {
    if (newQuest) {
      isLoadingQuest.value = false
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  // poll/prune, responder-timeout и demo-таймер лидерборда снимают их composables сами
  sessionStore.unwatchSession()
})

watch(
  () => activeRoundId.value,
  newId => {
    if (!newId) return
    if (session.value) {
      if (session.value.roundId !== newId) {
        sessionStore.setActiveRound(session.value.id, newId)
      }
      const sessionCode = session.value.code
      const currentRoundId = route.params.roundId as string | undefined
      if (session.value.roundId !== newId || currentRoundId !== newId || route.params.sessionCode !== sessionCode) {
        router.replace({ 
          name: 'host-session', 
          params: { sessionCode, roundId: newId },
          query: { questId: questId.value }
        })
      }
    } else if (route.params.roundId !== newId) {
      router.replace({ name: 'quest', params: { questId: questId.value, roundId: newId } })
    }
  },
  { immediate: true }
)

function selectRound(roundId: string) {
  if (roundId === activeRoundId.value) return
  if (session.value) {
    sessionStore.setActiveRound(session.value.id, roundId)
    router.push({ 
      name: 'host-session', 
      params: { sessionCode: session.value.code, roundId },
      query: { questId: questId.value }
    })
  } else {
    router.push({ name: 'quest', params: { questId: questId.value, roundId } })
  }
}

function goBack() {
  if (session.value) {
    // Показываем модальное окно подтверждения при выходе из игры
    showExitConfirm.value = true
  } else {
    router.push({ name: 'host-setup' })
  }
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
  
  if (session.value) {
    const sid = session.value.id
    try {
      // Закрываем сессию. Прогресс квеста (сыгранные вопросы) НЕ трогаем (#26):
      // выход из игры не должен молча стирать разметку. Для сброса есть отдельная
      // кнопка «Сбросить» с собственным подтверждением.
      await sessionStore.deleteSession(sid)
      console.log('🔴 [Lifecycle] Session closed:', sid)
      sessionStore.clearActivePlayer()
    } catch (error) {
      console.error('Error closing session:', error)
    }
  }
  
  router.push({ name: 'host-setup' })
}

function handleReset() {
  if (!quest.value) return
  showResetConfirm.value = true
}

function cancelReset() {
  showResetConfirm.value = false
}

async function confirmReset() {
  if (!quest.value) return
  showResetConfirm.value = false

  // Сбрасываем прогресс квеста и баллы участников после закрытия попапа
  await quizStore.resetQuestProgress(questId.value)
  if (session.value) {
    await sessionStore.resetPlayersScores(session.value.id)
  }
}
</script>

<style scoped>
.quest-view {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  position: relative;
  overflow: hidden;
  padding: 0 clamp(1rem, 4vw, 3rem) 0;
  box-sizing: border-box;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.desktop-only-stub {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 2rem 1.5rem;
  position: relative;
  z-index: 1;
}

.desktop-only-stub__content {
  text-align: center;
  max-width: 420px;
}

.desktop-only-stub__icon {
  font-size: 3.5rem;
  margin-bottom: 1.25rem;
  opacity: 0.9;
}

.desktop-only-stub__title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.15rem, 3.5vw, 1.4rem);
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.3;
}

.desktop-only-stub__text {
  margin: 0;
  font-size: clamp(0.9rem, 2.5vw, 1rem);
  color: #94a3b8;
  line-height: 1.5;
}

.quest-view::before,
.quest-view::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  background-image: 
    radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(1.5px 1.5px at 60% 70%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 50% 50%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(2px 2px at 80% 10%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1.5px 1.5px at 90% 60%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 33% 80%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(2px 2px at 10% 50%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 70% 20%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(2px 2px at 40% 90%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(1.5px 1.5px at 15% 15%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1px 1px at 25% 15%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 45% 35%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 65% 55%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 85% 75%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 5% 85%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 12% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 28% 45%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 38% 65%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 52% 25%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 68% 85%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 75% 45%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 88% 25%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 95% 75%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 8% 55%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 18% 75%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 35% 5%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 48% 95%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 62% 15%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 78% 55%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 92% 35%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(2px 2px at 5% 5%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 18% 8%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1px 1px at 32% 12%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 48% 7%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1.5px 1.5px at 65% 10%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 82% 5%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 95% 12%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 12% 18%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1px 1px at 28% 22%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 55% 8%, rgba(255, 255, 255, 0.95), transparent);
  background-repeat: repeat;
  background-size: 200% 200%;
  animation: starsMove 60s linear infinite;
  opacity: 1;
}

.quest-view::after {
  background-image: 
    radial-gradient(1.5px 1.5px at 25% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 55% 75%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 75% 25%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1.5px 1.5px at 30% 60%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 85% 85%, rgba(255, 255, 255, 1), transparent),
    radial-gradient(1.5px 1.5px at 45% 15%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 65% 45%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 95% 35%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1.5px 1.5px at 5% 65%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 50% 95%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1px 1px at 35% 45%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 55% 65%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 75% 85%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 22% 35%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 42% 55%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 58% 75%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 72% 5%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 82% 65%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 98% 15%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 15% 85%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 32% 5%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 48% 25%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 65% 85%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1.5px 1.5px at 88% 45%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 3% 35%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 17% 65%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 37% 15%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 53% 55%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1px 1px at 67% 25%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 83% 75%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(2px 2px at 7% 8%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1.5px 1.5px at 22% 12%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(1px 1px at 38% 5%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(2px 2px at 58% 10%, rgba(255, 255, 255, 0.95), transparent),
    radial-gradient(1.5px 1.5px at 72% 7%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 88% 12%, rgba(255, 255, 255, 0.85), transparent),
    radial-gradient(2px 2px at 15% 18%, rgba(255, 255, 255, 0.9), transparent),
    radial-gradient(1px 1px at 42% 22%, rgba(255, 255, 255, 0.8), transparent),
    radial-gradient(1.5px 1.5px at 68% 8%, rgba(255, 255, 255, 0.95), transparent);
  animation: starsMove 80s linear infinite reverse;
  opacity: 0.8;
}

@keyframes starsMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(-50%, -50%);
  }
}


.rounds-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 1.5rem;
  background: transparent;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
}

.rounds-label {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
  color: #94a3b8;
  height: 50px;
}

.rounds-track {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 0.25rem 0;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 211, 238, 0.4) transparent;
}

.rounds-nav::-webkit-scrollbar,
.rounds-track::-webkit-scrollbar {
  height: 6px;
}

.rounds-nav::-webkit-scrollbar-thumb,
.rounds-track::-webkit-scrollbar-thumb {
  background: rgba(34, 211, 238, 0.4);
  border-radius: 9999px;
}

.rounds-nav::-webkit-scrollbar-thumb:hover,
.rounds-track::-webkit-scrollbar-thumb:hover {
  background: rgba(34, 211, 238, 0.6);
}

.rounds-nav {
  scrollbar-width: thin;
  scrollbar-color: rgba(34, 211, 238, 0.4) transparent;
}

.round-chip {
  position: relative;
  z-index: 10;
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  min-height: 44px;
  flex: 1 1 160px;
  overflow: hidden;
  box-sizing: border-box;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 
    0 1px 3px rgba(2, 6, 23, 0.15),
    0 1px 2px rgba(2, 6, 23, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.15);
  transform: perspective(1000px) rotateX(1deg);
}

.round-chip__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  display: block;
}

.round-chip::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.round-chip:hover::before {
  opacity: 1;
}

.round-chip::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border-radius: 0.55rem;
  pointer-events: none;
  opacity: 0.5;
}

.round-chip:hover {
  border-color: rgba(56, 189, 248, 0.3);
  transform: perspective(1000px) rotateX(1deg) translateY(-1px);
  box-shadow: 
    0 2px 4px rgba(2, 6, 23, 0.2),
    0 1px 3px rgba(2, 6, 23, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.18);
}

.round-chip.active {
  border-color: rgba(34, 211, 238, 0.5);
  color: #bae6fd;
  box-shadow: 
    0 2px 4px rgba(34, 211, 238, 0.2),
    0 1px 3px rgba(34, 211, 238, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    inset 0 -1px 2px rgba(0, 0, 0, 0.18);
  transform: perspective(1000px) rotateX(1deg) translateY(-2px);
}

.quest-layout {
  flex: 1;
  display: flex;
  gap: 3rem;
  padding: 0 1.5rem 1.25rem;
  align-items: stretch;
  position: relative;
  z-index: 1;
}

.quest-stage {
  flex: 1 1 80%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.quest-stage :deep(.board-container) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.quest-stage :deep(.board-grid) {
  flex: 1;
  min-height: 0;
}

.rounds-nav--stage {
  gap: 0.6rem;
  padding: 0 1rem;
  background: transparent;
  border-radius: 16px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
}

.empty-round,
.not-found {
  margin: 2rem auto;
  max-width: 640px;
  min-height: 320px;
  padding: 2.5rem;
  border-radius: 28px;
  background: linear-gradient(165deg, rgba(15, 23, 42, 0.85), rgba(8, 13, 26, 0.95));
  border: 1px solid rgba(59, 130, 246, 0.18);
  box-shadow: 0 40px 80px rgba(2, 6, 23, 0.5);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: #94a3b8;
}

.empty-round__link,
.back-link {
  color: #22d3ee;
  text-decoration: none;
}

.empty-round__link:hover,
.back-link:hover {
  text-decoration: underline;
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
  z-index: 1000;
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
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 8px rgba(15, 23, 42, 0.3);
}


@media (max-width: 1200px) {
  .empty-round,
  .not-found {
    max-width: 540px;
  }
}

@media (max-width: 768px) {
  .quest-view {
    padding: 0 1rem 0;
  }

  .quest-layout {
    flex-direction: column;
    padding: 0 0.75rem 1rem;
    gap: 1.5rem;
  }
  .rounds-nav {
    padding: 0.75rem 1rem;
    gap: 0.5rem;
    justify-content: flex-start;
  }

  .rounds-track {
    justify-content: flex-start;
  }

  .round-chip {
    min-width: 140px;
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.45rem 0.85rem;
    min-height: 40px;
  }
}

@media (max-width: 640px) {
  .quest-view {
    padding: 0 0.75rem 0;
  }

  .quest-layout {
    padding: 0 0.5rem 0.75rem;
    gap: 1.25rem;
  }
  .round-chip {
    min-width: 120px;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.4rem 0.75rem;
    min-height: 36px;
  }
}

@media (max-width: 480px) {
  .quest-view {
    padding: 0 0.5rem 0;
  }

  .quest-layout {
    padding: 0 0.375rem 0.625rem;
    gap: 1rem;
  }

  .quest-stage {
    gap: 0.75rem;
  }

  .rounds-nav {
    padding: 0.625rem 0.75rem;
    gap: 0.4rem;
  }

  .round-chip {
    min-width: 100px;
    font-size: 0.6rem;
    font-weight: 700;
    padding: 0.35rem 0.65rem;
    min-height: 32px;
  }
}

@media (max-width: 360px) {
  .quest-view {
    padding: 0 0.375rem 0;
  }

  .quest-layout {
    padding: 0 0.25rem 0.5rem;
    gap: 0.875rem;
  }

  .rounds-nav {
    padding: 0.5rem 0.625rem;
  }

  .round-chip {
    min-width: 90px;
    font-size: 0.55rem;
    font-weight: 700;
    padding: 0.3rem 0.55rem;
    min-height: 30px;
  }
}

@media (max-width: 320px) {
  .quest-view {
    padding: 0 0.25rem 0;
  }

  .quest-layout {
    padding: 0 0.2rem 0.45rem;
    gap: 0.75rem;
  }

  .rounds-nav {
    padding: 0.45rem 0.5rem;
  }

  .round-chip {
    min-width: 80px;
    font-size: 0.5rem;
    font-weight: 700;
    padding: 0.25rem 0.5rem;
    min-height: 28px;
  }
}
</style>

