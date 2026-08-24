<template>
  <section class="board-editor">
    <!-- Пустой раунд: выбираешь размер в сетке — доска создаётся сразу -->
    <div v-if="categories.length === 0" class="board-empty">
      <GridSizePicker
        v-model:categories="presetCategories"
        v-model:questions="presetQuestions"
        :max-categories="6"
        :max-questions="6"
        @select="onGridSelect"
      />
      <span v-if="isBuildingBoard" class="mini-loader" :aria-label="t('editor.buildingBoard')"></span>
    </div>

    <!-- Игровая доска раунда: категории-колонки + плитки-вопросы -->
    <div v-else class="board-scroll">
      <div class="board-columns">
        <div
          v-for="(category, ci) in categories"
          :key="category.id"
          class="board-col"
        >
          <div class="board-col__head">
            <input
              :value="category.title"
              class="board-col__title"
              :placeholder="t('editor.category', { n: ci + 1 })"
              :aria-label="t('editor.categoryNameAria')"
              @input="onCategoryTitle(category.id, $event)"
            />
            <button
              type="button"
              class="board-col__del"
              :title="t('editor.deleteCategory')"
              :aria-label="t('editor.deleteCategory')"
              @click="removeCategory(category.id)"
            >✕</button>
          </div>

          <div class="board-col__tiles">
            <button
              v-for="question in category.questions"
              :key="question.id"
              type="button"
              :class="['board-tile', { 'board-tile--filled': isFilled(question) }]"
              :title="isFilled(question) ? t('editor.questionFilled') : t('editor.questionEmpty')"
              @click="openQuestion(category.id, question.id)"
            >
              <span class="board-tile__value">{{ question.value }}</span>
            </button>

            <button
              v-if="category.questions.length < 6"
              type="button"
              class="board-tile board-tile--add"
              :disabled="addingCategoryId === category.id || isBusy"
              :aria-label="t('editor.addQuestion')"
              @click="addQuestion(category.id)"
            >+</button>
          </div>
        </div>

        <button
          v-if="categories.length < 6"
          type="button"
          class="board-col board-col--add"
          :disabled="isBusy"
          :title="t('editor.addCategory')"
          :aria-label="t('editor.addCategory')"
          @click="addCategory"
        >
          <span class="board-col-add__head">
            <span class="board-col-add__plus">+</span>
          </span>
          <span class="board-col-add__tiles" aria-hidden="true">
            <span v-for="n in 3" :key="n" class="board-col-add__tile"></span>
          </span>
        </button>
      </div>
    </div>

    <!-- Редактирование вопроса поверх доски -->
    <teleport to="body">
      <transition name="q-modal">
        <div v-if="editingQuestion" class="q-modal-overlay" @click.self="closeModal">
          <div class="q-modal" role="dialog" aria-modal="true">
            <header class="q-modal__head">
              <span class="q-modal__title">
                {{ editingCategoryTitle }} · {{ t('editor.points', { value: editingQuestion.value }) }}
              </span>
              <button
                type="button"
                class="q-modal__close"
                :aria-label="t('common.close')"
                @click="closeModal"
              >✕</button>
            </header>
            <div class="q-modal__body">
              <AdminQuestionRow
                ref="questionRowRef"
                :key="editingQuestion.id"
                :quest-id="questId"
                :round-id="round.id"
                :category-id="editingCategoryId!"
                :question="editingQuestion"
                @deleted="closeModal"
                @add-next="handleAddNext"
              />
            </div>
            <footer class="q-modal__foot">
              <button type="button" class="q-modal__delete" @click="pendingDeleteQuestion = true">
                {{ t('common.delete') }}
              </button>
              <button type="button" class="q-modal__done" @click="closeModal">{{ t('editor.save') }}</button>
            </footer>
          </div>
        </div>
      </transition>
    </teleport>

    <ConfirmDialog
      :show="pendingDeleteCategoryId !== null"
      :title="t('editor.deleteCategoryTitle')"
      :message="t('editor.deleteCategoryBody')"
      :confirm-label="t('common.delete')"
      confirm-variant="danger"
      @confirm="confirmDeleteCategory"
      @cancel="cancelDeleteCategory"
    />

    <ConfirmDialog
      :show="pendingDeleteQuestion"
      :title="t('editor.confirmDeleteQuestion')"
      :message="t('editor.deleteQuestionBody')"
      :confirm-label="t('common.delete')"
      confirm-variant="danger"
      @confirm="confirmDeleteQuestion"
      @cancel="pendingDeleteQuestion = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuizStore } from '@/store/quizStore'
