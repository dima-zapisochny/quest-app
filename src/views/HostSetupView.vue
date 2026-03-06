<template>
  <div class="host-setup">
    <AppHeader
      button-variant="back"
      button-label="Назад"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <div v-if="loading" class="host-loading-wrapper">
      <div class="loading-state">
        <div class="loader"></div>
        <p>Подготавливаем квесты…</p>
      </div>
    </div>
    <template v-else>
      <header class="host-header">
        <div class="host-title">
          <h1>Создание игры</h1>
          <p>Выберите квест, который будете вести.</p>
        </div>
      </header>

      <section class="quest-selection">
        <div class="section-header">
          <div class="section-title">
            <h2>Выберите квест</h2>
          </div>
          <p class="section-subtitle">Каждый квест — отдельное приключение. Попробуйте разные темы!</p>
        </div>

        <div class="quests-grid">
          <article
            v-for="quest in quests"
            :key="quest.id"
            :class="['quest-card', { active: selectedQuestId === quest.id } ]"
            @click="handleCardClick($event, quest.id)"
          >
            <div class="quest-topline">
              <h2 class="quest-title">{{ quest.title }}</h2>
              <div class="quest-actions" @click.stop @mousedown.stop>
                <button
                  type="button"
                  class="quest-action-button"
                  @click="goToQuestEditor(quest.id)"
                  aria-label="Редактировать квест"
                  data-tooltip="Редактировать"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1-1z"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="quest-action-button quest-action-button--danger"
                  @click="deleteQuest(quest.id)"
                  aria-label="Удалить квест"
                  data-tooltip="Удалить"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm12-15h-3.5l-1-1h-3l-1 1H6v2h12V4z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <p class="quest-description">{{ quest.description || '' }}</p>
            <div class="quest-meta">
              <span>Раундов: {{ quest.rounds ? quest.rounds.length : 0 }}</span>
              <span>Вопросов: {{ questQuestions(quest.id) }}</span>
            </div>
          </article>
          <article class="quest-card quest-card--new" @click="createNewQuest">
            <div class="new-quest-circle">+</div>
            <span>Создать новый квест</span>
          </article>
          <article class="quest-card quest-card--seed" @click="loadMusicQuest" v-if="!hasMusicQuest">
            <div class="new-quest-circle seed-icon">🎵</div>
            <span>Добавить музыкальный квест</span>
          </article>
        </div>
      </section>

      <section class="actions actions--fixed">
        <button class="primary" :disabled="!selectedQuestId" @click="handleStart">Начать игру</button>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </section>
    </template>
    <teleport to="body">
      <div v-if="showCreateQuestModal" class="quest-modal-backdrop" @click="closeCreateQuestModal">
        <div class="quest-modal" role="dialog" aria-modal="true" @click.stop>
          <header class="quest-modal__header">
            <h2>Новый квест</h2>
            <button type="button" class="quest-modal__close" @click="closeCreateQuestModal" aria-label="Закрыть">✕</button>
          </header>
          <form class="quest-modal__form" @submit.prevent="submitCreateQuest">
            <label class="quest-modal__label" for="new-quest-title">Название *</label>
            <input
              id="new-quest-title"
              v-model="newQuestTitle"
              class="quest-modal__input"
              type="text"
              placeholder="Название квеста"
              required
            />
            <label class="quest-modal__label" for="new-quest-description">Описание (необязательно)</label>
            <textarea
              id="new-quest-description"
              v-model="newQuestDescription"
              class="quest-modal__textarea"
              rows="3"
              placeholder="Кратко расскажите о квесте"
            ></textarea>
            <p v-if="createQuestError" class="quest-modal__error">{{ createQuestError }}</p>
            <div class="quest-modal__actions">
              <button type="button" class="secondary" @click="closeCreateQuestModal">Отмена</button>
              <button type="submit" class="primary">Создать</button>
            </div>
          </form>
        </div>
      </div>
      <div v-if="confirmDeleteModal.visible" class="quest-modal-backdrop" @click="cancelDeleteQuest">
        <div class="quest-modal quest-modal--confirm" role="dialog" aria-modal="true" @click.stop>
          <header class="quest-modal__header">
            <h2>Удалить квест?</h2>
            <button type="button" class="quest-modal__close" @click="cancelDeleteQuest" aria-label="Закрыть">✕</button>
          </header>
          <div class="quest-modal__body">
            <p>Вы действительно хотите удалить квест «{{ confirmDeleteModal.questTitle }}»? Это действие нельзя отменить.</p>
          </div>
          <div class="quest-modal__actions">
            <button type="button" class="secondary" @click="cancelDeleteQuest">Отмена</button>
            <button type="button" class="danger" @click="confirmDeleteQuest">Удалить</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import AppHeader from '@/components/common/AppHeader.vue'

