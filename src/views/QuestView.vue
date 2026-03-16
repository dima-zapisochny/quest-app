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

    <section v-if="!isMobileViewport && activeRound && leaderboardEntries.length" class="quest-leaderboard">
      <div class="leaderboard-card">
        <header class="leaderboard-header">
          <span class="leaderboard-label">Участники</span>
        </header>
        <TransitionGroup name="leaderboard" tag="ul" class="leaderboard-list">
          <li
            v-for="(player, index) in leaderboardEntries"
            :key="player.id"
            class="leaderboard-item-wrap"
            @mouseenter="(e) => setPopoverAnchor(player.id, e.currentTarget as HTMLElement)"
            @mouseleave="clearPopoverAnchor()"
          >
            <div
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
            </div>
          </li>
        </TransitionGroup>
      </div>
    </section>

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

  <!-- Мини-окно участника поверх полосы с участниками -->
  <teleport to="body">
    <Transition name="popover">
      <div
        v-if="hoveredPlayer && popoverAnchor"
        class="participant-popover participant-popover--fixed"
        :style="{
          left: `${popoverAnchor.left}px`,
          top: `${popoverAnchor.top}px`
        }"
        @mouseenter="cancelClearPopoverAnchor()"
        @mouseleave="clearPopoverAnchor()"
      >
        <div class="participant-popover__header">
          <span class="participant-popover__avatar">{{ hoveredPlayer.avatar || hoveredPlayer.name.charAt(0).toUpperCase() }}</span>
          <div class="participant-popover__info">
            <span class="participant-popover__name">{{ hoveredPlayer.name }}</span>
            <span class="participant-popover__score">{{ hoveredPlayer.score.toLocaleString('ru-RU') }} баллов</span>
          </div>
        </div>
        <div class="participant-popover__actions">
          <p class="participant-popover__label">Шаг (кратно 5):</p>
          <div class="participant-popover__step-select">
            <button
              v-for="step in STEP_OPTIONS"
              :key="step"
              type="button"
              class="participant-popover__btn participant-popover__btn--step"
              :class="{ 'participant-popover__btn--step-active': selectedStep === step }"
              :disabled="hoveredPlayer.score < step"
              @click.stop="selectedStep = step"
            >{{ step }}</button>
          </div>
          <p class="participant-popover__sublabel participant-popover__sublabel--minus">Отнять баллы</p>
          <button
            type="button"
            class="participant-popover__btn participant-popover__btn--subtract"
            :disabled="hoveredPlayer.score < selectedStep"
            @click.stop="subtractScore(hoveredPlayer.id)"
          >
            <span class="participant-popover__btn-icon">−</span> Отнять {{ selectedStep }} баллов
          </button>
          <p class="participant-popover__sublabel participant-popover__sublabel--plus">Прибавить баллы</p>
          <button
            type="button"
            class="participant-popover__btn participant-popover__btn--add"
            @click.stop="addScore(hoveredPlayer.id)"
          >
            <span class="participant-popover__btn-icon">+</span> Прибавить {{ selectedStep }} баллов
          </button>
          <p class="participant-popover__label">Задать баллы вручную:</p>
          <div class="participant-popover__manual">
            <input
              v-model.number="manualScoreInput"
              type="number"
              min="0"
              step="5"
              class="participant-popover__input"
              placeholder="0"
              @keydown.enter="handleApplyClick()"
            />
            <button type="button" class="participant-popover__btn participant-popover__btn--apply" @click.stop="handleApplyClick()">Применить</button>
          </div>
        </div>
      </div>
    </Transition>
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
import { computed, watch, onMounted, onBeforeUnmount, ref, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import QuizBoard from '@/components/quiz/QuizBoard.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import { useIsMobileViewport } from '@/composables/useIsMobileViewport'

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
const sessionId = computed(() => session.value?.id)
const showExitConfirm = ref(false)
const showResetConfirm = ref(false)
const isExiting = ref(false)

const userProfile = computed(() => sessionStore.userProfile)

// avatarEmojiMap используется для leaderboard
const avatarEmojiMap: Record<string, string> = {
  fox: '🦊', panda: '🐼', tiger: '🐯', owl: '🦉', whale: '🐳', parrot: '🦜',
  koala: '🐨', dino: '🦕', crocodile: '🐊', lion: '🦁', penguin: '🐧',
  elephant: '🐘', seal: '🦭', hedgehog: '🦔', lily: '🌸'
}

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
  { id: 'mock-player-15', name: 'Таня', avatar: '🦢', score: 1390 },
  { id: 'mock-player-16', name: 'Ульяна', avatar: '🌸', score: 1280 },
  { id: 'mock-player-17', name: 'Федор', avatar: '🐺', score: 1170 },
  { id: 'mock-player-18', name: 'Хлоя', avatar: '🐱', score: 1060 },
  { id: 'mock-player-19', name: 'Цветан', avatar: '🦎', score: 950 },
  { id: 'mock-player-20', name: 'Юлия', avatar: '🐰', score: 840 }
]

