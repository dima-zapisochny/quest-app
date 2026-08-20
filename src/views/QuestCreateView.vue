<template>
  <div class="quest-create">
    <AppHeader
      button-variant="back"
      button-label="Назад"
      :user-name="userProfile?.name"
      :user-avatar="userProfile?.avatar"
      @button-click="goBack"
    />

    <main class="quest-create__main">
      <h1 class="quest-create__title">Новый квест</h1>
      <p class="quest-create__subtitle">Задайте название и размер доски — дальше заполните вопросы.</p>

      <BaseCard class="quest-create__card">
        <form class="quest-create__form" @submit.prevent="submit">
          <label class="field-label" for="create-title">Название</label>
          <input
            id="create-title"
            ref="titleInput"
            v-model="title"
            class="field-input"
            type="text"
            placeholder="Например: Своя игра про кино"
            required
          />

          <label class="field-label" for="create-description">Описание (необязательно)</label>
          <textarea
            id="create-description"
            v-model="description"
            class="field-input field-textarea"
            rows="2"
            placeholder="Коротко о квесте"
          ></textarea>

          <span class="field-label">С чего начать</span>
          <div class="mode-switch" role="radiogroup" aria-label="С чего начать">
            <button
              type="button"
              :class="['mode-switch__chip', { 'mode-switch__chip--active': mode === 'grid' }]"
              role="radio"
              :aria-checked="mode === 'grid'"
              @click="mode = 'grid'"
            >Готовая сетка</button>
            <button
              type="button"
              :class="['mode-switch__chip', { 'mode-switch__chip--active': mode === 'empty' }]"
              role="radio"
              :aria-checked="mode === 'empty'"
              @click="mode = 'empty'"
            >Пустой квест</button>
          </div>

          <div v-if="mode === 'grid'" class="grid-size">
            <div class="grid-size__steppers">
              <NumberStepper v-model="categories" :min="1" :max="8" label="Категории" block />
              <span class="grid-size__times" aria-hidden="true">×</span>
              <NumberStepper v-model="questions" :min="1" :max="10" label="Вопросы" block />
            </div>
            <div class="grid-size__preview">
              <div class="grid-size__mini" :style="miniStyle" aria-hidden="true">
                <span v-for="n in categories * questions" :key="n" class="grid-size__cell"></span>
              </div>
              <span class="grid-size__total">{{ categories * questions }} плиток</span>
            </div>
          </div>

          <p v-if="error" class="field-error">{{ error }}</p>

          <div class="quest-create__actions">
            <button type="button" class="btn-secondary" @click="goBack">Отмена</button>
            <button type="submit" class="btn-primary" :disabled="isCreating">
              <span v-if="!isCreating">Далее</span>
              <span v-else>Создание…</span>
              <span v-if="!isCreating" aria-hidden="true">→</span>
            </button>
          </div>
        </form>
      </BaseCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/store/quizStore'
import { useGameSessionStore } from '@/store/gameSessionStore'
import AppHeader from '@/components/common/AppHeader.vue'
import BaseCard from '@/components/common/BaseCard.vue'
import NumberStepper from '@/components/common/NumberStepper.vue'

const router = useRouter()
const quizStore = useQuizStore()
const sessionStore = useGameSessionStore()

const userProfile = computed(() => sessionStore.userProfile)

const title = ref('')
const description = ref('')
const mode = ref<'grid' | 'empty'>('grid')
const categories = ref(5)
const questions = ref(5)
const error = ref('')
const isCreating = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)

const miniStyle = computed(() => ({
  gridTemplateColumns: `repeat(${categories.value}, 1fr)`
}))

onMounted(() => {
  nextTick(() => titleInput.value?.focus())
})

function goBack() {
  router.push({ name: 'host-setup' })
}

async function submit() {
  error.value = ''
  const name = title.value.trim()
  if (!name) {
    error.value = 'Введите название квеста'
    return
  }
  if (isCreating.value) return
  isCreating.value = true
  try {
    const desc = description.value.trim()
    const questId = mode.value === 'grid'
      ? await quizStore.createQuestWithBoard(name, desc, categories.value, questions.value)
      : await quizStore.createQuest(name, desc)
    router.replace({ name: 'admin-quest', params: { questId } })
  } catch (e: any) {
    error.value = e?.message ?? 'Не удалось создать квест'
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
.quest-create {
  min-height: 100dvh;
  background: linear-gradient(135deg, rgb(var(--c-bg)) 0%, rgb(var(--c-surface)) 100%);
}

.quest-create__main {
  max-width: 520px;
  margin: 0 auto;
  padding: 1.5rem 1.25rem 3rem;
}

.quest-create__title {
  margin: 0.5rem 0 0.35rem;
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: rgb(var(--c-text));
}

.quest-create__subtitle {
  margin: 0 0 1.5rem;
  color: rgb(var(--c-text-soft) / 0.75);
  font-size: 0.95rem;
}

.quest-create__form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--c-text-muted) / 0.7);
  margin-top: 0.5rem;
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
  resize: vertical;
  min-height: 3rem;
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
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 1rem 1.1rem;
  border-radius: 16px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.18);
  background: rgb(var(--c-bg) / 0.4);
}
.grid-size__steppers {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}
.grid-size__times {
  font-size: 1.3rem;
  font-weight: 600;
  color: rgb(var(--c-text-soft) / 0.6);
  align-self: flex-end;
  padding-bottom: 0.4rem;
}
.grid-size__preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}
.grid-size__mini {
  display: grid;
  gap: 2px;
  width: clamp(72px, 22vw, 104px);
}
.grid-size__cell {
  aspect-ratio: 1;
  border-radius: 2px;
  background: linear-gradient(135deg, rgb(var(--c-accent-sky) / 0.5), rgb(var(--c-accent) / 0.4));
}
.grid-size__total {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgb(var(--c-accent-soft));
}
@media (max-width: 420px) {
  .grid-size {
    justify-content: center;
  }
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
</style>
