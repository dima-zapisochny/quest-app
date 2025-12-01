<template>
  <Transition name="modal">
    <div v-if="isOpen && question" class="modal-overlay" @click.self="handleClose">
      <div class="modal-content">
        <header class="modal-header">
          <button class="modal-close" @click="handleClose" aria-label="Закрыть">✕</button>
        </header>

        <section v-if="!showAnswer" class="question-pane">
          <div class="question-body" :class="{ 'has-media': hasQuestionImage }">
            <div class="question-header">
            <h2 class="modal-title">{{ question.question }}</h2>
              <div v-if="currentResponder" class="responder-banner">
                Отвечает: <strong>{{ currentResponder.name }}</strong>
              </div>
            </div>
            <div v-if="question.questionMedia?.length" class="media-grid">
              <QuestionMediaPreview
                v-for="media in question.questionMedia"
                :key="media.id"
                :media="media"
              />
            </div>
          </div>
          <aside class="admin-panel">
            <TimerCircle
              :duration-sec="30"
              :auto-start="true"
              ref="timerRef"
              @finished="handleReveal"
            />
            <div v-if="isHostSession" class="host-actions">
              <button 
                class="host-button host-button-success" 
                type="button" 
                :disabled="!canResolve" 
                @click="handleResolve(true)"
              >
                Правильно
              </button>
              <button 
                class="host-button host-button-danger" 
                type="button" 
                :disabled="!canResolve" 
                @click="handleResolve(false)"
              >
                Неправильно
              </button>
            </div>
            <!-- Debug: responderId={{ responderId }}, currentResponder={{ currentResponder?.name }} -->
            <div v-if="currentResponder" class="responder-card">
              <div class="responder-card-avatar">
                <span>{{ avatarEmoji(currentResponder.avatar) }}</span>
              </div>
              <div class="responder-card-info">
                <span class="responder-card-name">{{ currentResponder.name }}</span>
                <span class="responder-card-label">Отвечает</span>
              </div>
            </div>
          </aside>
        </section>

        <Transition name="fade">
          <section v-if="showAnswer" key="answer" class="answer-pane">
            <div class="answer-body">
              <h2 class="modal-title answer">{{ question.answer }}</h2>
              <div v-if="question.answerMedia?.length" class="media-grid">
                <QuestionMediaPreview
                  v-for="media in question.answerMedia"
                  :key="media.id"
                  :media="media"
                />
              </div>
            </div>
          </section>
        </Transition>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'
import TimerCircle from './TimerCircle.vue'
import QuestionMediaPreview from './QuestionMediaPreview.vue'
import { useGameSessionStore } from '@/store/gameSessionStore'
import { useQuizStore } from '@/store/quizStore'
import type { Question, Player } from '@/types'

interface Props {
  isOpen: boolean
  question: Question | null
  sessionId?: string
  questId?: string
  roundId?: string
  categoryId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
  finished: []
}>()

const gameSessionStore = useGameSessionStore()
const quizStore = useQuizStore()

const showAnswer = ref(false)
const timerRef = ref<InstanceType<typeof TimerCircle> | null>(null)

const session = computed(() => (props.sessionId ? gameSessionStore.getSessionById(props.sessionId) : undefined))
const activeQuestion = computed(() => session.value?.activeQuestion)
// Мок: для тестирования считаем, что это хост-сессия, если попап открыт
const isHostSession = computed(() => !!session.value || props.isOpen)

// Мок-данные для тестирования (если нет реальной сессии)
const mockResponder: Player = {
  id: 'mock-responder-1',
  name: 'Алексей',
  avatar: 'fox',
  score: 0,
  joinedAt: Date.now(),
  status: 'buzzed'
}

