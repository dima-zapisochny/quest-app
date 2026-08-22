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

    <main v-else class="host-main">
      <div class="host-panel">
        <header class="host-hero">
          <h1 class="host-hero__title">{{ t('host.title') }}</h1>
          <p class="host-hero__subtitle">{{ t('host.subtitle') }}</p>
        </header>

        <div class="host-quests">
          <div class="host-quests__grid">
            <article
              v-for="quest in quests"
              :key="quest.id"
              :class="['quest-tile', { 'quest-tile--active': selectedQuestId === quest.id }]"
              @click="handleCardClick($event, quest.id)"
            >
              <div class="quest-tile__main">
                <h2 class="quest-tile__title">{{ displayQuestTitle(quest.title) }}</h2>
                <p class="quest-tile__meta">
                  {{ t('host.rounds', { count: quest.roundsCount ?? (quest.rounds?.length ?? 0) }) }}
                  ·
                  {{ t('host.questions', { count: questQuestions(quest) }) }}
                </p>
                <span v-if="questQuestions(quest) === 0" class="quest-empty-badge">{{ t('host.noQuestions') }}</span>
              </div>
              <div class="quest-tile__actions" @click.stop @mousedown.stop>
                <button type="button" class="quest-action-button" @click="goToQuestEditor(quest.id)" :aria-label="t('host.editQuestAria')" :title="t('common.edit')">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.04a1.003 1.003 0 0 0 0-1.42l-2.5-2.5a1.003 1.003 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1-1z"></path></svg>
                </button>
                <button type="button" class="quest-action-button" @click="exportQuest(quest.id)" :aria-label="t('host.exportQuestAria')" :title="t('host.exportTooltip')">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                </button>
                <button type="button" class="quest-action-button quest-action-button--danger" @click="deleteQuest(quest.id)" :aria-label="t('host.deleteQuestAria')" :title="t('common.delete')">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm12-15h-3.5l-1-1h-3l-1 1H6v2h12V4z"></path></svg>
                </button>
              </div>
            </article>
          </div>

          <div class="host-quests__toolbar">
            <button type="button" class="host-toolbar-btn" @click="createNewQuest">
              <span class="host-toolbar-btn__icon">+</span>
              {{ t('host.createNewQuest') }}
            </button>
            <button type="button" class="host-toolbar-btn" :disabled="importingQuest" @click.stop="triggerImportQuest">
              <input ref="importQuestInputRef" type="file" accept=".json,application/json" class="quest-import-input" :disabled="importingQuest" @change="onImportQuestFile" />
              <span class="host-toolbar-btn__icon" aria-hidden="true">↑</span>
              {{ importingQuest ? t('host.importing') : t('host.importQuest') }}
            </button>
          </div>
        </div>

        <footer class="host-panel__footer">
          <button
            class="host-start primary"
            :disabled="!selectedQuestId || isMobileViewport || selectedQuestEmpty"
            :title="startDisabledReason"
            @click="handleStart"
          >
            <span class="btn-glow" aria-hidden="true" />
            <span class="btn-text">{{ t('host.startGame') }}</span>
          </button>
          <p v-if="selectedQuestId && selectedQuestEmpty" class="start-hint">{{ t('host.startHint') }}</p>
          <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
        </footer>
      </div>
    </main>

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
import { seedTestQuests } from '@/utils/seedTestQuests'
import { displayQuestTitle } from '@/utils/questCardTheme'

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
  const questCard = target.closest('.quest-tile')
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

  await seedTestQuests(quizStore)

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
/* ── Page shell ── */
.host-setup {
  position: relative;
  height: 100dvh;
  overflow: hidden;
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.host-main {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 2vw, 1.5rem);
  box-sizing: border-box;
}

/* ── Glass panel (landing-style) ── */
.host-panel {
  width: min(720px, 100%);
  max-height: calc(100dvh - 5rem);
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  padding: clamp(1.75rem, 4vw, 2.75rem);
  border-radius: 2rem;
  background: rgba(12, 19, 36, 0.65);
  backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  box-shadow: 0 45px 90px rgba(5, 12, 28, 0.65);
  box-sizing: border-box;
  overflow: hidden;
}

/* ── Hero ── */
.host-hero {
  flex-shrink: 0;
  text-align: center;
}

.host-hero__title {
  margin: 0;
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(0.95rem, 2.6vw, 1.45rem);
  line-height: 1.55;
  letter-spacing: 0.06em;
  color: rgb(var(--c-text));
  text-shadow: 0 0 28px rgb(var(--c-accent-sky) / 0.25);
}

.host-hero__subtitle {
  margin: 0.85rem auto 0;
  max-width: 32rem;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(0.9rem, 2vw, 1.05rem);
  line-height: 1.5;
  color: rgb(var(--c-text-soft) / 0.9);
}

/* ── Quest grid ── */
.host-quests {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.host-quests__grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  overflow-y: auto;
  padding: 0.15rem;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-accent-sky) / 0.4) transparent;
}

.host-quests__grid::-webkit-scrollbar {
  width: 6px;
}

.host-quests__grid::-webkit-scrollbar-thumb {
  background: rgb(var(--c-accent-sky) / 0.45);
  border-radius: 999px;
}

.quest-tile {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.65rem;
  min-height: 5.5rem;
  padding: 1rem 1.1rem;
  border-radius: 1.1rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  background: rgb(var(--c-bg-deep) / 0.55);
  box-shadow: inset 0 1px 0 rgb(var(--c-white) / 0.04);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
}

.quest-tile:hover {
  border-color: rgb(var(--c-accent-sky) / 0.38);
  background: rgb(var(--c-bg-deep) / 0.72);
  transform: translateY(-1px);
}

