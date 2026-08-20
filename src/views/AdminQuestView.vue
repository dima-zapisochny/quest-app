<template>
  <div v-if="quest" class="admin-quest-view">
    <AppHeader
      button-variant="back"
      button-label="Назад"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <div class="stats-capsule">
      <span class="stat-chip">
        <span class="stat-chip__label">Раундов</span>
        <span class="stat-chip__value">{{ Array.isArray(quest.rounds) ? quest.rounds.length : 0 }}/5</span>
      </span>
      <span class="stats-capsule__divider" aria-hidden="true"></span>
      <span class="stat-chip">
        <span class="stat-chip__label">Вопросов</span>
        <span class="stat-chip__value">{{ questStats.totalQuestions }}</span>
      </span>
      <transition name="save-pill">
        <span
          v-if="store.saveState !== 'idle'"
          class="save-icon"
          :class="`save-icon--${store.saveState}`"
          :title="store.saveState === 'saving' ? 'Сохраняем…' : 'Сохранено'"
          :aria-label="store.saveState === 'saving' ? 'Сохраняем' : 'Сохранено'"
          aria-live="polite"
        >
          <span v-if="store.saveState === 'saving'" class="save-icon__spinner" aria-hidden="true"></span>
          <svg v-else class="save-icon__check" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
      </transition>
    </div>

    <header class="quest-toolbar">
      <div class="toolbar-fields">
        <label class="toolbar-label" for="quest-title">Название квеста</label>
        <input
          id="quest-title"
          v-model="questTitle"
          class="toolbar-input"
          placeholder="Название квеста"
        />
        <label class="toolbar-label" for="quest-description">Описание</label>
        <textarea
          id="quest-description"
          v-model="questDescription"
          rows="2"
          class="toolbar-textarea"
          placeholder="Короткое описание для ведущего и игроков"
        ></textarea>

        <button
          class="danger-btn toolbar-delete-btn"
          type="button"
          title="Удалить квест"
          aria-label="Удалить квест"
          @click="handleDeleteQuest"
        >
          Удалить квест
        </button>
      </div>
    </header>

    <section class="rounds-panel">
      <div class="round-tabs">
        <button
          v-for="(round, index) in quest.rounds"
          :key="round.id"
          :class="['round-tab', { 'round-tab--active': editingRoundId === round.id }]"
          type="button"
          @click="editingRoundId = round.id"
        >
          Раунд {{ index + 1 }}
        </button>
        <button
          v-if="roundsCount < 5"
          class="round-tab round-tab--add"
          type="button"
          :disabled="isAddingRound"
          aria-label="Добавить раунд"
          @click="handleAddRound"
        >
          <span v-if="!isAddingRound">+ Раунд</span>
          <span v-else class="mini-loader"></span>
        </button>
      </div>

      <p v-if="roundsCount === 0" class="panel-empty">
        Пока нет раундов. Создайте первый, чтобы добавить категории и вопросы.
      </p>

      <QuestBoardEditor
        v-if="editingRound"
        :quest-id="quest.id"
        :round="editingRound"
        @delete-round="handleDeleteCurrentRound"
      />
    </section>
  </div>
  <div v-else-if="showLoading" class="not-found admin-quest-loading">
    <div class="loader"></div>
    <p>Загрузка квеста…</p>
  </div>
  <div v-else class="not-found">
    <h1>Квест не найден</h1>
    <BackLink to="/host/setup">Вернуться к списку квестов</BackLink>
  </div>

  <ConfirmDialog
    :show="confirmModal.visible"
    :title="confirmModal.title"
    :message="confirmModal.message"
    :confirm-label="confirmModal.confirmLabel"
    :confirm-variant="confirmModal.kind === 'info' ? 'secondary' : 'danger'"
    :hide-cancel="confirmModal.kind === 'info'"
    @confirm="confirmModalAction"
    @cancel="cancelConfirmModal"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import QuestBoardEditor from '@/components/admin/QuestBoardEditor.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import BackLink from '@/components/common/BackLink.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

interface Props {
  questId: string
}

const props = defineProps<Props>()
const router = useRouter()
const store = useQuizStore()
const sessionStore = useGameSessionStore()

const quest = computed(() => store.getQuestById(props.questId))

