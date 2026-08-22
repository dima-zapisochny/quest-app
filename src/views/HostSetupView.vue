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
      <header class="host-hero">
        <h1 class="host-hero__title">{{ t('host.title') }}</h1>
        <p class="host-hero__subtitle">{{ t('host.subtitle') }}</p>
      </header>

      <section class="host-library">
        <p class="host-library__hint">{{ t('host.chooseQuestHint') }}</p>

        <div class="quests-grid">
          <article
            v-for="quest in quests"
            :key="quest.id"
            :class="['quest-card', { active: selectedQuestId === quest.id }]"
            @click="handleCardClick($event, quest.id)"
          >
            <div v-if="selectedQuestId === quest.id" class="quest-card__selected" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
              </svg>
            </div>
            <div
              class="quest-card__cover"
              :style="{ '--cover-hue': questAccentHue(quest.title) }"
            >
              <div
                class="quest-card__board"
                :style="{
                  '--board-cols': questBoardGrid(quest).cols,
                  '--board-rows': questBoardGrid(quest).rows
                }"
              >
                <span
                  v-for="cell in questBoardGrid(quest).cells"
                  :key="cell"
                  class="quest-card__cell"
                />
              </div>
              <span class="quest-card__emoji" aria-hidden="true">{{ questThemeEmoji(quest.title) }}</span>
              <div class="quest-actions" @click.stop @mousedown.stop>
                <button
                  type="button"
                  class="quest-action-button"
                  @click="goToQuestEditor(quest.id)"
                  :aria-label="t('host.editQuestAria')"
                  :title="t('common.edit')"
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
                  :title="t('host.exportTooltip')"
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
                  :title="t('common.delete')"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zm12-15h-3.5l-1-1h-3l-1 1H6v2h12V4z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="quest-card__body">
              <h2 class="quest-title">{{ displayQuestTitle(quest.title) }}</h2>
              <p v-if="quest.description?.trim()" class="quest-desc">{{ quest.description }}</p>
              <div class="quest-meta">
                <span class="quest-meta__pill">{{ t('host.rounds', { count: quest.roundsCount ?? (quest.rounds?.length ?? 0) }) }}</span>
                <span class="quest-meta__pill">{{ t('host.questions', { count: questQuestions(quest) }) }}</span>
                <span v-if="questQuestions(quest) === 0" class="quest-empty-badge">
                  <i aria-hidden="true">⚠</i> {{ t('host.noQuestions') }}
                </span>
              </div>
            </div>
          </article>

          <article class="quest-card quest-card--cta" @click="createNewQuest">
            <div class="quest-card__cover quest-card__cover--dashed">
              <span class="new-quest-circle">+</span>
            </div>
            <div class="quest-card__body quest-card__body--cta">
              <span class="quest-card__ctalabel">{{ t('host.createNewQuest') }}</span>
              <span class="quest-card__ctahint">{{ t('host.createNewQuestHint') }}</span>
            </div>
          </article>

          <article class="quest-card quest-card--cta quest-card--import" @click.stop="triggerImportQuest">
            <input
              ref="importQuestInputRef"
              type="file"
              accept=".json,application/json"
              class="quest-import-input"
              :disabled="importingQuest"
              @change="onImportQuestFile"
            />
            <div class="quest-card__cover quest-card__cover--dashed">
              <span class="new-quest-circle import-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M20 15v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-4"/>
                </svg>
              </span>
            </div>
            <div class="quest-card__body quest-card__body--cta">
              <span class="quest-card__ctalabel">{{ importingQuest ? t('host.importing') : t('host.importQuest') }}</span>
              <span class="quest-card__ctahint">{{ t('host.importQuestHint') }}</span>
            </div>
          </article>
        </div>
      </section>

      <footer class="host-dock">
        <div class="host-dock__inner">
          <div class="host-dock__info">
            <template v-if="selectedQuest">
              <span class="host-dock__label">{{ t('host.selectedQuest') }}</span>
              <strong class="host-dock__quest">{{ displayQuestTitle(selectedQuest.title) }}</strong>
              <span class="host-dock__stats">
                {{ t('host.rounds', { count: selectedQuest.roundsCount ?? (selectedQuest.rounds?.length ?? 0) }) }}
                ·
                {{ t('host.questions', { count: questQuestions(selectedQuest) }) }}
              </span>
            </template>
            <p v-else class="host-dock__placeholder">{{ t('host.pickQuestHint') }}</p>
          </div>
          <div class="host-dock__actions">
            <button
              class="host-dock__start"
              :disabled="!selectedQuestId || isMobileViewport || selectedQuestEmpty"
              :title="startDisabledReason"
              @click="handleStart"
            >
              <span class="host-dock__start-glow" aria-hidden="true" />
              <span>{{ t('host.startGame') }}</span>
            </button>
            <p v-if="selectedQuestId && selectedQuestEmpty" class="start-hint">{{ t('host.startHint') }}</p>
            <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
          </div>
        </div>
      </footer>
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
import { displayQuestTitle, questAccentHue, questBoardGrid, questThemeEmoji } from '@/utils/questCardTheme'

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
const selectedQuest = computed(() =>
  selectedQuestId.value ? quests.value.find(q => q.id === selectedQuestId.value) ?? null : null
)
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
  flex-direction: column;
  max-width: 1040px;
  width: 100%;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem);
  box-sizing: border-box;
}

