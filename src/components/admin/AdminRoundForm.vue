<template>
  <section class="round-form">
    <section class="round-section round-section--meta">
      <div class="round-section-header">
        <span class="round-section-chip">Настройка раунда</span>
      </div>
      <header class="round-form-header">
        <div class="round-meta">
          <label class="field-label" for="round-title">Название раунда</label>
          <input
            id="round-title"
            v-model="roundTitle"
            class="round-title-input"
            placeholder="Название раунда"
          />
          <button
            class="delete-round-text"
            type="button"
            title="Удалить раунд"
            aria-label="Удалить раунд"
            @click="$emit('delete')"
          >
            Удалить
          </button>
        </div>
      </header>
    </section>

    <section class="round-section round-section--categories">
      <div class="round-section-header">
        <span class="round-section-chip">Категории раунда</span>
      </div>
      <div class="category-tiles">
        <template v-for="index in 8" :key="index">
          <button
            v-if="index <= categoriesCount"
            :class="['category-slot', 'category-slot--occupied', { 'category-slot--active': editingCategoryIndex === index - 1 }]"
            type="button"
            @click="handleCategorySlotClick(index)"
          >
            <span>{{ index }}</span>
          </button>
          <button
            v-else-if="index === categoriesCount + 1 && categoriesCount < 8"
            class="category-slot category-slot--add"
            type="button"
            aria-label="Добавить категорию"
            @click="handleAddCategory"
          >
            <span>+</span>
          </button>
          <div
            v-else
            class="category-slot category-slot--empty"
          >
            <span>{{ index }}</span>
          </div>
        </template>
      </div>

      <div class="category-cards">
        <template v-if="editingCategory">
          <div class="category-heading">Категория {{ editingCategoryIndex + 1 }}</div>
          <AdminCategoryForm
            :quest-id="questId"
            :round-id="round.id"
            :category="editingCategory"
            @delete="handleDeleteCategory(editingCategory.id)"
          />
        </template>
        <p v-else class="empty-categories">
          Категории пока не созданы. Добавьте первую.
        </p>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuizStore } from '@/store/quizStore'
import AdminCategoryForm from './AdminCategoryForm.vue'
import type { Round } from '@/types'

interface Props {
  questId: string
  round: Round
}

defineEmits<{
  delete: []
}>()

const props = defineProps<Props>()
const store = useQuizStore()

const roundTitle = computed({
  get: () => props.round.title,
  set: value => {
    store.updateRound(props.questId, props.round.id, { title: value })
  }
})

const categoriesCount = computed(() => props.round.categories.length)

const editingCategoryId = ref<string | null>(null)

const editingCategory = computed(() => {
  if (!editingCategoryId.value) return null
  return props.round.categories.find(category => category.id === editingCategoryId.value) ?? null
})

const editingCategoryIndex = computed(() => {
  if (!editingCategoryId.value) return -1
  return props.round.categories.findIndex(category => category.id === editingCategoryId.value)
})

watch(
  () => props.round.categories,
  categories => {
    if (!categories.length) {
      editingCategoryId.value = null
      return
    }
    if (!editingCategoryId.value || !categories.some(category => category.id === editingCategoryId.value)) {
      editingCategoryId.value = categories[0].id
    }
  },
  { immediate: true, deep: true }
)

function handleAddCategory() {
  const newCategoryId = store.addCategory(props.questId, props.round.id, 'Новая категория')
  editingCategoryId.value = newCategoryId
}

function handleDeleteCategory(categoryId: string) {
  if (confirm('Удалить категорию вместе со всеми вопросами?')) {
    store.deleteCategory(props.questId, props.round.id, categoryId)
    if (editingCategoryId.value === categoryId) {
      editingCategoryId.value = null
    }
  }
}

function handleCategorySlotClick(index: number) {
  const existing = props.round.categories[index - 1]
  if (existing) {
    editingCategoryId.value = existing.id
    return
  }
  if (props.round.categories.length >= 8) return
  handleAddCategory()
}
</script>

<style scoped>
.round-form {
  background: transparent;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  color: #e2e8f0;
}

.round-section {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
}

.round-section--meta {
  background: linear-gradient(130deg, rgba(15, 23, 42, 0.78), rgba(18, 30, 52, 0.92));
  border: 1px solid rgba(56, 189, 248, 0.28);
  padding: 1.45rem 1.6rem 1.35rem;
  box-shadow: 0 22px 48px rgba(8, 47, 73, 0.38);
}

