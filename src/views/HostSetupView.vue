<template>
  <div class="host-setup">
    <AppHeader
      button-variant="back"
      :button-label="t('common.back')"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <div v-if="loading" class="host-loading-wrapper">
      <div class="loading-state">
        <div class="loader"></div>
        <p>{{ t('host.preparing') }}</p>
      </div>
    </div>
    <template v-else>
      <header class="host-header">
        <div class="host-title">
          <h1>{{ t('host.title') }}</h1>
          <p>{{ t('host.subtitle') }}</p>
        </div>
      </header>

      <section class="quest-selection">
        <div class="quests-grid">
          <article
            v-for="(quest, qi) in quests"
            :key="quest.id"
            :class="['quest-card', { active: selectedQuestId === quest.id } ]"
            @click="handleCardClick($event, quest.id)"
          >
            <div class="quest-card__cover" :style="{ '--hue': qi }">
              <span class="quest-card__mono">{{ (quest.title || '?').trim().charAt(0).toUpperCase() }}</span>
              <div class="quest-actions" @click.stop @mousedown.stop>
                <button
                  type="button"
                  class="quest-action-button"
                  @click="goToQuestEditor(quest.id)"
                  :aria-label="t('host.editQuestAria')"
                  :data-tooltip="t('common.edit')"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1-1z"></path>
                  </svg>
                </button>
                <button
                  type="button"
                  class="quest-action-button"
                  @click="exportQuest(quest.id)"
                  :aria-label="t('host.exportQuestAria')"
                  :data-tooltip="t('host.exportTooltip')"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  class="quest-action-button quest-action-button--danger"
                  @click="deleteQuest(quest.id)"
                  :aria-label="t('host.deleteQuestAria')"
                  :data-tooltip="t('common.delete')"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm12-15h-3.5l-1-1h-3l-1 1H6v2h12V4z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="quest-card__body">
              <h2 class="quest-title">{{ quest.title }}</h2>
              <div class="quest-meta">
                <span>{{ t('host.rounds', { count: quest.roundsCount ?? (quest.rounds?.length ?? 0) }) }}</span>
                <span class="quest-meta__dot">·</span>
                <span>{{ t('host.questions', { count: questQuestions(quest) }) }}</span>
                <span v-if="questQuestions(quest) === 0" class="quest-empty-badge">
                  <i aria-hidden="true">⚠</i> {{ t('host.noQuestions') }}
                </span>
              </div>
            </div>
          </article>
          <article class="quest-card quest-card--new" @click="createNewQuest">
            <div class="new-quest-circle">+</div>
            <span>{{ t('host.createNewQuest') }}</span>
          </article>
          <article class="quest-card quest-card--import" @click.stop="triggerImportQuest">
            <input
              ref="importQuestInputRef"
              type="file"
              accept=".json,application/json"
              class="quest-import-input"
              :disabled="importingQuest"
              @change="onImportQuestFile"
            />
            <div class="new-quest-circle import-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
              </svg>
            </div>
            <span>{{ importingQuest ? t('host.importing') : t('host.importQuest') }}</span>
          </article>
        </div>
      </section>

      <section class="actions actions--fixed">
        <button
          class="primary"
          :disabled="!selectedQuestId || isMobileViewport || selectedQuestEmpty"
          :title="startDisabledReason"
          @click="handleStart"
        >{{ t('host.startGame') }}</button>
        <p v-if="selectedQuestId && selectedQuestEmpty" class="start-hint">
          {{ t('host.startHint') }}
        </p>
        <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      </section>
    </template>
    <teleport to="body">
      <div v-if="confirmDeleteModal.visible" class="quest-modal-backdrop" @click="cancelDeleteQuest">
        <div class="quest-modal quest-modal--confirm" role="dialog" aria-modal="true" @click.stop>
          <header class="quest-modal__header">
            <h2>{{ t('host.deleteConfirmTitle') }}</h2>
            <button type="button" class="quest-modal__close" @click="cancelDeleteQuest" :aria-label="t('common.close')">✕</button>
          </header>
          <div class="quest-modal__body">
            <p>{{ t('host.deleteConfirmBody', { title: confirmDeleteModal.questTitle }) }}</p>
          </div>
          <div class="quest-modal__actions">
            <button type="button" class="secondary" @click="cancelDeleteQuest">{{ t('common.cancel') }}</button>
            <button type="button" class="danger" @click="confirmDeleteQuest">{{ t('common.delete') }}</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import AppHeader from '@/components/common/AppHeader.vue'
