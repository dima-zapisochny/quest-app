<template>
  <div class="quest-create">
    <AppHeader
      button-variant="back"
      :button-label="t('common.back')"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <main class="quest-create__main">
      <h1 class="quest-create__title">{{ t('create.title') }}</h1>

      <BaseCard class="quest-create__card">
        <form class="quest-create__form" @submit.prevent="submit">
          <label class="field-label" for="create-title">{{ t('create.name') }}</label>
          <input
            id="create-title"
            ref="titleInput"
            v-model="title"
            class="field-input"
            type="text"
            :placeholder="t('create.namePlaceholder')"
            :class="{ 'field-input--error': error }"
            :maxlength="QUEST_TITLE_MAX_LENGTH"
            required
            @input="clearError"
          />
          <transition name="err-slide">
            <p v-if="error" class="field-error field-error--inline">{{ error }}</p>
          </transition>

          <label class="field-label" for="create-description">{{ t('create.description') }}</label>
          <textarea
            id="create-description"
            v-model="description"
            class="field-input field-textarea"
            rows="2"
            :placeholder="t('create.descriptionPlaceholder')"
            :maxlength="QUEST_DESCRIPTION_MAX_LENGTH"
          ></textarea>

          <span class="field-label">{{ t('create.emoji') }}</span>
          <QuestEmojiPicker v-model="emoji" :aria-label="t('create.emojiAria')" />

          <span class="field-label">{{ t('create.boardSize') }}</span>
          <div class="grid-size">
            <div class="grid-size__rounds">
              <div class="seg" role="group" :aria-label="t('create.roundsAria')">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  class="seg__btn"
                  :class="{ 'seg__btn--active': rounds === n }"
                  @click="rounds = n"
                >{{ n }}</button>
              </div>
            </div>
            <div class="grid-size__picker" :class="{ 'grid-size__picker--busy': isCreating }">
              <GridSizePicker
                v-model:categories="categories"
                v-model:questions="questions"
                :max-categories="5"
                :max-questions="5"
                :suffix="roundsSuffix"
                @select="onGridSelect"
              />
            </div>
            <p v-if="isCreating" class="grid-size__hint">{{ t('create.creating') }}</p>
          </div>

        </form>
      </BaseCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import { usePlural } from '@/i18n/plural'
import AppHeader from '@/components/common/AppHeader.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import GridSizePicker from '@/components/common/GridSizePicker.vue'
import QuestEmojiPicker from '@/components/common/QuestEmojiPicker.vue'
import { DEFAULT_QUEST_EMOJI, questThemeEmoji } from '@/utils/questCardTheme'
import { mapAppError } from '@/utils/mapAppError'
import {
  QUEST_DESCRIPTION_MAX_LENGTH,
  QUEST_TITLE_MAX_LENGTH,
  clampQuestDescription,
  clampQuestTitle
} from '@/constants/questLimits'

const { t } = useI18n()
const { count } = usePlural()
const router = useRouter()
const quizStore = useQuizStore()
const sessionStore = useGameSessionStore()

const userProfile = computed(() => sessionStore.userProfile)

const title = ref('')
const description = ref('')
const emoji = ref(DEFAULT_QUEST_EMOJI)
const rounds = ref(1)
const categories = ref(1)
const questions = ref(1)
const error = ref('')
const isCreating = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

const roundsSuffix = computed(() => count(rounds.value, 'plural.rounds'))

onMounted(() => {
  nextTick(() => titleInput.value?.focus())
})

function clearError() {
  if (error.value) error.value = ''
}

function goBack() {
  router.push({ name: 'host-setup' })
}

/** Клик по сетке — если название заполнено, сразу создаём квест и идём в редактор. */
function onGridSelect(c: number, r: number) {
  categories.value = c
  questions.value = r
  submit()
}

