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

      <div class="host-workspace">
        <aside class="host-sidebar">
          <ul class="quest-pick-list">
            <li v-for="(quest, index) in quests" :key="quest.id">
              <button
                type="button"
                :class="['quest-pick', { 'quest-pick--active': selectedQuestId === quest.id }]"
                @click="selectQuest(quest.id)"
              >
                <span class="quest-pick__num">{{ index + 1 }}</span>
                <span class="quest-pick__body">
                  <span class="quest-pick__name">{{ displayQuestTitle(quest.title) }}</span>
                  <span class="quest-pick__meta">
                    {{ t('host.questions', { count: questQuestions(quest) }) }}
                  </span>
                </span>
                <span v-if="questQuestions(quest) === 0" class="quest-pick__warn" aria-hidden="true">!</span>
              </button>
            </li>
          </ul>

          <div class="host-sidebar__footer">
            <button type="button" class="sidebar-action" @click="createNewQuest">
              <span class="sidebar-action__icon">+</span>
              {{ t('host.createNewQuest') }}
            </button>
            <button type="button" class="sidebar-action" :disabled="importingQuest" @click.stop="triggerImportQuest">
              <input ref="importQuestInputRef" type="file" accept=".json,application/json" class="quest-import-input" :disabled="importingQuest" @change="onImportQuestFile" />
              <span class="sidebar-action__icon" aria-hidden="true">↑</span>
              {{ importingQuest ? t('host.importing') : t('host.importQuest') }}
            </button>
          </div>
        </aside>

        <section
          class="host-stage"
          :class="{ 'host-stage--empty': !selectedQuest, 'host-stage--ready': selectedQuest && !selectedQuestEmpty }"
          :style="selectedQuest ? { '--stage-hue': questAccentHue(selectedQuest.title) } : undefined"
        >
          <template v-if="selectedQuest">
            <div class="host-stage__glow" aria-hidden="true" />

            <div class="host-stage__content">
              <p class="host-stage__eyebrow">{{ t('host.selectedQuest') }}</p>
              <h2 class="host-stage__title">{{ displayQuestTitle(selectedQuest.title) }}</h2>
              <p v-if="selectedQuest.description?.trim()" class="host-stage__desc">{{ selectedQuest.description }}</p>

              <div class="host-stage__stats">
                <div class="stat-chip">
                  <strong>{{ selectedQuest.roundsCount ?? (selectedQuest.rounds?.length ?? 0) }}</strong>
                  <span>{{ t('host.rounds', { count: selectedQuest.roundsCount ?? (selectedQuest.rounds?.length ?? 0) }) }}</span>
                </div>
                <div class="stat-chip">
                  <strong>{{ questQuestions(selectedQuest) }}</strong>
                  <span>{{ t('host.questions', { count: questQuestions(selectedQuest) }) }}</span>
                </div>
              </div>

              <div v-if="selectedQuestEmpty" class="host-stage__alert">
                {{ t('host.noQuestions') }}
              </div>

              <div class="host-stage__manage">
                <button type="button" class="manage-btn" @click="goToQuestEditor(selectedQuest.id)">
                  {{ t('common.edit') }}
                </button>
                <button type="button" class="manage-btn" @click="exportQuest(selectedQuest.id)">
                  {{ t('host.exportTooltip') }}
                </button>
                <button type="button" class="manage-btn manage-btn--danger" @click="deleteQuest(selectedQuest.id)">
                  {{ t('common.delete') }}
                </button>
              </div>

              <button
                class="host-start primary"
                :disabled="isMobileViewport || selectedQuestEmpty"
                :title="startDisabledReason"
                @click="handleStart"
              >
                <span class="btn-glow" aria-hidden="true" />
                <span class="btn-text">{{ t('host.startGame') }}</span>
              </button>
              <p v-if="selectedQuestEmpty" class="start-hint">{{ t('host.startHint') }}</p>
              <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
            </div>
          </template>

          <div v-else class="host-stage__empty">
            <div class="host-stage__empty-icon" aria-hidden="true">?</div>
            <p class="host-stage__empty-title">{{ t('host.chooseQuest') }}</p>
            <p class="host-stage__empty-hint">{{ t('host.pickQuestHint') }}</p>
          </div>
        </section>
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
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import AppHeader from '@/components/common/AppHeader.vue'
import { useIsMobileViewport } from '@/composables/useIsMobileViewport'
import { seedTestQuests } from '@/utils/seedTestQuests'
import { displayQuestTitle, questAccentHue } from '@/utils/questCardTheme'

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