import { useIsMobileViewport } from '@/composables/useIsMobileViewport'

const { t } = useI18n()
const importingQuest = ref(false)
const importQuestInputRef = ref<HTMLInputElement | null>(null)

const router = useRouter()
const route = useRoute()
const quizStore = useQuizStore()
const sessionStore = useGameSessionStore()
const { isMobileViewport } = useIsMobileViewport()

const quests = computed(() => quizStore.quests)
const selectedQuestId = ref<string | null>(null)
const errorMessage = ref('')
const loading = ref(true)
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
  // Ждём готовности store без busy-wait/setInterval (#35)
  await sessionStore.whenReady()
  await checkProfileAndLoad()

  window.addEventListener('click', handleClickOutside)
})

async function checkProfileAndLoad() {
  try {
    sessionStore.ensureProfile()
  } catch (error) {
    router.replace('/')
    return
  }

  if (!quests.value.length) {
    await quizStore.loadFromStorage()
  }

  const restoreId = route.query.restore_quest as string | undefined
  if (restoreId) {
    const restored = await quizStore.restoreQuestFromDb(restoreId)
    if (restored) {
      selectedQuestId.value = restored.id
    }
    const q = { ...route.query }
    delete q.restore_quest
    router.replace({ path: route.path, query: q })
  }

  loading.value = false
}

onBeforeUnmount(() => {
  window.removeEventListener('click', handleClickOutside)
})

// Из лёгкого списка (#16) берём questionsCount; иначе считаем по загруженной структуре
const questQuestions = (quest: { id: string; questionsCount?: number }) =>
  quest.questionsCount ?? quizStore.getQuestProgress(quest.id).totalQuestions

// Нельзя начать игру по квесту без вопросов
const selectedQuestEmpty = computed(() => {
  if (!selectedQuestId.value) return false
  const q = quizStore.quests.find(x => x.id === selectedQuestId.value)
  return !!q && questQuestions(q) === 0
})

const startDisabledReason = computed(() => {
  if (isMobileViewport.value) return t('host.reasonMobile')
  if (selectedQuestId.value && selectedQuestEmpty.value) return t('host.reasonNoQuestions')
  return undefined
})

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
    errorMessage.value = t('host.errSelectQuest')
    return
  }
  try {
    // Валидируем квест ДО создания сессии — иначе при пустом квесте оставалась сессия-сирота (#3)
    let quest = quizStore.getQuestById(selectedQuestId.value)
    if (!quest || !Array.isArray(quest.rounds) || !quest.rounds.length) {
      // Список мог прийти без раундов — подгружаем полный квест
      quest = (await quizStore.loadQuestFull(selectedQuestId.value)) ?? quest
    }
    if (!quest || !Array.isArray(quest.rounds) || !quest.rounds.length) {
      errorMessage.value = t('host.errNoRounds')
      return
    }
    const firstRound = quest.rounds.find(round => Array.isArray(round.categories)) ?? quest.rounds[0]
    if (!firstRound) {
      errorMessage.value = t('host.errNoCategories')
      return
    }

    // Квест без вопросов запускать нельзя — иначе пустая, «сломанная» игра
    const totalQuestions = quest.rounds.reduce(
      (sum, r) => sum + (r.categories ?? []).reduce((cs, c) => cs + (c.questions?.length ?? 0), 0),
      0
    )
    if (totalQuestions === 0) {
      errorMessage.value = t('host.errNoQuestions')
      return
    }

    // Только теперь создаём сессию
    const session = await sessionStore.createSession(selectedQuestId.value, quest)
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
    errorMessage.value = error?.message ?? t('host.errCreateGame')
  }
}

function goBack() {
  router.push('/')
}