.round-section--meta::before {
  content: '';
  position: absolute;
  inset: -40% 35% auto;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.35), transparent 60%);
  opacity: 0.45;
  pointer-events: none;
}

.round-section--categories {
  background: linear-gradient(140deg, rgba(8, 22, 43, 0.82), rgba(7, 14, 28, 0.94));
  border: 1px solid rgba(59, 130, 246, 0.22);
  padding: 1.45rem 1.6rem 1.25rem;
  box-shadow: 0 26px 56px rgba(7, 16, 33, 0.36);
}

.round-section--categories::before {
  content: '';
  position: absolute;
  inset: -50% 10% auto;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.28), transparent 65%);
  opacity: 0.4;
  pointer-events: none;
}

.round-section-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0.9rem;
}

.round-section-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.95rem;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.28);
  border: 1px solid rgba(34, 211, 238, 0.45);
  color: #f0fdf4;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  text-transform: uppercase;
  box-shadow: inset 0 0 12px rgba(34, 211, 238, 0.2);
}

.round-meta {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
}

.field-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.65);
  padding-left: 0.2rem;
  display: block;
}

.round-title-input {
  padding: 0.55rem 0.75rem;
  border: 1px solid rgba(59, 130, 246, 0.28);
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
}

.round-title-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.25);
}

.delete-round-text {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  margin-top: 0.6rem;
  padding: 0.5rem 1.55rem;
  border-radius: 14px;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.delete-round-text:hover {
  transform: translateY(-1px);
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 12px 26px rgba(239, 68, 68, 0.22);
}

.delete-round-text svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
}

.category-tiles {
  display: grid;
  grid-template-columns: repeat(8, minmax(40px, 1fr));
  gap: 0.9rem;
  background: rgba(6, 13, 26, 0.55);
  border-radius: 18px;
  padding: 1rem;
  border: 1px solid rgba(56, 189, 248, 0.12);
}

@media (max-width: 1200px) {
  .category-tiles {
    grid-template-columns: repeat(4, minmax(60px, 1fr));
  }
}

@media (max-width: 720px) {
  .category-tiles {
    grid-template-columns: repeat(2, minmax(70px, 1fr));
    gap: 0.75rem;
  }
}

.category-slot {
  width: 100%;
  aspect-ratio: 5 / 2;
  border-radius: 18px;
  border: 1px solid rgba(56, 189, 248, 0.14);
  background: rgba(15, 23, 42, 0.6);
  color: rgba(226, 232, 240, 0.85);
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.category-slot--occupied,
.category-slot--add,
.category-slot--active {
  cursor: pointer;
}

.category-slot--add {
  border: 1px dashed rgba(56, 189, 248, 0.35);
  background: rgba(15, 23, 42, 0.45);
  color: rgba(226, 232, 240, 0.8);
  font-size: 1.3rem;
}

.category-slot--occupied {
  border-color: rgba(56, 189, 248, 0.18);
  color: rgba(226, 232, 240, 0.85);
}

.category-slot--active {
  border-color: rgba(34, 211, 238, 0.5);
  color: #bae6fd;
  box-shadow: 0 16px 30px rgba(34, 211, 238, 0.25);
  transform: translateY(-1px);
}

.category-slot--empty {
  border: 1px dashed rgba(56, 189, 248, 0.08);
  color: rgba(226, 232, 240, 0.35);
  cursor: default;
}

.category-slot:not(.category-slot--empty):hover {
  border-color: rgba(56, 189, 248, 0.3);
  transform: translateY(-1px);
}

.category-cards {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 0.75rem;
  background: rgba(4, 10, 22, 0.55);
  border-radius: 18px;
  padding: 1rem;
  border: 1px solid rgba(56, 189, 248, 0.12);
  box-shadow: inset 0 0 20px rgba(7, 16, 33, 0.45);
}

.category-heading {
  font-size: clamp(0.95rem, 1.8vw, 1.2rem);
  letter-spacing: 0.12em;
  color: #f8fafc;
  text-align: center;
  margin: 1.4rem 0 0.4rem 0;
}

.empty-categories {
  margin: 0;
  padding: 0.9rem;
  background: rgba(15, 23, 42, 0.55);
  border-radius: 16px;
  text-align: center;
  color: rgba(226, 232, 240, 0.5);
  font-size: 0.9rem;
}

.questions-table th,
.questions-table td {
  padding: 0.65rem;
  font-size: 0.9rem;
}

.category-index {
  font-size: 1.1rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #f8fafc;
  text-align: center;
}
</style>

