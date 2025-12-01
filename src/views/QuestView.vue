<template>
  <div v-if="quest" class="quest-view">
    <header class="quest-topbar">
      <div class="quest-topbar-left">
        <button class="back-button" @click="goBack"><span class="back-arrow">←</span> Назад</button>
      </div>
      <div class="topbar-actions">
        <div v-if="session" class="session-chip">
          Код игры: <strong>{{ session.code }}</strong>
        </div>
        <div class="quest-user-pill">
          <span class="quest-user-name">{{ displayName }}</span>
          <div class="quest-user-avatar" :class="{ 'quest-user-avatar--placeholder': !hasAvatar }" aria-hidden="true">
            <span>{{ hasAvatar ? avatarEmoji : avatarInitial }}</span>
          </div>
        </div>
      </div>
    </header>

    <main v-if="activeRound" class="quest-layout">
      <section class="quest-stage">
        <nav class="rounds-nav rounds-nav--stage">
      <div class="rounds-track">
        <button
          v-for="round in quest.rounds"
          :key="round.id"
          :class="['round-chip', { active: round.id === activeRoundId } ]"
          @click="selectRound(round.id)"
        >
          {{ round.title }}
        </button>
      </div>
    </nav>
        <QuizBoard :quest-id="quest.id" :round="activeRound" :session-id="session?.id" />
      </section>
      <aside class="quest-sidebar">
        <div class="sidebar-card">
          <span class="sidebar-chip">Квест</span>
          <h2 class="sidebar-title">{{ quest.title }}</h2>
          <p v-if="quest.description" class="sidebar-description">{{ quest.description }}</p>
          <p v-else class="sidebar-description sidebar-description--muted">Описание пока не добавлено.</p>
        </div>
        <div v-if="session && !isPlayerInSession" class="sidebar-card sidebar-card--join">
          <span class="sidebar-chip">Присоединиться к игре</span>
          <p class="sidebar-description">Введите код игры, чтобы присоединиться как участник</p>
          <div class="join-form">
            <div class="join-form-row">
              <input
                v-model="joinCodeInput"
                type="text"
                maxlength="4"
                placeholder="КОД"
                class="join-code-input"
                @input="handleJoinCodeInput"
              />
              <button 
                class="join-button" 
                type="button"
                :disabled="!canJoin"
                @click="handleJoinSession"
              >
                Присоединиться
              </button>
            </div>
            <p v-if="joinError" class="join-error">{{ joinError }}</p>
          </div>
        </div>
        <div class="sidebar-card">
          <span class="sidebar-chip">Статистика</span>
          <div class="sidebar-stats">
            <div class="sidebar-stat">
              <span class="sidebar-stat__label">Всего вопросов</span>
              <span class="sidebar-stat__value">{{ questProgress.totalQuestions }}</span>
            </div>
            <div class="sidebar-stat">
              <span class="sidebar-stat__label">Сыграно</span>
              <span class="sidebar-stat__value">{{ questProgress.playedQuestions }}</span>
            </div>
            <div class="sidebar-stat">
              <span class="sidebar-stat__label">Осталось</span>
              <span class="sidebar-stat__value">{{ questProgress.totalQuestions - questProgress.playedQuestions }}</span>
            </div>
            <div class="sidebar-progress sidebar-progress--quest">
              <div class="sidebar-progress__bar">
                <span class="sidebar-progress__fill sidebar-progress__fill--quest" :style="{ width: `${questProgressPercent}%` }" />
              </div>
              <div class="sidebar-progress__meta">
                <span>{{ questProgressPercent }}% / 100%</span>
              </div>
            </div>
          </div>
          <button 
            class="sidebar-reset" 
            type="button" 
            :disabled="!questProgress.playedQuestions || questProgress.playedQuestions === 0"
            @click="handleReset"
          >
            Сбросить прогресс
          </button>
      </div>
      </aside>
    </main>

    <section v-if="leaderboardEntries.length" class="quest-leaderboard">
      <div class="leaderboard-card">
        <header class="leaderboard-header">
          <span class="leaderboard-label">Участники</span>
        </header>
        <TransitionGroup name="leaderboard" tag="ul" class="leaderboard-list">
          <li
            v-for="(player, index) in leaderboardEntries"
            :key="player.id"
            :class="[
              'leaderboard-item',
              {
                'leaderboard-item--first': index === 0 && player.score > 0,
                'leaderboard-item--second': index === 1 && player.score > 0,
                'leaderboard-item--third': index === 2 && player.score > 0,
                'leaderboard-item--answered': isPlayerAnswered(player.id)
              }
            ]"
          >
            <span v-if="index === 0 && player.score > 0" class="leaderboard-medal leaderboard-medal--gold">🥇</span>
            <span v-else-if="index === 1 && player.score > 0" class="leaderboard-medal leaderboard-medal--silver">🥈</span>
            <span v-else-if="index === 2 && player.score > 0" class="leaderboard-medal leaderboard-medal--bronze">🥉</span>
            <span class="leaderboard-rank">{{ index + 1 }}</span>
            <span class="leaderboard-avatar" :class="{ 'leaderboard-avatar--placeholder': !player.avatar }">
              <span>{{ player.avatar || player.name.charAt(0).toUpperCase() }}</span>
            </span>
            <div class="leaderboard-info">
              <span class="leaderboard-name">{{ player.name }}</span>
              <span class="leaderboard-score">
                <strong>{{ player.score.toLocaleString('ru-RU') }}</strong>
                <span>баллов</span>
              </span>
            </div>
          </li>
        </TransitionGroup>
      </div>
    </section>

    <section v-else class="empty-round">
      <p>Для этого квеста ещё не создано ни одного раунда.</p>
      <router-link to="/host/setup" class="empty-round__link">Перейти к управлению квестами</router-link>
    </section>
  </div>
  <div v-else-if="isLoadingQuest" class="quest-loading-wrapper">
    <div class="loading-state">
      <div class="loader"></div>
      <p>Загрузка квеста…</p>
    </div>
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
  <teleport to="body">
    <div v-if="showExitConfirm" class="quest-modal-backdrop" @click="cancelExit">
      <div class="quest-modal quest-modal--confirm" role="dialog" aria-modal="true" @click.stop>
        <header class="quest-modal__header">
          <h2>Выход из игры</h2>
          <button type="button" class="quest-modal__close" @click="cancelExit" aria-label="Закрыть">✕</button>
        </header>
        <div class="quest-modal__body">
          <p>Вы уверены, что хотите выйти из игры? Все данные игры будут утеряны.</p>
        </div>
        <div class="quest-modal__actions">
          <button type="button" class="secondary" @click="cancelExit" :disabled="isExiting">Отмена</button>
          <button type="button" class="danger" @click="confirmExit" :disabled="isExiting">
            {{ isExiting ? 'Выход...' : 'Выйти' }}
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <!-- Модальное окно подтверждения сброса прогресса -->
  <teleport to="body">
    <div v-if="showResetConfirm" class="quest-modal-backdrop" @click="cancelReset">
      <div class="quest-modal quest-modal--confirm" role="dialog" aria-modal="true" @click.stop>
        <header class="quest-modal__header">
          <h2>Сбросить прогресс</h2>
          <button type="button" class="quest-modal__close" @click="cancelReset" aria-label="Закрыть">✕</button>
        </header>
        <div class="quest-modal__body">
          <p>Вы уверены, что хотите сбросить весь прогресс квеста? Это действие нельзя отменить.</p>
        </div>
        <div class="quest-modal__actions">
          <button type="button" class="secondary" @click="cancelReset">Отмена</button>
          <button type="button" class="danger" @click="confirmReset">Сбросить</button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import QuizBoard from '@/components/quiz/QuizBoard.vue'

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

