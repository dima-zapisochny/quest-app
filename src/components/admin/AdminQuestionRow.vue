<template>
  <div class="question-card">
    <div class="question-card-grid">
      <div class="field value-field">
        <label class="field-label" :for="`question-value-${question.id}`">Стоимость</label>
        <input
          :id="`question-value-${question.id}`"
          type="number"
          min="0"
          step="50"
          v-model.number="questionValue"
        />
      </div>
      <div class="field text-field">
        <label class="field-label" :for="`question-text-${question.id}`">Текст вопроса</label>
        <textarea
          :id="`question-text-${question.id}`"
          v-model="questionText"
          rows="3"
          placeholder="Текст вопроса"
        ></textarea>
        <div class="media-section">
          <div v-for="(media, index) in questionMediaList" :key="media.id" class="media-item">
            <div class="media-item-row">
              <span class="media-name">{{ media.name }}</span>
              <button
                type="button"
                class="media-remove"
                @click="removeMedia('question', media.id)"
                title="Удалить медиа"
                aria-label="Удалить медиа вопроса"
              >✕</button>
              <template v-if="media.type === 'image'">
                <label :for="`question-delay-${media.id}`" class="delay-label">Время появления (сек, макс. 29):</label>
                <input
                  :id="`question-delay-${media.id}`"
                  type="number"
                  min="0"
                  max="29"
                  step="1"
                  :value="media.delay ?? (index === 0 ? 0 : '')"
                  @input="updateMediaDelay('question', media.id, clampDelay(Number(($event.target as HTMLInputElement).value) || 0))"
                  class="delay-input"
                  placeholder="0"
                />
              </template>
            </div>
          </div>
          <div class="media-upload-buttons">
            <label 
              v-if="questionMediaImages.length < 3" 
              class="upload-chip" 
              :class="{ 'upload-chip--disabled': uploadingQuestionType !== null || questionMediaAudio.length > 0 }"
            >
              <input
                type="file"
                accept="image/*"
                :disabled="uploadingQuestionType !== null || questionMediaAudio.length > 0"
                @change="handleUpload('question', $event, 'image')"
              />
              <span>{{ uploadingQuestionType === 'image' ? 'Загрузка…' : `Загрузить изображение (${questionMediaImages.length + 1}/3)` }}</span>
            </label>
            <label 
              v-if="!questionMediaAudio.length" 
              class="upload-chip"
              :class="{ 'upload-chip--disabled': uploadingQuestionType !== null || questionMediaImages.length > 0 }"
            >
              <input
                type="file"
                accept="audio/*"
                :disabled="uploadingQuestionType !== null || questionMediaImages.length > 0"
                @change="handleUpload('question', $event, 'audio')"
              />
              <span>{{ uploadingQuestionType === 'audio' ? 'Загрузка…' : 'Загрузить аудио' }}</span>
            </label>
          </div>
        </div>
      </div>
      <div class="field text-field">
        <label class="field-label" :for="`answer-text-${question.id}`">Ответ</label>
        <textarea
          :id="`answer-text-${question.id}`"
          v-model="answerText"
          rows="3"
          placeholder="Текст ответа"
        ></textarea>
        <div class="media-section">
          <div v-for="media in answerMediaList" :key="media.id" class="media-item">
            <div class="media-item-row">
              <span class="media-name">{{ media.name }}</span>
              <button
                type="button"
                class="media-remove"
                @click="removeMedia('answer', media.id)"
                title="Удалить медиа"
                aria-label="Удалить медиа ответа"
              >✕</button>
            </div>
          </div>
          <div class="media-upload-buttons">
            <label
              v-if="answerMediaImages.length < 3"
              class="upload-chip"
              :class="{ 'upload-chip--disabled': uploadingAnswerType !== null }"
            >
              <input
                type="file"
                accept="image/*"
                :disabled="uploadingAnswerType !== null"
                @change="handleUpload('answer', $event, 'image')"
              />
              <span>{{ uploadingAnswerType === 'image' ? 'Загрузка…' : `Изображение (${answerMediaImages.length + 1}/3)` }}</span>
            </label>
            <label
              v-if="!answerMediaAudio.length"
              class="upload-chip"
              :class="{ 'upload-chip--disabled': uploadingAnswerType !== null }"
            >
              <input
                type="file"
                accept="audio/*"
                :disabled="uploadingAnswerType !== null"
                @change="handleUpload('answer', $event, 'audio')"
              />
              <span>{{ uploadingAnswerType === 'audio' ? 'Загрузка…' : 'Музыка / аудио' }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
    <div class="question-card-footer">
      <button
        class="delete-question"
        @click="handleDelete"
        type="button"
        title="Удалить вопрос"
        aria-label="Удалить вопрос"
      >
        Удалить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { useQuizStore } from '@/store/quizStore'
import type { Question } from '@/types'

interface Props {
  questId: string
  roundId: string
  categoryId: string
  question: Question
}

const emit = defineEmits<{
  deleted: []
}>()

const props = defineProps<Props>()
const store = useQuizStore()

/** Тип медиа, який зараз завантажується для питання (null = нічого не завантажується) */
const uploadingQuestionType = ref<'image' | 'audio' | null>(null)
/** Тип медиа, який зараз завантажується для відповіді */
const uploadingAnswerType = ref<'image' | 'audio' | null>(null)

const questionValue = computed({
  get: () => props.question.value,
  set: value => {
    store.updateQuestion(props.questId, props.roundId, props.categoryId, props.question.id, {
      value: Number(value)
    })
  }
})

const questionText = computed({
  get: () => props.question.question,
  set: value => {
    store.updateQuestion(props.questId, props.roundId, props.categoryId, props.question.id, {
      question: value
    })
  }
})

const answerText = computed({
  get: () => props.question.answer,
  set: value => {
    store.updateQuestion(props.questId, props.roundId, props.categoryId, props.question.id, {
      answer: value
    })
  }
})

const questionMediaList = computed(() => {
  return props.question.questionMedia ?? []
})
const questionMediaImages = computed(() => {
  return questionMediaList.value.filter(m => m.type === 'image')
})
const questionMediaAudio = computed(() => {
  return questionMediaList.value.filter(m => m.type === 'audio')
})
const answerMediaList = computed(() => props.question.answerMedia ?? [])
const answerMediaImages = computed(() => answerMediaList.value.filter(m => m.type === 'image'))
const answerMediaAudio = computed(() => answerMediaList.value.filter(m => m.type === 'audio'))

function handleDelete() {
  if (confirm('Удалить вопрос?')) {
    store.deleteQuestion(props.questId, props.roundId, props.categoryId, props.question.id)
    emit('deleted')
  }
}

function handleUpload(target: 'question' | 'answer', event: Event, mediaType?: 'image' | 'audio') {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  const file = files.item(0)
  if (!file) return

  // Для вопросов: проверяем лимиты и конфликты типов медиа
  if (target === 'question') {
    // Если пытаемся загрузить изображение, но уже есть аудио
    if (mediaType === 'image' && questionMediaAudio.value.length > 0) {
      input.value = ''
      alert('Для вопроса можно загрузить либо изображения, либо аудио, но не оба типа одновременно')
      return
    }
    // Если пытаемся загрузить аудио, но уже есть изображения
    if (mediaType === 'audio' && questionMediaImages.value.length > 0) {
      input.value = ''
      alert('Для вопроса можно загрузить либо изображения, либо аудио, но не оба типа одновременно')
      return
    }
    
    if (mediaType === 'image' && questionMediaImages.value.length >= 3) {
      input.value = ''
      alert('Можно добавить максимум 3 изображения')
      return
    }
    if (mediaType === 'audio' && questionMediaAudio.value.length >= 1) {
      input.value = ''
      alert('Можно добавить только одно аудио')
      return
    }
  }
  
  // Для ответов: до 3 изображений и 1 аудио
  if (target === 'answer') {
    if (mediaType === 'image' && answerMediaImages.value.length >= 3) {
      input.value = ''
      alert('Можно добавить максимум 3 изображения в ответ')
      return
    }
    if (mediaType === 'audio' && answerMediaAudio.value.length >= 1) {
      input.value = ''
      alert('Можно добавить только одно аудио в ответ')
      return
    }
  }

  const type = mediaType ?? (file.type.startsWith('audio') ? 'audio' : 'image')
  if (target === 'question') {
    uploadingQuestionType.value = type
  } else {
    uploadingAnswerType.value = type
  }

  const singleFileList = {
    0: file,
    length: 1,
    item: () => file
  } as unknown as FileList

  const promise = store.appendQuestionMedia(
    props.questId,
    props.roundId,
    props.categoryId,
    props.question.id,
    singleFileList,
    target
  )

  const clearLoading = () => {
    if (target === 'question') {
      uploadingQuestionType.value = null
    } else {
      uploadingAnswerType.value = null
    }
  }

  Promise.resolve(promise).catch(error => {
    console.error('Upload media error', error)
    alert('Не удалось загрузить медиа. Попробуйте другой файл.')
  }).finally(clearLoading)

  input.value = ''
}

const QUESTION_TIMER_SEC = 30
const MAX_DELAY_SEC = QUESTION_TIMER_SEC - 1

function clampDelay(value: number): number {
  return Math.min(MAX_DELAY_SEC, Math.max(0, value))
}

function updateMediaDelay(target: 'question' | 'answer', mediaId: string, delay: number) {
  const quest = store.quests.find(q => q.id === props.questId)
  if (!quest) return
  
  const round = quest.rounds.find(r => r.id === props.roundId)
  if (!round) return
  
  const category = round.categories.find(c => c.id === props.categoryId)
  if (!category) return
  
  const question = category.questions.find(q => q.id === props.question.id)
  if (!question) return
  
  const key = target === 'question' ? 'questionMedia' : 'answerMedia'
  const mediaList = question[key] ?? []
  const mediaIndex = mediaList.findIndex(m => m.id === mediaId)
  
  const clampedDelay = target === 'question' ? clampDelay(delay) : delay
  if (mediaIndex !== -1) {
    mediaList[mediaIndex] = { ...mediaList[mediaIndex], delay: clampedDelay }
    question[key] = mediaList
    store.updateQuestion(props.questId, props.roundId, props.categoryId, props.question.id, {
      [key]: mediaList
    })
  }
}

function removeMedia(target: 'question' | 'answer', mediaId: string) {
  store.removeQuestionMedia(props.questId, props.roundId, props.categoryId, props.question.id, mediaId, target)
}
</script>

<style scoped>
.question-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.question-card-grid {
  display: grid;
  grid-template-columns: minmax(110px, 140px) repeat(2, minmax(0, 1fr));
  gap: 1rem;
  width: 100%;
  box-sizing: border-box;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
  box-sizing: border-box;
}

.field-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(148, 163, 184, 0.7);
}

