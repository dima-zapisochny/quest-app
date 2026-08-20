<template>
  <section class="board-editor">
    <!-- Пустой раунд: быстрая доска или первая категория -->
    <div v-if="categories.length === 0" class="board-empty">
      <p>В раунде пока нет категорий. Создайте доску сразу или добавьте первую категорию.</p>
      <div class="quick-board">
        <NumberStepper v-model="presetCategories" :min="1" :max="5" label="Категории" block />
        <span class="quick-board__x" aria-hidden="true">×</span>
        <NumberStepper v-model="presetQuestions" :min="1" :max="5" label="Вопросы" block />
        <button
          type="button"
          class="quick-board__btn"
          :disabled="isBuildingBoard"
          @click="createPresetBoard"
        >
          <span v-if="!isBuildingBoard">Создать доску {{ presetCategories * presetQuestions }} плиток</span>
          <span v-else class="mini-loader"></span>
        </button>
      </div>
      <button type="button" class="board-add-first" :disabled="isBusy" @click="addCategory">
        + Добавить категорию
      </button>
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
              :placeholder="`Категория ${ci + 1}`"
              aria-label="Название категории"
              @input="onCategoryTitle(category.id, $event)"
            />
            <button
              type="button"
              class="board-col__del"
              title="Удалить категорию"
              aria-label="Удалить категорию"
              @click="removeCategory(category.id)"
            >✕</button>
          </div>

          <div class="board-col__tiles">
            <button
              v-for="question in category.questions"
              :key="question.id"
              type="button"
              :class="['board-tile', { 'board-tile--filled': isFilled(question) }]"
              :title="isFilled(question) ? 'Вопрос заполнен' : 'Вопрос ещё не заполнен'"
              @click="openQuestion(category.id, question.id)"
            >
              <span class="board-tile__value">{{ question.value }}</span>
            </button>

            <button
              v-if="category.questions.length < 5"
              type="button"
              class="board-tile board-tile--add"
              :disabled="addingCategoryId === category.id || isBusy"
              aria-label="Добавить вопрос"
              @click="addQuestion(category.id)"
            >+</button>
          </div>
        </div>

        <button
          v-if="categories.length < 5"
          type="button"
          class="board-col board-col--add"
          :disabled="isBusy"
          title="Добавить категорию"
          aria-label="Добавить категорию"
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

    <footer class="board-footer">
      <button type="button" class="board-delete-round" @click="$emit('deleteRound')">
        Удалить раунд
      </button>
    </footer>

    <!-- Редактирование вопроса поверх доски -->
    <teleport to="body">
      <transition name="q-modal">
        <div v-if="editingQuestion" class="q-modal-overlay" @click.self="closeModal">
          <div class="q-modal" role="dialog" aria-modal="true">
            <header class="q-modal__head">
              <span class="q-modal__title">
                {{ editingCategoryTitle }} · {{ editingQuestion.value }} баллов
              </span>
              <button
                type="button"
                class="q-modal__close"
                aria-label="Закрыть"
                @click="closeModal"
              >✕</button>
            </header>
            <div class="q-modal__body">
              <AdminQuestionRow
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
              <button type="button" class="q-modal__done" @click="closeModal">Готово</button>
            </footer>
          </div>
        </div>
      </transition>
    </teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { useQuizStore } from '@/store/quizStore'
import AdminQuestionRow from './AdminQuestionRow.vue'
import NumberStepper from '@/components/common/NumberStepper.vue'
import type { Round, Question } from '@/types'

interface Props {
  questId: string
  round: Round
}

const props = defineProps<Props>()

defineEmits<{
  deleteRound: []
}>()

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

function removeCategory(categoryId: string) {
  if (!confirm('Удалить категорию вместе со всеми вопросами?')) return
  store.deleteCategory(props.questId, props.round.id, categoryId)
  if (editingCategoryId.value === categoryId) closeModal()
}

// --- Добавление категорий / вопросов ---
const isAddingCategory = ref(false)
const addingCategoryId = ref<string | null>(null)
const isBuildingBoard = ref(false)
const isBusy = computed(() => isAddingCategory.value || isBuildingBoard.value)

async function addCategory() {
  if (isAddingCategory.value || categories.value.length >= 5) return
  isAddingCategory.value = true
  try {
    await store.addCategory(props.questId, props.round.id, '')
  } finally {
    isAddingCategory.value = false
  }
}

