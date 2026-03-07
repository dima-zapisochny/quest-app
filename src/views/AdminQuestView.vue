<template>
  <div v-if="quest" class="admin-quest-view">
    <AppHeader
      button-variant="back"
      button-label="Назад"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <header class="quest-toolbar">
      <div class="toolbar-left">
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
          <div class="toolbar-stats">
            <span class="stat-chip">Раундов: {{ Array.isArray(quest.rounds) ? quest.rounds.length : 0 }}/5</span>
            <span class="stat-chip">Вопросов: {{ questStats.totalQuestions }}</span>
          </div>
          <button
            class="toolbar-delete-text"
            type="button"
            title="Удалить квест"
            aria-label="Удалить квест"
            @click="handleDeleteQuest"
          >
            Удалить
          </button>
        </div>
      </div>
    </header>

    <section class="rounds-panel">
      <header class="panel-header">
        <h2>Раунды</h2>
       </header>
 
       <p v-if="!quest.rounds || quest.rounds.length === 0" class="panel-empty">
         Пока нет раундов. Создайте первый, чтобы добавить категории и вопросы.
       </p>
 
      <div class="rounds-grid">
        <template v-for="index in 5" :key="index">
          <button
            v-if="index <= roundsCount"
            :class="['round-slot', { active: activeRoundIndex === index - 1 }]"
            type="button"
            :aria-label="roundSlotLabel(index)"
            @click="handleSlotClick(index - 1)"
          >
            <span>{{ index }}</span>
          </button>
          <button
            v-else-if="index === roundsCount + 1 && roundsCount < 5"
            class="round-slot round-slot--add"
            type="button"
            :disabled="isAddingRound"
            aria-label="Добавить раунд"
            @click="handleAddRound"
          >
            <span v-if="!isAddingRound">+</span>
            <span v-else class="mini-loader"></span>
          </button>
          <button
            v-else
            class="round-slot round-slot--empty"
            type="button"
            disabled
            aria-hidden="true"
          >
            <span>{{ index }}</span>
          </button>
        </template>
      </div>
 
      <section v-if="editingRound" class="round-editor">
        <header class="round-editor-header">
          <span class="round-editor-index">Раунд {{ editingRoundIndex >= 0 ? editingRoundIndex + 1 : '—' }}</span>
        </header>
        <AdminRoundForm
          :quest-id="quest.id"
          :round="editingRound"
          @delete="handleDeleteCurrentRound"
        />
      </section>
    </section>
  </div>
  <div v-else-if="showLoading" class="not-found admin-quest-loading">
    <div class="loader"></div>
    <p>Загрузка квеста…</p>
  </div>
  <div v-else class="not-found">
    <h1>Квест не найден</h1>
    <router-link to="/host/setup" class="back-link">← Вернуться к списку квестов</router-link>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import AdminRoundForm from '@/components/admin/AdminRoundForm.vue'
import AppHeader from '@/components/common/AppHeader.vue'

interface Props {
  questId: string
}

const props = defineProps<Props>()
const router = useRouter()
const store = useQuizStore()
const sessionStore = useGameSessionStore()

const quest = computed(() => store.getQuestById(props.questId))