// Отвечает только первый нажавший
const responderId = computed(() => {
  if (activeQuestion.value?.currentResponderId) {
    return activeQuestion.value.currentResponderId
  }
  // Мок: если нет сессии (sessionId пустой или undefined), всегда возвращаем мок-участника
  if (!props.sessionId || props.sessionId === '') {
    console.log('Мок: responderId возвращает мок-участника', mockResponder.id)
    return mockResponder.id
  }
  console.log('responderId: нет участника', { sessionId: props.sessionId })
  return null
})

const currentResponder = computed(() => {
  if (session.value && responderId.value) {
    return session.value.players.find(player => player.id === responderId.value) ?? null
  }
  // Мок: если нет сессии и есть responderId, возвращаем мок-участника
  if ((!props.sessionId || props.sessionId === '') && responderId.value === mockResponder.id) {
    console.log('Мок: currentResponder возвращает мок-участника', mockResponder)
    return mockResponder
  }
  console.log('currentResponder: нет участника', { sessionId: props.sessionId, responderId: responderId.value, mockId: mockResponder.id })
  return null
})

// Проверка наличия картинки в медиа вопроса
const hasQuestionImage = computed(() => {
  return props.question?.questionMedia?.some(media => media.type === 'image') ?? false
})

// Кнопки доступны только когда есть отвечающий и время установлено
const canResolve = computed(() => {
  // Мок: если нет сессии, кнопки всегда доступны
  if (!props.sessionId) {
    return responderId.value !== null
  }
  return responderId.value !== null && timerRef.value !== null
})

watch(
  () => props.isOpen,
  async (newVal) => {
    if (newVal) {
      resetModal()
      
      // Если есть сессия, открываем вопрос в store для синхронизации с участниками
      if (props.sessionId && props.question && props.roundId && props.categoryId) {
        console.log('📤 Opening question in session:', {
          sessionId: props.sessionId,
          roundId: props.roundId,
          categoryId: props.categoryId,
          questionId: props.question.id
        })
        try {
          await gameSessionStore.openQuestion(props.sessionId, {
            roundId: props.roundId,
            categoryId: props.categoryId,
            questionId: props.question.id
          })
          console.log('✅ Question opened in session')
        } catch (error) {
          console.error('❌ Error opening question in session:', error)
        }
      }
      
      // Мок: если нет сессии, останавливаем таймер через задержку после инициализации
      if (!props.sessionId) {
        setTimeout(() => {
          if (timerRef.value && responderId.value) {
            timerRef.value.pause()
          }
        }, 2000) // Увеличиваем задержку до 2 секунд для надежности
      }
    } else {
      timerRef.value?.stop()
      
      // Если есть сессия, закрываем вопрос в store
      if (props.sessionId) {
        console.log('📤 Closing question in session:', props.sessionId)
        try {
          await gameSessionStore.closeQuestion(props.sessionId)
          console.log('✅ Question closed in session')
        } catch (error) {
          console.error('❌ Error closing question in session:', error)
        }
      }
    }
  }
)

watch(
  () => props.question?.id,
  () => {
    if (props.isOpen) {
      resetModal()
    }
  }
)

watch(
  () => activeQuestion.value?.timerPaused,
  paused => {
    if (!timerRef.value) return
    if (paused) {
      timerRef.value.pause()
    } else {
      timerRef.value.resume()
    }
  }
)

// Приостанавливаем таймер когда кто-то отвечает
// Таймер уже приостанавливается в store через timerPaused, но убедимся что UI синхронизирован
watch(
  () => responderId.value,
  (newResponderId) => {
    if (newResponderId) {
      // Мок: если нет сессии, останавливаем таймер через небольшую задержку (имитация нажатия кнопки)
      if (!props.sessionId) {
        // Используем более надежный способ - проверяем через nextTick
        nextTick(() => {
          setTimeout(() => {
            if (timerRef.value) {
              console.log('Мок: останавливаем таймер')
              timerRef.value.pause()
            }
          }, 1500) // Останавливаем через 1.5 секунды после открытия
        })
      } else if (timerRef.value && activeQuestion.value && !activeQuestion.value.timerPaused) {
        // Кто-то нажал кнопку - приостанавливаем таймер
        timerRef.value.pause()
      }
    }
  },
  { immediate: true }
)