const leaderboardState = ref<LeaderboardEntry[]>([])
const hoveredPlayerId = ref<string | null>(null)
const manualScoreInput = ref(0)
const selectedStep = ref(5)
const STEP_OPTIONS = [5, 10, 15, 20] as const
const selectedScoreAction = ref<'subtract' | 'add' | null>(null)
const popoverAnchor = ref<{ left: number; top: number } | null>(null)
let leavePopoverTimeout: ReturnType<typeof setTimeout> | null = null

function setPopoverAnchor(playerId: string, el: HTMLElement) {
  if (leavePopoverTimeout) {
    clearTimeout(leavePopoverTimeout)
    leavePopoverTimeout = null
  }
  hoveredPlayerId.value = playerId
  selectedScoreAction.value = null
  const rect = el.getBoundingClientRect()
  popoverAnchor.value = { left: rect.left + rect.width / 2, top: rect.top }
}

function clearPopoverAnchor() {
  leavePopoverTimeout = setTimeout(() => {
    hoveredPlayerId.value = null
    popoverAnchor.value = null
    leavePopoverTimeout = null
  }, 120)
}

function cancelClearPopoverAnchor() {
  if (leavePopoverTimeout) {
    clearTimeout(leavePopoverTimeout)
    leavePopoverTimeout = null
  }
}

const hoveredPlayer = computed(() =>
  hoveredPlayerId.value ? leaderboardEntries.value.find(p => p.id === hoveredPlayerId.value) ?? null : null
)

watch(hoveredPlayerId, (id) => {
  if (id) {
    const entry = leaderboardEntries.value.find(e => e.id === id)
    manualScoreInput.value = entry ? entry.score : 0
  }
})

function updateLeaderboardScore(playerId: string, newScore: number) {
  const list = leaderboardState.value.map(p =>
    p.id === playerId ? { ...p, score: newScore } : { ...p }
  )
  // Присваиваем новый массив для гарантированной реактивности Vue
  leaderboardState.value = [...list]
}

async function subtractScore(playerId: string, amount?: number) {
  const value = amount ?? selectedStep.value
  const entry = leaderboardEntries.value.find(e => e.id === playerId)
  if (!entry) return
  const newScore = Math.max(0, entry.score - value)
  updateLeaderboardScore(playerId, newScore)
  const playerInSession = session.value?.players?.some(p => p.id === playerId)
  if (session.value && playerInSession) {
    await sessionStore.setPlayerScore(session.value.id, playerId, newScore)
    await nextTick()
    buildLeaderboardFromSession()
  }
}

async function addScore(playerId: string, amount?: number) {
  const value = amount ?? selectedStep.value
  const entry = leaderboardEntries.value.find(e => e.id === playerId)
  if (!entry) return
  const newScore = entry.score + value
  updateLeaderboardScore(playerId, newScore)
  const playerInSession = session.value?.players?.some(p => p.id === playerId)
  if (session.value && playerInSession) {
    await sessionStore.setPlayerScore(session.value.id, playerId, newScore)
    await nextTick()
    buildLeaderboardFromSession()
  }
}

async function applyManualScore(playerId: string) {
  const newScore = Math.max(0, Math.round(manualScoreInput.value))
  // Сразу обновляем карточку (оптимистичное обновление)
  updateLeaderboardScore(playerId, newScore)
  const playerInSession = session.value?.players?.some(p => p.id === playerId)
  if (session.value && playerInSession) {
    await sessionStore.setPlayerScore(session.value.id, playerId, newScore)
    await nextTick()
    buildLeaderboardFromSession()
  }
  // В мок-режиме (fallback-список) не вызываем buildLeaderboardFromSession — иначе перезапишет счёт
}

/** Применить: если введено другое число — задать баллы; иначе отнять выбранный шаг (−5/−10/−15/−20) */
function handleApplyClick() {
  if (!hoveredPlayer.value) return
  const currentScore = hoveredPlayer.value.score
  const manualScore = Math.max(0, Math.round(manualScoreInput.value))
  if (manualScore !== currentScore) {
    applyManualScore(hoveredPlayer.value.id)
  } else {
    subtractScore(hoveredPlayer.value.id)
  }
}

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

