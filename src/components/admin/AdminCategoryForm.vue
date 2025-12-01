<template>
  <div class="category-wrapper">
    <section class="category-panel category-panel--meta">
      <div class="category-panel-top">
        <label class="field-label" :for="`category-${category.id}`">Название категории</label>
      </div>
      <input
        :id="`category-${category.id}`"
        v-model="categoryTitle"
        class="category-title-input"
        placeholder="Например: Угадай мелодию"
      />
      <span class="badge badge--below">Вопросов: {{ category.questions.length }}/10</span>
      <button
        @click="$emit('delete')"
        class="delete-category-text"
        type="button"
        title="Удалить категорию"
        aria-label="Удалить категорию"
      >
        Удалить
      </button>
    </section>

    <section class="category-panel category-panel--questions">
      <header class="questions-header">
        <h4>Вопросы</h4>
      </header>

      <div v-if="category.questions.length" class="questions-accordion">
        <div
          v-for="question in category.questions"
          :key="question.id"
          :class="['accordion-item', { open: openQuestionId === question.id }]"
        >
          <button
            type="button"
            class="accordion-toggle"
            @click="toggleQuestion(question.id)"
            :aria-expanded="openQuestionId === question.id"
          >
            <span class="accordion-icon" :class="{ open: openQuestionId === question.id }">
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4.47 5.47a.75.75 0 0 1 1.06 0L8 7.94l2.47-2.47a.75.75 0 1 1 1.06 1.06L8.53 9.53a.75.75 0 0 1-1.06 0L4.47 6.53a.75.75 0 0 1 0-1.06z" />
              </svg>
            </span>
            <span class="accordion-title">
              {{ question.question?.trim() || 'Без названия' }}
            </span>
            <span class="accordion-value">{{ question.value }} баллов</span>
          </button>
          <transition name="accordion">
            <div v-show="openQuestionId === question.id" class="accordion-body">
              <AdminQuestionRow
                :quest-id="questId"
                :round-id="roundId"
                :category-id="category.id"
                :question="question"
                @deleted="handleQuestionDeleted(question.id)"
              />
            </div>
          </transition>
        </div>
      </div>
      <p v-else class="empty-questions">
        Вопросов пока нет. Добавьте первый вопрос.
      </p>

      <button
        v-if="category.questions.length < 10"
        class="add-question-button"
        type="button"
        :disabled="isAddingQuestion"
        @click="handleAddQuestion"
      >
        <span v-if="!isAddingQuestion">Добавить вопрос</span>
        <span v-else class="add-question-loading">
          <span class="mini-loader"></span>
          <span>Создание...</span>
        </span>
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect, nextTick } from 'vue'
import { useQuizStore } from '@/store/quizStore'
import AdminQuestionRow from './AdminQuestionRow.vue'
import type { Category } from '@/types'

interface Props {
  questId: string
  roundId: string
  category: Category
}

defineEmits<{
  delete: []
}>()

const props = defineProps<Props>()
const store = useQuizStore()

const openQuestionId = ref<string | null>(null)
const isAddingQuestion = ref(false)
const newlyAddedQuestionId = ref<string | null>(null)

const categoryTitle = computed({
  get: () => props.category.title,
  set: value => {
    store.updateCategory(props.questId, props.roundId, props.category.id, { title: value })
  }
})

async function handleAddQuestion() {
  isAddingQuestion.value = true
  try {
    const defaultValue = 100 * (props.category.questions.length + 1)
    const newId = await store.addQuestion(
      props.questId,
      props.roundId,
      props.category.id,
      defaultValue,
      'Новый вопрос',
      'Ответ'
    )
    // Сохраняем ID нового вопроса для watchEffect
    newlyAddedQuestionId.value = newId
    // Устанавливаем сразу после получения ID (элемент уже в массиве после push)
    openQuestionId.value = newId
    // Сбрасываем флаг сразу
    isAddingQuestion.value = false
  } catch (error) {
    isAddingQuestion.value = false
    newlyAddedQuestionId.value = null
    throw error
  }
}

// Используем watchEffect для мгновенной реакции на изменения
watchEffect(() => {
  const ids = props.category.questions.map(question => question.id)
  
  // Если мы только что создали вопрос, открываем его
  if (newlyAddedQuestionId.value && ids.includes(newlyAddedQuestionId.value)) {
    openQuestionId.value = newlyAddedQuestionId.value
    newlyAddedQuestionId.value = null
    return
  }
  
  // Игнорируем watch, если мы только что создали вопрос
  if (isAddingQuestion.value) return
  
  if (ids.length === 0) {
    openQuestionId.value = null
    return
  }
  // Не перезаписываем, если вопрос уже открыт и существует
  if (openQuestionId.value && ids.includes(openQuestionId.value)) {
    return
  }
  // Устанавливаем первый вопрос только если ничего не открыто
  if (!openQuestionId.value) {
    openQuestionId.value = ids[0]
  }
})

function toggleQuestion(questionId: string) {
  openQuestionId.value = openQuestionId.value === questionId ? null : questionId
}