const quest = computed(() => questId.value ? quizStore.getQuestById(questId.value) : null)
const sessionId = computed(() => session.value?.id)
const showExitConfirm = ref(false)
const showResetConfirm = ref(false)
const isExiting = ref(false)

const userProfile = computed(() => sessionStore.userProfile)
const displayName = computed(() => {
  const name = userProfile.value?.name?.trim()
  return name && name.length ? name : 'Гость'
})
const avatarEmojiMap: Record<string, string> = {
  fox: '🦊', panda: '🐼', tiger: '🐯', owl: '🦉', whale: '🐳', parrot: '🦜',
  koala: '🐨', dino: '🦕', crocodile: '🐊', lion: '🦁', penguin: '🐧',
  elephant: '🐘', seal: '🦭', hedgehog: '🦔'
}
const avatarEmoji = computed(() => {
  const avatarId = userProfile.value?.avatar ?? ''
  return avatarEmojiMap[avatarId] ?? ''
})
const hasAvatar = computed(() => Boolean(avatarEmoji.value))
const avatarInitial = computed(() => displayName.value.charAt(0).toUpperCase())

interface LeaderboardEntry {
  id: string
  name: string
  avatar: string
  score: number
}

const fallbackLeaderboard: LeaderboardEntry[] = [
  { id: 'mock-player-1', name: 'Арина', avatar: '🦊', score: 3200 },
  { id: 'mock-player-2', name: 'Борис', avatar: '🐻', score: 3050 },
  { id: 'mock-player-3', name: 'София', avatar: '🦉', score: 2890 },
  { id: 'mock-player-4', name: 'Даниил', avatar: '🐯', score: 2760 },
  { id: 'mock-player-5', name: 'Ева', avatar: '🐼', score: 2620 },
  { id: 'mock-player-6', name: 'Леон', avatar: '🦁', score: 2480 },
  { id: 'mock-player-7', name: 'Ника', avatar: '🦋', score: 2340 },
  { id: 'mock-player-8', name: 'Игорь', avatar: '🦕', score: 2200 },
  { id: 'mock-player-9', name: 'Кира', avatar: '🐧', score: 2070 },
  { id: 'mock-player-10', name: 'Максим', avatar: '🐊', score: 1960 },
  { id: 'mock-player-11', name: 'Оля', avatar: '🦜', score: 1850 },
  { id: 'mock-player-12', name: 'Павел', avatar: '🦭', score: 1740 },
  { id: 'mock-player-13', name: 'Рита', avatar: '🦔', score: 1620 },
  { id: 'mock-player-14', name: 'Слава', avatar: '🐸', score: 1510 },
  { id: 'mock-player-15', name: 'Таня', avatar: '🦢', score: 1390 }
]