// Статистика «Сыграно» из store (обновляется при markQuestionAsPlayed), чтобы счётчик совпадал с карточками
const questProgress = computed(() => {
  if (questId.value) {
    return quizStore.getQuestProgress(questId.value)
  }
  const q = quest.value
  if (!q || !Array.isArray(q.rounds)) {
    return { totalRounds: 0, totalQuestions: 0, playedQuestions: 0 }
  }
  const totalRounds = q.rounds.length
  const totalQuestions = q.rounds.reduce((sum, round) => {
    const categories = Array.isArray(round.categories) ? round.categories : []
    return sum + categories.reduce((catSum, cat) => catSum + (cat.questions?.length ?? 0), 0)
  }, 0)
  const playedQuestions = q.rounds.reduce((sum, round) => {
    const categories = Array.isArray(round.categories) ? round.categories : []
    return (
      sum +
      categories.reduce(
        (catSum, cat) => catSum + (cat.questions?.filter(qu => qu.played).length ?? 0),
        0
      )
    )
  }, 0)
  return { totalRounds, totalQuestions, playedQuestions }
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
    if (isMockSession.value && leaderboardState.value.length > 0) return
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
    if (isMockSession.value && leaderboardState.value.length > 0) return
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
    // В мок-режиме не перезаписывать лидерборд — там уже могут быть ручные правки баллов
    if (isMockSession.value && leaderboardState.value.length > 0) return
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

  // Встановити активний раунд для сесії, якщо ще не встановлено
  if (session.value && !session.value.roundId && quest.value?.rounds?.length) {
    sessionStore.setActiveRound(session.value.id, quest.value.rounds[0].id)
  }

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
    const qid = questId.value
    try {
      // Сначала удаляем сессию, чтобы syncSessionQuestSnapshot не пытался обновить уже удалённую сессию
      await sessionStore.deleteSession(sid)
      console.log('🔴 [Lifecycle] Session closed:', sid)
      sessionStore.clearActivePlayer()
      if (qid) {
        await quizStore.resetQuestProgress(qid)
      }
    } catch (error) {
      console.error('Error closing session or resetting progress:', error)
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
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  align-self: flex-start;
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgba(94, 234, 212, 0.8);
}

.sidebar-title {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0;
  font-size: clamp(1.2rem, 2.5vw, 1.6rem);
  font-weight: 600;
  color: #f8fafc;
  line-height: 1.25;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.sidebar-description {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
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
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
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
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
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
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  width: 100%;
  box-sizing: border-box;
  overflow: visible;
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

.leaderboard-item-wrap {
  position: relative;
  flex: 0 0 calc((100% - 9 * 0.5rem) / 10);
  width: calc((100% - 9 * 0.5rem) / 10);
  max-width: calc((100% - 9 * 0.5rem) / 10);
  min-width: 0;
  flex-shrink: 0;
  list-style: none;
}

.leaderboard-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  padding: 0.65rem 0.4rem;
  border-radius: 16px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(15, 23, 42, 0.7);
  box-shadow: 
    0 3px 6px rgba(2, 6, 23, 0.2),
    0 2px 3px rgba(2, 6, 23, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
  /* без transform і backdrop-filter — усуває фіолетовий артефакт при скролі */
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

/* Мини-окно при наведении на участника — поверх полосы с участниками */
.participant-popover {
  min-width: 220px;
  z-index: 500;
  background: linear-gradient(165deg, rgba(30, 41, 59, 0.98), rgba(15, 23, 42, 0.98));
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 14px;
  padding: 0.85rem 1rem;
  box-shadow:
    0 12px 40px rgba(0, 0, 0, 0.4),
    0 4px 16px rgba(56, 189, 248, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  pointer-events: auto;
}

.participant-popover--fixed {
  position: fixed;
  transform: translate(-50%, calc(-100% - 10px));
  left: 0;
  top: 0;
}

.participant-popover__header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.6rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
}

.participant-popover__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.participant-popover__info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.participant-popover__name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #f1f5f9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.participant-popover__score {
  font-size: 0.8rem;
  color: #22d3ee;
  font-weight: 600;
}

.participant-popover__actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.participant-popover__label {
  margin: 0;
  font-size: 0.7rem;
  color: rgba(148, 163, 184, 0.9);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.participant-popover__sublabel {
  margin: 0.25rem 0 0.15rem;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.participant-popover__sublabel--minus {
  color: #f87171;
}

.participant-popover__sublabel--plus {
  color: #4ade80;
}

.participant-popover__btn-icon {
  display: inline-block;
  min-width: 1.1em;
  font-weight: 800;
  opacity: 0.95;
}

.participant-popover__step-select {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.participant-popover__btn--step {
  min-width: 2.5rem;
}

.participant-popover__btn--step-active {
  background: rgba(56, 189, 248, 0.35);
  border-color: rgba(56, 189, 248, 0.85);
  color: #22d3ee;
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35);
  font-weight: 700;
}

.participant-popover__btn {
  padding: 0.35rem 0.6rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  background: rgba(15, 23, 42, 0.8);
  color: #e2e8f0;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s;
}

.participant-popover__btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.5);
}

.participant-popover__btn--subtract {
  width: 100%;
  margin-top: 0.15rem;
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.6);
  color: #fecaca;
}

.participant-popover__btn--subtract:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.35);
  border-color: rgba(239, 68, 68, 0.8);
}

.participant-popover__btn--add {
  width: 100%;
  margin-top: 0.15rem;
  background: rgba(34, 197, 94, 0.25);
  border-color: rgba(34, 197, 94, 0.6);
  color: #86efac;
}

.participant-popover__btn--add:hover:not(:disabled) {
  background: rgba(34, 197, 94, 0.4);
  border-color: rgba(34, 197, 94, 0.85);
}

.participant-popover__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.participant-popover__btn--apply {
  background: rgba(34, 211, 238, 0.2);
  color: #22d3ee;
}

.participant-popover__btn--apply:hover {
  background: rgba(34, 211, 238, 0.3);
}

.participant-popover__manual {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.participant-popover__input {
  width: 72px;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.8);
  color: #f8fafc;
  -moz-appearance: textfield;
  box-sizing: border-box;
}

.participant-popover__input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
}