import { defaultCategoryTitle, displayCategoryTitle } from '@/utils/boardLabels'
import AdminQuestionRow from './AdminQuestionRow.vue'
import GridSizePicker from '@/components/common/GridSizePicker.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { Round, Question } from '@/types'
import { notifyDeleted } from '@/utils/notifyDeleted'

interface Props {
  questId: string
  round: Round
}

const props = defineProps<Props>()

const { t } = useI18n()
const store = useQuizStore()

const categories = computed(() => props.round.categories ?? [])

/** Вопрос считаем заполненным, если есть текст вопроса. */
function isFilled(question: Question): boolean {
  return !!question.question && question.question.trim().length > 0
}

// --- Редактирование категории (заголовок) ---
function onCategoryTitle(categoryId: string, event: Event) {
  const value = (event.target as HTMLInputElement).value
  store.updateCategory(props.questId, props.round.id, categoryId, { title: value })
}

// Удаление категории — через единую модалку подтверждения (нативный confirm
// ненадёжен в некоторых браузерах и мог не срабатывать).
const pendingDeleteCategoryId = ref<string | null>(null)

function removeCategory(categoryId: string) {
  pendingDeleteCategoryId.value = categoryId
}

function confirmDeleteCategory() {
  const categoryId = pendingDeleteCategoryId.value
  pendingDeleteCategoryId.value = null
  if (!categoryId) return
  store.deleteCategory(props.questId, props.round.id, categoryId)
  if (editingCategoryId.value === categoryId) closeModal()
  notifyDeleted()
}

function cancelDeleteCategory() {
  pendingDeleteCategoryId.value = null
}

// --- Добавление категорий / вопросов ---
const isAddingCategory = ref(false)
const addingCategoryId = ref<string | null>(null)
const isBuildingBoard = ref(false)
const isBusy = computed(() => isAddingCategory.value || isBuildingBoard.value)

async function addCategory() {
  if (isAddingCategory.value || categories.value.length >= 6) return
  isAddingCategory.value = true
  try {
    await store.addCategory(props.questId, props.round.id, defaultCategoryTitle(categories.value.length))
  } finally {
    isAddingCategory.value = false
  }
}

async function addQuestion(categoryId: string) {
  const category = categories.value.find(c => c.id === categoryId)
  if (!category || category.questions.length >= 6 || addingCategoryId.value) return
  addingCategoryId.value = categoryId
  try {
    const value = 100 * (category.questions.length + 1)
    const newId = await store.addQuestion(props.questId, props.round.id, categoryId, value, '', '')
    // Сразу открываем новую плитку для заполнения
    if (newId) openQuestion(categoryId, newId)
  } finally {
    addingCategoryId.value = null
  }
}

// --- Быстрая доска (для пустого раунда): клик по сетке сразу создаёт доску ---
const presetCategories = ref(1)
const presetQuestions = ref(1)

function onGridSelect(cats: number, questions: number) {
  createPresetBoard(cats, questions)
}

async function createPresetBoard(cats: number, questions: number) {
  if (isBuildingBoard.value || categories.value.length > 0) return
  isBuildingBoard.value = true
  try {
    await store.buildBoard(props.questId, props.round.id, cats, questions)
  } finally {
    isBuildingBoard.value = false
  }
}

// --- Модалка редактирования вопроса ---
const editingCategoryId = ref<string | null>(null)
const editingQuestionId = ref<string | null>(null)
const questionRowRef = ref<InstanceType<typeof AdminQuestionRow> | null>(null)
const pendingDeleteQuestion = ref(false)

function confirmDeleteQuestion() {
  pendingDeleteQuestion.value = false
  questionRowRef.value?.handleDelete()
  notifyDeleted()
}

const editingCategory = computed(() => {
  if (!editingCategoryId.value) return null
  return categories.value.find(c => c.id === editingCategoryId.value) ?? null
})

const editingCategoryTitle = computed(() => {
  const cat = editingCategory.value
  if (!cat) return ''
  const idx = categories.value.findIndex(c => c.id === cat.id)
  return displayCategoryTitle(cat.title, Math.max(0, idx), t)
})