function createNewQuest() {
  router.push({ name: 'quest-create' })
}

function goToQuestEditor(questId: string) {
  router.push({ name: 'admin-quest', params: { questId } })
}

async function exportQuest(questId: string) {
  // В списке квест лёгкий (без rounds, #16) — подгружаем полный перед экспортом
  let quest = quizStore.getQuestById(questId)
  if (!quest || !quest.rounds?.length) {
    quest = await quizStore.loadQuestFull(questId) ?? quest
  }
  if (!quest || !quest.rounds?.length) return
  // Экспортируем чистую структуру без служебных счётчиков
  const { roundsCount, questionsCount, ...clean } = quest
  const json = JSON.stringify(clean, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const safeTitle = (quest.title || 'quest').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim() || 'quest'
  a.download = `${safeTitle}-${quest.id}.json`
  a.click()
  URL.revokeObjectURL(url)
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

async function confirmDeleteQuest() {
  const { questId } = confirmDeleteModal.value
  if (!questId) {
    confirmDeleteModal.value.visible = false
    return
  }
  try {
    await quizStore.deleteQuest(questId)
    if (selectedQuestId.value === questId) {
      selectedQuestId.value = null
    }
    confirmDeleteModal.value = { visible: false, questId: null, questTitle: '' }
    errorMessage.value = ''
  } catch (err) {
    errorMessage.value = (err as Error)?.message ?? t('host.errDeleteQuest')
  }
}

function cancelDeleteQuest() {
  confirmDeleteModal.value = { visible: false, questId: null, questTitle: '' }
}

function triggerImportQuest() {
  if (importingQuest.value) return
  importQuestInputRef.value?.click()
}

async function onImportQuestFile(event: Event) {
  const input = event.target as HTMLInputElement
  importingQuest.value = true
  const file = input.files?.[0]
  input.value = ''
  if (!file) {
    importingQuest.value = false
    return
  }
  errorMessage.value = ''
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data || typeof data.title !== 'string' || !Array.isArray(data.rounds)) {
      errorMessage.value = t('host.errImportFormat')
      return
    }
    const questId = await quizStore.importQuest(data)
    selectedQuestId.value = questId
  } catch (err: any) {
    errorMessage.value = err?.message ?? t('host.errImportQuest')
  } finally {
    importingQuest.value = false
  }
}

</script>

<style scoped>
.host-setup {
  height: 100dvh;
  overflow: hidden;
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
  padding: 0 clamp(1rem, 4vw, 3rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
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
  font-weight: 600;
  margin: 0;
  letter-spacing: 0.05em;
  text-shadow: 0 2px 8px rgb(var(--c-bg) / 0.3);
}



.host-header {
  background: linear-gradient(135deg, rgb(var(--c-surface) / 0.6), rgb(var(--c-bg) / 0.55));
  border: 1px solid rgb(var(--c-accent-sky) / 0.14);
  border-radius: 1.25rem;
  padding: 1.35rem 1.75rem;
  box-shadow: 0 12px 30px rgb(var(--c-bg-deep) / 0.35);
  color: rgb(var(--c-text));
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
  color: rgb(var(--c-text-soft) / 0.85);
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
  min-height: 0;
  /* Занимает всё свободное место между шапкой и кнопкой «Начать игру»,
     список внутри скроллится — без наложения на кнопку. */
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: rgb(var(--c-bg) / 0.32);
  border: 1px solid rgb(var(--c-accent-sky) / 0.12);
  border-radius: 1.25rem;
  padding: 1.35rem 1.35rem 0.85rem;
  box-sizing: border-box;
}

.quest-selection::-webkit-scrollbar {
  width: 8px;
}

.quest-selection::-webkit-scrollbar-track {
  background: transparent;
}

.quest-selection::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(var(--c-accent) / 0.45), rgb(var(--c-blue) / 0.45));
  border-radius: 999px;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
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
  color: rgb(var(--c-text-soft) / 0.92);
}