async function submit() {
  error.value = ''
  const name = clampQuestTitle(title.value).trim()
  title.value = clampQuestTitle(title.value)
  description.value = clampQuestDescription(description.value)
  if (!name) {
    error.value = t('create.errName')
    titleInput.value?.focus()
    titleInput.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }
  if (isCreating.value) return
  isCreating.value = true
  try {
    const desc = clampQuestDescription(description.value).trim()
    const questId = await quizStore.createQuestWithBoard(
      name,
      desc,
      categories.value,
      questions.value,
      rounds.value,
      emoji.value || questThemeEmoji(name)
    )
    router.replace({ name: 'admin-quest', params: { questId } })
  } catch (e: any) {
    error.value = mapAppError(e, t, 'create.errCreate')
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
.quest-create {
  height: 100dvh;
  max-height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
}

.quest-create :deep(.app-header) {
  padding-top: 0.75rem;
  padding-bottom: 0.4rem;
}

.quest-create__main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 0.75rem clamp(1rem, 3vw, 2rem) 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  box-sizing: border-box;
  overflow: hidden;
}

.quest-create__title {
  flex-shrink: 0;
  margin: 0.25rem 0 1.25rem;
  font-family: 'Press Start 2P', cursive;
  font-size: clamp(1.25rem, 3.8vw, 2.1rem);
  line-height: 1.55;
  letter-spacing: 0.06em;
  color: rgb(var(--c-text));
  text-align: center;
  text-shadow: 0 0 28px rgb(var(--c-accent-sky) / 0.25);
}

.quest-create__card {
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
  padding: clamp(1.35rem, 3vw, 2.25rem);
  overflow: hidden;
}

.quest-create__form {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-height: 0;
}

.field-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--c-text-muted) / 0.7);
  margin-top: 0.35rem;
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  background: rgb(var(--c-bg) / 0.5);
  color: rgb(var(--c-text));
  padding: 0.65rem 0.85rem;
  font-size: 1rem;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.field-input:focus {
  outline: none;
  border-color: rgb(var(--c-accent) / 0.6);
  box-shadow: 0 0 0 3px rgb(var(--c-accent) / 0.12);
}
.field-textarea {
  resize: none;
  min-height: 2.75rem;
  max-height: 3.25rem;
  line-height: 1.4;
}

.mode-switch {
  display: flex;
  gap: 0.5rem;
}
.mode-switch__chip {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border-radius: 12px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg) / 0.4);
  color: rgb(var(--c-text-soft) / 0.85);
  font-size: 0.92rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}
.mode-switch__chip--active {
  background: rgb(var(--c-accent) / 0.22);
  border-color: rgb(var(--c-accent) / 0.6);
  color: rgb(var(--c-accent-soft));
}

.grid-size {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  padding: 1.35rem 1.75rem 1.5rem;
  border-radius: 16px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  background: rgb(var(--c-bg) / 0.4);
}
.grid-size__rounds {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.85rem;
  padding: 0.25rem 0 1.1rem;
  border-bottom: 1px solid rgb(var(--c-accent-sky) / 0.14);
}
.seg {
  display: inline-flex;
  align-items: center;
  justify-content: stretch;
  gap: 0.35rem;
  width: min(100%, 22rem);
  padding: 5px;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent-sky) / 0.22);
  background: rgb(var(--c-bg) / 0.5);
  box-sizing: border-box;
}
.seg__btn {
  flex: 1;
  min-width: 0;
  height: 2.35rem;
  padding: 0 0.65rem;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.8);
  font-size: 0.95rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.seg__btn:hover:not(.seg__btn--active) {
  background: rgb(var(--c-accent-sky) / 0.12);
}
.seg__btn--active {
  background: linear-gradient(135deg, rgb(var(--c-accent-sky)), rgb(var(--c-accent)));
  color: rgb(var(--c-bg));
  box-shadow: 0 2px 8px rgb(var(--c-accent) / 0.28);
}
.seg__btn:focus {
  outline: none;
}
.seg__btn:focus-visible {
  outline: 2px solid rgb(var(--c-accent-sky) / 0.6);
  outline-offset: 2px;
}
.grid-size__picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.65rem;
  padding: 0.25rem 0 0;
  transition: opacity 0.2s ease;
}
.grid-size__picker--busy {
  opacity: 0.6;
  pointer-events: none;
}

/* Великі екрани — сітка й іконки в нормальному розмірі */
@media (min-width: 1024px) and (min-height: 760px) {
  .quest-create__main {
    max-width: 760px;
    padding-top: 1rem;
  }

  .quest-create__title {
    margin-bottom: 1.5rem;
  }

  .quest-create__card :deep(.gp__cell) {
    width: clamp(52px, 4.5vw, 66px);
  }
}

.grid-size__hint {
  margin: 0.4rem 0 0;
  text-align: center;
  font-size: 0.85rem;
  color: rgb(var(--c-accent-soft) / 0.85);
}

