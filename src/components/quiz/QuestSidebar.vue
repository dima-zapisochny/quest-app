<template>
  <aside class="quest-sidebar">
    <BaseCard>
      <span class="sidebar-chip">{{ t('game.questChip') }}</span>
      <h2 class="sidebar-title">{{ quest.title }}</h2>
      <p v-if="quest.description" class="sidebar-description">{{ quest.description }}</p>
      <p v-else class="sidebar-description sidebar-description--muted">{{ t('game.noDescription') }}</p>
    </BaseCard>

    <BaseCard v-if="session && !isPlayerInSession">
      <span class="sidebar-chip">{{ t('game.joinChip') }}</span>
      <p class="sidebar-description">{{ t('game.joinHint') }}</p>
      <div class="join-form">
        <div class="join-form-row">
          <input
            v-model="joinCodeInput"
            type="text"
            maxlength="4"
            :placeholder="t('landing.codePlaceholder')"
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
    </BaseCard>

    <BaseCard class="sidebar-card--stats">
      <span class="sidebar-chip">{{ t('game.statsChip') }}</span>
      <div class="sidebar-stats">
        <div class="sidebar-stat">
          <span class="sidebar-stat__label">{{ t('game.totalQuestions') }}</span>
          <span class="sidebar-stat__value">{{ questProgress.totalQuestions }}</span>
        </div>
        <div class="sidebar-stat">
          <span class="sidebar-stat__label">{{ t('game.played') }}</span>
          <span class="sidebar-stat__value">{{ questProgress.playedQuestions }}</span>
        </div>
        <div class="sidebar-stat">
          <span class="sidebar-stat__label">{{ t('game.remaining') }}</span>
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
      <BaseButton
        variant="danger-ghost"
        size="sm"
        class="sidebar-reset"
        :disabled="!questProgress.playedQuestions || questProgress.playedQuestions === 0"
        @click="emit('reset')"
      >
        Сбросить прогресс
      </BaseButton>
    </BaseCard>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameSessionStore } from '@/store/gameSessionStore'
import BaseCard from '@/components/common/BaseCard.vue'
import BaseButton from '@/components/common/BaseButton.vue'
import type { Quest, GameSession } from '@/types'

const { t } = useI18n()

const props = defineProps<{
  quest: Quest
  session: GameSession | undefined
}>()

const emit = defineEmits<{ reset: [] }>()

const router = useRouter()
const sessionStore = useGameSessionStore()

const isPlayerInSession = computed(() => {
  const profileId = sessionStore.userProfile?.id
  if (!props.session || !profileId) return false
  return props.session.players.some(player => player.id === profileId)
})

// Статистика «Сыграно» считается по самому квесту сессии (props.quest) — тому же
// источнику, что и плитки доски. Раньше читалось из store по id, но во время игры
// снапшот сессии и store-квест могут расходиться (Realtime-обновления, сброс при
// старте новой партии, неполный store) — и прогресс переставал обновляться.
const questProgress = computed(() => {
  const rounds = props.quest?.rounds
  if (!Array.isArray(rounds)) {
    return { totalRounds: 0, totalQuestions: 0, playedQuestions: 0 }
  }
  const totalQuestions = rounds.reduce((sum, round) => {
    const categories = Array.isArray(round.categories) ? round.categories : []
    return sum + categories.reduce((catSum, cat) => catSum + (cat.questions?.length ?? 0), 0)
  }, 0)
  const playedQuestions = rounds.reduce((sum, round) => {
    const categories = Array.isArray(round.categories) ? round.categories : []
    return sum + categories.reduce((catSum, cat) => catSum + (cat.questions?.filter(qu => qu.played).length ?? 0), 0)
  }, 0)
  return { totalRounds: rounds.length, totalQuestions, playedQuestions }
})

const questProgressPercent = computed(() => {
  const { totalQuestions: total, playedQuestions: played } = questProgress.value
  if (!total) return 0
  return Math.min(100, Math.max(0, Math.round((played / total) * 100)))
})