watch(
  () => activeQuestion.value?.showAnswer,
  value => {
    if (value) {
      showAnswer.value = true
    }
  }
)

function resetModal() {
  showAnswer.value = !!activeQuestion.value?.showAnswer
  nextTick(() => {
    timerRef.value?.reset()
    if (activeQuestion.value?.timerPaused) {
      timerRef.value?.pause()
    }
    // Мок: если нет сессии, останавливаем таймер через небольшую задержку (имитация нажатия кнопки)
    if (!props.sessionId && timerRef.value) {
      console.log('Мок: resetModal - планируем остановку таймера')
      setTimeout(() => {
        if (timerRef.value) {
          console.log('Мок: resetModal - останавливаем таймер')
          timerRef.value.pause()
        }
      }, 1500) // Останавливаем через 1.5 секунды после открытия
    }
  })
}

function handleReveal() {
  if (showAnswer.value) return
  showAnswer.value = true
  if (props.sessionId) {
    gameSessionStore.revealAnswer(props.sessionId)
  }
  timerRef.value?.pause()
}

function handleResolve(correct: boolean) {
  if (!props.sessionId) {
    // Для не-сессии кнопки "правильно/неправильно" не используются
    return
  }
  gameSessionStore.resolveQuestion(props.sessionId, correct)
  if (correct) {
    emit('finished')
    emit('close')
  } else {
    // При неправильном ответе возобновляем таймер для нового раунда
    nextTick(() => {
      if (timerRef.value && !activeQuestion.value?.timerPaused) {
        timerRef.value.resume()
      }
    })
  }
}

function handleFinish() {
  // Для режима без сессии: завершаем вопрос после показа ответа
  if (!props.sessionId && showAnswer.value) {
    emit('finished')
    emit('close')
  }
}

function handleClose() {
  if (props.sessionId) {
    gameSessionStore.closeQuestion(props.sessionId)
  }
  
  // Если ответ был показан (таймер закончился), но никто не ответил правильно,
  // помечаем вопрос как сыгранный без информации о том, кто ответил
  if (showAnswer.value && props.question && props.questId && props.roundId && props.categoryId) {
    const question = props.question
    // Проверяем, был ли кто-то отмечен как правильно ответивший и не помечен ли вопрос уже как сыгранный
    if (!question.answeredBy && !question.played) {
      quizStore.markQuestionAsPlayed(
        props.questId,
        props.roundId,
        props.categoryId,
        question.id
      )
    }
  }
  
  emit('close')
}

function avatarEmoji(avatarId: string): string {
  const map: Record<string, string> = {
    fox: '🦊',
    panda: '🐼',
    tiger: '🐯',
    owl: '🦉',
    whale: '🐳',
    parrot: '🦜',
    koala: '🐨',
    dino: '🦕'
  }
  return map[avatarId] ?? '🙂'
}

</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.88);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 2rem;
}

.modal-content {
  width: min(70vw, 1100px);
  height: min(70vh, 720px);
  min-height: 420px;
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.18);
  border-radius: 16px;
  padding: 2rem 2.25rem;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 32px rgba(2, 6, 23, 0.3),
    0 4px 16px rgba(2, 6, 23, 0.2),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1000px) rotateX(1deg);
  transform-origin: center center;
}


.modal-content::after {
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

.modal-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 1;
}