const isLoadingFullQuest = ref(false)
// id квеста, для которого уже подгружены полные данные (раунды/категории/вопросы).
// Легковесный элемент списка приходит с rounds: [] — поэтому опираться на наличие
// rounds нельзя, иначе полный квест никогда не догрузится и доска будет пустой.
const fullyLoadedId = ref<string | null>(null)
const showLoading = computed(() => {
  if (store.isLoading) return true
  if (isLoadingFullQuest.value) return true
  if (fullyLoadedId.value === props.questId) return false
  if (quest.value) return true
  if (!sessionStore.userProfile?.id) return false
  if (store.quests.length > 0) return false
  return true
})

const editingRoundId = ref<string | null>(null)
const isAddingRound = ref(false)
const newlyAddedRoundId = ref<string | null>(null)

const editingRound = computed(() => {
  if (!quest.value?.rounds || !editingRoundId.value) return null
  return quest.value.rounds.find(round => round.id === editingRoundId.value) ?? null
})

const roundsCount = computed(() => quest.value?.rounds?.length ?? 0)

const userProfile = computed(() => sessionStore.userProfile)

const questTitle = computed({
  get: () => quest.value?.title ?? '',
  set: value => {
    if (quest.value) {
      store.updateQuest(quest.value.id, { title: value })
    }
  }
})

const questDescription = computed({
  get: () => quest.value?.description ?? '',
  set: value => {
    if (quest.value) {
      store.updateQuest(quest.value.id, { description: value })
    }
  }
})

const questStats = computed(() => {
  if (!quest.value) {
    return { totalQuestions: 0, playedQuestions: 0 }
  }
  const stats = store.getQuestProgress(quest.value.id)
  return {
    totalQuestions: stats.totalQuestions ?? 0,
    playedQuestions: stats.playedQuestions ?? 0
  }
})

// Завантажуємо список квестів (якщо ще не завантажено) і повний квест для редагування
async function loadQuestIfNeeded() {
  if (!props.questId) return
  if (!quest.value) {
    await store.loadFromStorage()
  }
  // Догружаем полный квест ровно один раз на каждый questId. Проверять rounds
  // недостаточно: у элемента списка rounds — пустой массив, а не undefined.
  if (fullyLoadedId.value !== props.questId) {
    isLoadingFullQuest.value = true
    try {
      await store.loadQuestFull(props.questId)
      fullyLoadedId.value = props.questId
    } finally {
      isLoadingFullQuest.value = false
    }
  }
}

/** Периодическое сохранение в БД (дебаунс в store; тут только принудительный flush раз в N сек) */
const AUTO_SAVE_INTERVAL_MS = 60_000
let autoSaveTimerId: ReturnType<typeof setInterval> | null = null

async function saveFullQuest() {
  const q = quest.value
  if (!q) return
  try {
    store.replaceQuest(q)
    await store.flushSave()
    console.log('[AdminQuest] Квест збережено:', q.title || q.id)
  } catch (e) {
    console.warn('[AdminQuest] Auto-save failed:', e)
  }
}

onMounted(() => {
  loadQuestIfNeeded()
  autoSaveTimerId = setInterval(saveFullQuest, AUTO_SAVE_INTERVAL_MS)
  // Для консоли: сохранить текущий квест (полезно при отладке)
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    ;(window as unknown as { __saveCurrentQuest?: () => Promise<void> }).__saveCurrentQuest = saveFullQuest
  }
})

onBeforeUnmount(() => {
  if (autoSaveTimerId) {
    clearInterval(autoSaveTimerId)
    autoSaveTimerId = null
  }
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    delete (window as unknown as { __saveCurrentQuest?: () => Promise<void> }).__saveCurrentQuest
  }
})

// Отслеживаем изменение questId в маршруте
watch(
  () => props.questId,
  async () => {
    await loadQuestIfNeeded()
  },
  { immediate: true }
)

// Используем watchEffect для мгновенной реакции на изменения
watchEffect(() => {
  const rounds = quest.value?.rounds
  
  // Если мы только что создали раунд, устанавливаем его как активный
  if (newlyAddedRoundId.value && rounds?.some(round => round.id === newlyAddedRoundId.value)) {
    editingRoundId.value = newlyAddedRoundId.value
    newlyAddedRoundId.value = null
    return
  }
  
  // Игнорируем watch, если мы только что создали раунд
  if (isAddingRound.value) return
  
  if (!rounds || rounds.length === 0) {
    editingRoundId.value = null
    return
  }
  // Не перезаписываем, если раунд уже выбран и существует
  if (editingRoundId.value && rounds.some(round => round.id === editingRoundId.value)) {
    return
  }
  // Устанавливаем первый раунд только если ничего не выбрано
  if (!editingRoundId.value) {
    editingRoundId.value = rounds[0].id
  }
})

