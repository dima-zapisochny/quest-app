<template>
  <div v-if="quest" class="admin-quest-view">
    <AppHeader
      button-variant="back"
      :button-label="t('common.back')"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <div class="stats-capsule">
      <span class="stat-chip">
        <span class="stat-chip__label">{{ t('editor.roundsLabel') }}</span>
        <span class="stat-chip__value">{{ Array.isArray(quest.rounds) ? quest.rounds.length : 0 }}/5</span>
      </span>
      <span class="stats-capsule__divider" aria-hidden="true"></span>
      <span class="stat-chip">
        <span class="stat-chip__label">{{ t('editor.questionsLabel') }}</span>
        <span class="stat-chip__value">{{ questStats.totalQuestions }}</span>
      </span>
      <transition name="save-pill">
        <span
          v-if="store.saveState !== 'idle'"
          class="save-icon"
          :class="`save-icon--${store.saveState}`"
          :title="store.saveState === 'saving' ? t('editor.saving') : t('editor.saved')"
          :aria-label="store.saveState === 'saving' ? t('editor.saving') : t('editor.saved')"
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
        <label class="toolbar-label" for="quest-title">{{ t('editor.questTitleLabel') }}</label>
        <input
          id="quest-title"
          v-model="questTitle"
          class="toolbar-input"
          :placeholder="t('editor.questTitlePlaceholder')"
        />
        <label class="toolbar-label" for="quest-description">{{ t('editor.questDescLabel') }}</label>
        <textarea
          id="quest-description"
          v-model="questDescription"
          rows="2"
          class="toolbar-textarea"
          :placeholder="t('editor.questDescPlaceholder')"
        ></textarea>
      </div>
    </header>

    <div class="rounds-capsule">
      <div class="round-tabs">
        <div
          v-for="(round, index) in quest.rounds"
          :key="round.id"
          :class="['round-tab', { 'round-tab--active': editingRoundId === round.id }]"
        >
          <button type="button" class="round-tab__select" @click="editingRoundId = round.id">
            {{ t('editor.round', { n: index + 1 }) }}
          </button>
          <transition name="round-del">
            <button
              v-if="editingRoundId === round.id"
              type="button"
              class="round-tab__del"
              :title="t('editor.deleteRound')"
              :aria-label="t('editor.deleteRound')"
              @click="handleDeleteCurrentRound"
            >✕</button>
          </transition>
        </div>
        <button
          v-if="roundsCount < 5"
          class="round-tab round-tab--add"
          type="button"
          :disabled="isAddingRound"
          :aria-label="t('editor.addRound')"
          @click="handleAddRound"
        >
          <span v-if="!isAddingRound">+</span>
          <span v-else class="mini-loader"></span>
        </button>
      </div>
    </div>

    <section class="board-panel">
      <p v-if="roundsCount === 0" class="panel-empty">
        {{ t('editor.noRounds') }}
      </p>

      <transition name="round-swap" mode="out-in">
        <QuestBoardEditor
          v-if="editingRound"
          :key="editingRound.id"
          :quest-id="quest.id"
          :round="editingRound"
        />
      </transition>
    </section>
  </div>
  <div v-else-if="showLoading" class="not-found admin-quest-loading">
    <div class="loader"></div>
    <p>{{ t('editor.loadingQuest') }}</p>
  </div>
  <div v-else class="not-found">
    <h1>{{ t('editor.notFound') }}</h1>
    <BackLink to="/host/setup">{{ t('editor.backToList') }}</BackLink>
  </div>

  <ConfirmDialog
    :show="confirmModal.visible"
    :title="confirmModal.title"
    :message="confirmModal.message"
    :confirm-label="confirmModal.confirmLabel"
    confirm-variant="danger"
    @confirm="confirmModalAction"
    @cancel="cancelConfirmModal"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
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
const { t } = useI18n()
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

// Единая модалка подтверждения удаления раунда (#33)
const confirmModal = ref<{
  visible: boolean
  roundId: string | null
  title: string
  message: string
  confirmLabel: string
}>({ visible: false, roundId: null, title: '', message: '', confirmLabel: '' })

function handleDeleteRound(roundId: string) {
  if (!quest.value) return
  confirmModal.value = {
    visible: true, roundId,
    title: t('editor.deleteRoundTitle'), message: t('editor.deleteRoundBody'),
    confirmLabel: t('common.delete')
  }
}