onMounted(async () => {
  await sessionStore.whenReady()
  await checkProfileAndLoad()
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
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;
  padding: 0 clamp(1rem, 3vw, 2rem) clamp(1rem, 2vw, 1.5rem);
  box-sizing: border-box;
}

/* ── Hero ── */
.host-hero {
  flex-shrink: 0;
  text-align: left;
  padding: 0.25rem 0 1.25rem;
}

.host-hero__title {
  margin: 0;
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(1rem, 2.4vw, 1.5rem);
  line-height: 1.55;
  letter-spacing: 0.06em;
  color: rgb(var(--c-text));
  text-shadow: 0 0 28px rgb(var(--c-accent-sky) / 0.25);
}

.host-hero__subtitle {
  margin: 0.75rem 0 0;
  max-width: 36rem;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(0.9rem, 1.8vw, 1.05rem);
  line-height: 1.5;
  color: rgb(var(--c-text-soft) / 0.9);
}

/* ── Split workspace ── */
.host-workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: clamp(0.85rem, 2vw, 1.25rem);
  align-items: stretch;
}

.host-sidebar {
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 1.25rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  background: rgb(var(--c-surface) / 0.45);
  backdrop-filter: blur(12px);
  overflow: hidden;
}

.quest-pick-list {
  flex: 1;
  min-height: 0;
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  scrollbar-width: thin;
  scrollbar-color: rgb(var(--c-accent-sky) / 0.4) transparent;
}

.quest-pick-list::-webkit-scrollbar {
  width: 5px;
}

.quest-pick-list::-webkit-scrollbar-thumb {
  background: rgb(var(--c-accent-sky) / 0.45);
  border-radius: 999px;
}

.quest-pick {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.7rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.85rem;
  background: transparent;
  color: rgb(var(--c-text));
  text-align: left;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, transform 0.18s ease;
}

.quest-pick:hover {
  background: rgb(var(--c-bg-deep) / 0.55);
  border-color: rgb(var(--c-accent-sky) / 0.2);
}

.quest-pick--active {
  background: rgb(var(--c-accent-sky) / 0.12);
  border-color: rgb(var(--c-accent-sky) / 0.45);
  box-shadow: inset 3px 0 0 rgb(var(--c-accent));
}

.quest-pick__num {
  flex-shrink: 0;
  width: 1.65rem;
  height: 1.65rem;
  border-radius: 0.45rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: rgb(var(--c-accent-soft));
  background: rgb(var(--c-bg-deep) / 0.7);
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
}

.quest-pick--active .quest-pick__num {
  color: rgb(var(--c-bg));
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  border-color: transparent;
}

.quest-pick__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.quest-pick__name {
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.25;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.quest-pick__meta {
  font-size: 0.7rem;
  color: rgb(var(--c-text-muted) / 0.85);
}

.quest-pick__warn {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  font-weight: 800;
  color: rgb(var(--c-danger-soft));
  background: rgb(var(--c-danger) / 0.15);
  border: 1px solid rgb(var(--c-danger) / 0.35);
}

.host-sidebar__footer {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.65rem;
  border-top: 1px solid rgb(var(--c-accent-sky) / 0.12);
}

.sidebar-action {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.65rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.32);
  background: rgb(var(--c-bg-deep) / 0.35);
  color: rgb(var(--c-text-soft));
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.18s ease, background 0.18s ease, color 0.18s ease;
}

.sidebar-action:hover:not(:disabled) {
  border-color: rgb(var(--c-accent-sky) / 0.5);
  background: rgb(var(--c-accent-sky) / 0.08);
  color: rgb(var(--c-text));
}

.sidebar-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.sidebar-action__icon {
  font-size: 0.95rem;
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

/* ── Preview stage ── */
.host-stage {
  position: relative;
  min-height: 0;
  border-radius: 1.35rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.22);
  background: rgb(var(--c-bg-deep) / 0.55);
  overflow: hidden;
  display: flex;
  align-items: stretch;
}

