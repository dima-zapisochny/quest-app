<template>
  <div v-if="round" class="board-container">
    <div v-if="!round.categories || round.categories.length === 0" class="empty-categories">
      <p>В этом раунде пока нет категорий.</p>
      <router-link to="/host/setup" class="admin-link">
        Перейти к управлению квестами для добавления категорий
      </router-link>
    </div>
    <div v-else class="board-grid">
      <CategoryColumn
        v-for="category in round.categories"
        :key="category.id"
        :category="category"
        @question-click="handleQuestionClick"
      />
    </div>

    <QuestionModal
      :is-open="isModalOpen"
      :question="selectedQuestion"
      :session-id="sessionId"
      :quest-id="questId"
      :round-id="round.id"
      :category-id="selectedCategoryId ?? undefined"
      @close="handleModalClose"
      @finished="handleFinished"
    />
  </div>
  <div v-else class="loading">
    <p>Загрузка раунда...</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import CategoryColumn from './CategoryColumn.vue'
import QuestionModal from './QuestionModal.vue'
import { useQuizStore } from '@/store/quizStore'
import type { Round, Question } from '@/types'

interface Props {
  questId: string
  round: Round
  sessionId?: string
}

const props = defineProps<Props>()

const quizStore = useQuizStore()
const isModalOpen = ref(false)
const selectedQuestion = ref<Question | null>(null)
const selectedCategoryId = ref<string | null>(null)

function handleQuestionClick(question: Question, categoryId: string) {
  selectedQuestion.value = question
  selectedCategoryId.value = categoryId
  isModalOpen.value = true
}

function handleModalClose() {
  isModalOpen.value = false
  selectedQuestion.value = null
  selectedCategoryId.value = null
}

function handleFinished() {
  if (selectedQuestion.value && selectedCategoryId.value) {
    quizStore.markQuestionAsPlayed(props.questId, props.round.id, selectedCategoryId.value, selectedQuestion.value.id)
  }
}
</script>

<style scoped>
.board-container {
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.board-reset {
  align-self: flex-end;
  background: rgba(14, 165, 233, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #f8fafc;
  padding: 0.4rem 1.1rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.board-reset:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(56, 189, 248, 0.25);
}

.board-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: clamp(0.35rem, 0.8vw, 0.6rem);
  width: 100%;
  margin: 0;
  align-items: stretch;
  padding: clamp(0.45rem, 1vw, 0.8rem);
  border-radius: 20px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(15, 23, 42, 0.3);
  box-shadow: 
    0 8px 32px rgba(2, 6, 23, 0.3),
    0 4px 16px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transform: perspective(1000px) rotateX(1deg);
}

@media (max-width: 1280px) {
  .board-container {
    min-height: calc(100vh - 200px);
  }
}

@media (max-width: 1024px) {
  .board-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
}

@media (max-width: 900px) {
  .board-container {
    padding: 0.75rem;
  }

  .board-grid {
    gap: 0.3rem;
    padding: 0.45rem;
  }
}

@media (max-width: 720px) {
  .board-grid {
    gap: 0.25rem;
  }
}

@media (max-width: 640px) {
  .board-container {
    padding: 0.6rem 0.4rem 0.9rem;
  }

  .board-grid {
    padding: 0.3rem;
  }
}

.empty-categories {
  text-align: center;
  padding: 4rem 2rem;
  color: rgba(224, 231, 255, 0.75);
}

.empty-categories p {
  font-size: 1.25rem;
  margin-bottom: 1rem;
}

.admin-link {
  color: #f9a8d4;
  text-decoration: none;
  font-size: 1.125rem;
}

.admin-link:hover {
  text-decoration: underline;
}

.loading {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #050815;
  color: rgba(224, 231, 255, 0.75);
  font-size: 1.25rem;
}
</style>