async function handleAddRound() {
  if (!quest.value) return
  const currentRounds = Array.isArray(quest.value.rounds) ? quest.value.rounds : []
  const baseTitle = `Раунд ${currentRounds.length + 1}`
  isAddingRound.value = true
  try {
    const newRoundId = await store.addRound(quest.value.id, baseTitle)
    // Сохраняем ID нового раунда для watchEffect
    newlyAddedRoundId.value = newRoundId
    // Устанавливаем сразу после получения ID (элемент уже в массиве после push)
    editingRoundId.value = newRoundId
    // Сбрасываем флаг сразу
    isAddingRound.value = false
  } catch (error) {
    isAddingRound.value = false
    newlyAddedRoundId.value = null
    throw error
  }
}

// Единая модалка подтверждения вместо нативного confirm()/alert() (#33)
const confirmModal = ref<{
  visible: boolean
  kind: 'round' | 'quest' | 'info'
  roundId: string | null
  title: string
  message: string
  confirmLabel: string
}>({ visible: false, kind: 'info', roundId: null, title: '', message: '', confirmLabel: 'ОК' })

function handleDeleteRound(roundId: string) {
  if (!quest.value) return
  confirmModal.value = {
    visible: true, kind: 'round', roundId,
    title: 'Удалить раунд?', message: 'Раунд и все его категории будут удалены.',
    confirmLabel: 'Удалить'
  }
}

function cancelConfirmModal() {
  confirmModal.value = { ...confirmModal.value, visible: false }
}

async function confirmModalAction() {
  const { kind, roundId } = confirmModal.value
  if (kind === 'info') { cancelConfirmModal(); return }
  cancelConfirmModal()
  if (!quest.value) return
  if (kind === 'round' && roundId) {
    store.deleteRound(quest.value.id, roundId)
    if (editingRoundId.value === roundId) {
      editingRoundId.value = quest.value.rounds?.[0]?.id ?? null
    }
  } else if (kind === 'quest') {
    try {
      await store.deleteQuest(quest.value.id)
      router.push('/host/setup')
    } catch (err) {
      confirmModal.value = {
        visible: true, kind: 'info', roundId: null,
        title: 'Не удалось удалить квест',
        message: (err as Error)?.message ?? 'Попробуйте ещё раз.',
        confirmLabel: 'Понятно'
      }
    }
  }
}

function handleDeleteCurrentRound() {
  if (!editingRoundId.value) return
  handleDeleteRound(editingRoundId.value)
}

function handleDeleteQuest() {
  if (!quest.value) return
  confirmModal.value = {
    visible: true, kind: 'quest', roundId: null,
    title: 'Удалить квест целиком?', message: 'Это действие нельзя отменить.',
    confirmLabel: 'Удалить'
  }
}

function goBack() {
  // Всегда переходим на страницу управления квестами, без router.back(), чтобы не попасть на внешние URL (например /rest/v1/quests)
  router.push('/host/setup')
}
</script>

