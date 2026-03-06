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
import { ref, computed } from 'vue'
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
const selectedQuestionId = ref<string | null>(null)
const selectedCategoryId = ref<string | null>(null)

// Реактивно получаем вопрос из store по ID
const selectedQuestion = computed<Question | null>(() => {
  if (!selectedQuestionId.value || !selectedCategoryId.value || !props.round) {
    return null
  }
  
  const category = props.round.categories?.find(c => c.id === selectedCategoryId.value)
  if (!category) return null
  
  return category.questions?.find(q => q.id === selectedQuestionId.value) || null
})

function handleQuestionClick(question: Question, categoryId: string) {
  selectedQuestionId.value = question.id
  selectedCategoryId.value = categoryId
  isModalOpen.value = true
}

function handleModalClose() {
  isModalOpen.value = false
  selectedQuestionId.value = null
  selectedCategoryId.value = null
}

function handleFinished() {
  if (selectedQuestionId.value && selectedCategoryId.value) {
    quizStore.markQuestionAsPlayed(props.questId, props.round.id, selectedCategoryId.value, selectedQuestionId.value)
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
  min-height: 0;
  margin: 0;
  align-items: stretch;
  padding: clamp(0.5rem, 1.2vw, 0.9rem);
  border-radius: 18px;
  border: 1px solid rgba(129, 140, 248, 0.45);
  background: rgba(30, 41, 59, 0.55);
  box-shadow: 
    0 8px 32px rgba(15, 23, 42, 0.45),
    0 4px 16px rgba(79, 70, 229, 0.12),
    inset 0 2px 4px rgba(255, 255, 255, 0.06),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  transform: perspective(1000px) rotateX(1deg);
  box-sizing: border-box;
}

@media (max-width: 1280px) {
  .board-container {
    min-height: calc(100dvh - 200px);
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
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    padding: 0.4rem;
  }
}

@media (max-width: 480px) {
  .board-container {
    gap: 0.65rem;
  }

  .board-reset {
    padding: 0.35rem 0.9rem;
    font-size: 0.7rem;
  }

  .board-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.2rem;
    padding: 0.35rem;
    border-radius: 16px;
  }
}

@media (max-width: 360px) {
  .board-grid {
    grid-template-columns: repeat(auto-fit, minmax(85px, 1fr));
    gap: 0.15rem;
    padding: 0.3rem;
  }

  .board-reset {
    padding: 0.3rem 0.75rem;
    font-size: 0.65rem;
  }
}

@media (max-width: 320px) {
  .board-grid {
    grid-template-columns: repeat(auto-fit, minmax(75px, 1fr));
    gap: 0.125rem;
    padding: 0.25rem;
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
  padding: 3rem 1.5rem;
  color: rgba(226, 232, 240, 0.85);
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.empty-categories p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #94a3b8;
}

.admin-link {
  color: rgba(34, 211, 238, 0.95);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 600;
  transition: color 0.2s ease;
}

.admin-link:hover {
  color: #67e8f9;
  text-decoration: underline;
}

.loading {
  min-height: 40vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  color: #94a3b8;
  font-size: 1rem;
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}
</style>


