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

    <main v-else class="host-main" :style="mainGridStyle">
      <header class="host-hero">
        <h1 class="host-hero__title">{{ t('host.title') }}</h1>
        <p class="host-hero__subtitle">{{ t('host.subtitle') }}</p>
      </header>

      <section ref="libraryRef" class="host-library">
        <div ref="gridRef" class="quests-grid" :style="questsGridStyle">
          <article
            v-for="quest in quests"
            :key="quest.id"
            :class="['quest-card', { active: selectedQuestId === quest.id }]"
            @click="handleCardClick($event, quest.id)"
          >
            <div v-if="selectedQuestId === quest.id" class="quest-card__selected" aria-hidden="true">
              <span class="quest-card__selected-waves">
                <span v-for="n in 3" :key="n" class="quest-card__check-wave" />
              </span>
              <span class="quest-card__selected-icon">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>
                </svg>
              </span>
            </div>
            <div class="quest-card__cover">
              <span class="quest-card__emoji" aria-hidden="true">{{ questDisplayEmoji(quest) }}</span>
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
              <p class="quest-desc">{{ quest.description?.trim() || '' }}</p>
              <div class="quest-meta">
                <span>{{ t('host.rounds', { count: quest.roundsCount ?? (quest.rounds?.length ?? 0) }) }}</span>
                <span class="quest-meta__sep">·</span>
                <span>{{ t('host.questions', { count: questQuestions(quest) }) }}</span>
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
              <div class="host-dock__selection">
                <strong class="host-dock__quest">{{ displayQuestTitle(selectedQuest.title) }}</strong>
                <span class="host-dock__sep" aria-hidden="true">·</span>
                <span class="host-dock__stats">
                  {{ t('host.rounds', { count: selectedQuest.roundsCount ?? (selectedQuest.rounds?.length ?? 0) }) }}
                  ·
                  {{ t('host.questions', { count: questQuestions(selectedQuest) }) }}
                </span>
              </div>
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

    <ConfirmDialog
      :show="confirmDeleteModal.visible"
      :title="t('host.deleteConfirmTitle')"
      :message="t('host.deleteConfirmBody', { title: confirmDeleteModal.questTitle })"
      :confirm-label="t('common.delete')"
      confirm-variant="danger"
      @confirm="confirmDeleteQuest"
      @cancel="cancelDeleteQuest"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import AppHeader from '@/components/common/AppHeader.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useIsMobileViewport } from '@/composables/useIsMobileViewport'
import { seedStandardQuests, sortQuestsWithStandardsFirst } from '@/utils/seedStandardQuests'
import { displayQuestTitle, questDisplayEmoji } from '@/utils/questCardTheme'
import { playQuestDeselectSound, playQuestSelectSound } from '@/utils/uiSound'
import { mapAppError } from '@/utils/mapAppError'

const { t } = useI18n()
const importingQuest = ref(false)
const importQuestInputRef = ref<HTMLInputElement | null>(null)

const router = useRouter()
const route = useRoute()
const quizStore = useQuizStore()
const sessionStore = useGameSessionStore()
const { isMobileViewport } = useIsMobileViewport()

const quests = computed(() => sortQuestsWithStandardsFirst(quizStore.quests))
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

const libraryRef = ref<HTMLElement | null>(null)
const gridRef = ref<HTMLElement | null>(null)
const gridCols = ref(4)
const gridMaxHeight = ref('')

const CARD_MAX_WIDTH = 240
let layoutFrame = 0
let gridResizeObserver: ResizeObserver | null = null

const mainGridStyle = computed(() => ({
  '--grid-cols': String(gridCols.value)
}))

const questsGridStyle = computed(() => ({
  '--grid-cols': String(gridCols.value),
  maxHeight: gridMaxHeight.value || undefined
}))

