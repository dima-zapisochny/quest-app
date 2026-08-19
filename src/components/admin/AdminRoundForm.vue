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
            :class="['category-slot', { 'category-slot--active': editingCategoryIndex === index - 1 }]"
            type="button"
            @click="handleCategorySlotClick(index)"
          >
            <span>{{ index }}</span>
          </button>
          <button
            v-else-if="index === categoriesCount + 1 && categoriesCount < 8"
            class="category-slot category-slot--add"
            type="button"
            :disabled="isAddingCategory"
            aria-label="Добавить категорию"
            @click="handleAddCategory"
          >
            <span v-if="!isAddingCategory">+</span>
            <span v-else class="mini-loader"></span>
          </button>
          <button
            v-else
            class="category-slot category-slot--empty"
            type="button"
            disabled
            aria-hidden="true"
          >
            <span>{{ index }}</span>
          </button>
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
        <div v-else class="empty-categories">
          <p>Категории пока не созданы. Добавьте первую или создайте доску сразу.</p>
          <div class="quick-board">
            <span class="quick-board__label">Быстрая доска</span>
            <select v-model.number="presetCategories" class="quick-board__select" aria-label="Категорий">
              <option v-for="n in 8" :key="n" :value="n">{{ n }}</option>
            </select>
            <span class="quick-board__x">категорий ×</span>
            <select v-model.number="presetQuestions" class="quick-board__select" aria-label="Вопросов в категории">
              <option v-for="n in 10" :key="n" :value="n">{{ n }}</option>
            </select>
            <span class="quick-board__x">вопросов</span>
            <button
              type="button"
              class="quick-board__btn"
              :disabled="isBuildingBoard"
              @click="createPresetBoard"
            >
              <span v-if="!isBuildingBoard">Создать доску</span>
              <span v-else class="mini-loader"></span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
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
const isAddingCategory = ref(false)
const newlyAddedCategoryId = ref<string | null>(null)

const editingCategory = computed(() => {
  if (!editingCategoryId.value) return null
  return props.round.categories.find(category => category.id === editingCategoryId.value) ?? null
})

const editingCategoryIndex = computed(() => {
  if (!editingCategoryId.value) return -1
  return props.round.categories.findIndex(category => category.id === editingCategoryId.value)
})

// Используем watchEffect для мгновенной реакции на изменения
watchEffect(() => {
  const categories = props.round.categories
  
  // Если мы только что создали категорию, устанавливаем ее как активную
  if (newlyAddedCategoryId.value && categories.some(category => category.id === newlyAddedCategoryId.value)) {
    editingCategoryId.value = newlyAddedCategoryId.value
    newlyAddedCategoryId.value = null
    return
  }
  
  // Игнорируем watch, если мы только что создали категорию
  if (isAddingCategory.value) return
  
  if (!categories.length) {
    editingCategoryId.value = null
    return
  }
  // Не перезаписываем, если категория уже выбрана и существует
  if (editingCategoryId.value && categories.some(category => category.id === editingCategoryId.value)) {
    return
  }
  // Устанавливаем первую категорию только если ничего не выбрано
  if (!editingCategoryId.value) {
    editingCategoryId.value = categories[0].id
  }
})

async function handleAddCategory() {
  isAddingCategory.value = true
  try {
    const newCategoryId = await store.addCategory(props.questId, props.round.id, 'Новая категория')
    // Сохраняем ID новой категории для watchEffect
    newlyAddedCategoryId.value = newCategoryId
    // Устанавливаем сразу после получения ID (элемент уже в массиве после push)
    editingCategoryId.value = newCategoryId
    // Сбрасываем флаг сразу
    isAddingCategory.value = false
  } catch (error) {
    isAddingCategory.value = false
    newlyAddedCategoryId.value = null
    throw error
  }
}

// Быстрая доска: заполняет пустой раунд сеткой N категорий × M вопросов с
// авто-баллами (100, 200, …). Тексты пустые — остаётся только вписать.
const presetCategories = ref(5)
const presetQuestions = ref(5)
const isBuildingBoard = ref(false)

