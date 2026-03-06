<template>
  <div class="category-column">
    <h3 class="category-title" :title="category.title">
      <span class="category-title-text">{{ category.title }}</span>
    </h3>
    <div class="category-tiles">
      <template v-for="item in tileItems" :key="item.key">
        <QuizTile
          v-if="item.type === 'question'"
          :question="item.question"
          @click="handleQuestionClick"
        />
        <QuizTile v-else placeholder />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import QuizTile from './QuizTile.vue'
import type { Category, Question } from '@/types'

interface Props {
  category: Category
}

const props = defineProps<Props>()

const emit = defineEmits<{
  questionClick: [question: Question, categoryId: string]
}>()

const tileItems = computed(() => {
  const questions = props.category?.questions
  if (!Array.isArray(questions) || questions.length === 0) {
    return [
      {
        type: 'placeholder' as const,
        key: `${props.category.id}-placeholder`
      }
    ]
  }
  return questions.map(question => ({
    type: 'question' as const,
    key: question.id,
    question
  }))
})

function handleQuestionClick(question: Question) {
  emit('questionClick', question, props.category.id)
}
</script>

<style scoped>
.category-column {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1 1 0;
  min-width: 0;
  height: 100%;
  min-height: 0;
}

.category-title {
  font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  text-align: center;
  background: linear-gradient(160deg, rgba(30, 27, 75, 0.85) 0%, rgba(49, 46, 129, 0.7) 50%, rgba(55, 48, 163, 0.6) 100%);
  border: 1px solid rgba(129, 140, 248, 0.55);
  color: #c7d2fe;
  padding: 0.45rem 0.85rem;
  font-size: 0.7rem;
  font-weight: 700;
  border-radius: 0.55rem;
  margin: 0 0 2px 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  max-width: 100%;
  position: relative;
  z-index: 10;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 
    0 2px 8px rgba(67, 56, 202, 0.25),
    0 1px 4px rgba(0, 0, 0, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.12),
    inset 0 -1px 2px rgba(0, 0, 0, 0.25);
  transform: perspective(1000px) rotateX(1deg);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.category-title::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.15) 0%,
    transparent 50%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.category-title::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.04) 100%
  );
  border-radius: 0.55rem;
  pointer-events: none;
  opacity: 0.5;
}

.category-title-text {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  min-width: 0;
  position: relative;
  z-index: 1;
}

.category-tiles {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-height: 0;
  justify-content: stretch;
}

.category-tiles :deep(.quiz-tile--placeholder) {
  border-style: dashed;
  border-color: rgba(148, 163, 184, 0.3);
  background: rgba(30, 41, 59, 0.3);
  cursor: default;
  opacity: 0.75;
}

@media (max-width: 1024px) {
  .category-title {
    font-size: 0.54rem;
    padding: 0.35rem;
    min-height: 38px;
  }
}

@media (max-width: 768px) {
  .category-title {
    font-size: 0.48rem;
    min-height: 34px;
  }
}
</style>