const router = useRouter()
const quizStore = useQuizStore()
const sessionStore = useGameSessionStore()

const quests = computed(() => quizStore.quests)
const selectedQuestId = ref<string | null>(null)
const errorMessage = ref('')
const loading = ref(true)
const showCreateQuestModal = ref(false)
const newQuestTitle = ref('')
const newQuestDescription = ref('')
const createQuestError = ref('')
const confirmDeleteModal = ref<{ visible: boolean; questId: string | null; questTitle: string }>({
  visible: false,
  questId: null,
  questTitle: ''
})

const userProfile = computed(() => sessionStore.userProfile)

const handleClickOutside = (event: MouseEvent) => {
  const hostRoot = document.querySelector('.host-setup')
  const target = event.target as HTMLElement
  if (!hostRoot?.contains(target)) {
    return
  }
  const questCard = target.closest('.quest-card')
  if (!questCard) {
    selectedQuestId.value = null
  }
}

onMounted(async () => {
  // Ждем загрузки профиля, если он еще загружается
  if (sessionStore.isLoading) {
    const checkProfile = setInterval(() => {
      if (!sessionStore.isLoading) {
        clearInterval(checkProfile)
        checkProfileAndLoad()
      }
    }, 100)
    
    setTimeout(() => {
      clearInterval(checkProfile)
      checkProfileAndLoad()
    }, 2000)
  } else {
    checkProfileAndLoad()
  }
  
  window.addEventListener('click', handleClickOutside)
})

function checkProfileAndLoad() {
  try {
    sessionStore.ensureProfile()
  } catch (error) {
    router.replace('/')
    return
  }

  if (!quests.value.length) {
    quizStore.loadFromStorage()
  }

  loading.value = false
}

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
})

const questQuestions = (questId: string) => quizStore.getQuestProgress(questId).totalQuestions

const hasMusicQuest = computed(() => quests.value.some(q => q.title === 'Музыкальный квест'))

async function loadMusicQuest() {
  try {
    const id = await quizStore.addMusicQuest()
    selectedQuestId.value = id
  } catch (error) {
    console.error('Failed to load music quest:', error)
    errorMessage.value = 'Не удалось добавить музыкальный квест'
  }
}

function handleCardClick(event: MouseEvent, questId: string) {
  const target = event.target as HTMLElement | null
  if (target?.closest('.quest-action-button')) {
    return
  }
  selectQuest(questId)
}

function selectQuest(questId: string) {
  if (selectedQuestId.value === questId) {
    selectedQuestId.value = null
  } else {
    selectedQuestId.value = questId
  }
  errorMessage.value = ''
}

async function handleStart() {
  errorMessage.value = ''
  if (!selectedQuestId.value) {
    errorMessage.value = 'Выберите квест для старта игры'
    return
  }
  try {
    const questSnapshot = quizStore.getQuestById(selectedQuestId.value)
    const session = await sessionStore.createSession(selectedQuestId.value, questSnapshot ?? undefined)
    
    // Сразу переходим на игровую доску (хост использует квест из store)
    const quest = session.quest ?? quizStore.getQuestById(session.questId)
    if (!quest || !Array.isArray(quest.rounds) || !quest.rounds.length) {
      errorMessage.value = 'Добавьте хотя бы один раунд в квест'
      return
    }
    const firstRound = quest.rounds.find(round => Array.isArray(round.categories)) ?? quest.rounds[0]
    if (!firstRound) {
      errorMessage.value = 'В раунде отсутствуют категории'
      return
    }
    sessionStore.setActiveRound(session.id, firstRound.id)
    router.push({
      name: 'host-session',
      params: {
        sessionCode: session.code,
        roundId: firstRound.id
      },
      query: {
        questId: session.questId
      }
    })
  } catch (error: any) {
    errorMessage.value = error?.message ?? 'Не удалось создать игру'
  }
}

function goBack() {
  router.push('/')
}

function createNewQuest() {
  newQuestTitle.value = ''
  newQuestDescription.value = ''
  createQuestError.value = ''
  showCreateQuestModal.value = true
}

function goToQuestEditor(questId: string) {
  router.push({ name: 'admin-quest', params: { questId } })
}