.value-field input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.6rem;
  border: 1px solid rgba(59, 130, 246, 0.22);
  border-radius: 12px;
  font-size: 0.85rem;
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  -moz-appearance: textfield;
}

.value-field input::-webkit-inner-spin-button,
.value-field input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 14px;
  padding: 0.55rem 0.7rem;
  font-size: 0.9rem;
  line-height: 1.45;
  resize: vertical;
  min-height: 96px;
  background: rgba(15, 23, 42, 0.5);
  color: #f8fafc;
}

textarea:focus,
.value-field input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.22);
}

.text-field {
  width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.media-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.media-upload-buttons {
  display: flex;
  flex-direction: row;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.media-section .upload-chip {
  width: fit-content;
  align-self: flex-start;
}

.media-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(15, 23, 42, 0.3);
  border: 1px solid rgba(59, 130, 246, 0.15);
  border-radius: 10px;
}

.media-item-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.media-item-row .media-name {
  flex: 0 1 auto;
  min-width: 0;
}

.media-item-row .media-remove {
  flex-shrink: 0;
}

.media-item-row .delay-label {
  margin-left: auto;
}

.media-item-row .delay-input {
  flex-shrink: 0;
}

.delay-label {
  font-size: 0.7rem;
  color: rgba(148, 163, 184, 0.8);
  white-space: nowrap;
}

.delay-input {
  width: 80px;
  padding: 0.3rem 0.5rem;
  border: 1px solid rgba(59, 130, 246, 0.22);
  border-radius: 8px;
  font-size: 0.8rem;
  background: rgba(15, 23, 42, 0.55);
  color: #f8fafc;
  -moz-appearance: textfield;
  box-sizing: border-box;
}

.delay-input::-webkit-inner-spin-button,
.delay-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.delay-input:focus {
  outline: none;
  border-color: rgba(56, 189, 248, 0.6);
  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.22);
}