const editingQuestion = computed(() => {
  if (!editingCategory.value || !editingQuestionId.value) return null
  return editingCategory.value.questions.find(q => q.id === editingQuestionId.value) ?? null
})

function openQuestion(categoryId: string, questionId: string) {
  editingCategoryId.value = categoryId
  editingQuestionId.value = questionId
  focusQuestionText(questionId)
}

function closeModal() {
  editingCategoryId.value = null
  editingQuestionId.value = null
}

async function handleAddNext() {
  const categoryId = editingCategoryId.value
  if (!categoryId) return
  const category = categories.value.find(c => c.id === categoryId)
  if (!category || category.questions.length >= 6) return
  const value = 100 * (category.questions.length + 1)
  const newId = await store.addQuestion(props.questId, props.round.id, categoryId, value, '', '')
  if (newId) {
    editingQuestionId.value = newId
    focusQuestionText(newId)
  }
}

async function focusQuestionText(questionId: string) {
  await nextTick()
  const el = document.getElementById(`question-text-${questionId}`)
  if (el instanceof HTMLTextAreaElement) el.focus()
}

// При смене раунда закрываем модалку
watch(() => props.round.id, closeModal)
</script>

<style scoped>
.board-editor {
  display: flex;
  flex-direction: column;
  /* Отступ от плиток до кнопки «Удалить раунд» = паддинг всего блока */
  gap: clamp(1rem, 3vw, 1.8rem);
}