function deleteQuest(questId: string) {
  const quest = quizStore.getQuestById(questId)
  if (!quest) return
  confirmDeleteModal.value = {
    visible: true,
    questId,
    questTitle: quest.title || 'Без названия'
  }
}

function closeCreateQuestModal() {
  showCreateQuestModal.value = false
}

async function submitCreateQuest() {
  createQuestError.value = ''
  const title = newQuestTitle.value.trim()
  if (!title) {
    createQuestError.value = 'Название квеста обязательно'
    return
  }
  try {
    const questId = await quizStore.createQuest(title, newQuestDescription.value.trim())
    // Квест уже добавлен в store функцией createQuest
    showCreateQuestModal.value = false
    // Небольшая задержка для гарантии, что квест сохранен
    await new Promise(resolve => setTimeout(resolve, 100))
    router.push({ name: 'admin-quest', params: { questId } })
  } catch (error: any) {
    createQuestError.value = error?.message ?? 'Не удалось создать квест'
  }
}

function confirmDeleteQuest() {
  const { questId } = confirmDeleteModal.value
  if (!questId) {
    confirmDeleteModal.value.visible = false
    return
  }
  quizStore.deleteQuest(questId)
  if (selectedQuestId.value === questId) {
    selectedQuestId.value = null
  }
  confirmDeleteModal.value = { visible: false, questId: null, questTitle: '' }
}

function cancelDeleteQuest() {
  confirmDeleteModal.value = { visible: false, questId: null, questTitle: '' }
}

</script>

<style scoped>
.host-setup {
  height: 100dvh;
  overflow: hidden;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  padding: 0 clamp(1rem, 4vw, 3rem) 0;
  display: flex;
  flex-direction: column;
  gap: 3rem;
  box-sizing: border-box;
}

.host-loading-wrapper {
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



.host-header {
  background: rgba(15, 23, 42, 0.78);
  border-radius: 1.25rem;
  padding: 2rem;
  box-shadow: 0 25px 60px rgba(8, 47, 73, 0.45);
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-shrink: 0;
}

.host-title {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  justify-content: center;
}

.host-title h1 {
  margin: 0;
  font-size: clamp(1.8rem, 3vw, 2.2rem);
  font-family: 'Press Start 2P', cursive;
  letter-spacing: 0.08em;
}

.host-title p {
  margin: 0.5rem 0 0;
  color: rgba(226, 232, 240, 0.85);
}

.host-pixel-story {
  position: relative;
  flex: 1;
  min-height: clamp(200px, 18vw, 240px);
  overflow: hidden;
  border-radius: 1.75rem;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quest-selection {
  padding-right: 0.5rem;
  margin-right: -0.5rem;
  padding-bottom: 1rem;
  min-height: 0;

}

.quest-selection::-webkit-scrollbar {
  width: 8px;
}

.quest-selection::-webkit-scrollbar-track {
  background: transparent;
}

.quest-selection::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.45), rgba(59, 130, 246, 0.45));
  border-radius: 999px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 0 28px;
  flex-shrink: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.section-title h2 {
  margin: 0;
  font-size: clamp(1.1rem, 3vw, 1.35rem);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(226, 232, 240, 0.92);
}

.section-subtitle {
  margin: 0;
  color: rgba(148, 163, 184, 0.9);
  font-size: 0.95rem;
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(540px, 100%), 1fr));
  gap: 1.6rem;
  padding-top: 0.2rem;
  overflow-y: auto;
  padding-right: 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: rgba(148, 163, 184, 0.6) transparent;
  flex: 1;
  min-height: 0;
  max-height: calc(2 * (120px + 2 * 2rem) + 1 * 2rem);
}

.quests-grid::-webkit-scrollbar {
  width: 8px;
}

.quests-grid::-webkit-scrollbar-track {
  background: transparent;
}

.quests-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.45), rgba(59, 130, 246, 0.45));
  border-radius: 999px;
}

.quests-grid::-webkit-scrollbar-thumb:hover {
  background: rgba(148, 163, 184, 0.7);
}

.quest-card {
  position: relative;
  z-index: 0;
  background: rgba(15, 23, 42, 0.78);
  border-radius: 1.25rem;
  padding: 2rem;
  border: 1px solid rgba(148, 163, 184, 0.28);
  color: #f8fafc;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  height: 120px;
  min-height: 120px;
  max-height: 120px;
}

.quest-card:hover,
.quest-card.active {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.5);
}