.section-subtitle {
  margin: 0;
  color: rgb(var(--c-text-muted) / 0.9);
  font-size: 0.95rem;
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
  gap: 1.25rem;
  padding-top: 0.2rem;
  overflow-y: auto;
  padding-right: 0.75rem;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-text-muted) / 0.6) transparent;
  flex: 1 1 auto;
  min-height: 0;
  align-content: start;
}

.quests-grid::-webkit-scrollbar {
  width: 8px;
}

.quests-grid::-webkit-scrollbar-track {
  background: transparent;
}

.quests-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, rgb(var(--c-accent) / 0.45), rgb(var(--c-blue) / 0.45));
  border-radius: 999px;
}

.quests-grid::-webkit-scrollbar-thumb:hover {
  background: rgb(var(--c-text-muted) / 0.7);
}

.quest-card {
  position: relative;
  z-index: 0;
  background: rgb(var(--c-surface) / 0.7);
  border-radius: 1.2rem;
  padding: 0.85rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  color: rgb(var(--c-text));
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.quest-card:hover,
.quest-card.active {
  transform: translateY(-3px);
  box-shadow: 0 16px 34px rgb(var(--c-bg-deep) / 0.5);
  border-color: rgb(var(--c-accent-sky) / 0.45);
}

.quest-card__cover {
  position: relative;
  aspect-ratio: 1.05;
  border-radius: 0.8rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(var(--c-violet) / 0.5), rgb(var(--c-blue) / 0.45));
}
.quest-card:nth-child(3n + 2) .quest-card__cover {
  background: linear-gradient(135deg, rgb(var(--c-accent-sky) / 0.5), rgb(var(--c-indigo-500) / 0.5));
}
.quest-card:nth-child(3n) .quest-card__cover {
  background: linear-gradient(135deg, rgb(var(--c-accent) / 0.4), rgb(var(--c-violet) / 0.5));
}
.quest-card__mono {
  font-family: 'Press Start 2P', 'Nunito', monospace;
  font-size: 1.7rem;
  color: rgb(var(--c-white) / 0.92);
  text-shadow: 0 2px 10px rgb(var(--c-bg-deep) / 0.5);
}

.quest-card__body {
  padding: 1.1rem 0.5rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.quest-title {
  margin: 0;
  font-size: 1.02rem;
  font-weight: 800;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quest-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: inline-flex;
  gap: 0.35rem;
  z-index: 2;
}

.quest-action-button {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  backdrop-filter: blur(6px);
  border: 1px solid rgb(var(--c-text-muted) / 0.45);
  background: rgb(var(--c-bg-deep) / 0.75);
  color: rgb(var(--c-text-soft) / 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.quest-action-button svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), color 0.25s ease;
}

.quest-action-button::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 0.4rem);
  left: 50%;
  transform: translate(-50%, 6px);
  background: rgb(var(--c-bg) / 0.92);
  color: rgb(var(--c-text-soft));
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  white-space: nowrap;
  box-shadow: 0 12px 20px rgb(var(--c-bg) / 0.35);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.quest-action-button:hover,
.quest-action-button:focus-visible {
  transform: translateY(-2px);
  border-color: rgb(var(--c-accent) / 0.65);
  background: rgb(var(--c-sky-500) / 0.18);
  box-shadow: 0 12px 24px rgb(var(--c-accent) / 0.25);
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
  border-color: rgb(var(--c-danger-light) / 0.35);
  color: rgb(var(--c-danger-soft));
}

.quest-action-button--danger:hover,
.quest-action-button--danger:focus-visible {
  border-color: rgb(var(--c-danger-light) / 0.7);
  background: rgb(var(--c-danger-light) / 0.18);
  box-shadow: 0 12px 24px rgb(var(--c-danger-light) / 0.25);
}

.quest-action-button--danger:hover svg,
.quest-action-button--danger:focus-visible svg {
  transform: rotate(6deg) scale(1.08);
}

.quest-card--new,
.quest-card--import {
  min-height: 275px;
  border: 2px dashed rgb(var(--c-accent-sky) / 0.45);
  background: rgb(var(--c-accent-sky) / 0.05);
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  text-align: center;
  color: rgb(var(--c-text-soft) / 0.9);
  position: relative;
}

