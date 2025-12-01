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
  if (!props.category.questions.length) {
    return [
      {
        type: 'placeholder' as const,
        key: `${props.category.id}-placeholder`
      }
    ]
  }
  return props.category.questions.map(question => ({
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
  text-align: center;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(30, 58, 138, 0.75));
  border: 1px solid rgba(37, 99, 235, 0.4);
  color: rgba(147, 197, 253, 0.85);
  padding: 0.4rem 0.85rem;
  font-size: 0.58rem;
  font-weight: 600;
  border-radius: 16px;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-shrink: 0;
  max-width: 100%;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 
    0 3px 6px rgba(2, 6, 23, 0.2),
    0 2px 3px rgba(2, 6, 23, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1000px) rotateX(2deg);
  transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
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

.category-title:hover::before {
  opacity: 1;
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
  border-radius: 16px;
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
  border-color: rgba(148, 163, 184, 0.26);
  background: rgba(15, 23, 42, 0.32);
  cursor: default;
  opacity: 0.5;
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