/* ── Hero ── */
.host-hero {
  flex-shrink: 0;
  text-align: center;
  padding: 0.5rem 0 1.25rem;
}

.host-hero__title {
  margin: 0;
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(1rem, 2.8vw, 1.55rem);
  line-height: 1.55;
  letter-spacing: 0.06em;
  color: rgb(var(--c-text));
  text-shadow: 0 0 28px rgb(var(--c-accent-sky) / 0.25);
}

.host-hero__subtitle {
  margin: 0.85rem auto 0;
  max-width: 36rem;
  font-size: 0.95rem;
  line-height: 1.5;
  color: rgb(var(--c-text-muted) / 0.9);
}

/* ── Library ── */
.host-library {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.host-library__hint {
  flex-shrink: 0;
  margin: 0 0 1rem;
  text-align: center;
  font-size: 0.88rem;
  color: rgb(var(--c-text-soft) / 0.75);
}

.quests-grid {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-content: flex-start;
  gap: 1.1rem;
  overflow-y: auto;
  padding: 0.25rem 0.5rem 1rem;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-accent-sky) / 0.4) transparent;
}

.quests-grid::-webkit-scrollbar {
  width: 6px;
}

.quests-grid::-webkit-scrollbar-thumb {
  background: rgb(var(--c-accent-sky) / 0.45);
  border-radius: 999px;
}

/* ── Quest cards ── */
.quest-card {
  position: relative;
  width: min(100%, 240px);
  flex: 0 0 auto;
  background: linear-gradient(165deg, rgb(var(--c-surface) / 0.92), rgb(var(--c-bg) / 0.75));
  border-radius: 1.15rem;
  padding: 0.85rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.16);
  color: rgb(var(--c-text));
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  box-shadow: 0 10px 28px rgb(var(--c-bg-deep) / 0.35);
}

.quest-card:hover {
  transform: translateY(-4px);
  border-color: rgb(var(--c-accent-sky) / 0.38);
  box-shadow: 0 18px 40px rgb(var(--c-bg-deep) / 0.5);
}

.quest-card.active {
  border-color: rgb(var(--c-accent) / 0.65);
  box-shadow:
    0 0 0 1px rgb(var(--c-accent) / 0.35),
    0 18px 42px rgb(var(--c-accent-sky) / 0.18);
}

.quest-card__selected {
  position: absolute;
  top: 0.65rem;
  left: 0.65rem;
  z-index: 3;
  width: 1.55rem;
  height: 1.55rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg-deep));
  box-shadow: 0 4px 12px rgb(var(--c-accent) / 0.45);
}