.participant-popover__input::-webkit-inner-spin-button,
.participant-popover__input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.popover-enter-active,
.popover-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-100% - 14px));
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
  .quest-view {
    padding: 0 1rem 0;
  }

  .quest-layout {
    flex-direction: column;
    padding: 0 0.75rem 1rem;
    gap: 1.5rem;
  }

  .quest-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: space-between;
    min-width: 100%;
  }

  .sidebar-card {
    flex: 1 1 240px;
    padding: 0.75rem 0.85rem;
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

  .quest-leaderboard {
    padding: 0 0.75rem 1rem;
  }

  .leaderboard-list {
    gap: 0.5rem;
    padding: 0.25rem 0.4rem 0.6rem;
    width: 100%;
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

  .quest-sidebar {
    flex-direction: column;
    gap: 0.6rem;
  }

  .sidebar-card {
    flex: 1 1 auto;
    padding: 0.65rem 0.75rem;
  }

  .round-chip {
    min-width: 120px;
    font-size: 0.65rem;
    font-weight: 700;
    padding: 0.4rem 0.75rem;
    min-height: 36px;
  }

  .leaderboard-item-wrap {
    flex: 0 0 calc((100% - 9 * 0.5rem) / 10);
    min-width: 100px;
  }

  .leaderboard-item {
    padding: 0.55rem 0.7rem;
  }

  .leaderboard-name {
    font-size: 0.8rem;
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

  .sidebar-card {
    padding: 0.6rem 0.65rem;
    gap: 0.5rem;
    border-radius: 14px;
  }

  .quest-leaderboard {
    padding: 0 0.5rem 0.875rem;
  }

  .leaderboard-list {
    gap: 0.4rem;
    padding: 0.2rem 0.3rem 0.5rem;
  }

  .leaderboard-item-wrap {
    flex: 1 1 auto;
    min-width: 80px;
  }

  .leaderboard-item {
    padding: 0.5rem 0.6rem;
  }

  .leaderboard-name {
    font-size: 0.75rem;
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

  .sidebar-card {
    padding: 0.55rem 0.6rem;
    border-radius: 12px;
  }

  .quest-leaderboard {
    padding: 0 0.375rem 0.75rem;
  }

  .leaderboard-list {
    gap: 0.35rem;
    padding: 0.15rem 0.25rem 0.45rem;
  }

  .leaderboard-item-wrap {
    min-width: 70px;
  }

  .leaderboard-item {
    padding: 0.45rem 0.5rem;
  }

  .leaderboard-name {
    font-size: 0.7rem;
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

  .sidebar-card {
    padding: 0.5rem 0.55rem;
  }

  .quest-leaderboard {
    padding: 0 0.25rem 0.625rem;
  }

  .leaderboard-list {
    gap: 0.3rem;
    padding: 0.15rem 0.2rem 0.4rem;
  }

  .leaderboard-item-wrap {
    min-width: 60px;
  }

  .leaderboard-item {
    padding: 0.4rem 0.45rem;
  }

  .leaderboard-name {
    font-size: 0.65rem;
  }
}

.leaderboard-list::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, rgba(34, 211, 238, 0.6), rgba(129, 140, 248, 0.55));
}
</style>