const leaderboardState = ref<LeaderboardEntry[]>([])

const joinCodeInput = ref('')
const joinError = ref('')

const sessionParticipants = computed(() => {
  if (!session.value) return []
  return session.value.players.filter(player => player.id !== session.value!.hostId)
})

// Проверяем, ответил ли игрок (нажал кнопку или заблокирован)
function isPlayerAnswered(playerId: string): boolean {
  if (!session.value) return false
  const player = session.value.players.find(p => p.id === playerId)
  if (!player) return false
  
  // Игрок ответил, если его статус 'buzzed', 'queued' или 'locked'
  if (player.status === 'buzzed' || player.status === 'queued' || player.status === 'locked') {
    return true
  }
  
  // Или если он в очереди ответов
  if (session.value.activeQuestion?.buzzedOrder?.includes(playerId)) {
    return true
  }
  
  // Или если он текущий отвечающий
  if (session.value.activeQuestion?.currentResponderId === playerId) {
    return true
  }
  
  return false
}

const isPlayerInSession = computed(() => {
  if (!session.value || !userProfile.value) return false
  return session.value.players.some(player => player.id === userProfile.value!.id)
})

const canJoin = computed(() => {
  return joinCodeInput.value.length === 4 && !joinError.value
})

// Автозаполнение кода сессии, если она есть
watch(
  () => session.value?.code,
  (code) => {
    if (code && !isPlayerInSession.value) {
      joinCodeInput.value = code
    }
  },
  { immediate: true }
)

function handleJoinCodeInput(event: Event) {
  const target = event.target as HTMLInputElement
  joinCodeInput.value = target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4)
  joinError.value = ''
}

async function handleJoinSession() {
  if (!canJoin.value) return
  joinError.value = ''
  
  try {
    // Если есть сессия в пропсах, проверяем код
    if (session.value) {
      if (joinCodeInput.value.toUpperCase() !== session.value.code.toUpperCase()) {
        joinError.value = 'Неверный код игры'
        return
      }
    }
    
    const result = await sessionStore.joinSessionByCode(joinCodeInput.value)
    if (!result || !result.session) {
      joinError.value = 'Сессия с таким кодом не найдена'
      return
    }
    sessionStore.setActivePlayer(result.session.id, result.playerId)
    router.push({ name: 'player-session', params: { sessionId: result.session.id } })
  } catch (error: any) {
    joinError.value = error?.message ?? 'Не удалось присоединиться к игре. Убедитесь, что игра запущена в другой вкладке.'
  }
}

const isMockSession = computed(() => !session.value || sessionParticipants.value.length === 0)