.host-stage--empty {
  align-items: center;
  justify-content: center;
  background: rgb(var(--c-surface) / 0.35);
}

.host-stage__glow {
  position: absolute;
  inset: -20% -10% auto;
  height: 70%;
  background: radial-gradient(
    ellipse at 30% 20%,
    hsl(var(--stage-hue, 210) 85% 58% / 0.28),
    transparent 65%
  );
  pointer-events: none;
}

.host-stage__content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  gap: 1rem;
}

.host-stage__eyebrow {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(var(--c-text-muted) / 0.8);
}

.host-stage__title {
  margin: 0;
  font-family: 'Plus Jakarta Sans', 'Nunito', sans-serif;
  font-size: clamp(1.6rem, 3.5vw, 2.35rem);
  font-weight: 800;
  line-height: 1.15;
  color: rgb(var(--c-text));
  text-wrap: balance;
}

.host-stage__desc {
  margin: 0;
  max-width: 38rem;
  font-size: 0.95rem;
  line-height: 1.55;
  color: rgb(var(--c-text-muted) / 0.92);
}

.host-stage__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.stat-chip {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 7.5rem;
  padding: 0.75rem 1rem;
  border-radius: 0.9rem;
  border: 1px solid rgb(var(--c-accent-sky) / 0.22);
  background: rgb(var(--c-bg) / 0.45);
}

.stat-chip strong {
  font-size: 1.65rem;
  font-weight: 800;
  line-height: 1;
  color: rgb(var(--c-accent-soft));
}

.stat-chip span {
  font-size: 0.72rem;
  color: rgb(var(--c-text-muted) / 0.88);
}

.host-stage__alert {
  display: inline-flex;
  align-self: flex-start;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgb(var(--c-danger-soft));
  background: rgb(var(--c-danger) / 0.12);
  border: 1px solid rgb(var(--c-danger) / 0.28);
}

.host-stage__manage {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.manage-btn {
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: rgb(var(--c-bg) / 0.4);
  color: rgb(var(--c-text-soft));
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.18s ease, border-color 0.18s ease, color 0.18s ease;
}

.manage-btn:hover {
  border-color: rgb(var(--c-accent-sky) / 0.5);
  background: rgb(var(--c-accent-sky) / 0.1);
  color: rgb(var(--c-text));
}

.manage-btn--danger {
  color: rgb(var(--c-danger-soft));
  border-color: rgb(var(--c-danger) / 0.35);
}

.manage-btn--danger:hover {
  background: rgb(var(--c-danger) / 0.15);
  border-color: rgb(var(--c-danger) / 0.5);
  color: rgb(var(--c-danger-soft));
}

.host-start.primary {
  position: relative;
  align-self: flex-start;
  margin-top: 0.35rem;
  min-width: min(100%, 280px);
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
}

.error {
  margin: 0;
  color: rgb(var(--c-danger));
  font-weight: 600;
  font-size: 0.8rem;
}

.host-stage__empty {
  text-align: center;
  padding: 2rem;
  max-width: 22rem;
}

.host-stage__empty-icon {
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: rgb(var(--c-text-muted) / 0.7);
  border: 2px dashed rgb(var(--c-accent-sky) / 0.3);
  background: rgb(var(--c-bg) / 0.35);
}

.host-stage__empty-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: rgb(var(--c-text));
}

.host-stage__empty-hint {
  margin: 0.5rem 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: rgb(var(--c-text-muted) / 0.85);
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
  .host-workspace {
    grid-template-columns: 1fr;
    grid-template-rows: auto minmax(280px, 1fr);
  }

  .host-hero {
    text-align: center;
  }

  .host-hero__title {
    font-size: clamp(0.8rem, 4vw, 1rem);
  }

  .host-sidebar {
    max-height: 42vh;
  }

  .host-stage__content {
    justify-content: flex-start;
    padding: 1.25rem;
  }

  .host-start.primary {
    width: 100%;
    align-self: stretch;
  }
}

@media (max-width: 480px) {
  .host-main {
    padding: 0 0.75rem 0.75rem;
  }

  .host-stage__title {
    font-size: 1.45rem;
  }

  .stat-chip {
    min-width: calc(50% - 0.35rem);
    flex: 1;
  }
}
</style>