.quest-tile--active {
  border-color: rgb(var(--c-orange-500) / 0.65);
  background: linear-gradient(145deg, rgb(var(--c-orange-500) / 0.12), rgb(var(--c-bg-deep) / 0.7));
  box-shadow:
    0 0 0 1px rgb(var(--c-orange-500) / 0.25),
    0 12px 28px rgb(var(--c-orange-500) / 0.12);
}

.quest-tile__main {
  min-width: 0;
}

.quest-tile__title {
  margin: 0;
  font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1.35;
  color: rgb(var(--c-text));
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quest-tile__meta {
  margin: 0.4rem 0 0;
  font-size: 0.75rem;
  color: rgb(var(--c-text-muted) / 0.9);
}

.quest-tile__actions {
  display: inline-flex;
  gap: 0.1rem;
  opacity: 0;
  transition: opacity 0.18s ease;
}

.quest-tile:hover .quest-tile__actions,
.quest-tile--active .quest-tile__actions {
  opacity: 1;
}

.quest-action-button {
  width: 28px;
  height: 28px;
  border-radius: 0.45rem;
  border: none;
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.quest-action-button svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.quest-action-button:hover,
.quest-action-button:focus-visible {
  outline: none;
  background: rgb(var(--c-white) / 0.1);
  color: rgb(var(--c-text));
}

.quest-action-button--danger {
  color: rgb(var(--c-danger-soft) / 0.9);
}

.quest-action-button--danger:hover,
.quest-action-button--danger:focus-visible {
  background: rgb(var(--c-danger) / 0.2);
}

.quest-empty-badge {
  display: inline-block;
  margin-top: 0.35rem;
  font-size: 0.65rem;
  padding: 0.1rem 0.45rem;
  border-radius: 999px;
  color: rgb(var(--c-danger-soft));
  background: rgb(var(--c-danger) / 0.12);
  border: 1px solid rgb(var(--c-danger) / 0.28);
}

/* Toolbar */
.host-quests__toolbar {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.65rem;
}

.host-toolbar-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.7rem 0.85rem;
  border-radius: 0.9rem;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.35);
  background: rgb(var(--c-bg-deep) / 0.45);
  color: rgb(var(--c-text-soft));
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.host-toolbar-btn:hover:not(:disabled) {
  border-color: rgb(var(--c-accent-sky) / 0.55);
  background: rgb(var(--c-accent-sky) / 0.08);
  color: rgb(var(--c-text));
}

.host-toolbar-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.host-toolbar-btn__icon {
  font-size: 1rem;
  line-height: 1;
  color: rgb(var(--c-accent-soft));
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

/* ── Footer / start button (landing primary) ── */
.host-panel__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.5rem;
}

.host-start.primary {
  position: relative;
  width: 100%;
  border: none;
  border-radius: 1.25rem;
  padding: 1.05rem 1.8rem;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
  color: rgb(var(--c-bg));
  display: inline-flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: radial-gradient(circle at 25% 25%, rgba(253, 224, 71, 0.6), transparent 55%),
    linear-gradient(135deg, rgb(var(--c-orange-500)), rgb(var(--c-gold)));
  box-shadow: 0 20px 42px rgb(var(--c-orange-500) / 0.45);
  transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease;
}

.host-start.primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 26px 52px rgb(var(--c-orange-500) / 0.4);
}

.host-start.primary:hover:not(:disabled) .btn-glow {
  opacity: 1;
}

.host-start.primary:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}

.host-start.primary:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  transform: none;
}

.host-start.primary:disabled:hover .btn-glow {
  opacity: 0;
}

.btn-glow {
  position: absolute;
  inset: -20%;
  background: radial-gradient(circle, rgb(var(--c-white) / 0.4), transparent 60%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.btn-text {
  position: relative;
  z-index: 1;
}

.start-hint {
  margin: 0;
  font-size: 0.78rem;
  color: rgb(var(--c-danger-soft));
  text-align: center;
}

.error {
  margin: 0;
  color: rgb(var(--c-danger));
  font-weight: 600;
  font-size: 0.8rem;
  text-align: center;
}

/* ── Loading ── */
.host-loading-wrapper {
  position: fixed;
  inset: 0;
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
}

.loader::before {
  content: '';
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid transparent;
  border-top-color: rgb(var(--c-accent));
  border-right-color: rgb(var(--c-accent-sky));
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.loading-state p {
  color: rgb(var(--c-text-soft) / 0.9);
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
}

/* ── Modal ── */
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
}

.quest-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.quest-modal__actions .secondary,
.quest-modal__actions .primary,
.quest-modal__actions .danger {
  min-width: 140px;
  border-radius: 999px;
  padding: 0.65rem 1.25rem;
  font-weight: 600;
  cursor: pointer;
}

.quest-modal__actions .secondary {
  background: rgb(var(--c-teal) / 0.15);
  border: 1px solid rgb(var(--c-accent) / 0.45);
  color: rgb(var(--c-accent-soft));
}

.quest-modal__actions .primary,
.quest-modal__actions .danger {
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  border: 1px solid transparent;
  color: rgb(var(--c-bg));
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .host-panel {
    max-height: calc(100dvh - 3.5rem);
    padding: 1.5rem 1.25rem;
    gap: 1.25rem;
    border-radius: 1.5rem;
  }

  .host-hero__title {
    font-size: clamp(0.8rem, 4vw, 1rem);
  }

  .host-quests__grid {
    grid-template-columns: 1fr;
  }

  .quest-tile__actions {
    opacity: 1;
  }
}

@media (max-width: 480px) {
  .host-main {
    padding: 0.5rem;
  }

  .host-panel {
    padding: 1.25rem 1rem;
    border-radius: 1.25rem;
  }

  .host-quests__toolbar {
    grid-template-columns: 1fr;
  }
}
</style>