.quest-card__cover {
  position: relative;
  aspect-ratio: 1;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(145deg, hsl(var(--cover-hue, 250) 55% 42%), hsl(calc(var(--cover-hue, 250) + 35) 60% 28%));
}

.quest-card--cta .quest-card__cover {
  background: rgb(var(--c-accent-sky) / 0.04);
}

.quest-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 28% 18%, rgb(var(--c-white) / 0.22), transparent 52%);
  pointer-events: none;
}

.quest-card__board {
  position: relative;
  z-index: 1;
  width: 72%;
  aspect-ratio: var(--board-cols, 3) / var(--board-rows, 2);
  display: grid;
  grid-template-columns: repeat(var(--board-cols, 3), 1fr);
  grid-template-rows: repeat(var(--board-rows, 2), 1fr);
  gap: 3px;
  padding: 4px;
  border-radius: 0.45rem;
  background: rgb(var(--c-bg-deep) / 0.35);
  border: 1px solid rgb(var(--c-white) / 0.15);
  box-shadow: 0 8px 20px rgb(var(--c-bg-deep) / 0.35);
}

.quest-card__cell {
  border-radius: 0.2rem;
  background: rgb(var(--c-white) / 0.14);
  border: 1px solid rgb(var(--c-white) / 0.12);
  box-shadow: inset 0 1px 0 rgb(var(--c-white) / 0.08);
}

.quest-card__cell:nth-child(3n + 1) {
  background: rgb(var(--c-white) / 0.22);
}

.quest-card__emoji {
  position: absolute;
  left: 0.55rem;
  bottom: 0.55rem;
  z-index: 2;
  font-size: 1.35rem;
  line-height: 1;
  filter: drop-shadow(0 2px 6px rgb(var(--c-bg-deep) / 0.55));
}

.quest-card__body {
  padding: 0.85rem 0.25rem 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.quest-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quest-desc {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.4;
  color: rgb(var(--c-text-muted) / 0.88);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quest-actions {
  position: absolute;
  top: 0.45rem;
  right: 0.45rem;
  display: inline-flex;
  gap: 0.05rem;
  z-index: 2;
  padding: 0.15rem;
  border-radius: 999px;
  background: rgb(var(--c-bg-deep) / 0.6);
  border: 1px solid rgb(var(--c-white) / 0.08);
  backdrop-filter: blur(8px);
}

.quest-action-button {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease;
}

.quest-action-button svg {
  width: 15px;
  height: 15px;
  fill: currentColor;
}

.quest-action-button:hover,
.quest-action-button:focus-visible {
  outline: none;
  background: rgb(var(--c-white) / 0.14);
  color: rgb(var(--c-text));
}

.quest-action-button--danger {
  color: rgb(var(--c-danger-soft) / 0.85);
}

.quest-action-button--danger:hover,
.quest-action-button--danger:focus-visible {
  background: rgb(var(--c-danger) / 0.3);
  color: rgb(var(--c-danger-soft));
}

.quest-card__cover--dashed {
  background: rgb(var(--c-accent-sky) / 0.04);
  border: 1.5px dashed rgb(var(--c-accent-sky) / 0.35);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.quest-card__cover--dashed::after {
  content: none;
}

.quest-card--cta:hover .quest-card__cover--dashed {
  border-color: rgb(var(--c-accent-sky) / 0.65);
  background: rgb(var(--c-accent-sky) / 0.08);
}

.new-quest-circle {
  width: 3.75rem;
  height: 3.75rem;
  border-radius: 50%;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.55);
  background: rgb(var(--c-bg) / 0.45);
  color: rgb(var(--c-accent-soft));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  line-height: 1;
}

.new-quest-circle svg {
  width: 1.5rem;
  height: 1.5rem;
}

.quest-card__body--cta {
  align-items: center;
  text-align: center;
  gap: 0.25rem;
}

.quest-card__ctalabel {
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--c-text-soft) / 0.95);
}