const activeRoundId = computed(() => {
  if (!quest.value || !quest.value.rounds.length) return null
  if (session.value?.roundId) return session.value.roundId
  const fromRoute = (route.params.roundId as string | undefined) ?? props.roundId
  const roundExists = fromRoute && quest.value.rounds.some(r => r.id === fromRoute)
  return roundExists ? fromRoute! : quest.value.rounds[0].id
})

const activeRound = computed(() => {
  if (!quest.value || !activeRoundId.value) return undefined
  return quest.value.rounds.find(r => r.id === activeRoundId.value)
})

const questProgress = computed(() => {
  if (!quest.value) {
    return { totalRounds: 0, totalQuestions: 0, playedQuestions: 0 }
  }
  return quizStore.getQuestProgress(questId.value)
})

const questProgressPercent = computed(() => {
  const total = questProgress.value.totalQuestions
  const played = questProgress.value.playedQuestions
  if (!total || total === 0) return 0
  const percent = (played / total) * 100
  return Math.min(100, Math.max(0, Math.round(percent)))
})

const leaderboardEntries = computed<LeaderboardEntry[]>(() => {
  return [...leaderboardState.value].sort((a, b) => b.score - a.score)
})

function buildLeaderboardFromSession() {
  if (!session.value || !sessionParticipants.value.length) {
    leaderboardState.value = fallbackLeaderboard.map(entry => ({ ...entry }))
    return
  }
  leaderboardState.value = sessionParticipants.value.map((player, index) => ({
    id: player.id,
    name: player.name?.trim() || `Игрок ${index + 1}`,
    avatar: avatarEmojiMap[player.avatar] ?? '',
    score: player.score ?? 0 // Используем реальный счет игрока из сессии
  }))
  console.log('📊 Leaderboard built from session:', leaderboardState.value.map(p => ({ id: p.id, name: p.name, score: p.score })))
}

// Отслеживаем изменения списка участников и их баллов
watch(
  () => session.value?.players ?? [],
  (newPlayers, oldPlayers) => {
    console.log('👥 Players list changed:', {
      oldCount: oldPlayers?.length || 0,
      newCount: newPlayers?.length || 0,
      players: newPlayers.map((p: any) => ({ id: p.id, name: p.name, score: p.score ?? 0 }))
    })
    buildLeaderboardFromSession()
  },
  { immediate: true, deep: true }
)

// Отслеживаем изменения баллов игроков отдельно для более точной реактивности
watch(
  () => session.value?.players?.map(p => ({ id: p.id, score: p.score ?? 0 })) ?? [],
  (newScores, oldScores) => {
    // Проверяем, изменились ли баллы
    const scoresChanged = newScores.some((newScore, index) => {
      const oldScore = oldScores?.[index]
      return !oldScore || oldScore.score !== newScore.score
    })
    if (scoresChanged) {
      console.log('📊 Player scores changed:', newScores)
      buildLeaderboardFromSession()
    }
  },
  { deep: true }
)

// Также отслеживаем изменения самой сессии для обновления списка участников
watch(
  () => session.value,
  (newSession, oldSession) => {
    if (newSession && oldSession) {
      const oldPlayersCount = oldSession.players?.length || 0
      const newPlayersCount = newSession.players?.length || 0
      if (oldPlayersCount !== newPlayersCount) {
        console.log('🔄 Session changed, players count:', oldPlayersCount, '->', newPlayersCount)
      }
    }
    buildLeaderboardFromSession()
  },
  { immediate: true, deep: true }
)

watch(
  isMockSession,
  (mocking, _, onCleanup) => {
    let timer: number | undefined

    const tick = () => {
      if (!isMockSession.value || leaderboardState.value.length === 0) return
      const next = leaderboardState.value.map(entry => ({ ...entry }))
      const randomIndex = Math.floor(Math.random() * next.length)
      const delta = (Math.floor(Math.random() * 160) + 40) * (Math.random() > 0.25 ? 1 : -1)
      const player = next[randomIndex]
      player.score = Math.max(0, player.score + delta)
      leaderboardState.value = next
    }

    if (mocking) {
      tick()
      timer = window.setInterval(tick, 3000)
    }

    onCleanup(() => {
      if (timer) {
        window.clearInterval(timer)
      }
    })
  },
  { immediate: true }
)