function measureRowStride(grid: HTMLElement): { rowH: number; rowGap: number } {
  const styles = getComputedStyle(grid)
  const fallbackGap = parseFloat(styles.rowGap || styles.gap) || 17.6
  const cards = [...grid.querySelectorAll<HTMLElement>('.quest-card')]
  if (!cards.length) return { rowH: 0, rowGap: fallbackGap }

  const sorted = [...cards].sort((a, b) => a.offsetTop - b.offsetTop)
  const firstTop = sorted[0].offsetTop
  const firstRow = sorted.filter((c) => c.offsetTop === firstTop)
  const rowH = Math.max(...firstRow.map((c) => c.offsetHeight))

  const nextRow = sorted.find((c) => c.offsetTop > firstTop)
  const rowGap = nextRow ? nextRow.offsetTop - firstTop - rowH : fallbackGap

  return { rowH, rowGap }
}

function updateQuestGridLayout() {
  const library = libraryRef.value
  const grid = gridRef.value
  if (!library || !grid) return

  const styles = getComputedStyle(grid)
  const padTop = parseFloat(styles.paddingTop) || 0
  const innerW = library.clientWidth

  const sample = grid.querySelector<HTMLElement>('.quest-card')
  let cardW = CARD_MAX_WIDTH
  if (sample) {
    const maxW = parseFloat(getComputedStyle(sample).maxWidth)
    cardW = Number.isFinite(maxW) && maxW > 0 ? maxW : sample.offsetWidth
  }

  const cols = Math.max(1, Math.min(4, Math.floor((innerW + 17.6) / (cardW + 17.6))))
  gridCols.value = cols

  requestAnimationFrame(() => {
    const { rowH, rowGap } = measureRowStride(grid)
    if (!rowH) return

    const cardCount = grid.querySelectorAll('.quest-card').length
    const neededRows = Math.max(1, Math.ceil(cardCount / cols))

    const availH = library.clientHeight
    let rows = Math.floor((availH - padTop + rowGap) / (rowH + rowGap))
    rows = Math.max(1, Math.min(3, rows, neededRows))

    // Висота рівно до межі наступного рядка — без «торчащих» карток
    gridMaxHeight.value = `${Math.floor(padTop + rows * rowH + rows * rowGap) - 4}px`
  })
}

function scheduleQuestGridLayout() {
  cancelAnimationFrame(layoutFrame)
  layoutFrame = requestAnimationFrame(() => {
    void nextTick(updateQuestGridLayout)
  })
}

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

  scheduleQuestGridLayout()
  gridResizeObserver = new ResizeObserver(scheduleQuestGridLayout)
  if (libraryRef.value) gridResizeObserver.observe(libraryRef.value)
  window.addEventListener('resize', scheduleQuestGridLayout)
  window.addEventListener('click', handleClickOutside)
})

watch(quests, scheduleQuestGridLayout)
watch(loading, (isLoading) => {
  if (!isLoading) scheduleQuestGridLayout()
})

async function checkProfileAndLoad() {
  try {
    sessionStore.ensureProfile()
  } catch (error) {
    router.replace('/')
    return
  }

  if (!quizStore.quests.length) {
    await quizStore.loadFromStorage()
  }

  await seedStandardQuests(quizStore)

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
  gridResizeObserver?.disconnect()
  window.removeEventListener('resize', scheduleQuestGridLayout)
  window.removeEventListener('click', handleClickOutside)
  cancelAnimationFrame(layoutFrame)
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
    void playQuestDeselectSound()
  } else {
    selectedQuestId.value = questId
    void playQuestSelectSound()
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
    errorMessage.value = mapAppError(error, t, 'host.errCreateGame')
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
    questTitle: displayQuestTitle(quest.title) || quest.title || '—'
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
    errorMessage.value = mapAppError(err, t, 'host.errImportQuest')
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
  background: rgb(var(--c-bg));
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
  max-width: calc(var(--grid-cols, 4) * 240px + (var(--grid-cols, 4) - 1) * 1.1rem + 5.25rem);
  width: 100%;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem);
  box-sizing: border-box;
}

/* ── Hero ── */
.host-hero {
  flex-shrink: 0;
  text-align: center;
  padding: 0.5rem 0 1.1rem;
}

.host-hero__title {
  margin: 0;
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(1.25rem, 3.8vw, 2.1rem);
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
  align-items: flex-start;
  justify-content: center;
  overflow: visible;
  padding-bottom: 0.75rem;
}