/* --- Пустой раунд: только сетка выбора размера --- */
.board-empty {
  margin: 0;
  padding: 2.6rem 1.1rem;
  background: rgb(var(--c-bg) / 0.4);
  border: 1px dashed rgb(var(--c-accent-sky) / 0.22);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

/* --- Доска --- */
.board-scroll {
  overflow-x: auto;
}
.board-columns {
  display: flex;
  gap: 1.1rem;
  align-items: flex-start;
}

/* Колонки тянутся и поровну заполняют всю ширину блока */
.board-col {
  position: relative;
  flex: 1 1 0;
  min-width: 96px;
  display: flex;
  flex-direction: column;
  gap: 0.95rem;
}

.board-col__head {
  position: relative;
  display: flex;
  align-items: center;
}
.board-col__title {
  width: 100%;
  box-sizing: border-box;
  min-height: 2.5rem;
  /* справа место под крестик */
  padding: 0.55rem 2rem 0.55rem 0.9rem;
  border: 1px solid rgb(var(--c-blue) / 0.28);
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 700;
  text-align: center;
  text-overflow: ellipsis;
  background: linear-gradient(135deg, rgb(var(--c-accent-sky) / 0.18), rgb(var(--c-blue) / 0.14));
  color: rgb(var(--c-text));
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.board-col__title::placeholder {
  color: rgb(var(--c-text-soft) / 0.5);
  font-weight: 500;
}
.board-col__title:focus {
  outline: none;
  border-color: rgb(var(--c-accent-sky) / 0.6);
  box-shadow: 0 0 0 3px rgb(var(--c-accent-sky) / 0.22);
}
/* Крестик внутри плитки категории справа: приглушён, краснеет при наведении */
.board-col__del {
  position: absolute;
  right: 0.45rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2;
  width: 1.4rem;
  height: 1.4rem;
  padding: 0;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: rgb(var(--c-text-soft) / 0.45);
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease;
}
.board-col__del:hover {
  color: rgb(var(--c-danger-soft));
  background: rgb(var(--c-danger) / 0.15);
}

.board-col__tiles {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.board-tile {
  position: relative;
  width: 100%;
  min-height: 58px;
  border-radius: 12px;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.28);
  background: rgb(var(--c-bg) / 0.4);
  color: rgb(var(--c-text-soft) / 0.5);
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
}
.board-tile:hover {
  transform: translateY(-2px);
  border-color: rgb(var(--c-accent-sky) / 0.55);
  color: rgb(var(--c-text-soft) / 0.8);
  box-shadow: 0 12px 24px rgb(var(--c-sky-deep) / 0.3);
}
.board-tile--filled {
  border-style: solid;
  border-color: rgb(var(--c-indigo) / 0.55);
  background: linear-gradient(135deg, rgb(var(--c-blue) / 0.35) 0%, rgb(var(--c-indigo-500) / 0.28) 50%, rgb(var(--c-violet) / 0.3) 100%);
  color: rgb(var(--c-indigo-100));
}
.board-tile--filled:hover {
  color: rgb(var(--c-indigo-100));
}
.board-tile__value {
  line-height: 1;
}
.board-tile--add {
  border-style: dashed;
  border-color: rgb(var(--c-accent-sky) / 0.35);
  background: rgb(var(--c-bg) / 0.4);
  color: rgb(var(--c-accent-soft));
  font-size: 1.5rem;
  font-weight: 400;
  min-height: 58px;
}
.board-tile--add:hover {
  background: rgb(var(--c-accent-sky) / 0.12);
}
.board-tile--add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Колонка-призрак «добавить категорию»: имитирует категорию, пунктир, «+» по центру */
.board-col--add {
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: rgb(var(--c-accent-soft) / 0.85);
  transition: color 0.2s ease;
}
.board-col--add:hover:not(:disabled) {
  color: rgb(var(--c-accent-soft));
}
.board-col--add:hover:not(:disabled) .board-col-add__head {
  border-color: rgb(var(--c-accent-sky) / 0.6);
  background: rgb(var(--c-accent-sky) / 0.12);
}
.board-col--add:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.board-col-add__head {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 2.5rem;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.4);
  border-radius: 12px;
  background: rgb(var(--c-bg) / 0.3);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.board-col-add__plus {
  font-size: 1.5rem;
  line-height: 1;
}
.board-col-add__tiles {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.board-col-add__tile {
  min-height: 58px;
  box-sizing: border-box;
  border-radius: 12px;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.18);
  background: rgb(var(--c-bg) / 0.2);
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
  to { transform: rotate(360deg); }
}

/* --- Модалка редактирования вопроса --- */
.q-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgb(var(--c-bg-deep) / 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(1rem, 4vh, 2.5rem) 1rem;
  overflow-y: auto;
}
.q-modal {
  width: min(980px, 100%);
  margin: auto;
  background: linear-gradient(140deg, rgb(var(--c-bg) / 0.98), rgba(8, 22, 43, 0.98));
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  border-radius: 24px;
  box-shadow: 0 40px 90px rgb(var(--c-bg-deep) / 0.7);
  display: flex;
  flex-direction: column;
  min-height: min(560px, 82vh);
  max-height: min(92vh, 100%);
}
.q-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.6rem;
  border-bottom: 1px solid rgb(var(--c-accent-sky) / 0.15);
}
.q-modal__title {
  font-size: 1.2rem;
  font-weight: 700;
  color: rgb(var(--c-text));
  letter-spacing: 0.02em;
}
.q-modal__close {
  flex-shrink: 0;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 12px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg) / 0.5);
  color: rgb(var(--c-text-soft));
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.2s ease, color 0.2s ease;
}
.q-modal__close:hover {
  background: rgb(var(--c-danger) / 0.16);
  color: rgb(var(--c-danger-soft));
}
.q-modal__body {
  padding: 1.6rem;
  overflow-y: auto;
  flex: 1;
}
.q-modal__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.6rem;
  border-top: 1px solid rgb(var(--c-accent-sky) / 0.15);
}
.q-modal__delete {
  padding: 0.65rem 1.8rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-danger) / 0.4);
  background: rgb(var(--c-danger) / 0.1);
  color: rgb(var(--c-danger-soft));
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.q-modal__delete:hover {
  background: rgb(var(--c-danger) / 0.2);
  border-color: rgb(var(--c-danger) / 0.65);
}
/* Спокойная кнопка «Готово» — без яркой подсветки */
.q-modal__done {
  min-width: 140px;
  padding: 0.65rem 1.8rem;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-accent) / 0.5);
  background: rgb(var(--c-accent) / 0.18);
  color: rgb(var(--c-accent-soft));
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.q-modal__done:hover {
  background: rgb(var(--c-accent) / 0.3);
  border-color: rgb(var(--c-accent) / 0.7);
}

.q-modal-enter-active,
.q-modal-leave-active {
  transition: opacity 0.22s ease;
}
.q-modal-enter-active .q-modal,
.q-modal-leave-active .q-modal {
  transition: transform 0.22s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.22s ease;
}
.q-modal-enter-from,
.q-modal-leave-to {
  opacity: 0;
}
.q-modal-enter-from .q-modal,
.q-modal-leave-to .q-modal {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

@media (max-width: 480px) {
  .board-col {
    flex-basis: clamp(140px, 60vw, 180px);
  }
  .q-modal__body {
    padding: 1rem;
  }
}
</style>