.quest-card--new:hover,
.quest-card--import:hover {
  transform: translateY(-3px);
  border-color: rgb(var(--c-accent-sky) / 0.7);
  background: rgb(var(--c-accent-sky) / 0.1);
  box-shadow: 0 16px 34px rgb(var(--c-bg-deep) / 0.4);
}

.new-quest-circle {
  width: 3.4rem;
  height: 3.4rem;
  border-radius: 50%;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.6);
  background: rgb(var(--c-bg) / 0.5);
  color: rgb(var(--c-accent-soft));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  line-height: 1;
}

.quest-card--new span,
.quest-card--import span {
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  padding: 0 0.75rem;
}
.new-quest-circle svg {
  width: 1.7rem;
  height: 1.7rem;
}
.quest-import-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  font-size: 0;
}
.quest-import-input:disabled {
  cursor: not-allowed;
  pointer-events: none;
}

.quest-meta {
  display: flex;
  gap: 0.4rem;
  align-items: center;
  flex-wrap: wrap;
  font-size: 0.8rem;
  color: rgb(var(--c-text-muted) / 0.85);
}
.quest-meta__dot {
  opacity: 0.5;
}

.quest-empty-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-pill);
  color: rgb(var(--c-danger-soft));
  background: rgb(var(--c-danger) / 0.15);
  border: 1px solid rgb(var(--c-danger) / 0.35);
}

.start-hint {
  margin: 0.4rem 0 0;
  font-size: 0.8rem;
  color: rgb(var(--c-danger-soft));
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
  background: rgb(var(--c-teal) / 0.12);
  border: 1px solid rgb(var(--c-accent) / 0.45);
  color: rgb(var(--c-text));
  letter-spacing: 0.04em;
}

.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgb(var(--c-accent) / 0.28);
}

.primary:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: grayscale(0.6);
  border-color: rgb(var(--c-text-muted) / 0.35);
  background: rgb(var(--c-teal) / 0.08);
  color: rgb(var(--c-text-soft) / 0.4);
}

.secondary {
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-purple)));
  border: 1px solid transparent;
  color: rgb(var(--c-white));
  min-width: 220px;
}

.secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(138, 99, 235, 0.28);
}

.error {
  margin: 0;
  color: rgb(var(--c-danger));
  font-weight: 600;
}


.quest-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgb(var(--c-bg) / 0.65);
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
  background: rgb(var(--c-bg) / 0.95);
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  box-shadow: 0 30px 60px rgb(var(--c-sky-deep) / 0.45);
  color: rgb(var(--c-text));
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
  background: rgb(var(--c-teal) / 0.15);
  border: 1px solid rgb(var(--c-accent) / 0.45);
  color: rgb(var(--c-accent-soft));
  border-radius: 50%;
  width: 34px;
  height: 34px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.quest-modal__close:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgb(var(--c-accent) / 0.3);
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
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  border: 1px solid transparent;
  color: rgb(var(--c-bg));
  box-shadow: 0 12px 24px rgb(var(--c-accent) / 0.28);
  border-radius: 999px;
}

.quest-modal__actions .primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgb(var(--c-accent) / 0.32);
}

.quest-modal__actions .secondary {
  background: rgb(var(--c-teal) / 0.15);
  border: 1px solid rgb(var(--c-accent) / 0.45);
  color: rgb(var(--c-accent-soft));
  border-radius: 999px;
}

.quest-modal__actions .secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgb(var(--c-accent) / 0.22);
}

.quest-modal__actions .danger {
  min-width: 140px;
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  border: 1px solid transparent;
  color: rgb(var(--c-bg));
  box-shadow: 0 12px 24px rgb(var(--c-accent) / 0.28);
  border-radius: 999px;
}

.quest-modal__actions .danger:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 26px rgb(var(--c-accent) / 0.32);
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
    border-radius: 0.9rem;
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
    border-radius: 0.8rem;
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
    border-radius: 0.75rem;
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
    border-radius: 0.7rem;
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
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    padding-right: 0;
    margin-top: 1.2rem;
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
  color: rgb(var(--c-accent-soft));
}

</style>