onMounted(async () => {
  buildLeaderboardFromSession()
  
  // Загружаем квест, если его нет в store
  if (!quest.value) {
    try {
      isLoadingQuest.value = true
      await quizStore.loadFromStorage()
      // Ждем немного, чтобы дать время на загрузку
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Если квест все еще не найден после загрузки, редиректим
      if (!quest.value) {
        router.replace({ name: 'host-setup' })
        return
      }
    } catch (error) {
      console.error('Error loading quest:', error)
      // При ошибке загрузки редиректим на страницу со списком квестов
      router.replace({ name: 'host-setup' })
      return
    } finally {
      isLoadingQuest.value = false
    }
  } else {
    isLoadingQuest.value = false
  }
})

// Отслеживаем изменение questId в маршруте
watch(
  () => questId.value,
  async (newQuestId) => {
    if (!quest.value) {
      isLoadingQuest.value = true
      try {
        await quizStore.loadFromStorage()
        await new Promise(resolve => setTimeout(resolve, 300))
        if (!quest.value) {
          router.replace({ name: 'host-setup' })
        } else {
          isLoadingQuest.value = false
        }
      } catch (error) {
        console.error('Error loading quest:', error)
        router.replace({ name: 'host-setup' })
      } finally {
        isLoadingQuest.value = false
      }
    } else {
      isLoadingQuest.value = false
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
  leaderboardState.value = []
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
    router.push({ name: 'quests-list' })
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
    try {
      // Сбрасываем прогресс квеста перед удалением сессии
      if (questId.value) {
        await quizStore.resetQuestProgress(questId.value)
      }
      // Удаляем сессию игры
      await sessionStore.deleteSession(session.value.id)
      // Очищаем активную сессию игрока, чтобы не редиректило обратно
      sessionStore.clearActivePlayer()
    } catch (error) {
      console.error('Error deleting session or resetting progress:', error)
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

function confirmReset() {
  if (!quest.value) return
  quizStore.resetQuestProgress(questId.value)
  showResetConfirm.value = false
}

onMounted(() => {
  if (session.value && !session.value.roundId && quest.value?.rounds.length) {
    sessionStore.setActiveRound(session.value.id, quest.value.rounds[0].id)
  }
})
</script>

<style scoped>
.quest-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  position: relative;
  overflow: hidden;
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

.quest-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.9rem;
  padding: 0.75rem 1.5rem 0.5rem;
  position: relative;
  z-index: 1;
}

.quest-topbar-left {
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

.back-button {
  background: rgba(15, 118, 110, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.4);
  color: #f8fafc;
  font-size: 0.95rem;
  padding: 0.65rem 1.25rem;
  border-radius: 9999px;
  cursor: pointer;
  font-weight: 600;
  letter-spacing: 0.05em;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.back-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 211, 238, 0.25);
}

.back-arrow {
  font-weight: 900;
  display: inline-block;
}

.session-chip {
  background: rgba(34, 211, 238, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.4);
  padding: 0.6rem 1.25rem;
  border-radius: 9999px;
  font-weight: 600;
  color: #f8fafc;
}

.quest-user-pill {
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

.quest-user-pill::before {
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

.quest-user-name {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.quest-user-avatar {
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

.quest-user-avatar--placeholder {
  border-style: dashed;
  color: #bae6fd;
}

.rounds-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.5rem 1.5rem;
  background: transparent;
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
  overflow-x: visible;
  padding: 0.25rem 0;
  width: 100%;
}

.rounds-track::-webkit-scrollbar {
  height: 6px;
}

.rounds-track::-webkit-scrollbar-thumb {
  background: rgba(34, 211, 238, 0.4);
  border-radius: 9999px;
}

.round-chip {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(56, 189, 248, 0.2);
  color: #94a3b8;
  padding: 0.5rem 1rem;
  border-radius: 0.55rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  font-family: 'Press Start 2P', 'Nunito', cursive;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 160px;
  min-height: 44px;
  flex: 0 0 auto;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 
    0 3px 6px rgba(2, 6, 23, 0.2),
    0 2px 3px rgba(2, 6, 23, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1000px) rotateX(1deg);
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
    0 6px 12px rgba(2, 6, 23, 0.25),
    0 3px 6px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
}

.round-chip.active {
  border-color: rgba(34, 211, 238, 0.5);
  color: #bae6fd;
  box-shadow: 
    0 6px 12px rgba(34, 211, 238, 0.25),
    0 3px 6px rgba(34, 211, 238, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
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
}

.rounds-nav--stage {
  gap: 0.6rem;
  padding: 0 1rem;
  background: transparent;
  border-radius: 16px;
}

.quest-sidebar {
  flex: 0 0 20%;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.sidebar-card {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 18px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  box-shadow: 
    0 8px 32px rgba(2, 6, 23, 0.3),
    0 4px 16px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.sidebar-card:has(.sidebar-stats) {
  flex: 1;
  min-height: 0;
}

.sidebar-chip {
  align-self: flex-start;
  font-size: 0.68rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(94, 234, 212, 0.8);
}

.sidebar-title {
  margin: 0;
  font-size: clamp(1rem, 2vw, 1.35rem);
  color: #f8fafc;
  line-height: 1.25;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.sidebar-description {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: rgba(226, 232, 240, 0.86);
  max-height: 7rem;
  overflow: hidden;
}

.sidebar-description--muted {
  color: rgba(148, 163, 184, 0.65);
}

.sidebar-stats {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.sidebar-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-stat__label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(148, 163, 184, 0.75);
}

.sidebar-stat__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #facc15;
}

.sidebar-stat--quest {
  margin-top: 0.3rem;
  padding-top: 0.7rem;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.sidebar-stat--quest .sidebar-stat__value {
  color: #22d3ee;
  font-size: 1.1rem;
}

.sidebar-progress {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.sidebar-progress__bar {
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: rgba(30, 41, 59, 0.65);
  overflow: hidden;
}

.sidebar-progress__fill {
  display: block;
  height: 100%;
  background: linear-gradient(135deg, #22d3ee, #818cf8);
  border-radius: inherit;
  transition: width 0.35s ease;
}

.sidebar-progress--quest {
  margin-top: 0.3rem;
}

.sidebar-progress__fill--quest {
  background: linear-gradient(135deg, #22d3ee, #06b6d4);
}

.sidebar-progress__meta {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(148, 163, 184, 0.75);
  text-align: center;
}

.sidebar-stats {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex: 1;
  min-height: 0;
}

.sidebar-reset {
  align-self: center;
  margin-top: auto;
  background: rgba(239, 68, 68, 0.18);
  border: 1px solid rgba(239, 68, 68, 0.45);
  color: #fca5a5;
  padding: 0.65rem 1.2rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.sidebar-reset:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.25);
}

.sidebar-reset:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
  color: rgba(252, 165, 165, 0.6);
}

.join-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
}

.join-form-row {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.join-code-input {
  flex: 1;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  color: #f8fafc;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-align: center;
  text-transform: uppercase;
  font-family: 'Press Start 2P', 'Nunito', cursive;
  transition: all 0.2s ease;
}

.join-code-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.1);
}

.join-code-input::placeholder {
  color: rgba(148, 163, 184, 0.5);
  letter-spacing: 0.1em;
}

.join-button {
  flex: 0 0 auto;
  background: rgba(34, 197, 94, 0.85);
  border: none;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Press Start 2P', 'Nunito', cursive;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  box-shadow: 
    0 4px 8px rgba(34, 197, 94, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.join-button:hover:not(:disabled) {
  background: rgba(34, 197, 94, 1);
  box-shadow: 
    0 6px 12px rgba(34, 197, 94, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.join-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.join-error {
  margin: 0;
  font-size: 0.75rem;
  color: #f87171;
  text-align: center;
  padding: 0.5rem;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
}

.quest-leaderboard {
  padding: 0 1.5rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  position: relative;
}

.leaderboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.leaderboard-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(148, 163, 184, 0.8);
}

.leaderboard-card {
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 18px;
  padding: 0.9rem 1rem;
  box-shadow: 
    0 8px 32px rgba(2, 6, 23, 0.3),
    0 4px 16px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: perspective(1000px) rotateX(1deg);
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.leaderboard-list {
  margin: 0;
  margin-top: 1rem;
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.25rem 0.25rem 1rem 0.25rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(56, 189, 248, 0.4) transparent;
  width: 100%;
  max-width: 100%;
  max-height: none;
  flex-wrap: nowrap;
  box-sizing: border-box;
}

.leaderboard-list::after {
  content: '';
  flex: 0 0 auto;
  width: 0;
}

.leaderboard-list::-webkit-scrollbar {
  height: 6px;
}

.leaderboard-list::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.45), rgba(129, 140, 248, 0.45));
  border-radius: 999px;
}

.leaderboard-list::-webkit-scrollbar-track {
  background: transparent;
}

.leaderboard-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  flex: 0 0 calc((100% - 9 * 0.5rem) / 10);
  min-width: 0;
  width: calc((100% - 9 * 0.5rem) / 10);
  max-width: calc((100% - 9 * 0.5rem) / 10);
  flex-shrink: 0;
  padding: 0.65rem 0.4rem;
  border-radius: 16px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(15, 23, 42, 0.7);
  box-shadow: 
    0 3px 6px rgba(2, 6, 23, 0.2),
    0 2px 3px rgba(2, 6, 23, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transform: perspective(1000px) rotateX(2deg);
  box-sizing: border-box;
}

.leaderboard-item::before {
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

.leaderboard-item:hover::before {
  opacity: 1;
}

.leaderboard-item--answered:hover::before {
  opacity: 0;
}

.leaderboard-item--answered:hover {
  transform: perspective(1000px) rotateX(2deg);
}

.leaderboard-item::after {
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
  border-radius: 16px;
  pointer-events: none;
  opacity: 0.5;
}

.leaderboard-medal {
  position: absolute;
  top: 0.25rem;
  left: 0.25rem;
  font-size: 1.6rem;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  z-index: 2;
  animation: medalGlow 2s ease-in-out infinite;
}

@keyframes medalGlow {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
  }
  50% {
    transform: scale(1.02);
    filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
  }
}

.leaderboard-medal--gold {
  filter: drop-shadow(0 1px 2px rgba(250, 204, 21, 0.3)) drop-shadow(0 0 2px rgba(250, 204, 21, 0.15));
  animation: medalGlowGold 2s ease-in-out infinite;
}

@keyframes medalGlowGold {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 1px 2px rgba(250, 204, 21, 0.3)) drop-shadow(0 0 2px rgba(250, 204, 21, 0.15));
  }
  50% {
    transform: scale(1.01);
    filter: drop-shadow(0 1px 2px rgba(250, 204, 21, 0.35)) drop-shadow(0 0 3px rgba(250, 204, 21, 0.2));
  }
}

.leaderboard-medal--silver {
  filter: drop-shadow(0 1px 2px rgba(203, 213, 225, 0.3)) drop-shadow(0 0 2px rgba(203, 213, 225, 0.15));
}

.leaderboard-medal--bronze {
  filter: drop-shadow(0 1px 2px rgba(180, 83, 9, 0.3)) drop-shadow(0 0 2px rgba(180, 83, 9, 0.15));
}

.leaderboard-item--first {
  border-color: rgba(250, 204, 21, 0.7);
  background: linear-gradient(135deg, rgba(250, 204, 21, 0.15), rgba(15, 23, 42, 0.85));
  box-shadow: 
    0 3px 6px rgba(250, 204, 21, 0.12),
    0 2px 3px rgba(250, 204, 21, 0.1),
    0 1px 2px rgba(250, 204, 21, 0.06),
    0 0 3px rgba(250, 204, 21, 0.08),
    inset 0 3px 6px rgba(255, 255, 255, 0.25),
    inset 0 -3px 6px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transform: perspective(1000px) rotateX(2deg) scale(1.02);
}

.leaderboard-item--first::after {
  background: linear-gradient(
    135deg,
    rgba(250, 204, 21, 0.12) 0%,
    transparent 50%,
    rgba(250, 204, 21, 0.06) 100%
  );
  opacity: 0.5;
}

.leaderboard-item--second {
  border-color: rgba(203, 213, 225, 0.6);
  background: linear-gradient(135deg, rgba(203, 213, 225, 0.12), rgba(15, 23, 42, 0.8));
  box-shadow: 
    0 3px 6px rgba(203, 213, 225, 0.12),
    0 2px 3px rgba(203, 213, 225, 0.1),
    0 1px 2px rgba(203, 213, 225, 0.06),
    0 0 3px rgba(203, 213, 225, 0.08),
    inset 0 2px 4px rgba(255, 255, 255, 0.2),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  transform: perspective(1000px) rotateX(2deg) scale(1.01);
}

.leaderboard-item--second::after {
  background: linear-gradient(
    135deg,
    rgba(203, 213, 225, 0.12) 0%,
    transparent 50%,
    rgba(203, 213, 225, 0.06) 100%
  );
  opacity: 0.5;
}

.leaderboard-item--third {
  border-color: rgba(180, 83, 9, 0.6);
  background: linear-gradient(135deg, rgba(180, 83, 9, 0.12), rgba(15, 23, 42, 0.8));
  box-shadow: 
    0 3px 6px rgba(180, 83, 9, 0.12),
    0 2px 3px rgba(180, 83, 9, 0.1),
    0 1px 2px rgba(180, 83, 9, 0.06),
    0 0 3px rgba(180, 83, 9, 0.08),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  transform: perspective(1000px) rotateX(2deg) scale(1.005);
}

.leaderboard-item--third::after {
  background: linear-gradient(
    135deg,
    rgba(180, 83, 9, 0.12) 0%,
    transparent 50%,
    rgba(180, 83, 9, 0.06) 100%
  );
  opacity: 0.5;
}

.leaderboard-rank {
  font-size: 1.1rem;
  font-weight: 700;
  color: rgba(226, 232, 240, 0.8);
}

.leaderboard-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid rgba(56, 189, 248, 0.4);
  background: rgba(2, 6, 23, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: #f8fafc;
  position: relative;
  z-index: 1;
  box-shadow: 
    inset 0 1px 2px rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);
}

.leaderboard-avatar--placeholder {
  border-style: dashed;
  color: rgba(148, 163, 184, 0.8);
}

.leaderboard-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  position: relative;
  z-index: 1;
}

.leaderboard-name {
  font-size: 0.82rem;
  font-weight: 600;
}

.leaderboard-score {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25rem;
  font-size: 0.68rem;
  color: rgba(148, 163, 184, 0.85);
  letter-spacing: 0.02em;
}

.leaderboard-score strong {
  font-size: 0.95rem;
  color: #f8fafc;
  letter-spacing: 0.03em;
}

.leaderboard-enter-active,
.leaderboard-leave-active {
  transition: transform 0.6s ease, opacity 0.6s ease;
}

.leaderboard-enter-from,
.leaderboard-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.leaderboard-move {
  transition: transform 0.6s ease;
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

.quest-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 2000;
}

.quest-modal {
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

.quest-modal--confirm {
  max-width: 500px;
  padding: 1.9rem;
  gap: 1.5rem;
}

.quest-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.quest-modal__header h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #22d3ee;
}

.quest-modal__close {
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

.quest-modal__close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 211, 238, 0.3);
}

.quest-modal__body {
  color: rgba(226, 232, 240, 0.9);
  line-height: 1.6;
}

.quest-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.quest-modal__actions .secondary,
.quest-modal__actions .danger {
  min-width: 140px;
  padding: 0.75rem 1.5rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
}

.quest-modal__actions .secondary {
  background: rgba(15, 118, 110, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #bae6fd;
}

.quest-modal__actions .secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(34, 211, 238, 0.22);
}

.quest-modal__actions .danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.28);
}

.quest-modal__actions .danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgba(239, 68, 68, 0.32);
}

@media (max-width: 640px) {
  .quest-modal {
    padding: 1.25rem;
  }

  .quest-modal__actions {
    flex-direction: column-reverse;
    align-items: stretch;
  }

  .quest-modal__actions .secondary,
  .quest-modal__actions .danger {
    width: 100%;
  }
}

@media (max-width: 1200px) {
  .empty-round,
  .not-found {
    max-width: 540px;
  }
}

@media (max-width: 768px) {
  .quest-topbar {
    padding: 1rem;
    gap: 1rem;
  }

  .quest-layout {
    flex-direction: column;
    padding: 0 1rem 1rem;
  }

  .quest-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
  }

  .sidebar-card {
    flex: 1 1 240px;
  }

  .quest-topbar-left {
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .topbar-actions {
    width: 100%;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .quest-user-pill {
    width: 100%;
    justify-content: space-between;
  }

  .rounds-nav {
    flex-direction: column;
    align-items: flex-start;
    padding: 0.75rem 1rem;
    gap: 0.5rem;
  }

  .session-chip {
    margin-left: 0;
  }

  .quest-leaderboard {
    padding: 0 1rem 1.25rem;
  }

  .leaderboard-list {
    gap: 0.5rem;
    padding: 0.25rem 0.4rem 0.6rem;
    width: 100%;
  }
}

@media (max-width: 640px) {
  .quest-sidebar {
    flex-direction: column;
  }

  .leaderboard-item {
    padding: 0.55rem 0.7rem;
    flex: 0 0 calc((100% - 9 * 0.5rem) / 10);
    min-width: 100px;
  }

  .leaderboard-name {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .leaderboard-item {
    flex: 1 1 auto;
    min-width: 80px;
  }
}

.leaderboard-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.6), rgba(129, 140, 248, 0.55));
}
</style>