async function createPresetBoard() {
  if (isBuildingBoard.value || categoriesCount.value > 0) return
  isBuildingBoard.value = true
  try {
    let firstCatId: string | null = null
    for (let c = 0; c < presetCategories.value; c++) {
      const catId = await store.addCategory(props.questId, props.round.id, '')
      if (!catId) continue
      if (!firstCatId) firstCatId = catId
      for (let q = 1; q <= presetQuestions.value; q++) {
        await store.addQuestion(props.questId, props.round.id, catId, q * 100, '', '')
      }
    }
    if (firstCatId) editingCategoryId.value = firstCatId
  } finally {
    isBuildingBoard.value = false
  }
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
  color: rgb(var(--c-text-soft));
}

.round-section {
  position: relative;
  overflow: hidden;
  border-radius: 24px;
}

.round-section--meta {
  background: linear-gradient(130deg, rgb(var(--c-bg) / 0.78), rgba(18, 30, 52, 0.92));
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  padding: 1.45rem 1.6rem 1.35rem;
  box-shadow: 0 22px 48px rgb(var(--c-sky-deep) / 0.38);
}

.round-section--meta::before {
  content: '';
  position: absolute;
  inset: -40% 35% auto;
  height: 160px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(var(--c-accent-sky) / 0.35), transparent 60%);
  opacity: 0.45;
  pointer-events: none;
}

.round-section--categories {
  background: linear-gradient(140deg, rgba(8, 22, 43, 0.82), rgba(7, 14, 28, 0.94));
  border: 1px solid rgb(var(--c-blue) / 0.22);
  padding: 1.45rem 1.6rem 1.25rem;
  box-shadow: 0 26px 56px rgba(7, 16, 33, 0.36);
}

.round-section--categories::before {
  content: '';
  position: absolute;
  inset: -50% 10% auto;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(var(--c-blue) / 0.28), transparent 65%);
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
  background: rgb(var(--c-teal) / 0.28);
  border: 1px solid rgb(var(--c-accent) / 0.45);
  color: #f0fdf4;
  letter-spacing: 0.08em;
  font-size: 0.7rem;
  text-transform: uppercase;
  box-shadow: inset 0 0 12px rgb(var(--c-accent) / 0.2);
}

.round-meta {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.field-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--c-text-muted) / 0.65);
  padding-left: 0.2rem;
  display: block;
}

.round-title-input {
  padding: 0.55rem 0.75rem;
  border: 1px solid rgb(var(--c-blue) / 0.28);
  border-radius: 14px;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgb(var(--c-bg) / 0.55);
  color: rgb(var(--c-text));
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  width: 100%;
  box-sizing: border-box;
}

.round-title-input:focus {
  outline: none;
  border-color: rgb(var(--c-accent-sky) / 0.6);
  box-shadow: 0 0 0 3px rgb(var(--c-accent-sky) / 0.25);
}