.field-input--error {
  border-color: rgb(var(--c-danger) / 0.7);
  box-shadow: 0 0 0 3px rgb(var(--c-danger) / 0.12);
}
.field-error--inline {
  margin: 0.15rem 0 0.25rem;
}
.err-slide-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.err-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.err-slide-enter-from,
.err-slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.field-error {
  margin: 0.25rem 0 0;
  color: rgb(var(--c-danger-soft));
  font-size: 0.85rem;
}

.quest-create__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;
}

.btn-secondary,
.btn-primary {
  min-width: 120px;
  padding: 0.7rem 1.4rem;
  border-radius: var(--radius-pill);
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
}
.btn-secondary {
  background: rgb(var(--c-teal) / 0.15);
  border: 1px solid rgb(var(--c-accent) / 0.45);
  color: rgb(var(--c-accent-soft));
}
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg));
}
.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 14px 24px rgb(var(--c-accent) / 0.3);
}
.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .quest-create__main {
    padding: 0.25rem 0.85rem 0.55rem;
    justify-content: flex-start;
  }

  .quest-create__title {
    margin-bottom: 0.5rem;
    font-size: clamp(1.05rem, 4.5vw, 1.55rem);
  }

  .quest-create__card {
    padding: 0.85rem 1rem;
  }

  .grid-size {
    padding: 0.65rem 0.75rem;
    gap: 0.55rem;
  }

  .grid-size__rounds {
    padding: 0 0 0.55rem;
  }

  .seg {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .quest-create__main {
    padding: 0.15rem 0.65rem 0.45rem;
  }

  .quest-create__title {
    margin-bottom: 0.4rem;
    font-size: clamp(0.95rem, 4.2vw, 1.35rem);
  }

  .quest-create__card {
    padding: 0.7rem 0.75rem;
  }

  .field-input {
    font-size: 0.9rem;
    padding: 0.45rem 0.65rem;
  }

  .seg__btn {
    height: 1.85rem;
    font-size: 0.82rem;
  }

  .quest-create__card :deep(.gp__cell) {
    width: clamp(30px, 12vw, 44px);
  }

  .quest-create__card :deep(.quest-emoji-picker__btn),
  .quest-create__card :deep(.quest-emoji-picker__more) {
    width: 2.1rem;
    height: 2.1rem;
    font-size: 1.05rem;
  }
}

/* Низькі екрани — щільніше, без скролу */
@media (max-height: 760px) {
  .quest-create__main {
    padding: 0.35rem clamp(0.85rem, 2.5vw, 1.5rem) 0.65rem;
  }

  .quest-create__title {
    margin-bottom: 0.5rem;
    font-size: clamp(1.05rem, 3.2vw, 1.65rem);
  }

  .quest-create__card {
    padding: 0.75rem 1rem;
  }

  .quest-create__form {
    gap: 0.35rem;
  }

  .field-label {
    margin-top: 0.15rem;
    font-size: 0.68rem;
  }

  .field-input {
    padding: 0.5rem 0.75rem;
    font-size: 0.95rem;
  }

  .field-textarea {
    min-height: 2.25rem;
    max-height: 2.5rem;
  }

  .grid-size {
    padding: 0.65rem 0.85rem 0.75rem;
    gap: 0.55rem;
  }

  .grid-size__rounds {
    padding-bottom: 0.55rem;
  }

  .seg__btn {
    height: 2rem;
  }

  .quest-create__card :deep(.gp__cell) {
    width: clamp(34px, 6vw, 48px);
  }

  .quest-create__card :deep(.quest-emoji-picker__btn),
  .quest-create__card :deep(.quest-emoji-picker__more) {
    width: 2.25rem;
    height: 2.25rem;
    font-size: 1.15rem;
  }
}

@media (max-height: 700px) {
  .quest-create__title {
    margin-bottom: 0.3rem;
    font-size: clamp(0.95rem, 2.8vw, 1.35rem);
  }

  .grid-size__rounds {
    padding-bottom: 0.4rem;
  }

  .seg__btn {
    height: 1.75rem;
  }

  .quest-create__card :deep(.gp__header) {
    height: 8px;
  }

  .quest-create__card :deep(.gp__cell) {
    width: clamp(28px, 5vw, 40px);
  }

  .quest-create__card :deep(.quest-emoji-picker__btn),
  .quest-create__card :deep(.quest-emoji-picker__more) {
    width: 1.95rem;
    height: 1.95rem;
    font-size: 1rem;
  }
}
</style>