// --- Присоединиться к игре как участник ---
const joinCodeInput = ref('')
const joinError = ref('')

const canJoin = computed(() => joinCodeInput.value.length === 4 && !joinError.value)

// Автозаполнение кода сессии, если она есть
watch(
  () => props.session?.code,
  (code) => {
    if (code && !isPlayerInSession.value) joinCodeInput.value = code
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
    if (props.session && joinCodeInput.value.toUpperCase() !== props.session.code.toUpperCase()) {
      joinError.value = t('game.errInvalidCode')
      return
    }
    const result = await sessionStore.joinSessionByCode(joinCodeInput.value)
    if (!result || !result.session) {
      joinError.value = t('landing.errNotFound')
      return
    }
    sessionStore.setActivePlayer(result.session.id, result.playerId)
    router.push({ name: 'player-session', params: { sessionId: result.session.id } })
  } catch (error: any) {
    joinError.value = error?.message ?? t('game.errJoin')
  }
}
</script>

<style scoped>
.quest-sidebar {
  flex: 0 0 20%;
  min-width: 220px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Корпус карточки — в BaseCard; здесь только специфика статистики (растягивается) */
.sidebar-card--stats {
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
  color: rgb(var(--c-text));
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
  color: rgb(var(--c-text-soft) / 0.86);
  max-height: 7rem;
  overflow: hidden;
}

.sidebar-description--muted {
  color: rgb(var(--c-text-muted) / 0.65);
}

.sidebar-stats {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex: 1;
  min-height: 0;
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
  color: rgb(var(--c-text-muted) / 0.75);
}

.sidebar-stat__value {
  font-size: 1.25rem;
  font-weight: 700;
  color: rgb(var(--c-gold));
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
  background: rgb(var(--c-surface) / 0.65);
  overflow: hidden;
}

.sidebar-progress__fill {
  display: block;
  height: 100%;
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-indigo)));
  border-radius: inherit;
  transition: width 0.35s ease;
}

.sidebar-progress--quest {
  margin-top: 0.3rem;
}

.sidebar-progress__fill--quest {
  background: linear-gradient(135deg, rgb(var(--c-accent)), #06b6d4);
}

.sidebar-progress__meta {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgb(var(--c-text-muted) / 0.75);
  text-align: center;
}

/* Цвет/размер/disabled — из BaseButton (danger-ghost, sm); здесь только раскладка */
.sidebar-reset {
  align-self: center;
  margin-top: auto;
  letter-spacing: 0.08em;
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
  background: rgb(var(--c-bg) / 0.5);
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  border-radius: 10px;
  padding: 0.65rem 0.85rem;
  color: rgb(var(--c-text));
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
  border-color: rgb(var(--c-accent-sky) / 0.6);
  box-shadow: 0 0 0 3px rgb(var(--c-accent-sky) / 0.1);
}

.join-code-input::placeholder {
  color: rgb(var(--c-text-muted) / 0.5);
  letter-spacing: 0.1em;
}

.join-button {
  flex: 0 0 auto;
  background: rgb(var(--c-success) / 0.85);
  border: none;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  color: rgb(var(--c-white));
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  box-shadow:
    0 4px 8px rgb(var(--c-success) / 0.3),
    inset 0 1px 2px rgb(var(--c-white) / 0.2);
}

.join-button:hover:not(:disabled) {
  background: rgb(var(--c-success) / 1);
  box-shadow:
    0 6px 12px rgb(var(--c-success) / 0.4),
    inset 0 1px 2px rgb(var(--c-white) / 0.25);
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
  color: rgb(var(--c-danger-light));
  text-align: center;
  padding: 0.5rem;
  background: rgb(var(--c-danger) / 0.1);
  border: 1px solid rgb(var(--c-danger) / 0.3);
  border-radius: 8px;
}
</style>