function cancelConfirmModal() {
  confirmModal.value = { ...confirmModal.value, visible: false }
}

function confirmModalAction() {
  const { roundId } = confirmModal.value
  cancelConfirmModal()
  if (!quest.value || !roundId) return
  store.deleteRound(quest.value.id, roundId)
  if (editingRoundId.value === roundId) {
    editingRoundId.value = quest.value.rounds?.[0]?.id ?? null
  }
}

function handleDeleteCurrentRound() {
  if (!editingRoundId.value) return
  handleDeleteRound(editingRoundId.value)
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
  box-sizing: border-box;
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
  min-height: 3.4rem;
}

.toolbar-input::placeholder,
.toolbar-textarea::placeholder {
  color: rgb(var(--c-text-muted) / 0.45);
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
  font-size: 0.92rem;
  letter-spacing: 0.01em;
  opacity: 0.85;
}
.stat-chip__value {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

/* Отдельная капсула раундов — по центру, не на всю ширину (как статистика) */
.rounds-capsule {
  align-self: center;
  display: inline-flex;
  justify-content: center;
  padding: 0.85rem 1.9rem;
  border-radius: var(--radius-pill);
  background: rgb(var(--c-bg) / 0.72);
  border: 1px solid rgb(var(--c-accent-sky) / 0.2);
  box-shadow: 0 14px 32px rgb(var(--c-sky-deep) / 0.3);
  backdrop-filter: blur(10px);
}

/* Блок с плитками вопросов */
.board-panel {
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
  gap: 0.55rem;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
}

/* Плавная смена доски при переключении раундов */
.round-swap-enter-active {
  transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}
.round-swap-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.round-swap-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.985);
}
.round-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}

/* Каждый раунд — отдельная капсула фиксированной ширины (крестик не двигает соседей) */
.round-tab {
  position: relative;
  width: 8rem;
  min-height: 3rem;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.16);
  background: rgb(var(--c-surface) / 0.5);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.round-tab__select {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* симметричные отступы: место под крестик зарезервировано всегда — текст не съезжает */
  padding: 0.75rem 1.9rem;
  border: none;
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.75);
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
  cursor: pointer;
  transition: color 0.2s ease;
}
.round-tab:hover {
  background: rgb(var(--c-accent-sky) / 0.12);
  border-color: rgb(var(--c-accent-sky) / 0.3);
}
.round-tab:hover .round-tab__select {
  color: rgb(var(--c-text));
}

.round-tab--active {
  background: rgb(var(--c-accent-sky) / 0.16);
  border-color: rgb(var(--c-accent-sky) / 0.4);
}
.round-tab--active .round-tab__select {
  color: rgb(var(--c-accent-soft));
}

/* Крестик удаления раунда — абсолютно у правого края, не влияет на ширину капсулы */
.round-tab__del {
  position: absolute;
  right: 0.45rem;
  top: 50%;
  transform: translateY(-50%);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgb(var(--c-accent-soft) / 0.55);
  font-size: 0.8rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.round-tab__del:hover {
  color: rgb(var(--c-danger-soft));
  background: rgb(var(--c-danger) / 0.15);
}
/* Плавное появление крестика — только opacity/scale, без рефлоу */
.round-del-enter-active,
.round-del-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.round-del-enter-from,
.round-del-leave-to {
  opacity: 0;
  transform: translateY(-50%) scale(0.4);
}

.round-tab--add {
  width: 4.8rem;
  margin-left: 0.35rem;
  padding: 0;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.35);
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.7);
  font-weight: 500;
  font-size: 1.1rem;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.round-tab--add:hover {
  color: rgb(var(--c-accent-soft));
  border-color: rgb(var(--c-accent-sky) / 0.55);
  background: rgb(var(--c-accent-sky) / 0.08);
}
.round-tab--add:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Убираем стандартную (жёлтую) обводку фокуса, оставляем аккуратную для клавиатуры */
.round-tab__select:focus,
.round-tab__del:focus,
.round-tab--add:focus {
  outline: none;
}
.round-tab__select:focus-visible,
.round-tab__del:focus-visible,
.round-tab--add:focus-visible {
  outline: 2px solid rgb(var(--c-accent-sky) / 0.6);
  outline-offset: 2px;
  border-radius: var(--radius-pill);
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

  .board-panel {
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

  .board-panel {
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

  .board-panel {
    padding: 0.6rem;
    border-radius: 10px;
  }
}
</style>