async function addQuestion(categoryId: string) {
  const category = categories.value.find(c => c.id === categoryId)
  if (!category || category.questions.length >= 5 || addingCategoryId.value) return
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

// --- Быстрая доска (для пустого раунда) ---
const presetCategories = ref(5)
const presetQuestions = ref(5)

async function createPresetBoard() {
  if (isBuildingBoard.value || categories.value.length > 0) return
  isBuildingBoard.value = true
  try {
    await store.buildBoard(props.questId, props.round.id, presetCategories.value, presetQuestions.value)
  } finally {
    isBuildingBoard.value = false
  }
}

// --- Модалка редактирования вопроса ---
const editingCategoryId = ref<string | null>(null)
const editingQuestionId = ref<string | null>(null)

const editingCategory = computed(() => {
  if (!editingCategoryId.value) return null
  return categories.value.find(c => c.id === editingCategoryId.value) ?? null
})

const editingCategoryTitle = computed(() => {
  const cat = editingCategory.value
  if (!cat) return ''
  const idx = categories.value.findIndex(c => c.id === cat.id)
  return cat.title?.trim() || `Категория ${idx + 1}`
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
  if (!category || category.questions.length >= 5) return
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

/* --- Пустой раунд --- */
.board-empty {
  margin: 0;
  padding: 1.5rem 1.1rem;
  background: rgb(var(--c-bg) / 0.55);
  border: 1px dashed rgb(var(--c-accent-sky) / 0.25);
  border-radius: 18px;
  text-align: center;
  color: rgb(var(--c-text-soft) / 0.7);
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}
.board-empty p {
  margin: 0;
}

.quick-board {
  display: flex;
  align-items: flex-end;
  gap: 0.9rem;
  flex-wrap: wrap;
  justify-content: center;
}
.quick-board__x {
  font-size: 1.2rem;
  font-weight: 600;
  color: rgb(var(--c-text-soft) / 0.6);
  padding-bottom: 0.5rem;
}
.quick-board__btn,
.board-add-first {
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
.quick-board__btn:hover:not(:disabled),
.board-add-first:hover:not(:disabled) {
  background: rgb(var(--c-accent) / 0.3);
  transform: translateY(-1px);
}
.quick-board__btn:disabled,
.board-add-first:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.board-add-first {
  background: rgb(var(--c-bg) / 0.6);
  border-style: dashed;
  border-color: rgb(var(--c-accent-sky) / 0.4);
}

/* --- Доска --- */
.board-scroll {
  overflow-x: auto;
  padding-bottom: 0.5rem;
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
  gap: 0.6rem;
}

.board-col__head {
  position: relative;
  display: flex;
  align-items: center;
}
.board-col__title {
  width: 100%;
  box-sizing: border-box;
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
  min-height: 44px;
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
  gap: 0.6rem;
  margin-top: 0.6rem;
}
.board-col-add__tile {
  min-height: 58px;
  border-radius: 12px;
  border: 1px dashed rgb(var(--c-accent-sky) / 0.18);
  background: rgb(var(--c-bg) / 0.2);
}

/* --- Футер --- */
.board-footer {
  display: flex;
  justify-content: center;
  margin-top: 0;
}
.board-delete-round {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 240px;
  padding: 0.6rem 1.4rem;
  line-height: 1.2;
  border-radius: var(--radius-pill);
  border: 1px solid rgb(var(--c-danger) / 0.45);
  background: rgb(var(--c-danger) / 0.12);
  color: rgb(var(--c-danger-soft));
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}
.board-delete-round:hover {
  transform: translateY(-1px);
  background: rgb(var(--c-danger) / 0.2);
  box-shadow: 0 12px 26px rgb(var(--c-danger) / 0.22);
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
  background: rgb(var(--c-bg-deep) / 0.72);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: clamp(1rem, 4vh, 3rem) 1rem;
  overflow-y: auto;
}
.q-modal {
  width: min(720px, 100%);
  background: linear-gradient(140deg, rgb(var(--c-bg) / 0.96), rgba(8, 22, 43, 0.97));
  border: 1px solid rgb(var(--c-accent-sky) / 0.28);
  border-radius: 22px;
  box-shadow: 0 30px 70px rgb(var(--c-bg-deep) / 0.6);
  display: flex;
  flex-direction: column;
  max-height: 100%;
}
.q-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid rgb(var(--c-accent-sky) / 0.15);
}
.q-modal__title {
  font-size: 1rem;
  font-weight: 700;
  color: rgb(var(--c-text));
  letter-spacing: 0.02em;
}
.q-modal__close {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 10px;
  border: 1px solid rgb(var(--c-accent-sky) / 0.25);
  background: rgb(var(--c-bg) / 0.5);
  color: rgb(var(--c-text-soft));
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.2s ease;
}
.q-modal__close:hover {
  background: rgb(var(--c-bg) / 0.8);
}
.q-modal__body {
  padding: 1.25rem;
  overflow-y: auto;
}
.q-modal__foot {
  display: flex;
  justify-content: flex-end;
  padding: 0.9rem 1.25rem;
  border-top: 1px solid rgb(var(--c-accent-sky) / 0.15);
}
.q-modal__done {
  padding: 0.6rem 1.6rem;
  border-radius: var(--radius-pill);
  border: none;
  background: linear-gradient(135deg, rgb(var(--c-accent)), rgb(var(--c-accent-sky)));
  color: rgb(var(--c-bg));
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.q-modal__done:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 24px rgb(var(--c-accent) / 0.3);
}

.q-modal-enter-active,
.q-modal-leave-active {
  transition: opacity 0.2s ease;
}
.q-modal-enter-from,
.q-modal-leave-to {
  opacity: 0;
}

@media (max-width: 480px) {
  .board-col {
    flex-basis: clamp(140px, 60vw, 180px);
  }
  .q-modal__body {
    padding: 0.85rem;
  }
}
</style>