<style scoped>
/* Индикатор автосохранения — только иконка, без текста */
.save-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 50%;
  flex-shrink: 0;
}
.save-icon--saving {
  background: rgb(var(--c-text-muted) / 0.14);
}
.save-icon--saved {
  background: rgb(var(--c-success));
  color: rgb(var(--c-white));
  box-shadow: 0 2px 10px rgb(var(--c-success) / 0.45);
  animation: save-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.save-icon__spinner {
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 50%;
  border: 2px solid rgb(var(--c-text-muted) / 0.35);
  border-top-color: rgb(var(--c-text-muted));
  animation: save-spin 0.7s linear infinite;
}
.save-icon__check {
  width: 1rem;
  height: 1rem;
}
.save-icon__check path {
  stroke-dasharray: 26;
  stroke-dashoffset: 26;
  animation: save-draw 0.4s ease 0.1s forwards;
}
@keyframes save-spin {
  to { transform: rotate(360deg); }
}
@keyframes save-pop {
  0% { transform: scale(0.4); }
  100% { transform: scale(1); }
}
@keyframes save-draw {
  to { stroke-dashoffset: 0; }
}
/* Появление/скрытие иконки */
.save-pill-enter-active,
.save-pill-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.save-pill-enter-from,
.save-pill-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

.admin-quest-view {
  min-height: 100dvh;
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
  padding: 0 clamp(1.25rem, 4vw, 3.5rem) 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  color: rgb(var(--c-text-soft));
}

.quest-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(1rem, 4vw, 2.5rem);
  background: rgb(var(--c-bg) / 0.78);
  border-radius: 24px;
  padding: clamp(1rem, 3vw, 1.8rem);
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  box-shadow: 0 26px 52px rgb(var(--c-sky-deep) / 0.42);
  backdrop-filter: blur(12px);
}

.toolbar-delete-btn {
  justify-self: center;
  min-width: 240px;
  /* отступ от описания до кнопки = паддинг блока (минус gap грида) */
  margin-top: calc(clamp(1rem, 3vw, 1.8rem) - 0.6rem);
}

.toolbar-fields {
  flex: 1 1 0;
  display: grid;
  gap: 0.6rem;
  align-content: start;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.toolbar-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgb(var(--c-text-muted) / 0.7);
  padding-left: 0.2rem;
  display: block;
}

.toolbar-input,
.toolbar-textarea {
  width: 100%;
  box-sizing: border-box;
  background: rgb(var(--c-bg) / 0.62);
  border: 1px solid rgb(var(--c-blue) / 0.25);
  border-radius: 18px;
  padding: 0.75rem 1rem;
  color: rgb(var(--c-text));
  font-size: 1rem;
  font-weight: 600;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.toolbar-textarea {
  font-weight: 500;
  resize: vertical;
}

.toolbar-input::placeholder,
.toolbar-textarea::placeholder {
  color: rgb(var(--c-text-soft) / 0.6);
}

.toolbar-input:focus,
.toolbar-textarea:focus {
  outline: none;
  border-color: rgb(var(--c-accent-sky) / 0.6);
  box-shadow: 0 0 0 3px rgb(var(--c-accent-sky) / 0.25);
}

/* Капсула статистики над блоком названия — по центру, не на всю ширину */
.stats-capsule {
  align-self: center;
  display: inline-flex;
  align-items: center;
  gap: 1.15rem;
  flex-wrap: wrap;
  justify-content: center;
  padding: 0.85rem 1.9rem;
  border-radius: var(--radius-pill);
  background: rgb(var(--c-bg) / 0.72);
  border: 1px solid rgb(var(--c-accent-sky) / 0.2);
  box-shadow: 0 14px 32px rgb(var(--c-sky-deep) / 0.3);
  backdrop-filter: blur(10px);
}
.stats-capsule__divider {
  width: 1px;
  height: 1.1rem;
  background: rgb(var(--c-accent-sky) / 0.25);
}

.stat-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  color: rgb(var(--c-accent-soft));
}
.stat-chip__label {
  font-size: 0.8rem;
  letter-spacing: 0.01em;
  opacity: 0.85;
}
.stat-chip__value {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* Единый стиль опасной кнопки (Удалить квест / Удалить раунд) */
.danger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.6rem 1.4rem;
  line-height: 1.2;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-danger) / 0.45);
  background: rgb(var(--c-danger) / 0.12);
  color: rgb(var(--c-danger-soft));
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.danger-btn:hover {
  transform: translateY(-1px);
  background: rgb(var(--c-danger) / 0.2);
  box-shadow: 0 12px 26px rgb(var(--c-danger) / 0.22);
}

.rounds-panel {
  background: rgb(var(--c-bg) / 0.72);
  border-radius: 24px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.16);
  padding: clamp(1rem, 3vw, 1.8rem);
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
  box-shadow: 0 24px 46px rgb(var(--c-sky-deep) / 0.35);
}

.round-tabs {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.round-tab {
  padding: 0.6rem 1.4rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.2);
  background: rgb(var(--c-bg) / 0.55);
  color: rgb(var(--c-text-soft) / 0.8);
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}