.quest-topline {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  flex-shrink: 0;
}

.quest-title {
  margin: 0;
  flex: 1;
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-word;
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quest-actions {
  display: inline-flex;
  gap: 0.45rem;
  position: relative;
  z-index: 2;
}

.quest-action-button {
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(148, 163, 184, 0.45);
  background: rgba(2, 6, 23, 0.75);
  color: rgba(226, 232, 240, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.quest-action-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), color 0.25s ease;
}

.quest-action-button::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 0.4rem);
  left: 50%;
  transform: translate(-50%, 6px);
  background: rgba(15, 23, 42, 0.92);
  color: #e2e8f0;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.quest-action-button:hover,
.quest-action-button:focus-visible {
  transform: translateY(-2px);
  border-color: rgba(34, 211, 238, 0.65);
  background: rgba(14, 165, 233, 0.18);
  box-shadow: 0 12px 24px rgba(34, 211, 238, 0.25);
}

.quest-action-button:hover svg,
.quest-action-button:focus-visible svg {
  transform: rotate(-6deg) scale(1.08);
}

.quest-action-button:hover::after,
.quest-action-button:focus-visible::after {
  opacity: 1;
  transform: translate(-50%, 0);
}

.quest-action-button--danger {
  border-color: rgba(248, 113, 113, 0.35);
  color: #fca5a5;
}

.quest-action-button--danger:hover,
.quest-action-button--danger:focus-visible {
  border-color: rgba(248, 113, 113, 0.7);
  background: rgba(248, 113, 113, 0.18);
  box-shadow: 0 12px 24px rgba(248, 113, 113, 0.25);
}

.quest-action-button--danger:hover svg,
.quest-action-button--danger:focus-visible svg {
  transform: rotate(6deg) scale(1.08);
}

.quest-card--new {
  border: 1px dashed rgba(59, 130, 246, 0.5);
  background: rgba(15, 23, 42, 0.6);
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  text-align: center;
  color: rgba(226, 232, 240, 0.9);
}

.quest-card--new:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(148, 163, 184, 0.1);
  border-color: rgba(148, 163, 184, 0.5);
}

.new-quest-circle {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  border: 2px dashed rgba(59, 130, 246, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.4rem;
}

.quest-card--new span,
.quest-card--seed span {
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.quest-card--seed {
  border: 1px dashed rgba(168, 85, 247, 0.5);
  background: rgba(15, 23, 42, 0.6);
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  text-align: center;
  color: rgba(226, 232, 240, 0.9);
}

.quest-card--seed:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(168, 85, 247, 0.15);
  border-color: rgba(168, 85, 247, 0.7);
}

.seed-icon {
  border-color: rgba(168, 85, 247, 0.5) !important;
  font-size: 2.4rem !important;
}

.quest-card::before {
  content: '';
  position: absolute;
  top: -30%;
  right: -30%;
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.4), transparent 60%);
  transform: rotate(20deg);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

.quest-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 25%, rgba(34, 211, 238, 0.3), transparent 70%);
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: -1;
}

.quest-card:hover::before,
.quest-card:hover::after,
.quest-card.active::after {
  opacity: 1;
}

.quest-description {
  margin: 0;
  color: #475569;
  font-size: 0.9rem;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  max-height: calc(0.9rem * 1.4 * 2);
  flex-shrink: 0;
}

.quest-meta {
  display: flex;
  gap: 0.6rem;
  font-size: 0.85rem;
  color: rgba(226, 232, 240, 0.8);
  flex-shrink: 0;
  margin-top: auto;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  align-items: center;
}

.actions--fixed {
  flex-shrink: 0;
  padding: 2rem 0;
  margin-top: auto;
  z-index: 10;
}

.primary,
.secondary {
  border-radius: 9999px;
  padding: 1.2rem 2.5rem;
  font-weight: 600;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  width: auto;
  min-width: 280px;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  box-sizing: border-box;
}

.primary {
  background: rgba(15, 118, 110, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #f8fafc;
  letter-spacing: 0.04em;
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(34, 211, 238, 0.28);
}

.primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: grayscale(0.6);
  border-color: rgba(148, 163, 184, 0.35);
  background: rgba(15, 118, 110, 0.08);
  color: rgba(226, 232, 240, 0.4);
}

.secondary {
  background: linear-gradient(135deg, #22d3ee, #a855f7);
  border: 1px solid transparent;
  color: #fff;
  min-width: 220px;
}

.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(138, 99, 235, 0.28);
}