.modal-back,
.modal-close {
  background: rgba(15, 118, 110, 0.18);
  border: 1px solid rgba(34, 211, 238, 0.4);
  color: #e0f2fe;
  border-radius: 9999px;
  padding: 0.4rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-back:hover,
.modal-close:hover {
  border-color: #22d3ee;
  color: #22d3ee;
}

.modal-close {
  font-size: 1.1rem;
  line-height: 1;
}

.question-pane,
.answer-pane {
  flex: 1;
  display: flex;
  gap: 1.5rem;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.question-body,
.answer-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding-right: 0.5rem;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.question-body.has-media {
  justify-content: flex-start;
  align-items: stretch;
  text-align: left;
  overflow: hidden;
  max-height: 100%;
  gap: 0.75rem;
  flex-direction: column;
}

.question-header {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  text-align: center;
  min-height: 0;
}

.question-body.has-media .question-header {
  flex: 0 0 auto;
  order: 1;
  justify-content: flex-start;
  padding-bottom: 0.5rem;
  overflow-y: auto;
  overflow-x: hidden;
}

.question-body.has-media .media-grid {
  flex: 1 1 0;
  order: 2;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow: hidden;
}

.question-body.has-media .media-grid :deep(.media-card) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
  background: transparent;
  border: none;
  box-shadow: none;
}

.question-body.has-media .media-grid :deep(.image-wrapper) {
  flex: 1;
  min-height: 0;
  aspect-ratio: unset;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-body.has-media .media-grid :deep(.image-wrapper img) {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 0.75rem;
}

.question-body.has-media .media-grid :deep(.media-name) {
  display: none;
}

.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin-top: 0;
}

.responder-banner {
  background: rgba(34, 211, 238, 0.12);
  border: 1px solid rgba(34, 211, 238, 0.4);
  border-radius: 0.75rem;
  padding: 0.5rem 0.85rem;
  color: #f8fafc;
  font-size: 0.9rem;
  text-align: center;
}

.admin-panel {
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3.5rem;
  flex-shrink: 0;
  overflow: visible;
}

.admin-panel :deep(.timer-circle-container) {
  transform: scale(1.2);
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 50%;
  padding: 0.85rem;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 16px rgba(2, 6, 23, 0.25),
    0 2px 8px rgba(2, 6, 23, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;
}

.admin-panel :deep(.timer-circle-container)::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(139, 92, 246, 0.1) 0%,
    transparent 50%
  );
  border-radius: 50%;
  pointer-events: none;
}

.admin-panel :deep(.timer-circle) {
  filter: drop-shadow(0 0 3px rgba(139, 92, 246, 0.3));
}

.admin-panel :deep(.timer-progress) {
  color: #a78bfa;
  filter: drop-shadow(0 0 2px rgba(167, 139, 250, 0.4));
  transition: color 0.3s ease, filter 0.3s ease;
}

.admin-panel :deep(.timer-bg) {
  color: rgba(139, 92, 246, 0.15);
}

.admin-panel :deep(.timer-text) {
  font-size: 2.2rem;
  color: #c4b5fd;
  text-shadow: 
    0 0 6px rgba(196, 181, 253, 0.4),
    0 0 12px rgba(139, 92, 246, 0.25);
  font-weight: 700;
  transition: color 0.3s ease, text-shadow 0.3s ease;
}

.admin-panel :deep(.timer-warning .timer-progress) {
  color: #ef4444;
  filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.5));
}

.admin-panel :deep(.timer-warning .timer-text) {
  color: #f87171;
  text-shadow: 
    0 0 8px rgba(239, 68, 68, 0.6),
    0 0 16px rgba(239, 68, 68, 0.4);
}

.admin-panel :deep(.timer-warning .timer-circle-container) {
  border-color: rgba(239, 68, 68, 0.4);
  box-shadow: 
    0 4px 16px rgba(239, 68, 68, 0.2),
    0 2px 8px rgba(239, 68, 68, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.08),
    inset 0 -1px 2px rgba(0, 0, 0, 0.15);
}

.admin-panel :deep(.timer-warning .timer-circle-container)::before {
  background: radial-gradient(
    circle at 30% 30%,
    rgba(239, 68, 68, 0.15) 0%,
    transparent 50%
  );
}

