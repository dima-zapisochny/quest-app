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
        <div class="media-row">
          <span v-if="questionMediaList.length" class="media-name">
            {{ questionMediaList[0].name }}
            <button
              type="button"
              class="media-remove"
              @click="removeMedia('question', questionMediaList[0].id)"
              title="Удалить медиа"
              aria-label="Удалить медиа вопроса"
            >✕</button>
          </span>
          <label v-if="!questionMediaList.length" class="upload-chip">
            <input
              type="file"
              accept="image/*,audio/*"
              :disabled="isUploadingQuestionMedia"
              @change="handleUpload('question', $event)"
            />
            <span>{{ isUploadingQuestionMedia ? 'Загрузка…' : 'Загрузить медиа' }}</span>
          </label>
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
        <div class="media-row">
          <span v-if="answerMediaList.length" class="media-name">
            {{ answerMediaList[0].name }}
            <button
              type="button"
              class="media-remove"
              @click="removeMedia('answer', answerMediaList[0].id)"
              title="Удалить медиа"
              aria-label="Удалить медиа ответа"
            >✕</button>
          </span>
          <label v-if="!answerMediaList.length" class="upload-chip">
            <input
              type="file"
              accept="image/*,audio/*"
              :disabled="isUploadingAnswerMedia"
              @change="handleUpload('answer', $event)"
            />
            <span>{{ isUploadingAnswerMedia ? 'Загрузка…' : 'Загрузить медиа' }}</span>
          </label>
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
import { computed, ref } from 'vue'
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

const isUploadingQuestionMedia = ref(false)
const isUploadingAnswerMedia = ref(false)

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

const questionMediaList = computed(() => props.question.questionMedia ?? [])
const answerMediaList = computed(() => props.question.answerMedia ?? [])

function handleDelete() {
  if (confirm('Удалить вопрос?')) {
    store.deleteQuestion(props.questId, props.roundId, props.categoryId, props.question.id)
    emit('deleted')
  }
}

function handleUpload(target: 'question' | 'answer', event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  const file = files.item(0)
  if (!file) return

  const mediaList = target === 'question' ? questionMediaList.value : answerMediaList.value
  if (mediaList.length) {
    input.value = ''
    return
  }

  if (target === 'question') {
    isUploadingQuestionMedia.value = true
  } else {
    isUploadingAnswerMedia.value = true
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

  if (!promise) {
    if (target === 'question') {
      isUploadingQuestionMedia.value = false
    } else {
      isUploadingAnswerMedia.value = false
    }
  }

  if (promise) {
    promise.catch(error => {
      console.error('Upload media error', error)
      alert('Не удалось загрузить медиа. Попробуйте другой файл.')
    }).finally(() => {
      if (target === 'question') {
        isUploadingQuestionMedia.value = false
      } else {
        isUploadingAnswerMedia.value = false
      }
    })
  }

  input.value = ''
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

.media-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
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
</style>