.error {
  margin: 0;
  color: #ef4444;
  font-weight: 600;
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
  box-sizing: border-box;
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
}

.quest-modal__close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(34, 211, 238, 0.3);
}

.quest-modal__form {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  width: 100%;
  box-sizing: border-box;
}

.quest-modal__label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.65);
}

.quest-modal__input,
.quest-modal__textarea {
  width: 100%;
  box-sizing: border-box;
  border-radius: 14px;
  border: 1px solid rgba(59, 130, 246, 0.24);
  padding: 0.65rem 0.8rem;
  background: rgba(15, 23, 42, 0.6);
  color: #f8fafc;
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.quest-modal__textarea {
  resize: vertical;
  min-height: 96px;
}

.quest-modal__input:focus,
.quest-modal__textarea:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.22);
}

.quest-modal__error {
  margin: 0;
  color: #fda4af;
  font-size: 0.85rem;
}

.quest-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.quest-modal__actions .secondary,
.quest-modal__actions .primary {
  min-width: 140px;
}

.quest-modal__actions .primary {
  background: linear-gradient(135deg, #22d3ee, #38bdf8);
  border: 1px solid transparent;
  color: #0f172a;
  box-shadow: 0 12px 24px rgba(34, 211, 238, 0.28);
  border-radius: 999px;
}

.quest-modal__actions .primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgba(34, 211, 238, 0.32);
}

.quest-modal__actions .secondary {
  background: rgba(15, 118, 110, 0.15);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #bae6fd;
  border-radius: 999px;
}

.quest-modal__actions .secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgba(34, 211, 238, 0.22);
}