.quests-grid {
  box-sizing: border-box;
  flex: 0 1 auto;
  width: min(100%, calc(var(--grid-cols, 4) * 240px + (var(--grid-cols, 4) - 1) * 1.1rem + 1.25rem));
  margin-inline: auto;
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 4), minmax(0, 240px));
  justify-content: center;
  align-content: start;
  gap: 1.1rem;
  overflow-x: hidden;
  overflow-y: auto;
  /* місце під hover зверху + відступ від скролбара справа */
  padding: 0.25rem 0.75rem 0 0.5rem;
  scroll-padding-top: 0.5rem;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-accent-sky) / 0.4) transparent;
  scroll-snap-type: y mandatory;
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
  box-sizing: border-box;
  width: 100%;
  max-width: 240px;
  justify-self: center;
  scroll-snap-align: start;
  background: rgb(var(--c-surface) / 0.4);
  border-radius: 1.15rem;
  padding: 0.85rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.1);
  color: rgb(var(--c-text));
  display: flex;
  flex-direction: column;
  cursor: pointer;
  overflow: hidden;
  transition: transform 0.22s ease, border-color 0.22s ease;
  box-shadow: none;
}

.quest-card:hover {
  transform: translateY(-4px);
  border-color: rgb(var(--c-accent-sky) / 0.28);
}

.quest-card.active {
  z-index: 2;
  overflow: visible;
  border-color: rgb(var(--c-accent) / 0.55);
  box-shadow: 0 0 0 1px rgb(var(--c-accent) / 0.25);
}

.quest-card__selected {
  position: absolute;
  top: 0.65rem;
  left: 0.65rem;
  z-index: 4;
  width: 1.55rem;
  height: 1.55rem;
  pointer-events: none;
}

.quest-card__selected-waves {
  position: absolute;
  inset: 0;
}

.quest-card__check-wave {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgb(var(--c-accent) / 0.42);
  animation: quest-check-wave 2.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.quest-card__check-wave:nth-child(2) {
  animation-delay: 0.93s;
}

.quest-card__check-wave:nth-child(3) {
  animation-delay: 1.86s;
}

@keyframes quest-check-wave {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  100% {
    transform: scale(2.55);
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .quest-card__check-wave {
    animation: none;
    opacity: 0;
  }
}

.quest-card__selected-icon {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
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
  box-sizing: border-box;
  aspect-ratio: 1;
  flex-shrink: 0;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--c-surface-2) / 0.28);
}

.quest-card.active .quest-card__cover {
  box-shadow: inset 0 0 0 1px rgb(var(--c-accent) / 0.2);
}

.quest-card--cta .quest-card__cover {
  background: rgb(var(--c-surface-2) / 0.28);
}

.quest-card__cover::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
  background: radial-gradient(circle at 30% 22%, rgb(var(--c-white) / 0.05), transparent 55%);
  pointer-events: none;
}

.quest-card__emoji {
  position: relative;
  z-index: 2;
  font-size: clamp(2.5rem, 8vw, 3.25rem);
  line-height: 1;
  filter: drop-shadow(0 4px 14px rgb(var(--c-bg-deep) / 0.45));
}

.quest-card__body {
  /* Фіксована підложка: title 2 рядки + desc 2 + meta, без дірки між ними */
  --q-title-size: 1rem;
  --q-title-lh: 1.25;
  --q-desc-size: 0.72rem;
  --q-desc-lh: 1.4;
  --q-gap: 0.4rem;
  --q-meta-h: 1.15rem;
  --q-pad-top: 0.85rem;
  --q-pad-bottom: 0.35rem;

  flex: 0 0 auto;
  box-sizing: border-box;
  padding: var(--q-pad-top) 0.25rem var(--q-pad-bottom);
  display: flex;
  flex-direction: column;
  gap: var(--q-gap);
  height: calc(
    var(--q-pad-top) + var(--q-pad-bottom)
    + (var(--q-title-size) * var(--q-title-lh) * 2)
    + (var(--q-desc-size) * var(--q-desc-lh) * 2)
    + var(--q-meta-h)
    + (var(--q-gap) * 2)
  );
}