function handleQuestionDeleted(questionId: string) {
  if (openQuestionId.value !== questionId) return
  const remaining = props.category.questions.filter(question => question.id !== questionId)
  openQuestionId.value = remaining[0]?.id ?? null
}
</script>

<style scoped>
.category-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-panel {
  background: rgba(13, 23, 42, 0.62);
  border-radius: 18px;
  border: 1px solid rgba(56, 189, 248, 0.15);
  color: #e2e8f0;
  padding: 0.85rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-panel--meta {
  gap: 0.6rem;
  padding-bottom: 1.1rem;
  box-sizing: border-box;
}

.category-panel--questions {
  background: rgba(8, 22, 43, 0.62);
  border: 1px dashed rgba(56, 189, 248, 0.18);
  margin-top: 0.6rem;
}

.category-panel-top {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  justify-content: flex-start;
}

.badge--below {
  margin-top: 0.35rem;
}

.category-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.18);
  color: #bae6fd;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  font-weight: 600;
}

.field-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
  padding-left: 0.2rem;
  display: block;
}

.category-title-input {
  padding: 0.5rem 0.7rem;
  border: 1px solid rgba(59, 130, 246, 0.24);
  border-radius: 14px;
  font-weight: 600;
  font-size: 0.95rem;
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.category-title-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

@media (max-width: 1024px) {
  .category-title-input {
    max-width: 100%;
  }

  .delete-category-text {
    align-self: flex-start;
  }
}

.category-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.badge {
  background: rgba(56, 189, 248, 0.16);
  color: #bae6fd;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.7rem;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.badge--below {
  margin-top: 0.5rem;
  margin-bottom: 0.4rem;
  align-self: flex-start;
}

.delete-category-text {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.55rem;
  border-radius: 14px;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.delete-category-text:hover {
  transform: translateY(-1px);
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 12px 24px rgba(239, 68, 68, 0.22);
}

.delete-category-text svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.questions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.questions-header h4 {
  font-size: 0.9rem;
  color: #f8fafc;
  margin: 0;
  letter-spacing: 0.04em;
}

.questions-accordion {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.accordion-item {
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 16px;
  background: rgba(10, 17, 33, 0.7);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.accordion-item.open {
  border-color: rgba(34, 211, 238, 0.5);
  box-shadow: 0 16px 32px rgba(34, 211, 238, 0.18);
}

.accordion-toggle {
  width: 100%;
  background: linear-gradient(90deg, rgba(13, 31, 53, 0.85) 0%, rgba(18, 51, 75, 0.85) 100%);
  color: #f8fafc;
  border: none;
  padding: 0.75rem 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 0.85rem;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  transition: background 0.2s ease;
}

.accordion-toggle:hover {
  background: linear-gradient(90deg, rgba(17, 42, 66, 0.95) 0%, rgba(21, 66, 97, 0.95) 100%);
}

.accordion-toggle[aria-expanded="true"] {
  background: rgba(15, 23, 42, 0.8);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.1);
}

.accordion-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(56, 189, 248, 0.22);
  color: #bae6fd;
  transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.accordion-icon svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
  transform: rotate(0deg);
  transition: transform 0.25s ease;
}

.accordion-icon.open {
  border-color: rgba(34, 211, 238, 0.45);
  background: rgba(56, 189, 248, 0.18);
}

.accordion-icon.open svg {
  transform: rotate(-180deg);
}

.accordion-title {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.accordion-value {
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #bae6fd;
  flex-shrink: 0;
}

.accordion-body {
  padding: 0.9rem 1rem 1rem;
  background: rgba(7, 18, 33, 0.9);
}

.accordion-enter-active,
.accordion-leave-active {
  transition: max-height 0.25s ease, opacity 0.25s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  max-height: 0;
  opacity: 0;
}

.accordion-enter-to,
.accordion-leave-from {
  max-height: 1400px;
  opacity: 1;
}

.add-question-button {
  margin-top: 0.85rem;
  align-self: center;
  display: inline-flex;
  align-items: center;
  align-items: center;
  padding: 0.6rem 1.9rem;
  border-radius: 18px;
  border: 1px dashed rgba(56, 189, 248, 0.35);
  background: rgba(15, 23, 42, 0.6);
  color: #bae6fd;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  min-width: 200px;
}

.add-question-button:hover:not(:disabled) {
  transform: translateY(-1.5px);
  border-color: rgba(56, 189, 248, 0.55);
  background: rgba(15, 32, 56, 0.72);
  box-shadow: 0 16px 32px rgba(56, 189, 248, 0.22);
}

.add-question-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.add-question-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mini-loader {
  display: inline-block;
  width: 14px;
  height: 14px;
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

.add-question-label {
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.85;
}

.empty-questions {
  margin: 0;
  padding: 0.9rem;
  background: rgba(15, 23, 42, 0.55);
  border: 1px dashed rgba(148, 163, 184, 0.35);
  border-radius: 14px;
  color: rgba(226, 232, 240, 0.7);
  text-align: center;
  font-size: 0.85rem;
}
</style>