.media-name {
  font-size: 0.75rem;
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(59, 130, 246, 0.18);
  padding: 0.35rem 0.6rem;
  border-radius: 10px;
  color: rgba(226, 232, 240, 0.85);
  display: inline-flex;
  align-items: center;
  gap: 0.7rem;
  max-width: 260px;
}

.media-remove {
  border: none;
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.45rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: background 0.2s ease;
}

.media-remove:hover {
  background: rgba(239, 68, 68, 0.25);
}

.upload-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(148, 163, 184, 0.4);
  border-radius: 12px;
  padding: 0.4rem 0.75rem;
  cursor: pointer;
  color: #bae6fd;
  font-weight: 600;
  font-size: 0.8rem;
  min-width: 130px;
  position: relative;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.45);
}

.upload-chip input[type='file'] {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-chip--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.upload-chip--disabled input[type='file'] {
  cursor: not-allowed;
}

.question-card-footer {
  display: flex;
  justify-content: flex-start;
}

.delete-question {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1.55rem;
  border-radius: 14px;
  border: 1px solid rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.delete-question:hover {
  transform: translateY(-1px);
  background: rgba(239, 68, 68, 0.2);
  box-shadow: 0 12px 22px rgba(239, 68, 68, 0.22);
}

@media (max-width: 1024px) {
  .question-card-grid {
    grid-template-columns: 1fr;
  }

  .value-field {
    max-width: 160px;
  }
}

@media (max-width: 480px) {
  .accordion-body,
  .question-card-grid {
    gap: 0.5rem;
  }

  .upload-chip {
    font-size: 0.72rem;
    padding: 0.35rem 0.6rem;
    min-width: 110px;
    border-radius: 10px;
  }

  .media-name {
    font-size: 0.68rem;
    max-width: 200px;
  }

  .delete-question {
    font-size: 0.78rem;
    padding: 0.4rem 1.2rem;
    border-radius: 12px;
  }

  .delay-input {
    width: 65px;
    font-size: 0.72rem;
    padding: 0.25rem 0.4rem;
  }

  .delay-label {
    font-size: 0.62rem;
  }
}

@media (max-width: 360px) {
  .upload-chip {
    font-size: 0.68rem;
    min-width: 100px;
  }

  .media-name {
    font-size: 0.65rem;
    max-width: 160px;
  }

  .delete-question {
    font-size: 0.72rem;
    padding: 0.35rem 1rem;
  }
}
</style>