.quest-modal__actions .danger {
  min-width: 140px;
  background: linear-gradient(135deg, #22d3ee, #38bdf8);
  border: 1px solid transparent;
  color: #0f172a;
  box-shadow: 0 12px 24px rgba(34, 211, 238, 0.28);
  border-radius: 999px;
}

.quest-modal__actions .danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgba(34, 211, 238, 0.32);
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
  .quest-modal__actions .primary,
  .quest-modal__actions .danger {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .host-setup {
    padding: 1.5rem;
    gap: 1rem;
  }

  .host-nav {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
  }

  .actions {
    align-items: stretch;
  }

  .primary,
  .secondary {
    width: 100%;
    min-width: 0;
    padding: 0.9rem 1.75rem;
    font-size: 0.95rem;
  }

  .actions--fixed {
    padding: 1rem 0;
  }

  .host-header {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 1.75rem;
    padding: 1.75rem 1.25rem;
  }

  .host-title h1 {
    font-size: clamp(0.9rem, 2.5vw, 1.1rem);
  }

  .host-title p {
    font-size: clamp(0.7rem, 2vw, 0.85rem);
  }

  .host-pixel-story {
    width: 100%;
    order: 1;
    min-height: clamp(220px, 40vw, 260px);
    padding: 0;
    margin-top: 1.25rem;
  }

  /* Уменьшаем карточки квестов для мобильных */
  .quest-card {
    padding: 1.25rem;
    height: 80px;
    min-height: 80px;
    max-height: 80px;
    gap: 0.6rem;
    border-radius: 0.75rem;
  }

  .quest-title {
    font-size: 0.75rem;
    line-height: 1.25;
  }

  .quest-description {
    font-size: 0.6rem;
    line-height: 1.35;
    max-height: calc(0.6rem * 1.35 * 2);
  }

  .quest-meta {
    font-size: 0.55rem;
    gap: 0.4rem;
  }

  .quest-action-button {
    width: 24px;
    height: 24px;
  }

  .quest-action-button svg {
    width: 12px;
    height: 12px;
  }

  .quest-topline {
    gap: 0.4rem;
  }

  .quest-actions {
    gap: 0.3rem;
  }

  .quest-card--new {
    gap: 0.4rem;
  }

  .new-quest-circle {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
    border-width: 1.5px;
  }

  .quest-card--new span {
    font-size: 0.6rem;
  }

  .quests-grid {
    gap: 1rem;
    max-height: calc(2 * (80px + 2 * 1.25rem) + 1 * 1rem);
  }

  .section-title h2 {
    white-space: nowrap;
    font-size: clamp(0.7rem, 2.5vw, 0.9rem);
  }

  .section-subtitle {
    display: none;
  }
}

@media (max-width: 480px) {
  .host-setup {
    padding: 0 0.75rem;
    gap: 0.75rem;
  }

  .host-header {
    padding: 1.25rem 1rem;
    gap: 1.25rem;
    border-radius: 1rem;
  }

  .host-title h1 {
    font-size: clamp(0.8rem, 2.2vw, 1rem);
  }

  .host-title p {
    font-size: clamp(0.65rem, 1.8vw, 0.78rem);
  }

  .quest-card {
    padding: 1rem;
    height: 72px;
    min-height: 72px;
    max-height: 72px;
    gap: 0.4rem;
    border-radius: 0.65rem;
  }

  .quest-title {
    font-size: 0.7rem;
  }

  .quest-description {
    font-size: 0.55rem;
    max-height: calc(0.55rem * 1.35 * 2);
  }

  .quest-meta {
    font-size: 0.5rem;
    gap: 0.3rem;
  }

  .quest-action-button {
    width: 22px;
    height: 22px;
  }

  .quest-action-button svg {
    width: 11px;
    height: 11px;
  }

  .new-quest-circle {
    width: 42px;
    height: 42px;
    font-size: 1.3rem;
  }

  .quest-card--new span {
    font-size: 0.55rem;
  }

  .quests-grid {
    gap: 0.75rem;
    max-height: calc(2 * (72px + 2 * 1rem) + 1 * 0.75rem);
  }

  .primary,
  .secondary {
    padding: 0.8rem 1.5rem;
    font-size: 0.88rem;
  }

  .section-header {
    padding: 0 0.5rem;
  }

  .actions--fixed {
    padding: 0.75rem 0;
  }
}

@media (max-width: 360px) {
  .host-setup {
    padding: 0 0.5rem;
    gap: 0.5rem;
  }

  .host-header {
    padding: 1rem 0.75rem;
    gap: 1rem;
    border-radius: 0.875rem;
  }

  .host-title h1 {
    font-size: clamp(0.75rem, 2vw, 0.9rem);
  }

  .quest-card {
    padding: 0.75rem;
    height: 65px;
    min-height: 65px;
    max-height: 65px;
    gap: 0.35rem;
  }

  .quest-title {
    font-size: 0.65rem;
  }

  .quest-description {
    display: none;
  }

  .quest-meta {
    font-size: 0.48rem;
  }

  .new-quest-circle {
    width: 36px;
    height: 36px;
    font-size: 1.1rem;
  }

  .quest-card--new span {
    font-size: 0.5rem;
  }

  .quests-grid {
    gap: 0.6rem;
  }

  .primary,
  .secondary {
    padding: 0.7rem 1.25rem;
    font-size: 0.82rem;
  }

  .actions--fixed {
    padding: 0.5rem 0;
  }
}

@media (max-width: 320px) {
  .host-setup {
    padding: 0 0.375rem;
    gap: 0.4rem;
  }

  .host-header {
    padding: 0.75rem 0.6rem;
    gap: 0.75rem;
  }

  .host-title h1 {
    font-size: clamp(0.7rem, 1.8vw, 0.85rem);
  }

  .quest-card {
    padding: 0.6rem;
    height: 58px;
    min-height: 58px;
    max-height: 58px;
  }

  .quest-title {
    font-size: 0.6rem;
  }

  .quest-action-button {
    width: 20px;
    height: 20px;
  }

  .quest-action-button svg {
    width: 10px;
    height: 10px;
  }

  .new-quest-circle {
    width: 32px;
    height: 32px;
    font-size: 1rem;
  }

  .quest-card--new span {
    font-size: 0.45rem;
  }

  .primary,
  .secondary {
    padding: 0.65rem 1rem;
    font-size: 0.78rem;
  }
}

@media (max-width: 1024px) {
  .quest-selection {
    padding-right: 0;
    margin-right: 0;
  }

  .quests-grid {
    grid-template-columns: 1fr;
    max-height: none;
    overflow: visible;
    padding-right: 0;
    margin-top: 1.2rem;
  }

  .quest-card {
    padding: 1.6rem;
  }

  .quest-card--new {
    gap: 0.4rem;
  }

  .new-quest-circle {
    width: 64px;
    height: 64px;
    font-size: 2rem;
  }

  .actions {
    align-items: stretch;
  }

  .primary,
  .secondary {
    width: 100%;
    min-width: 0;
  }

  .host-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.5rem;
  }

  .host-title {
    width: 100%;
  }

  .host-user-pill {
    align-self: center;
  }

}



.host-user-name {
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.host-user-avatar--placeholder {
  border-style: dashed;
  color: #bae6fd;
}

</style>