.quest-card__ctahint {
  font-size: 0.72rem;
  color: rgb(var(--c-text-muted) / 0.8);
  line-height: 1.35;
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
  gap: 0.35rem;
  align-items: center;
  flex-wrap: wrap;
}

.quest-meta__pill {
  font-size: 0.68rem;
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  background: rgb(var(--c-bg) / 0.55);
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  color: rgb(var(--c-text-muted) / 0.95);
}

.quest-empty-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  padding: 0.15rem 0.55rem;
  border-radius: var(--radius-pill);
  color: rgb(var(--c-danger-soft));
  background: rgb(var(--c-danger) / 0.15);
  border: 1px solid rgb(var(--c-danger) / 0.35);
}

/* ── Bottom dock ── */
.host-dock {
  flex-shrink: 0;
  padding: 0.75rem 0 1.25rem;
}

.host-dock__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1rem 1.25rem;
  border-radius: 1.15rem;
  background: linear-gradient(135deg, rgb(var(--c-surface) / 0.88), rgb(var(--c-bg) / 0.82));
  border: 1px solid rgb(var(--c-accent-sky) / 0.22);
  box-shadow:
    0 -8px 32px rgb(var(--c-bg-deep) / 0.35),
    inset 0 1px 0 rgb(var(--c-white) / 0.06);
  backdrop-filter: blur(14px);
}

.host-dock__info {
  min-width: 0;
  flex: 1;
}

.host-dock__label {
  display: block;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(var(--c-text-muted) / 0.75);
  margin-bottom: 0.2rem;
}

.host-dock__quest {
  display: block;
  font-size: 1.05rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--c-text));
}

.host-dock__stats {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.78rem;
  color: rgb(var(--c-text-muted) / 0.85);
}

.host-dock__placeholder {
  margin: 0;
  font-size: 0.88rem;
  color: rgb(var(--c-text-muted) / 0.8);
}

.host-dock__actions {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.35rem;
}

.host-dock__start {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(var(--c-accent) / 0.55);
  border-radius: 999px;
  padding: 0.85rem 2rem;
  min-width: 200px;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: rgb(var(--c-text));
  background: linear-gradient(135deg, rgb(var(--c-teal) / 0.35), rgb(var(--c-accent-sky) / 0.2));
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}

.host-dock__start-glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgb(var(--c-white) / 0.12) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.5s ease;
}

.host-dock__start:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 12px 28px rgb(var(--c-accent) / 0.28);
}

.host-dock__start:hover:not(:disabled) .host-dock__start-glow {
  transform: translateX(100%);
}

.host-dock__start:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
  filter: grayscale(0.5);
}

.start-hint {
  margin: 0;
  font-size: 0.75rem;
  color: rgb(var(--c-danger-soft));
  text-align: right;
}

.error {
  margin: 0;
  color: rgb(var(--c-danger));
  font-weight: 600;
  font-size: 0.8rem;
  text-align: right;
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
  .host-hero__title {
    font-size: clamp(0.85rem, 4vw, 1.1rem);
  }

  .host-dock__inner {
    flex-direction: column;
    align-items: stretch;
    gap: 0.85rem;
  }

  .host-dock__actions {
    align-items: stretch;
  }

  .host-dock__start {
    width: 100%;
    min-width: 0;
  }

  .start-hint,
  .error {
    text-align: center;
  }

  .quest-card {
    width: min(100%, 200px);
  }
}

@media (max-width: 480px) {
  .host-main {
    padding: 0 0.75rem;
  }

  .quests-grid {
    gap: 0.75rem;
  }

  .quest-card {
    width: calc(50% - 0.5rem);
    min-width: 140px;
  }

  .quest-title {
    font-size: 0.85rem;
  }

  .host-dock {
    padding-bottom: 0.85rem;
  }
}
</style>