const showLoading = computed(() => {
  if (store.isLoading) return true
  if (quest.value) return false
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

const editingRoundIndex = computed(() => {
  if (!quest.value?.rounds || !editingRoundId.value) return -1
  return quest.value.rounds.findIndex(round => round.id === editingRoundId.value)
})

const activeRoundIndex = computed(() => editingRoundIndex.value)
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

// Загружаем квест из базы данных, если его нет в store
async function loadQuestIfNeeded() {
  if (!quest.value) {
    // Пытаемся загрузить квест из базы данных
    await store.loadFromStorage()
  }
}

onMounted(() => {
  loadQuestIfNeeded()
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

function handleDeleteRound(roundId: string) {
  if (!quest.value) return
  if (confirm('Удалить этот раунд и все его категории?')) {
    store.deleteRound(quest.value.id, roundId)
    if (editingRoundId.value === roundId) {
      const nextRound = quest.value.rounds?.[0]
      editingRoundId.value = nextRound?.id ?? null
    }
  }
}

function handleSlotClick(index: number) {
  const rounds = quest.value?.rounds
  if (!rounds) return
  const round = rounds[index]
  if (round) {
    editingRoundId.value = round.id
  }
}

function roundSlotLabel(index: number) {
  const actualIndex = index - 1
  const rounds = quest.value?.rounds
  if (!rounds || actualIndex < 0 || actualIndex >= rounds.length) {
    return `Пустой слот раунда ${index}`
  }
  const round = rounds[actualIndex]
  return `Раунд ${index}: ${round.title?.trim() || 'без названия'}`
}

function handleDeleteCurrentRound() {
  if (!editingRoundId.value) return
  handleDeleteRound(editingRoundId.value)
}

async function handleDeleteQuest() {
  if (!quest.value) return
  if (!confirm('Удалить квест целиком? Это действие нельзя отменить.')) return
  try {
    await store.deleteQuest(quest.value.id)
    router.push('/host/setup')
  } catch (err) {
    alert((err as Error)?.message ?? 'Не удалось удалить квест')
  }
}

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/host/setup')
  }
}
</script>

<style scoped>
.admin-quest-view {
  min-height: 100dvh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 0 clamp(1rem, 4vw, 3rem) 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #e2e8f0;
}



.quest-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: clamp(1rem, 4vw, 2.5rem);
  background: rgba(15, 23, 42, 0.78);
  border-radius: 24px;
  padding: clamp(1rem, 3vw, 1.8rem);
  border: 1px solid rgba(56, 189, 248, 0.18);
  box-shadow: 0 26px 52px rgba(8, 47, 73, 0.42);
  backdrop-filter: blur(12px);
}

.toolbar-left {
  flex: 1 1 auto;
  display: flex;
  gap: clamp(1rem, 3vw, 1.75rem);
  align-items: flex-start;
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
  color: rgba(148, 163, 184, 0.7);
  padding-left: 0.2rem;
  display: block;
}

.toolbar-input,
.toolbar-textarea {
  width: 100%;
  box-sizing: border-box;
  background: rgba(15, 23, 42, 0.62);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 18px;
  padding: 0.75rem 1rem;
  color: #f8fafc;
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
  color: rgba(226, 232, 240, 0.6);
}

.toolbar-input:focus,
.toolbar-textarea:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.toolbar-stats {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  margin-top: 0.4rem;
}

.stat-chip {
  background: rgba(56, 189, 248, 0.15);
  color: #bae6fd;
  border-radius: 999px;
  padding: 0.35rem 0.85rem;
  font-size: 0.78rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.toolbar-delete-text {
  margin-top: 0.8rem;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 1.45rem;
  border-radius: 16px;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
  width: auto;
  justify-self: start;
}

.toolbar-delete-text:hover {
  transform: translateY(-1px);
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 14px 30px rgba(239, 68, 68, 0.24);
}

.toolbar-delete-text svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.rounds-panel {
  background: rgba(15, 23, 42, 0.72);
  border-radius: 24px;
  border: 1px solid rgba(56, 189, 248, 0.16);
  padding: clamp(1rem, 3vw, 1.75rem);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 24px 46px rgba(8, 47, 73, 0.35);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.panel-header h2 {
  margin: 0;
  font-size: 1.25rem;
  letter-spacing: 0.04em;
}

.panel-action {
  background: rgba(56, 189, 248, 0.16);
  color: #bae6fd;
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 16px;
  padding: 0.45rem 1.1rem;
  cursor: pointer;
  font-weight: 600;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.panel-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(56, 189, 248, 0.25);
}

.panel-empty {
  margin: 0;
  padding: 1.1rem;
  border-radius: 18px;
  border: 1px dashed rgba(148, 163, 184, 0.35);
  color: rgba(226, 232, 240, 0.75);
  text-align: center;
  font-size: 0.9rem;
  background: rgba(15, 23, 42, 0.55);
}

.rounds-grid {
  display: grid;
  grid-template-columns: repeat(8, minmax(40px, 1fr));
  gap: 0.9rem;
  align-items: center;
}

@media (max-width: 1200px) {
  .rounds-grid {
    grid-template-columns: repeat(4, minmax(60px, 1fr));
  }
}

@media (max-width: 720px) {
  .rounds-grid {
    grid-template-columns: repeat(2, minmax(70px, 1fr));
    gap: 0.75rem;
  }
}

.round-slot {
  width: 100%;
  aspect-ratio: 5 / 2;
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.14);
  color: rgba(226, 232, 240, 0.85);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.round-slot.active {
  border-color: rgba(34, 211, 238, 0.5);
  color: #bae6fd;
  box-shadow: 0 16px 32px rgba(34, 211, 238, 0.22);
  transform: translateY(-2px);
}

.round-slot:not(.round-slot--empty):hover {
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateY(-1px);
}

.round-slot--add {
  border: 1px dashed rgba(56, 189, 248, 0.35);
  background: rgba(15, 23, 42, 0.45);
  color: #bae6fd;
  font-size: 1.4rem;
}

.round-slot--add:hover {
  border-color: rgba(56, 189, 248, 0.55);
  box-shadow: 0 14px 28px rgba(56, 189, 248, 0.22);
}

.round-slot--empty {
  border: 1px dashed rgba(56, 189, 248, 0.1);
  color: rgba(226, 232, 240, 0.2);
  cursor: default;
  pointer-events: none;
}

.round-slot--empty span {
  opacity: 0.35;
}

.mini-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(186, 230, 253, 0.3);
  border-top-color: #bae6fd;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.round-slot--add:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.round-editor {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.round-editor-header {
  display: flex;
  justify-content: center;
  color: rgba(226, 232, 240, 0.8);
}

.round-editor-index {
  font-size: clamp(0.95rem, 1.8vw, 1.2rem);
  letter-spacing: 0.12em;
  background: none;
  color: #f8fafc;
  margin: 0.4rem 0;
}

.not-found {
  min-height: 100dvh;
  background: linear-gradient(160deg, #0f172a 0%, #1f2937 45%, #0b1120 100%);
  color: #e2e8f0;
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
  color: #94a3b8;
  font-size: 1rem;
}

.loader {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid rgba(56, 189, 248, 0.25);
  border-top-color: #38bdf8;
  animation: spin 0.8s linear infinite;
}

.not-found h1 {
  color: #fca5a5;
  margin: 0;
}

.back-link {
  color: #38bdf8;
  text-decoration: none;
  font-weight: 600;
}

.back-link:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .quest-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .toolbar-left {
    flex-direction: column;
  }

  .toolbar-fields {
    width: 100%;
  }

  .rounds-panel {
    padding: 1rem;
  }

  .toolbar-delete-text {
    align-self: flex-start;
    width: auto;
  }

  .user-pill {
    align-self: center;
  }
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

  .panel-header h2 {
    font-size: 1.1rem;
  }

  .round-slot {
    font-size: 0.9rem;
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

  .stat-chip {
    font-size: 0.7rem;
    padding: 0.25rem 0.65rem;
  }

  .toolbar-delete-text {
    font-size: 0.8rem;
    padding: 0.35rem 1.1rem;
    border-radius: 12px;
  }

  .rounds-panel {
    padding: 0.75rem;
    border-radius: 18px;
    gap: 0.75rem;
  }

  .panel-header h2 {
    font-size: 1rem;
  }

  .round-slot {
    font-size: 0.85rem;
    border-radius: 12px;
  }

  .round-slot--add {
    font-size: 1.2rem;
  }

  .round-editor-index {
    font-size: clamp(0.85rem, 1.8vw, 1rem);
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
    padding: 0.6rem;
    border-radius: 14px;
  }

  .round-slot {
    font-size: 0.78rem;
    border-radius: 10px;
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

  .stat-chip {
    font-size: 0.65rem;
    padding: 0.2rem 0.5rem;
  }

  .rounds-panel {
    padding: 0.5rem;
    border-radius: 12px;
  }

  .panel-header h2 {
    font-size: 0.9rem;
  }

  .round-slot {
    font-size: 0.72rem;
  }
}
</style>