.quest-title {
  margin: 0;
  flex: 0 0 auto;
  height: calc(var(--q-title-size) * var(--q-title-lh) * 2);
  font-size: var(--q-title-size);
  font-weight: 800;
  line-height: var(--q-title-lh);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quest-desc {
  margin: 0;
  flex: 0 0 auto;
  height: calc(var(--q-desc-size) * var(--q-desc-lh) * 2);
  font-size: var(--q-desc-size);
  line-height: var(--q-desc-lh);
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
  background: rgb(var(--c-surface-2) / 0.28);
  border: 1.5px dashed rgb(var(--c-accent-sky) / 0.28);
  transition: border-color 0.2s ease, background 0.2s ease;
}

.quest-card__cover--dashed::after {
  content: none;
}

.quest-card--cta:hover .quest-card__cover--dashed {
  border-color: rgb(var(--c-accent-sky) / 0.45);
  background: rgb(var(--c-surface-2) / 0.36);
}

.quest-card__body--cta {
  align-items: center;
  justify-content: center;
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
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  flex: 0 0 auto;
  min-height: 1.15rem;
  font-size: 0.75rem;
  color: rgb(var(--c-text-muted) / 0.9);
}

.quest-meta__sep {
  opacity: 0.45;
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

.host-dock__selection {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

.host-dock__quest {
  font-size: 1.05rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgb(var(--c-text));
  flex: 0 1 auto;
  min-width: 0;
}

.host-dock__sep {
  flex: 0 0 auto;
  color: rgb(var(--c-text-muted) / 0.45);
  font-size: 1.1rem;
  line-height: 1;
  user-select: none;
}

.host-dock__stats {
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
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
  background: rgb(var(--c-bg));
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

/* ── Responsive ── */
@media (max-width: 768px) {
  .host-main {
    gap: 0.55rem;
    overflow-y: auto;
    padding-bottom: 0.5rem;
  }

  .host-hero {
    padding: 0.3rem 0 0.85rem;
  }

  .host-hero__title {
    font-size: clamp(0.95rem, 4.5vw, 1.35rem);
    line-height: 1.45;
  }

  .host-hero__subtitle {
    margin-top: 0.4rem;
    font-size: 0.86rem;
  }

  .host-library {
    flex: 0 0 auto;
    align-items: flex-start;
    justify-content: flex-start;
    padding-bottom: 0;
  }

  .quests-grid {
    max-height: none !important;
    overflow-y: visible;
    flex: none;
    padding-top: 0.2rem;
    grid-template-columns: repeat(var(--grid-cols, 2), minmax(0, 200px));
  }

  .host-dock {
    padding: 0.2rem 0 0.75rem;
  }

  .host-dock__inner {
    flex-direction: column;
    align-items: stretch;
    gap: 0.75rem;
    padding: 0.85rem 1rem;
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
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .host-main {
    padding: 0 0.65rem 0.35rem;
    gap: 0.4rem;
  }

  .host-hero {
    padding: 0.15rem 0 0.75rem;
  }

  .host-hero__subtitle {
    margin-top: 0.3rem;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .quests-grid {
    gap: 0.65rem;
    grid-template-columns: repeat(var(--grid-cols, 2), minmax(0, 1fr));
    padding: 0.15rem 0.35rem 0 0.15rem;
  }

  .quest-card {
    max-width: none;
    padding: 0.7rem;
  }

  .quest-card__body {
    --q-title-size: 0.85rem;
    --q-pad-top: 0.65rem;
    --q-pad-bottom: 0.2rem;
    padding-inline: 0.15rem;
  }

  .host-dock {
    padding: 0.15rem 0 0.55rem;
  }

  .host-dock__inner {
    padding: 0.7rem 0.8rem;
    gap: 0.6rem;
    border-radius: 1rem;
  }

  .host-dock__placeholder {
    font-size: 0.82rem;
  }

  .host-dock__start {
    padding: 0.75rem 1.25rem;
    font-size: 0.92rem;
  }
}
</style>