.round-tab:hover {
  border-color: rgb(var(--c-accent-sky) / 0.4);
  transform: translateY(-1px);
}

.round-tab--active {
  border-color: transparent;
  background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent)));
  color: rgb(var(--c-bg));
  box-shadow: none;
}
.round-tab--active:hover {
  transform: none;
}

.round-tab--add {
  border-style: dashed;
  border-color: rgb(var(--c-accent-sky) / 0.3);
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.7);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}
.round-tab--add:hover {
  color: rgb(var(--c-accent-soft));
  border-color: rgb(var(--c-accent-sky) / 0.5);
}

.round-tab--add:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.panel-empty {
  margin: 0;
  padding: 1.1rem;
  border-radius: 18px;
  border: 1px dashed rgb(var(--c-text-muted) / 0.35);
  color: rgb(var(--c-text-soft) / 0.75);
  text-align: center;
  font-size: 0.9rem;
  background: rgb(var(--c-bg) / 0.55);
}

.mini-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgb(var(--c-accent-soft) / 0.3);
  border-top-color: rgb(var(--c-accent-soft));
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.not-found {
  min-height: 100dvh;
  background: linear-gradient(160deg, rgb(var(--c-bg)) 0%, #1f2937 45%, #0b1120 100%);
  color: rgb(var(--c-text-soft));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.admin-quest-loading {
  gap: 1.25rem;
}
.admin-quest-loading p {
  margin: 0;
  color: rgb(var(--c-text-muted));
  font-size: 1rem;
}

.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid rgb(var(--c-accent-sky) / 0.25);
  border-top-color: rgb(var(--c-accent-sky));
  animation: spin 0.8s linear infinite;
}

.not-found h1 {
  color: rgb(var(--c-danger-soft));
  margin: 0;
}


@media (max-width: 768px) {
  .admin-quest-view {
    gap: 1rem;
    padding: 0 1rem 1.5rem;
  }

  .quest-toolbar {
    border-radius: 18px;
  }

  .toolbar-input {
    font-size: 0.9rem;
    padding: 0.65rem 0.85rem;
    border-radius: 14px;
  }

  .toolbar-textarea {
    font-size: 0.85rem;
    padding: 0.6rem 0.85rem;
    border-radius: 14px;
  }

}

@media (max-width: 480px) {
  .admin-quest-view {
    gap: 0.75rem;
    padding: 0 0.75rem 1rem;
  }

  .quest-toolbar {
    border-radius: 14px;
    padding: 0.85rem;
  }

  .toolbar-input {
    font-size: 0.85rem;
    padding: 0.55rem 0.75rem;
    border-radius: 12px;
  }

  .toolbar-textarea {
    font-size: 0.8rem;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
  }

  .toolbar-label {
    font-size: 0.68rem;
  }

  .stats-capsule {
    padding: 0.4rem 1rem;
    gap: 0.7rem;
  }

  .danger-btn {
    font-size: 0.8rem;
    padding: 0.5rem 1.1rem;
  }

  .rounds-panel {
    padding: 0.85rem;
    border-radius: 14px;
    gap: 0.75rem;
  }

}

@media (max-width: 360px) {
  .admin-quest-view {
    gap: 0.6rem;
    padding: 0 0.5rem 0.75rem;
  }

  .quest-toolbar {
    border-radius: 12px;
    padding: 0.7rem;
  }

  .toolbar-input {
    font-size: 0.82rem;
    padding: 0.5rem 0.65rem;
  }

  .toolbar-textarea {
    font-size: 0.78rem;
    padding: 0.45rem 0.65rem;
  }

  .rounds-panel {
    padding: 0.7rem;
    border-radius: 12px;
  }
}

@media (max-width: 320px) {
  .admin-quest-view {
    gap: 0.5rem;
    padding: 0 0.375rem 0.5rem;
  }

  .quest-toolbar {
    padding: 0.6rem;
    border-radius: 10px;
  }

  .toolbar-input {
    font-size: 0.78rem;
    padding: 0.45rem 0.55rem;
  }

  .toolbar-textarea {
    font-size: 0.75rem;
    padding: 0.4rem 0.55rem;
  }

  .stat-chip__value {
    font-size: 0.9rem;
  }

  .rounds-panel {
    padding: 0.6rem;
    border-radius: 10px;
  }
}
</style>