.admin-button {
  width: 100%;
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 0.85rem 1.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  background: rgba(15, 23, 42, 0.6);
  color: #e0e7ff;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 3px 6px rgba(2, 6, 23, 0.2),
    0 2px 3px rgba(2, 6, 23, 0.15),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  transform: perspective(1000px) rotateX(1deg);
  position: relative;
  overflow: hidden;
  z-index: 0;
}

.admin-button > * {
  position: relative;
  z-index: 1;
}

.admin-button::before {
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

.admin-button:hover::before {
  opacity: 1;
}

.admin-button::after {
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
  border-radius: 12px;
  pointer-events: none;
  opacity: 0.5;
}

.reveal-button {
  background: linear-gradient(135deg, rgba(251, 146, 60, 0.7), rgba(251, 191, 36, 0.6));
  border-color: rgba(251, 146, 60, 0.5);
  color: #0f172a;
  font-weight: 700;
}

.reveal-button:hover {
  transform: perspective(1000px) rotateX(1deg) translateY(-2px);
  box-shadow: 
    0 6px 12px rgba(251, 146, 60, 0.3),
    0 3px 6px rgba(251, 146, 60, 0.25),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  border-color: rgba(251, 146, 60, 0.7);
}

.host-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

.host-button {
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 0.65rem 1rem;
  font-weight: 600;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  color: #ffffff;
  font-family: 'Press Start 2P', 'Nunito', cursive;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.host-button-success {
  background: rgba(34, 197, 94, 0.85);
  box-shadow: 
    0 4px 8px rgba(34, 197, 94, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.host-button-success:not(:disabled):hover {
  background: rgba(34, 197, 94, 1);
  box-shadow: 
    0 6px 12px rgba(34, 197, 94, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.host-button-danger {
  background: rgba(239, 68, 68, 0.85);
  box-shadow: 
    0 4px 8px rgba(239, 68, 68, 0.3),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.host-button-danger:not(:disabled):hover {
  background: rgba(239, 68, 68, 1);
  box-shadow: 
    0 6px 12px rgba(239, 68, 68, 0.4),
    inset 0 1px 2px rgba(255, 255, 255, 0.25);
  transform: translateY(-1px);
}

.host-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.responder-card {
  width: 100%;
  background: rgba(15, 23, 42, 0.5);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  padding: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 4px 12px rgba(2, 6, 23, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.08);
}

.responder-card-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.responder-card-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.responder-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.responder-card-label {
  font-size: 0.7rem;
  color: rgba(148, 163, 184, 0.7);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-title {
  font-size: clamp(1.25rem, 2.5vw, 2rem);
  margin: 0;
  line-height: 1.3;
  color: #f8fafc;
  text-align: center;
  text-shadow: 0 0 25px rgba(34, 211, 238, 0.4);
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.modal-title.answer {
  color: #facc15;
  text-shadow: 0 0 25px rgba(250, 204, 21, 0.4);
}

.finish-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

.finish-button {
  background: linear-gradient(135deg, #22c55e, #86efac);
  border: none;
  color: #0f172a;
  font-weight: 700;
  font-size: 0.95rem;
  padding: 0.65rem 1.5rem;
  border-radius: 9999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.finish-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 22px rgba(34, 197, 94, 0.3);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

@media (max-width: 1024px) {
  .modal-content {
    width: min(90vw, 720px);
    height: min(80vh, 640px);
    padding: 1.75rem 2rem;
  }

  .question-pane,
  .answer-pane {
    flex-direction: column;
    align-items: center;
  }

  .admin-panel {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }

  .admin-button {
    flex: 1;
    min-width: 140px;
    max-width: 200px;
  }
}

@media (max-width: 640px) {
  .modal-overlay {
    padding: 1rem;
  }

  .modal-content {
    width: 100%;
    height: 100%;
    border-radius: 1rem;
  }

  .media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .question-body.has-media .media-grid {
    display: flex;
    flex-direction: column;
  }

  .admin-panel {
    flex-direction: column;
  }

  .admin-button {
    width: 100%;
  }
}
</style>