.delete-round-text {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  margin-top: 0.6rem;
  padding: 0.5rem 1.55rem;
  border-radius: 14px;
  border: 1px solid rgb(var(--c-danger) / 0.45);
  background: rgb(var(--c-danger) / 0.12);
  color: rgb(var(--c-danger-soft));
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.delete-round-text:hover {
  transform: translateY(-1px);
  background: rgb(var(--c-danger) / 0.2);
  box-shadow: 0 12px 26px rgb(var(--c-danger) / 0.22);
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
  align-items: center;
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
  background: rgb(var(--c-bg) / 0.6);
  border: 1px solid rgb(var(--c-accent-sky) / 0.14);
  color: rgb(var(--c-text-soft) / 0.85);
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.category-slot--add {
  border: 1px dashed rgb(var(--c-accent-sky) / 0.35);
  background: rgb(var(--c-bg) / 0.45);
  color: rgb(var(--c-accent-soft));
  font-size: 1.4rem;
}

.category-slot--add:hover {
  border-color: rgb(var(--c-accent-sky) / 0.55);
  box-shadow: 0 14px 28px rgb(var(--c-accent-sky) / 0.22);
}

.category-slot--active {
  border-color: rgb(var(--c-accent) / 0.5);
  color: rgb(var(--c-accent-soft));
  box-shadow: 0 16px 32px rgb(var(--c-accent) / 0.22);
  transform: translateY(-2px);
}

.category-slot--empty {
  border: 1px dashed rgb(var(--c-accent-sky) / 0.1);
  color: rgb(var(--c-text-soft) / 0.2);
  cursor: default;
  pointer-events: none;
}

.category-slot--empty span {
  opacity: 0.35;
}

.mini-loader {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgb(var(--c-accent-soft) / 0.3);
  border-top-color: rgb(var(--c-accent-soft));
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.category-slot--add:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.category-slot:not(.category-slot--empty):hover {
  border-color: rgb(var(--c-accent-sky) / 0.3);
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
  border: 1px solid rgb(var(--c-accent-sky) / 0.12);
  box-shadow: inset 0 0 20px rgba(7, 16, 33, 0.45);
}

.category-heading {
  font-size: clamp(0.95rem, 1.8vw, 1.2rem);
  letter-spacing: 0.12em;
  color: rgb(var(--c-text));
  text-align: center;
  margin: 1.4rem 0 0.4rem 0;
}

.empty-categories {
  margin: 0;
  padding: 0.9rem;
  background: rgb(var(--c-bg) / 0.55);
  border-radius: 16px;
  text-align: center;
  color: rgb(var(--c-text-soft) / 0.5);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.85rem;
}
.empty-categories p {
  margin: 0;
}

.quick-board {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}
.quick-board__label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--c-accent-soft));
}
.quick-board__x {
  font-size: 0.8rem;
  color: rgb(var(--c-text-soft) / 0.7);
}
.quick-board__select {
  background: rgb(var(--c-bg) / 0.6);
  border: 1px solid rgb(var(--c-accent-sky) / 0.3);
  border-radius: 8px;
  color: rgb(var(--c-text));
  padding: 0.3rem 0.4rem;
  font-size: 0.85rem;
  cursor: pointer;
}
.quick-board__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  background: rgb(var(--c-accent) / 0.2);
  border: 1px solid rgb(var(--c-accent) / 0.5);
  color: rgb(var(--c-accent-soft));
  border-radius: var(--radius-pill);
  padding: 0.4rem 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}
.quick-board__btn:hover:not(:disabled) {
  background: rgb(var(--c-accent) / 0.3);
  transform: translateY(-1px);
}
.quick-board__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  color: rgb(var(--c-text));
  text-align: center;
}

@media (max-width: 768px) {
  .round-section--meta,
  .round-section--categories {
    padding: 1.1rem 1.2rem;
    border-radius: 18px;
  }

  .round-title-input {
    font-size: 0.88rem;
    padding: 0.5rem 0.7rem;
  }

  .category-cards {
    padding: 0.75rem;
    border-radius: 14px;
  }

  .category-slot {
    font-size: 0.9rem;
    border-radius: 14px;
  }
}

@media (max-width: 480px) {
  .round-section--meta,
  .round-section--categories {
    padding: 0.85rem 0.9rem;
    border-radius: 14px;
  }

  .round-section-chip {
    font-size: 0.62rem;
    padding: 0.3rem 0.7rem;
  }

  .round-title-input {
    font-size: 0.82rem;
    padding: 0.45rem 0.6rem;
    border-radius: 12px;
  }

  .delete-round-text {
    font-size: 0.78rem;
    padding: 0.4rem 1.15rem;
    border-radius: 12px;
  }

  .category-cards {
    padding: 0.6rem;
    border-radius: 12px;
  }

  .category-slot {
    font-size: 0.82rem;
    border-radius: 12px;
  }

  .category-heading {
    font-size: clamp(0.85rem, 1.8vw, 1rem);
    margin: 0.8rem 0 0.3rem;
  }

  .empty-categories {
    font-size: 0.82rem;
    padding: 0.7rem;
  }
}

@media (max-width: 360px) {
  .round-section--meta,
  .round-section--categories {
    padding: 0.7rem;
    border-radius: 12px;
  }

  .round-title-input {
    font-size: 0.78rem;
    padding: 0.4rem 0.55rem;
  }

  .category-cards {
    padding: 0.5rem;
  }

  .category-slot {
    font-size: 0.75rem;
    border-radius: 10px;
  }
}
</style>

